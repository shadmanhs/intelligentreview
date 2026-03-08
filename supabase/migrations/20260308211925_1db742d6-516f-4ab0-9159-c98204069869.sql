
-- Review sessions: stores each completed review
CREATE TABLE public.review_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  repo TEXT NOT NULL,
  pr_number INTEGER NOT NULL,
  pr_title TEXT,
  summary TEXT,
  risk_level TEXT DEFAULT 'medium',
  concerns_total INTEGER DEFAULT 0,
  concerns_approved INTEGER DEFAULT 0,
  concerns_dismissed INTEGER DEFAULT 0,
  concerns_edited INTEGER DEFAULT 0,
  comments_posted INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.review_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert their own review sessions"
  ON public.review_sessions FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own review sessions"
  ON public.review_sessions FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- Review outcomes: stores each concern's outcome for learning
CREATE TABLE public.review_outcomes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  session_id UUID REFERENCES public.review_sessions(id) ON DELETE CASCADE,
  repo TEXT NOT NULL,
  concern_severity TEXT NOT NULL,
  concern_title TEXT NOT NULL,
  concern_file TEXT,
  action TEXT NOT NULL, -- 'approved', 'dismissed', 'edited'
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.review_outcomes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert their own review outcomes"
  ON public.review_outcomes FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own review outcomes"
  ON public.review_outcomes FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- Custom rules: per-repo rules injected into AI prompt
CREATE TABLE public.custom_rules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  repo TEXT NOT NULL,
  rule_text TEXT NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.custom_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own custom rules"
  ON public.custom_rules FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
