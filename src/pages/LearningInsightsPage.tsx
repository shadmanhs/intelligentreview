import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { AppHeader } from "@/components/AppHeader";
import { useAuth } from "@/hooks/useAuth";
import { useOrganization } from "@/hooks/useOrganization";
import { supabase } from "@/integrations/supabase/client";
import {
  ArrowLeft, Brain, TrendingUp, TrendingDown, Loader2, Target,
  XCircle, CheckCircle, Pencil, BarChart3, Lightbulb, RefreshCw
} from "lucide-react";

interface ConcernPattern {
  id: string;
  concern_title: string;
  concern_severity: string;
  times_approved: number;
  times_dismissed: number;
  times_edited: number;
  last_seen_at: string;
  repo: string;
}

interface CommentEdit {
  id: string;
  concern_title: string;
  concern_severity: string;
  original_comment: string;
  edited_comment: string;
  concern_file: string | null;
  repo: string;
  created_at: string;
}

export default function LearningInsightsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { org } = useOrganization();
  const [patterns, setPatterns] = useState<ConcernPattern[]>([]);
  const [edits, setEdits] = useState<CommentEdit[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"patterns" | "knowledge">("patterns");

  useEffect(() => {
    if (user) loadData();
  }, [user]);

  const loadData = async () => {
    const [patternsRes, editsRes] = await Promise.all([
      supabase
        .from("concern_patterns")
        .select("*")
        .order("last_seen_at", { ascending: false })
        .limit(200),
      supabase
        .from("comment_edits")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100),
    ]);
    setPatterns((patternsRes.data as unknown as ConcernPattern[]) || []);
    setEdits((editsRes.data as unknown as CommentEdit[]) || []);
    setLoading(false);
  };

  // Compute learning stats
  const learningStats = useMemo(() => {
    const totalPatterns = patterns.length;
    const autoSuppressed = patterns.filter(p => {
      const total = p.times_approved + p.times_dismissed + p.times_edited;
      return total >= 2 && p.times_dismissed / total >= 0.7;
    });
    const highValue = patterns.filter(p => {
      const total = p.times_approved + p.times_dismissed + p.times_edited;
      return total >= 2 && (p.times_approved + p.times_edited) / total >= 0.8;
    });
    const totalEdits = edits.length;
    const uniqueEditPatterns = new Set(edits.map(e => e.concern_title)).size;

    return {
      totalPatterns,
      suppressedCount: autoSuppressed.length,
      highValueCount: highValue.length,
      totalEdits,
      uniqueEditPatterns,
    };
  }, [patterns, edits]);

  // Sorted patterns by actionability
  const sortedPatterns = useMemo(() => {
    return [...patterns]
      .map(p => {
        const total = p.times_approved + p.times_dismissed + p.times_edited;
        const dismissRate = total > 0 ? p.times_dismissed / total : 0;
        const approveRate = total > 0 ? (p.times_approved + p.times_edited) / total : 0;
        let status: "suppressed" | "high-value" | "learning" = "learning";
        if (total >= 2 && dismissRate >= 0.7) status = "suppressed";
        else if (total >= 2 && approveRate >= 0.8) status = "high-value";
        return { ...p, total, dismissRate, approveRate, status };
      })
      .sort((a, b) => b.total - a.total);
  }, [patterns]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <AppHeader showUser />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-5 w-5 text-muted-foreground animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <AppHeader showUser />
      <main className="flex-1 max-w-4xl mx-auto w-full px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate("/app/insights")} className="text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="h-4 w-4" strokeWidth={1.5} />
            </button>
            <div>
              <h1 className="text-lg font-medium tracking-tight text-foreground">Learning Intelligence</h1>
              <p className="text-xs text-muted-foreground">How ReviewLens adapts to {org ? "your team's" : "your"} preferences</p>
            </div>
          </div>
        </div>

        {/* Stats overview */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-8">
          {[
            { label: "Patterns learned", value: learningStats.totalPatterns, icon: Brain },
            { label: "Auto-suppressed", value: learningStats.suppressedCount, icon: XCircle, color: "text-warning" },
            { label: "High-value", value: learningStats.highValueCount, icon: CheckCircle, color: "text-success" },
            { label: "Comment edits", value: learningStats.totalEdits, icon: Pencil },
            { label: "Style patterns", value: learningStats.uniqueEditPatterns, icon: Lightbulb },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="border rounded-lg p-3">
              <div className="flex items-center gap-1.5 mb-1.5">
                <Icon className={`h-3 w-3 ${color || "text-muted-foreground"}`} strokeWidth={1.5} />
                <span className="text-[9px] text-muted-foreground uppercase tracking-wider">{label}</span>
              </div>
              <p className="text-lg font-medium text-foreground">{value}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="border-b mb-6">
          <div className="flex items-center">
            {[
              { key: "patterns" as const, label: "Concern Patterns", icon: BarChart3 },
              { key: "knowledge" as const, label: "Team Knowledge", icon: Brain },
            ].map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={`px-4 py-2.5 text-xs flex items-center gap-2 border-b-2 transition-colors ${
                  tab === key ? "border-foreground text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="h-3.5 w-3.5" strokeWidth={1.5} />
                {label}
              </button>
            ))}
          </div>
        </div>

        {tab === "patterns" && (
          <div>
            {sortedPatterns.length === 0 ? (
              <div className="text-center py-16 border rounded-lg">
                <RefreshCw className="h-8 w-8 text-muted-foreground/30 mx-auto mb-3" strokeWidth={1} />
                <p className="text-sm text-foreground mb-1">No patterns yet</p>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                  Complete a few reviews and approve or dismiss concerns — ReviewLens will learn your preferences automatically.
                </p>
              </div>
            ) : (
              <>
                <p className="text-xs text-muted-foreground mb-4">
                  {learningStats.suppressedCount} patterns auto-suppressed · {learningStats.highValueCount} marked high-value
                </p>
                <div className="border rounded-lg divide-y">
                  {sortedPatterns.map((p) => {
                    const sevColor = p.concern_severity === "critical" ? "text-destructive" :
                      p.concern_severity === "warning" ? "text-warning" : "text-success";
                    return (
                      <div key={p.id} className={`px-4 py-3 flex items-start gap-3 ${p.status === "suppressed" ? "opacity-60" : ""}`}>
                        <div className="shrink-0 mt-1">
                          {p.status === "suppressed" ? (
                            <XCircle className="h-3.5 w-3.5 text-warning" strokeWidth={1.5} />
                          ) : p.status === "high-value" ? (
                            <CheckCircle className="h-3.5 w-3.5 text-success" strokeWidth={1.5} />
                          ) : (
                            <RefreshCw className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={1.5} />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className={`text-[9px] uppercase tracking-wider ${sevColor}`}>{p.concern_severity}</span>
                            <span className={`text-[9px] px-1.5 py-px rounded-full ${
                              p.status === "suppressed" ? "bg-warning/10 text-warning" :
                              p.status === "high-value" ? "bg-success/10 text-success" :
                              "bg-secondary text-muted-foreground"
                            }`}>
                              {p.status === "suppressed" ? "Auto-suppressed" :
                               p.status === "high-value" ? "High-value" : "Learning"}
                            </span>
                          </div>
                          <p className="text-xs text-foreground">{p.concern_title}</p>
                          <p className="text-[10px] text-muted-foreground font-mono mt-0.5">{p.repo}</p>
                        </div>
                        <div className="shrink-0 text-right">
                          <div className="flex items-center gap-3 text-[10px]">
                            <span className="text-success flex items-center gap-0.5">
                              <TrendingUp className="h-2.5 w-2.5" strokeWidth={1.5} />
                              {p.times_approved}
                            </span>
                            <span className="text-destructive flex items-center gap-0.5">
                              <TrendingDown className="h-2.5 w-2.5" strokeWidth={1.5} />
                              {p.times_dismissed}
                            </span>
                            {p.times_edited > 0 && (
                              <span className="text-muted-foreground flex items-center gap-0.5">
                                <Pencil className="h-2.5 w-2.5" strokeWidth={1.5} />
                                {p.times_edited}
                              </span>
                            )}
                          </div>
                          <p className="text-[9px] text-muted-foreground/60 mt-0.5">
                            {Math.round(p.approveRate * 100)}% approved
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        )}

        {tab === "knowledge" && (
          <div>
            {edits.length === 0 ? (
              <div className="text-center py-16 border rounded-lg">
                <Brain className="h-8 w-8 text-muted-foreground/30 mx-auto mb-3" strokeWidth={1} />
                <p className="text-sm text-foreground mb-1">No comment edits yet</p>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                  When {org ? "team members edit" : "you edit"} AI-generated comments before posting, ReviewLens captures the
                  before/after to learn {org ? "your team's" : "your"} writing style and standards.
                </p>
              </div>
            ) : (
              <>
                <p className="text-xs text-muted-foreground mb-4">
                  {edits.length} edits captured across {learningStats.uniqueEditPatterns} concern types — the AI learns from these
                </p>
                <div className="space-y-3">
                  {edits.map((edit) => {
                    const sevColor = edit.concern_severity === "critical" ? "text-destructive" :
                      edit.concern_severity === "warning" ? "text-warning" : "text-success";
                    return (
                      <div key={edit.id} className="border rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-3">
                          <span className={`text-[9px] uppercase tracking-wider ${sevColor}`}>{edit.concern_severity}</span>
                          <span className="text-xs text-foreground font-medium">{edit.concern_title}</span>
                          <span className="text-[10px] text-muted-foreground font-mono ml-auto">{edit.repo}</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="rounded border p-3 bg-destructive/5">
                            <p className="text-[9px] text-destructive uppercase tracking-wider mb-1.5 flex items-center gap-1">
                              <XCircle className="h-2.5 w-2.5" strokeWidth={1.5} /> AI wrote
                            </p>
                            <p className="text-[11px] text-foreground/70 leading-relaxed">{edit.original_comment}</p>
                          </div>
                          <div className="rounded border p-3 bg-success/5">
                            <p className="text-[9px] text-success uppercase tracking-wider mb-1.5 flex items-center gap-1">
                              <CheckCircle className="h-2.5 w-2.5" strokeWidth={1.5} /> Dev changed to
                            </p>
                            <p className="text-[11px] text-foreground leading-relaxed">{edit.edited_comment}</p>
                          </div>
                        </div>
                        {edit.concern_file && (
                          <p className="text-[10px] text-muted-foreground font-mono mt-2">{edit.concern_file}</p>
                        )}
                        <p className="text-[9px] text-muted-foreground/50 mt-1">
                          {new Date(edit.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
