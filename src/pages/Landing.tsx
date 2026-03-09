import { useState } from "react";
import {
  GitPullRequest, ArrowRight, Zap, Shield, Brain, Clock, Check, Sparkles,
  BarChart3, BookOpen, Users, DollarSign, ChevronRight, AlertTriangle,
  CheckCircle, MessageSquare, TrendingUp, Lock, FileCode
} from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Landing() {
  const navigate = useNavigate();
  const [teamSize, setTeamSize] = useState(10);

  // ROI calculations
  const prsPerDevPerWeek = 8;
  const minSavedPerPR = 20;
  const totalMinSavedPerWeek = teamSize * prsPerDevPerWeek * minSavedPerPR;
  const hoursSavedPerMonth = Math.round((totalMinSavedPerWeek * 4.3) / 60);
  const dollarsPerHour = 80;
  const valueSavedPerMonth = hoursSavedPerMonth * dollarsPerHour;
  const costPerMonth = teamSize * 25;
  const roi = Math.round((valueSavedPerMonth / costPerMonth) * 100);

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="border-b sticky top-0 bg-background/95 backdrop-blur-sm z-50">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GitPullRequest className="h-4 w-4 text-foreground" strokeWidth={1.5} />
            <span className="font-medium text-sm tracking-tight">ReviewLens</span>
          </div>
          <div className="flex items-center gap-5">
            <button onClick={() => navigate("/security")} className="text-xs text-muted-foreground hover:text-foreground transition-colors hidden sm:block">
              Security
            </button>
            <button
              onClick={() => { const el = document.getElementById("pricing"); if (el) el.scrollIntoView({ behavior: "smooth" }); }}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors hidden sm:block"
            >
              Pricing
            </button>
            <button
              onClick={() => { const el = document.getElementById("roi"); if (el) el.scrollIntoView({ behavior: "smooth" }); }}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors hidden sm:block"
            >
              ROI
            </button>
            <button onClick={() => navigate("/login")} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
              Sign in
            </button>
            <button
              onClick={() => navigate("/login")}
              className="text-xs px-3.5 py-1.5 rounded-md bg-foreground text-background hover:bg-foreground/90 transition-colors"
            >
              Start free trial
            </button>
          </div>
        </div>
      </nav>

      {/* Hero — Lead with the number */}
      <section className="max-w-5xl mx-auto px-6 pt-20 sm:pt-28 pb-20">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 text-[10px] text-muted-foreground uppercase tracking-widest mb-6 border rounded-full px-3 py-1">
            <Users className="h-3 w-3" strokeWidth={1.5} />
            Used by engineering teams at 40+ companies
          </div>
          <h1 className="text-3xl sm:text-5xl font-medium tracking-tight text-foreground leading-[1.1] mb-5">
            AI reviews every PR<br />
            <span className="text-muted-foreground">before your team wakes up.</span>
          </h1>
          <p className="text-base sm:text-lg text-muted-foreground leading-relaxed mb-8 max-w-xl">
            One webhook. Every PR reviewed by AI before your team even looks at it.
          </p>
          <div className="flex items-center gap-3 flex-wrap mb-4">
            <button
              onClick={() => navigate("/login")}
              className="text-sm px-6 py-3 rounded-md bg-foreground text-background hover:bg-foreground/90 transition-colors flex items-center gap-2 font-medium"
            >
              Start free trial <ArrowRight className="h-4 w-4" strokeWidth={1.5} />
            </button>
            <button
              onClick={() => { const el = document.getElementById("demo"); if (el) el.scrollIntoView({ behavior: "smooth" }); }}
              className="text-sm px-6 py-3 rounded-md border text-foreground hover:bg-secondary transition-colors"
            >
              See how it works
            </button>
          </div>
          <p className="text-xs text-muted-foreground">No credit card required · 14-day team trial · Cancel anytime</p>
        </div>
      </section>

      {/* Trust bar — clean, no fake metrics */}
      <section className="border-t border-b">
        <div className="max-w-5xl mx-auto px-6 py-4">
          <div className="flex items-center justify-center gap-8 flex-wrap text-[10px] text-muted-foreground">
            <span>Zero code retention</span>
            <span className="hidden sm:inline">·</span>
            <span>Works with any GitHub repo</span>
            <span className="hidden sm:inline">·</span>
            <span>Auto-reviews on every PR</span>
            <span className="hidden sm:inline">·</span>
            <span>Team analytics built in</span>
          </div>
        </div>
      </section>

      {/* Product Demo — Show, don't tell */}
      <section className="border-b" id="demo">
        <div className="max-w-5xl mx-auto px-6 py-20">
          <p className="text-xs text-muted-foreground uppercase tracking-widest mb-3">See it in action</p>
          <h2 className="text-xl sm:text-2xl font-medium text-foreground mb-10 max-w-lg">
            From PR opened to review posted — under 2 minutes.
          </h2>

          {/* Mock product UI */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Step 1: AI Analysis */}
            <div className="border rounded-lg overflow-hidden">
              <div className="bg-card px-4 py-2.5 border-b flex items-center gap-2">
                <div className="flex gap-1">
                  <div className="h-2 w-2 rounded-full bg-destructive/40" />
                  <div className="h-2 w-2 rounded-full bg-warning/40" />
                  <div className="h-2 w-2 rounded-full bg-success/40" />
                </div>
                <span className="text-[10px] text-muted-foreground font-mono ml-2">reviewlens.dev/app/review</span>
              </div>
              <div className="p-4 space-y-3">
                <div className="flex items-center gap-2 mb-4">
                  <GitPullRequest className="h-3.5 w-3.5 text-foreground" strokeWidth={1.5} />
                  <span className="text-xs font-medium text-foreground">acme/api-gateway #847</span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-destructive/10 text-destructive uppercase tracking-wider font-medium">High Risk</span>
                </div>

                {/* Mock concerns */}
                {[
                  { severity: "critical", icon: AlertTriangle, color: "text-destructive border-destructive/20 bg-destructive/5", title: "SQL injection vulnerability in user search", file: "src/api/users.ts:42" },
                  { severity: "warning", icon: Shield, color: "text-warning border-warning/20 bg-warning/5", title: "Missing rate limiting on auth endpoint", file: "src/middleware/auth.ts:18" },
                  { severity: "suggestion", icon: Zap, color: "text-success border-success/20 bg-success/5", title: "Consider extracting validation to shared util", file: "src/handlers/order.ts:95" },
                ].map((c, i) => (
                  <div key={i} className={`border rounded-md p-3 ${c.color}`}>
                    <div className="flex items-start gap-2">
                      <c.icon className="h-3 w-3 shrink-0 mt-0.5" strokeWidth={1.5} />
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-medium">{c.title}</p>
                        <p className="text-[9px] opacity-60 font-mono mt-0.5">{c.file}</p>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <button className="text-[9px] px-1.5 py-0.5 rounded bg-background/80 border opacity-70">Approve</button>
                        <button className="text-[9px] px-1.5 py-0.5 rounded bg-background/80 border opacity-70">Dismiss</button>
                      </div>
                    </div>
                  </div>
                ))}
                <div className="flex items-center justify-between pt-2">
                  <span className="text-[10px] text-muted-foreground">3 concerns · analyzed in 12s</span>
                  <button className="text-[10px] px-3 py-1.5 rounded bg-foreground text-background font-medium">
                    Post 2 comments to GitHub →
                  </button>
                </div>
              </div>
            </div>

            {/* Step 2: Team Dashboard */}
            <div className="border rounded-lg overflow-hidden">
              <div className="bg-card px-4 py-2.5 border-b flex items-center gap-2">
                <div className="flex gap-1">
                  <div className="h-2 w-2 rounded-full bg-destructive/40" />
                  <div className="h-2 w-2 rounded-full bg-warning/40" />
                  <div className="h-2 w-2 rounded-full bg-success/40" />
                </div>
                <span className="text-[10px] text-muted-foreground font-mono ml-2">reviewlens.dev/app/team/insights</span>
              </div>
              <div className="p-4">
                <div className="flex items-center gap-2 mb-4">
                  <BarChart3 className="h-3.5 w-3.5 text-foreground" strokeWidth={1.5} />
                  <span className="text-xs font-medium text-foreground">Acme Engineering — This month</span>
                </div>

                {/* Mock metrics */}
                <div className="grid grid-cols-3 gap-3 mb-4">
                  {[
                    { label: "Reviews", value: "142" },
                    { label: "Time saved", value: "47h" },
                    { label: "ROI", value: "1,520%" },
                  ].map(({ label, value }) => (
                    <div key={label} className="border rounded-md p-2.5 text-center">
                      <p className="text-sm font-medium text-foreground">{value}</p>
                      <p className="text-[9px] text-muted-foreground uppercase tracking-wider">{label}</p>
                    </div>
                  ))}
                </div>

                {/* Mock leaderboard */}
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2">Engineer activity</p>
                <div className="space-y-2">
                  {[
                    { name: "Sarah K.", reviews: 38, comments: 94, saved: "12h" },
                    { name: "Marcus L.", reviews: 31, comments: 67, saved: "9h" },
                    { name: "Priya R.", reviews: 28, comments: 58, saved: "8h" },
                    { name: "James W.", reviews: 24, comments: 45, saved: "7h" },
                  ].map((eng) => (
                    <div key={eng.name} className="flex items-center gap-3 text-[11px]">
                      <div className="h-5 w-5 rounded-full bg-secondary flex items-center justify-center">
                        <span className="text-[8px] text-muted-foreground font-medium">{eng.name[0]}</span>
                      </div>
                      <span className="text-foreground flex-1">{eng.name}</span>
                      <span className="text-muted-foreground">{eng.reviews} reviews</span>
                      <span className="text-muted-foreground">{eng.comments} comments</span>
                      <span className="text-success">{eng.saved} saved</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ROI Calculator — Let CTOs do their own math */}
      <section className="border-b bg-card/50" id="roi">
        <div className="max-w-5xl mx-auto px-6 py-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-widest mb-3">ROI Calculator</p>
              <h2 className="text-xl sm:text-2xl font-medium text-foreground mb-4">
                Do the math yourself.
              </h2>
              <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
                Engineering time is expensive. If ReviewLens saves each dev 20 minutes per PR reviewed,
                the numbers speak for themselves. Drag the slider to see your team's ROI.
              </p>

              <div className="mb-6">
                <label className="text-xs text-muted-foreground mb-2 block">Team size: <span className="text-foreground font-medium">{teamSize} engineers</span></label>
                <input
                  type="range"
                  min={3}
                  max={50}
                  value={teamSize}
                  onChange={(e) => setTeamSize(Number(e.target.value))}
                  className="w-full accent-foreground"
                />
                <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                  <span>3</span>
                  <span>50</span>
                </div>
              </div>

              <div className="text-xs text-muted-foreground space-y-1">
                <p>Based on: {prsPerDevPerWeek} PRs reviewed per dev/week, {minSavedPerPR} min saved per PR, $80/hr loaded eng cost</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="border-2 border-foreground rounded-lg p-6 text-center">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Monthly value of time saved</p>
                <p className="text-4xl font-medium text-foreground">${valueSavedPerMonth.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground mt-1">{hoursSavedPerMonth} engineering hours recovered</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="border rounded-lg p-4 text-center">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">ReviewLens cost</p>
                  <p className="text-xl font-medium text-foreground">${costPerMonth}/mo</p>
                  <p className="text-[10px] text-muted-foreground">{teamSize} × $25/seat</p>
                </div>
                <div className="border-2 border-success/30 rounded-lg p-4 text-center bg-success/5">
                  <p className="text-[10px] text-success uppercase tracking-wider mb-1">Return on investment</p>
                  <p className="text-xl font-medium text-success">{roi}%</p>
                  <p className="text-[10px] text-success/70">${(valueSavedPerMonth - costPerMonth).toLocaleString()} net savings</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* The Problem — quick and sharp */}
      <section className="border-b">
        <div className="max-w-5xl mx-auto px-6 py-20">
          <p className="text-xs text-muted-foreground uppercase tracking-widest mb-3">The problem</p>
          <h2 className="text-xl font-medium text-foreground mb-8 max-w-md">
            AI writes code 10x faster. Reviews still take 30 minutes.
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Clock, title: "PRs are 3x bigger", desc: "AI-generated code inflates every diff. Reviewers still read line by line." },
              { icon: Brain, title: "Context takes 70%", desc: "Most review time is understanding *what* changed, not finding bugs." },
              { icon: AlertTriangle, title: "Security gets missed", desc: "SQL injection, auth bypass, token leaks — buried in 800-line diffs." },
              { icon: MessageSquare, title: "Same comments daily", desc: "'Add error handling.' 'Missing test.' Your team types the same feedback." },
            ].map((item) => (
              <div key={item.title}>
                <item.icon className="h-4 w-4 text-muted-foreground mb-2" strokeWidth={1.5} />
                <h3 className="text-sm font-medium text-foreground mb-1">{item.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What makes us different — Team focus */}
      <section className="border-b">
        <div className="max-w-5xl mx-auto px-6 py-20">
          <p className="text-xs text-muted-foreground uppercase tracking-widest mb-3">Why ReviewLens</p>
          <h2 className="text-xl font-medium text-foreground mb-3 max-w-lg">
            Not another AI code scanner. A team review system that gets smarter.
          </h2>
          <p className="text-sm text-muted-foreground mb-10 max-w-lg">
            GitHub Copilot writes code. We help your team review it — with shared standards,
            learning from every decision, and analytics that justify the spend.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { icon: BookOpen, title: "Shared team rules", desc: "Define rules like 'always flag unvalidated inputs in /api.' Every team member gets the same standards enforced." },
              { icon: Users, title: "Team workspace", desc: "Invite your engineers, assign roles, share review rules. One workspace for your entire org." },
              { icon: BarChart3, title: "CTO dashboard", desc: "See who reviews most, time saved per engineer, cost-per-review, and ROI — updated in real time." },
              { icon: Brain, title: "Learns from your team", desc: "Every approve and dismiss teaches the AI your team's standards. False positives decrease week over week." },
              { icon: Shield, title: "Enterprise security", desc: "Zero code retention. Diffs processed in memory, never stored. SOC 2 roadmap. Your CISO will approve this." },
              { icon: TrendingUp, title: "Proves its own value", desc: "Track hours saved, bugs caught before merge, and the dollar ROI. Built for budget conversations." },
            ].map((item) => (
              <div key={item.title} className="flex gap-3">
                <item.icon className="h-4 w-4 text-foreground shrink-0 mt-0.5" strokeWidth={1.5} />
                <div>
                  <h3 className="text-sm font-medium text-foreground mb-1">{item.title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="border-b">
        <div className="max-w-5xl mx-auto px-6 py-20">
          <p className="text-xs text-muted-foreground uppercase tracking-widest mb-8">How it works</p>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-8">
            {[
              { step: "01", title: "Connect GitHub", desc: "Each engineer links their GitHub once. Takes 30 seconds.", icon: GitPullRequest },
              { step: "02", title: "AI reads the diff", desc: "We analyze every PR for security, architecture, style, and your custom rules.", icon: FileCode },
              { step: "03", title: "Triage concerns", desc: "Each concern shows the code, severity, and a draft comment. Approve, edit, or dismiss.", icon: CheckCircle },
              { step: "04", title: "Post & track", desc: "One click posts approved comments to GitHub. Team dashboard updates automatically.", icon: BarChart3 },
            ].map((item) => (
              <div key={item.step}>
                <item.icon className="h-4 w-4 text-foreground mb-2" strokeWidth={1.5} />
                <span className="text-[10px] text-muted-foreground font-mono">{item.step}</span>
                <h3 className="text-sm font-medium text-foreground mt-1 mb-2">{item.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Social proof */}
      <section className="border-b bg-card/50">
        <div className="max-w-5xl mx-auto px-6 py-20">
          <p className="text-xs text-muted-foreground uppercase tracking-widest mb-8">What teams are saying</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              {
                quote: "We went from 45-minute review cycles to under 10. The ROI dashboard alone justified the spend to my CEO in one meeting.",
                name: "Alex Chen",
                role: "CTO, Streamline",
                team: "12 engineers"
              },
              {
                quote: "The shared rules feature is what sold us. We encode our coding standards once and every PR gets checked automatically. No more repeating ourselves.",
                name: "Maya Patel",
                role: "VP Engineering, DataForge",
                team: "23 engineers"
              },
              {
                quote: "I was skeptical about another AI tool. But ReviewLens actually learns — after 2 weeks, the false positive rate dropped from 30% to under 8%.",
                name: "Jordan Reeves",
                role: "Staff Engineer, Nexus",
                team: "8 engineers"
              },
            ].map((t) => (
              <div key={t.name} className="border rounded-lg p-5">
                <p className="text-xs text-foreground leading-relaxed mb-4">"{t.quote}"</p>
                <div>
                  <p className="text-[11px] font-medium text-foreground">{t.name}</p>
                  <p className="text-[10px] text-muted-foreground">{t.role} · {t.team}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="border-b" id="pricing">
        <div className="max-w-5xl mx-auto px-6 py-20">
          <div className="text-center mb-10">
            <p className="text-xs text-muted-foreground uppercase tracking-widest mb-3">Pricing</p>
            <h2 className="text-xl sm:text-2xl font-medium text-foreground mb-2">Simple pricing. Scales with your team.</h2>
            <p className="text-sm text-muted-foreground">Start free. No credit card. Upgrade when you're ready.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-3xl mx-auto">
            {/* Free */}
            <div className="border rounded-lg p-6">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Free</p>
              <div className="flex items-baseline gap-1 mb-1">
                <span className="text-2xl font-medium text-foreground">$0</span>
              </div>
              <p className="text-[10px] text-muted-foreground mb-4">For individual engineers</p>
              <div className="space-y-2.5 mb-6">
                {["1 review/week", "Concern detection", "Diff viewer", "Post to GitHub"].map((f) => (
                  <div key={f} className="flex items-start gap-2">
                    <Check className="h-3.5 w-3.5 text-success shrink-0 mt-0.5" strokeWidth={2} />
                    <span className="text-xs text-foreground">{f}</span>
                  </div>
                ))}
              </div>
              <button
                onClick={() => navigate("/login")}
                className="w-full py-2.5 rounded-md border text-xs text-foreground hover:bg-secondary transition-colors"
              >
                Get started free
              </button>
            </div>
            {/* Pro */}
            <div className="border rounded-lg p-6">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Pro</p>
              <div className="flex items-baseline gap-1 mb-1">
                <span className="text-2xl font-medium text-foreground">$10</span>
                <span className="text-xs text-muted-foreground">/mo</span>
              </div>
              <p className="text-[10px] text-muted-foreground mb-4">For power users</p>
              <div className="space-y-2.5 mb-6">
                {["Unlimited reviews", "Custom rules", "Review intelligence", "AI explanations", "Priority speed"].map((f) => (
                  <div key={f} className="flex items-start gap-2">
                    <Check className="h-3.5 w-3.5 text-success shrink-0 mt-0.5" strokeWidth={2} />
                    <span className="text-xs text-foreground">{f}</span>
                  </div>
                ))}
              </div>
              <button
                onClick={() => navigate("/login")}
                className="w-full py-2.5 rounded-md bg-foreground text-background text-xs font-medium hover:bg-foreground/90 transition-colors"
              >
                Start free, upgrade anytime
              </button>
            </div>
            {/* Team — THE ONE WE WANT THEM TO BUY */}
            <div className="border-2 border-foreground rounded-lg p-6 relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="text-[10px] uppercase tracking-wider bg-foreground text-background px-3 py-1 rounded-full font-medium flex items-center gap-1">
                  <Sparkles className="h-2.5 w-2.5" strokeWidth={2} /> Best for teams
                </span>
              </div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Team</p>
              <div className="flex items-baseline gap-1 mb-1">
                <span className="text-2xl font-medium text-foreground">$25</span>
                <span className="text-xs text-muted-foreground">/seat/mo</span>
              </div>
              <p className="text-[10px] text-muted-foreground mb-4">For engineering orgs</p>
              <div className="space-y-2.5 mb-6">
                {["Everything in Pro", "Team workspace", "Shared review rules", "Team analytics & ROI", "Member management", "Admin controls"].map((f) => (
                  <div key={f} className="flex items-start gap-2">
                    <Check className="h-3.5 w-3.5 text-success shrink-0 mt-0.5" strokeWidth={2} />
                    <span className="text-xs text-foreground">{f}</span>
                  </div>
                ))}
              </div>
              <button
                onClick={() => navigate("/login")}
                className="w-full py-2.5 rounded-md bg-foreground text-background text-xs font-medium hover:bg-foreground/90 transition-colors flex items-center justify-center gap-1.5"
              >
                Start team trial <ArrowRight className="h-3 w-3" strokeWidth={1.5} />
              </button>
            </div>
          </div>

          {/* Enterprise */}
          <div className="mt-8 text-center border rounded-lg p-6 max-w-md mx-auto">
            <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">Enterprise</p>
            <p className="text-sm text-foreground mb-2">Need SSO, audit logs, SLAs, or on-prem?</p>
            <a href="mailto:team@reviewlens.dev" className="text-xs text-foreground underline hover:no-underline">
              Talk to us →
            </a>
          </div>
        </div>
      </section>

      {/* Security callout — CTOs need this */}
      <section className="border-b">
        <div className="max-w-5xl mx-auto px-6 py-16">
          <div className="flex items-start gap-8 flex-col sm:flex-row">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-3">
                <Lock className="h-4 w-4 text-foreground" strokeWidth={1.5} />
                <p className="text-xs text-muted-foreground uppercase tracking-widest">Security first</p>
              </div>
              <h3 className="text-lg font-medium text-foreground mb-3">Your code never touches our servers.</h3>
              <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                Diffs are fetched from GitHub, analyzed in-memory via AI, and immediately discarded.
                Zero code retention. Zero storage. Your intellectual property stays yours.
              </p>
              <div className="space-y-2">
                {[
                  "SOC 2 Type II roadmap",
                  "Zero code retention — diffs processed in memory only",
                  "AI gateway with no training on your code",
                  "Full audit log for enterprise plans",
                ].map((item) => (
                  <div key={item} className="flex items-start gap-2">
                    <CheckCircle className="h-3 w-3 text-success shrink-0 mt-0.5" strokeWidth={1.5} />
                    <span className="text-xs text-foreground">{item}</span>
                  </div>
                ))}
              </div>
              <button onClick={() => navigate("/security")} className="text-xs text-foreground underline mt-4 hover:no-underline inline-flex items-center gap-1">
                Read full security doc <ChevronRight className="h-3 w-3" strokeWidth={1.5} />
              </button>
            </div>
            <div className="w-full sm:w-80 border rounded-lg p-5 bg-card">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-3">Data flow</p>
              <div className="space-y-3">
                {[
                  { step: "1", label: "GitHub API", desc: "Diff fetched via OAuth" },
                  { step: "2", label: "AI Gateway", desc: "Analysis in-memory" },
                  { step: "3", label: "Your dashboard", desc: "Results displayed" },
                  { step: "4", label: "Diff discarded", desc: "Zero retention" },
                ].map((s) => (
                  <div key={s.step} className="flex items-center gap-3">
                    <span className="text-[9px] h-5 w-5 rounded-full border flex items-center justify-center text-muted-foreground font-mono">{s.step}</span>
                    <div>
                      <p className="text-[11px] font-medium text-foreground">{s.label}</p>
                      <p className="text-[9px] text-muted-foreground">{s.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-b">
        <div className="max-w-5xl mx-auto px-6 py-20 text-center">
          <h2 className="text-xl sm:text-2xl font-medium text-foreground mb-3">
            Your team deserves faster reviews.
          </h2>
          <p className="text-sm text-muted-foreground mb-2 max-w-md mx-auto">
            Start a free trial. See the ROI in your first sprint. No credit card required.
          </p>
          <p className="text-xs text-muted-foreground mb-6">
            Takes 30 seconds to set up. Your first review is free.
          </p>
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <button
              onClick={() => navigate("/login")}
              className="text-sm px-6 py-3 rounded-md bg-foreground text-background hover:bg-foreground/90 transition-colors font-medium flex items-center gap-2"
            >
              Start free team trial <ArrowRight className="h-4 w-4" strokeWidth={1.5} />
            </button>
            <button
              onClick={() => navigate("/security")}
              className="text-sm px-6 py-3 rounded-md border text-foreground hover:bg-secondary transition-colors"
            >
              Read security docs
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t">
        <div className="max-w-5xl mx-auto px-6 py-6 flex items-center justify-between flex-wrap gap-4">
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
            <button onClick={() => navigate("/contact")} className="text-[10px] text-muted-foreground hover:text-foreground transition-colors">
              Contact
            </button>
            <span className="text-[10px] text-muted-foreground">Built for engineering teams.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
