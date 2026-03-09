
-- 1. Learning Loop: concern_patterns table tracks team-wide approval/dismiss rates
CREATE TABLE public.concern_patterns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  repo text NOT NULL,
  pattern_hash text NOT NULL,
  concern_title text NOT NULL,
  concern_severity text NOT NULL,
  times_approved integer NOT NULL DEFAULT 0,
  times_dismissed integer NOT NULL DEFAULT 0,
  times_edited integer NOT NULL DEFAULT 0,
  last_seen_at timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(org_id, pattern_hash),
  UNIQUE(user_id, pattern_hash)
);

ALTER TABLE public.concern_patterns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own patterns" ON public.concern_patterns
  FOR SELECT USING (auth.uid() = user_id OR (org_id IS NOT NULL AND public.is_org_member(auth.uid(), org_id)));

CREATE POLICY "Users can insert their own patterns" ON public.concern_patterns
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own patterns" ON public.concern_patterns
  FOR UPDATE USING (auth.uid() = user_id);

-- 2. Team Knowledge Capture: comment_edits tracks before/after when devs edit AI comments
CREATE TABLE public.comment_edits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  org_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
  repo text NOT NULL,
  session_id uuid REFERENCES public.review_sessions(id) ON DELETE SET NULL,
  concern_severity text NOT NULL,
  concern_title text NOT NULL,
  original_comment text NOT NULL,
  edited_comment text NOT NULL,
  concern_file text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.comment_edits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert their own edits" ON public.comment_edits
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view team edits" ON public.comment_edits
  FOR SELECT USING (auth.uid() = user_id OR (org_id IS NOT NULL AND public.is_org_member(auth.uid(), org_id)));

-- 3. Rules Engine: add rule_type and conditions columns to custom_rules
ALTER TABLE public.custom_rules 
  ADD COLUMN IF NOT EXISTS rule_type text NOT NULL DEFAULT 'prompt',
  ADD COLUMN IF NOT EXISTS conditions jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS severity text NOT NULL DEFAULT 'warning',
  ADD COLUMN IF NOT EXISTS org_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE;

-- Update RLS to allow org members to view org rules
CREATE POLICY "Org members can view org rules" ON public.custom_rules
  FOR SELECT USING (org_id IS NOT NULL AND public.is_org_member(auth.uid(), org_id));
