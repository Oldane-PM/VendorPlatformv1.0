-- =====================================================================
-- Engagement Sub-tables Migration
-- Adds missing columns to engagements + creates sub-entity tables
-- for RFQs, documents, approval steps, invoices, and activity log.
-- =====================================================================

-- ─── 1. Extend engagements table ─────────────────────────────────────

ALTER TABLE public.engagements
  ADD COLUMN IF NOT EXISTS vendor_id        uuid         REFERENCES public.vendors(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS vendor_name      text,
  ADD COLUMN IF NOT EXISTS department       text,
  ADD COLUMN IF NOT EXISTS total_value      numeric      NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS assigned_approver text;

-- ─── 2. Engagement RFQs ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.engagement_rfqs (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  engagement_id    uuid        NOT NULL REFERENCES public.engagements(id) ON DELETE CASCADE,
  vendor_id        text,
  vendor_name      text        NOT NULL,
  subtotal         numeric     NOT NULL DEFAULT 0,
  taxes            numeric     NOT NULL DEFAULT 0,
  total            numeric     NOT NULL DEFAULT 0,
  ai_risk_flag     text,
  decision         text        NOT NULL DEFAULT 'pending'
                               CHECK (decision IN ('pending','selected','rejected')),
  submitted_date   date,
  created_at       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_rfqs_engagement ON public.engagement_rfqs(engagement_id);

-- ─── 3. RFQ Line Items ──────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.engagement_rfq_line_items (
  id          uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  rfq_id      uuid    NOT NULL REFERENCES public.engagement_rfqs(id) ON DELETE CASCADE,
  description text    NOT NULL,
  quantity    integer NOT NULL DEFAULT 1,
  unit_price  numeric NOT NULL DEFAULT 0,
  total       numeric NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_rfq_items_rfq ON public.engagement_rfq_line_items(rfq_id);

-- ─── 4. Engagement Documents ────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.engagement_documents (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  engagement_id  uuid        NOT NULL REFERENCES public.engagements(id) ON DELETE CASCADE,
  name           text        NOT NULL,
  type           text,
  size           bigint      NOT NULL DEFAULT 0,
  uploaded_date  date,
  uploaded_by    text,
  ai_summary     text,
  missing_fields text[],
  risk_flags     text[],
  created_at     timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_docs_engagement ON public.engagement_documents(engagement_id);

-- ─── 5. Engagement Approval Steps ───────────────────────────────────

CREATE TABLE IF NOT EXISTS public.engagement_approval_steps (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  engagement_id   uuid        NOT NULL REFERENCES public.engagements(id) ON DELETE CASCADE,
  approver_name   text        NOT NULL,
  approver_role   text        NOT NULL,
  status          text        NOT NULL DEFAULT 'pending'
                              CHECK (status IN ('pending','approved','rejected','returned')),
  timestamp       timestamptz,
  comments        text,
  escalated       boolean     NOT NULL DEFAULT false,
  sort_order      integer     NOT NULL DEFAULT 0,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_approvals_engagement ON public.engagement_approval_steps(engagement_id);

-- ─── 6. Engagement Invoices ─────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.engagement_invoices (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  engagement_id   uuid        NOT NULL REFERENCES public.engagements(id) ON DELETE CASCADE,
  invoice_number  text        NOT NULL,
  vendor_name     text        NOT NULL,
  amount          numeric     NOT NULL DEFAULT 0,
  due_date        date,
  status          text        NOT NULL DEFAULT 'submitted'
                              CHECK (status IN ('submitted','approved','scheduled','paid','outstanding','overdue')),
  submitted_date  date,
  approved_date   date,
  paid_date       date,
  aging_days      integer     NOT NULL DEFAULT 0,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_invoices_engagement ON public.engagement_invoices(engagement_id);

-- ─── 7. Engagement Activity Log ─────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.engagement_activity_log (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  engagement_id  uuid        NOT NULL REFERENCES public.engagements(id) ON DELETE CASCADE,
  timestamp      timestamptz NOT NULL DEFAULT now(),
  user_name      text        NOT NULL,
  action         text        NOT NULL,
  details        text,
  status_change  text,
  created_at     timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_activity_engagement ON public.engagement_activity_log(engagement_id);

-- =====================================================================
-- Seed data removed as per user request
-- =====================================================================
