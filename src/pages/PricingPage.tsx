import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { supabase } from "@/integrations/supabase/client";
import { AppHeader } from "@/components/AppHeader";
import { GitPullRequest, Check, ArrowRight, Loader2, Sparkles, Users } from "lucide-react";
import { toast } from "sonner";

export default function PricingPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { subscribed } = useSubscription();
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  const handleUpgrade = async () => {
    if (!user) {
      navigate("/login");
      return;
    }

    setCheckoutLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout");
      if (error) throw error;
      if (data?.url) {
        window.open(data.url, "_blank");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to start checkout");
    } finally {
      setCheckoutLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {user ? <AppHeader showUser /> : (
        <nav className="border-b">
          <div className="max-w-4xl mx-auto px-6 h-14 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <GitPullRequest className="h-4 w-4 text-foreground" strokeWidth={1.5} />
              <span className="font-medium text-sm tracking-tight">ReviewLens</span>
            </div>
            <button onClick={() => navigate("/login")} className="text-xs px-3 py-1.5 rounded-md bg-foreground text-background hover:bg-foreground/90 transition-colors">
              Sign in
            </button>
          </div>
        </nav>
      )}

      <main className="flex-1 max-w-4xl mx-auto w-full px-6 py-16">
        <div className="text-center mb-12">
          <p className="text-xs text-muted-foreground uppercase tracking-widest mb-3">Pricing</p>
          <h1 className="text-2xl sm:text-3xl font-medium tracking-tight text-foreground mb-3">
            One tool. Every PR reviewed before standup.
          </h1>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Custom rules + auto-webhook = reviews that match your standards, not generic AI suggestions. Start with a 14-day free trial.
          </p>
        </div>

        {/* What you're actually paying for */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto mb-12">
          {[
            { label: "Your rules enforced", desc: "Not generic — your team's standards on every PR" },
            { label: "Zero human effort", desc: "Webhook fires, AI reviews, comment posted. Done." },
            { label: "ROI you can prove", desc: "Dashboard shows hours saved per engineer per week" },
          ].map((v) => (
            <div key={v.label} className="border rounded-lg p-4 text-center">
              <Check className="h-4 w-4 text-success mx-auto mb-2" strokeWidth={2} />
              <p className="text-xs font-medium text-foreground mb-0.5">{v.label}</p>
              <p className="text-[10px] text-muted-foreground">{v.desc}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-3xl mx-auto">
          {/* Free tier */}
          <div className="border rounded-lg p-6">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Free</p>
            <div className="flex items-baseline gap-1 mb-4">
              <span className="text-2xl font-medium text-foreground">$0</span>
              <span className="text-xs text-muted-foreground">/month</span>
            </div>
            <div className="space-y-3 mb-6">
              {[
                "1 AI review per week",
                "Concern detection",
                "Full diff viewer",
                "Post to GitHub",
              ].map((f) => (
                <div key={f} className="flex items-start gap-2">
                  <Check className="h-3.5 w-3.5 text-success shrink-0 mt-0.5" strokeWidth={2} />
                  <span className="text-sm text-foreground">{f}</span>
                </div>
              ))}
            </div>
            {!user ? (
              <button
                onClick={() => navigate("/login")}
                className="w-full py-2.5 rounded-md border text-sm text-foreground hover:bg-secondary transition-colors"
              >
                Get started
              </button>
            ) : (
              <p className="text-xs text-muted-foreground text-center">
                {subscribed ? "—" : "Your current plan"}
              </p>
            )}
          </div>

          {/* Pro tier */}
          <div className="border rounded-lg p-6">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Pro</p>
            <div className="flex items-baseline gap-1 mb-4">
              <span className="text-2xl font-medium text-foreground">$10</span>
              <span className="text-xs text-muted-foreground">/month</span>
            </div>
            <div className="space-y-3 mb-6">
              {[
                "Unlimited AI reviews",
                "Custom review rules",
                "Auto-webhook reviews",
                "AI diff explanations",
                "Priority speed",
                "Everything in Free",
              ].map((f) => (
                <div key={f} className="flex items-start gap-2">
                  <Check className="h-3.5 w-3.5 text-success shrink-0 mt-0.5" strokeWidth={2} />
                  <span className="text-sm text-foreground">{f}</span>
                </div>
              ))}
            </div>
            {subscribed ? (
              <p className="text-xs text-success text-center font-medium">✓ Your current plan</p>
            ) : (
              <button
                onClick={handleUpgrade}
                disabled={checkoutLoading}
                className="w-full py-2.5 rounded-md bg-foreground text-background text-sm font-medium hover:bg-foreground/90 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
              >
                {checkoutLoading ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={1.5} />
                ) : (
                  <>Upgrade <ArrowRight className="h-3.5 w-3.5" strokeWidth={1.5} /></>
                )}
              </button>
            )}
          </div>

          {/* Team tier — THE ONE WE WANT */}
          <div className="border-2 border-foreground rounded-lg p-6 relative">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <span className="text-[10px] uppercase tracking-wider bg-foreground text-background px-3 py-1 rounded-full font-medium flex items-center gap-1">
                <Sparkles className="h-2.5 w-2.5" strokeWidth={2} /> 14-day free trial
              </span>
            </div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Team</p>
            <div className="flex items-baseline gap-1 mb-1">
              <span className="text-2xl font-medium text-foreground">$25</span>
              <span className="text-xs text-muted-foreground">/seat/month</span>
            </div>
            <p className="text-[10px] text-muted-foreground mb-4">No credit card for trial</p>
            <div className="space-y-3 mb-6">
              {[
                "Everything in Pro",
                "Team workspace",
                "Shared review rules",
                "Auto-webhook for every PR",
                "Team analytics & ROI",
                "Admin controls",
              ].map((f) => (
                <div key={f} className="flex items-start gap-2">
                  <Check className="h-3.5 w-3.5 text-success shrink-0 mt-0.5" strokeWidth={2} />
                  <span className="text-sm text-foreground">{f}</span>
                </div>
              ))}
            </div>
            <button
              onClick={() => user ? navigate("/app/team") : navigate("/login")}
              className="w-full py-2.5 rounded-md bg-foreground text-background text-sm font-medium hover:bg-foreground/90 transition-colors flex items-center justify-center gap-2"
            >
              Start 14-day free trial <ArrowRight className="h-3.5 w-3.5" strokeWidth={1.5} />
            </button>
          </div>
        </div>

        {/* Differentiator */}
        <div className="mt-12 max-w-2xl mx-auto">
          <p className="text-xs text-muted-foreground uppercase tracking-widest mb-4 text-center">Why not just use GitHub Copilot reviews?</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="border rounded-lg p-5">
              <p className="text-xs font-medium text-muted-foreground mb-3">GitHub Copilot</p>
              <div className="space-y-2">
                {["Generic AI suggestions", "No team rules", "No analytics or ROI", "No learning from feedback"].map((f) => (
                  <div key={f} className="flex items-start gap-2">
                    <span className="text-[10px] text-muted-foreground mt-0.5">✗</span>
                    <span className="text-xs text-muted-foreground">{f}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="border-2 border-foreground rounded-lg p-5">
              <p className="text-xs font-medium text-foreground mb-3">ReviewLens</p>
              <div className="space-y-2">
                {["Your custom rules enforced", "Shared team standards", "ROI dashboard for CTOs", "Learns from approve/dismiss"].map((f) => (
                  <div key={f} className="flex items-start gap-2">
                    <Check className="h-3 w-3 text-success shrink-0 mt-0.5" strokeWidth={2} />
                    <span className="text-xs text-foreground">{f}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Enterprise CTA */}
        <div className="mt-12 text-center border rounded-lg p-8 max-w-xl mx-auto">
          <p className="text-xs text-muted-foreground uppercase tracking-widest mb-2">Enterprise</p>
          <h3 className="text-sm font-medium text-foreground mb-2">Need SSO, audit logs, or custom deployment?</h3>
          <p className="text-xs text-muted-foreground mb-4">We work with engineering teams at scale. Let's talk.</p>
          <a
            href="mailto:team@reviewlens.dev"
            className="text-xs px-4 py-2 rounded-md border text-foreground hover:bg-secondary transition-colors inline-block"
          >
            Contact sales
          </a>
        </div>
      </main>
    </div>
  );
}
