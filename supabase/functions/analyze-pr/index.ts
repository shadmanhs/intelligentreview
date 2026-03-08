import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { github_token, owner, repo, pr_number } = await req.json();

    if (!github_token || !owner || !repo || !pr_number) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch PR diff/files
    const filesRes = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/pulls/${pr_number}/files?per_page=30`,
      {
        headers: { Authorization: `Bearer ${github_token}`, Accept: "application/vnd.github+json" },
      }
    );
    if (!filesRes.ok) throw new Error(`Failed to fetch PR files: ${filesRes.status}`);
    const files = await filesRes.json();

    // Build a compact diff summary for AI
    const diffSummary = files.map((f: any) => ({
      filename: f.filename,
      status: f.status,
      additions: f.additions,
      deletions: f.deletions,
      patch: (f.patch || "").slice(0, 3000), // Limit patch size
    }));

    // Call Lovable AI to analyze
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: `You are a senior staff engineer reviewing a pull request. Analyze the diff and identify concerns.

For each concern, provide:
- severity: "critical" | "warning" | "suggestion" | "note"
- title: Short description (max 10 words)
- explanation: Why this matters (2-3 sentences)
- file: The filename
- lineStart: Approximate line number
- codeSnippet: The relevant code (max 5 lines)
- draftComment: A review comment the reviewer could post (1-2 sentences, professional tone)

Focus on:
1. Security issues (auth, injection, token handling, input validation)
2. Missing error handling
3. Race conditions or concurrency issues
4. Missing tests for critical paths
5. Architectural concerns (coupling, wrong abstraction layer)
6. Missing edge cases

Be specific and actionable. Don't flag style issues unless they hurt readability.
Return ONLY a JSON array of concerns. No markdown, no explanation outside the JSON.`,
          },
          {
            role: "user",
            content: `Review this PR diff:\n\n${JSON.stringify(diffSummary, null, 2)}`,
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
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Add credits in workspace settings." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errText = await aiResponse.text();
      throw new Error(`AI analysis failed: ${aiResponse.status} ${errText}`);
    }

    const aiData = await aiResponse.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    let analysis = { concerns: [], summary: "Could not analyze this PR.", riskLevel: "medium" };

    if (toolCall?.function?.arguments) {
      try {
        analysis = JSON.parse(toolCall.function.arguments);
      } catch {
        console.error("Failed to parse AI response");
      }
    }

    // Add IDs to concerns
    const concerns = (analysis.concerns || []).map((c: any, i: number) => ({
      ...c,
      id: `ai-${i}`,
      lineEnd: c.lineStart + 5,
      status: "pending",
    }));

    return new Response(
      JSON.stringify({
        concerns,
        summary: analysis.summary,
        riskLevel: analysis.riskLevel,
        files: files.map((f: any) => ({
          path: f.filename,
          status: f.status,
          additions: f.additions,
          deletions: f.deletions,
          patch: f.patch || "",
        })),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("analyze-pr error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
