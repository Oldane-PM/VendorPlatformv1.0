-- Migration: Create prerequisite tables for the upload feature
-- Tables: documents, work_order_documents, vendor_documents, audit_events
-- Uses DROP + CREATE to avoid conflicts with pre-existing tables that may have a different schema.

-- ─── 1. documents ─────────────────────────────────────────────────────────
DROP TABLE IF EXISTS public.work_order_documents CASCADE;
DROP TABLE IF EXISTS public.vendor_documents CASCADE;
DROP TABLE IF EXISTS public.documents CASCADE;
DROP TABLE IF EXISTS public.audit_events CASCADE;

CREATE TABLE public.documents (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id        uuid        NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  file_name     text        NOT NULL,
  mime_type     text,
  size_bytes    bigint,
  storage_bucket text       NOT NULL,
  storage_path  text        NOT NULL,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_documents_org
  ON public.documents (org_id, created_at DESC);

-- ─── 2. work_order_documents ──────────────────────────────────────────────
CREATE TABLE public.work_order_documents (
  id              uuid  PRIMARY KEY DEFAULT gen_random_uuid(),
  work_order_id   uuid  NOT NULL REFERENCES public.work_orders(id) ON DELETE CASCADE,
  document_id     uuid  NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  doc_type        text  NOT NULL,  -- invoice / quote / supporting
  created_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (work_order_id, document_id)
);

CREATE INDEX idx_wo_docs_wo
  ON public.work_order_documents (work_order_id, created_at DESC);

-- ─── 3. vendor_documents ─────────────────────────────────────────────────
CREATE TABLE public.vendor_documents (
  id          uuid  PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id   uuid  NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  document_id uuid  NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  doc_type    text  NOT NULL,
  expires_on  date,
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (vendor_id, document_id)
);

CREATE INDEX idx_vendor_docs_vendor
  ON public.vendor_documents (vendor_id, created_at DESC);

-- ─── 4. audit_events ─────────────────────────────────────────────────────
CREATE TABLE public.audit_events (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id      uuid        REFERENCES public.organizations(id) ON DELETE SET NULL,
  event_type  text        NOT NULL,
  entity_type text,
  entity_id   uuid,
  actor_id    uuid,
  metadata    jsonb       DEFAULT '{}',
  ip_address  text,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_audit_org_type
  ON public.audit_events (org_id, event_type, created_at DESC);

CREATE INDEX idx_audit_entity
  ON public.audit_events (entity_type, entity_id, created_at DESC);
