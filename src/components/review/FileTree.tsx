import { FileCode, Plus, Minus, FilePlus, FileX } from "lucide-react";

interface FileTreeProps {
  files: { path: string; additions: number; deletions: number; status: string }[];
  selectedIndex: number;
  onSelect: (index: number) => void;
}

const statusIcon = {
  added: <FilePlus className="h-3.5 w-3.5 text-success shrink-0" />,
  deleted: <FileX className="h-3.5 w-3.5 text-destructive shrink-0" />,
  modified: <FileCode className="h-3.5 w-3.5 text-warning shrink-0" />,
  renamed: <FileCode className="h-3.5 w-3.5 text-info shrink-0" />,
};

export function FileTree({ files, selectedIndex, onSelect }: FileTreeProps) {
  return (
    <div className="p-3 overflow-y-auto scrollbar-thin">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-2 px-1">
        Changed Files ({files.length})
      </p>
      <div className="space-y-0.5">
        {files.map((file, i) => (
          <button
            key={file.path}
            onClick={() => onSelect(i)}
            className={`w-full text-left px-2 py-1.5 rounded text-xs flex items-center gap-2 transition-colors ${
              i === selectedIndex
                ? "bg-primary/10 text-primary"
                : "text-foreground hover:bg-muted"
            }`}
          >
            {statusIcon[file.status as keyof typeof statusIcon] || <FileCode className="h-3.5 w-3.5 text-muted-foreground shrink-0" />}
            <span className="truncate flex-1 font-mono text-[11px]">
              {file.path.split("/").pop()}
            </span>
            <span className="flex items-center gap-1 shrink-0">
              <span className="text-success font-mono text-[10px]">+{file.additions}</span>
              {file.deletions > 0 && (
                <span className="text-destructive font-mono text-[10px]">-{file.deletions}</span>
              )}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
