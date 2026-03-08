import { useState } from "react";
import { AIConcern, ConcernSeverity } from "@/types/review";
import { Check, X, Pencil, ChevronDown, ChevronUp, ExternalLink } from "lucide-react";

interface ConcernCardProps {
  concern: AIConcern;
  index: number;
  total: number;
  onApprove: (id: string) => void;
  onDismiss: (id: string) => void;
  onEdit: (id: string, newComment: string) => void;
}

const severityStyles: Record<ConcernSeverity, { dot: string; label: string; bg: string }> = {
  critical: { dot: "bg-destructive", label: "Critical", bg: "border-l-destructive" },
  warning: { dot: "bg-warning", label: "Warning", bg: "border-l-warning" },
  suggestion: { dot: "bg-success", label: "Suggestion", bg: "border-l-success" },
  note: { dot: "bg-muted-foreground", label: "Note", bg: "border-l-muted-foreground" },
};

export function ConcernCard({ concern, index, total, onApprove, onDismiss, onEdit }: ConcernCardProps) {
  const [expanded, setExpanded] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(concern.draftComment);
  const style = severityStyles[concern.severity];

  const isDone = concern.status === "approved" || concern.status === "dismissed";

  return (
    <div
      className={`border rounded-lg overflow-hidden transition-all ${style.bg} border-l-2 ${
        isDone ? "opacity-50" : ""
      }`}
    >
      {/* Header */}
      <div className="px-4 py-3 flex items-start gap-3">
        <div className="flex items-center gap-2 shrink-0 pt-0.5">
          <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{style.label}</span>
        </div>

        <div className="flex-1 min-w-0">
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-sm font-medium text-foreground text-left w-full flex items-center justify-between gap-2"
          >
            <span>{concern.title}</span>
            {expanded ? (
              <ChevronUp className="h-3.5 w-3.5 text-muted-foreground shrink-0" strokeWidth={1.5} />
            ) : (
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" strokeWidth={1.5} />
            )}
          </button>

          <div className="flex items-center gap-2 mt-1">
            <span className="text-[10px] text-muted-foreground font-mono">
              {concern.file}:{concern.lineStart}
            </span>
            <span className="text-[10px] text-muted-foreground">
              {index + 1} of {total}
            </span>
          </div>
        </div>

        {/* Status badge */}
        {isDone && (
          <span className={`text-[10px] px-2 py-0.5 rounded-full shrink-0 ${
            concern.status === "approved" ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"
          }`}>
            {concern.status === "approved" ? "Will post" : "Dismissed"}
          </span>
        )}
      </div>

      {/* Expandable body */}
      {expanded && !isDone && (
        <div className="px-4 pb-4 space-y-3 animate-fade-in">
          {/* Why this matters */}
          <p className="text-xs text-muted-foreground leading-relaxed">{concern.explanation}</p>

          {/* Code snippet */}
          <div className="bg-code-bg rounded border p-3 overflow-x-auto">
            <pre className="text-[11px] font-mono text-foreground/80 leading-relaxed whitespace-pre-wrap">
              {concern.codeSnippet}
            </pre>
          </div>

          {/* Draft comment */}
          <div className="border rounded p-3 bg-background">
            <p className="text-[10px] text-muted-foreground mb-1.5 uppercase tracking-wider">Draft comment</p>
            {editing ? (
              <>
                <textarea
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  className="w-full bg-transparent border rounded p-2 outline-none resize-none text-xs text-foreground min-h-[60px] focus:border-foreground/30 transition-colors"
                  autoFocus
                />
                <div className="flex justify-end gap-2 mt-2">
                  <button
                    onClick={() => { setEditing(false); setEditText(concern.draftComment); }}
                    className="text-[11px] text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => { onEdit(concern.id, editText); setEditing(false); }}
                    className="text-[11px] px-2.5 py-1 rounded bg-foreground text-background hover:bg-foreground/90 transition-colors"
                  >
                    Save
                  </button>
                </div>
              </>
            ) : (
              <p className="text-xs text-foreground leading-relaxed">{concern.draftComment}</p>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => setEditing(true)}
              className="text-[11px] text-muted-foreground hover:text-foreground flex items-center gap-1.5 transition-colors"
            >
              <Pencil className="h-3 w-3" strokeWidth={1.5} /> Edit comment
            </button>
            <div className="flex items-center gap-2">
              <button
                onClick={() => onDismiss(concern.id)}
                className="text-[11px] px-3 py-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
              >
                Dismiss
              </button>
              <button
                onClick={() => onApprove(concern.id)}
                className="text-[11px] px-3 py-1.5 rounded bg-foreground text-background hover:bg-foreground/90 transition-colors flex items-center gap-1.5"
              >
                <Check className="h-3 w-3" strokeWidth={2} /> Approve comment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
