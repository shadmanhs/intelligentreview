import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { github_token, owner, repo, pr_number, comments } = await req.json();

    if (!github_token || !owner || !repo || !pr_number || !comments?.length) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Post each comment as a PR review comment
    const results = [];
    for (const comment of comments) {
      // Use the review comment API for file-level comments
      const res = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/pulls/${pr_number}/reviews`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${github_token}`,
            Accept: "application/vnd.github+json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            body: comment.body || comment.draftComment,
            event: "COMMENT",
          }),
        }
      );

      if (!res.ok) {
        const errText = await res.text();
        results.push({ success: false, error: `${res.status}: ${errText}` });
      } else {
        results.push({ success: true });
      }
    }

    const successCount = results.filter((r) => r.success).length;

    return new Response(
      JSON.stringify({ posted: successCount, total: comments.length, results }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("post-review error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
