import { supabase } from "@/integrations/supabase/client";

export async function getGitHubToken(): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("github_connections")
    .select("access_token")
    .eq("user_id", user.id)
    .maybeSingle();

  return data?.access_token || null;
}

export async function fetchPRs(githubToken: string) {
  const { data, error } = await supabase.functions.invoke("fetch-prs", {
    body: { github_token: githubToken },
  });

  if (error) throw new Error(error.message || "Failed to fetch PRs");
  if (data?.error) throw new Error(data.error);
  return data;
}

export async function analyzePR(githubToken: string, owner: string, repo: string, prNumber: number) {
  const { data, error } = await supabase.functions.invoke("analyze-pr", {
    body: { github_token: githubToken, owner, repo, pr_number: prNumber },
  });

  if (error) throw new Error(error.message || "Failed to analyze PR");
  if (data?.error) throw new Error(data.error);
  return data;
}

export async function postReview(
  githubToken: string,
  owner: string,
  repo: string,
  prNumber: number,
  comments: { body: string }[]
) {
  const { data, error } = await supabase.functions.invoke("post-review", {
    body: { github_token: githubToken, owner, repo, pr_number: prNumber, comments },
  });

  if (error) throw new Error(error.message || "Failed to post review");
  if (data?.error) throw new Error(data.error);
  return data;
}
