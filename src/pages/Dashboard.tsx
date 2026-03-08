import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { AppHeader } from "@/components/AppHeader";
import { useSubscription } from "@/hooks/useSubscription";
import { useKeyboardNav } from "@/hooks/useKeyboardNav";
import { getGitHubToken, fetchPRs } from "@/lib/github";
import { PRFilters, SortField } from "@/components/dashboard/PRFilters";
import { PRCard } from "@/components/dashboard/PRCard";
import { Lock, Loader2, Sparkles, Zap, Keyboard } from "lucide-react";
import { toast } from "sonner";

export default function Dashboard() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { subscribed, checkSubscription, reviewsRemaining } = useSubscription();
  const [prs, setPrs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState("");

  // Filters & sort
  const [sortField, setSortField] = useState<SortField>("updated");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [selectedRepo, setSelectedRepo] = useState("");
  const [showDrafts, setShowDrafts] = useState(true);
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    if (searchParams.get("upgraded") === "true") {
      checkSubscription();
      toast.success("Welcome to Pro! 🎉");
      window.history.replaceState({}, "", "/app");
    }
  }, []);

  useEffect(() => {
    loadPRs();
  }, []);

  const loadPRs = async () => {
    try {
      const token = await getGitHubToken();
      if (!token) { navigate("/connect-github"); return; }
      const data = await fetchPRs(token);
      setPrs(data.prs || []);
      setUsername(data.username || "");
    } catch (err: any) {
      toast.error(err.message || "Failed to load PRs");
    } finally {
      setLoading(false);
    }
  };

  // Unique repos
  const repos = useMemo(() => [...new Set(prs.map((pr: any) => pr.repo))].sort(), [prs]);

  // Filter + sort
  const processedPrs = useMemo(() => {
    let result = [...prs];

    // Filter by repo
    if (selectedRepo) result = result.filter((pr) => pr.repo === selectedRepo);

    // Filter drafts
    if (!showDrafts) result = result.filter((pr) => !pr.draft);

    // Sort
    result.sort((a, b) => {
      switch (sortField) {
        case "updated":
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
        case "size":
          return (a.additions + a.deletions) - (b.additions + b.deletions);
        case "age":
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        default:
          return 0;
      }
    });

    return result;
  }, [prs, selectedRepo, showDrafts, sortField]);

  // Split visible vs locked
  const FREE_LIMIT = 1;
  const visiblePrs = subscribed ? processedPrs : processedPrs.slice(0, FREE_LIMIT);
  const lockedPrs = subscribed ? [] : processedPrs.slice(FREE_LIMIT);

  const openPR = useCallback(
    (index: number) => {
      const pr = visiblePrs[index];
      if (!pr) return;
      const [owner, repo] = pr.repo.split("/");
      navigate(`/app/review/${owner}/${repo}/${pr.number}`);
    },
    [visiblePrs, navigate]
  );

  useKeyboardNav({
    items: visiblePrs,
    selectedIndex,
    onSelect: setSelectedIndex,
    onOpen: openPR,
    enabled: !loading && visiblePrs.length > 0,
  });

  // Reset selection when filters change
  useEffect(() => { setSelectedIndex(0); }, [sortField, selectedRepo, showDrafts]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <AppHeader showUser />
      <main className="flex-1 max-w-2xl mx-auto w-full px-6 py-10">
        {/* Header */}
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h1 className="text-lg font-medium tracking-tight text-foreground mb-1">Your review queue</h1>
            <p className="text-sm text-muted-foreground">
              {loading ? "Loading..." : `${prs.length} PR${prs.length !== 1 ? "s" : ""} awaiting your review`}
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            {/* Keyboard hint */}
            {!loading && visiblePrs.length > 0 && (
              <div className="hidden sm:flex items-center gap-1.5 text-[10px] text-muted-foreground/50">
                <Keyboard className="h-3 w-3" strokeWidth={1.5} />
                <span>j/k navigate · Enter open</span>
              </div>
            )}
            {/* Usage counter */}
            {!subscribed && !loading && (
              <div className="flex items-center gap-2 border rounded-md px-3 py-2 bg-card">
                <Zap className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={1.5} />
                <div className="text-right">
                  <p className="text-xs font-medium text-foreground">
                    {reviewsRemaining} of 1 review left
                  </p>
                  <p className="text-[10px] text-muted-foreground">Resets weekly</p>
                </div>
              </div>
            )}
          </div>
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
          <>
            {/* Filters */}
            <PRFilters
              repos={repos}
              selectedRepo={selectedRepo}
              onRepoChange={setSelectedRepo}
              showDrafts={showDrafts}
              onToggleDrafts={() => setShowDrafts(!showDrafts)}
              sortField={sortField}
              sortDir={sortDir}
              onSortChange={setSortField}
              totalCount={prs.length}
              filteredCount={processedPrs.length}
            />

            <div className="border rounded-lg divide-y overflow-hidden">
              {/* Visible PRs */}
              {visiblePrs.map((pr: any, i: number) => (
                <PRCard
                  key={pr.id}
                  pr={pr}
                  isSelected={i === selectedIndex}
                  onClick={() => openPR(i)}
                />
              ))}

              {/* Locked / blurred PRs */}
              {lockedPrs.map((pr: any, i: number) => (
                <div key={pr.id} className="w-full text-left px-4 py-3.5 relative select-none">
                  <div className="blur-[6px] pointer-events-none">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-[11px] text-muted-foreground font-mono">{pr.repo} #{pr.number}</span>
                        </div>
                        <p className="text-sm font-medium text-foreground truncate">{pr.title}</p>
                        <div className="flex items-center gap-3 mt-1 text-[11px] text-muted-foreground">
                          <span>{pr.author}</span>
                          <span>+{pr.additions} −{pr.deletions}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  {i === 0 && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Lock className="h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Upgrade CTA */}
            {lockedPrs.length > 0 && (
              <div className="mt-4 border rounded-lg p-5 text-center bg-card">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Sparkles className="h-4 w-4 text-foreground" strokeWidth={1.5} />
                  <p className="text-sm font-medium text-foreground">
                    {lockedPrs.length} more PR{lockedPrs.length !== 1 ? "s" : ""} waiting for review
                  </p>
                </div>
                <p className="text-xs text-muted-foreground mb-4">
                  Free plan includes 1 review per week. Upgrade to Pro for unlimited AI-powered reviews.
                </p>
                <button
                  onClick={() => navigate("/pricing")}
                  className="text-sm px-5 py-2.5 rounded-md bg-foreground text-background hover:bg-foreground/90 transition-colors"
                >
                  Upgrade to Pro — $10/mo
                </button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
