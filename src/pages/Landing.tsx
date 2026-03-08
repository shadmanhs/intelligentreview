import { GitPullRequest, ArrowRight, Zap, Shield, Brain, Clock, CheckCircle, Check, Sparkles, BarChart3, BookOpen } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="border-b">
        <div className="max-w-4xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GitPullRequest className="h-4 w-4 text-foreground" strokeWidth={1.5} />
            <span className="font-medium text-sm tracking-tight">ReviewLens</span>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={() => navigate("/security")} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
              Security
            </button>
            <button
              onClick={() => {
                const el = document.getElementById("pricing");
                if (el) el.scrollIntoView({ behavior: "smooth" });
              }}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Pricing
            </button>
            <button onClick={() => navigate("/login")} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
              Sign in
            </button>
            <button
              onClick={() => navigate("/login")}
              className="text-xs px-3 py-1.5 rounded-md bg-foreground text-background hover:bg-foreground/90 transition-colors"
            >
              Get started
            </button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-4xl mx-auto px-6 pt-24 pb-20">
        <div className="max-w-2xl">
          <p className="text-xs text-muted-foreground uppercase tracking-widest mb-4">For engineering teams that ship fast</p>
          <h1 className="text-3xl sm:text-4xl font-medium tracking-tight text-foreground leading-tight mb-4">
            Your team reviews PRs<br />in 5 minutes, not 30.
          </h1>
          <p className="text-base text-muted-foreground leading-relaxed mb-8 max-w-lg">
            AI reads the diff, learns your team's patterns, and surfaces what matters — with draft comments
            engineers approve, edit, or dismiss. Team-wide analytics show ROI from day one.
          </p>
          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={() => navigate("/login")}
              className="text-sm px-5 py-2.5 rounded-md bg-foreground text-background hover:bg-foreground/90 transition-colors flex items-center gap-2"
            >
              Start reviewing <ArrowRight className="h-3.5 w-3.5" strokeWidth={1.5} />
            </button>
            <button
              onClick={() => navigate("/pricing")}
              className="text-sm px-5 py-2.5 rounded-md border text-foreground hover:bg-secondary transition-colors"
            >
              See team pricing
            </button>
          </div>
          <p className="text-xs text-muted-foreground mt-3">Free for individuals · $25/seat for teams</p>
        </div>
      </section>

      {/* How it works */}
      <section className="border-t">
        <div className="max-w-4xl mx-auto px-6 py-20">
          <p className="text-xs text-muted-foreground uppercase tracking-widest mb-8">How it works</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {[
              {
                step: "01",
                title: "Connect GitHub",
                desc: "Link your account once. We pull your PRs assigned for review, sorted by risk.",
              },
              {
                step: "02",
                title: "Triage AI concerns",
                desc: "Each concern shows the code, explains why it matters, and drafts the comment for you.",
              },
              {
                step: "03",
                title: "Post to GitHub",
                desc: "Approve, edit, or dismiss. One click posts everything. Back to your queue.",
              },
            ].map((item) => (
              <div key={item.step}>
                <span className="text-[10px] text-muted-foreground font-mono">{item.step}</span>
                <h3 className="text-sm font-medium text-foreground mt-1 mb-2">{item.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why not GitHub? */}
      <section className="border-t">
        <div className="max-w-4xl mx-auto px-6 py-20">
          <p className="text-xs text-muted-foreground uppercase tracking-widest mb-3">The problem</p>
          <h2 className="text-xl font-medium text-foreground mb-8 max-w-md">
            AI writes code faster. Nobody reviews it faster.
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {[
              {
                icon: Clock,
                title: "PRs are bigger",
                desc: "AI-generated code means 2-3x more lines per PR. Reviewers still read line by line.",
              },
              {
                icon: Brain,
                title: "Mental models take time",
                desc: "70% of review time is understanding context, not spotting bugs. AI can build that context for you.",
              },
              {
                icon: Shield,
                title: "Security is easy to miss",
                desc: "Auth flows, SQL injection, token storage — the important stuff is buried in 800-line diffs.",
              },
              {
                icon: Zap,
                title: "Comments are repetitive",
                desc: '"Add error handling." "Missing test." "Consider edge case." You type the same feedback constantly.',
              },
            ].map((item) => (
              <div key={item.title} className="flex gap-3">
                <item.icon className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" strokeWidth={1.5} />
                <div>
                  <h3 className="text-sm font-medium text-foreground mb-1">{item.title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What makes us different */}
      <section className="border-t">
        <div className="max-w-4xl mx-auto px-6 py-20">
          <p className="text-xs text-muted-foreground uppercase tracking-widest mb-3">What GitHub doesn't do</p>
          <h2 className="text-xl font-medium text-foreground mb-8 max-w-md">
            ReviewLens learns your standards and gets smarter over time.
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {[
              {
                icon: BookOpen,
                title: "Custom review rules",
                desc: "Define per-repo rules like 'always check for SQL injection in API routes.' The AI enforces them every time.",
              },
              {
                icon: BarChart3,
                title: "Review intelligence",
                desc: "Track patterns across repos: which modules have the most issues, what concerns you dismiss most, and estimated time saved.",
              },
              {
                icon: Brain,
                title: "Learns from your decisions",
                desc: "Every approve and dismiss teaches ReviewLens what matters to you. Over time, less noise, more signal.",
              },
            ].map((item) => (
              <div key={item.title}>
                <item.icon className="h-4 w-4 text-foreground mb-2" strokeWidth={1.5} />
                <h3 className="text-sm font-medium text-foreground mb-1">{item.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-t">
        <div className="max-w-4xl mx-auto px-6 py-20">
          <p className="text-xs text-muted-foreground uppercase tracking-widest mb-3">What you get</p>
          <div className="space-y-4 max-w-lg">
            {[
              "AI-powered concern detection with severity ranking",
              "Draft comments you approve in one click",
              "Custom per-repo review rules",
              "Review intelligence dashboard with patterns & trends",
              "Security, architecture, and test coverage analysis",
              "Repo-aware coding standards detection",
              "Full diff viewer with AI explanations",
              "Batch post to GitHub — no copy-pasting",
            ].map((feature) => (
              <div key={feature} className="flex items-start gap-3">
                <CheckCircle className="h-3.5 w-3.5 text-success shrink-0 mt-0.5" strokeWidth={1.5} />
                <span className="text-sm text-foreground">{feature}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="border-t" id="pricing">
        <div className="max-w-4xl mx-auto px-6 py-20">
          <p className="text-xs text-muted-foreground uppercase tracking-widest mb-3">Pricing</p>
          <h2 className="text-xl font-medium text-foreground mb-8">Simple, transparent pricing</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-2xl">
            {/* Free */}
            <div className="border rounded-lg p-6">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Free</p>
              <div className="flex items-baseline gap-1 mb-4">
                <span className="text-2xl font-medium text-foreground">$0</span>
                <span className="text-xs text-muted-foreground">/month</span>
              </div>
              <div className="space-y-2.5 mb-6">
                {["1 AI review per week", "Concern detection", "Full diff viewer", "Post to GitHub"].map((f) => (
                  <div key={f} className="flex items-start gap-2">
                    <Check className="h-3.5 w-3.5 text-success shrink-0 mt-0.5" strokeWidth={2} />
                    <span className="text-sm text-foreground">{f}</span>
                  </div>
                ))}
              </div>
              <button
                onClick={() => navigate("/login")}
                className="w-full py-2.5 rounded-md border text-sm text-foreground hover:bg-secondary transition-colors"
              >
                Get started
              </button>
            </div>
            {/* Pro */}
            <div className="border-2 border-foreground rounded-lg p-6 relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="text-[10px] uppercase tracking-wider bg-foreground text-background px-3 py-1 rounded-full font-medium flex items-center gap-1">
                  <Sparkles className="h-2.5 w-2.5" strokeWidth={2} /> Recommended
                </span>
              </div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Pro</p>
              <div className="flex items-baseline gap-1 mb-4">
                <span className="text-2xl font-medium text-foreground">$10</span>
                <span className="text-xs text-muted-foreground">/month</span>
              </div>
              <div className="space-y-2.5 mb-6">
                {[
                  "Unlimited AI reviews",
                  "Custom review rules per repo",
                  "Review intelligence dashboard",
                  "AI diff explanations",
                  "Priority analysis speed",
                  "Everything in Free",
                ].map((f) => (
                  <div key={f} className="flex items-start gap-2">
                    <Check className="h-3.5 w-3.5 text-success shrink-0 mt-0.5" strokeWidth={2} />
                    <span className="text-sm text-foreground">{f}</span>
                  </div>
                ))}
              </div>
              <button
                onClick={() => navigate("/login")}
                className="w-full py-2.5 rounded-md bg-foreground text-background text-sm font-medium hover:bg-foreground/90 transition-colors"
              >
                Start free, upgrade anytime
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t">
        <div className="max-w-4xl mx-auto px-6 py-20 text-center">
          <h2 className="text-xl font-medium text-foreground mb-3">Stop reading diffs line by line.</h2>
          <p className="text-sm text-muted-foreground mb-6">Start reviewing what matters.</p>
          <button
            onClick={() => navigate("/login")}
            className="text-sm px-6 py-2.5 rounded-md bg-foreground text-background hover:bg-foreground/90 transition-colors"
          >
            Get started for free
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t">
        <div className="max-w-4xl mx-auto px-6 py-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GitPullRequest className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={1.5} />
            <span className="text-xs text-muted-foreground">ReviewLens</span>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={() => navigate("/security")} className="text-[10px] text-muted-foreground hover:text-foreground transition-colors">
              Security
            </button>
            <button onClick={() => navigate("/pricing")} className="text-[10px] text-muted-foreground hover:text-foreground transition-colors">
              Pricing
            </button>
            <span className="text-[10px] text-muted-foreground">Built for engineers who review code.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
