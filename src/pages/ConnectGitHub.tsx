import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { GitPullRequest, ExternalLink } from "lucide-react";
import { toast } from "sonner";

export default function ConnectGitHub() {
  const navigate = useNavigate();
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [hasConnection, setHasConnection] = useState(false);

  useEffect(() => {
    checkExistingConnection();
  }, []);

  const checkExistingConnection = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase
      .from("github_connections")
      .select("github_username")
      .eq("user_id", user.id)
      .maybeSingle();
    if (data) {
      setHasConnection(true);
    }
  };

  const handleConnect = async () => {
    if (!token.trim()) return;
    setLoading(true);

    try {
      // Validate token by calling GitHub API
      const res = await fetch("https://api.github.com/user", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        throw new Error("Invalid token — make sure it has repo and read:user scopes");
      }

      const ghUser = await res.json();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Upsert the connection
      const { error } = await supabase
        .from("github_connections")
        .upsert({
          user_id: user.id,
          github_username: ghUser.login,
          access_token: token,
        }, { onConflict: "user_id" });

      if (error) throw error;

      toast.success(`Connected as ${ghUser.login}`);
      navigate("/app");
    } catch (err: any) {
      toast.error(err.message || "Failed to connect");
    } finally {
      setLoading(false);
    }
  };

  // If already connected, show option to update or go to app

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-2 mb-8">
          <GitPullRequest className="h-4 w-4 text-foreground" strokeWidth={1.5} />
          <span className="font-medium text-sm tracking-tight">ReviewLens</span>
        </div>

        <h1 className="text-lg font-medium text-foreground mb-1">Connect GitHub</h1>
        <p className="text-sm text-muted-foreground mb-6">
          Paste a Personal Access Token so we can read your PRs and post comments.
        </p>

        <div className="space-y-4">
          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block">Personal Access Token</label>
            <input
              type="password"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="ghp_..."
              className="w-full px-3 py-2 text-sm border rounded-md bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-foreground/20 transition-all"
            />
          </div>

          <a
            href="https://github.com/settings/tokens/new?scopes=repo,read:user&description=ReviewLens"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[11px] text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
          >
            <ExternalLink className="h-3 w-3" strokeWidth={1.5} />
            Create a token with repo + read:user scopes
          </a>

          <button
            onClick={handleConnect}
            disabled={loading || !token.trim()}
            className="w-full py-2.5 rounded-md bg-foreground text-background text-sm font-medium hover:bg-foreground/90 disabled:opacity-50 transition-colors"
          >
            {loading ? "Connecting..." : "Connect"}
          </button>
        </div>

        <p className="text-[10px] text-muted-foreground mt-6 text-center leading-relaxed">
          Your token is stored securely and only used to access GitHub on your behalf. You can revoke it anytime.
        </p>
      </div>
    </div>
  );
}
