import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { AppHeader } from "@/components/AppHeader";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import {
  ArrowLeft, BarChart3, TrendingDown, TrendingUp, Shield, AlertTriangle,
  Clock, FileCode, Loader2, Target, Zap
} from "lucide-react";

interface ReviewSession {
  id: string;
  repo: string;
  pr_number: number;
  pr_title: string | null;
  summary: string | null;
  risk_level: string | null;
  concerns_total: number;
  concerns_approved: number;
  concerns_dismissed: number;
  concerns_edited: number;
  comments_posted: number;
  created_at: string;
}

interface ReviewOutcome {
  id: string;
  repo: string;
  concern_severity: string;
  concern_title: string;
  concern_file: string | null;
  action: string;
  created_at: string;
}

export default function InsightsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [sessions, setSessions] = useState<ReviewSession[]>([]);
  const [outcomes, setOutcomes] = useState<ReviewOutcome[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<"7d" | "30d" | "all">("30d");

  useEffect(() => {
    if (user) loadData();
  }, [user]);

  const loadData = async () => {
    const [sessionsRes, outcomesRes] = await Promise.all([
      supabase.from("review_sessions").select("*").eq("user_id", user!.id).order("created_at", { ascending: false }),
      supabase.from("review_outcomes").select("*").eq("user_id", user!.id).order("created_at", { ascending: false }),
    ]);
    setSessions((sessionsRes.data as ReviewSession[]) || []);
    setOutcomes((outcomesRes.data as ReviewOutcome[]) || []);
    setLoading(false);
  };

  const filteredSessions = useMemo(() => {
    if (timeRange === "all") return sessions;
    const days = timeRange === "7d" ? 7 : 30;
    const cutoff = new Date(Date.now() - days * 86400000).toISOString();
    return sessions.filter((s) => s.created_at >= cutoff);
  }, [sessions, timeRange]);

  const filteredOutcomes = useMemo(() => {
    if (timeRange === "all") return outcomes;
    const days = timeRange === "7d" ? 7 : 30;
    const cutoff = new Date(Date.now() - days * 86400000).toISOString();
    return outcomes.filter((o) => o.created_at >= cutoff);
  }, [outcomes, timeRange]);

  // Compute stats
  const stats = useMemo(() => {
    const totalReviews = filteredSessions.length;
    const totalConcerns = filteredOutcomes.length;
    const approved = filteredOutcomes.filter((o) => o.action === "approved").length;
    const dismissed = filteredOutcomes.filter((o) => o.action === "dismissed").length;
    const edited = filteredOutcomes.filter((o) => o.action === "edited").length;
    const approvalRate = totalConcerns > 0 ? Math.round((approved / totalConcerns) * 100) : 0;
    const dismissRate = totalConcerns > 0 ? Math.round((dismissed / totalConcerns) * 100) : 0;
    
    // Avg concerns per review
    const avgConcerns = totalReviews > 0
      ? (filteredSessions.reduce((sum, s) => sum + (s.concerns_total || 0), 0) / totalReviews).toFixed(1)
      : "0";

    // Comments posted
    const commentsPosted = filteredSessions.reduce((sum, s) => sum + (s.comments_posted || 0), 0);

    // Time saved estimate (5 min per approved concern)
    const timeSavedMin = approved * 5;

    // Risk breakdown
    const highRisk = filteredSessions.filter((s) => s.risk_level === "high").length;
    const medRisk = filteredSessions.filter((s) => s.risk_level === "medium").length;
    const lowRisk = filteredSessions.filter((s) => s.risk_level === "low").length;

    return {
      totalReviews, totalConcerns, approved, dismissed, edited,
      approvalRate, dismissRate, avgConcerns, commentsPosted,
      timeSavedMin, highRisk, medRisk, lowRisk,
    };
  }, [filteredSessions, filteredOutcomes]);

  // Top repos by review count
  const topRepos = useMemo(() => {
    const counts: Record<string, { reviews: number; concerns: number; highRisk: number }> = {};
    filteredSessions.forEach((s) => {
      if (!counts[s.repo]) counts[s.repo] = { reviews: 0, concerns: 0, highRisk: 0 };
      counts[s.repo].reviews++;
      counts[s.repo].concerns += s.concerns_total || 0;
      if (s.risk_level === "high") counts[s.repo].highRisk++;
    });
    return Object.entries(counts)
      .sort((a, b) => b[1].reviews - a[1].reviews)
      .slice(0, 5);
  }, [filteredSessions]);

  // Most dismissed concern types (shows AI miscalibration)
  const topDismissed = useMemo(() => {
    const dismissed = filteredOutcomes.filter((o) => o.action === "dismissed");
    const counts: Record<string, number> = {};
    dismissed.forEach((o) => {
      counts[o.concern_title] = (counts[o.concern_title] || 0) + 1;
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
  }, [filteredOutcomes]);

  // Most approved concern types (what matters to this user)
  const topApproved = useMemo(() => {
    const approved = filteredOutcomes.filter((o) => o.action === "approved" || o.action === "edited");
    const counts: Record<string, number> = {};
    approved.forEach((o) => {
      counts[o.concern_title] = (counts[o.concern_title] || 0) + 1;
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
  }, [filteredOutcomes]);

  // Severity breakdown
  const severityBreakdown = useMemo(() => {
    const counts = { critical: 0, warning: 0, suggestion: 0, note: 0 };
    filteredOutcomes.forEach((o) => {
      if (o.concern_severity in counts) counts[o.concern_severity as keyof typeof counts]++;
    });
    return counts;
  }, [filteredOutcomes]);

  // Recent reviews
  const recentReviews = filteredSessions.slice(0, 8);

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
            <button onClick={() => navigate("/app")} className="text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="h-4 w-4" strokeWidth={1.5} />
            </button>
            <div>
              <h1 className="text-lg font-medium tracking-tight text-foreground">Review Intelligence</h1>
              <p className="text-xs text-muted-foreground">Patterns and insights from your code reviews</p>
            </div>
          </div>
          <div className="flex items-center gap-1 border rounded-md overflow-hidden">
            {(["7d", "30d", "all"] as const).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`text-[11px] px-3 py-1.5 transition-colors ${
                  timeRange === range ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {range === "7d" ? "7 days" : range === "30d" ? "30 days" : "All time"}
              </button>
            ))}
          </div>
        </div>

        {sessions.length === 0 ? (
          <div className="text-center py-20 border rounded-lg">
            <BarChart3 className="h-8 w-8 text-muted-foreground/30 mx-auto mb-3" strokeWidth={1} />
            <p className="text-sm text-foreground mb-1">No review data yet</p>
            <p className="text-xs text-muted-foreground mb-4">Complete your first AI-powered review to start seeing insights.</p>
            <button onClick={() => navigate("/app")} className="text-xs px-4 py-2 rounded-md bg-foreground text-background hover:bg-foreground/90 transition-colors">
              Go to review queue
            </button>
          </div>
        ) : (
          <>
            {/* Key metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
              {[
                { label: "Reviews completed", value: stats.totalReviews, icon: FileCode },
                { label: "Comments posted", value: stats.commentsPosted, icon: Target },
                { label: "AI approval rate", value: `${stats.approvalRate}%`, icon: stats.approvalRate > 50 ? TrendingUp : TrendingDown },
                { label: "Est. time saved", value: stats.timeSavedMin > 60 ? `${Math.round(stats.timeSavedMin / 60)}h` : `${stats.timeSavedMin}m`, icon: Zap },
              ].map(({ label, value, icon: Icon }) => (
                <div key={label} className="border rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Icon className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={1.5} />
                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</span>
                  </div>
                  <p className="text-xl font-medium text-foreground">{value}</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
              {/* Risk breakdown */}
              <div className="border rounded-lg p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Shield className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={1.5} />
                  <span className="text-xs font-medium text-foreground">Risk Distribution</span>
                </div>
                <div className="space-y-3">
                  {[
                    { label: "High risk", count: stats.highRisk, color: "bg-destructive" },
                    { label: "Medium risk", count: stats.medRisk, color: "bg-warning" },
                    { label: "Low risk", count: stats.lowRisk, color: "bg-success" },
                  ].map(({ label, count, color }) => (
                    <div key={label} className="flex items-center gap-3">
                      <span className={`h-2 w-2 rounded-full ${color}`} />
                      <span className="text-xs text-muted-foreground flex-1">{label}</span>
                      <span className="text-xs font-medium text-foreground">{count}</span>
                      <div className="w-24 h-1.5 bg-secondary rounded-full overflow-hidden">
                        <div
                          className={`h-full ${color} rounded-full transition-all`}
                          style={{ width: `${stats.totalReviews > 0 ? (count / stats.totalReviews) * 100 : 0}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Severity breakdown */}
              <div className="border rounded-lg p-5">
                <div className="flex items-center gap-2 mb-4">
                  <AlertTriangle className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={1.5} />
                  <span className="text-xs font-medium text-foreground">Concern Severity</span>
                </div>
                <div className="space-y-3">
                  {[
                    { label: "Critical", count: severityBreakdown.critical, color: "bg-destructive" },
                    { label: "Warning", count: severityBreakdown.warning, color: "bg-warning" },
                    { label: "Suggestion", count: severityBreakdown.suggestion, color: "bg-success" },
                    { label: "Note", count: severityBreakdown.note, color: "bg-muted-foreground" },
                  ].map(({ label, count, color }) => (
                    <div key={label} className="flex items-center gap-3">
                      <span className={`h-2 w-2 rounded-full ${color}`} />
                      <span className="text-xs text-muted-foreground flex-1">{label}</span>
                      <span className="text-xs font-medium text-foreground">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
              {/* Top approved concerns */}
              <div className="border rounded-lg p-5">
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp className="h-3.5 w-3.5 text-success" strokeWidth={1.5} />
                  <span className="text-xs font-medium text-foreground">What You Care About</span>
                </div>
                <p className="text-[10px] text-muted-foreground mb-3">Most frequently approved AI concerns</p>
                {topApproved.length === 0 ? (
                  <p className="text-xs text-muted-foreground/60">No data yet</p>
                ) : (
                  <div className="space-y-2">
                    {topApproved.map(([title, count]) => (
                      <div key={title} className="flex items-center justify-between gap-2">
                        <span className="text-xs text-foreground truncate">{title}</span>
                        <span className="text-[10px] text-muted-foreground shrink-0">{count}×</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Top dismissed (AI miscalibration) */}
              <div className="border rounded-lg p-5">
                <div className="flex items-center gap-2 mb-4">
                  <TrendingDown className="h-3.5 w-3.5 text-destructive" strokeWidth={1.5} />
                  <span className="text-xs font-medium text-foreground">AI Noise</span>
                </div>
                <p className="text-[10px] text-muted-foreground mb-3">Most frequently dismissed — candidates for custom rules</p>
                {topDismissed.length === 0 ? (
                  <p className="text-xs text-muted-foreground/60">No data yet</p>
                ) : (
                  <div className="space-y-2">
                    {topDismissed.map(([title, count]) => (
                      <div key={title} className="flex items-center justify-between gap-2">
                        <span className="text-xs text-foreground truncate">{title}</span>
                        <span className="text-[10px] text-muted-foreground shrink-0">{count}×</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Top repos */}
            {topRepos.length > 0 && (
              <div className="border rounded-lg p-5 mb-8">
                <div className="flex items-center gap-2 mb-4">
                  <BarChart3 className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={1.5} />
                  <span className="text-xs font-medium text-foreground">Repository Hotspots</span>
                </div>
                <div className="space-y-3">
                  {topRepos.map(([repo, data]) => (
                    <div key={repo} className="flex items-center gap-4">
                      <span className="text-xs font-mono text-foreground flex-1 truncate">{repo}</span>
                      <span className="text-[10px] text-muted-foreground">{data.reviews} reviews</span>
                      <span className="text-[10px] text-muted-foreground">{data.concerns} concerns</span>
                      {data.highRisk > 0 && (
                        <span className="text-[10px] text-destructive">{data.highRisk} high risk</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recent reviews */}
            <div className="border rounded-lg overflow-hidden">
              <div className="px-4 py-3 border-b flex items-center gap-2">
                <Clock className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={1.5} />
                <span className="text-xs font-medium text-foreground">Recent Reviews</span>
              </div>
              <div className="divide-y">
                {recentReviews.map((s) => {
                  const riskColor = s.risk_level === "high" ? "text-destructive" : s.risk_level === "medium" ? "text-warning" : "text-success";
                  return (
                    <div key={s.id} className="px-4 py-3 flex items-center gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-[11px] font-mono text-muted-foreground">{s.repo} #{s.pr_number}</span>
                          <span className={`text-[9px] uppercase tracking-wider font-medium ${riskColor}`}>{s.risk_level}</span>
                        </div>
                        {s.pr_title && <p className="text-xs text-foreground truncate">{s.pr_title}</p>}
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-[10px] text-muted-foreground">
                          {s.comments_posted > 0 ? `${s.comments_posted} posted` : "No comments"}
                        </p>
                        <p className="text-[10px] text-muted-foreground/60">
                          {new Date(s.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
