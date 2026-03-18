-- Add ai_summary column to work_order_vendor_submissions for AI-generated summaries
ALTER TABLE public.work_order_vendor_submissions
  ADD COLUMN IF NOT EXISTS ai_summary text;
