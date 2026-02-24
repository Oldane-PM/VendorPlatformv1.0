-- Seed data for vendor platform (run after migrations)
-- 1. Ensures a default organisation exists
-- 2. Seeds vendors with full data matching the Vendor interface

-- Step 1: Create a default organization if none exists
INSERT INTO public.organizations (id, name)
VALUES ('00000000-0000-0000-0000-000000000001', 'Default Organization')
ON CONFLICT (id) DO NOTHING;

-- Step 2: Seed vendors with all columns populated
DO $$
DECLARE
  _org_id uuid;
BEGIN
  SELECT id INTO _org_id FROM public.organizations LIMIT 1;

  IF _org_id IS NULL THEN
    RAISE NOTICE 'No organization found — skipping vendor seed.';
    RETURN;
  END IF;

  INSERT INTO public.vendors (
    id, org_id, vendor_name, vendor_code, tax_id, status,
    email, phone, address, category, rating, risk_score,
    total_engagements, total_spent, contact_person,
    joined_date, last_engagement_date, notes
  )
  VALUES
    (
      gen_random_uuid(), _org_id,
      'Acme Corporation', 'ACM-001', 'TX-123456', 'active',
      'contact@acme.com', '+1 (555) 123-4567',
      '123 Business St, New York, NY 10001', 'Manufacturing',
      4.8, 15, 24, 1284500, 'John Smith',
      '2023-01-15', '2026-02-10',
      'Reliable supplier with consistent quality'
    ),
    (
      gen_random_uuid(), _org_id,
      'Global Tech Solutions', 'GTS-002', 'TX-234567', 'active',
      'info@globaltech.com', '+1 (555) 234-5678',
      '456 Tech Ave, San Francisco, CA 94105', 'Technology',
      4.6, 22, 18, 956300, 'Sarah Johnson',
      '2023-03-22', '2026-02-12',
      'Excellent for hardware and software solutions'
    ),
    (
      gen_random_uuid(), _org_id,
      'Prime Logistics Ltd', 'PLL-003', 'TX-345678', 'active',
      'support@primelogistics.com', '+1 (555) 345-6789',
      '789 Shipping Rd, Chicago, IL 60601', 'Logistics',
      4.9, 8, 32, 2412800, 'Michael Chen',
      '2022-11-08', '2026-02-14',
      'Fast and reliable shipping partner'
    )
  ON CONFLICT DO NOTHING;

  RAISE NOTICE 'Seeded 3 vendors for org %', _org_id;
END
$$;
