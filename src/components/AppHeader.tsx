import { useState, useRef, useEffect } from "react";
import { GitPullRequest, Settings, LogOut, ChevronDown } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

interface AppHeaderProps {
  showUser?: boolean;
}

export function AppHeader({ showUser }: AppHeaderProps) {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [profile, setProfile] = useState<{ display_name: string | null; avatar_url: string | null } | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user) {
      supabase
        .from("profiles")
        .select("display_name, avatar_url")
        .eq("user_id", user.id)
        .maybeSingle()
        .then(({ data }) => setProfile(data));
    }
  }, [user]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSignOut = async () => {
    setOpen(false);
    await signOut();
    navigate("/");
  };

  const initial = (profile?.display_name || user?.email || "?")[0].toUpperCase();

  return (
    <header className="h-12 border-b bg-card/50 flex items-center px-5 justify-between shrink-0">
      <button
        onClick={() => navigate("/app")}
        className="flex items-center gap-2.5 hover:opacity-80 transition-opacity"
      >
        <GitPullRequest className="h-4 w-4 text-foreground" strokeWidth={1.5} />
        <span className="font-medium text-foreground text-sm tracking-tight">ReviewLens</span>
      </button>

      {showUser && user && (
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setOpen(!open)}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="" className="h-6 w-6 rounded-full" />
            ) : (
              <div className="h-6 w-6 rounded-full bg-secondary flex items-center justify-center">
                <span className="text-[10px] text-muted-foreground font-medium">{initial}</span>
              </div>
            )}
            <ChevronDown className={`h-3 w-3 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} strokeWidth={1.5} />
          </button>

          {open && (
            <div className="absolute right-0 top-full mt-1 w-52 border rounded-lg bg-card shadow-lg py-1 z-50 animate-fade-in">
              {/* Identity */}
              <div className="px-3 py-2 border-b">
                <p className="text-xs font-medium text-foreground truncate">{profile?.display_name || "—"}</p>
                <p className="text-[10px] text-muted-foreground truncate">{user.email}</p>
              </div>

              <button
                onClick={() => { setOpen(false); navigate("/settings"); }}
                className="w-full px-3 py-2 text-left text-xs text-foreground hover:bg-secondary/50 transition-colors flex items-center gap-2"
              >
                <Settings className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={1.5} />
                Settings
              </button>

              <button
                onClick={handleSignOut}
                className="w-full px-3 py-2 text-left text-xs text-foreground hover:bg-secondary/50 transition-colors flex items-center gap-2"
              >
                <LogOut className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={1.5} />
                Sign out
              </button>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
