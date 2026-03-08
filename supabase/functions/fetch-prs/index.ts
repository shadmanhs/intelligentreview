import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { github_token, filter } = await req.json();

    if (!github_token) {
      return new Response(JSON.stringify({ error: "No GitHub token provided" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch PRs where user is requested reviewer
    const userRes = await fetch("https://api.github.com/user", {
      headers: { Authorization: `Bearer ${github_token}`, Accept: "application/vnd.github+json" },
    });
    if (!userRes.ok) throw new Error("Invalid GitHub token");
    const user = await userRes.json();

    // Search for PRs needing review
    const query = `is:pr is:open review-requested:${user.login}`;
    const searchRes = await fetch(
      `https://api.github.com/search/issues?q=${encodeURIComponent(query)}&sort=updated&order=desc&per_page=20`,
      {
        headers: { Authorization: `Bearer ${github_token}`, Accept: "application/vnd.github+json" },
      }
    );

    if (!searchRes.ok) {
      const errText = await searchRes.text();
      throw new Error(`GitHub search failed: ${searchRes.status} ${errText}`);
    }

    const searchData = await searchRes.json();

    // Enrich with PR details
    const prs = await Promise.all(
      searchData.items.slice(0, 10).map(async (item: any) => {
        const prUrl = item.pull_request?.url;
        if (!prUrl) return null;

        const prRes = await fetch(prUrl, {
          headers: { Authorization: `Bearer ${github_token}`, Accept: "application/vnd.github+json" },
        });
        if (!prRes.ok) return null;
        const pr = await prRes.json();

        return {
          id: pr.id,
          number: pr.number,
          title: pr.title,
          author: pr.user?.login || "unknown",
          repo: pr.base?.repo?.full_name || "",
          status: pr.state,
          draft: pr.draft || false,
          additions: pr.additions || 0,
          deletions: pr.deletions || 0,
          changedFiles: pr.changed_files || 0,
          createdAt: pr.created_at,
          updatedAt: pr.updated_at,
          labels: (pr.labels || []).map((l: any) => l.name),
          description: pr.body || "",
          htmlUrl: pr.html_url,
        };
      })
    );

    return new Response(JSON.stringify({ prs: prs.filter(Boolean), username: user.login }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("fetch-prs error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
