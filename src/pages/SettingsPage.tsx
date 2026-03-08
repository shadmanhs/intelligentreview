import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { supabase } from "@/integrations/supabase/client";
import { AppHeader } from "@/components/AppHeader";
import { toast } from "sonner";
import {
  ArrowLeft,
  User,
  Github,
  ExternalLink,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  KeyRound,
  Shield,
  CreditCard,
  Sparkles,
} from "lucide-react";

interface Profile {
  display_name: string | null;
  email: string | null;
  avatar_url: string | null;
}

interface GitHubConnection {
  github_username: string | null;
  created_at: string;
  updated_at: string;
}

export default function SettingsPage() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { subscribed, subscriptionEnd, checkSubscription } = useSubscription();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [ghConnection, setGhConnection] = useState<GitHubConnection | null>(null);
  const [loading, setLoading] = useState(true);
  const [newToken, setNewToken] = useState("");
  const [updatingToken, setUpdatingToken] = useState(false);
  const [showTokenInput, setShowTokenInput] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [disconnectingGh, setDisconnectingGh] = useState(false);

  useEffect(() => {
    if (user) loadData();
  }, [user]);

  const loadData = async () => {
    const [profileRes, ghRes] = await Promise.all([
      supabase.from("profiles").select("display_name, email, avatar_url").eq("user_id", user!.id).maybeSingle(),
      supabase.from("github_connections").select("github_username, created_at, updated_at").eq("user_id", user!.id).maybeSingle(),
    ]);
    setProfile(profileRes.data);
    setGhConnection(ghRes.data);
    setLoading(false);
  };

  const handleUpdateToken = async () => {
    if (!newToken.trim()) return;
    setUpdatingToken(true);
    try {
      const res = await fetch("https://api.github.com/user", {
        headers: { Authorization: `Bearer ${newToken}` },
      });
      if (!res.ok) throw new Error("Invalid token");
      const ghUser = await res.json();

      const { error } = await supabase.from("github_connections").upsert(
        { user_id: user!.id, github_username: ghUser.login, access_token: newToken },
        { onConflict: "user_id" }
      );
      if (error) throw error;

      setGhConnection({ github_username: ghUser.login, created_at: new Date().toISOString(), updated_at: new Date().toISOString() });
      setNewToken("");
      setShowTokenInput(false);
      toast.success(`Token updated — connected as ${ghUser.login}`);
    } catch (err: any) {
      toast.error(err.message || "Failed to update token");
    } finally {
      setUpdatingToken(false);
    }
  };

  const handleDisconnectGitHub = async () => {
    setDisconnectingGh(true);
    try {
      const { error } = await supabase.from("github_connections").delete().eq("user_id", user!.id);
      if (error) throw error;
      setGhConnection(null);
      toast.success("GitHub disconnected");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setDisconnectingGh(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <AppHeader showUser />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-4 w-4 text-muted-foreground animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <AppHeader showUser />

      <main className="flex-1 max-w-lg mx-auto w-full px-6 py-8">
        {/* Back */}
        <button
          onClick={() => navigate("/app")}
          className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5 text-xs mb-8"
        >
          <ArrowLeft className="h-3.5 w-3.5" strokeWidth={1.5} />
          Back to queue
        </button>

        <h1 className="text-lg font-medium text-foreground mb-8">Settings</h1>

        {/* ── Account ── */}
        <section className="mb-10">
          <div className="flex items-center gap-2 mb-4">
            <User className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={1.5} />
            <h2 className="text-xs uppercase tracking-wider text-muted-foreground font-medium">Account</h2>
          </div>

          <div className="border rounded-lg divide-y">
            {/* Avatar + Name */}
            <div className="px-4 py-3 flex items-center gap-3">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="" className="h-8 w-8 rounded-full" />
              ) : (
                <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center">
                  <span className="text-xs text-muted-foreground font-medium">
                    {(profile?.display_name || profile?.email || "?")[0].toUpperCase()}
                  </span>
                </div>
              )}
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{profile?.display_name || "—"}</p>
                <p className="text-[11px] text-muted-foreground truncate">{profile?.email || user?.email}</p>
              </div>
            </div>

            {/* Auth provider */}
            <div className="px-4 py-3 flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Sign-in method</p>
                <p className="text-sm text-foreground mt-0.5">Google</p>
              </div>
              <Shield className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={1.5} />
            </div>
          </div>
        </section>

        {/* ── GitHub ── */}
        <section className="mb-10">
          <div className="flex items-center gap-2 mb-4">
            <Github className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={1.5} />
            <h2 className="text-xs uppercase tracking-wider text-muted-foreground font-medium">GitHub connection</h2>
          </div>

          <div className="border rounded-lg divide-y">
            {ghConnection ? (
              <>
                {/* Status */}
                <div className="px-4 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-success" strokeWidth={1.5} />
                    <div>
                      <p className="text-sm text-foreground font-mono">@{ghConnection.github_username}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        Connected {new Date(ghConnection.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <a
                    href={`https://github.com/${ghConnection.github_username}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <ExternalLink className="h-3.5 w-3.5" strokeWidth={1.5} />
                  </a>
                </div>

                {/* Update token */}
                <div className="px-4 py-3">
                  {showTokenInput ? (
                    <div className="space-y-2">
                      <input
                        type="password"
                        value={newToken}
                        onChange={(e) => setNewToken(e.target.value)}
                        placeholder="ghp_..."
                        className="w-full px-3 py-2 text-sm border rounded-md bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-foreground/20 transition-all"
                        autoFocus
                      />
                      <div className="flex items-center gap-2">
                        <button
                          onClick={handleUpdateToken}
                          disabled={updatingToken || !newToken.trim()}
                          className="text-[11px] px-3 py-1.5 rounded bg-foreground text-background hover:bg-foreground/90 disabled:opacity-50 transition-colors"
                        >
                          {updatingToken ? "Validating..." : "Update token"}
                        </button>
                        <button
                          onClick={() => { setShowTokenInput(false); setNewToken(""); }}
                          className="text-[11px] text-muted-foreground hover:text-foreground transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowTokenInput(true)}
                      className="text-[11px] text-muted-foreground hover:text-foreground flex items-center gap-1.5 transition-colors"
                    >
                      <KeyRound className="h-3 w-3" strokeWidth={1.5} /> Rotate token
                    </button>
                  )}
                </div>

                {/* Disconnect */}
                <div className="px-4 py-3">
                  <button
                    onClick={handleDisconnectGitHub}
                    disabled={disconnectingGh}
                    className="text-[11px] text-destructive hover:text-destructive/80 flex items-center gap-1.5 transition-colors"
                  >
                    <Trash2 className="h-3 w-3" strokeWidth={1.5} />
                    {disconnectingGh ? "Disconnecting..." : "Disconnect GitHub"}
                  </button>
                </div>
              </>
            ) : (
              <div className="px-4 py-4">
                <div className="flex items-center gap-2 mb-3">
                  <AlertCircle className="h-3.5 w-3.5 text-warning" strokeWidth={1.5} />
                  <p className="text-sm text-foreground">No GitHub account connected</p>
                </div>
                <button
                  onClick={() => navigate("/connect-github")}
                  className="text-[11px] px-3 py-1.5 rounded bg-foreground text-background hover:bg-foreground/90 transition-colors"
                >
                  Connect GitHub
                </button>
              </div>
            )}
          </div>

          <a
            href="https://github.com/settings/tokens"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[10px] text-muted-foreground hover:text-foreground flex items-center gap-1 mt-2 transition-colors"
          >
            <ExternalLink className="h-2.5 w-2.5" strokeWidth={1.5} /> Manage tokens on GitHub
          </a>
        </section>

        {/* ── Subscription ── */}
        <section className="mb-10">
          <div className="flex items-center gap-2 mb-4">
            <CreditCard className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={1.5} />
            <h2 className="text-xs uppercase tracking-wider text-muted-foreground font-medium">Subscription</h2>
          </div>

          <div className="border rounded-lg divide-y">
            <div className="px-4 py-3 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-foreground">{subscribed ? "Pro" : "Free"}</p>
                  {subscribed && <Sparkles className="h-3 w-3 text-foreground" strokeWidth={1.5} />}
                </div>
                {subscribed && subscriptionEnd && (
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    Renews {new Date(subscriptionEnd).toLocaleDateString()}
                  </p>
                )}
                {!subscribed && (
                  <p className="text-[10px] text-muted-foreground mt-0.5">1 AI review per week</p>
                )}
              </div>
              {subscribed ? (
                <button
                  onClick={async () => {
                    try {
                      const { data, error } = await supabase.functions.invoke("customer-portal");
                      if (error) throw error;
                      if (data?.url) window.open(data.url, "_blank");
                    } catch (err: any) {
                      toast.error(err.message || "Failed to open portal");
                    }
                  }}
                  className="text-[11px] text-muted-foreground hover:text-foreground transition-colors"
                >
                  Manage subscription
                </button>
              ) : (
                <button
                  onClick={() => navigate("/pricing")}
                  className="text-[11px] px-3 py-1.5 rounded bg-foreground text-background hover:bg-foreground/90 transition-colors"
                >
                  Upgrade to Pro
                </button>
              )}
            </div>
          </div>
        </section>

        {/* ── Danger zone ── */}
        <section className="mb-10">
          <h2 className="text-xs uppercase tracking-wider text-muted-foreground font-medium mb-4">Session</h2>
          <div className="border rounded-lg">
            <div className="px-4 py-3">
              <button
                onClick={handleSignOut}
                className="text-sm text-foreground hover:text-destructive transition-colors"
              >
                Sign out
              </button>
              <p className="text-[10px] text-muted-foreground mt-1">
                You'll need to sign in again with Google to continue using ReviewLens.
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
