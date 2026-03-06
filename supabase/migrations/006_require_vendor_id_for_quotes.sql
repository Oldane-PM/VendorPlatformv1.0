-- Migration: Require vendor_id for Work Order Upload Requests
-- This ensures that only pre-registered vendors can be sent upload links for work orders.

-- 1. First, we need to clear out any existing orphaned requests (since this is a new feature in local dev, this is safe)
TRUNCATE TABLE public.work_order_vendor_upload_requests CASCADE;

-- 2. Add the vendor_id column
ALTER TABLE public.work_order_vendor_upload_requests 
ADD COLUMN IF NOT EXISTS vendor_id uuid REFERENCES public.vendors(id) ON DELETE CASCADE;

-- 3. Make the column NOT NULL to strictly enforce platform registration
ALTER TABLE public.work_order_vendor_upload_requests
ALTER COLUMN vendor_id SET NOT NULL;

-- 4. Create an index to quickly look up active requests for a particular vendor
CREATE INDEX IF NOT EXISTS idx_wovur_vendor ON public.work_order_vendor_upload_requests (org_id, vendor_id, expires_at DESC);
