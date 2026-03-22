-- 011 uses CREATE TABLE IF NOT EXISTS; if org_members existed earlier without
-- `role` / `created_at`, those columns were never added. App inserts require them.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'org_members'
  ) THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'org_members'
        AND column_name = 'role'
    ) THEN
      ALTER TABLE public.org_members
        ADD COLUMN role text NOT NULL DEFAULT 'member';
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'org_members'
        AND column_name = 'created_at'
    ) THEN
      ALTER TABLE public.org_members
        ADD COLUMN created_at timestamptz NOT NULL DEFAULT now();
    END IF;
  END IF;
END $$;
