import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppHeader } from "@/components/AppHeader";
import { mockPRs } from "@/data/mockData";
import { GitPullRequest, Search, Clock, Plus, Minus, FileCode } from "lucide-react";
import { Input } from "@/components/ui/input";
import { formatDistanceToNow } from "date-fns";

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
      <main className="flex-1 max-w-3xl mx-auto w-full px-6 py-10">
        <h1 className="text-lg font-medium tracking-tight text-foreground mb-1">Pull Requests</h1>
        <p className="text-sm text-muted-foreground mb-8">Review code with context and AI-powered insights.</p>

        <div className="flex items-center gap-3 mb-6">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" strokeWidth={1.5} />
            <Input
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 h-8 text-sm bg-transparent border-border"
            />
          </div>
          <div className="flex items-center gap-0.5 text-xs text-muted-foreground">
            {(["all", "review", "draft"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-2.5 py-1 rounded capitalize transition-colors ${
                  filter === f ? "bg-secondary text-foreground" : "hover:text-foreground"
                }`}
              >
                {f === "review" ? "Needs review" : f}
              </button>
            ))}
          </div>
        </div>

        <div className="border rounded-lg divide-y overflow-hidden">
          {filtered.map((pr) => (
            <button
              key={pr.id}
              onClick={() => navigate(`/review/${pr.id}`)}
              className="w-full text-left px-4 py-3.5 hover:bg-secondary/50 transition-colors group"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <GitPullRequest className="h-3.5 w-3.5 text-success shrink-0" strokeWidth={1.5} />
                    <span className="text-xs text-muted-foreground font-mono">{pr.repo} #{pr.number}</span>
                    {pr.draft && (
                      <span className="text-[10px] text-muted-foreground border rounded px-1.5 py-0">draft</span>
                    )}
                  </div>
                  <h3 className="text-sm font-medium text-foreground group-hover:text-foreground/80 transition-colors truncate">
                    {pr.title}
                  </h3>
                  <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                    <span>{pr.author}</span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" strokeWidth={1.5} />
                      {formatDistanceToNow(new Date(pr.updatedAt), { addSuffix: true })}
                    </span>
                    {pr.labels.map((label) => (
                      <span key={label} className="text-muted-foreground/70">{label}</span>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground shrink-0 pt-1 font-mono">
                  <span className="text-success">+{pr.additions}</span>
                  <span className="text-destructive">−{pr.deletions}</span>
                  <span className="flex items-center gap-1">
                    <FileCode className="h-3 w-3" strokeWidth={1.5} />{pr.changedFiles}
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
