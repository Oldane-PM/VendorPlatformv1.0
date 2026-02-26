-- Migration: Work-order upload request + file tracking tables

-- ─── 1. work_order_upload_requests ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.work_order_upload_requests (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id          uuid        NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  work_order_id   uuid        NOT NULL REFERENCES public.work_orders(id) ON DELETE CASCADE,
  vendor_id       uuid        NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  request_email   text        NOT NULL,
  allowed_doc_types text[]    NOT NULL DEFAULT '{invoice,quote,supporting}',
  token_hash      text        NOT NULL,
  expires_at      timestamptz NOT NULL,
  status          text        NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending','partially_uploaded','completed','expired','revoked')),
  max_files       int         NOT NULL DEFAULT 10,
  max_total_bytes bigint      NOT NULL DEFAULT 52428800,  -- 50 MB
  message         text,
  created_by      uuid        REFERENCES public.profiles(user_id),
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  revoked_at      timestamptz,
  revoked_by      uuid        REFERENCES public.profiles(user_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_wour_org_wo
  ON public.work_order_upload_requests (org_id, work_order_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_wour_org_vendor
  ON public.work_order_upload_requests (org_id, vendor_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_wour_token
  ON public.work_order_upload_requests (token_hash);

CREATE INDEX IF NOT EXISTS idx_wour_expires
  ON public.work_order_upload_requests (expires_at);

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_wour_updated_at ON public.work_order_upload_requests;
CREATE TRIGGER trg_wour_updated_at
  BEFORE UPDATE ON public.work_order_upload_requests
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ─── 2. work_order_upload_files ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.work_order_upload_files (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id            uuid        NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  upload_request_id uuid        NOT NULL REFERENCES public.work_order_upload_requests(id) ON DELETE CASCADE,
  work_order_id     uuid        NOT NULL REFERENCES public.work_orders(id) ON DELETE CASCADE,
  vendor_id         uuid        NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  document_id       uuid        REFERENCES public.documents(id) ON DELETE SET NULL,
  doc_type          text        NOT NULL,
  file_name         text        NOT NULL,
  mime_type         text,
  size_bytes        bigint,
  sha256            text,
  storage_bucket    text        NOT NULL,
  storage_path      text        NOT NULL,
  status            text        NOT NULL DEFAULT 'queued'
                      CHECK (status IN ('queued','uploading','stored','failed','rejected')),
  uploaded_at       timestamptz NOT NULL DEFAULT now(),
  uploader_ip       text
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_wouf_org_request
  ON public.work_order_upload_files (org_id, upload_request_id, uploaded_at DESC);

CREATE INDEX IF NOT EXISTS idx_wouf_org_wo
  ON public.work_order_upload_files (org_id, work_order_id, uploaded_at DESC);
