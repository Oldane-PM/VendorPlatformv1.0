-- Better Auth `ba_user.id` is TEXT (nanoid-style), not UUID.
-- If org_members was created earlier with user_id uuid, comparisons fail with:
--   invalid input syntax for type uuid: "4OZRH7vjT0Zv0RRG30mY60DxSIXPBu8k"

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'org_members'
      AND column_name = 'user_id'
      AND udt_name = 'uuid'
  ) THEN
    ALTER TABLE public.org_members
      ALTER COLUMN user_id TYPE text USING user_id::text;
  END IF;
END $$;
