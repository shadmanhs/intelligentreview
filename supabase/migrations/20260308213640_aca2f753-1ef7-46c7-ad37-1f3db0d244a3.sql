
-- Organizations
CREATE TABLE public.organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Org members
CREATE TYPE public.org_role AS ENUM ('owner', 'admin', 'member');

CREATE TABLE public.org_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  role org_role NOT NULL DEFAULT 'member',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(org_id, user_id)
);

-- Org invitations
CREATE TABLE public.org_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  email text NOT NULL,
  role org_role NOT NULL DEFAULT 'member',
  invited_by uuid NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(org_id, email)
);

-- Enable RLS
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.org_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.org_invites ENABLE ROW LEVEL SECURITY;

-- Security definer function to check org membership
CREATE OR REPLACE FUNCTION public.is_org_member(_user_id uuid, _org_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.org_members WHERE user_id = _user_id AND org_id = _org_id)
$$;

CREATE OR REPLACE FUNCTION public.is_org_admin(_user_id uuid, _org_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.org_members WHERE user_id = _user_id AND org_id = _org_id AND role IN ('owner', 'admin'))
$$;

-- Organizations RLS
CREATE POLICY "Members can view their org" ON public.organizations
  FOR SELECT TO authenticated
  USING (public.is_org_member(auth.uid(), id));

CREATE POLICY "Authenticated users can create orgs" ON public.organizations
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Admins can update org" ON public.organizations
  FOR UPDATE TO authenticated
  USING (public.is_org_admin(auth.uid(), id));

-- Org members RLS
CREATE POLICY "Members can view org members" ON public.org_members
  FOR SELECT TO authenticated
  USING (public.is_org_member(auth.uid(), org_id));

CREATE POLICY "Admins can insert org members" ON public.org_members
  FOR INSERT TO authenticated
  WITH CHECK (public.is_org_admin(auth.uid(), org_id));

CREATE POLICY "Admins can delete org members" ON public.org_members
  FOR DELETE TO authenticated
  USING (public.is_org_admin(auth.uid(), org_id));

CREATE POLICY "Admins can update org members" ON public.org_members
  FOR UPDATE TO authenticated
  USING (public.is_org_admin(auth.uid(), org_id));

-- Org invites RLS
CREATE POLICY "Members can view org invites" ON public.org_invites
  FOR SELECT TO authenticated
  USING (public.is_org_member(auth.uid(), org_id));

CREATE POLICY "Admins can insert org invites" ON public.org_invites
  FOR INSERT TO authenticated
  WITH CHECK (public.is_org_admin(auth.uid(), org_id));

CREATE POLICY "Admins can update org invites" ON public.org_invites
  FOR UPDATE TO authenticated
  USING (public.is_org_admin(auth.uid(), org_id));

CREATE POLICY "Admins can delete org invites" ON public.org_invites
  FOR DELETE TO authenticated
  USING (public.is_org_admin(auth.uid(), org_id));

-- Allow owner to insert themselves as first member (bootstrap)
CREATE POLICY "Org creator can add themselves" ON public.org_members
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND role = 'owner');

-- Update trigger for organizations
CREATE TRIGGER update_organizations_updated_at
  BEFORE UPDATE ON public.organizations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for org_members to detect team changes
ALTER PUBLICATION supabase_realtime ADD TABLE public.org_members;
ALTER PUBLICATION supabase_realtime ADD TABLE public.org_invites;
