import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useOrganization } from "@/hooks/useOrganization";
import { toast } from "sonner";
import { Loader2, Check, GitBranch, RefreshCw } from "lucide-react";

interface Repo {
  full_name: string;
  enabled: boolean;
}

export function RepoAuthorization() {
  const { user } = useAuth();
  const { org } = useOrganization();
  const [repos, setRepos] = useState<Repo[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    if (user) loadAuthorizedRepos();
  }, [user]);

  const loadAuthorizedRepos = async () => {
    try {
      const { data } = await supabase
        .from("authorized_repos")
        .select("repo_full_name, enabled")
        .eq("user_id", user!.id);

      setRepos((data || []).map(r => ({ full_name: r.repo_full_name, enabled: r.enabled })));
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  const fetchGitHubRepos = async () => {
    setSyncing(true);
    try {
      const { data: ghConn } = await supabase
        .from("github_connections")
        .select("access_token")
        .eq("user_id", user!.id)
        .maybeSingle();

      if (!ghConn?.access_token) {
        toast.error("Connect GitHub first");
        return;
      }

      const res = await fetch("https://api.github.com/user/repos?per_page=100&sort=updated&affiliation=owner,collaborator,organization_member", {
        headers: { Authorization: `Bearer ${ghConn.access_token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch repos");
      const ghRepos: any[] = await res.json();

      const existingNames = new Set(repos.map(r => r.full_name));
      const newRepos: Repo[] = [];

      for (const r of ghRepos) {
        if (!existingNames.has(r.full_name)) {
          newRepos.push({ full_name: r.full_name, enabled: false });
        }
      }

      if (newRepos.length > 0) {
        const inserts = newRepos.map(r => ({
          user_id: user!.id,
          repo_full_name: r.full_name,
          enabled: false,
          org_id: org?.id || null,
        }));

        await supabase.from("authorized_repos").upsert(inserts, { onConflict: "user_id,repo_full_name" });
        setRepos(prev => [...prev, ...newRepos].sort((a, b) => a.full_name.localeCompare(b.full_name)));
        toast.success(`Found ${newRepos.length} new repo${newRepos.length !== 1 ? "s" : ""}`);
      } else {
        toast("All repos already synced");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to sync repos");
    } finally {
      setSyncing(false);
    }
  };

  const toggleRepo = async (repoName: string, enabled: boolean) => {
    setSaving(repoName);
    try {
      const { error } = await supabase
        .from("authorized_repos")
        .update({ enabled, updated_at: new Date().toISOString() })
        .eq("user_id", user!.id)
        .eq("repo_full_name", repoName);

      if (error) throw error;
      setRepos(prev => prev.map(r => r.full_name === repoName ? { ...r, enabled } : r));
    } catch (err: any) {
      toast.error(err.message || "Failed to update");
    } finally {
      setSaving(null);
    }
  };

  const enabledCount = repos.filter(r => r.enabled).length;

  return (
    <section className="mb-10">
      <div className="flex items-center gap-2 mb-4">
        <GitBranch className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={1.5} />
        <h2 className="text-xs uppercase tracking-wider text-muted-foreground font-medium">Authorized Repositories</h2>
      </div>

      <div className="border rounded-lg divide-y">
        <div className="px-4 py-3 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-foreground">
              {enabledCount} repo{enabledCount !== 1 ? "s" : ""} enabled for analysis
            </p>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              Only enabled repos will be analyzed via webhook and manual review
            </p>
          </div>
          <button
            onClick={fetchGitHubRepos}
            disabled={syncing}
            className="text-[11px] px-3 py-1.5 rounded border text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors flex items-center gap-1.5 disabled:opacity-50"
          >
            {syncing ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" strokeWidth={1.5} />}
            {syncing ? "Syncing..." : "Sync from GitHub"}
          </button>
        </div>

        {loading ? (
          <div className="px-4 py-6 flex justify-center">
            <Loader2 className="h-4 w-4 text-muted-foreground animate-spin" />
          </div>
        ) : repos.length === 0 ? (
          <div className="px-4 py-6 text-center">
            <p className="text-xs text-muted-foreground mb-2">No repositories synced yet</p>
            <button
              onClick={fetchGitHubRepos}
              disabled={syncing}
              className="text-[11px] px-3 py-1.5 rounded bg-foreground text-background hover:bg-foreground/90 transition-colors disabled:opacity-50"
            >
              Sync repos from GitHub
            </button>
          </div>
        ) : (
          <div className="max-h-64 overflow-y-auto">
            {repos.sort((a, b) => a.full_name.localeCompare(b.full_name)).map((repo) => (
              <div
                key={repo.full_name}
                className="px-4 py-2.5 flex items-center justify-between hover:bg-accent/30 transition-colors border-b last:border-b-0"
              >
                <span className="text-xs font-mono text-foreground truncate mr-3">{repo.full_name}</span>
                <button
                  onClick={() => toggleRepo(repo.full_name, !repo.enabled)}
                  disabled={saving === repo.full_name}
                  className={`shrink-0 h-5 w-9 rounded-full transition-colors relative ${
                    repo.enabled ? "bg-foreground" : "bg-secondary"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 h-4 w-4 rounded-full bg-background transition-transform ${
                      repo.enabled ? "translate-x-4" : "translate-x-0.5"
                    }`}
                  />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
