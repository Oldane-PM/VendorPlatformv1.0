/**
 * engagementInvoicePortalRepo — server-side repository for vendor invoice uploads
 *
 * Implements token-gated links, submissions, signed upload URLs, and vendor association.
 * Uses the service-role Supabase client only.
 */

import crypto from 'crypto';
import { createServerClient } from '../server';

// ─── Constants ──────────────────────────────────────────────────────────────

const BUCKET = 'vendor_invoices';
const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB per file

// ─── Helpers ────────────────────────────────────────────────────────────────

function supabase() {
  return createServerClient();
}

function pepper(): string {
  return process.env.UPLOAD_TOKEN_PEPPER ?? 'dev-pepper-replace-me';
}

function generateToken(): string {
  return crypto.randomBytes(32).toString('base64url');
}

function hashToken(raw: string): string {
  return crypto
    .createHash('sha256')
    .update(raw + pepper())
    .digest('hex');
}

function sanitizeFileName(name: string): string {
  return name
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/_{2,}/g, '_')
    .substring(0, 200);
}

async function audit(
  orgId: string | null,
  eventType: string,
  entityType: string,
  entityId: string,
  actorId: string | null,
  metadata: Record<string, unknown> = {},
  ip?: string
) {
  const client = supabase() as any;
  await client.from('audit_events').insert({
    org_id: orgId,
    event_type: eventType,
    entity_type: entityType,
    entity_id: entityId,
    actor_id: actorId,
    metadata,
    ip_address: ip ?? null,
  });
}

// ─── Token Validation ───────────────────────────────────────────────────────

export interface ValidatedInvoiceRequest {
  id: string;
  org_id: string;
  engagement_id: string;
  vendor_id: string;
  allowed_doc_types: string[];
  expires_at: string;
  status: string;
  max_files: number;
  max_total_bytes: number;
  created_at: string;
}

export async function validateInvoiceToken(
  requestId: string,
  rawToken: string
): Promise<ValidatedInvoiceRequest> {
  const client = supabase() as any;
  const hash = hashToken(rawToken);

  const { data, error } = await client
    .from('engagement_invoice_upload_requests')
    .select('*')
    .eq('id', requestId)
    .eq('token_hash', hash)
    .single();

  if (error || !data) {
    throw new Error('Invalid or expired upload link.');
  }

  if (data.status === 'revoked') {
    throw new Error('This upload link has been revoked.');
  }

  if (new Date(data.expires_at) <= new Date()) {
    await client
      .from('engagement_invoice_upload_requests')
      .update({ status: 'expired' })
      .eq('id', requestId);
    throw new Error('This upload link has expired.');
  }

  return data as ValidatedInvoiceRequest;
}

// ─── 1) createLink ──────────────────────────────────────────────────────────

export interface CreateInvoiceUploadLinkPayload {
  expiresInHours?: number;
  maxFiles?: number;
  maxTotalBytes?: number;
}

export interface CreateInvoiceUploadLinkResult {
  requestId: string;
  expiresAt: string;
  portalUrl: string;
  rawToken: string;
}

export async function createInvoiceUploadLink(
  orgId: string,
  createdBy: string,
  engagementId: string,
  vendorId: string,
  config: CreateInvoiceUploadLinkPayload = {}
): Promise<CreateInvoiceUploadLinkResult> {
  const client = supabase() as any;

  const rawToken = generateToken();
  const tokenHash = hashToken(rawToken);
  const expiresAt = new Date(
    Date.now() + (config.expiresInHours ?? 72) * 60 * 60 * 1000
  ).toISOString();

  const row = {
    org_id: orgId,
    engagement_id: engagementId,
    vendor_id: vendorId,
    allowed_doc_types: ['invoice'], // Fixed for this portal
    token_hash: tokenHash,
    expires_at: expiresAt,
    max_files: config.maxFiles ?? 10,
    max_total_bytes: config.maxTotalBytes ?? 52428800,
    created_by:
      createdBy === '00000000-0000-0000-0000-000000000000' ? null : createdBy,
  };

  const { data, error } = await client
    .from('engagement_invoice_upload_requests')
    .insert(row)
    .select('id, expires_at')
    .single();

  if (error || !data) {
    console.error(
      '[createInvoiceUploadLink] Insert error:',
      error?.message,
      'code:',
      error?.code,
      'details:',
      error?.details,
      'hint:',
      error?.hint
    );
    console.error(
      '[createInvoiceUploadLink] Row attempted:',
      JSON.stringify(row)
    );
    throw new Error('Failed to create upload request.');
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
  const portalUrl = `${appUrl}/vendor-portal/engagement/${data.id}?t=${rawToken}`;

  await audit(
    orgId,
    'engagement_invoice_upload_link.created',
    'engagement_invoice_upload_requests',
    data.id,
    createdBy
  );

  return {
    requestId: data.id,
    expiresAt: data.expires_at,
    portalUrl,
    rawToken,
  };
}

// ─── 2) getContext ──────────────────────────────────────────────────────────

export interface InvoicePortalContextDto {
  requestId: string;
  engagementTitle: string | null;
  engagementNumber: string | null;
  vendorName: string | null;
  allowedDocTypes: string[];
  expiresAt: string;
  maxFiles: number;
  maxTotalBytes: number;
}

export async function getInvoicePortalContext(
  requestId: string,
  rawToken: string,
  ip?: string
): Promise<InvoicePortalContextDto> {
  const req = await validateInvoiceToken(requestId, rawToken);
  const client = supabase() as any;

  const [{ data: eng }, { data: vendor }] = await Promise.all([
    client
      .from('engagements')
      .select('title, engagement_number')
      .eq('id', req.engagement_id)
      .single(),
    client
      .from('vendors')
      .select('vendor_name')
      .eq('id', req.vendor_id)
      .single(),
  ]);

  await audit(
    req.org_id,
    'engagement_invoice_upload_link.opened',
    'engagement_invoice_upload_requests',
    requestId,
    null,
    {},
    ip
  );

  return {
    requestId,
    engagementTitle: eng?.title ?? null,
    engagementNumber: eng?.engagement_number
      ? `ENG-${String(eng.engagement_number).padStart(4, '0')}`
      : null,
    vendorName: vendor?.vendor_name ?? null,
    allowedDocTypes: req.allowed_doc_types,
    expiresAt: req.expires_at,
    maxFiles: req.max_files,
    maxTotalBytes: req.max_total_bytes,
  };
}

// ─── 3) createSubmission ────────────────────────────────────────────────────

export interface CreateInvoiceSubmissionPayload {
  invoiceNumber?: string;
  invoiceDate?: string; // YYYY-MM-DD
  dueDate?: string; // YYYY-MM-DD
  currency?: string;
  subtotal?: number;
  taxTotal?: number;
  total?: number;
  message?: string;
}

export async function createInvoiceSubmission(
  requestId: string,
  rawToken: string,
  payload: CreateInvoiceSubmissionPayload
): Promise<{ submissionId: string }> {
  const req = await validateInvoiceToken(requestId, rawToken);
  const client = supabase() as any;

  const { data, error } = await client
    .from('engagement_invoice_submissions')
    .insert({
      org_id: req.org_id,
      engagement_id: req.engagement_id,
      vendor_id: req.vendor_id,
      upload_request_id: requestId,
      invoice_number_text: payload.invoiceNumber ?? null,
      invoice_date: payload.invoiceDate ?? null,
      due_date: payload.dueDate ?? null,
      currency: payload.currency ?? 'JMD',
      subtotal: payload.subtotal ?? null,
      tax_total: payload.taxTotal ?? null,
      total: payload.total ?? null,
      message: payload.message ?? null,
      status: 'submitted',
    })
    .select('id')
    .single();

  if (error || !data) {
    console.error('[createInvoiceSubmission] Insert error:', error?.message);
    throw new Error('Failed to create invoice submission.');
  }

  await audit(
    req.org_id,
    'engagement_invoice_submission.created',
    'engagement_invoice_submissions',
    data.id,
    null
  );

  return { submissionId: data.id };
}

// ─── 4) createSignedUploadUrl ───────────────────────────────────────────────

export interface InvoiceFileMetaInput {
  fileName: string;
  mimeType: string;
  sizeBytes: number;
}

export interface SignedInvoiceUploadResult {
  signedUrl: string;
  uploadFileId: string;
  storagePath: string;
}

export async function createSignedInvoiceUploadUrl(
  requestId: string,
  rawToken: string,
  submissionId: string,
  fileMeta: InvoiceFileMetaInput
): Promise<SignedInvoiceUploadResult> {
  const req = await validateInvoiceToken(requestId, rawToken);
  const client = supabase() as any;

  const { data: sub } = await client
    .from('engagement_invoice_submissions')
    .select('id')
    .eq('id', submissionId)
    .eq('upload_request_id', requestId)
    .single();

  if (!sub) {
    throw new Error('Invalid submission ID for this request.');
  }

  if (!ALLOWED_MIME_TYPES.includes(fileMeta.mimeType)) {
    throw new Error(`File type "${fileMeta.mimeType}" is not allowed.`);
  }

  if (fileMeta.sizeBytes > MAX_FILE_SIZE) {
    throw new Error(
      `File exceeds maximum size of ${MAX_FILE_SIZE / 1024 / 1024} MB.`
    );
  }

  const fileId = crypto.randomUUID();
  const safeName = sanitizeFileName(fileMeta.fileName);
  const storagePath = `org/${req.org_id}/engagements/${req.engagement_id}/invoices/${submissionId}/${fileId}-${safeName}`;

  const { data: fileRow, error: insertErr } = await client
    .from('engagement_invoice_submission_files')
    .insert({
      org_id: req.org_id,
      submission_id: submissionId,
      doc_type: 'invoice',
      file_name: fileMeta.fileName,
      mime_type: fileMeta.mimeType,
      size_bytes: fileMeta.sizeBytes,
      storage_bucket: BUCKET,
      storage_path: storagePath,
      status: 'queued',
    })
    .select('id')
    .single();

  if (insertErr || !fileRow) {
    throw new Error('Failed to prepare upload tracking.');
  }

  const { data: signedData, error: signErr } = await client.storage
    .from(BUCKET)
    .createSignedUploadUrl(storagePath);

  if (signErr || !signedData?.signedUrl) {
    await client
      .from('engagement_invoice_submission_files')
      .update({ status: 'failed' })
      .eq('id', fileRow.id);
    throw new Error('Failed to generate upload URL.');
  }

  return {
    signedUrl: signedData.signedUrl,
    uploadFileId: fileRow.id,
    storagePath,
  };
}

// ─── 5) finalizeFile ────────────────────────────────────────────────────────

export interface FinalizeInvoiceInput {
  sha256?: string;
  sizeBytes?: number;
}

export async function finalizeInvoiceFile(
  requestId: string,
  rawToken: string,
  submissionId: string,
  uploadFileId: string,
  meta: FinalizeInvoiceInput = {}
): Promise<{ success: boolean; documentId: string }> {
  const req = await validateInvoiceToken(requestId, rawToken);
  const client = supabase() as any;

  // 1. Fetch File tracking record
  const { data: fileRow } = await client
    .from('engagement_invoice_submission_files')
    .select('*')
    .eq('id', uploadFileId)
    .eq('submission_id', submissionId)
    .single();

  if (!fileRow) {
    throw new Error('Upload file record not found.');
  }

  // 2. Fetch Submission record (to get invoice metadata)
  const { data: subRow } = await client
    .from('engagement_invoice_submissions')
    .select('*')
    .eq('id', submissionId)
    .single();

  // 3. Create document record
  const { data: doc, error: docErr } = await client
    .from('documents')
    .insert({
      org_id: req.org_id,
      file_name: fileRow.file_name,
      mime_type: fileRow.mime_type,
      size_bytes: meta.sizeBytes ?? fileRow.size_bytes,
      storage_bucket: fileRow.storage_bucket,
      storage_path: fileRow.storage_path,
    })
    .select('id')
    .single();

  if (docErr || !doc) {
    throw new Error('Failed to create document record.');
  }

  // 4. Create the core `invoices` row (Option 2 implementation)
  const { data: invoiceRow } = await client
    .from('invoices')
    .insert({
      vendor_id: req.vendor_id,
      engagement_id: req.engagement_id,
      invoice_number: subRow?.invoice_number_text ?? null,
      status: 'Submitted',
      total_amount: subRow?.total ?? null,
      due_date: subRow?.due_date ?? null,
      created_by: null, // User is not authenticated in this portal
    })
    .select('id')
    .single();

  if (invoiceRow) {
    // Attempt to link it via invoice_files tracking if it exists
    await client
      .from('invoice_files')
      .insert({
        invoice_id: invoiceRow.id,
        storage_path: fileRow.storage_path,
        file_name: fileRow.file_name,
        mime_type: fileRow.mime_type,
      })
      .select()
      .maybeSingle();
  }

  // 5. Update submission file
  await client
    .from('engagement_invoice_submission_files')
    .update({
      document_id: doc.id,
      status: 'stored',
      sha256: meta.sha256 ?? null,
      size_bytes: meta.sizeBytes ?? fileRow.size_bytes,
    })
    .eq('id', uploadFileId);

  await audit(
    req.org_id,
    'engagement_invoice_submission.file_uploaded',
    'engagement_invoice_submissions',
    submissionId,
    null,
    {
      document_id: doc.id,
      file_name: fileRow.file_name,
      invoice_id: invoiceRow?.id,
    }
  );

  return { success: true, documentId: doc.id };
}

// ─── 6) getEngagementInvoiceFiles ───────────────────────────────────────────

export async function getEngagementInvoiceFiles(
  orgId: string,
  engagementId: string
): Promise<any[]> {
  const client = supabase() as any;

  // We find both forms, ones uploaded directly to core invoice tables
  // and ones via submissions, but the submissions table holds the file metadata easily

  const { data: files, error } = await client
    .from('engagement_invoice_submission_files')
    .select(
      'id, file_name, size_bytes, uploaded_at, storage_path, submission_id'
    )
    .eq('org_id', orgId)
    .eq('status', 'stored')
    .order('uploaded_at', { ascending: false });

  if (error || !files || files.length === 0) return [];

  // Need to filter files belonging strictly to this engagement via submission
  const { data: submissions } = await client
    .from('engagement_invoice_submissions')
    .select('id')
    .eq('engagement_id', engagementId);

  if (!submissions) return [];

  const subIds = new Set(submissions.map((s: any) => s.id));
  const validFiles = files.filter((f: any) => subIds.has(f.submission_id));

  return validFiles;
}

export async function createSignedInvoiceReadUrl(
  path: string,
  ttlSeconds = 300
): Promise<string | null> {
  const client = supabase() as any;
  const { data, error } = await client.storage
    .from(BUCKET)
    .createSignedUrl(path, ttlSeconds);

  if (error || !data) return null;
  return data.signedUrl;
}
