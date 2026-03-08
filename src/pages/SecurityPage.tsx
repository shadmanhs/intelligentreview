import { useNavigate } from "react-router-dom";
import { GitPullRequest, Shield, Lock, Eye, Server, Trash2, CheckCircle, ArrowRight } from "lucide-react";

export default function SecurityPage() {
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
            <button onClick={() => navigate("/")} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
              Home
            </button>
            <button onClick={() => navigate("/login")} className="text-xs px-3 py-1.5 rounded-md bg-foreground text-background hover:bg-foreground/90 transition-colors">
              Sign in
            </button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-4xl mx-auto px-6 pt-20 pb-16">
        <div className="flex items-center gap-2 mb-4">
          <Shield className="h-5 w-5 text-foreground" strokeWidth={1.5} />
          <p className="text-xs text-muted-foreground uppercase tracking-widest">Security & Privacy</p>
        </div>
        <h1 className="text-2xl sm:text-3xl font-medium tracking-tight text-foreground mb-4 max-w-lg">
          Your code never touches our servers.
        </h1>
        <p className="text-sm text-muted-foreground max-w-md leading-relaxed">
          ReviewLens is designed with a zero-trust architecture. We process your code in real-time and never store source code or diffs.
        </p>
      </section>

      {/* Data flow */}
      <section className="border-t">
        <div className="max-w-4xl mx-auto px-6 py-16">
          <p className="text-xs text-muted-foreground uppercase tracking-widest mb-8">How your data flows</p>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
            {[
              { step: "01", title: "GitHub API", desc: "Your browser fetches PR diffs directly from GitHub using your personal access token. The token is encrypted at rest." },
              { step: "02", title: "Analysis", desc: "Diffs are sent to our backend function, which forwards them to the AI model for analysis. No code is logged or persisted." },
              { step: "03", title: "AI Processing", desc: "The AI model processes the diff in memory and returns structured concerns. The model has no memory between requests." },
              { step: "04", title: "Your Browser", desc: "Results are displayed in your browser. You approve, edit, or dismiss. Only approved comments are posted back to GitHub." },
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

      {/* Security principles */}
      <section className="border-t">
        <div className="max-w-4xl mx-auto px-6 py-16">
          <p className="text-xs text-muted-foreground uppercase tracking-widest mb-8">Security principles</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
            {[
              {
                icon: Trash2,
                title: "Zero code retention",
                desc: "We never store your source code, diffs, or patches. All processing is ephemeral — data exists only for the duration of the API call.",
              },
              {
                icon: Lock,
                title: "Encrypted tokens",
                desc: "Your GitHub personal access token is encrypted at rest using AES-256. It's only decrypted server-side during API calls to GitHub.",
              },
              {
                icon: Eye,
                title: "Minimal permissions",
                desc: "We only request read access to pull requests. We never write to your repos except when you explicitly post review comments.",
              },
              {
                icon: Server,
                title: "No training on your code",
                desc: "Your code is never used to train AI models. We use commercially licensed models with strict data processing agreements.",
              },
            ].map((item) => (
              <div key={item.title} className="flex gap-4">
                <div className="shrink-0 mt-0.5">
                  <div className="h-8 w-8 rounded-md border flex items-center justify-center">
                    <item.icon className="h-4 w-4 text-foreground" strokeWidth={1.5} />
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-foreground mb-1">{item.title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Compliance */}
      <section className="border-t">
        <div className="max-w-4xl mx-auto px-6 py-16">
          <p className="text-xs text-muted-foreground uppercase tracking-widest mb-8">Compliance & certifications</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              { title: "SOC 2 Type II", status: "In progress", desc: "Currently undergoing SOC 2 Type II audit. Expected completion Q2 2026." },
              { title: "GDPR Compliant", status: "Active", desc: "Full GDPR compliance. Data processing agreements available on request." },
              { title: "Enterprise SSO", status: "Coming soon", desc: "SAML SSO for enterprise teams. Contact us for early access." },
            ].map((item) => (
              <div key={item.title} className="border rounded-lg p-5">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="h-3.5 w-3.5 text-success" strokeWidth={1.5} />
                  <span className="text-xs font-medium text-foreground">{item.title}</span>
                </div>
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{item.status}</span>
                <p className="text-xs text-muted-foreground leading-relaxed mt-2">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="border-t">
        <div className="max-w-4xl mx-auto px-6 py-16">
          <p className="text-xs text-muted-foreground uppercase tracking-widest mb-8">Frequently asked</p>
          <div className="space-y-6 max-w-lg">
            {[
              {
                q: "Can ReviewLens access my private repos?",
                a: "Only if your GitHub token has access to them. We recommend creating a fine-grained token with read-only access to pull requests.",
              },
              {
                q: "Is my code sent to third-party AI providers?",
                a: "Yes, code diffs are sent to AI models for analysis. However, they are processed in memory with zero retention. The AI provider does not store or train on your data.",
              },
              {
                q: "Can I self-host ReviewLens?",
                a: "Not yet, but we're exploring enterprise self-hosted options. Contact us if this is a requirement.",
              },
              {
                q: "What happens if I delete my account?",
                a: "All your data — review history, custom rules, and tokens — is permanently deleted within 24 hours.",
              },
            ].map((item) => (
              <div key={item.q}>
                <h3 className="text-sm font-medium text-foreground mb-1">{item.q}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t">
        <div className="max-w-4xl mx-auto px-6 py-16 text-center">
          <h2 className="text-xl font-medium text-foreground mb-3">Questions about security?</h2>
          <p className="text-sm text-muted-foreground mb-6">
            We're happy to discuss your security requirements. Reach out for a DPA or enterprise evaluation.
          </p>
          <button
            onClick={() => navigate("/login")}
            className="text-sm px-6 py-2.5 rounded-md bg-foreground text-background hover:bg-foreground/90 transition-colors inline-flex items-center gap-2"
          >
            Get started <ArrowRight className="h-3.5 w-3.5" strokeWidth={1.5} />
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
