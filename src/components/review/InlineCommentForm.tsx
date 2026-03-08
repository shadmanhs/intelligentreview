import { useState } from "react";
import { Send, X } from "lucide-react";

interface InlineCommentFormProps {
  filePath: string;
  lineNumber: number;
  lineContent: string;
  onSubmit: (comment: string) => void;
  onCancel: () => void;
}

export function InlineCommentForm({ filePath, lineNumber, lineContent, onSubmit, onCancel }: InlineCommentFormProps) {
  const [comment, setComment] = useState("");

  return (
    <tr className="bg-card">
      <td colSpan={3} className="px-4 py-3">
        <div className="border rounded-md p-3 bg-background max-w-xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] text-muted-foreground font-mono">
              Comment on line {lineNumber}
            </span>
            <button onClick={onCancel} className="text-muted-foreground hover:text-foreground transition-colors">
              <X className="h-3.5 w-3.5" strokeWidth={1.5} />
            </button>
          </div>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Leave a review comment…"
            className="w-full bg-transparent border rounded p-2 outline-none resize-none text-xs text-foreground min-h-[60px] focus:border-foreground/30 transition-colors placeholder:text-muted-foreground"
            autoFocus
          />
          <div className="flex items-center justify-end gap-2 mt-2">
            <button
              onClick={onCancel}
              className="text-[11px] text-muted-foreground hover:text-foreground transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => { if (comment.trim()) onSubmit(comment); }}
              disabled={!comment.trim()}
              className="text-[11px] px-3 py-1.5 rounded bg-foreground text-background hover:bg-foreground/90 disabled:opacity-40 transition-colors flex items-center gap-1.5"
            >
              <Send className="h-3 w-3" strokeWidth={1.5} />
              Add comment
            </button>
          </div>
        </div>
      </td>
    </tr>
  );
}
