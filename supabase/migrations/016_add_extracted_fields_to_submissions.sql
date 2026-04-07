ALTER TABLE public.work_order_vendor_submissions
  ADD COLUMN IF NOT EXISTS taxes numeric,
  ADD COLUMN IF NOT EXISTS quote_number text,
  ADD COLUMN IF NOT EXISTS delivery_timeline text,
  ADD COLUMN IF NOT EXISTS warranty text,
  ADD COLUMN IF NOT EXISTS payment_terms text,
  ADD COLUMN IF NOT EXISTS compliance_status text,
  ADD COLUMN IF NOT EXISTS performance_rating numeric;
