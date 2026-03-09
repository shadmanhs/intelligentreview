import { AlertTriangle, CheckCircle } from "lucide-react";

/**
 * A code-rendered mockup of a ReviewLens auto-review comment,
 * matching the app's design system. Replaces the AI-generated screenshot.
 */
export function ReviewCardMockup() {
  return (
    <div className="rounded-lg border bg-card text-card-foreground shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-5 pt-5 pb-3">
        <div className="flex items-center gap-2 mb-3">
          <div className="h-6 w-6 rounded-full bg-foreground flex items-center justify-center">
            <span className="text-background text-[10px] font-bold">RL</span>
          </div>
          <span className="text-sm font-semibold text-foreground">ReviewLens Auto-Review</span>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          This PR modifies authentication middleware. 2 concerns found.
        </p>
      </div>

      {/* Critical finding */}
      <div className="px-5 py-3">
        <div className="flex items-center gap-2 mb-2">
          <AlertTriangle className="h-3.5 w-3.5 text-destructive" strokeWidth={2} />
          <span className="text-xs font-semibold text-destructive uppercase tracking-wide">Critical</span>
          <span className="text-xs text-foreground">— SQL injection in user query</span>
        </div>
        <div className="rounded-md border bg-secondary/50 px-4 py-3 font-mono text-[11px] text-foreground leading-relaxed overflow-x-auto">
          <div className="text-muted-foreground">
            <span className="text-destructive">−</span>{" "}
            <span className="text-destructive/80">db.query(</span>
            <span className="text-amber-600 dark:text-amber-400">{"`SELECT * FROM users WHERE id = ${req.params.id}`"}</span>
            <span className="text-destructive/80">)</span>
          </div>
          <div className="mt-1">
            <span className="text-emerald-600 dark:text-emerald-400">+</span>{" "}
            <span className="text-emerald-600 dark:text-emerald-400">db.query(</span>
            <span className="text-amber-600 dark:text-amber-400">"SELECT * FROM users WHERE id = $1"</span>
            <span className="text-emerald-600 dark:text-emerald-400">, [req.params.id])</span>
          </div>
        </div>
      </div>

      {/* Warning finding */}
      <div className="px-5 py-3">
        <div className="flex items-center gap-2">
          <CheckCircle className="h-3.5 w-3.5 text-amber-500" strokeWidth={2} />
          <span className="text-xs font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wide">Warning</span>
          <span className="text-xs text-foreground">— Missing rate limit on /api/auth endpoint</span>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t px-5 py-3 flex items-center gap-2 text-[10px] text-muted-foreground">
        <span>2 concerns</span>
        <span>·</span>
        <span className="font-medium text-destructive">Risk: HIGH</span>
        <span>·</span>
        <span className="text-primary font-medium">ReviewLens</span>
      </div>
    </div>
  );
}
