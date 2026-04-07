-- Convert created_by and updated_by to TEXT to support Better Auth Nanoid strings
ALTER TABLE public.vendor_evaluations ALTER COLUMN created_by TYPE text USING created_by::text;
ALTER TABLE public.vendor_evaluations ALTER COLUMN updated_by TYPE text USING updated_by::text;

DO $$
BEGIN
  IF to_regclass('public.ba_user') IS NOT NULL THEN
    -- Nullify orphaned UUIDs (like 00000000-0000-0000-0000-000000000000) before adding constraint
    UPDATE public.vendor_evaluations
    SET created_by = NULL
    WHERE created_by IS NOT NULL
      AND created_by NOT IN (SELECT id FROM public.ba_user);

    UPDATE public.vendor_evaluations
    SET updated_by = NULL
    WHERE updated_by IS NOT NULL
      AND updated_by NOT IN (SELECT id FROM public.ba_user);

    ALTER TABLE public.vendor_evaluations
      ADD CONSTRAINT vendor_evaluations_created_by_ba_fkey
      FOREIGN KEY (created_by) REFERENCES public.ba_user(id) ON DELETE SET NULL;
      
    ALTER TABLE public.vendor_evaluations
      ADD CONSTRAINT vendor_evaluations_updated_by_ba_fkey
      FOREIGN KEY (updated_by) REFERENCES public.ba_user(id) ON DELETE SET NULL;
  END IF;
END $$;
