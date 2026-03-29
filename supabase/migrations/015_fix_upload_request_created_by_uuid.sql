-- Drop legacy FK constraints referencing `profiles(user_id)` 
-- since `ba_user.id` is now used as TEXT by Better Auth.
ALTER TABLE public.engagement_invoice_upload_requests DROP CONSTRAINT IF EXISTS engagement_invoice_upload_requests_created_by_fkey;
ALTER TABLE public.work_order_vendor_upload_requests DROP CONSTRAINT IF EXISTS work_order_vendor_upload_requests_created_by_fkey;
ALTER TABLE public.work_order_vendor_submissions DROP CONSTRAINT IF EXISTS work_order_vendor_submissions_resolved_by_fkey;

-- Change the affected UUID columns to TEXT to support Better Auth Nanoid strings
ALTER TABLE public.audit_events ALTER COLUMN actor_id TYPE text USING actor_id::text;
ALTER TABLE public.engagement_invoice_upload_requests ALTER COLUMN created_by TYPE text USING created_by::text;
ALTER TABLE public.work_order_vendor_upload_requests ALTER COLUMN created_by TYPE text USING created_by::text;
ALTER TABLE public.work_order_vendor_submissions ALTER COLUMN resolved_by TYPE text USING resolved_by::text;

-- Update the new TEXT columns to reference the correct Better Auth table (since it handles user accounts now).
-- Since some records may have NULLs or be lingering, we only add the FK if ba_user exists as a safety net.
DO $$
BEGIN
  IF to_regclass('public.ba_user') IS NOT NULL THEN
    ALTER TABLE public.engagement_invoice_upload_requests
      ADD CONSTRAINT engagement_invoice_upload_requests_created_by_ba_fkey
      FOREIGN KEY (created_by) REFERENCES public.ba_user(id) ON DELETE SET NULL;
      
    ALTER TABLE public.work_order_vendor_upload_requests
      ADD CONSTRAINT work_order_vendor_upload_requests_created_by_ba_fkey
      FOREIGN KEY (created_by) REFERENCES public.ba_user(id) ON DELETE SET NULL;
      
    ALTER TABLE public.work_order_vendor_submissions
      ADD CONSTRAINT work_order_vendor_submissions_resolved_by_ba_fkey
      FOREIGN KEY (resolved_by) REFERENCES public.ba_user(id) ON DELETE SET NULL;
  END IF;
END $$;
