import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppHeader } from "@/components/AppHeader";
import { mockPRs } from "@/data/mockData";
import { GitPullRequest, Search, Filter, Clock, Plus, Minus, FileCode } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";

const labelColors: Record<string, string> = {
  feature: "bg-primary/10 text-primary border-primary/20",
  bug: "bg-destructive/10 text-destructive border-destructive/20",
  critical: "bg-destructive/10 text-destructive border-destructive/20",
  security: "bg-warning/10 text-warning-foreground border-warning/20",
  refactor: "bg-muted text-muted-foreground border-border",
  auth: "bg-primary/10 text-primary border-primary/20",
  "design-system": "bg-success/10 text-success border-success/20",
};

export default function Dashboard() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "review" | "draft">("all");
  const navigate = useNavigate();

  const filtered = mockPRs.filter((pr) => {
    if (filter === "draft" && !pr.draft) return false;
    if (filter === "review" && pr.draft) return false;
    if (search && !pr.title.toLowerCase().includes(search.toLowerCase()) && !pr.repo.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <AppHeader />
      <main className="flex-1 max-w-5xl mx-auto w-full px-6 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground mb-1">Pull Requests</h1>
          <p className="text-muted-foreground text-sm">Review code with context, checklists, and AI-powered insights.</p>
        </div>

        <div className="flex items-center gap-3 mb-6">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search PRs..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-card"
            />
          </div>
          <div className="flex items-center gap-1 border rounded-md p-1 bg-card">
            {(["all", "review", "draft"] as const).map((f) => (
              <Button
                key={f}
                variant={filter === f ? "default" : "ghost"}
                size="sm"
                onClick={() => setFilter(f)}
                className="capitalize text-xs h-7 px-3"
              >
                {f === "review" ? "Needs Review" : f}
              </Button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          {filtered.map((pr, i) => (
            <button
              key={pr.id}
              onClick={() => navigate(`/review/${pr.id}`)}
              className="w-full text-left bg-card border rounded-lg p-4 hover:border-primary/30 hover:shadow-sm transition-all group animate-fade-in"
              style={{ animationDelay: `${i * 50}ms` }}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <GitPullRequest className="h-4 w-4 text-success shrink-0" />
                    <span className="text-xs text-muted-foreground font-mono">{pr.repo}</span>
                    <span className="text-xs text-muted-foreground">#{pr.number}</span>
                    {pr.draft && (
                      <Badge variant="outline" className="text-[10px] h-5 bg-muted text-muted-foreground">
                        Draft
                      </Badge>
                    )}
                  </div>
                  <h3 className="font-medium text-foreground group-hover:text-primary transition-colors truncate">
                    {pr.title}
                  </h3>
                  <div className="flex items-center gap-3 mt-2">
                    <div className="flex items-center gap-1.5">
                      <img src={pr.authorAvatar} alt={pr.author} className="h-4 w-4 rounded-full" />
                      <span className="text-xs text-muted-foreground">{pr.author}</span>
                    </div>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatDistanceToNow(new Date(pr.updatedAt), { addSuffix: true })}
                    </span>
                    <div className="flex items-center gap-2">
                      {pr.labels.map((label) => (
                        <Badge key={label} variant="outline" className={`text-[10px] h-5 ${labelColors[label] || "bg-muted text-muted-foreground"}`}>
                          {label}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-xs text-muted-foreground shrink-0">
                  <span className="flex items-center gap-1 text-success font-mono">
                    <Plus className="h-3 w-3" />{pr.additions}
                  </span>
                  <span className="flex items-center gap-1 text-destructive font-mono">
                    <Minus className="h-3 w-3" />{pr.deletions}
                  </span>
                  <span className="flex items-center gap-1">
                    <FileCode className="h-3 w-3" />{pr.changedFiles} files
                  </span>
                </div>
              </div>
            </button>
          ))}
        </div>
      </main>
    </div>
  );
}
