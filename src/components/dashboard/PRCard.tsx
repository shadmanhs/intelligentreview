import { Clock, ChevronRight, FileCode } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface PRCardProps {
  pr: any;
  isSelected: boolean;
  onClick: () => void;
}

export function PRCard({ pr, isSelected, onClick }: PRCardProps) {
  return (
    <button
      onClick={onClick}
      data-pr-id={pr.id}
      className={`w-full text-left px-4 py-3.5 hover:bg-secondary/50 transition-colors group ${
        isSelected ? "bg-secondary/70 ring-1 ring-foreground/10" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-[11px] text-muted-foreground font-mono">{pr.repo} #{pr.number}</span>
            {pr.draft && (
              <span className="text-[9px] text-muted-foreground border rounded px-1 py-px uppercase tracking-wider">draft</span>
            )}
            {pr.labels?.length > 0 && pr.labels.slice(0, 2).map((label: string) => (
              <span key={label} className="text-[9px] text-muted-foreground bg-secondary rounded px-1.5 py-px">
                {label}
              </span>
            ))}
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
        <div className="flex items-center gap-1.5 shrink-0 mt-2">
          <span className="text-[9px] text-muted-foreground/50 opacity-0 group-hover:opacity-100 transition-opacity">
            Enter ↵
          </span>
          <ChevronRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-foreground transition-colors" strokeWidth={1.5} />
        </div>
      </div>
    </button>
  );
}
