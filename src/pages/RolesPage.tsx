import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppHeader } from "@/components/AppHeader";
import { useOrganization } from "@/hooks/useOrganization";
import { usePermissions, ALL_PERMISSIONS, PERMISSION_CATEGORIES, Permission, CustomRole } from "@/hooks/usePermissions";
import {
  ArrowLeft, Plus, Shield, Trash2, Pencil, Check, X, Users, Loader2, Lock, Sparkles
} from "lucide-react";
import { useSubscription } from "@/hooks/useSubscription";
import { toast } from "sonner";

function RoleEditor({ 
  initial, 
  onSave, 
  onCancel 
}: { 
  initial?: CustomRole; 
  onSave: (name: string, desc: string, perms: Record<string, boolean>) => Promise<void>;
  onCancel: () => void;
}) {
  const [name, setName] = useState(initial?.name || "");
  const [desc, setDesc] = useState(initial?.description || "");
  const [perms, setPerms] = useState<Record<string, boolean>>(initial?.permissions || {});
  const [saving, setSaving] = useState(false);

  const toggle = (p: string) => setPerms(prev => ({ ...prev, [p]: !prev[p] }));
  const toggleCategory = (permissions: Permission[]) => {
    const allOn = permissions.every(p => perms[p]);
    const updated = { ...perms };
    permissions.forEach(p => { updated[p] = !allOn; });
    setPerms(updated);
  };

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      await onSave(name.trim(), desc.trim(), perms);
    } catch (err: any) {
      toast.error(err.message || "Failed to save role");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="border rounded-lg p-5 space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1 block">Role name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Senior Reviewer"
            className="w-full px-3 py-2 text-sm border rounded-md bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-foreground/20"
            autoFocus
          />
        </div>
        <div>
          <label className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1 block">Description</label>
          <input
            type="text"
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            placeholder="What this role does"
            className="w-full px-3 py-2 text-sm border rounded-md bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-foreground/20"
          />
        </div>
      </div>

      <div>
        <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-3">Permissions</p>
        <div className="space-y-4">
          {Object.entries(PERMISSION_CATEGORIES).map(([category, categoryPerms]) => (
            <div key={category}>
              <button
                onClick={() => toggleCategory(categoryPerms)}
                className="text-xs font-medium text-foreground mb-2 flex items-center gap-1.5 hover:text-foreground/80 transition-colors"
              >
                <div className={`h-3 w-3 rounded border flex items-center justify-center ${
                  categoryPerms.every(p => perms[p]) ? "bg-foreground border-foreground" : ""
                }`}>
                  {categoryPerms.every(p => perms[p]) && <Check className="h-2 w-2 text-background" strokeWidth={3} />}
                </div>
                {category}
              </button>
              <div className="grid grid-cols-2 gap-1 ml-5">
                {categoryPerms.map(p => (
                  <button
                    key={p}
                    onClick={() => toggle(p)}
                    className="flex items-center gap-2 text-xs py-1 hover:text-foreground transition-colors text-left"
                  >
                    <div className={`h-3 w-3 rounded border flex items-center justify-center shrink-0 ${
                      perms[p] ? "bg-foreground border-foreground" : ""
                    }`}>
                      {perms[p] && <Check className="h-2 w-2 text-background" strokeWidth={3} />}
                    </div>
                    <span className={perms[p] ? "text-foreground" : "text-muted-foreground"}>
                      {ALL_PERMISSIONS[p]}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2 pt-2">
        <button
          onClick={handleSave}
          disabled={!name.trim() || saving}
          className="text-[11px] px-3 py-1.5 rounded bg-foreground text-background hover:bg-foreground/90 disabled:opacity-50 transition-colors"
        >
          {saving ? "Saving…" : initial ? "Update role" : "Create role"}
        </button>
        <button onClick={onCancel} className="text-[11px] text-muted-foreground hover:text-foreground transition-colors">
          Cancel
        </button>
      </div>
    </div>
  );
}

// Pre-built role templates
const ROLE_TEMPLATES = [
  {
    name: "Reviewer",
    description: "Can trigger and manage reviews, view insights",
    permissions: {
      "review.trigger": true, "review.approve": true, "review.post_comments": true, "review.view": true,
      "team.view_insights": true,
    },
  },
  {
    name: "Viewer",
    description: "Read-only access to reviews and insights",
    permissions: {
      "review.view": true, "team.view_insights": true,
    },
  },
  {
    name: "Rules Manager",
    description: "Full access to rules, limited review access",
    permissions: {
      "review.view": true, "rules.create": true, "rules.edit": true, "rules.delete": true, "rules.manage_templates": true,
      "team.view_insights": true,
    },
  },
];

export default function RolesPage() {
  const navigate = useNavigate();
  const { org, members, isAdmin } = useOrganization();
  const { subscribed } = useSubscription();
  const { roles, assignments, createRole, updateRole, deleteRole, assignRole, unassignRole, loading } = usePermissions();
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [assigningRoleId, setAssigningRoleId] = useState<string | null>(null);

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

  if (!subscribed || !org) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <AppHeader showUser />
        <main className="flex-1 max-w-2xl mx-auto w-full px-6 py-8">
          <button onClick={() => navigate("/app/team")} className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5 text-xs mb-8">
            <ArrowLeft className="h-3.5 w-3.5" strokeWidth={1.5} /> Back to team
          </button>
          <div className="border-2 border-foreground/10 rounded-lg p-8 text-center">
            <Lock className="h-6 w-6 text-muted-foreground mx-auto mb-3" strokeWidth={1.5} />
            <p className="text-sm font-medium text-foreground mb-1">RBAC requires a Team plan with an organization</p>
            <p className="text-xs text-muted-foreground mb-4">Create a team first, then manage custom roles and permissions.</p>
            <button onClick={() => navigate(org ? "/pricing" : "/app/team")} className="text-xs px-4 py-2 rounded-md bg-foreground text-background hover:bg-foreground/90 transition-colors inline-flex items-center gap-1.5">
              <Sparkles className="h-3 w-3" strokeWidth={1.5} /> {org ? "View plans" : "Set up team"}
            </button>
          </div>
        </main>
      </div>
    );
  }

  const handleCreateFromTemplate = async (template: typeof ROLE_TEMPLATES[0]) => {
    try {
      await createRole(template.name, template.description, template.permissions);
      toast.success(`Role "${template.name}" created`);
    } catch (err: any) {
      if (err.message?.includes("duplicate")) {
        toast.error(`Role "${template.name}" already exists`);
      } else {
        toast.error(err.message || "Failed to create role");
      }
    }
  };

  const handleDelete = async (role: CustomRole) => {
    if (!confirm(`Delete the "${role.name}" role? Members with this role will lose its permissions.`)) return;
    try {
      await deleteRole(role.id);
      toast.success("Role deleted");
    } catch (err: any) {
      toast.error(err.message || "Failed to delete role");
    }
  };

  const handleAssign = async (userId: string, roleId: string) => {
    try {
      await assignRole(userId, roleId);
      toast.success("Role assigned");
      setAssigningRoleId(null);
    } catch (err: any) {
      if (err.message?.includes("duplicate")) {
        toast.error("This member already has this role");
      } else {
        toast.error(err.message || "Failed to assign role");
      }
    }
  };

  const roleAssignments = (roleId: string) => assignments.filter(a => a.role_id === roleId);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <AppHeader showUser />
      <main className="flex-1 max-w-2xl mx-auto w-full px-6 py-8">
        <div className="flex items-center gap-3 mb-2">
          <button onClick={() => navigate("/app/team")} className="text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" strokeWidth={1.5} />
          </button>
          <div className="flex-1">
            <h1 className="text-lg font-medium tracking-tight text-foreground">Roles & Permissions</h1>
          </div>
          <Shield className="h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
        </div>
        <p className="text-xs text-muted-foreground mb-6 ml-7">
          Define custom roles with granular permissions for your team.
        </p>

        {/* Quick-start templates */}
        {roles.length === 0 && isAdmin && (
          <div className="border-2 border-dashed rounded-lg p-5 mb-6">
            <p className="text-xs font-medium text-foreground mb-3">Quick start — add a template role</p>
            <div className="grid grid-cols-3 gap-2">
              {ROLE_TEMPLATES.map(t => (
                <button
                  key={t.name}
                  onClick={() => handleCreateFromTemplate(t)}
                  className="border rounded-lg p-3 text-left hover:bg-secondary/30 transition-colors"
                >
                  <p className="text-xs font-medium text-foreground">{t.name}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{t.description}</p>
                  <p className="text-[9px] text-muted-foreground mt-1">
                    {Object.values(t.permissions).filter(Boolean).length} permissions
                  </p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Existing roles */}
        {roles.length > 0 && (
          <div className="space-y-3 mb-6">
            {roles.map(role => {
              const ra = roleAssignments(role.id);
              const permCount = Object.values(role.permissions).filter(Boolean).length;
              
              if (editingId === role.id) {
                return (
                  <RoleEditor
                    key={role.id}
                    initial={role}
                    onSave={async (name, desc, perms) => {
                      await updateRole(role.id, { name, description: desc, permissions: perms });
                      setEditingId(null);
                      toast.success("Role updated");
                    }}
                    onCancel={() => setEditingId(null)}
                  />
                );
              }

              return (
                <div key={role.id} className="border rounded-lg">
                  <div className="px-4 py-3 flex items-center gap-3">
                    <Shield className="h-3.5 w-3.5 text-muted-foreground shrink-0" strokeWidth={1.5} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">{role.name}</p>
                      <p className="text-[10px] text-muted-foreground">{role.description || "No description"} · {permCount} permissions · {ra.length} assigned</p>
                    </div>
                    {isAdmin && (
                      <div className="flex items-center gap-1">
                        <button onClick={() => setAssigningRoleId(assigningRoleId === role.id ? null : role.id)} className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded hover:bg-secondary">
                          <Users className="h-3.5 w-3.5" strokeWidth={1.5} />
                        </button>
                        <button onClick={() => setEditingId(role.id)} className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded hover:bg-secondary">
                          <Pencil className="h-3.5 w-3.5" strokeWidth={1.5} />
                        </button>
                        <button onClick={() => handleDelete(role)} className="text-muted-foreground hover:text-destructive transition-colors p-1 rounded hover:bg-secondary">
                          <Trash2 className="h-3.5 w-3.5" strokeWidth={1.5} />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Permission badges */}
                  <div className="px-4 pb-3 flex flex-wrap gap-1">
                    {Object.entries(role.permissions).filter(([, v]) => v).map(([key]) => (
                      <span key={key} className="text-[9px] px-1.5 py-0.5 rounded bg-secondary text-muted-foreground">
                        {ALL_PERMISSIONS[key as Permission] || key}
                      </span>
                    ))}
                  </div>

                  {/* Assign members panel */}
                  {assigningRoleId === role.id && isAdmin && (
                    <div className="border-t px-4 py-3">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2">Assign to members</p>
                      <div className="space-y-1">
                        {members.filter(m => m.role !== "owner").map(m => {
                          const assigned = ra.find(a => a.user_id === m.user_id);
                          return (
                            <div key={m.id} className="flex items-center gap-2 py-1">
                              <button
                                onClick={() => assigned ? unassignRole(assigned.id) : handleAssign(m.user_id, role.id)}
                                className="flex items-center gap-2 text-xs hover:text-foreground transition-colors"
                              >
                                <div className={`h-3 w-3 rounded border flex items-center justify-center ${assigned ? "bg-foreground border-foreground" : ""}`}>
                                  {assigned && <Check className="h-2 w-2 text-background" strokeWidth={3} />}
                                </div>
                                <span className={assigned ? "text-foreground" : "text-muted-foreground"}>
                                  {m.profile?.display_name || m.profile?.email || "Unknown"}
                                </span>
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Assigned members */}
                  {ra.length > 0 && assigningRoleId !== role.id && (
                    <div className="border-t px-4 py-2 flex items-center gap-1">
                      <span className="text-[9px] text-muted-foreground">Assigned:</span>
                      {ra.map(a => {
                        const member = members.find(m => m.user_id === a.user_id);
                        return (
                          <span key={a.id} className="text-[9px] px-1.5 py-0.5 rounded bg-secondary text-muted-foreground">
                            {member?.profile?.display_name || member?.profile?.email || "Unknown"}
                          </span>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Create new role */}
        {isAdmin && (
          creating ? (
            <RoleEditor
              onSave={async (name, desc, perms) => {
                await createRole(name, desc, perms);
                setCreating(false);
                toast.success(`Role "${name}" created`);
              }}
              onCancel={() => setCreating(false)}
            />
          ) : (
            <button
              onClick={() => setCreating(true)}
              className="w-full border border-dashed rounded-lg p-4 text-xs text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors flex items-center justify-center gap-2"
            >
              <Plus className="h-3.5 w-3.5" strokeWidth={1.5} /> Create custom role
            </button>
          )
        )}

        {/* Info section */}
        <div className="mt-8 border rounded-lg p-4 bg-card">
          <p className="text-xs font-medium text-foreground mb-2">How RBAC works</p>
          <ul className="space-y-1 text-[10px] text-muted-foreground">
            <li>• <strong className="text-foreground">Owners & Admins</strong> always have full permissions</li>
            <li>• <strong className="text-foreground">Members</strong> get permissions through assigned roles</li>
            <li>• A member can have multiple roles — permissions are additive</li>
            <li>• Removing a role immediately revokes its permissions</li>
          </ul>
        </div>
      </main>
    </div>
  );
}
