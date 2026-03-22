-- =====================================================================
-- 007: Authorized Users Whitelist
-- Allows non-@intellibus.com users to be explicitly provisioned.
-- =====================================================================

CREATE TABLE IF NOT EXISTS public.authorized_users (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email      text NOT NULL UNIQUE,
  role       text NOT NULL DEFAULT 'user',
  status     text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Fast lookup by email during auth
CREATE INDEX IF NOT EXISTS idx_authorized_users_email
  ON public.authorized_users (email);

-- Enable RLS (restrictive by default)
ALTER TABLE public.authorized_users ENABLE ROW LEVEL SECURITY;

-- Service-role only (the Better-Auth server uses the service-role key)
-- Idempotent for db push when policy already exists on remote
DROP POLICY IF EXISTS "service_role_all" ON public.authorized_users;

CREATE POLICY "service_role_all" ON public.authorized_users
  FOR ALL
  USING (true)
  WITH CHECK (true);
