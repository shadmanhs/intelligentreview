import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AppHeader } from "@/components/AppHeader";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { useOrganization } from "@/hooks/useOrganization";
import { usePermissions } from "@/hooks/usePermissions";
import { logAudit } from "@/lib/auditLog";
import { supabase } from "@/integrations/supabase/client";
import {
  ArrowLeft, Plus, Trash2, Shield, Loader2, ToggleLeft, ToggleRight,
  Sparkles, Lock, Users, Building2, BookOpen, Zap, Settings2, Code2
} from "lucide-react";
import { toast } from "sonner";

interface CustomRule {
  id: string;
  repo: string;
  rule_text: string;
  rule_type: string;
  conditions: any[];
  severity: string;
  enabled: boolean;
  created_at: string;
  user_id: string;
  org_id: string | null;
}

interface RuleCondition {
  type: string;
  value: string;
  filePattern?: string;
  target?: string;
  reason?: string;
}

const CONDITION_TYPES = [
  { type: "max_function_length", label: "Max function length", placeholder: "50", unit: "lines", description: "Flag functions exceeding this line count" },
  { type: "max_file_length", label: "Max file length", placeholder: "300", unit: "lines", description: "Flag files exceeding this line count" },
  { type: "forbid_pattern", label: "Forbid pattern", placeholder: "eval(", description: "Flag usage of this code pattern" },
  { type: "require_pattern", label: "Require pattern", placeholder: "try/catch", description: "Require this pattern in matching files" },
  { type: "require_error_handling", label: "Require error handling", placeholder: "async", description: "Require error handling for these constructs" },
  { type: "naming_convention", label: "Naming convention", placeholder: "camelCase", description: "Enforce naming convention" },
];

const SEVERITY_OPTIONS = [
  { value: "critical", label: "Critical", color: "text-destructive" },
  { value: "warning", label: "Warning", color: "text-warning" },
  { value: "suggestion", label: "Suggestion", color: "text-success" },
];

const RULE_TEMPLATES = [
  {
    category: "Security",
    icon: Shield,
    rules: [
      { repo: "*", rule_text: "Flag any SQL query that uses string concatenation or template literals instead of parameterized queries.", rule_type: "prompt" },
      { repo: "*", rule_text: "Flag any API endpoint that doesn't validate the request body with a schema (e.g., Zod, Joi, Yup).", rule_type: "prompt" },
      { repo: "*", rule_text: "", rule_type: "structured", conditions: [{ type: "forbid_pattern", value: "eval(", reason: "eval() is a security risk — use safer alternatives" }], severity: "critical" },
      { repo: "*", rule_text: "Flag any hardcoded API keys, tokens, or secrets in the codebase.", rule_type: "prompt" },
    ],
  },
  {
    category: "Error Handling",
    icon: Zap,
    rules: [
      { repo: "*", rule_text: "", rule_type: "structured", conditions: [{ type: "require_error_handling", value: "async" }], severity: "warning" },
      { repo: "*", rule_text: "Flag any API response handler that doesn't check for error status codes before using the response body.", rule_type: "prompt" },
      { repo: "*", rule_text: "", rule_type: "structured", conditions: [{ type: "forbid_pattern", value: "catch {}", reason: "Empty catch blocks silently swallow errors" }], severity: "warning" },
    ],
  },
  {
    category: "Code Quality",
    icon: BookOpen,
    rules: [
      { repo: "*", rule_text: "", rule_type: "structured", conditions: [{ type: "max_function_length", value: "50" }], severity: "suggestion" },
      { repo: "*", rule_text: "", rule_type: "structured", conditions: [{ type: "max_file_length", value: "300" }], severity: "suggestion" },
      { repo: "*", rule_text: "Flag any component that directly calls fetch() or supabase. Data fetching should go through dedicated hooks or service layers.", rule_type: "prompt" },
      { repo: "*", rule_text: "", rule_type: "structured", conditions: [{ type: "forbid_pattern", value: "TODO", reason: "TODOs should be tracked as issues, not left in code" }], severity: "suggestion" },
    ],
  },
];

function describeRule(rule: CustomRule): string {
  if (rule.rule_type === "prompt" && rule.rule_text) return rule.rule_text;
  if (rule.rule_type === "structured" && rule.conditions?.length > 0) {
    return rule.conditions.map((c: RuleCondition) => {
      const ct = CONDITION_TYPES.find(t => t.type === c.type);
      switch (c.type) {
        case "max_function_length": return `Functions must be ≤${c.value} lines`;
        case "max_file_length": return `Files must be ≤${c.value} lines`;
        case "forbid_pattern": return `Forbid "${c.value}"${c.reason ? ` — ${c.reason}` : ""}`;
        case "require_pattern": return `Require "${c.value}" in ${c.filePattern || "all files"}`;
        case "require_error_handling": return `Require error handling for ${c.value}`;
        case "naming_convention": return `Enforce ${c.value} naming for ${c.target || "identifiers"}`;
        default: return ct?.label || c.type;
      }
    }).join(" · ");
  }
  return rule.rule_text || "No description";
}

function describeTemplateRule(template: any): string {
  if (template.rule_type === "prompt") return template.rule_text;
  if (template.rule_type === "structured" && template.conditions?.length > 0) {
    return describeRule({ ...template, id: "", enabled: true, created_at: "", user_id: "", org_id: null } as CustomRule);
  }
  return template.rule_text;
}

export default function RulesPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { subscribed } = useSubscription();
  const { org, isAdmin } = useOrganization();
  const { hasPermission } = usePermissions();
  const canCreateRules = hasPermission("rules.create");
  const canDeleteRules = hasPermission("rules.delete");
  const [rules, setRules] = useState<CustomRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [addMode, setAddMode] = useState<"prompt" | "structured">("prompt");
  const [newRepo, setNewRepo] = useState("*");
  const [newRule, setNewRule] = useState("");
  const [newScope, setNewScope] = useState<"personal" | "team">("team");
  const [newSeverity, setNewSeverity] = useState("warning");
  const [newConditions, setNewConditions] = useState<RuleCondition[]>([{ type: "max_function_length", value: "" }]);
  const [showTemplates, setShowTemplates] = useState(false);

  useEffect(() => {
    if (user) loadRules();
  }, [user]);

  const loadRules = async () => {
    const query = supabase
      .from("custom_rules")
      .select("*")
      .order("created_at", { ascending: false });

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
    if (!canCreateRules) { toast.error("You don't have permission to create rules"); return; }
    if (addMode === "prompt" && !newRule.trim()) return;
    if (addMode === "structured" && newConditions.every(c => !c.value.trim())) return;

    const isOrgRule = newScope === "team" && org && isAdmin;
    const insert: any = {
      user_id: user!.id,
      org_id: isOrgRule ? org!.id : null,
      repo: newRepo.trim() || "*",
      rule_type: addMode,
      severity: newSeverity,
    };

    if (addMode === "prompt") {
      insert.rule_text = newRule.trim();
      insert.conditions = [];
    } else {
      insert.rule_text = "";
      insert.conditions = newConditions.filter(c => c.value.trim());
    }

    const { error } = await supabase.from("custom_rules").insert(insert);
    if (error) { toast.error("Failed to add rule"); return; }
    toast.success(isOrgRule ? "Team rule added" : "Personal rule added");
    resetForm();
    loadRules();
  };

  const resetForm = () => {
    setNewRepo("*");
    setNewRule("");
    setNewConditions([{ type: "max_function_length", value: "" }]);
    setNewSeverity("warning");
    setAdding(false);
  };

  const handleAddTemplate = async (template: any) => {
    const isOrgRule = org && isAdmin;
    const insert: any = {
      user_id: user!.id,
      org_id: isOrgRule ? org!.id : null,
      repo: template.repo,
      rule_type: template.rule_type || "prompt",
      rule_text: template.rule_text || "",
      conditions: template.conditions || [],
      severity: template.severity || "warning",
    };
    const { error } = await supabase.from("custom_rules").insert(insert);
    if (error) {
      if (error.message?.includes("duplicate")) { toast.error("Rule already exists"); return; }
      toast.error("Failed to add rule"); return;
    }
    toast.success("Rule added");
    loadRules();
  };

  const handleAddAllTemplates = async (category: typeof RULE_TEMPLATES[0]) => {
    const isOrgRule = org && isAdmin;
    const inserts = category.rules.map((r) => ({
      user_id: user!.id,
      org_id: isOrgRule ? org!.id : null,
      repo: r.repo,
      rule_text: r.rule_text || "",
      rule_type: r.rule_type || "prompt",
      conditions: (r as any).conditions || [],
      severity: (r as any).severity || "warning",
    }));
    const { error } = await supabase.from("custom_rules").insert(inserts);
    if (error) { toast.error("Failed to add rules"); return; }
    toast.success(`${category.rules.length} ${category.category} rules added`);
    loadRules();
  };

  const toggleRule = async (id: string, enabled: boolean) => {
    await supabase.from("custom_rules").update({ enabled: !enabled }).eq("id", id);
    setRules((prev) => prev.map((r) => r.id === id ? { ...r, enabled: !enabled } : r));
  };

  const deleteRule = async (id: string) => {
    if (!canDeleteRules) { toast.error("You don't have permission to delete rules"); return; }
    await supabase.from("custom_rules").delete().eq("id", id);
    setRules((prev) => prev.filter((r) => r.id !== id));
    await logAudit({ orgId: org?.id, action: "rule.deleted", entityType: "rule", entityId: id });
    toast.success("Rule deleted");
  };

  const orgRules = rules.filter(r => r.org_id !== null);
  const personalRules = rules.filter(r => r.org_id === null);
  const canManageRule = (rule: CustomRule) => rule.org_id ? isAdmin : rule.user_id === user?.id;

  const groupBy = (items: CustomRule[]) => {
    const grouped: Record<string, CustomRule[]> = {};
    items.forEach((r) => { if (!grouped[r.repo]) grouped[r.repo] = []; grouped[r.repo].push(r); });
    return grouped;
  };

  const addCondition = () => {
    setNewConditions([...newConditions, { type: "forbid_pattern", value: "" }]);
  };

  const updateCondition = (index: number, updates: Partial<RuleCondition>) => {
    setNewConditions(prev => prev.map((c, i) => i === index ? { ...c, ...updates } : c));
  };

  const removeCondition = (index: number) => {
    setNewConditions(prev => prev.filter((_, i) => i !== index));
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

  const renderRuleList = (items: CustomRule[], label?: string, sublabel?: string) => {
    const grouped = groupBy(items);
    return (
      <div>
        {label && (
          <div className="flex items-center gap-2 mb-3">
            <Users className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={1.5} />
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">{label}</span>
            {sublabel && <span className="text-[9px] text-muted-foreground/60">{sublabel}</span>}
          </div>
        )}
        {Object.entries(grouped).map(([repo, repoRules]) => (
          <div key={repo} className="mb-4">
            <p className="text-[11px] font-mono text-muted-foreground mb-2">{repo}</p>
            <div className="border rounded-lg divide-y">
              {repoRules.map((rule) => (
                <div key={rule.id} className={`px-4 py-3 flex items-start gap-3 ${!rule.enabled ? "opacity-50" : ""}`}>
                  {canManageRule(rule) && (
                    <button onClick={() => toggleRule(rule.id, rule.enabled)} className="shrink-0 mt-0.5 text-foreground">
                      {rule.enabled ? <ToggleRight className="h-4 w-4" strokeWidth={1.5} /> : <ToggleLeft className="h-4 w-4 text-muted-foreground" strokeWidth={1.5} />}
                    </button>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      {rule.rule_type === "structured" && (
                        <span className="text-[9px] px-1.5 py-px rounded bg-secondary text-muted-foreground font-mono">
                          <Settings2 className="h-2.5 w-2.5 inline mr-0.5" strokeWidth={1.5} />structured
                        </span>
                      )}
                      <span className={`text-[9px] uppercase tracking-wider ${
                        rule.severity === "critical" ? "text-destructive" : rule.severity === "warning" ? "text-warning" : "text-success"
                      }`}>{rule.severity}</span>
                    </div>
                    <p className="text-xs text-foreground leading-relaxed">{describeRule(rule)}</p>
                  </div>
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
    );
  };

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
              <p className="text-xs text-muted-foreground mb-3">Custom review rules are available on paid plans.</p>
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
            {/* Action buttons */}
            <div className="flex gap-2 mb-6">
              {adding ? null : (
                <>
                  <button
                    onClick={() => { setAdding(true); setAddMode("prompt"); }}
                    className="flex-1 border border-dashed rounded-lg p-3 text-xs text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors flex items-center justify-center gap-2"
                  >
                    <Plus className="h-3.5 w-3.5" strokeWidth={1.5} /> Text rule
                  </button>
                  <button
                    onClick={() => { setAdding(true); setAddMode("structured"); }}
                    className="flex-1 border border-dashed rounded-lg p-3 text-xs text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors flex items-center justify-center gap-2"
                  >
                    <Code2 className="h-3.5 w-3.5" strokeWidth={1.5} /> Structured rule
                  </button>
                  <button
                    onClick={() => setShowTemplates(!showTemplates)}
                    className={`flex-1 border rounded-lg p-3 text-xs transition-colors flex items-center justify-center gap-2 ${
                      showTemplates ? "border-foreground text-foreground bg-secondary" : "border-dashed text-muted-foreground hover:text-foreground hover:border-foreground/30"
                    }`}
                  >
                    <BookOpen className="h-3.5 w-3.5" strokeWidth={1.5} /> Templates
                  </button>
                </>
              )}
            </div>

            {/* Template library */}
            {showTemplates && (
              <div className="border-2 border-foreground/10 rounded-lg p-5 mb-6 space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">Rule Templates</p>
                    <p className="text-[10px] text-muted-foreground">
                      Pre-built rules including structured conditions. {org ? "Added as team rules." : "Added as personal rules."}
                    </p>
                  </div>
                  <button onClick={() => setShowTemplates(false)} className="text-xs text-muted-foreground hover:text-foreground transition-colors">Close</button>
                </div>

                {RULE_TEMPLATES.map((category) => (
                  <div key={category.category}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <category.icon className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={1.5} />
                        <span className="text-xs font-medium text-foreground">{category.category}</span>
                        <span className="text-[9px] text-muted-foreground">({category.rules.length} rules)</span>
                      </div>
                      <button
                        onClick={() => handleAddAllTemplates(category)}
                        className="text-[10px] px-2 py-1 rounded bg-foreground text-background hover:bg-foreground/90 transition-colors"
                      >Add all</button>
                    </div>
                    <div className="space-y-1.5">
                      {category.rules.map((rule, i) => (
                        <div key={i} className="flex items-start gap-2 px-3 py-2 rounded border">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 mb-0.5">
                              {rule.rule_type === "structured" && (
                                <span className="text-[8px] px-1 py-px rounded bg-secondary text-muted-foreground font-mono">structured</span>
                              )}
                              {(rule as any).severity && (
                                <span className={`text-[8px] uppercase ${(rule as any).severity === "critical" ? "text-destructive" : (rule as any).severity === "suggestion" ? "text-success" : "text-warning"}`}>
                                  {(rule as any).severity}
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-foreground leading-relaxed">{describeTemplateRule(rule)}</p>
                          </div>
                          <button
                            onClick={() => handleAddTemplate(rule)}
                            className="text-[10px] px-2 py-0.5 rounded bg-secondary text-foreground hover:bg-foreground hover:text-background transition-colors shrink-0"
                          >Add</button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Add rule form */}
            {adding && (
              <div className="border rounded-lg p-4 mb-6 space-y-3">
                {/* Mode tabs */}
                <div className="flex gap-2 mb-1">
                  <button
                    onClick={() => setAddMode("prompt")}
                    className={`text-[11px] px-3 py-1.5 rounded border flex items-center gap-1.5 transition-colors ${
                      addMode === "prompt" ? "border-foreground text-foreground bg-secondary" : "text-muted-foreground"
                    }`}
                  >Text rule</button>
                  <button
                    onClick={() => setAddMode("structured")}
                    className={`text-[11px] px-3 py-1.5 rounded border flex items-center gap-1.5 transition-colors ${
                      addMode === "structured" ? "border-foreground text-foreground bg-secondary" : "text-muted-foreground"
                    }`}
                  >
                    <Settings2 className="h-3 w-3" strokeWidth={1.5} /> Structured
                  </button>
                </div>

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
                      >Personal</button>
                    </div>
                  </div>
                )}

                <div className="flex gap-3">
                  <div className="flex-1">
                    <label className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1 block">Repository</label>
                    <input
                      type="text"
                      value={newRepo}
                      onChange={(e) => setNewRepo(e.target.value)}
                      placeholder="owner/repo or * for all"
                      className="w-full px-3 py-2 text-sm border rounded-md bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-foreground/20 transition-all font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1 block">Severity</label>
                    <select
                      value={newSeverity}
                      onChange={(e) => setNewSeverity(e.target.value)}
                      className="px-3 py-2 text-sm border rounded-md bg-transparent text-foreground focus:outline-none focus:ring-1 focus:ring-foreground/20"
                    >
                      {SEVERITY_OPTIONS.map(s => (
                        <option key={s.value} value={s.value}>{s.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {addMode === "prompt" ? (
                  <div>
                    <label className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1 block">Rule (natural language)</label>
                    <textarea
                      value={newRule}
                      onChange={(e) => setNewRule(e.target.value)}
                      placeholder="e.g., Always flag API routes that don't validate request body."
                      rows={3}
                      className="w-full px-3 py-2 text-sm border rounded-md bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-foreground/20 transition-all resize-none"
                      autoFocus
                    />
                  </div>
                ) : (
                  <div className="space-y-2">
                    <label className="text-[10px] text-muted-foreground uppercase tracking-wider block">Conditions</label>
                    {newConditions.map((cond, idx) => {
                      const ct = CONDITION_TYPES.find(t => t.type === cond.type);
                      return (
                        <div key={idx} className="flex items-start gap-2 p-3 rounded border bg-secondary/30">
                          <div className="flex-1 space-y-2">
                            <select
                              value={cond.type}
                              onChange={(e) => updateCondition(idx, { type: e.target.value })}
                              className="w-full px-2 py-1.5 text-xs border rounded bg-transparent text-foreground"
                            >
                              {CONDITION_TYPES.map(t => (
                                <option key={t.type} value={t.type}>{t.label}</option>
                              ))}
                            </select>
                            <p className="text-[10px] text-muted-foreground">{ct?.description}</p>
                            <div className="flex gap-2">
                              <input
                                type="text"
                                value={cond.value}
                                onChange={(e) => updateCondition(idx, { value: e.target.value })}
                                placeholder={ct?.placeholder}
                                className="flex-1 px-2 py-1.5 text-xs border rounded bg-transparent text-foreground placeholder:text-muted-foreground font-mono"
                              />
                              {ct?.unit && <span className="text-[10px] text-muted-foreground self-center">{ct.unit}</span>}
                            </div>
                            {(cond.type === "forbid_pattern" || cond.type === "require_pattern") && (
                              <input
                                type="text"
                                value={cond.reason || ""}
                                onChange={(e) => updateCondition(idx, { reason: e.target.value })}
                                placeholder="Reason (optional)"
                                className="w-full px-2 py-1.5 text-xs border rounded bg-transparent text-foreground placeholder:text-muted-foreground"
                              />
                            )}
                            {cond.type === "require_pattern" && (
                              <input
                                type="text"
                                value={cond.filePattern || ""}
                                onChange={(e) => updateCondition(idx, { filePattern: e.target.value })}
                                placeholder="File pattern, e.g. *.ts"
                                className="w-full px-2 py-1.5 text-xs border rounded bg-transparent text-foreground placeholder:text-muted-foreground font-mono"
                              />
                            )}
                          </div>
                          {newConditions.length > 1 && (
                            <button onClick={() => removeCondition(idx)} className="text-muted-foreground hover:text-destructive transition-colors mt-1">
                              <Trash2 className="h-3 w-3" strokeWidth={1.5} />
                            </button>
                          )}
                        </div>
                      );
                    })}
                    <button
                      onClick={addCondition}
                      className="text-[10px] text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
                    >
                      <Plus className="h-3 w-3" strokeWidth={1.5} /> Add condition
                    </button>
                  </div>
                )}

                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={handleAdd}
                    disabled={addMode === "prompt" ? !newRule.trim() : newConditions.every(c => !c.value.trim())}
                    className="text-[11px] px-3 py-1.5 rounded bg-foreground text-background hover:bg-foreground/90 disabled:opacity-50 transition-colors"
                  >Add rule</button>
                  <button onClick={resetForm} className="text-[11px] text-muted-foreground hover:text-foreground transition-colors">Cancel</button>
                </div>
              </div>
            )}
          </>
        )}

        {/* Rules list */}
        {rules.length === 0 && !showTemplates ? (
          <div className="text-center py-16 border rounded-lg">
            <Shield className="h-8 w-8 text-muted-foreground/30 mx-auto mb-3" strokeWidth={1} />
            <p className="text-sm text-foreground mb-1">No review rules yet</p>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto mb-4">
              Rules tell the AI what to always check for. Start with templates or write your own.
            </p>
            {subscribed && (
              <button
                onClick={() => setShowTemplates(true)}
                className="text-xs px-4 py-2 rounded-md bg-foreground text-background hover:bg-foreground/90 transition-colors inline-flex items-center gap-1.5"
              >
                <BookOpen className="h-3 w-3" strokeWidth={1.5} /> Browse templates
              </button>
            )}
          </div>
        ) : rules.length > 0 && (
          <div className="space-y-8">
            {orgRules.length > 0 && renderRuleList(orgRules, `Team rules — ${org?.name}`, "applies to all members")}
            {personalRules.length > 0 && renderRuleList(personalRules, orgRules.length > 0 ? "Your personal rules" : undefined)}
          </div>
        )}
      </main>
    </div>
  );
}
