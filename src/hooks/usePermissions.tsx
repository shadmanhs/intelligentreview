import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useOrganization } from "@/hooks/useOrganization";
import { logAudit } from "@/lib/auditLog";

// All available permissions in the system
export const ALL_PERMISSIONS = {
  // Review actions
  "review.trigger": "Trigger AI reviews",
  "review.approve": "Approve/dismiss concerns",
  "review.post_comments": "Post review comments to GitHub",
  "review.view": "View review results",
  
  // Rules & settings
  "rules.create": "Create custom rules",
  "rules.edit": "Edit existing rules",
  "rules.delete": "Delete rules",
  "rules.manage_templates": "Manage rule templates",
  
  // Team management
  "team.invite": "Invite new members",
  "team.remove": "Remove members",
  "team.manage_roles": "Create and assign roles",
  "team.view_insights": "View team insights & analytics",
  
  // Settings
  "settings.manage_org": "Manage organization settings",
  "settings.manage_webhooks": "Configure webhooks",
  "settings.billing": "Manage billing & subscription",
} as const;

export type Permission = keyof typeof ALL_PERMISSIONS;

export const PERMISSION_CATEGORIES = {
  "Review Actions": ["review.trigger", "review.approve", "review.post_comments", "review.view"] as Permission[],
  "Rules & Settings": ["rules.create", "rules.edit", "rules.delete", "rules.manage_templates"] as Permission[],
  "Team Management": ["team.invite", "team.remove", "team.manage_roles", "team.view_insights"] as Permission[],
  "Organization Settings": ["settings.manage_org", "settings.manage_webhooks", "settings.billing"] as Permission[],
};

export interface CustomRole {
  id: string;
  org_id: string;
  name: string;
  description: string | null;
  permissions: Record<string, boolean>;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface RoleAssignment {
  id: string;
  org_id: string;
  user_id: string;
  role_id: string;
  assigned_by: string | null;
  created_at: string;
}

interface PermissionsContextType {
  roles: CustomRole[];
  myPermissions: Record<string, boolean>;
  assignments: RoleAssignment[];
  loading: boolean;
  hasPermission: (permission: Permission) => boolean;
  createRole: (name: string, description: string, permissions: Record<string, boolean>) => Promise<void>;
  updateRole: (roleId: string, updates: Partial<Pick<CustomRole, "name" | "description" | "permissions">>) => Promise<void>;
  deleteRole: (roleId: string) => Promise<void>;
  assignRole: (userId: string, roleId: string) => Promise<void>;
  unassignRole: (assignmentId: string) => Promise<void>;
  refresh: () => Promise<void>;
}

const PermissionsContext = createContext<PermissionsContextType>({
  roles: [],
  myPermissions: {},
  assignments: [],
  loading: true,
  hasPermission: () => false,
  createRole: async () => {},
  updateRole: async () => {},
  deleteRole: async () => {},
  assignRole: async () => {},
  unassignRole: async () => {},
  refresh: async () => {},
});

export const usePermissions = () => useContext(PermissionsContext);

export function PermissionsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { org, isAdmin } = useOrganization();
  const [roles, setRoles] = useState<CustomRole[]>([]);
  const [assignments, setAssignments] = useState<RoleAssignment[]>([]);
  const [myPermissions, setMyPermissions] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    if (!user || !org) {
      setRoles([]);
      setAssignments([]);
      setMyPermissions({});
      setLoading(false);
      return;
    }

    const [rolesRes, assignmentsRes] = await Promise.all([
      supabase.from("custom_roles" as any).select("*").eq("org_id", org.id),
      supabase.from("member_role_assignments" as any).select("*").eq("org_id", org.id),
    ]);

    const rolesData = (rolesRes.data || []) as unknown as CustomRole[];
    const assignmentsData = (assignmentsRes.data || []) as unknown as RoleAssignment[];

    setRoles(rolesData);
    setAssignments(assignmentsData);

    // Calculate my permissions from assigned roles
    if (isAdmin) {
      // Admins/owners have all permissions
      const allPerms: Record<string, boolean> = {};
      Object.keys(ALL_PERMISSIONS).forEach(p => { allPerms[p] = true; });
      setMyPermissions(allPerms);
    } else {
      const myAssignments = assignmentsData.filter(a => a.user_id === user.id);
      const myRoleIds = myAssignments.map(a => a.role_id);
      const myRoles = rolesData.filter(r => myRoleIds.includes(r.id));
      const perms: Record<string, boolean> = {};
      myRoles.forEach(role => {
        Object.entries(role.permissions).forEach(([key, val]) => {
          if (val) perms[key] = true;
        });
      });
      setMyPermissions(perms);
    }

    setLoading(false);
  }, [user, org, isAdmin]);

  useEffect(() => { loadData(); }, [loadData]);

  const hasPermission = useCallback((permission: Permission): boolean => {
    if (isAdmin) return true;
    return myPermissions[permission] === true;
  }, [isAdmin, myPermissions]);

  const createRole = useCallback(async (name: string, description: string, permissions: Record<string, boolean>) => {
    if (!org || !user) return;
    const { data, error } = await supabase.from("custom_roles" as any).insert({
      org_id: org.id,
      name,
      description,
      permissions,
    } as any).select().single();
    if (error) throw error;
    await logAudit({ orgId: org.id, action: "role.created", entityType: "role", entityId: (data as any)?.id, details: { name } });
    await loadData();
  }, [org, user, loadData]);

  const updateRole = useCallback(async (roleId: string, updates: Partial<Pick<CustomRole, "name" | "description" | "permissions">>) => {
    if (!org) return;
    const { error } = await supabase.from("custom_roles" as any).update(updates as any).eq("id", roleId);
    if (error) throw error;
    await logAudit({ orgId: org.id, action: "role.updated", entityType: "role", entityId: roleId, details: updates });
    await loadData();
  }, [org, loadData]);

  const deleteRole = useCallback(async (roleId: string) => {
    if (!org) return;
    const { error } = await supabase.from("custom_roles" as any).delete().eq("id", roleId);
    if (error) throw error;
    await loadData();
  }, [org, loadData]);

  const assignRole = useCallback(async (userId: string, roleId: string) => {
    if (!org || !user) return;
    const { error } = await supabase.from("member_role_assignments" as any).insert({
      org_id: org.id,
      user_id: userId,
      role_id: roleId,
      assigned_by: user.id,
    } as any);
    if (error) throw error;
    await loadData();
  }, [org, user, loadData]);

  const unassignRole = useCallback(async (assignmentId: string) => {
    const { error } = await supabase.from("member_role_assignments" as any).delete().eq("id", assignmentId);
    if (error) throw error;
    await loadData();
  }, [loadData]);

  return (
    <PermissionsContext.Provider value={{
      roles, myPermissions, assignments, loading, hasPermission,
      createRole, updateRole, deleteRole, assignRole, unassignRole, refresh: loadData,
    }}>
      {children}
    </PermissionsContext.Provider>
  );
}
