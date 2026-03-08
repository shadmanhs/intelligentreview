import { GitPullRequest } from "lucide-react";

export function AppHeader() {
  return (
    <header className="h-14 border-b bg-card flex items-center px-6 justify-between shrink-0">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <GitPullRequest className="h-5 w-5 text-primary" />
          <span className="font-semibold text-foreground text-base tracking-tight">ReviewLens</span>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
          <span className="text-xs font-medium text-primary">YU</span>
        </div>
      </div>
    </header>
  );
}
