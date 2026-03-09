import { supabase } from "@/integrations/supabase/client";
import { AIConcern } from "@/types/review";

async function getUserOrgId(userId: string): Promise<string | null> {
  const { data } = await supabase
    .from("org_members")
    .select("org_id")
    .eq("user_id", userId)
    .limit(1)
    .maybeSingle();
  return data?.org_id || null;
}

/** Generate a simple hash for pattern matching */
function patternHash(title: string, severity: string): string {
  const normalized = title.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 60);
  return `${severity}:${normalized}`;
}

export async function saveReviewSession(params: {
  repo: string;
  prNumber: number;
  prTitle?: string;
  summary: string;
  riskLevel: string;
  concerns: AIConcern[];
  commentsPosted: number;
}): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const orgId = await getUserOrgId(user.id);

  const approved = params.concerns.filter((c) => c.status === "approved").length;
  const dismissed = params.concerns.filter((c) => c.status === "dismissed").length;
  const edited = params.concerns.filter((c) => c.status === "edited").length;

  // Insert session
  const { data: session, error: sessionError } = await supabase
    .from("review_sessions")
    .insert({
      user_id: user.id,
      org_id: orgId,
      repo: params.repo,
      pr_number: params.prNumber,
      pr_title: params.prTitle || null,
      summary: params.summary,
      risk_level: params.riskLevel,
      concerns_total: params.concerns.length,
      concerns_approved: approved,
      concerns_dismissed: dismissed,
      concerns_edited: edited,
      comments_posted: params.commentsPosted,
    } as any)
    .select("id")
    .single();

  if (sessionError || !session) {
    console.error("Failed to save review session:", sessionError);
    return null;
  }

  // Insert individual outcomes
  const outcomes = params.concerns
    .filter((c) => c.status !== "pending")
    .map((c) => ({
      user_id: user.id,
      org_id: orgId,
      session_id: session.id,
      repo: params.repo,
      concern_severity: c.severity,
      concern_title: c.title,
      concern_file: c.file,
      action: c.status === "edited" ? "edited" : c.status,
    }));

  if (outcomes.length > 0) {
    const { error: outcomesError } = await supabase
      .from("review_outcomes")
      .insert(outcomes as any);
    if (outcomesError) {
      console.error("Failed to save review outcomes:", outcomesError);
    }
  }

  // --- LEARNING LOOP: Update concern patterns ---
  await updateConcernPatterns(user.id, orgId, params.repo, params.concerns);

  // --- KNOWLEDGE CAPTURE: Save comment edits ---
  await saveCommentEdits(user.id, orgId, params.repo, session.id, params.concerns);

  return session.id;
}

/** Learning Loop: track approval/dismiss/edit rates per concern pattern */
async function updateConcernPatterns(
  userId: string,
  orgId: string | null,
  repo: string,
  concerns: AIConcern[]
) {
  for (const concern of concerns) {
    if (concern.status === "pending") continue;

    const hash = patternHash(concern.title, concern.severity);

    // Try upsert — increment the relevant counter
    const incrementField =
      concern.status === "approved" ? "times_approved" :
      concern.status === "dismissed" ? "times_dismissed" :
      "times_edited";

    // Check if pattern exists
    const { data: existing } = await supabase
      .from("concern_patterns")
      .select("id, times_approved, times_dismissed, times_edited")
      .eq("user_id", userId)
      .eq("pattern_hash", hash)
      .maybeSingle();

    if (existing) {
      const update: Record<string, any> = { last_seen_at: new Date().toISOString() };
      update[incrementField] = (existing as any)[incrementField] + 1;
      await supabase
        .from("concern_patterns")
        .update(update as any)
        .eq("id", existing.id);
    } else {
      const insert: Record<string, any> = {
        user_id: userId,
        org_id: orgId,
        repo,
        pattern_hash: hash,
        concern_title: concern.title,
        concern_severity: concern.severity,
        times_approved: concern.status === "approved" ? 1 : 0,
        times_dismissed: concern.status === "dismissed" ? 1 : 0,
        times_edited: concern.status === "edited" ? 1 : 0,
      };
      await supabase.from("concern_patterns").insert(insert as any);
    }
  }
}

/** Knowledge Capture: save before/after when a dev edits an AI comment */
async function saveCommentEdits(
  userId: string,
  orgId: string | null,
  repo: string,
  sessionId: string,
  concerns: AIConcern[]
) {
  const edits = concerns
    .filter((c) => c.status === "edited" && c.originalDraftComment && c.draftComment !== c.originalDraftComment)
    .map((c) => ({
      user_id: userId,
      org_id: orgId,
      repo,
      session_id: sessionId,
      concern_severity: c.severity,
      concern_title: c.title,
      original_comment: c.originalDraftComment!,
      edited_comment: c.draftComment,
      concern_file: c.file,
    }));

  if (edits.length > 0) {
    const { error } = await supabase.from("comment_edits").insert(edits as any);
    if (error) console.error("Failed to save comment edits:", error);
  }
}

export async function fetchCustomRules(repo: string): Promise<string[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("custom_rules")
    .select("rule_text")
    .eq("enabled", true)
    .or(`repo.eq.${repo},repo.eq.*`)
    .or(`user_id.eq.${user.id},org_id.not.is.null`);

  return (data || []).map((r: any) => r.rule_text);
}
