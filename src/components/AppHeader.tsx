import { GitPullRequest } from "lucide-react";

export function AppHeader() {
  return (
    <header className="h-12 border-b bg-card/50 flex items-center px-5 justify-between shrink-0">
      <div className="flex items-center gap-2.5">
        <GitPullRequest className="h-4 w-4 text-foreground" strokeWidth={1.5} />
        <span className="font-medium text-foreground text-sm tracking-tight">ReviewLens</span>
      </div>
      <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center">
        <span className="text-[10px] font-medium text-muted-foreground">Y</span>
      </div>
    </header>
  );
}
