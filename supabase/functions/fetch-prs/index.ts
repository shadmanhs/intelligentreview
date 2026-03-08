import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { github_token } = await req.json();

    if (!github_token) {
      return new Response(JSON.stringify({ error: "No GitHub token provided" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const ghHeaders = { Authorization: `Bearer ${github_token}`, Accept: "application/vnd.github+json" };

    // Get user info
    const userRes = await fetch("https://api.github.com/user", { headers: ghHeaders });
    if (!userRes.ok) throw new Error("Invalid GitHub token");
    const user = await userRes.json();

    // Run multiple searches in parallel:
    // 1. PRs where user is requested reviewer
    // 2. PRs where user is assigned
    // 3. Open PRs in orgs user belongs to (authored by others)
    const queries = [
      `is:pr is:open review-requested:${user.login}`,
      `is:pr is:open assignee:${user.login}`,
      `is:pr is:open involves:${user.login} -author:${user.login}`,
    ];

    const searchResults = await Promise.all(
      queries.map(async (query) => {
        const res = await fetch(
          `https://api.github.com/search/issues?q=${encodeURIComponent(query)}&sort=updated&order=desc&per_page=15`,
          { headers: ghHeaders }
        );
        if (!res.ok) return [];
        const data = await res.json();
        return data.items || [];
      })
    );

    // Deduplicate by PR id
    const seen = new Set<number>();
    const allItems: any[] = [];
    for (const items of searchResults) {
      for (const item of items) {
        if (!seen.has(item.id)) {
          seen.add(item.id);
          allItems.push(item);
        }
      }
    }

    // Sort by updated_at descending
    allItems.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());

    // Enrich top 15 with PR details
    const prs = await Promise.all(
      allItems.slice(0, 15).map(async (item: any) => {
        const prUrl = item.pull_request?.url;
        if (!prUrl) return null;

        try {
          const prRes = await fetch(prUrl, { headers: ghHeaders });
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
        } catch {
          return null;
        }
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
