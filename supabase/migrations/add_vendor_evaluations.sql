-- Migration: Add vendor_evaluations table
-- Stores per-vendor performance evaluations with 5 criteria (1-5 stars each)

CREATE TABLE IF NOT EXISTS public.vendor_evaluations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  vendor_id uuid NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,

  -- 5 criteria (star ratings 1–5)
  delivery_timeliness int NOT NULL DEFAULT 3 CHECK (delivery_timeliness BETWEEN 1 AND 5),
  quality_of_work int NOT NULL DEFAULT 3 CHECK (quality_of_work BETWEEN 1 AND 5),
  budget_adherence int NOT NULL DEFAULT 3 CHECK (budget_adherence BETWEEN 1 AND 5),
  communication_responsiveness int NOT NULL DEFAULT 3 CHECK (communication_responsiveness BETWEEN 1 AND 5),
  compliance_documentation int NOT NULL DEFAULT 3 CHECK (compliance_documentation BETWEEN 1 AND 5),

  -- Computed scores (server-side)
  average_stars numeric NOT NULL DEFAULT 0,
  final_score numeric NOT NULL DEFAULT 0,       -- 1..10
  grade text NOT NULL DEFAULT 'Good',           -- Bad / Good / Excellent
  grading_mode text NOT NULL DEFAULT 'unweighted', -- 'unweighted' | 'weighted'

  -- Optional note
  notes text,

  -- Audit
  created_by uuid,
  updated_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  -- One evaluation per vendor per org
  UNIQUE (org_id, vendor_id)
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_vendor_evaluations_org_vendor
  ON public.vendor_evaluations (org_id, vendor_id);

-- Auto-update updated_at on row change
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_vendor_evaluations_updated_at ON public.vendor_evaluations;
CREATE TRIGGER trg_vendor_evaluations_updated_at
  BEFORE UPDATE ON public.vendor_evaluations
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();
