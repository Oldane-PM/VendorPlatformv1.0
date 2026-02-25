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

-- =====================================================================
-- Bank Accounts seed data
-- =====================================================================
DO $$
DECLARE
  _ba1 uuid;
  _ba2 uuid;
  _ba3 uuid;
  _txn1 uuid;
  _txn2 uuid;
  _txn3 uuid;
  _txn4 uuid;
  _txn5 uuid;
  _txn6 uuid;
BEGIN
  -- Insert bank accounts
  INSERT INTO public.bank_accounts (
    id, bank_name, account_name, currency, last_four_digits,
    current_balance, pending_payments, last_funding, card_color,
    account_type, purpose, status
  ) VALUES
    (gen_random_uuid(), 'ScotiaBank', 'Operations Account', 'USD', '4582',
     125430.22, 22500.00, '2025-02-10', 'blue',
     'Checking', 'Operations', 'active'),
    (gen_random_uuid(), 'TD Bank', 'Payroll Account', 'USD', '7293',
     89200.50, 15000.00, '2025-02-15', 'purple',
     'Checking', 'Payroll', 'active'),
    (gen_random_uuid(), 'RBC Royal Bank', 'Reserve Funds', 'CAD', '1847',
     245000.00, 0, '2025-02-01', 'indigo',
     'Reserve', 'Reserve Funds', 'active')
  ON CONFLICT DO NOTHING;

  -- Grab the IDs we just inserted
  SELECT id INTO _ba1 FROM public.bank_accounts WHERE last_four_digits = '4582' LIMIT 1;
  SELECT id INTO _ba2 FROM public.bank_accounts WHERE last_four_digits = '7293' LIMIT 1;
  SELECT id INTO _ba3 FROM public.bank_accounts WHERE last_four_digits = '1847' LIMIT 1;

  IF _ba1 IS NULL THEN
    RAISE NOTICE 'Bank accounts already seeded — skipping.';
    RETURN;
  END IF;

  -- Insert transactions (all for the first account to match mock data)
  INSERT INTO public.bank_transactions (
    id, bank_account_id, transaction_date, type, vendor, amount, fee_amount,
    exchange_rate, balance_after, currency, receipt_uploaded, reconciled,
    funding_source, fee_type
  ) VALUES
    (gen_random_uuid(), _ba1, '2025-02-17', 'Payment', 'Acme Solutions Inc.',
     -45000.00, 125.00, 1.0, 125430.22, 'USD', true, true, NULL, NULL),
    (gen_random_uuid(), _ba1, '2025-02-16', 'Funding', NULL,
     100000.00, 45.00, NULL, 170555.22, 'USD', true, true,
     'Wire Transfer - Head Office', NULL),
    (gen_random_uuid(), _ba1, '2025-02-15', 'Payment', 'TechVendor Corp',
     -12500.00, 35.00, 1.0, 70600.22, 'USD', true, true, NULL, NULL),
    (gen_random_uuid(), _ba1, '2025-02-14', 'Payment', 'Cloud Infrastructure Co',
     -95000.00, 240.22, 155.40, 83135.22, 'JMD', false, false, NULL, 'Exchange Variance'),
    (gen_random_uuid(), _ba1, '2025-02-12', 'Fee', NULL,
     -45.00, 45.00, NULL, 178375.44, 'USD', false, true, NULL, 'Transfer Fee'),
    (gen_random_uuid(), _ba1, '2025-02-10', 'Funding', NULL,
     50000.00, 25.00, NULL, 178420.44, 'USD', true, true,
     'ACH Transfer', NULL)
  ON CONFLICT DO NOTHING;

  -- Grab transaction IDs for fee references
  SELECT id INTO _txn1 FROM public.bank_transactions
    WHERE bank_account_id = _ba1 AND transaction_date = '2025-02-17' AND type = 'Payment' LIMIT 1;
  SELECT id INTO _txn2 FROM public.bank_transactions
    WHERE bank_account_id = _ba1 AND transaction_date = '2025-02-16' AND type = 'Funding' LIMIT 1;
  SELECT id INTO _txn4 FROM public.bank_transactions
    WHERE bank_account_id = _ba1 AND transaction_date = '2025-02-14' AND type = 'Payment' LIMIT 1;

  -- Insert fees
  INSERT INTO public.bank_fees (
    bank_account_id, bank_transaction_id, transaction_date, transaction_type,
    fee_type, exchange_rate_variance, bank_transfer_fee,
    related_payment_id, amount, currency, notes
  ) VALUES
    (_ba1, _txn1, '2025-02-17', 'Payment',
     'Transfer Fee', NULL, 125.00,
     _txn1::text, 125.00, 'USD', 'Wire transfer fee'),
    (_ba1, _txn2, '2025-02-16', 'Funding',
     'Transfer Fee', NULL, 45.00,
     _txn2::text, 45.00, 'USD', 'Incoming wire fee'),
    (_ba1, _txn4, '2025-02-14', 'Payment',
     'Exchange Variance', 240.22, NULL,
     _txn4::text, 240.22, 'USD', 'JMD to USD conversion variance')
  ON CONFLICT DO NOTHING;

  RAISE NOTICE 'Seeded 3 bank accounts, 6 transactions, 3 fees';
END
$$;
