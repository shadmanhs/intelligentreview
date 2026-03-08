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
  let oi = 0, ni = 0;
  while (oi < oldLines.length || ni < newLines.length) {
    if (oi < oldLines.length && ni < newLines.length && oldLines[oi] === newLines[ni]) {
      rows.push({ type: "context", oldLine: oi + 1, newLine: ni + 1, content: oldLines[oi] });
      oi++; ni++;
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

  const diffRows = computeDiff(file.oldContent.split("\n"), file.newContent.split("\n"));

  const submitComment = () => {
    if (commentLine === null || !commentText.trim()) return;
    onAddComment({ file: file.path, line: commentLine, content: commentText, type: commentType });
    setCommentLine(null);
    setCommentText("");
    setCommentType("note");
  };

  return (
    <div className="font-mono text-[12px] leading-5">
      <div className="sticky top-0 z-10 bg-card/80 backdrop-blur-sm border-b px-4 py-2 flex items-center justify-between">
        <span className="text-xs text-foreground">{file.path}</span>
        <span className="text-[10px] text-muted-foreground font-mono">
          <span className="text-success">+{file.additions}</span>
          {file.deletions > 0 && <span className="text-destructive ml-2">−{file.deletions}</span>}
        </span>
      </div>

      {diffRows.map((row, i) => {
        const lineNum = row.newLine || row.oldLine || i + 1;
        return (
          <div key={i}>
            <div
              className={`flex group cursor-pointer ${
                row.type === "added" ? "bg-code-line-added" : row.type === "removed" ? "bg-code-line-removed" : "hover:bg-secondary/40"
              }`}
              onClick={() => setCommentLine(lineNum)}
            >
              <span className="w-10 text-right pr-2 text-muted-foreground/40 select-none shrink-0 py-px text-[11px]">
                {row.oldLine || ""}
              </span>
              <span className="w-10 text-right pr-2 text-muted-foreground/40 select-none shrink-0 py-px text-[11px] border-r border-border/40">
                {row.newLine || ""}
              </span>
              <span className={`w-5 text-center select-none shrink-0 py-px text-[11px] ${
                row.type === "added" ? "text-code-line-added-text" : row.type === "removed" ? "text-code-line-removed-text" : "text-transparent"
              }`}>
                {row.type === "added" ? "+" : row.type === "removed" ? "−" : " "}
              </span>
              <span className={`flex-1 px-1 py-px whitespace-pre-wrap break-all ${
                row.type === "added" ? "text-code-line-added-text" : row.type === "removed" ? "text-code-line-removed-text" : "text-foreground/80"
              }`}>
                {row.content || " "}
              </span>
            </div>

            {commentLine === lineNum && (
              <div className="mx-4 my-2 border rounded p-3 bg-card animate-fade-in">
                <div className="flex gap-1 mb-2 font-sans">
                  {(["note", "question", "suggestion", "blocking"] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => setCommentType(t)}
                      className={`text-[10px] px-2 py-0.5 rounded capitalize transition-colors ${
                        commentType === t ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
                <textarea
                  autoFocus
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Write a comment..."
                  className="w-full bg-transparent border-none outline-none resize-none text-xs text-foreground placeholder:text-muted-foreground font-sans min-h-[48px]"
                />
                <div className="flex justify-end gap-2 mt-1 font-sans">
                  <button
                    onClick={() => { setCommentLine(null); setCommentText(""); }}
                    className="text-[11px] px-2.5 py-1 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={submitComment}
                    disabled={!commentText.trim()}
                    className="text-[11px] px-2.5 py-1 rounded bg-foreground text-background hover:bg-foreground/90 disabled:opacity-40 transition-colors"
                  >
                    Add
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
