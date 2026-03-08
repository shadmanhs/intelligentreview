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

    const ghHeaders = { Authorization: `Bearer ${github_token}`, Accept: "application/vnd.github+json" };

    // Fetch PR diff/files and repo context in parallel
    const [filesRes, repoRes, treeRes] = await Promise.all([
      fetch(`https://api.github.com/repos/${owner}/${repo}/pulls/${pr_number}/files?per_page=30`, { headers: ghHeaders }),
      fetch(`https://api.github.com/repos/${owner}/${repo}`, { headers: ghHeaders }),
      fetch(`https://api.github.com/repos/${owner}/${repo}/git/trees/HEAD?recursive=1`, { headers: ghHeaders }),
    ]);

    if (!filesRes.ok) throw new Error(`Failed to fetch PR files: ${filesRes.status}`);
    const files = await filesRes.json();

    // Get repo language and structure for context
    let repoContext = "";
    if (repoRes.ok) {
      const repoData = await repoRes.json();
      repoContext += `Primary language: ${repoData.language || "unknown"}. `;
    }

    // Sample existing files for coding patterns (config files, linters, etc.)
    if (treeRes.ok) {
      const treeData = await treeRes.json();
      const tree = treeData.tree || [];
      
      // Look for config/standard files that indicate coding patterns
      const patternFiles = tree
        .filter((f: any) => f.type === "blob")
        .map((f: any) => f.path)
        .filter((p: string) =>
          p.match(/\.(eslintrc|prettierrc|editorconfig|tsconfig|biome)\b/i) ||
          p.match(/^\.?(eslint|prettier|biome)\.(json|js|cjs|mjs|yaml|yml|toml)$/i) ||
          p === "tsconfig.json" ||
          p === ".editorconfig" ||
          p === "deno.json" ||
          p === "deno.jsonc"
        );

      if (patternFiles.length > 0) {
        // Fetch up to 3 config files to understand coding standards
        const configContents = await Promise.all(
          patternFiles.slice(0, 3).map(async (path: string) => {
            try {
              const res = await fetch(
                `https://api.github.com/repos/${owner}/${repo}/contents/${path}`,
                { headers: ghHeaders }
              );
              if (!res.ok) return null;
              const data = await res.json();
              if (data.content && data.encoding === "base64") {
                const decoded = atob(data.content);
                return `--- ${path} ---\n${decoded.slice(0, 1500)}`;
              }
              return null;
            } catch { return null; }
          })
        );

        const validConfigs = configContents.filter(Boolean);
        if (validConfigs.length > 0) {
          repoContext += `\n\nRepo coding standards (from config files):\n${validConfigs.join("\n\n")}`;
        }
      }

      // Also sample a few existing files similar to the changed files to understand patterns
      const changedExtensions = new Set(files.map((f: any) => {
        const ext = f.filename?.split(".").pop();
        return ext ? `.${ext}` : "";
      }).filter(Boolean));

      const similarFiles = tree
        .filter((f: any) => {
          if (f.type !== "blob") return false;
          const ext = f.path.split(".").pop();
          return ext && changedExtensions.has(`.${ext}`);
        })
        .filter((f: any) => !files.some((changed: any) => changed.filename === f.path))
        .slice(0, 2);

      if (similarFiles.length > 0) {
        const sampleContents = await Promise.all(
          similarFiles.map(async (f: any) => {
            try {
              const res = await fetch(
                `https://api.github.com/repos/${owner}/${repo}/contents/${f.path}`,
                { headers: ghHeaders }
              );
              if (!res.ok) return null;
              const data = await res.json();
              if (data.content && data.encoding === "base64") {
                const decoded = atob(data.content);
                return `--- ${f.path} (existing file for pattern reference) ---\n${decoded.slice(0, 2000)}`;
              }
              return null;
            } catch { return null; }
          })
        );

        const validSamples = sampleContents.filter(Boolean);
        if (validSamples.length > 0) {
          repoContext += `\n\nExisting code patterns in the repo (use these to judge consistency):\n${validSamples.join("\n\n")}`;
        }
      }
    }

    // Build diff summary
    const diffSummary = files.map((f: any) => ({
      filename: f.filename,
      status: f.status,
      additions: f.additions,
      deletions: f.deletions,
      patch: (f.patch || "").slice(0, 3000),
    }));

    // Call AI with repo context
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
            content: `You are a senior staff engineer reviewing a pull request. You have access to the repo's coding standards and existing code patterns.

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
- draftComment: A review comment the reviewer could post (1-2 sentences, professional tone)

Focus on:
1. Security issues (auth, injection, token handling, input validation)
2. Deviations from established repo coding standards/patterns
3. Missing error handling (especially if the repo has a pattern for it)
4. Race conditions or concurrency issues
5. Architectural concerns (coupling, wrong abstraction layer)
6. Missing edge cases
7. Inconsistent naming or patterns compared to existing code

Be specific and actionable. Reference the repo's existing patterns when flagging inconsistencies.`,
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
      try {
        analysis = JSON.parse(toolCall.function.arguments);
      } catch {
        console.error("Failed to parse AI response");
      }
    }

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
