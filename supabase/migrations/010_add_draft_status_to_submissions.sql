-- Add 'draft' status to work_order_vendor_submissions check constraint
-- This allows submissions to be created as drafts before vendor confirmation.

ALTER TABLE public.work_order_vendor_submissions
  DROP CONSTRAINT IF EXISTS work_order_vendor_submissions_status_check;

ALTER TABLE public.work_order_vendor_submissions
  ADD CONSTRAINT work_order_vendor_submissions_status_check
    CHECK (status IN ('draft', 'submitted', 'reviewed', 'awarded', 'rejected'));
