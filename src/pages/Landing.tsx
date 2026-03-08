import { GitPullRequest, ArrowRight, Zap, Shield, Brain, Clock, CheckCircle } from "lucide-react";
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
          <p className="text-xs text-muted-foreground uppercase tracking-widest mb-4">For staff+ engineers</p>
          <h1 className="text-3xl sm:text-4xl font-medium tracking-tight text-foreground leading-tight mb-4">
            Review PRs in 5 minutes,<br />not 30.
          </h1>
          <p className="text-base text-muted-foreground leading-relaxed mb-8 max-w-lg">
            AI reads the diff and surfaces what matters — security issues, missing tests, 
            architectural concerns — with draft comments you approve, edit, or dismiss. 
            Then post to GitHub.
          </p>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/login")}
              className="text-sm px-5 py-2.5 rounded-md bg-foreground text-background hover:bg-foreground/90 transition-colors flex items-center gap-2"
            >
              Start reviewing <ArrowRight className="h-3.5 w-3.5" strokeWidth={1.5} />
            </button>
            <span className="text-xs text-muted-foreground">Free · No credit card</span>
          </div>
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

      {/* Features */}
      <section className="border-t">
        <div className="max-w-4xl mx-auto px-6 py-20">
          <p className="text-xs text-muted-foreground uppercase tracking-widest mb-3">What you get</p>
          <div className="space-y-4 max-w-lg">
            {[
              "AI-powered concern detection with severity ranking",
              "Draft comments you approve in one click",
              "Risk-sorted review queue across all your repos",
              "Security, architecture, and test coverage analysis",
              "Batch post to GitHub — no copy-pasting",
              "Full diff available when you need to go deeper",
            ].map((feature) => (
              <div key={feature} className="flex items-start gap-3">
                <CheckCircle className="h-3.5 w-3.5 text-success shrink-0 mt-0.5" strokeWidth={1.5} />
                <span className="text-sm text-foreground">{feature}</span>
              </div>
            ))}
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
          <span className="text-[10px] text-muted-foreground">Built for engineers who review code.</span>
        </div>
      </footer>
    </div>
  );
}
