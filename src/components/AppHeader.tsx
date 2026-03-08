import { GitPullRequest, LogOut, Settings } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";

interface AppHeaderProps {
  showUser?: boolean;
  username?: string;
}

export function AppHeader({ showUser, username }: AppHeaderProps) {
  const { signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <header className="h-12 border-b bg-card/50 flex items-center px-5 justify-between shrink-0">
      <div className="flex items-center gap-2.5">
        <GitPullRequest className="h-4 w-4 text-foreground" strokeWidth={1.5} />
        <span className="font-medium text-foreground text-sm tracking-tight">ReviewLens</span>
      </div>
      {showUser && (
        <div className="flex items-center gap-3">
          {username && (
            <span className="text-[11px] text-muted-foreground font-mono">{username}</span>
          )}
          <button
            onClick={() => navigate("/connect-github")}
            className="text-muted-foreground hover:text-foreground transition-colors"
            title="GitHub settings"
          >
            <Settings className="h-3.5 w-3.5" strokeWidth={1.5} />
          </button>
          <button
            onClick={handleSignOut}
            className="text-muted-foreground hover:text-foreground transition-colors"
            title="Sign out"
          >
            <LogOut className="h-3.5 w-3.5" strokeWidth={1.5} />
          </button>
        </div>
      )}
    </header>
  );
}
