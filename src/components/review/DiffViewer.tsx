import { useState } from "react";
import { ReviewComment } from "@/types/review";

interface DiffViewerProps {
  file: {
    path: string;
    oldContent: string;
    newContent: string;
    additions: number;
    deletions: number;
    status: string;
  };
  onAddComment: (comment: Omit<ReviewComment, "id" | "createdAt">) => void;
}

type CommentType = "blocking" | "question" | "suggestion" | "note";

function computeDiff(oldLines: string[], newLines: string[]) {
  const rows: { type: "context" | "added" | "removed"; oldLine?: number; newLine?: number; content: string }[] = [];
  
  // Simple line-by-line diff
  let oi = 0, ni = 0;
  
  while (oi < oldLines.length || ni < newLines.length) {
    if (oi < oldLines.length && ni < newLines.length && oldLines[oi] === newLines[ni]) {
      rows.push({ type: "context", oldLine: oi + 1, newLine: ni + 1, content: oldLines[oi] });
      oi++;
      ni++;
    } else if (oi < oldLines.length && (ni >= newLines.length || !newLines.includes(oldLines[oi]))) {
      rows.push({ type: "removed", oldLine: oi + 1, content: oldLines[oi] });
      oi++;
    } else if (ni < newLines.length) {
      rows.push({ type: "added", newLine: ni + 1, content: newLines[ni] });
      ni++;
    }
  }
  return rows;
}

export function DiffViewer({ file, onAddComment }: DiffViewerProps) {
  const [commentLine, setCommentLine] = useState<number | null>(null);
  const [commentText, setCommentText] = useState("");
  const [commentType, setCommentType] = useState<CommentType>("note");

  const oldLines = file.oldContent.split("\n");
  const newLines = file.newContent.split("\n");
  const diffRows = computeDiff(oldLines, newLines);

  const submitComment = () => {
    if (commentLine === null || !commentText.trim()) return;
    onAddComment({
      file: file.path,
      line: commentLine,
      content: commentText,
      type: commentType,
    });
    setCommentLine(null);
    setCommentText("");
    setCommentType("note");
  };

  const typeColors = {
    blocking: "border-destructive bg-destructive/5",
    question: "border-warning bg-warning/5",
    suggestion: "border-success bg-success/5",
    note: "border-info bg-info/5",
  };

  return (
    <div className="font-mono text-[12px] leading-5">
      {/* File header */}
      <div className="sticky top-0 z-10 bg-card border-b px-4 py-2 flex items-center justify-between">
        <span className="text-xs text-foreground font-medium">{file.path}</span>
        <div className="flex items-center gap-2 text-[10px]">
          <span className="text-success">+{file.additions}</span>
          {file.deletions > 0 && <span className="text-destructive">-{file.deletions}</span>}
        </div>
      </div>

      {/* Diff lines */}
      <div className="divide-y divide-transparent">
        {diffRows.map((row, i) => (
          <div key={i}>
            <div
              className={`flex group cursor-pointer hover:brightness-95 ${
                row.type === "added"
                  ? "bg-code-line-added"
                  : row.type === "removed"
                  ? "bg-code-line-removed"
                  : "bg-transparent"
              }`}
              onClick={() => {
                const lineNum = row.newLine || row.oldLine || i + 1;
                setCommentLine(lineNum);
              }}
            >
              {/* Old line number */}
              <span className="w-12 text-right pr-2 text-muted-foreground/50 select-none shrink-0 py-px">
                {row.oldLine || ""}
              </span>
              {/* New line number */}
              <span className="w-12 text-right pr-2 text-muted-foreground/50 select-none shrink-0 py-px border-r border-border/30">
                {row.newLine || ""}
              </span>
              {/* Indicator */}
              <span className={`w-6 text-center select-none shrink-0 py-px ${
                row.type === "added" ? "text-code-line-added-text" : row.type === "removed" ? "text-code-line-removed-text" : "text-transparent"
              }`}>
                {row.type === "added" ? "+" : row.type === "removed" ? "−" : " "}
              </span>
              {/* Content */}
              <span className={`flex-1 px-2 py-px whitespace-pre-wrap break-all ${
                row.type === "added" ? "text-code-line-added-text" : row.type === "removed" ? "text-code-line-removed-text" : "text-foreground"
              }`}>
                {row.content || " "}
              </span>
              {/* Comment indicator */}
              <span className="w-8 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="text-primary text-xs">💬</span>
              </span>
            </div>

            {/* Inline comment form */}
            {commentLine === (row.newLine || row.oldLine || i + 1) && (
              <div className={`mx-4 my-2 border rounded-md p-3 animate-fade-in ${typeColors[commentType]}`}>
                <div className="flex gap-1 mb-2">
                  {(["note", "question", "suggestion", "blocking"] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => setCommentType(t)}
                      className={`text-[10px] px-2 py-0.5 rounded-full capitalize transition-colors ${
                        commentType === t
                          ? "bg-foreground/10 text-foreground font-medium"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {t === "blocking" ? "🔴" : t === "question" ? "🟡" : t === "suggestion" ? "🟢" : "💬"} {t}
                    </button>
                  ))}
                </div>
                <textarea
                  autoFocus
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Write your review comment..."
                  className="w-full bg-transparent border-none outline-none resize-none text-xs text-foreground placeholder:text-muted-foreground font-sans min-h-[60px]"
                />
                <div className="flex justify-end gap-2 mt-2">
                  <button
                    onClick={() => { setCommentLine(null); setCommentText(""); }}
                    className="text-[10px] px-3 py-1 rounded text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={submitComment}
                    disabled={!commentText.trim()}
                    className="text-[10px] px-3 py-1 rounded bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
                  >
                    Add Comment
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
