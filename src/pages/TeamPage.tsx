import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppHeader } from "@/components/AppHeader";
import { useAuth } from "@/hooks/useAuth";
import { useOrganization } from "@/hooks/useOrganization";
import { useSubscription } from "@/hooks/useSubscription";
import {
  ArrowLeft, Plus, Trash2, Loader2, Users, Mail, Shield, Crown,
  UserPlus, Building2, Lock, Sparkles, ArrowRight, Check, BarChart3,
  BookOpen, GitPullRequest
} from "lucide-react";
import { toast } from "sonner";

export default function TeamPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { org, members, invites, myRole, isAdmin, loading, createOrg, inviteMember, removeMember, cancelInvite, updateMemberRole } = useOrganization();
  const { subscribed } = useSubscription();
  const [creating, setCreating] = useState(false);
  const [orgName, setOrgName] = useState("");
  const [inviting, setInviting] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"admin" | "member">("member");
  const [submitting, setSubmitting] = useState(false);

  const handleCreateOrg = async () => {
    if (!orgName.trim()) return;
    setSubmitting(true);
    try {
      await createOrg(orgName.trim());
      toast.success("Team created! Now invite your engineers.");
      setCreating(false);
      setOrgName("");
    } catch (err: any) {
      toast.error(err.message || "Failed to create team");
    } finally {
      setSubmitting(false);
    }
  };

  const handleInvite = async () => {
    if (!inviteEmail.trim()) return;
    setSubmitting(true);
    try {
      await inviteMember(inviteEmail.trim().toLowerCase(), inviteRole);
      toast.success(`Invitation sent to ${inviteEmail}`);
      setInviteEmail("");
      setInviting(false);
    } catch (err: any) {
      if (err.message?.includes("duplicate")) {
        toast.error("This person has already been invited");
      } else {
        toast.error(err.message || "Failed to send invite");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemove = async (memberId: string, name: string) => {
    if (!confirm(`Remove ${name} from the team?`)) return;
    try {
      await removeMember(memberId);
      toast.success("Member removed");
    } catch {
      toast.error("Failed to remove member");
    }
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

  // Gate behind subscription
  if (!subscribed) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <AppHeader showUser />
        <main className="flex-1 max-w-2xl mx-auto w-full px-6 py-8">
          <div className="flex items-center gap-3 mb-8">
            <button onClick={() => navigate("/app")} className="text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="h-4 w-4" strokeWidth={1.5} />
            </button>
            <h1 className="text-lg font-medium tracking-tight text-foreground">Team</h1>
          </div>
          <div className="border-2 border-foreground/10 rounded-lg p-8 text-center">
            <Lock className="h-6 w-6 text-muted-foreground mx-auto mb-3" strokeWidth={1.5} />
            <p className="text-sm font-medium text-foreground mb-1">Team features require a Team plan</p>
            <p className="text-xs text-muted-foreground mb-4 max-w-sm mx-auto">
              Invite your engineering team, share review rules, and get team-wide analytics. $25/seat/month.
            </p>
            <button
              onClick={() => navigate("/pricing")}
              className="text-xs px-4 py-2 rounded-md bg-foreground text-background hover:bg-foreground/90 transition-colors inline-flex items-center gap-1.5"
            >
              <Sparkles className="h-3 w-3" strokeWidth={1.5} /> View plans
            </button>
          </div>
        </main>
      </div>
    );
  }

  // No org yet — guided onboarding
  if (!org) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <AppHeader showUser />
        <main className="flex-1 max-w-lg mx-auto w-full px-6 py-12">
          <div className="text-center mb-10">
            <Building2 className="h-8 w-8 text-foreground mx-auto mb-4" strokeWidth={1} />
            <h1 className="text-xl font-medium tracking-tight text-foreground mb-2">Set up your team workspace</h1>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
              Create a workspace to invite engineers, share review rules, and track team-wide analytics.
            </p>
          </div>

          {/* Onboarding steps preview */}
          <div className="space-y-3 mb-8">
            {[
              { step: 1, label: "Create your team", desc: "Name your workspace", active: true, icon: Building2 },
              { step: 2, label: "Invite engineers", desc: "Send email invitations", active: false, icon: UserPlus },
              { step: 3, label: "Set team rules", desc: "Define shared standards", active: false, icon: BookOpen },
              { step: 4, label: "Start reviewing", desc: "See team analytics", active: false, icon: BarChart3 },
            ].map((s) => (
              <div key={s.step} className={`flex items-center gap-3 px-4 py-3 rounded-lg border ${s.active ? "border-foreground/30 bg-card" : "opacity-40"}`}>
                <span className={`text-[10px] h-6 w-6 rounded-full flex items-center justify-center font-mono ${s.active ? "bg-foreground text-background" : "bg-secondary text-muted-foreground"}`}>
                  {s.step}
                </span>
                <div className="flex-1">
                  <p className="text-xs font-medium text-foreground">{s.label}</p>
                  <p className="text-[10px] text-muted-foreground">{s.desc}</p>
                </div>
                <s.icon className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={1.5} />
              </div>
            ))}
          </div>

          {creating ? (
            <div className="border rounded-lg p-6">
              <h2 className="text-sm font-medium text-foreground mb-1">Name your team</h2>
              <p className="text-xs text-muted-foreground mb-4">Usually your company or engineering org name.</p>
              <input
                type="text"
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                placeholder="e.g. Acme Engineering"
                className="w-full px-3 py-2.5 text-sm border rounded-md bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-foreground/20 transition-all mb-3"
                autoFocus
                onKeyDown={(e) => e.key === "Enter" && handleCreateOrg()}
              />
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCreateOrg}
                  disabled={!orgName.trim() || submitting}
                  className="text-xs px-4 py-2 rounded-md bg-foreground text-background hover:bg-foreground/90 disabled:opacity-50 transition-colors flex items-center gap-1.5"
                >
                  {submitting ? "Creating…" : "Create team"} <ArrowRight className="h-3 w-3" strokeWidth={1.5} />
                </button>
                <button onClick={() => setCreating(false)} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setCreating(true)}
              className="w-full py-3 rounded-md bg-foreground text-background text-sm font-medium hover:bg-foreground/90 transition-colors flex items-center justify-center gap-2"
            >
              Create team workspace <ArrowRight className="h-4 w-4" strokeWidth={1.5} />
            </button>
          )}
        </main>
      </div>
    );
  }

  // Determine onboarding completeness
  const hasMembers = members.length > 1 || invites.length > 0;
  const onboardingComplete = hasMembers;

  const roleIcon = (role: string) => {
    if (role === "owner") return <Crown className="h-3 w-3 text-warning" strokeWidth={1.5} />;
    if (role === "admin") return <Shield className="h-3 w-3 text-muted-foreground" strokeWidth={1.5} />;
    return null;
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <AppHeader showUser />
      <main className="flex-1 max-w-2xl mx-auto w-full px-6 py-8">
        <div className="flex items-center gap-3 mb-2">
          <button onClick={() => navigate("/app")} className="text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" strokeWidth={1.5} />
          </button>
          <div className="flex-1">
            <h1 className="text-lg font-medium tracking-tight text-foreground">{org.name}</h1>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded-full border text-muted-foreground uppercase tracking-wider">
            {myRole}
          </span>
        </div>
        <p className="text-xs text-muted-foreground mb-6 ml-7">
          {members.length} member{members.length !== 1 ? "s" : ""} · ${members.length * 25}/month
        </p>

        {/* Onboarding checklist — show until team has members */}
        {!onboardingComplete && isAdmin && (
          <div className="border-2 border-foreground/10 rounded-lg p-5 mb-6">
            <p className="text-xs font-medium text-foreground mb-3">Getting started</p>
            <div className="space-y-2">
              {[
                { label: "Create team workspace", done: true },
                { label: "Invite at least one team member", done: hasMembers },
                { label: "Set up shared review rules", done: false, action: () => navigate("/app/rules") },
                { label: "View team analytics", done: false, action: () => navigate("/app/team/insights") },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-2">
                  {item.done ? (
                    <Check className="h-3.5 w-3.5 text-success" strokeWidth={2} />
                  ) : (
                    <div className="h-3.5 w-3.5 rounded-full border" />
                  )}
                  <span className={`text-xs ${item.done ? "text-muted-foreground line-through" : "text-foreground"}`}>
                    {item.label}
                  </span>
                  {!item.done && item.action && (
                    <button onClick={item.action} className="text-[10px] text-foreground underline ml-auto">
                      Go →
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Stats bar */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="border rounded-lg p-4 text-center">
            <p className="text-xl font-medium text-foreground">{members.length}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Members</p>
          </div>
          <div className="border rounded-lg p-4 text-center">
            <p className="text-xl font-medium text-foreground">{invites.length}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Pending</p>
          </div>
          <button onClick={() => navigate("/app/team/insights")} className="border rounded-lg p-4 text-center hover:bg-secondary/30 transition-colors">
            <BarChart3 className="h-5 w-5 text-muted-foreground mx-auto mb-1" strokeWidth={1.5} />
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Analytics</p>
          </button>
        </div>

        {/* Invite */}
        {isAdmin && (
          <>
            {inviting ? (
              <div className="border rounded-lg p-4 mb-6 space-y-3">
                <div className="flex gap-3">
                  <div className="flex-1">
                    <label className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1 block">Email</label>
                    <input
                      type="email"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      placeholder="engineer@company.com"
                      className="w-full px-3 py-2 text-sm border rounded-md bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-foreground/20 transition-all"
                      autoFocus
                      onKeyDown={(e) => e.key === "Enter" && handleInvite()}
                    />
                  </div>
                  <div className="w-32">
                    <label className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1 block">Role</label>
                    <select
                      value={inviteRole}
                      onChange={(e) => setInviteRole(e.target.value as "admin" | "member")}
                      className="w-full px-3 py-2 text-sm border rounded-md bg-transparent text-foreground focus:outline-none focus:ring-1 focus:ring-foreground/20 transition-all"
                    >
                      <option value="member">Member</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleInvite}
                    disabled={!inviteEmail.trim() || submitting}
                    className="text-[11px] px-3 py-1.5 rounded bg-foreground text-background hover:bg-foreground/90 disabled:opacity-50 transition-colors"
                  >
                    {submitting ? "Sending…" : "Send invite"}
                  </button>
                  <button onClick={() => { setInviting(false); setInviteEmail(""); }} className="text-[11px] text-muted-foreground hover:text-foreground transition-colors">
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setInviting(true)}
                className="w-full border border-dashed rounded-lg p-4 mb-6 text-xs text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors flex items-center justify-center gap-2"
              >
                <UserPlus className="h-3.5 w-3.5" strokeWidth={1.5} /> Invite a team member
              </button>
            )}
          </>
        )}

        {/* Pending invites */}
        {invites.length > 0 && (
          <div className="mb-6">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2">Pending invitations</p>
            <div className="border rounded-lg divide-y">
              {invites.map((inv) => (
                <div key={inv.id} className="px-4 py-3 flex items-center gap-3">
                  <Mail className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={1.5} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-foreground truncate">{inv.email}</p>
                    <p className="text-[10px] text-muted-foreground">{inv.role} · Invited {new Date(inv.created_at).toLocaleDateString()}</p>
                  </div>
                  {isAdmin && (
                    <button onClick={() => cancelInvite(inv.id)} className="text-muted-foreground hover:text-destructive transition-colors">
                      <Trash2 className="h-3.5 w-3.5" strokeWidth={1.5} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Members */}
        <div>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2">Members</p>
          <div className="border rounded-lg divide-y">
            {members.map((m) => {
              const name = m.profile?.display_name || m.profile?.email || "Unknown";
              const isMe = m.user_id === user?.id;
              const isOwner = m.role === "owner";
              return (
                <div key={m.id} className="px-4 py-3 flex items-center gap-3">
                  {m.profile?.avatar_url ? (
                    <img src={m.profile.avatar_url} alt="" className="h-7 w-7 rounded-full" />
                  ) : (
                    <div className="h-7 w-7 rounded-full bg-secondary flex items-center justify-center">
                      <span className="text-[10px] text-muted-foreground font-medium">
                        {name[0].toUpperCase()}
                      </span>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="text-xs text-foreground truncate">{name}</p>
                      {isMe && <span className="text-[9px] text-muted-foreground">(you)</span>}
                    </div>
                    <p className="text-[10px] text-muted-foreground truncate">{m.profile?.email}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {roleIcon(m.role)}
                    {isAdmin && !isOwner && !isMe ? (
                      <select
                        value={m.role}
                        onChange={(e) => updateMemberRole(m.id, e.target.value as "admin" | "member")}
                        className="text-[10px] bg-transparent border rounded px-1.5 py-0.5 text-muted-foreground"
                      >
                        <option value="member">Member</option>
                        <option value="admin">Admin</option>
                      </select>
                    ) : (
                      <span className="text-[10px] text-muted-foreground capitalize">{m.role}</span>
                    )}
                    {isAdmin && !isOwner && !isMe && (
                      <button onClick={() => handleRemove(m.id, name)} className="text-muted-foreground hover:text-destructive transition-colors">
                        <Trash2 className="h-3.5 w-3.5" strokeWidth={1.5} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Quick links */}
        <div className="mt-8 grid grid-cols-2 gap-3">
          <button
            onClick={() => navigate("/app/rules")}
            className="border rounded-lg p-4 text-left hover:bg-secondary/30 transition-colors"
          >
            <BookOpen className="h-4 w-4 text-muted-foreground mb-2" strokeWidth={1.5} />
            <p className="text-xs font-medium text-foreground">Team Rules</p>
            <p className="text-[10px] text-muted-foreground">Shared review standards</p>
          </button>
          <button
            onClick={() => navigate("/app/team/insights")}
            className="border rounded-lg p-4 text-left hover:bg-secondary/30 transition-colors"
          >
            <BarChart3 className="h-4 w-4 text-muted-foreground mb-2" strokeWidth={1.5} />
            <p className="text-xs font-medium text-foreground">Team Analytics</p>
            <p className="text-[10px] text-muted-foreground">ROI & activity</p>
          </button>
        </div>
      </main>
    </div>
  );
}
