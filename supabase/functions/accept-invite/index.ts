import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";

    // Get user from auth header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Not authenticated");

    const anonClient = createClient(supabaseUrl, anonKey);
    const { data: { user }, error: authError } = await anonClient.auth.getUser(authHeader.replace("Bearer ", ""));
    if (authError || !user) throw new Error("Invalid token");

    const email = user.email;
    if (!email) throw new Error("No email on user account");

    const supabase = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });

    // Find pending invites for this email
    const { data: invites } = await supabase
      .from("org_invites")
      .select("*")
      .eq("email", email.toLowerCase())
      .eq("status", "pending");

    if (!invites || invites.length === 0) {
      return new Response(JSON.stringify({ accepted: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let accepted = 0;

    for (const invite of invites) {
      // Check if already a member
      const { data: existing } = await supabase
        .from("org_members")
        .select("id")
        .eq("org_id", invite.org_id)
        .eq("user_id", user.id)
        .maybeSingle();

      if (existing) {
        // Already a member, just mark invite as accepted
        await supabase.from("org_invites").update({ status: "accepted" }).eq("id", invite.id);
        continue;
      }

      // Add as member
      const { error: memberError } = await supabase
        .from("org_members")
        .insert({ org_id: invite.org_id, user_id: user.id, role: invite.role });

      if (!memberError) {
        await supabase.from("org_invites").update({ status: "accepted" }).eq("id", invite.id);
        accepted++;
      }
    }

    return new Response(JSON.stringify({ accepted, total: invites.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("accept-invite error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
