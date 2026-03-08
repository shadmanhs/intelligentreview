import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface Organization {
  id: string;
  name: string;
  slug: string;
  created_by: string;
  created_at: string;
}

interface OrgMember {
  id: string;
  org_id: string;
  user_id: string;
  role: "owner" | "admin" | "member";
  created_at: string;
  profile?: { display_name: string | null; email: string | null; avatar_url: string | null };
}

interface OrgInvite {
  id: string;
  org_id: string;
  email: string;
  role: "owner" | "admin" | "member";
  invited_by: string;
  status: string;
  created_at: string;
}

interface OrganizationContextType {
  org: Organization | null;
  members: OrgMember[];
  invites: OrgInvite[];
  myRole: "owner" | "admin" | "member" | null;
  loading: boolean;
  isAdmin: boolean;
  createOrg: (name: string) => Promise<void>;
  inviteMember: (email: string, role: "admin" | "member") => Promise<void>;
  removeMember: (memberId: string) => Promise<void>;
  cancelInvite: (inviteId: string) => Promise<void>;
  updateMemberRole: (memberId: string, role: "admin" | "member") => Promise<void>;
  refresh: () => Promise<void>;
}

const OrganizationContext = createContext<OrganizationContextType>({
  org: null,
  members: [],
  invites: [],
  myRole: null,
  loading: true,
  isAdmin: false,
  createOrg: async () => {},
  inviteMember: async () => {},
  removeMember: async () => {},
  cancelInvite: async () => {},
  updateMemberRole: async () => {},
  refresh: async () => {},
});

export const useOrganization = () => useContext(OrganizationContext);

export function OrganizationProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [org, setOrg] = useState<Organization | null>(null);
  const [members, setMembers] = useState<OrgMember[]>([]);
  const [invites, setInvites] = useState<OrgInvite[]>([]);
  const [myRole, setMyRole] = useState<"owner" | "admin" | "member" | null>(null);
  const [loading, setLoading] = useState(true);

  const loadOrg = useCallback(async () => {
    if (!user) {
      setOrg(null);
      setMembers([]);
      setInvites([]);
      setMyRole(null);
      setLoading(false);
      return;
    }

    // Find user's org membership
    const { data: membership } = await supabase
      .from("org_members")
      .select("org_id, role")
      .eq("user_id", user.id)
      .limit(1)
      .maybeSingle();

    if (!membership) {
      setOrg(null);
      setMembers([]);
      setInvites([]);
      setMyRole(null);
      setLoading(false);
      return;
    }

    setMyRole(membership.role as "owner" | "admin" | "member");

    // Fetch org
    const { data: orgData } = await supabase
      .from("organizations")
      .select("*")
      .eq("id", membership.org_id)
      .single();

    if (orgData) setOrg(orgData as Organization);

    // Fetch members
    const { data: membersData } = await supabase
      .from("org_members")
      .select("*")
      .eq("org_id", membership.org_id)
      .order("created_at");

    if (membersData) {
      // Fetch profiles for all members
      const userIds = membersData.map((m: any) => m.user_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, display_name, email, avatar_url")
        .in("user_id", userIds);

      const profileMap: Record<string, any> = {};
      profiles?.forEach((p: any) => { profileMap[p.user_id] = p; });

      setMembers(
        membersData.map((m: any) => ({
          ...m,
          profile: profileMap[m.user_id] || null,
        }))
      );
    }

    // Fetch invites
    const { data: invitesData } = await supabase
      .from("org_invites")
      .select("*")
      .eq("org_id", membership.org_id)
      .eq("status", "pending")
      .order("created_at", { ascending: false });

    setInvites((invitesData as OrgInvite[]) || []);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    loadOrg();
  }, [loadOrg]);

  // Listen for realtime changes
  useEffect(() => {
    if (!org) return;
    const channel = supabase
      .channel("org-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "org_members", filter: `org_id=eq.${org.id}` }, () => loadOrg())
      .on("postgres_changes", { event: "*", schema: "public", table: "org_invites", filter: `org_id=eq.${org.id}` }, () => loadOrg())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [org?.id, loadOrg]);

  const createOrg = useCallback(async (name: string) => {
    if (!user) return;
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    
    const { data: newOrg, error: orgError } = await supabase
      .from("organizations")
      .insert({ name, slug, created_by: user.id })
      .select()
      .single();

    if (orgError) throw orgError;

    // Add creator as owner
    const { error: memberError } = await supabase
      .from("org_members")
      .insert({ org_id: newOrg.id, user_id: user.id, role: "owner" });

    if (memberError) throw memberError;
    await loadOrg();
  }, [user, loadOrg]);

  const inviteMember = useCallback(async (email: string, role: "admin" | "member") => {
    if (!org || !user) return;
    const { error } = await supabase
      .from("org_invites")
      .insert({ org_id: org.id, email, role, invited_by: user.id });
    if (error) throw error;
    await loadOrg();
  }, [org, user, loadOrg]);

  const removeMember = useCallback(async (memberId: string) => {
    if (!org) return;
    await supabase.from("org_members").delete().eq("id", memberId);
    await loadOrg();
  }, [org, loadOrg]);

  const cancelInvite = useCallback(async (inviteId: string) => {
    if (!org) return;
    await supabase.from("org_invites").delete().eq("id", inviteId);
    await loadOrg();
  }, [org, loadOrg]);

  const updateMemberRole = useCallback(async (memberId: string, role: "admin" | "member") => {
    if (!org) return;
    await supabase.from("org_members").update({ role }).eq("id", memberId);
    await loadOrg();
  }, [org, loadOrg]);

  return (
    <OrganizationContext.Provider
      value={{
        org,
        members,
        invites,
        myRole,
        loading,
        isAdmin: myRole === "owner" || myRole === "admin",
        createOrg,
        inviteMember,
        removeMember,
        cancelInvite,
        updateMemberRole,
        refresh: loadOrg,
      }}
    >
      {children}
    </OrganizationContext.Provider>
  );
}
