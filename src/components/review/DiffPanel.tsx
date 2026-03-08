import { FileChange } from "@/types/review";

interface DiffPanelProps {
  files: FileChange[];
}

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

export function DiffPanel({ files }: DiffPanelProps) {
  return (
    <div className="space-y-4">
      {files.map((file) => {
        const rows = computeDiff(file.oldContent.split("\n"), file.newContent.split("\n"));
        return (
          <div key={file.path} className="border rounded-lg overflow-hidden">
            <div className="px-4 py-2 border-b bg-secondary/30 flex items-center justify-between">
              <span className="text-xs font-mono text-foreground">{file.path}</span>
              <span className="text-[10px] text-muted-foreground font-mono">
                <span className="text-success">+{file.additions}</span>
                {file.deletions > 0 && <span className="text-destructive ml-2">−{file.deletions}</span>}
              </span>
            </div>
            <div className="font-mono text-[11px] leading-5 overflow-x-auto">
              {rows.map((row, i) => (
                <div
                  key={i}
                  className={`flex ${
                    row.type === "added" ? "bg-code-line-added" : row.type === "removed" ? "bg-code-line-removed" : ""
                  }`}
                >
                  <span className="w-9 text-right pr-1.5 text-muted-foreground/40 select-none shrink-0 py-px">
                    {row.oldLine || ""}
                  </span>
                  <span className="w-9 text-right pr-1.5 text-muted-foreground/40 select-none shrink-0 py-px border-r border-border/30">
                    {row.newLine || ""}
                  </span>
                  <span className={`w-4 text-center select-none shrink-0 py-px ${
                    row.type === "added" ? "text-code-line-added-text" : row.type === "removed" ? "text-code-line-removed-text" : "text-transparent"
                  }`}>
                    {row.type === "added" ? "+" : row.type === "removed" ? "−" : " "}
                  </span>
                  <span className={`flex-1 px-1 py-px whitespace-pre-wrap break-all ${
                    row.type === "added" ? "text-code-line-added-text" : row.type === "removed" ? "text-code-line-removed-text" : "text-foreground/70"
                  }`}>
                    {row.content || " "}
                  </span>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
