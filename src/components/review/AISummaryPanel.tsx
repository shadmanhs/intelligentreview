import { AISummary } from "@/types/review";
import { X, AlertTriangle, Info, Sparkles, ShieldAlert } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface AISummaryPanelProps {
  summary: AISummary;
  onClose: () => void;
}

const riskColors = {
  low: "bg-success/10 text-success border-success/20",
  medium: "bg-warning/10 text-warning-foreground border-warning/20",
  high: "bg-destructive/10 text-destructive border-destructive/20",
};

export function AISummaryPanel({ summary, onClose }: AISummaryPanelProps) {
  return (
    <div className="border-b bg-card animate-fade-in">
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-xs font-medium text-foreground">AI Context Builder</span>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        <p className="text-xs text-foreground leading-relaxed mb-3">{summary.summary}</p>

        <div className="flex items-center gap-2 mb-3">
          <span className="text-[10px] text-muted-foreground">Risk:</span>
          <Badge variant="outline" className={`text-[10px] h-5 capitalize ${riskColors[summary.riskLevel]}`}>
            <ShieldAlert className="h-3 w-3 mr-1" />
            {summary.riskLevel}
          </Badge>
        </div>

        {/* Key changes */}
        <div className="flex gap-4 mb-3">
          {summary.keyChanges.map((change) => (
            <div key={change.category} className="flex-1">
              <p className="text-[10px] font-medium text-muted-foreground mb-1">{change.category}</p>
              {change.items.map((item, i) => (
                <p key={i} className="text-[10px] text-foreground leading-relaxed">• {item}</p>
              ))}
            </div>
          ))}
        </div>

        {/* Missing elements */}
        {summary.missingElements.length > 0 && (
          <div className="border-t pt-3">
            <p className="text-[10px] font-medium text-muted-foreground mb-2 flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" /> Potential Issues
            </p>
            <div className="space-y-1">
              {summary.missingElements.map((el, i) => (
                <div key={i} className={`flex items-start gap-2 text-[10px] p-1.5 rounded ${
                  el.type === "warning" ? "bg-warning/5" : el.type === "error" ? "bg-destructive/5" : "bg-info/5"
                }`}>
                  {el.type === "warning" ? (
                    <AlertTriangle className="h-3 w-3 text-warning shrink-0 mt-0.5" />
                  ) : (
                    <Info className="h-3 w-3 text-info shrink-0 mt-0.5" />
                  )}
                  <div>
                    <span className="text-foreground">{el.message}</span>
                    <span className="text-muted-foreground ml-1">
                      — {el.file}{el.line ? `:${el.line}` : ""}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
