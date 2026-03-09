import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AppHeader } from "@/components/AppHeader";
import { useOrganization } from "@/hooks/useOrganization";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Loader2, Shield, Clock } from "lucide-react";

interface AuditEntry {
  id: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  details: Record<string, any>;
  created_at: string;
  user_id: string;
}

const ACTION_LABELS: Record<string, string> = {
  "role.created": "Created role",
  "role.updated": "Updated role",
  "role.deleted": "Deleted role",
  "role.assigned": "Assigned role",
  "role.unassigned": "Unassigned role",
  "member.invited": "Invited member",
  "member.removed": "Removed member",
  "member.role_changed": "Changed member role",
  "rule.created": "Created rule",
  "rule.deleted": "Deleted rule",
  "rule.toggled": "Toggled rule",
  "settings.updated": "Updated settings",
  "review.posted": "Posted review",
  "contact.sent": "Contact form submitted",
};

export default function AuditLogPage() {
  const navigate = useNavigate();
  const { org, isAdmin } = useOrganization();
  const [logs, setLogs] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (org && isAdmin) loadLogs();
    else setLoading(false);
  }, [org, isAdmin]);

  const loadLogs = async () => {
    const { data } = await supabase
      .from("audit_logs" as any)
      .select("*")
      .eq("org_id", org!.id)
      .order("created_at", { ascending: false })
      .limit(100);
    setLogs((data as unknown as AuditEntry[]) || []);
    setLoading(false);
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <AppHeader showUser />
        <main className="flex-1 flex items-center justify-center">
          <p className="text-sm text-muted-foreground">Admin access required.</p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <AppHeader showUser />
      <main className="flex-1 max-w-2xl mx-auto w-full px-6 py-8">
        <div className="flex items-center gap-3 mb-2">
          <button onClick={() => navigate("/app/team")} className="text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" strokeWidth={1.5} />
          </button>
          <Shield className="h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
          <h1 className="text-lg font-medium tracking-tight text-foreground">Audit Log</h1>
        </div>
        <p className="text-xs text-muted-foreground mb-8 ml-7">
          Track all role, permission, and team changes in your organization.
        </p>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-4 w-4 text-muted-foreground animate-spin" />
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-16 border rounded-lg">
            <Clock className="h-6 w-6 text-muted-foreground mx-auto mb-3" strokeWidth={1.5} />
            <p className="text-sm text-foreground mb-1">No activity yet</p>
            <p className="text-xs text-muted-foreground">Actions like role changes and member updates will appear here.</p>
          </div>
        ) : (
          <div className="border rounded-lg divide-y">
            {logs.map((log) => (
              <div key={log.id} className="px-4 py-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-foreground">
                    {ACTION_LABELS[log.action] || log.action}
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    {new Date(log.created_at).toLocaleString()}
                  </span>
                </div>
                {log.details && Object.keys(log.details).length > 0 && (
                  <p className="text-[10px] text-muted-foreground">
                    {log.details.name && `"${log.details.name}"`}
                    {log.details.email && ` — ${log.details.email}`}
                    {log.details.role_name && ` → ${log.details.role_name}`}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
