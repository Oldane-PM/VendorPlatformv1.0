-- Migration: Add OCR extraction tables for Documents AI Upload

-- 1. Ensure `documents` table has `processing_status`
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'documents'
          AND column_name = 'processing_status'
    ) THEN
        ALTER TABLE public.documents ADD COLUMN processing_status text DEFAULT 'queued';
    END IF;
END $$;

-- 2. document_extractions
DROP TABLE IF EXISTS public.document_extractions CASCADE;
CREATE TABLE public.document_extractions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  raw_response jsonb NOT NULL,
  confidence_score float,
  processing_error text,
  extracted_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 3. document_fields
DROP TABLE IF EXISTS public.document_fields CASCADE;
CREATE TABLE public.document_fields (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  field_key text NOT NULL,
  text_value text,
  number_value numeric,
  date_value timestamptz,
  confidence float,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 4. document_line_items
DROP TABLE IF EXISTS public.document_line_items CASCADE;
CREATE TABLE public.document_line_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  line_index int NOT NULL,
  description text,
  quantity numeric,
  unit_price numeric,
  tax_amount numeric,
  line_total numeric,
  raw_json jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_doc_extractions_doc_id ON public.document_extractions(document_id);
CREATE INDEX IF NOT EXISTS idx_doc_fields_doc_id ON public.document_fields(document_id);
CREATE INDEX IF NOT EXISTS idx_doc_line_items_doc_id ON public.document_line_items(document_id);

-- updated_at triggers
CREATE OR REPLACE FUNCTION public.set_doc_fields_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_doc_fields_updated_at ON public.document_fields;
CREATE TRIGGER trg_doc_fields_updated_at
  BEFORE UPDATE ON public.document_fields
  FOR EACH ROW EXECUTE FUNCTION public.set_doc_fields_updated_at();

CREATE OR REPLACE FUNCTION public.set_doc_line_items_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_doc_line_items_updated_at ON public.document_line_items;
CREATE TRIGGER trg_doc_line_items_updated_at
  BEFORE UPDATE ON public.document_line_items
  FOR EACH ROW EXECUTE FUNCTION public.set_doc_line_items_updated_at();
