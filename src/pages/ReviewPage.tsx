import { useState, useEffect, useMemo, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AppHeader } from "@/components/AppHeader";
import { ConcernCard } from "@/components/review/ConcernCard";
import { ReviewSummary } from "@/components/review/ReviewSummary";
import { FilesChangedView } from "@/components/review/FilesChangedView";
import { PRContextPanel } from "@/components/review/PRContextPanel";
import { getGitHubToken, analyzePR, postReview } from "@/lib/github";
import { saveReviewSession } from "@/lib/reviewStorage";
import { useSubscription } from "@/hooks/useSubscription";
import { usePermissions } from "@/hooks/usePermissions";
import { AIConcern } from "@/types/review";
import { ArrowLeft, ExternalLink, AlertTriangle, Code, Send, Loader2, Keyboard } from "lucide-react";
import { toast } from "sonner";

type Tab = "concerns" | "diff" | "post";

interface InlineComment {
  id: string;
  filePath: string;
  lineNumber: number;
  body: string;
  side: "RIGHT" | "LEFT";
}

export default function ReviewPage() {
  const { owner, repo, number } = useParams();
  const navigate = useNavigate();
  const { recordUsage } = useSubscription();
  const { hasPermission } = usePermissions();
  const [tab, setTab] = useState<Tab>("concerns");
  const [concerns, setConcerns] = useState<AIConcern[]>([]);
  const [summary, setSummary] = useState("");
  const [riskLevel, setRiskLevel] = useState<string>("medium");
  const [files, setFiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [inlineComments, setInlineComments] = useState<InlineComment[]>([]);
  const [prTitle, setPrTitle] = useState("");

  useEffect(() => {
    loadAnalysis();
  }, [owner, repo, number]);

  // Keyboard shortcuts for tabs
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") return;

      switch (e.key) {
        case "1":
          setTab("concerns");
          break;
        case "2":
          setTab("diff");
          break;
        case "3":
          setTab("post");
          break;
        case "Escape":
          navigate("/app");
          break;
      }
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [navigate]);

  const loadAnalysis = async () => {
    try {
      const token = await getGitHubToken();
      if (!token) {
        navigate("/connect-github");
        return;
      }

      const data = await analyzePR(token, owner!, repo!, Number(number));
      setConcerns((data.concerns || []).map((c: AIConcern) => ({ ...c, originalDraftComment: c.draftComment })));
      setSummary(data.summary || "");
      setRiskLevel(data.riskLevel || "medium");
      setFiles(data.files || []);
      setPrTitle(data.prTitle || "");

      await recordUsage(`${owner}/${repo}`, Number(number));
    } catch (err: any) {
      setError(err.message || "Failed to analyze PR");
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const approve = (cid: string) => setConcerns((prev) => prev.map((c) => c.id === cid ? { ...c, status: "approved" as const } : c));
  const dismiss = (cid: string) => setConcerns((prev) => prev.map((c) => c.id === cid ? { ...c, status: "dismissed" as const } : c));
  const edit = (cid: string, text: string) => setConcerns((prev) => prev.map((c) => c.id === cid ? { ...c, draftComment: text, status: "edited" as const } : c));

  const handleInlineComment = useCallback((comment: InlineComment) => {
    setInlineComments((prev) => [...prev, comment]);
  }, []);

  const stats = useMemo(() => ({
    pending: concerns.filter((c) => c.status === "pending").length,
    approved: concerns.filter((c) => c.status === "approved" || c.status === "edited").length,
    dismissed: concerns.filter((c) => c.status === "dismissed").length,
    critical: concerns.filter((c) => c.severity === "critical" && c.status === "pending").length,
  }), [concerns]);

  const totalComments = stats.approved + inlineComments.length;

  const handlePost = async () => {
    try {
      const token = await getGitHubToken();
      if (!token) return;

      // Combine AI-approved concerns + inline comments
      const aiComments = concerns
        .filter((c) => c.status === "approved" || c.status === "edited")
        .map((c) => ({
          body: `**${c.severity.toUpperCase()}**: ${c.title}\n\n${c.draftComment}\n\n_📍 ${c.file}:${c.lineStart}_`,
        }));

      const inlineCommentsFormatted = inlineComments.map((c) => ({
        body: `${c.body}\n\n_📍 ${c.filePath}:${c.lineNumber}_`,
      }));

      const allComments = [...aiComments, ...inlineCommentsFormatted];

      await postReview(token, owner!, repo!, Number(number), allComments);

      // Save review session and outcomes for intelligence
      await saveReviewSession({
        repo: `${owner}/${repo}`,
        prNumber: Number(number),
        prTitle,
        summary,
        riskLevel,
        concerns,
        commentsPosted: allComments.length,
      });

      toast.success(`${allComments.length} comments posted to GitHub`);
      navigate("/app");
    } catch (err: any) {
      toast.error(err.message || "Failed to post review");
    }
  };

  const riskColors: Record<string, string> = { high: "text-destructive", medium: "text-warning", low: "text-success" };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <AppHeader showUser />
        <div className="flex-1 flex flex-col items-center justify-center gap-3">
          <Loader2 className="h-5 w-5 text-muted-foreground animate-spin" />
          <p className="text-xs text-muted-foreground">Analyzing PR with AI...</p>
          <p className="text-[10px] text-muted-foreground/60">This takes 10-20 seconds for large PRs</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <AppHeader showUser />
        <div className="flex-1 flex flex-col items-center justify-center gap-3">
          <p className="text-sm text-destructive">{error}</p>
          <button onClick={() => navigate("/app")} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
            Back to queue
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <AppHeader showUser />

      {/* PR header bar */}
      <div className="border-b px-6 py-4">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button onClick={() => navigate("/app")} className="text-muted-foreground hover:text-foreground transition-colors">
                <ArrowLeft className="h-4 w-4" strokeWidth={1.5} />
              </button>
              <span className="text-[11px] text-muted-foreground font-mono">{owner}/{repo} #{number}</span>
              <span className={`text-[10px] uppercase tracking-wider font-medium ${riskColors[riskLevel] || "text-muted-foreground"}`}>
                {riskLevel} risk
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="hidden sm:flex items-center gap-1.5 text-[10px] text-muted-foreground/50">
                <Keyboard className="h-3 w-3" strokeWidth={1.5} />
                1/2/3 tabs · Esc back
              </span>
              <a
                href={`https://github.com/${owner}/${repo}/pull/${number}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
              >
                <ExternalLink className="h-3 w-3" strokeWidth={1.5} /> GitHub
              </a>
            </div>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed mt-2">{summary}</p>
        </div>
      </div>

      {/* PR Context Panel */}
      <PRContextPanel owner={owner!} repo={repo!} prNumber={Number(number)} />

      {/* Tabs */}
      <div className="border-b">
        <div className="max-w-3xl mx-auto flex items-center">
          {([
            { key: "concerns" as Tab, label: "Concerns", icon: AlertTriangle, badge: stats.pending > 0 ? stats.pending : undefined, shortcut: "1" },
            { key: "diff" as Tab, label: "Full diff", icon: Code, badge: inlineComments.length > 0 ? inlineComments.length : undefined, shortcut: "2" },
            { key: "post" as Tab, label: "Post review", icon: Send, badge: totalComments > 0 ? totalComments : undefined, shortcut: "3" },
          ]).map(({ key, label, icon: Icon, badge, shortcut }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`px-4 py-2.5 text-xs flex items-center gap-2 border-b-2 transition-colors ${
                tab === key ? "border-foreground text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="h-3.5 w-3.5" strokeWidth={1.5} />
              {label}
              <span className="text-[9px] text-muted-foreground/40 hidden sm:inline">{shortcut}</span>
              {badge !== undefined && (
                <span className={`text-[10px] px-1.5 py-px rounded-full ${
                  key === "concerns" && stats.critical > 0 ? "bg-destructive/10 text-destructive" : "bg-secondary text-muted-foreground"
                }`}>
                  {badge}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <main className={`flex-1 w-full ${tab === "diff" ? "px-4 py-4" : "max-w-3xl mx-auto px-6 py-6"}`}>
        {tab === "concerns" && (
          <div className="space-y-3">
            {concerns.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-sm text-muted-foreground">No concerns found. This PR looks clean.</p>
              </div>
            ) : (
              <>
                {stats.pending > 0 && (
                  <p className="text-xs text-muted-foreground mb-2">
                    {stats.critical > 0 && <span className="text-destructive">{stats.critical} critical</span>}
                    {stats.critical > 0 && stats.pending - stats.critical > 0 && " · "}
                    {stats.pending - stats.critical > 0 && `${stats.pending - stats.critical} other`} to review
                  </p>
                )}
                {concerns.map((concern, i) => (
                  <ConcernCard
                    key={concern.id}
                    concern={concern}
                    index={i}
                    total={concerns.length}
                    onApprove={approve}
                    onDismiss={dismiss}
                    onEdit={edit}
                  />
                ))}
                {stats.pending === 0 && totalComments > 0 && (
                  <div className="pt-4 border-t mt-6">
                    <button
                      onClick={() => setTab("post")}
                      className="w-full py-2.5 rounded-lg bg-foreground text-background text-sm font-medium hover:bg-foreground/90 transition-colors flex items-center justify-center gap-2"
                    >
                      <Send className="h-3.5 w-3.5" strokeWidth={1.5} />
                      Review {totalComments} comment{totalComments !== 1 ? "s" : ""} and post
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {tab === "diff" && (
          <FilesChangedView
            files={files}
            owner={owner!}
            repo={repo!}
            prNumber={Number(number)}
            onInlineComment={handleInlineComment}
            inlineComments={inlineComments}
          />
        )}

        {tab === "post" && (
          <ReviewSummary
            concerns={concerns}
            inlineComments={inlineComments}
            onPost={handlePost}
          />
        )}
      </main>
    </div>
  );
}
