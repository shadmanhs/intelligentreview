import { AIConcern } from "@/types/review";
import { Send, MessageSquare, FileCode } from "lucide-react";

interface InlineComment {
  id: string;
  filePath: string;
  lineNumber: number;
  body: string;
  side: "RIGHT" | "LEFT";
}

interface ReviewSummaryProps {
  concerns: AIConcern[];
  inlineComments?: InlineComment[];
  onPost: () => void;
}

export function ReviewSummary({ concerns, inlineComments = [], onPost }: ReviewSummaryProps) {
  const approved = concerns.filter((c) => c.status === "approved" || c.status === "edited");
  const dismissed = concerns.filter((c) => c.status === "dismissed");
  const pending = concerns.filter((c) => c.status === "pending");
  const totalComments = approved.length + inlineComments.length;

  if (totalComments === 0 && pending.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-sm text-muted-foreground">All concerns dismissed and no inline comments. You can approve the PR or go back to review more.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {pending.length > 0 && (
        <div className="border rounded-lg p-4 bg-warning/5 border-warning/20">
          <p className="text-xs text-warning-foreground">
            {pending.length} concern{pending.length > 1 ? "s" : ""} still pending — go back to review them, or post what you have.
          </p>
        </div>
      )}

      {/* AI Concerns */}
      {approved.length > 0 && (
        <div className="border rounded-lg overflow-hidden">
          <div className="px-4 py-3 border-b flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-foreground" strokeWidth={1.5} />
              <span className="text-sm font-medium text-foreground">
                {approved.length} AI comment{approved.length !== 1 ? "s" : ""}
              </span>
            </div>
            {dismissed.length > 0 && (
              <span className="text-[11px] text-muted-foreground">{dismissed.length} dismissed</span>
            )}
          </div>
          <div className="divide-y">
            {approved.map((c) => (
              <div key={c.id} className="px-4 py-3">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] text-muted-foreground font-mono">{c.file}:{c.lineStart}</span>
                </div>
                <p className="text-xs text-foreground leading-relaxed">{c.draftComment}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Inline Comments */}
      {inlineComments.length > 0 && (
        <div className="border rounded-lg overflow-hidden">
          <div className="px-4 py-3 border-b flex items-center gap-2">
            <FileCode className="h-4 w-4 text-foreground" strokeWidth={1.5} />
            <span className="text-sm font-medium text-foreground">
              {inlineComments.length} inline comment{inlineComments.length !== 1 ? "s" : ""}
            </span>
          </div>
          <div className="divide-y">
            {inlineComments.map((c) => (
              <div key={c.id} className="px-4 py-3">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] text-muted-foreground font-mono">{c.filePath}:{c.lineNumber}</span>
                </div>
                <p className="text-xs text-foreground leading-relaxed">{c.body}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {totalComments > 0 && (
        <button
          onClick={onPost}
          className="w-full py-2.5 rounded-lg bg-foreground text-background text-sm font-medium hover:bg-foreground/90 transition-colors flex items-center justify-center gap-2"
        >
          <Send className="h-3.5 w-3.5" strokeWidth={1.5} />
          Post {totalComments} comment{totalComments !== 1 ? "s" : ""} to GitHub
        </button>
      )}
    </div>
  );
}
