-- =====================================================================
-- Vendor Engagement Milestones Migration
-- Creates a table for tracking milestones against awarded RFQs
-- (which represent Vendor Engagements)
-- =====================================================================

CREATE TABLE IF NOT EXISTS public.vendor_engagement_milestones (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  rfq_id      uuid        NOT NULL REFERENCES public.engagement_rfqs(id) ON DELETE CASCADE,
  activity    text        NOT NULL,
  due_date    date        NOT NULL,
  amount      numeric     NOT NULL DEFAULT 0,
  status      text        NOT NULL DEFAULT 'Pending'
                          CHECK (status IN ('Pending','In Progress','Submitted','Approved','Paid')),
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_milestones_rfq ON public.vendor_engagement_milestones(rfq_id);

-- =====================================================================
-- Seed data removed as per user request
-- =====================================================================
