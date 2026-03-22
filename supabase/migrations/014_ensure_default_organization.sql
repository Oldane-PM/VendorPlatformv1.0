-- App expects at least one row in `organizations` so first-time users can be
-- auto-linked via org_members (see getRequestContext). Seed.sql does this too;
-- this migration makes empty databases safe after `db push` without manual seed.

INSERT INTO public.organizations (id, name)
SELECT '00000000-0000-0000-0000-000000000001', 'Default Organization'
WHERE NOT EXISTS (SELECT 1 FROM public.organizations LIMIT 1);
