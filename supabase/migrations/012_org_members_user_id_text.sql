-- Better Auth `ba_user.id` is TEXT (nanoid-style), not UUID.
-- If org_members was created earlier with user_id uuid, comparisons fail with:
--   invalid input syntax for type uuid: "4OZRH7vjT0Zv0RRG30mY60DxSIXPBu8k"
--
-- Tables like `member_roles` may reference org_members (org_id, user_id). Postgres
-- cannot ALTER org_members.user_id while those FKs exist, and child user_id must
-- become text too. We snapshot FK defs, drop, convert, then restore.

DO $$
DECLARE
  r RECORD;
  parent_oid oid := 'public.org_members'::regclass;
BEGIN
  -- ---- A) Child columns that reference org_members.user_id (before any DROP) --
  CREATE TEMP TABLE _om_child_cols (
    schemaname text,
    relname text,
    attname text
  ) ON COMMIT DROP;

  INSERT INTO _om_child_cols
  SELECT DISTINCT n.nspname, cl.relname, a.attname
  FROM pg_constraint c
  JOIN pg_class cl ON cl.oid = c.conrelid
  JOIN pg_namespace n ON n.oid = cl.relnamespace
  JOIN LATERAL unnest(c.conkey, c.confkey) AS pairs(child_attnum, parent_attnum) ON true
  JOIN pg_attribute pa
    ON pa.attrelid = c.confrelid
   AND pa.attnum = pairs.parent_attnum
   AND pa.attname = 'user_id'
  JOIN pg_attribute a
    ON a.attrelid = c.conrelid
   AND a.attnum = pairs.child_attnum
  WHERE c.confrelid = parent_oid
    AND c.contype = 'f';

  -- ---- B) Every FK on those child tables that touches `user_id` ---------------
  CREATE TEMP TABLE _om_child_fks (
    schemaname text,
    relname text,
    conname text,
    condef text
  ) ON COMMIT DROP;

  INSERT INTO _om_child_fks (schemaname, relname, conname, condef)
  SELECT DISTINCT n.nspname, cl.relname, c.conname, pg_get_constraintdef(c.oid)
  FROM pg_constraint c
  JOIN pg_class cl ON cl.oid = c.conrelid
  JOIN pg_namespace n ON n.oid = cl.relnamespace
  WHERE c.contype = 'f'
    AND EXISTS (
      SELECT 1
      FROM unnest(c.conkey) AS u(attnum)
      JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = u.attnum
      WHERE a.attname = 'user_id'
    )
    AND EXISTS (
      SELECT 1
      FROM _om_child_cols cc
      WHERE cc.schemaname = n.nspname
        AND cc.relname = cl.relname
    );

  FOR r IN (SELECT * FROM _om_child_fks) LOOP
    EXECUTE format(
      'ALTER TABLE %I.%I DROP CONSTRAINT %I',
      r.schemaname,
      r.relname,
      r.conname
    );
  END LOOP;

  -- ---- C) FKs FROM org_members.user_id (e.g. to ba_user) ----------------------
  ALTER TABLE public.org_members DROP CONSTRAINT IF EXISTS org_members_user_id_fkey;

  FOR r IN (
    SELECT DISTINCT c.conname
    FROM pg_constraint c
    CROSS JOIN LATERAL unnest(c.conkey) AS u(attnum)
    JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = u.attnum
    WHERE c.conrelid = parent_oid
      AND c.contype = 'f'
      AND a.attname = 'user_id'
  ) LOOP
    EXECUTE format('ALTER TABLE public.org_members DROP CONSTRAINT %I', r.conname);
  END LOOP;

  -- ---- D) Child columns uuid -> text -----------------------------------------
  FOR r IN (SELECT * FROM _om_child_cols) LOOP
    IF EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = r.schemaname
        AND table_name = r.relname
        AND column_name = r.attname
        AND udt_name = 'uuid'
    ) THEN
      EXECUTE format(
        'ALTER TABLE %I.%I ALTER COLUMN %I TYPE text USING %I::text',
        r.schemaname,
        r.relname,
        r.attname,
        r.attname
      );
    END IF;
  END LOOP;

  -- ---- E) org_members.user_id uuid -> text ----------------------------------
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

  -- ---- F) Restore child FKs, then org_members -> ba_user ---------------------
  FOR r IN (SELECT * FROM _om_child_fks) LOOP
    EXECUTE format(
      'ALTER TABLE %I.%I ADD CONSTRAINT %I %s',
      r.schemaname,
      r.relname,
      r.conname,
      r.condef
    );
  END LOOP;

  IF to_regclass('public.ba_user') IS NOT NULL
     AND NOT EXISTS (
       SELECT 1
       FROM pg_constraint c
       JOIN pg_class f ON f.oid = c.confrelid
       WHERE c.conrelid = parent_oid
         AND c.contype = 'f'
         AND f.relname = 'ba_user'
     )
  THEN
    ALTER TABLE public.org_members
      ADD CONSTRAINT org_members_user_id_fkey
      FOREIGN KEY (user_id) REFERENCES public.ba_user(id) ON DELETE CASCADE;
  END IF;
END $$;
