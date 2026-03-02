-- Migration: Vendor Submissions & Token-Gated Upload Portal

-- 1) Drop previous tables from 002 migration if they exist
DROP TABLE IF EXISTS public.work_order_upload_files CASCADE;
DROP TABLE IF EXISTS public.work_order_upload_requests CASCADE;

-- 2) Create token-gated upload requests
CREATE TABLE IF NOT EXISTS public.work_order_vendor_upload_requests (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id            uuid        NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  work_order_id     uuid        NOT NULL REFERENCES public.work_orders(id) ON DELETE CASCADE,
  created_by        uuid        REFERENCES public.profiles(user_id),
  created_at        timestamptz NOT NULL DEFAULT now(),
  expires_at        timestamptz NOT NULL,
  status            text        NOT NULL DEFAULT 'active'
                      CHECK (status IN ('active', 'expired', 'revoked', 'completed')),
  token_hash        text        NOT NULL,
  allowed_doc_types text[]      NOT NULL DEFAULT '{quote,invoice,supporting}',
  max_files         int         NOT NULL DEFAULT 10,
  max_total_bytes   bigint      NOT NULL DEFAULT 52428800
);

CREATE INDEX IF NOT EXISTS idx_wovur_org_wo ON public.work_order_vendor_upload_requests (org_id, work_order_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_wovur_token ON public.work_order_vendor_upload_requests (token_hash);
CREATE INDEX IF NOT EXISTS idx_wovur_expires ON public.work_order_vendor_upload_requests (expires_at);

-- 3) Create vendor submissions record
CREATE TABLE IF NOT EXISTS public.work_order_vendor_submissions (
  id                      uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id                  uuid        NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  work_order_id           uuid        NOT NULL REFERENCES public.work_orders(id) ON DELETE CASCADE,
  upload_request_id       uuid        NOT NULL REFERENCES public.work_order_vendor_upload_requests(id) ON DELETE CASCADE,
  vendor_id               uuid        REFERENCES public.vendors(id) ON DELETE SET NULL,
  -- Captured from external form:
  vendor_name             text        NOT NULL,
  vendor_email            text,
  vendor_phone            text,
  tax_id                  text,
  vendor_code             text,
  -- Submission details:
  currency                text        NOT NULL DEFAULT 'JMD',
  quoted_amount           numeric,
  message                 text,
  status                  text        NOT NULL DEFAULT 'submitted'
                            CHECK (status IN ('submitted', 'reviewed', 'awarded', 'rejected')),
  -- Audit/Resolution
  submitted_at            timestamptz NOT NULL DEFAULT now(),
  resolved_vendor_at      timestamptz,
  resolved_vendor_method  text        CHECK (resolved_vendor_method IN ('matched_existing', 'created_new', 'manual')),
  resolved_by             uuid        REFERENCES public.profiles(user_id)
);

CREATE INDEX IF NOT EXISTS idx_wovs_org_wo ON public.work_order_vendor_submissions (org_id, work_order_id, submitted_at DESC);
CREATE INDEX IF NOT EXISTS idx_wovs_vendor ON public.work_order_vendor_submissions (org_id, vendor_id);

-- 4) Create submission files tracking
CREATE TABLE IF NOT EXISTS public.work_order_vendor_submission_files (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id          uuid        NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  submission_id   uuid        NOT NULL REFERENCES public.work_order_vendor_submissions(id) ON DELETE CASCADE,
  document_id     uuid        REFERENCES public.documents(id) ON DELETE SET NULL,
  doc_type        text        NOT NULL,
  file_name       text        NOT NULL,
  mime_type       text,
  size_bytes      bigint,
  sha256          text,
  storage_bucket  text        NOT NULL DEFAULT 'vendor_uploads',
  storage_path    text        NOT NULL,
  status          text        NOT NULL DEFAULT 'queued'
                    CHECK (status IN ('queued', 'uploading', 'stored', 'failed', 'rejected')),
  uploaded_at     timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_wovsf_submission ON public.work_order_vendor_submission_files (org_id, submission_id, uploaded_at DESC);
