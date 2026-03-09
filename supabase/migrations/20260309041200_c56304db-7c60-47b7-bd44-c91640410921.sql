
CREATE TABLE public.authorized_repos (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  org_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
  repo_full_name text NOT NULL,
  enabled boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, repo_full_name)
);

ALTER TABLE public.authorized_repos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own authorized repos"
  ON public.authorized_repos FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Org members can view org repos"
  ON public.authorized_repos FOR SELECT
  TO authenticated
  USING (org_id IS NOT NULL AND public.is_org_member(auth.uid(), org_id));
