import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AppHeader } from "@/components/AppHeader";
import { getGitHubToken, fetchPRs } from "@/lib/github";
import { Clock, ChevronRight, FileCode, Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

export default function Dashboard() {
  const navigate = useNavigate();
  const [prs, setPrs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState("");

  useEffect(() => {
    loadPRs();
  }, []);

  const loadPRs = async () => {
    try {
      const token = await getGitHubToken();
      if (!token) {
        navigate("/connect-github");
        return;
      }

      const data = await fetchPRs(token);
      setPrs(data.prs || []);
      setUsername(data.username || "");
    } catch (err: any) {
      toast.error(err.message || "Failed to load PRs");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <AppHeader showUser username={username} />
      <main className="flex-1 max-w-2xl mx-auto w-full px-6 py-10">
        <div className="mb-8">
          <h1 className="text-lg font-medium tracking-tight text-foreground mb-1">Your review queue</h1>
          <p className="text-sm text-muted-foreground">
            {loading ? "Loading..." : `${prs.length} PR${prs.length !== 1 ? "s" : ""} awaiting your review`}
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-5 w-5 text-muted-foreground animate-spin" />
          </div>
        ) : prs.length === 0 ? (
          <div className="text-center py-20 border rounded-lg">
            <p className="text-sm text-foreground mb-1">No PRs awaiting your review</p>
            <p className="text-xs text-muted-foreground">When someone requests your review on GitHub, it'll show up here.</p>
          </div>
        ) : (
          <div className="border rounded-lg divide-y overflow-hidden">
            {prs.map((pr: any) => (
              <button
                key={pr.id}
                onClick={() => {
                  const [owner, repo] = pr.repo.split("/");
                  navigate(`/app/review/${owner}/${repo}/${pr.number}`);
                }}
                className="w-full text-left px-4 py-3.5 hover:bg-secondary/50 transition-colors group"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-[11px] text-muted-foreground font-mono">{pr.repo} #{pr.number}</span>
                      {pr.draft && (
                        <span className="text-[9px] text-muted-foreground border rounded px-1 py-px uppercase tracking-wider">draft</span>
                      )}
                    </div>
                    <p className="text-sm font-medium text-foreground group-hover:text-foreground/80 transition-colors truncate">
                      {pr.title}
                    </p>
                    <div className="flex items-center gap-3 mt-1 text-[11px] text-muted-foreground">
                      <span>{pr.author}</span>
                      <span>+{pr.additions} −{pr.deletions}</span>
                      <span className="flex items-center gap-1">
                        <FileCode className="h-3 w-3" strokeWidth={1.5} />{pr.changedFiles}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" strokeWidth={1.5} />
                        {formatDistanceToNow(new Date(pr.updatedAt), { addSuffix: true })}
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-foreground transition-colors shrink-0 mt-2" strokeWidth={1.5} />
                </div>
              </button>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
