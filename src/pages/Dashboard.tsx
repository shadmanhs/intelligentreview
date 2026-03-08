import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppHeader } from "@/components/AppHeader";
import { mockPRs } from "@/data/mockData";
import { Clock, ArrowRight, AlertTriangle, Shield, ChevronRight } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

const riskDot = { high: "bg-destructive", medium: "bg-warning", low: "bg-success" };
const riskText = { high: "text-destructive", medium: "text-warning", low: "text-success" };

export default function Dashboard() {
  const navigate = useNavigate();
  // Sort by risk (high first), then by updated time
  const sorted = [...mockPRs].sort((a, b) => {
    const riskOrder = { high: 0, medium: 1, low: 2 };
    if (riskOrder[a.riskLevel] !== riskOrder[b.riskLevel]) return riskOrder[a.riskLevel] - riskOrder[b.riskLevel];
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });

  const totalMinutes = sorted.reduce((sum, pr) => sum + pr.estimatedMinutes, 0);
  const highRiskCount = sorted.filter((pr) => pr.riskLevel === "high").length;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <AppHeader />
      <main className="flex-1 max-w-2xl mx-auto w-full px-6 py-10">
        <div className="mb-8">
          <h1 className="text-lg font-medium tracking-tight text-foreground mb-1">Your review queue</h1>
          <p className="text-sm text-muted-foreground">
            {sorted.length} PRs · ~{totalMinutes} min total
            {highRiskCount > 0 && (
              <span className="text-destructive ml-2">· {highRiskCount} need attention</span>
            )}
          </p>
        </div>

        <div className="space-y-1">
          {sorted.map((pr, i) => (
            <button
              key={pr.id}
              onClick={() => navigate(`/review/${pr.id}`)}
              className="w-full text-left px-4 py-4 rounded-lg hover:bg-secondary/60 transition-colors group flex items-center gap-4"
            >
              {/* Risk indicator */}
              <div className="flex flex-col items-center gap-1 shrink-0 w-8">
                <span className={`h-2 w-2 rounded-full ${riskDot[pr.riskLevel]}`} />
                <span className={`text-[9px] uppercase tracking-wider font-medium ${riskText[pr.riskLevel]}`}>
                  {pr.riskLevel}
                </span>
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-[11px] text-muted-foreground font-mono">{pr.repo}</span>
                  <span className="text-[11px] text-muted-foreground">#{pr.number}</span>
                  {pr.draft && (
                    <span className="text-[9px] text-muted-foreground border rounded px-1 py-px uppercase tracking-wider">draft</span>
                  )}
                </div>
                <p className="text-sm font-medium text-foreground truncate">{pr.title}</p>
                <div className="flex items-center gap-3 mt-1 text-[11px] text-muted-foreground">
                  <span>{pr.author}</span>
                  <span>+{pr.additions} −{pr.deletions}</span>
                  <span>{pr.changedFiles} files</span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" strokeWidth={1.5} />
                    {formatDistanceToNow(new Date(pr.updatedAt), { addSuffix: true })}
                  </span>
                </div>
              </div>

              {/* Time estimate + action */}
              <div className="flex items-center gap-3 shrink-0">
                <span className="text-xs text-muted-foreground">~{pr.estimatedMinutes} min</span>
                <ChevronRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-foreground transition-colors" strokeWidth={1.5} />
              </div>
            </button>
          ))}
        </div>
      </main>
    </div>
  );
}
