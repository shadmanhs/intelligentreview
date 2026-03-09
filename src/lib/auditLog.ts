import { supabase } from "@/integrations/supabase/client";

export type AuditAction =
  | "role.created"
  | "role.updated"
  | "role.deleted"
  | "role.assigned"
  | "role.unassigned"
  | "member.invited"
  | "member.removed"
  | "member.role_changed"
  | "rule.created"
  | "rule.deleted"
  | "rule.toggled"
  | "settings.updated"
  | "review.posted"
  | "contact.sent";

export async function logAudit(params: {
  orgId?: string | null;
  action: AuditAction;
  entityType: string;
  entityId?: string;
  details?: Record<string, any>;
}) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.from("audit_logs" as any).insert({
    org_id: params.orgId || null,
    user_id: user.id,
    action: params.action,
    entity_type: params.entityType,
    entity_id: params.entityId || null,
    details: params.details || {},
  } as any);
}
