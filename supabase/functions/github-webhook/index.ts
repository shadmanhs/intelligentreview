import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-hub-signature-256",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const payload = await req.json();
    const action = payload.action;

    // Only handle PR opened/synchronize events
    if (!["opened", "synchronize"].includes(action) || !payload.pull_request) {
      return new Response(JSON.stringify({ skipped: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const pr = payload.pull_request;
    const repo = payload.repository;
    const owner = repo.owner.login;
    const repoName = repo.name;
    const prNumber = pr.number;
    const fullRepo = `${owner}/${repoName}`;

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const supabase = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });

    // Find GitHub connections for this repo's org — any team member's token works
    const { data: connections } = await supabase
      .from("github_connections")
      .select("access_token, user_id")
      .limit(10);

    if (!connections || connections.length === 0) {
      return new Response(JSON.stringify({ error: "No GitHub connections found" }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Try each connection until we find one with access to this repo
    let githubToken: string | null = null;
    let userId: string | null = null;

    for (const conn of connections) {
      const testRes = await fetch(`https://api.github.com/repos/${fullRepo}`, {
        headers: { Authorization: `Bearer ${conn.access_token}`, Accept: "application/vnd.github+json" },
      });
      if (testRes.ok) {
        githubToken = conn.access_token;
        userId = conn.user_id;
        break;
      }
    }

    if (!githubToken || !userId) {
      return new Response(JSON.stringify({ error: "No token with repo access" }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const ghHeaders = { Authorization: `Bearer ${githubToken}`, Accept: "application/vnd.github+json" };

    // Fetch PR files
    const filesRes = await fetch(
      `https://api.github.com/repos/${fullRepo}/pulls/${prNumber}/files?per_page=30`,
      { headers: ghHeaders }
    );
    if (!filesRes.ok) throw new Error(`Failed to fetch PR files: ${filesRes.status}`);
    const files = await filesRes.json();

    // Fetch custom rules for the org
    const { data: orgMember } = await supabase
      .from("org_members")
      .select("org_id")
      .eq("user_id", userId)
      .limit(1)
      .maybeSingle();

    let customRules: string[] = [];
    if (orgMember?.org_id) {
      const { data: rules } = await supabase
        .from("custom_rules")
        .select("rule_text")
        .eq("enabled", true)
        .eq("org_id", orgMember.org_id)
        .or(`repo.eq.${fullRepo},repo.eq.*`);
      customRules = (rules || []).map((r: any) => r.rule_text);
    }

    let customRulesSection = "";
    if (customRules.length > 0) {
      customRulesSection = `\n\nTEAM RULES (enforce these):\n${customRules.map((r, i) => `${i + 1}. ${r}`).join("\n")}`;
    }

    const diffSummary = files.map((f: any) => ({
      filename: f.filename, status: f.status,
      additions: f.additions, deletions: f.deletions,
      patch: (f.patch || "").slice(0, 3000),
    }));

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    // AI analysis
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: `You are a senior staff engineer auto-reviewing a PR. Be concise and actionable.
${customRulesSection}

For each concern found, provide:
- severity: "critical" | "warning" | "suggestion"  
- title: Short description (max 8 words)
- file: The filename
- line: Approximate line number
- comment: A professional review comment (1-2 sentences)

Focus on: security issues, missing error handling, race conditions, architectural problems.
Skip style nitpicks. Only flag things that matter.`,
          },
          {
            role: "user",
            content: `PR #${prNumber}: ${pr.title}\n\nDiff:\n${JSON.stringify(diffSummary, null, 2)}`,
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "report_review",
              description: "Report the auto-review results",
              parameters: {
                type: "object",
                properties: {
                  summary: { type: "string", description: "1-2 sentence summary of the PR" },
                  riskLevel: { type: "string", enum: ["low", "medium", "high"] },
                  concerns: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        severity: { type: "string", enum: ["critical", "warning", "suggestion"] },
                        title: { type: "string" },
                        file: { type: "string" },
                        line: { type: "number" },
                        comment: { type: "string" },
                      },
                      required: ["severity", "title", "file", "line", "comment"],
                    },
                  },
                },
                required: ["summary", "riskLevel", "concerns"],
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "report_review" } },
      }),
    });

    if (!aiResponse.ok) throw new Error(`AI failed: ${aiResponse.status}`);

    const aiData = await aiResponse.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    let analysis = { summary: "", riskLevel: "medium", concerns: [] as any[] };

    if (toolCall?.function?.arguments) {
      try { analysis = JSON.parse(toolCall.function.arguments); } catch {}
    }

    if (analysis.concerns.length === 0 && analysis.riskLevel === "low") {
      // Clean PR — post a short approval comment
      await fetch(`https://api.github.com/repos/${fullRepo}/issues/${prNumber}/comments`, {
        method: "POST",
        headers: { ...ghHeaders, "Content-Type": "application/json" },
        body: JSON.stringify({
          body: `🟢 **ReviewLens Auto-Review** — No concerns found.\n\n${analysis.summary}\n\n_Risk: ${analysis.riskLevel}_`,
        }),
      });
    } else {
      // Build review comment
      const severityEmoji: Record<string, string> = { critical: "🔴", warning: "🟡", suggestion: "💡" };
      const concernsList = analysis.concerns
        .map((c: any) => `${severityEmoji[c.severity] || "⚪"} **${c.severity.toUpperCase()}** — ${c.title}\n   📍 \`${c.file}:${c.line}\`\n   ${c.comment}`)
        .join("\n\n");

      const body = `## 🔍 ReviewLens Auto-Review\n\n${analysis.summary}\n\n**Risk Level:** ${analysis.riskLevel.toUpperCase()}\n\n---\n\n${concernsList}\n\n---\n_${analysis.concerns.length} concern${analysis.concerns.length !== 1 ? "s" : ""} found · [ReviewLens](https://reviewlens.dev)_`;

      await fetch(`https://api.github.com/repos/${fullRepo}/issues/${prNumber}/comments`, {
        method: "POST",
        headers: { ...ghHeaders, "Content-Type": "application/json" },
        body: JSON.stringify({ body }),
      });
    }

    // Save session for analytics
    const orgId = orgMember?.org_id || null;
    await supabase.from("review_sessions").insert({
      user_id: userId,
      org_id: orgId,
      repo: fullRepo,
      pr_number: prNumber,
      pr_title: pr.title,
      summary: analysis.summary,
      risk_level: analysis.riskLevel,
      concerns_total: analysis.concerns.length,
      concerns_approved: analysis.concerns.length,
      concerns_dismissed: 0,
      concerns_edited: 0,
      comments_posted: analysis.concerns.length > 0 ? 1 : 1,
    } as any);

    return new Response(JSON.stringify({ success: true, concerns: analysis.concerns.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("github-webhook error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
