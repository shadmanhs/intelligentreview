
-- Custom roles table
CREATE TABLE public.custom_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  permissions jsonb NOT NULL DEFAULT '{}',
  is_default boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(org_id, name)
);

ALTER TABLE public.custom_roles ENABLE ROW LEVEL SECURITY;

-- RLS: org members can view roles, admins can manage
CREATE POLICY "Org members can view roles"
  ON public.custom_roles FOR SELECT
  USING (public.is_org_member(auth.uid(), org_id));

CREATE POLICY "Org admins can manage roles"
  ON public.custom_roles FOR ALL
  USING (public.is_org_admin(auth.uid(), org_id))
  WITH CHECK (public.is_org_admin(auth.uid(), org_id));

-- Member role assignments table
CREATE TABLE public.member_role_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  role_id uuid NOT NULL REFERENCES public.custom_roles(id) ON DELETE CASCADE,
  assigned_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(org_id, user_id, role_id)
);

ALTER TABLE public.member_role_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view assignments"
  ON public.member_role_assignments FOR SELECT
  USING (public.is_org_member(auth.uid(), org_id));

CREATE POLICY "Org admins can manage assignments"
  ON public.member_role_assignments FOR ALL
  USING (public.is_org_admin(auth.uid(), org_id))
  WITH CHECK (public.is_org_admin(auth.uid(), org_id));

-- Function to check if user has a specific permission
CREATE OR REPLACE FUNCTION public.has_permission(_user_id uuid, _org_id uuid, _permission text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.member_role_assignments mra
    JOIN public.custom_roles cr ON cr.id = mra.role_id
    WHERE mra.user_id = _user_id
      AND mra.org_id = _org_id
      AND cr.permissions ? _permission
      AND (cr.permissions ->> _permission)::boolean = true
  )
  OR public.is_org_admin(_user_id, _org_id)
$$;

-- Trigger to update updated_at
CREATE TRIGGER update_custom_roles_updated_at
  BEFORE UPDATE ON public.custom_roles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
