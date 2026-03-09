import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function getServiceClient() {
  return createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );
}

async function fetchRepoContext(owner: string, repo: string, ghHeaders: Record<string, string>, files: any[]) {
  const [repoRes, treeRes] = await Promise.all([
    fetch(`https://api.github.com/repos/${owner}/${repo}`, { headers: ghHeaders }),
    fetch(`https://api.github.com/repos/${owner}/${repo}/git/trees/HEAD?recursive=1`, { headers: ghHeaders }),
  ]);

  let repoContext = "";
  if (repoRes.ok) {
    const repoData = await repoRes.json();
    repoContext += `Primary language: ${repoData.language || "unknown"}. `;
  }

  if (treeRes.ok) {
    const treeData = await treeRes.json();
    const tree = treeData.tree || [];

    const patternFiles = tree
      .filter((f: any) => f.type === "blob")
      .map((f: any) => f.path)
      .filter((p: string) =>
        p.match(/\.(eslintrc|prettierrc|editorconfig|tsconfig|biome)\b/i) ||
        p.match(/^\.?(eslint|prettier|biome)\.(json|js|cjs|mjs|yaml|yml|toml)$/i) ||
        p === "tsconfig.json" || p === ".editorconfig" || p === "deno.json" || p === "deno.jsonc"
      );

    if (patternFiles.length > 0) {
      const configContents = await Promise.all(
        patternFiles.slice(0, 3).map(async (path: string) => {
          try {
            const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${path}`, { headers: ghHeaders });
            if (!res.ok) return null;
            const data = await res.json();
            if (data.content && data.encoding === "base64") {
              return `--- ${path} ---\n${atob(data.content).slice(0, 1500)}`;
            }
            return null;
          } catch { return null; }
        })
      );
      const valid = configContents.filter(Boolean);
      if (valid.length > 0) repoContext += `\n\nRepo coding standards:\n${valid.join("\n\n")}`;
    }

    const changedExtensions = new Set(files.map((f: any) => {
      const ext = f.filename?.split(".").pop();
      return ext ? `.${ext}` : "";
    }).filter(Boolean));

    const similarFiles = tree
      .filter((f: any) => f.type === "blob" && changedExtensions.has(`.${f.path.split(".").pop()}`))
      .filter((f: any) => !files.some((changed: any) => changed.filename === f.path))
      .slice(0, 2);

    if (similarFiles.length > 0) {
      const sampleContents = await Promise.all(
        similarFiles.map(async (f: any) => {
          try {
            const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${f.path}`, { headers: ghHeaders });
            if (!res.ok) return null;
            const data = await res.json();
            if (data.content && data.encoding === "base64") {
              return `--- ${f.path} (existing) ---\n${atob(data.content).slice(0, 2000)}`;
            }
            return null;
          } catch { return null; }
        })
      );
      const valid = sampleContents.filter(Boolean);
      if (valid.length > 0) repoContext += `\n\nExisting code patterns:\n${valid.join("\n\n")}`;
    }
  }

  return repoContext;
}

async function fetchCustomRules(userId: string | null, orgId: string | null, repo: string): Promise<string[]> {
  if (!userId) return [];
  try {
    const supabase = getServiceClient();
    
    // Fetch both prompt rules and structured rules
    let query = supabase
      .from("custom_rules")
      .select("rule_text, rule_type, conditions, severity")
      .eq("enabled", true)
      .or(`repo.eq.${repo},repo.eq.*`);
    
    if (orgId) {
      query = query.or(`user_id.eq.${userId},org_id.eq.${orgId}`);
    } else {
      query = query.eq("user_id", userId);
    }
    
    const { data } = await query;
    if (!data) return [];

    return data.map((r: any) => {
      if (r.rule_type === "structured" && r.conditions) {
        // Convert structured rules to natural language for the AI
        return formatStructuredRule(r.conditions, r.severity);
      }
      return r.rule_text;
    });
  } catch {
    return [];
  }
}

function formatStructuredRule(conditions: any[], severity: string): string {
  const parts = conditions.map((c: any) => {
    switch (c.type) {
      case "max_function_length":
        return `Flag any function longer than ${c.value} lines as ${severity}`;
      case "require_pattern":
        return `Flag files that don't contain "${c.value}" when they match pattern "${c.filePattern}" as ${severity}`;
      case "forbid_pattern":
        return `Flag any usage of "${c.value}" as ${severity}. ${c.reason || ""}`;
      case "require_error_handling":
        return `Flag ${c.value} functions/calls without error handling as ${severity}`;
      case "max_file_length":
        return `Flag any file longer than ${c.value} lines as ${severity}`;
      case "naming_convention":
        return `Enforce ${c.value} naming convention for ${c.target} as ${severity}`;
      default:
        return `Check: ${JSON.stringify(c)}`;
    }
  });
  return parts.join(". ");
}

/** Learning Loop: fetch patterns the team frequently dismisses or approves */
async function fetchTeamPatterns(userId: string | null, orgId: string | null, repo: string) {
  if (!userId) return { dismissed: [] as string[], highValue: [] as string[], editExamples: [] as string[] };
  
  try {
    const supabase = getServiceClient();
    
    // Fetch concern patterns for this user/org
    let query = supabase
      .from("concern_patterns")
      .select("concern_title, concern_severity, times_approved, times_dismissed, times_edited")
      .or(`repo.eq.${repo},repo.eq.*`)
      .order("last_seen_at", { ascending: false })
      .limit(100);

    if (orgId) {
      query = query.or(`user_id.eq.${userId},org_id.eq.${orgId}`);
    } else {
      query = query.eq("user_id", userId);
    }
    
    const { data: patterns } = await query;
    
    const dismissed: string[] = [];
    const highValue: string[] = [];
    
    (patterns || []).forEach((p: any) => {
      const total = p.times_approved + p.times_dismissed + p.times_edited;
      if (total < 2) return;
      
      const dismissRate = p.times_dismissed / total;
      const approveRate = (p.times_approved + p.times_edited) / total;
      
      if (dismissRate >= 0.7) {
        dismissed.push(`"${p.concern_title}" (${p.concern_severity}) — dismissed ${Math.round(dismissRate * 100)}% of the time`);
      } else if (approveRate >= 0.8) {
        highValue.push(`"${p.concern_title}" (${p.concern_severity}) — approved ${Math.round(approveRate * 100)}% of the time`);
      }
    });

    // Fetch recent comment edits for knowledge capture
    let editQuery = supabase
      .from("comment_edits")
      .select("concern_title, original_comment, edited_comment, concern_severity")
      .or(`repo.eq.${repo},repo.eq.*`)
      .order("created_at", { ascending: false })
      .limit(20);
    
    if (orgId) {
      editQuery = editQuery.or(`user_id.eq.${userId},org_id.eq.${orgId}`);
    } else {
      editQuery = editQuery.eq("user_id", userId);
    }
    
    const { data: edits } = await editQuery;
    
    const editExamples = (edits || []).map((e: any) =>
      `For "${e.concern_title}" (${e.concern_severity}): AI wrote "${e.original_comment}" → Dev changed to "${e.edited_comment}"`
    ).slice(0, 10);

    return { dismissed, highValue, editExamples };
  } catch {
    return { dismissed: [], highValue: [], editExamples: [] };
  }
}

async function getUserOrgId(userId: string): Promise<string | null> {
  try {
    const supabase = getServiceClient();
    const { data } = await supabase
      .from("org_members")
      .select("org_id")
      .eq("user_id", userId)
      .limit(1)
      .maybeSingle();
    return data?.org_id || null;
  } catch { return null; }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { github_token, owner, repo, pr_number } = await req.json();

    if (!github_token || !owner || !repo || !pr_number) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Extract user ID from auth header if present
    let userId: string | null = null;
    const authHeader = req.headers.get("Authorization");
    if (authHeader) {
      try {
        const supabase = createClient(
          Deno.env.get("SUPABASE_URL") ?? "",
          Deno.env.get("SUPABASE_ANON_KEY") ?? "",
        );
        const { data } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));
        userId = data?.user?.id || null;
      } catch { /* ignore */ }
    }

    // Get user's org
    const orgId = userId ? await getUserOrgId(userId) : null;

    const ghHeaders = { Authorization: `Bearer ${github_token}`, Accept: "application/vnd.github+json" };

    // Fetch PR info and files in parallel
    const [filesRes, prRes] = await Promise.all([
      fetch(`https://api.github.com/repos/${owner}/${repo}/pulls/${pr_number}/files?per_page=30`, { headers: ghHeaders }),
      fetch(`https://api.github.com/repos/${owner}/${repo}/pulls/${pr_number}`, { headers: ghHeaders }),
    ]);

    if (!filesRes.ok) throw new Error(`Failed to fetch PR files: ${filesRes.status}`);
    const files = await filesRes.json();

    let prTitle = "";
    if (prRes.ok) {
      const prData = await prRes.json();
      prTitle = prData.title || "";
    }

    // Fetch repo context, custom rules, AND team patterns in parallel
    const fullRepo = `${owner}/${repo}`;
    const [repoContext, customRules, teamPatterns] = await Promise.all([
      fetchRepoContext(owner, repo, ghHeaders, files),
      fetchCustomRules(userId, orgId, fullRepo),
      fetchTeamPatterns(userId, orgId, fullRepo),
    ]);

    // Build custom rules section for prompt
    let customRulesSection = "";
    if (customRules.length > 0) {
      customRulesSection = `\n\nCUSTOM RULES (MUST enforce these - the reviewer has explicitly requested them):\n${customRules.map((r, i) => `${i + 1}. ${r}`).join("\n")}`;
    }

    // Build learning loop sections
    let learningSection = "";
    if (teamPatterns.dismissed.length > 0) {
      learningSection += `\n\nFREQUENTLY DISMISSED (de-prioritize or skip these unless truly critical — the team consistently finds them unhelpful):\n${teamPatterns.dismissed.map((t) => `- ${t}`).join("\n")}`;
    }
    if (teamPatterns.highValue.length > 0) {
      learningSection += `\n\nHIGH-VALUE PATTERNS (prioritize these — the team consistently acts on them):\n${teamPatterns.highValue.map((t) => `- ${t}`).join("\n")}`;
    }
    
    // Build knowledge capture section
    let knowledgeSection = "";
    if (teamPatterns.editExamples.length > 0) {
      knowledgeSection += `\n\nTEAM WRITING STYLE (learn from how senior devs edited AI comments — match their tone and specificity):\n${teamPatterns.editExamples.map((e) => `- ${e}`).join("\n")}`;
    }

    const diffSummary = files.map((f: any) => ({
      filename: f.filename, status: f.status,
      additions: f.additions, deletions: f.deletions,
      patch: (f.patch || "").slice(0, 3000),
    }));

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: `You are a senior staff engineer reviewing a pull request. You have access to the repo's coding standards, the team's historical preferences, and examples of how they prefer comments to be written.
${customRulesSection}
${learningSection}
${knowledgeSection}

IMPORTANT: Compare the PR changes against the repo's established patterns. Flag deviations from:
- Naming conventions used in existing files
- Error handling patterns established in the codebase
- Import/export patterns
- Type safety patterns (if TypeScript)
- Architecture patterns (file organization, abstraction layers)

For each concern, provide:
- severity: "critical" | "warning" | "suggestion" | "note"
- title: Short description (max 10 words)
- explanation: Why this matters, referencing the repo's patterns when relevant (2-3 sentences)
- file: The filename
- lineStart: Approximate line number
- codeSnippet: The relevant code (max 5 lines)
- draftComment: A review comment the reviewer could post (1-2 sentences, professional tone). If team writing style examples are provided, match that tone and level of detail.

Focus on:
1. Security issues (auth, injection, token handling, input validation)
2. Deviations from established repo coding standards/patterns
3. Missing error handling (especially if the repo has a pattern for it)
4. Race conditions or concurrency issues
5. Architectural concerns (coupling, wrong abstraction layer)
6. Missing edge cases
7. Inconsistent naming or patterns compared to existing code

Be specific and actionable. Reference the repo's existing patterns when flagging inconsistencies.
Skip concerns the team has historically dismissed unless they are genuinely critical.`,
          },
          {
            role: "user",
            content: `Repo context:\n${repoContext}\n\nPR diff:\n${JSON.stringify(diffSummary, null, 2)}`,
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "report_concerns",
              description: "Report the concerns found in the PR",
              parameters: {
                type: "object",
                properties: {
                  concerns: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        severity: { type: "string", enum: ["critical", "warning", "suggestion", "note"] },
                        title: { type: "string" },
                        explanation: { type: "string" },
                        file: { type: "string" },
                        lineStart: { type: "number" },
                        codeSnippet: { type: "string" },
                        draftComment: { type: "string" },
                      },
                      required: ["severity", "title", "explanation", "file", "lineStart", "codeSnippet", "draftComment"],
                      additionalProperties: false,
                    },
                  },
                  summary: { type: "string", description: "2-3 sentence summary of what this PR does and its risk level" },
                  riskLevel: { type: "string", enum: ["low", "medium", "high"] },
                },
                required: ["concerns", "summary", "riskLevel"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "report_concerns" } },
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "AI rate limit exceeded, please try again in a moment" }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Add credits in workspace settings." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errText = await aiResponse.text();
      throw new Error(`AI analysis failed: ${aiResponse.status} ${errText}`);
    }

    const aiData = await aiResponse.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    let analysis = { concerns: [], summary: "Could not analyze this PR.", riskLevel: "medium" };

    if (toolCall?.function?.arguments) {
      try { analysis = JSON.parse(toolCall.function.arguments); } catch { console.error("Failed to parse AI response"); }
    }

    const concerns = (analysis.concerns || []).map((c: any, i: number) => ({
      ...c, id: `ai-${i}`, lineEnd: c.lineStart + 5, status: "pending",
    }));

    return new Response(
      JSON.stringify({
        concerns,
        summary: analysis.summary,
        riskLevel: analysis.riskLevel,
        prTitle,
        files: files.map((f: any) => ({
          path: f.filename, status: f.status,
          additions: f.additions, deletions: f.deletions, patch: f.patch || "",
        })),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("analyze-pr error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
