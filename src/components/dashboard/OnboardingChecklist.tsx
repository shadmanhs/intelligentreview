import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Check, Github, FileCode, Zap, Webhook, ChevronDown, ChevronUp, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface Step {
  id: string;
  label: string;
  description: string;
  icon: React.ElementType;
  route: string;
  completed: boolean;
}

export function OnboardingChecklist() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [steps, setSteps] = useState<Step[]>([
    { id: "github", label: "Connect GitHub", description: "Link your GitHub account to pull in PRs", icon: Github, route: "/connect-github", completed: false },
    { id: "rule", label: "Create a review rule", description: "Set a custom rule so reviews match your standards", icon: FileCode, route: "/app/rules", completed: false },
    { id: "review", label: "Run your first review", description: "Analyze a PR with AI-powered review", icon: Zap, route: "/app", completed: false },
    { id: "webhook", label: "Set up auto-review", description: "Enable webhook for automatic PR reviews", icon: Webhook, route: "/settings", completed: false },
  ]);

  useEffect(() => {
    if (!user) return;
    if (localStorage.getItem(`onboarding_dismissed_${user.id}`) === "true") {
      setDismissed(true);
      return;
    }
    checkProgress();
  }, [user]);

  const checkProgress = async () => {
    if (!user) return;

    const [ghRes, rulesRes, sessionsRes] = await Promise.all([
      supabase.from("github_connections").select("id").eq("user_id", user.id).maybeSingle(),
      supabase.from("custom_rules").select("id").eq("user_id", user.id).limit(1),
      supabase.from("review_sessions").select("id").eq("user_id", user.id).limit(1),
    ]);

    setSteps(prev => prev.map(step => {
      if (step.id === "github") return { ...step, completed: !!ghRes.data };
      if (step.id === "rule") return { ...step, completed: (rulesRes.data?.length ?? 0) > 0 };
      if (step.id === "review") return { ...step, completed: (sessionsRes.data?.length ?? 0) > 0 };
      return step;
    }));
  };

  const completedCount = steps.filter(s => s.completed).length;
  const allDone = completedCount === steps.length;

  if (dismissed || allDone) return null;

  const handleDismiss = () => {
    if (user) localStorage.setItem(`onboarding_dismissed_${user.id}`, "true");
    setDismissed(true);
  };

  const progress = Math.round((completedCount / steps.length) * 100);

  return (
    <div className="border rounded-lg mb-6 bg-card overflow-hidden">
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="w-full flex items-center justify-between px-4 py-3 text-left"
      >
        <div className="flex items-center gap-3">
          <Sparkles className="h-4 w-4 text-foreground" strokeWidth={1.5} />
          <div>
            <p className="text-xs font-medium text-foreground">
              Get started — {completedCount} of {steps.length} complete
            </p>
            <div className="mt-1.5 h-1 w-32 rounded-full bg-secondary overflow-hidden">
              <div
                className="h-full bg-foreground rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>
        {collapsed ? (
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
        ) : (
          <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" />
        )}
      </button>

      {!collapsed && (
        <div className="border-t divide-y">
          {steps.map((step) => (
            <button
              key={step.id}
              onClick={() => !step.completed && navigate(step.route)}
              disabled={step.completed}
              className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-accent/50 transition-colors disabled:cursor-default"
            >
              <div className={`h-5 w-5 rounded-full flex items-center justify-center shrink-0 ${
                step.completed
                  ? "bg-foreground text-background"
                  : "border border-muted-foreground/30"
              }`}>
                {step.completed && <Check className="h-3 w-3" strokeWidth={2} />}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-xs font-medium ${step.completed ? "text-muted-foreground line-through" : "text-foreground"}`}>
                  {step.label}
                </p>
                <p className="text-[10px] text-muted-foreground">{step.description}</p>
              </div>
              <step.icon className="h-3.5 w-3.5 text-muted-foreground shrink-0" strokeWidth={1.5} />
            </button>
          ))}
          <div className="px-4 py-2 flex justify-end">
            <button
              onClick={handleDismiss}
              className="text-[10px] text-muted-foreground hover:text-foreground transition-colors"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
