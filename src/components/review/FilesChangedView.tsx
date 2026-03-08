import { useState } from "react";
import ReactMarkdown from "react-markdown";
import { supabase } from "@/integrations/supabase/client";
import { ChevronRight, FileCode, Sparkles, Loader2, Plus, Minus } from "lucide-react";

interface DiffFile {
  path: string;
  status: string;
  additions: number;
  deletions: number;
  patch: string;
}

interface FilesChangedViewProps {
  files: DiffFile[];
  owner: string;
  repo: string;
  prNumber: number;
}

type LineType = "added" | "removed" | "context" | "hunk";

interface DiffLine {
  type: LineType;
  content: string;
  oldNum?: number;
  newNum?: number;
}

function parsePatch(patch: string): DiffLine[] {
  if (!patch) return [];
  const lines = patch.split("\n");
  const result: DiffLine[] = [];
  let oldLine = 0;
  let newLine = 0;

  for (const line of lines) {
    if (line.startsWith("@@")) {
      const match = line.match(/@@ -(\d+)(?:,\d+)? \+(\d+)(?:,\d+)? @@/);
      if (match) {
        oldLine = parseInt(match[1]);
        newLine = parseInt(match[2]);
      }
      result.push({ type: "hunk", content: line });
    } else if (line.startsWith("+")) {
      result.push({ type: "added", content: line.slice(1), newNum: newLine });
      newLine++;
    } else if (line.startsWith("-")) {
      result.push({ type: "removed", content: line.slice(1), oldNum: oldLine });
      oldLine++;
    } else {
      result.push({ type: "context", content: line.startsWith(" ") ? line.slice(1) : line, oldNum: oldLine, newNum: newLine });
      oldLine++;
      newLine++;
    }
  }
  return result;
}

const statusLabel: Record<string, string> = {
  added: "A",
  removed: "D",
  modified: "M",
  renamed: "R",
};

const statusColor: Record<string, string> = {
  added: "text-success",
  removed: "text-destructive",
  modified: "text-warning",
  renamed: "text-muted-foreground",
};

export function FilesChangedView({ files, owner, repo, prNumber }: FilesChangedViewProps) {
  const [selectedFile, setSelectedFile] = useState<string>(files[0]?.path || "");
  const [aiExplaining, setAiExplaining] = useState(false);
  const [aiExplanation, setAiExplanation] = useState<string | null>(null);
  const [showAiView, setShowAiView] = useState(false);

  const currentFile = files.find((f) => f.path === selectedFile);
  const diffLines = currentFile ? parsePatch(currentFile.patch) : [];

  const handleExplain = async () => {
    if (!currentFile?.patch) return;
    setAiExplaining(true);
    setShowAiView(true);
    setAiExplanation(null);

    try {
      const { data, error } = await supabase.functions.invoke("explain-diff", {
        body: { filename: currentFile.path, patch: currentFile.patch, owner, repo },
      });
      if (error) throw error;
      setAiExplanation(data?.explanation || "Could not generate explanation.");
    } catch (err: any) {
      setAiExplanation("Failed to generate explanation. Please try again.");
    } finally {
      setAiExplaining(false);
    }
  };

  return (
    <div className="flex h-[calc(100vh-220px)] border rounded-lg overflow-hidden">
      {/* File tree sidebar */}
      <div className="w-64 border-r bg-card/50 shrink-0 overflow-y-auto">
        <div className="px-3 py-2 border-b">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">
            {files.length} file{files.length !== 1 ? "s" : ""} changed
          </p>
        </div>
        <div className="py-1">
          {files.map((file) => {
            const filename = file.path.split("/").pop() || file.path;
            const dir = file.path.includes("/") ? file.path.slice(0, file.path.lastIndexOf("/")) : "";
            const isActive = selectedFile === file.path;

            return (
              <button
                key={file.path}
                onClick={() => { setSelectedFile(file.path); setShowAiView(false); setAiExplanation(null); }}
                className={`w-full text-left px-3 py-1.5 text-[11px] flex items-center gap-2 transition-colors ${
                  isActive ? "bg-secondary text-foreground" : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
                }`}
              >
                <span className={`text-[9px] font-mono font-bold shrink-0 w-3 ${statusColor[file.status] || "text-muted-foreground"}`}>
                  {statusLabel[file.status] || "M"}
                </span>
                <div className="min-w-0 flex-1">
                  {dir && <span className="text-muted-foreground/60">{dir}/</span>}
                  <span className="font-medium">{filename}</span>
                </div>
                <span className="text-[9px] font-mono shrink-0 text-muted-foreground/60">
                  <span className="text-success">+{file.additions}</span>
                  {file.deletions > 0 && <span className="text-destructive ml-1">−{file.deletions}</span>}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Diff content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* File header */}
        {currentFile && (
          <div className="px-4 py-2 border-b bg-card/50 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2 min-w-0">
              <FileCode className="h-3.5 w-3.5 text-muted-foreground shrink-0" strokeWidth={1.5} />
              <span className="text-xs font-mono text-foreground truncate">{currentFile.path}</span>
              <span className="text-[10px] font-mono text-muted-foreground shrink-0">
                <span className="text-success">+{currentFile.additions}</span>
                {currentFile.deletions > 0 && <span className="text-destructive ml-1">−{currentFile.deletions}</span>}
              </span>
            </div>
            <button
              onClick={showAiView ? () => setShowAiView(false) : handleExplain}
              disabled={aiExplaining}
              className={`text-[11px] px-2.5 py-1 rounded flex items-center gap-1.5 transition-colors shrink-0 ${
                showAiView
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary"
              }`}
            >
              {aiExplaining ? (
                <Loader2 className="h-3 w-3 animate-spin" strokeWidth={1.5} />
              ) : (
                <Sparkles className="h-3 w-3" strokeWidth={1.5} />
              )}
              {showAiView ? "Show diff" : "Explain changes"}
            </button>
          </div>
        )}

        {/* Content area */}
        <div className="flex-1 overflow-auto">
          {showAiView ? (
            <div className="p-6 max-w-2xl">
              {aiExplaining ? (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={1.5} />
                  Analyzing changes...
                </div>
              ) : aiExplanation ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 mb-4">
                    <Sparkles className="h-3.5 w-3.5 text-primary" strokeWidth={1.5} />
                    <span className="text-xs font-medium text-foreground uppercase tracking-wider">AI explanation</span>
                  </div>
                  <div className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                    {aiExplanation}
                  </div>
                </div>
              ) : null}
            </div>
          ) : currentFile?.patch ? (
            <table className="w-full border-collapse font-mono text-[11px] leading-5">
              <tbody>
                {diffLines.map((line, i) => {
                  if (line.type === "hunk") {
                    return (
                      <tr key={i} className="bg-primary/5">
                        <td className="w-10 px-2 text-right text-muted-foreground/40 select-none border-r border-border/50">⋯</td>
                        <td className="w-10 px-2 text-right text-muted-foreground/40 select-none border-r border-border/50">⋯</td>
                        <td className="px-4 py-1 text-primary/70">{line.content}</td>
                      </tr>
                    );
                  }

                  const bgClass =
                    line.type === "added" ? "bg-diff-added" :
                    line.type === "removed" ? "bg-diff-removed" : "";

                  const textClass =
                    line.type === "added" ? "text-success" :
                    line.type === "removed" ? "text-destructive" :
                    "text-foreground/70";

                  return (
                    <tr key={i} className={`${bgClass} hover:brightness-95 transition-colors`}>
                      <td className="w-10 px-2 text-right text-muted-foreground/30 select-none border-r border-border/30 tabular-nums">
                        {line.type !== "added" ? line.oldNum : ""}
                      </td>
                      <td className="w-10 px-2 text-right text-muted-foreground/30 select-none border-r border-border/30 tabular-nums">
                        {line.type !== "removed" ? line.newNum : ""}
                      </td>
                      <td className={`px-4 whitespace-pre-wrap ${textClass}`}>
                        <span className="select-none mr-2 text-muted-foreground/30">
                          {line.type === "added" ? "+" : line.type === "removed" ? "−" : " "}
                        </span>
                        {line.content}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-xs text-muted-foreground">Binary or too large to display</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
