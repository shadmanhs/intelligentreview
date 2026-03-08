import { useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AppHeader } from "@/components/AppHeader";
import { ConcernCard } from "@/components/review/ConcernCard";
import { DiffPanel } from "@/components/review/DiffPanel";
import { ReviewSummary } from "@/components/review/ReviewSummary";
import { mockPRs, mockConcerns, mockSummaries, mockFiles } from "@/data/mockData";
import { AIConcern } from "@/types/review";
import { ArrowLeft, ExternalLink, FileCode, AlertTriangle, Code, Send } from "lucide-react";
import { toast } from "sonner";

type Tab = "concerns" | "diff" | "post";

export default function ReviewPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const pr = mockPRs.find((p) => p.id === Number(id));
  const [tab, setTab] = useState<Tab>("concerns");
  const [concerns, setConcerns] = useState<AIConcern[]>(
    () => (mockConcerns[Number(id)] || []).map((c) => ({ ...c }))
  );

  const summary = mockSummaries[Number(id)] || "";

  const approve = (cid: string) => setConcerns((prev) => prev.map((c) => c.id === cid ? { ...c, status: "approved" as const } : c));
  const dismiss = (cid: string) => setConcerns((prev) => prev.map((c) => c.id === cid ? { ...c, status: "dismissed" as const } : c));
  const edit = (cid: string, text: string) => setConcerns((prev) => prev.map((c) => c.id === cid ? { ...c, draftComment: text, status: "edited" as const } : c));

  const stats = useMemo(() => ({
    pending: concerns.filter((c) => c.status === "pending").length,
    approved: concerns.filter((c) => c.status === "approved" || c.status === "edited").length,
    dismissed: concerns.filter((c) => c.status === "dismissed").length,
    critical: concerns.filter((c) => c.severity === "critical" && c.status === "pending").length,
  }), [concerns]);

  const handlePost = () => {
    toast.success(`${stats.approved} comments posted to GitHub`);
    navigate("/");
  };

  if (!pr) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-sm text-muted-foreground">PR not found</p>
      </div>
    );
  }

  const riskColors = { high: "text-destructive", medium: "text-warning", low: "text-success" };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <AppHeader />

      {/* PR context bar */}
      <div className="border-b px-6 py-4">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center gap-3 mb-2">
            <button onClick={() => navigate("/")} className="text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="h-4 w-4" strokeWidth={1.5} />
            </button>
            <span className="text-[11px] text-muted-foreground font-mono">{pr.repo} #{pr.number}</span>
            <span className={`text-[10px] uppercase tracking-wider font-medium ${riskColors[pr.riskLevel]}`}>{pr.riskLevel} risk</span>
          </div>
          <h1 className="text-base font-medium text-foreground mb-2">{pr.title}</h1>
          <p className="text-xs text-muted-foreground leading-relaxed">{summary}</p>
          <div className="flex items-center gap-4 mt-3 text-[11px] text-muted-foreground">
            <span>{pr.author}</span>
            <span>+{pr.additions} −{pr.deletions}</span>
            <span>{pr.changedFiles} files</span>
            <button className="flex items-center gap-1 hover:text-foreground transition-colors ml-auto">
              <ExternalLink className="h-3 w-3" strokeWidth={1.5} /> GitHub
            </button>
          </div>
        </div>
      </div>

      {/* Tab navigation */}
      <div className="border-b">
        <div className="max-w-3xl mx-auto flex items-center">
          {([
            { key: "concerns" as Tab, label: "Concerns", icon: AlertTriangle, badge: stats.pending > 0 ? stats.pending : undefined },
            { key: "diff" as Tab, label: "Full diff", icon: Code },
            { key: "post" as Tab, label: "Post review", icon: Send, badge: stats.approved > 0 ? stats.approved : undefined },
          ]).map(({ key, label, icon: Icon, badge }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`px-4 py-2.5 text-xs flex items-center gap-2 border-b-2 transition-colors ${
                tab === key
                  ? "border-foreground text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="h-3.5 w-3.5" strokeWidth={1.5} />
              {label}
              {badge !== undefined && (
                <span className={`text-[10px] px-1.5 py-px rounded-full ${
                  key === "concerns" && stats.critical > 0
                    ? "bg-destructive/10 text-destructive"
                    : "bg-secondary text-muted-foreground"
                }`}>
                  {badge}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <main className="flex-1 max-w-3xl mx-auto w-full px-6 py-6">
        {tab === "concerns" && (
          <div className="space-y-3">
            {concerns.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-sm text-muted-foreground">No concerns found. This PR looks clean.</p>
              </div>
            ) : (
              <>
                {stats.pending > 0 && stats.critical > 0 && (
                  <p className="text-xs text-muted-foreground mb-2">
                    {stats.critical} critical · {stats.pending - stats.critical} other{stats.pending - stats.critical !== 1 ? "s" : ""} to review
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

                {stats.pending === 0 && stats.approved > 0 && (
                  <div className="pt-4 border-t mt-6">
                    <button
                      onClick={() => setTab("post")}
                      className="w-full py-2.5 rounded-lg bg-foreground text-background text-sm font-medium hover:bg-foreground/90 transition-colors flex items-center justify-center gap-2"
                    >
                      <Send className="h-3.5 w-3.5" strokeWidth={1.5} />
                      Review {stats.approved} comment{stats.approved !== 1 ? "s" : ""} and post
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {tab === "diff" && <DiffPanel files={mockFiles} />}

        {tab === "post" && <ReviewSummary concerns={concerns} onPost={handlePost} />}
      </main>
    </div>
  );
}
