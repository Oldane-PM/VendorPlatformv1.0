-- Add portal_type to work_order_vendor_upload_requests
ALTER TABLE public.work_order_vendor_upload_requests 
ADD COLUMN IF NOT EXISTS portal_type text NOT NULL DEFAULT 'quote_supporting';

-- Create Table: engagement_invoice_upload_requests
CREATE TABLE IF NOT EXISTS public.engagement_invoice_upload_requests (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    engagement_id uuid NOT NULL REFERENCES public.engagements(id) ON DELETE CASCADE,
    vendor_id uuid NOT NULL REFERENCES public.vendors(id) ON DELETE RESTRICT,
    created_by uuid REFERENCES public.profiles(user_id),
    created_at timestamptz NOT NULL DEFAULT now(),
    expires_at timestamptz NOT NULL,
    status text NOT NULL DEFAULT 'active',
    token_hash text NOT NULL,
    max_files int NOT NULL DEFAULT 10,
    max_total_bytes bigint NOT NULL DEFAULT 52428800,
    allowed_doc_types text[] NOT NULL DEFAULT '{invoice}',
    CONSTRAINT engagement_invoice_upload_requests_status_check CHECK (status IN ('active', 'expired', 'revoked', 'completed'))
);

CREATE INDEX IF NOT EXISTS idx_engagement_invoice_reqs_org_engagement ON public.engagement_invoice_upload_requests (org_id, engagement_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_engagement_invoice_reqs_token_hash ON public.engagement_invoice_upload_requests (token_hash);
CREATE INDEX IF NOT EXISTS idx_engagement_invoice_reqs_expires_at ON public.engagement_invoice_upload_requests (expires_at);


-- Create Table: engagement_invoice_submissions
CREATE TABLE IF NOT EXISTS public.engagement_invoice_submissions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    engagement_id uuid NOT NULL REFERENCES public.engagements(id) ON DELETE CASCADE,
    vendor_id uuid NOT NULL REFERENCES public.vendors(id) ON DELETE RESTRICT,
    upload_request_id uuid NOT NULL REFERENCES public.engagement_invoice_upload_requests(id) ON DELETE CASCADE,
    invoice_number_text text,
    invoice_date date,
    due_date date,
    currency text NOT NULL DEFAULT 'JMD',
    subtotal numeric,
    tax_total numeric,
    total numeric,
    message text,
    status text NOT NULL DEFAULT 'submitted',
    submitted_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT engagement_invoice_submissions_status_check CHECK (status IN ('submitted', 'reviewed', 'accepted', 'rejected'))
);

CREATE INDEX IF NOT EXISTS idx_engagement_invoice_subs_org_engagement ON public.engagement_invoice_submissions (org_id, engagement_id, submitted_at DESC);
CREATE INDEX IF NOT EXISTS idx_engagement_invoice_subs_org_vendor ON public.engagement_invoice_submissions (org_id, vendor_id);


-- Create Table: engagement_invoice_submission_files
CREATE TABLE IF NOT EXISTS public.engagement_invoice_submission_files (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    submission_id uuid NOT NULL REFERENCES public.engagement_invoice_submissions(id) ON DELETE CASCADE,
    document_id uuid REFERENCES public.documents(id) ON DELETE SET NULL,
    doc_type text NOT NULL DEFAULT 'invoice',
    file_name text NOT NULL,
    mime_type text,
    size_bytes bigint,
    sha256 text,
    storage_bucket text NOT NULL DEFAULT 'vendor_invoices',
    storage_path text NOT NULL,
    status text NOT NULL DEFAULT 'stored',
    uploaded_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT engagement_invoice_sub_files_status_check CHECK (status IN ('queued', 'uploading', 'stored', 'failed', 'rejected'))
);

CREATE INDEX IF NOT EXISTS idx_engagement_invoice_files_submission ON public.engagement_invoice_submission_files (org_id, submission_id, uploaded_at DESC);
CREATE INDEX IF NOT EXISTS idx_engagement_invoice_files_uploaded ON public.engagement_invoice_submission_files (org_id, uploaded_at DESC);


-- Provision the vendor_invoices storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('vendor_invoices', 'vendor_invoices', false)
ON CONFLICT (id) DO NOTHING;

-- Storage Policy: Service Role Full Access on vendor_invoices bucket
DROP POLICY IF EXISTS "Service Role Full Access - vendor_invoices" ON storage.objects;
CREATE POLICY "Service Role Full Access - vendor_invoices"
ON storage.objects
FOR ALL
TO service_role
USING (bucket_id = 'vendor_invoices')
WITH CHECK (bucket_id = 'vendor_invoices');
