-- =====================================================================
-- 008: Better-Auth tables (user, session, account, verification)
-- Stores auth data so sessions persist across page navigations.
-- =====================================================================

-- 1. User ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.ba_user (
  id              TEXT PRIMARY KEY,
  name            TEXT NOT NULL,
  email           TEXT NOT NULL UNIQUE,
  email_verified  BOOLEAN NOT NULL DEFAULT FALSE,
  image           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.ba_user ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_all" ON public.ba_user
  FOR ALL USING (true) WITH CHECK (true);

-- 2. Session ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.ba_session (
  id              TEXT PRIMARY KEY,
  user_id         TEXT NOT NULL REFERENCES public.ba_user(id) ON DELETE CASCADE,
  token           TEXT NOT NULL UNIQUE,
  expires_at      TIMESTAMPTZ NOT NULL,
  ip_address      TEXT,
  user_agent      TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ba_session_token  ON public.ba_session (token);
CREATE INDEX IF NOT EXISTS idx_ba_session_user   ON public.ba_session (user_id);

ALTER TABLE public.ba_session ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_all" ON public.ba_session
  FOR ALL USING (true) WITH CHECK (true);

-- 3. Account (OAuth providers) ------------------------------------------
CREATE TABLE IF NOT EXISTS public.ba_account (
  id                        TEXT PRIMARY KEY,
  user_id                   TEXT NOT NULL REFERENCES public.ba_user(id) ON DELETE CASCADE,
  account_id                TEXT NOT NULL,
  provider_id               TEXT NOT NULL,
  access_token              TEXT,
  refresh_token             TEXT,
  access_token_expires_at   TIMESTAMPTZ,
  refresh_token_expires_at  TIMESTAMPTZ,
  scope                     TEXT,
  id_token                  TEXT,
  password                  TEXT,
  created_at                TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ba_account_user ON public.ba_account (user_id);

ALTER TABLE public.ba_account ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_all" ON public.ba_account
  FOR ALL USING (true) WITH CHECK (true);

-- 4. Verification -------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.ba_verification (
  id              TEXT PRIMARY KEY,
  identifier      TEXT NOT NULL,
  value           TEXT NOT NULL,
  expires_at      TIMESTAMPTZ NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.ba_verification ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_all" ON public.ba_verification
  FOR ALL USING (true) WITH CHECK (true);
