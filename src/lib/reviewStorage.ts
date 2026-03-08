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
    })
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
      .insert(outcomes);
    if (outcomesError) {
      console.error("Failed to save review outcomes:", outcomesError);
    }
  }

  return session.id;
}

export async function fetchCustomRules(repo: string): Promise<string[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  // Get personal rules + org rules
  const { data } = await supabase
    .from("custom_rules")
    .select("rule_text")
    .eq("enabled", true)
    .or(`repo.eq.${repo},repo.eq.*`)
    .or(`user_id.eq.${user.id},org_id.not.is.null`);

  return (data || []).map((r: any) => r.rule_text);
}
