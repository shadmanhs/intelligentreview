import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AppHeader } from "@/components/AppHeader";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { useOrganization } from "@/hooks/useOrganization";
import { supabase } from "@/integrations/supabase/client";
import {
  ArrowLeft, Plus, Trash2, Shield, Loader2, ToggleLeft, ToggleRight,
  Sparkles, Lock, Users, Building2
} from "lucide-react";
import { toast } from "sonner";

interface CustomRule {
  id: string;
  repo: string;
  rule_text: string;
  enabled: boolean;
  created_at: string;
  user_id: string;
  org_id: string | null;
}

export default function RulesPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { subscribed } = useSubscription();
  const { org, isAdmin } = useOrganization();
  const [rules, setRules] = useState<CustomRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [newRepo, setNewRepo] = useState("");
  const [newRule, setNewRule] = useState("");
  const [newScope, setNewScope] = useState<"personal" | "team">("team");

  useEffect(() => {
    if (user) loadRules();
  }, [user]);

  const loadRules = async () => {
    // Fetch personal rules + org rules (RLS handles filtering)
    const query = supabase
      .from("custom_rules")
      .select("*")
      .order("created_at", { ascending: false });

    // If user has an org, get both personal and org rules
    if (org) {
      query.or(`user_id.eq.${user!.id},org_id.eq.${org.id}`);
    } else {
      query.eq("user_id", user!.id);
    }

    const { data } = await query;
    setRules((data as unknown as CustomRule[]) || []);
    setLoading(false);
  };

  const handleAdd = async () => {
    if (!newRepo.trim() || !newRule.trim()) return;

    const isOrgRule = newScope === "team" && org && isAdmin;

    const { error } = await supabase.from("custom_rules").insert({
      user_id: user!.id,
      org_id: isOrgRule ? org!.id : null,
      repo: newRepo.trim(),
      rule_text: newRule.trim(),
    });
    if (error) {
      toast.error("Failed to add rule");
      return;
    }
    toast.success(isOrgRule ? "Team rule added — applies to all members" : "Personal rule added");
    setNewRepo("");
    setNewRule("");
    setAdding(false);
    loadRules();
  };

  const toggleRule = async (id: string, enabled: boolean) => {
    await supabase.from("custom_rules").update({ enabled: !enabled }).eq("id", id);
    setRules((prev) => prev.map((r) => r.id === id ? { ...r, enabled: !enabled } : r));
  };

  const deleteRule = async (id: string) => {
    await supabase.from("custom_rules").delete().eq("id", id);
    setRules((prev) => prev.filter((r) => r.id !== id));
    toast.success("Rule deleted");
  };

  // Separate org rules from personal rules
  const orgRules = rules.filter(r => r.org_id !== null);
  const personalRules = rules.filter(r => r.org_id === null);

  // Group rules by repo
  const groupBy = (items: CustomRule[]) => {
    const grouped: Record<string, CustomRule[]> = {};
    items.forEach((r) => {
      if (!grouped[r.repo]) grouped[r.repo] = [];
      grouped[r.repo].push(r);
    });
    return grouped;
  };

  const groupedOrgRules = groupBy(orgRules);
  const groupedPersonalRules = groupBy(personalRules);

  const canManageRule = (rule: CustomRule) => {
    if (rule.org_id) return isAdmin;
    return rule.user_id === user?.id;
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
      <main className="flex-1 max-w-2xl mx-auto w-full px-6 py-8">
        <div className="flex items-center gap-3 mb-2">
          <button onClick={() => navigate("/app")} className="text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" strokeWidth={1.5} />
          </button>
          <h1 className="text-lg font-medium tracking-tight text-foreground">Review Rules</h1>
        </div>
        <p className="text-xs text-muted-foreground mb-8 ml-7">
          {org
            ? "Team rules apply to all members. Personal rules apply only to you."
            : "Define per-repo rules that the AI will enforce during every review."}
        </p>

        {!subscribed && (
          <div className="border-2 border-foreground/10 rounded-lg p-5 mb-6 flex items-start gap-3">
            <Lock className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" strokeWidth={1.5} />
            <div>
              <p className="text-sm font-medium text-foreground mb-1">Pro feature</p>
              <p className="text-xs text-muted-foreground mb-3">Custom review rules are available on paid plans. Upgrade to teach ReviewLens your team's standards.</p>
              <button
                onClick={() => navigate("/pricing")}
                className="text-xs px-3 py-1.5 rounded-md bg-foreground text-background hover:bg-foreground/90 transition-colors inline-flex items-center gap-1.5"
              >
                <Sparkles className="h-3 w-3" strokeWidth={1.5} /> View plans
              </button>
            </div>
          </div>
        )}

        {subscribed && (
          <>
            {/* Add rule */}
            {adding ? (
              <div className="border rounded-lg p-4 mb-6 space-y-3">
                {/* Scope selector — only show if user has an org and is admin */}
                {org && isAdmin && (
                  <div>
                    <label className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1.5 block">Scope</label>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setNewScope("team")}
                        className={`text-[11px] px-3 py-1.5 rounded border flex items-center gap-1.5 transition-colors ${
                          newScope === "team" ? "border-foreground text-foreground bg-secondary" : "text-muted-foreground"
                        }`}
                      >
                        <Building2 className="h-3 w-3" strokeWidth={1.5} /> Team rule
                      </button>
                      <button
                        onClick={() => setNewScope("personal")}
                        className={`text-[11px] px-3 py-1.5 rounded border flex items-center gap-1.5 transition-colors ${
                          newScope === "personal" ? "border-foreground text-foreground bg-secondary" : "text-muted-foreground"
                        }`}
                      >
                        Personal
                      </button>
                    </div>
                    {newScope === "team" && (
                      <p className="text-[10px] text-muted-foreground mt-1">This rule will apply to all {org.name} members.</p>
                    )}
                  </div>
                )}
                <div>
                  <label className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1 block">Repository</label>
                  <input
                    type="text"
                    value={newRepo}
                    onChange={(e) => setNewRepo(e.target.value)}
                    placeholder="owner/repo or * for all repos"
                    className="w-full px-3 py-2 text-sm border rounded-md bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-foreground/20 transition-all font-mono"
                    autoFocus
                  />
                </div>
                <div>
                  <label className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1 block">Rule</label>
                  <textarea
                    value={newRule}
                    onChange={(e) => setNewRule(e.target.value)}
                    placeholder="e.g., Always flag API routes that don't validate request body. Our standard is to use zod schemas for all endpoint inputs."
                    rows={3}
                    className="w-full px-3 py-2 text-sm border rounded-md bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-foreground/20 transition-all resize-none"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleAdd}
                    disabled={!newRepo.trim() || !newRule.trim()}
                    className="text-[11px] px-3 py-1.5 rounded bg-foreground text-background hover:bg-foreground/90 disabled:opacity-50 transition-colors"
                  >
                    Add rule
                  </button>
                  <button onClick={() => { setAdding(false); setNewRepo(""); setNewRule(""); }} className="text-[11px] text-muted-foreground hover:text-foreground transition-colors">
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setAdding(true)}
                className="w-full border border-dashed rounded-lg p-4 mb-6 text-xs text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors flex items-center justify-center gap-2"
              >
                <Plus className="h-3.5 w-3.5" strokeWidth={1.5} /> Add a review rule
              </button>
            )}
          </>
        )}

        {/* Rules list */}
        {rules.length === 0 ? (
          <div className="text-center py-16 border rounded-lg">
            <Shield className="h-8 w-8 text-muted-foreground/30 mx-auto mb-3" strokeWidth={1} />
            <p className="text-sm text-foreground mb-1">No review rules yet</p>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              Rules tell the AI what to always check for. Examples: "Flag missing error handling in API routes" or "Ensure all database queries use parameterized inputs."
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Team rules section */}
            {orgRules.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Users className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={1.5} />
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">
                    Team rules — {org?.name}
                  </span>
                  <span className="text-[9px] text-muted-foreground/60">applies to all members</span>
                </div>
                {Object.entries(groupedOrgRules).map(([repo, repoRules]) => (
                  <div key={`org-${repo}`} className="mb-4">
                    <p className="text-[11px] font-mono text-muted-foreground mb-2">{repo}</p>
                    <div className="border rounded-lg divide-y">
                      {repoRules.map((rule) => (
                        <div key={rule.id} className={`px-4 py-3 flex items-start gap-3 ${!rule.enabled ? "opacity-50" : ""}`}>
                          {canManageRule(rule) && (
                            <button onClick={() => toggleRule(rule.id, rule.enabled)} className="shrink-0 mt-0.5 text-foreground">
                              {rule.enabled ? (
                                <ToggleRight className="h-4 w-4" strokeWidth={1.5} />
                              ) : (
                                <ToggleLeft className="h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
                              )}
                            </button>
                          )}
                          <p className="text-xs text-foreground leading-relaxed flex-1">{rule.rule_text}</p>
                          {canManageRule(rule) && (
                            <button onClick={() => deleteRule(rule.id)} className="shrink-0 text-muted-foreground hover:text-destructive transition-colors">
                              <Trash2 className="h-3.5 w-3.5" strokeWidth={1.5} />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Personal rules section */}
            {personalRules.length > 0 && (
              <div>
                {orgRules.length > 0 && (
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">
                      Your personal rules
                    </span>
                  </div>
                )}
                {Object.entries(groupedPersonalRules).map(([repo, repoRules]) => (
                  <div key={`personal-${repo}`} className="mb-4">
                    <p className="text-[11px] font-mono text-muted-foreground mb-2">{repo}</p>
                    <div className="border rounded-lg divide-y">
                      {repoRules.map((rule) => (
                        <div key={rule.id} className={`px-4 py-3 flex items-start gap-3 ${!rule.enabled ? "opacity-50" : ""}`}>
                          <button onClick={() => toggleRule(rule.id, rule.enabled)} className="shrink-0 mt-0.5 text-foreground">
                            {rule.enabled ? (
                              <ToggleRight className="h-4 w-4" strokeWidth={1.5} />
                            ) : (
                              <ToggleLeft className="h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
                            )}
                          </button>
                          <p className="text-xs text-foreground leading-relaxed flex-1">{rule.rule_text}</p>
                          <button onClick={() => deleteRule(rule.id)} className="shrink-0 text-muted-foreground hover:text-destructive transition-colors">
                            <Trash2 className="h-3.5 w-3.5" strokeWidth={1.5} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
