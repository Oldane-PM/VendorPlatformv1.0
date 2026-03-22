-- Links Better Auth users (ba_user.id, text) to organizations for API scoping.
-- Auto-populated on first request via getRequestContext when missing.

CREATE TABLE IF NOT EXISTS public.org_members (
  org_id     uuid        NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id    text        NOT NULL,
  role       text        NOT NULL DEFAULT 'member',
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (org_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_org_members_user_id ON public.org_members (user_id);

ALTER TABLE public.org_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service_role_all" ON public.org_members;
CREATE POLICY "service_role_all" ON public.org_members
  FOR ALL USING (true) WITH CHECK (true);
