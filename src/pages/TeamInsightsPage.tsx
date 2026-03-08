import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { AppHeader } from "@/components/AppHeader";
import { useAuth } from "@/hooks/useAuth";
import { useOrganization } from "@/hooks/useOrganization";
import { supabase } from "@/integrations/supabase/client";
import {
  ArrowLeft, BarChart3, Users, Loader2, Zap, FileCode, Target,
  TrendingUp, Shield, Clock, DollarSign
} from "lucide-react";

interface MemberStats {
  userId: string;
  name: string;
  avatar: string | null;
  reviews: number;
  commentsPosted: number;
  approvalRate: number;
  highRiskCaught: number;
  timeSaved: number;
}

export default function TeamInsightsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { org, members, loading: orgLoading } = useOrganization();
  const [sessions, setSessions] = useState<any[]>([]);
  const [outcomes, setOutcomes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<"7d" | "30d" | "all">("30d");

  useEffect(() => {
    if (org && members.length > 0) loadTeamData();
  }, [org, members]);

  const loadTeamData = async () => {
    const userIds = members.map((m) => m.user_id);

    const [sessionsRes, outcomesRes] = await Promise.all([
      supabase.from("review_sessions").select("*").in("user_id", userIds).order("created_at", { ascending: false }),
      supabase.from("review_outcomes").select("*").in("user_id", userIds).order("created_at", { ascending: false }),
    ]);

    setSessions(sessionsRes.data || []);
    setOutcomes(outcomesRes.data || []);
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

  // Team totals
  const teamStats = useMemo(() => {
    const totalReviews = filteredSessions.length;
    const commentsPosted = filteredSessions.reduce((s: number, r: any) => s + (r.comments_posted || 0), 0);
    const approved = filteredOutcomes.filter((o: any) => o.action === "approved").length;
    const totalConcerns = filteredOutcomes.length;
    const approvalRate = totalConcerns > 0 ? Math.round((approved / totalConcerns) * 100) : 0;
    const timeSavedMin = approved * 5;
    const highRisk = filteredSessions.filter((s: any) => s.risk_level === "high").length;
    const costPerSeat = 25;
    const roi = members.length > 0 ? Math.round((timeSavedMin / 60) * 80 / (members.length * costPerSeat) * 100) : 0;

    return { totalReviews, commentsPosted, approvalRate, timeSavedMin, highRisk, roi };
  }, [filteredSessions, filteredOutcomes, members]);

  // Per-member breakdown
  const memberStats: MemberStats[] = useMemo(() => {
    return members.map((m) => {
      const mSessions = filteredSessions.filter((s: any) => s.user_id === m.user_id);
      const mOutcomes = filteredOutcomes.filter((o: any) => o.user_id === m.user_id);
      const approved = mOutcomes.filter((o: any) => o.action === "approved").length;
      const total = mOutcomes.length;

      return {
        userId: m.user_id,
        name: m.profile?.display_name || m.profile?.email || "Unknown",
        avatar: m.profile?.avatar_url || null,
        reviews: mSessions.length,
        commentsPosted: mSessions.reduce((s: number, r: any) => s + (r.comments_posted || 0), 0),
        approvalRate: total > 0 ? Math.round((approved / total) * 100) : 0,
        highRiskCaught: mSessions.filter((s: any) => s.risk_level === "high").length,
        timeSaved: approved * 5,
      };
    }).sort((a, b) => b.reviews - a.reviews);
  }, [members, filteredSessions, filteredOutcomes]);

  // Top repos across team
  const topRepos = useMemo(() => {
    const counts: Record<string, { reviews: number; highRisk: number; reviewers: Set<string> }> = {};
    filteredSessions.forEach((s: any) => {
      if (!counts[s.repo]) counts[s.repo] = { reviews: 0, highRisk: 0, reviewers: new Set() };
      counts[s.repo].reviews++;
      counts[s.repo].reviewers.add(s.user_id);
      if (s.risk_level === "high") counts[s.repo].highRisk++;
    });
    return Object.entries(counts)
      .sort((a, b) => b[1].reviews - a[1].reviews)
      .slice(0, 6)
      .map(([repo, data]) => ({ repo, ...data, reviewerCount: data.reviewers.size }));
  }, [filteredSessions]);

  if (orgLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <AppHeader showUser />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-4 w-4 text-muted-foreground animate-spin" />
        </div>
      </div>
    );
  }

  if (!org) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <AppHeader showUser />
        <main className="flex-1 max-w-4xl mx-auto w-full px-6 py-8">
          <div className="text-center py-16 border rounded-lg">
            <Users className="h-8 w-8 text-muted-foreground/30 mx-auto mb-3" strokeWidth={1} />
            <p className="text-sm text-foreground mb-1">No team set up</p>
            <p className="text-xs text-muted-foreground mb-4">Create a team first to see team-wide analytics.</p>
            <button onClick={() => navigate("/app/team")} className="text-xs px-4 py-2 rounded-md bg-foreground text-background hover:bg-foreground/90 transition-colors">
              Set up team
            </button>
          </div>
        </main>
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
              <h1 className="text-lg font-medium tracking-tight text-foreground">Team Analytics — {org.name}</h1>
              <p className="text-xs text-muted-foreground">{members.length} members · Review patterns across your team</p>
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

        {/* Team metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          {[
            { label: "Team reviews", value: teamStats.totalReviews, icon: FileCode },
            { label: "Comments posted", value: teamStats.commentsPosted, icon: Target },
            { label: "AI approval rate", value: `${teamStats.approvalRate}%`, icon: TrendingUp },
            { label: "High risk caught", value: teamStats.highRisk, icon: Shield },
            { label: "Time saved", value: teamStats.timeSavedMin > 60 ? `${Math.round(teamStats.timeSavedMin / 60)}h` : `${teamStats.timeSavedMin}m`, icon: Zap },
            { label: "ROI", value: `${teamStats.roi}%`, icon: DollarSign },
          ].map(({ label, value, icon: Icon }) => (
            <div key={label} className="border rounded-lg p-4">
              <div className="flex items-center gap-1.5 mb-2">
                <Icon className="h-3 w-3 text-muted-foreground" strokeWidth={1.5} />
                <span className="text-[9px] text-muted-foreground uppercase tracking-wider">{label}</span>
              </div>
              <p className="text-lg font-medium text-foreground">{value}</p>
            </div>
          ))}
        </div>

        {/* Member leaderboard */}
        <div className="border rounded-lg mb-8">
          <div className="px-4 py-3 border-b flex items-center gap-2">
            <Users className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={1.5} />
            <span className="text-xs font-medium text-foreground">Member Activity</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-[10px] text-muted-foreground uppercase tracking-wider border-b">
                  <th className="text-left px-4 py-2 font-normal">Engineer</th>
                  <th className="text-right px-4 py-2 font-normal">Reviews</th>
                  <th className="text-right px-4 py-2 font-normal">Comments</th>
                  <th className="text-right px-4 py-2 font-normal">AI Approval</th>
                  <th className="text-right px-4 py-2 font-normal">High Risk</th>
                  <th className="text-right px-4 py-2 font-normal">Time Saved</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {memberStats.map((m) => (
                  <tr key={m.userId} className="hover:bg-secondary/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {m.avatar ? (
                          <img src={m.avatar} alt="" className="h-5 w-5 rounded-full" />
                        ) : (
                          <div className="h-5 w-5 rounded-full bg-secondary flex items-center justify-center">
                            <span className="text-[8px] text-muted-foreground font-medium">{m.name[0].toUpperCase()}</span>
                          </div>
                        )}
                        <span className="text-xs text-foreground">{m.name}</span>
                      </div>
                    </td>
                    <td className="text-right px-4 py-3 text-xs text-foreground">{m.reviews}</td>
                    <td className="text-right px-4 py-3 text-xs text-foreground">{m.commentsPosted}</td>
                    <td className="text-right px-4 py-3 text-xs text-foreground">{m.approvalRate}%</td>
                    <td className="text-right px-4 py-3 text-xs text-foreground">{m.highRiskCaught}</td>
                    <td className="text-right px-4 py-3 text-xs text-muted-foreground">{m.timeSaved}m</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Repo hotspots */}
        {topRepos.length > 0 && (
          <div className="border rounded-lg mb-8">
            <div className="px-4 py-3 border-b flex items-center gap-2">
              <BarChart3 className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={1.5} />
              <span className="text-xs font-medium text-foreground">Repository Hotspots</span>
            </div>
            <div className="divide-y">
              {topRepos.map((r) => (
                <div key={r.repo} className="px-4 py-3 flex items-center gap-4">
                  <span className="text-xs font-mono text-foreground flex-1 truncate">{r.repo}</span>
                  <span className="text-[10px] text-muted-foreground">{r.reviews} reviews</span>
                  <span className="text-[10px] text-muted-foreground">{r.reviewerCount} reviewer{r.reviewerCount !== 1 ? "s" : ""}</span>
                  {r.highRisk > 0 && (
                    <span className="text-[10px] text-destructive">{r.highRisk} high risk</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ROI summary */}
        <div className="border-2 border-foreground/10 rounded-lg p-6">
          <div className="flex items-center gap-2 mb-3">
            <DollarSign className="h-4 w-4 text-foreground" strokeWidth={1.5} />
            <span className="text-sm font-medium text-foreground">ROI Summary</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
            <div>
              <p className="text-2xl font-medium text-foreground">
                {teamStats.timeSavedMin > 60 ? `${Math.round(teamStats.timeSavedMin / 60)}h` : `${teamStats.timeSavedMin}m`}
              </p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">Engineering time saved</p>
            </div>
            <div>
              <p className="text-2xl font-medium text-foreground">
                ${Math.round((teamStats.timeSavedMin / 60) * 80)}
              </p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">Value at $80/hr loaded</p>
            </div>
            <div>
              <p className="text-2xl font-medium text-foreground">
                ${members.length * 25}
              </p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">Monthly cost</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
