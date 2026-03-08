import { AISummary } from "@/types/review";
import { X, AlertTriangle, Info } from "lucide-react";

interface AISummaryPanelProps {
  summary: AISummary;
  onClose: () => void;
}

const riskLabel = { low: "Low risk", medium: "Medium risk", high: "High risk" };

export function AISummaryPanel({ summary, onClose }: AISummaryPanelProps) {
  return (
    <div className="border-b animate-fade-in">
      <div className="p-4 max-w-none">
        <div className="flex items-center justify-between mb-2.5">
          <span className="text-xs font-medium text-foreground tracking-tight">Summary</span>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="h-3.5 w-3.5" strokeWidth={1.5} />
          </button>
        </div>

        <p className="text-xs text-muted-foreground leading-relaxed mb-3">{summary.summary}</p>

        <div className="flex items-center gap-3 mb-3 text-[11px]">
          <span className={`${
            summary.riskLevel === "high" ? "text-destructive" : summary.riskLevel === "medium" ? "text-warning" : "text-success"
          }`}>
            {riskLabel[summary.riskLevel]}
          </span>
          <span className="text-muted-foreground">·</span>
          {summary.keyChanges.map((c) => (
            <span key={c.category} className="text-muted-foreground">{c.category}</span>
          ))}
        </div>

        {summary.missingElements.length > 0 && (
          <div className="space-y-1 pt-2 border-t">
            {summary.missingElements.map((el, i) => (
              <div key={i} className="flex items-start gap-2 text-[11px] text-muted-foreground py-0.5">
                {el.type === "warning" ? (
                  <AlertTriangle className="h-3 w-3 text-warning shrink-0 mt-0.5" strokeWidth={1.5} />
                ) : (
                  <Info className="h-3 w-3 shrink-0 mt-0.5" strokeWidth={1.5} />
                )}
                <span>{el.message} <span className="font-mono text-[10px] text-muted-foreground/60">{el.file}{el.line ? `:${el.line}` : ""}</span></span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
