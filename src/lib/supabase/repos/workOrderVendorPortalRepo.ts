/**
 * workOrderVendorPortalRepo — server-side repository for vendor document uploads
 *
 * Implements token-gated links, submissions, signed upload URLs, and vendor resolution.
 * Uses the service-role Supabase client only.
 */

import crypto from 'crypto';
import { createServerClient } from '../server';
import { VendorRow } from './vendorsRepo';

// ─── Constants ──────────────────────────────────────────────────────────────

const BUCKET = 'vendor_uploads';
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

/** Generate a cryptographically random token (base64url). */
function generateToken(): string {
  return crypto.randomBytes(32).toString('base64url');
}

/** Hash a raw token with the pepper for storage. */
function hashToken(raw: string): string {
  return crypto
    .createHash('sha256')
    .update(raw + pepper())
    .digest('hex');
}

/** Sanitise a filename for use in a storage path. */
function sanitizeFileName(name: string): string {
  return name
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/_{2,}/g, '_')
    .substring(0, 200);
}

/** Write an audit event row. */
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

export interface ValidatedRequest {
  id: string;
  org_id: string;
  work_order_id: string;
  allowed_doc_types: string[];
  expires_at: string;
  status: string;
  max_files: number;
  max_total_bytes: number;
  created_at: string;
}

/**
 * Validate a request ID + raw token. Returns the request row if valid.
 */
export async function validateToken(
  requestId: string,
  rawToken: string
): Promise<ValidatedRequest> {
  const client = supabase() as any;
  const hash = hashToken(rawToken);

  const { data, error } = await client
    .from('work_order_vendor_upload_requests')
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
      .from('work_order_vendor_upload_requests')
      .update({ status: 'expired' })
      .eq('id', requestId);
    throw new Error('This upload link has expired.');
  }

  return data as ValidatedRequest;
}

// ─── 1) createUploadLink ────────────────────────────────────────────────────

export interface CreateUploadLinkPayload {
  allowedDocTypes?: string[];
  expiresInHours?: number;
  maxFiles?: number;
  maxTotalBytes?: number;
}

export interface CreateUploadLinkResult {
  requestId: string;
  expiresAt: string;
  portalUrl: string;
  rawToken: string;
}

export async function createUploadLink(
  orgId: string,
  createdBy: string,
  workOrderId: string,
  config: CreateUploadLinkPayload = {}
): Promise<CreateUploadLinkResult> {
  const client = supabase() as any;

  const rawToken = generateToken();
  const tokenHash = hashToken(rawToken);
  const expiresAt = new Date(
    Date.now() + (config.expiresInHours ?? 72) * 60 * 60 * 1000
  ).toISOString();

  const row = {
    org_id: orgId,
    work_order_id: workOrderId,
    allowed_doc_types: config.allowedDocTypes ?? [
      'quote',
      'invoice',
      'supporting',
    ],
    token_hash: tokenHash,
    expires_at: expiresAt,
    max_files: config.maxFiles ?? 10,
    max_total_bytes: config.maxTotalBytes ?? 52428800,
    created_by:
      createdBy === '00000000-0000-0000-0000-000000000000' ? null : createdBy,
  };

  const { data, error } = await client
    .from('work_order_vendor_upload_requests')
    .insert(row)
    .select('id, expires_at')
    .single();

  if (error || !data) {
    console.error('[createUploadLink] Insert error:', error?.message);
    throw new Error('Failed to create upload request.');
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
  const portalUrl = `${appUrl}/vendor-portal/work-order/${data.id}?t=${rawToken}`;

  await audit(
    orgId,
    'work_order_upload_link.created',
    'work_order_vendor_upload_requests',
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

// ─── 2) getPortalContext ────────────────────────────────────────────────────

export interface PortalContextDto {
  requestId: string;
  workOrderTitle: string | null;
  workOrderNumber: string | null;
  allowedDocTypes: string[];
  expiresAt: string;
  maxFiles: number;
  maxTotalBytes: number;
}

export async function getPortalContext(
  requestId: string,
  rawToken: string,
  ip?: string
): Promise<PortalContextDto> {
  const req = await validateToken(requestId, rawToken);
  const client = supabase() as any;

  const { data: wo } = await client
    .from('work_orders')
    .select('title, work_order_number')
    .eq('id', req.work_order_id)
    .single();

  await audit(
    req.org_id,
    'work_order_upload_link.opened',
    'work_order_vendor_upload_requests',
    requestId,
    null,
    {},
    ip
  );

  return {
    requestId,
    workOrderTitle: wo?.title ?? null,
    workOrderNumber: wo?.work_order_number
      ? `WO-${String(wo.work_order_number).padStart(4, '0')}`
      : null,
    allowedDocTypes: req.allowed_doc_types,
    expiresAt: req.expires_at,
    maxFiles: req.max_files,
    maxTotalBytes: req.max_total_bytes,
  };
}

// ─── 3) createSubmission ────────────────────────────────────────────────────

export interface CreateSubmissionPayload {
  vendorName: string;
  vendorEmail?: string;
  vendorPhone?: string;
  taxId?: string;
  vendorCode?: string;
  currency?: string;
  quotedAmount?: number;
  message?: string;
}

export async function createSubmission(
  requestId: string,
  rawToken: string,
  payload: CreateSubmissionPayload
): Promise<{ submissionId: string }> {
  const req = await validateToken(requestId, rawToken);
  const client = supabase() as any;

  if (!payload.vendorName?.trim()) {
    throw new Error('Vendor name is required.');
  }

  const { data, error } = await client
    .from('work_order_vendor_submissions')
    .insert({
      org_id: req.org_id,
      work_order_id: req.work_order_id,
      upload_request_id: requestId,
      vendor_name: payload.vendorName,
      vendor_email: payload.vendorEmail ?? null,
      vendor_phone: payload.vendorPhone ?? null,
      tax_id: payload.taxId ?? null,
      vendor_code: payload.vendorCode ?? null,
      currency: payload.currency ?? 'JMD',
      quoted_amount: payload.quotedAmount ?? null,
      message: payload.message ?? null,
      status: 'submitted',
    })
    .select('id')
    .single();

  if (error || !data) {
    console.error('[createSubmission] Insert error:', error?.message);
    throw new Error('Failed to create vendor submission.');
  }

  await audit(
    req.org_id,
    'work_order_vendor_submission.created',
    'work_order_vendor_submissions',
    data.id,
    null
  );

  return { submissionId: data.id };
}

// ─── 4) createSignedUploadUrl ───────────────────────────────────────────────

export interface FileMetaInput {
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  docType: string;
}

export interface SignedUploadResult {
  signedUrl: string;
  uploadFileId: string;
  storagePath: string;
}

export async function createSignedUploadUrl(
  requestId: string,
  rawToken: string,
  submissionId: string,
  fileMeta: FileMetaInput
): Promise<SignedUploadResult> {
  const req = await validateToken(requestId, rawToken);
  const client = supabase() as any;

  // Verify submission belongs to this request
  const { data: sub } = await client
    .from('work_order_vendor_submissions')
    .select('id')
    .eq('id', submissionId)
    .eq('upload_request_id', requestId)
    .single();

  if (!sub) {
    throw new Error('Invalid submission ID for this request.');
  }

  if (!req.allowed_doc_types.includes(fileMeta.docType)) {
    throw new Error(`Document type "${fileMeta.docType}" is not allowed.`);
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
  const storagePath = `org/${req.org_id}/work_orders/${req.work_order_id}/submissions/${submissionId}/${fileId}-${safeName}`;

  const { data: fileRow, error: insertErr } = await client
    .from('work_order_vendor_submission_files')
    .insert({
      org_id: req.org_id,
      submission_id: submissionId,
      doc_type: fileMeta.docType,
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
      .from('work_order_vendor_submission_files')
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

export interface FinalizeInput {
  sha256?: string;
  sizeBytes?: number;
}

export async function finalizeFile(
  requestId: string,
  rawToken: string,
  submissionId: string,
  uploadFileId: string,
  meta: FinalizeInput = {}
): Promise<{ success: boolean }> {
  const req = await validateToken(requestId, rawToken);
  const client = supabase() as any;

  const { data: fileRow } = await client
    .from('work_order_vendor_submission_files')
    .select('*')
    .eq('id', uploadFileId)
    .eq('submission_id', submissionId)
    .single();

  if (!fileRow) {
    throw new Error('Upload file record not found.');
  }

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

  await client.from('work_order_documents').insert({
    work_order_id: req.work_order_id,
    document_id: doc.id,
    doc_type: fileRow.doc_type,
  });

  // 3. If doc_type is 'invoice', auto-create an invoice record
  //    so it appears on the Invoices page
  if (fileRow.doc_type === 'invoice') {
    try {
      // Look up vendor_id from the submission (may be null if not yet resolved)
      const { data: subRow } = await client
        .from('work_order_vendor_submissions')
        .select('vendor_id')
        .eq('id', submissionId)
        .single();

      const vendorId = subRow?.vendor_id ?? null;

      // Look up the engagement_id from the work order
      const { data: wo } = await client
        .from('work_orders')
        .select('engagement_id')
        .eq('id', req.work_order_id)
        .single();

      const engagementId = wo?.engagement_id ?? null;

      // Create the invoice row
      const { data: invoiceRow } = await client
        .from('invoices')
        .insert({
          vendor_id: vendorId,
          engagement_id: engagementId,
          invoice_number: null,
          status: 'Submitted',
          total_amount: null,
          due_date: null,
          created_by: null,
        })
        .select('id')
        .single();

      if (invoiceRow) {
        // Create the invoice_files row linked to the invoice
        await client.from('invoice_files').insert({
          invoice_id: invoiceRow.id,
          storage_path: fileRow.storage_path,
          file_name: fileRow.file_name,
          mime_type: fileRow.mime_type,
        });

        // Audit — invoice auto-created from work order upload
        await audit(
          req.org_id,
          'invoice.created_from_upload',
          'invoice',
          invoiceRow.id,
          null,
          {
            work_order_id: req.work_order_id,
            vendor_id: vendorId,
            document_id: doc.id,
            file_name: fileRow.file_name,
          }
        );
      }
    } catch (invoiceErr: any) {
      // Don't fail the entire upload if invoice creation fails
      console.error(
        '[finalizeUpload] Invoice auto-creation failed:',
        invoiceErr?.message
      );
    }
  }

  // 4. Update the upload file row
  await client
    .from('work_order_vendor_submission_files')
    .update({
      document_id: doc.id,
      status: 'stored',
      sha256: meta.sha256 ?? null,
      size_bytes: meta.sizeBytes ?? fileRow.size_bytes,
    })
    .eq('id', uploadFileId);

  await audit(
    req.org_id,
    'work_order_vendor_submission.file_uploaded',
    'work_order_vendor_submissions',
    submissionId,
    null,
    { document_id: doc.id, file_name: fileRow.file_name }
  );

  return { success: true };
}

// ─── 6) resolveVendorForSubmission ──────────────────────────────────────────

export async function resolveVendorForSubmission(
  orgId: string,
  submissionId: string,
  actorUserId: string
): Promise<{ success: boolean; vendorId: string }> {
  const client = supabase() as any;

  const { data: sub } = await client
    .from('work_order_vendor_submissions')
    .select('*')
    .eq('id', submissionId)
    .eq('org_id', orgId)
    .single();

  if (!sub) throw new Error('Submission not found.');
  if (sub.vendor_id) return { success: true, vendorId: sub.vendor_id };

  let matchedVendorId: string | null = null;
  let matchMethod: 'matched_existing' | 'created_new' = 'created_new';

  if (sub.tax_id) {
    const { data: tv } = await client
      .from('vendors')
      .select('id')
      .eq('org_id', orgId)
      .eq('tax_id', sub.tax_id)
      .maybeSingle();
    if (tv) matchedVendorId = tv.id;
  }
  if (!matchedVendorId && sub.vendor_code) {
    const { data: cv } = await client
      .from('vendors')
      .select('id')
      .eq('org_id', orgId)
      .eq('vendor_code', sub.vendor_code)
      .maybeSingle();
    if (cv) matchedVendorId = cv.id;
  }
  if (!matchedVendorId) {
    const { data: nv } = await client
      .from('vendors')
      .select('id')
      .eq('org_id', orgId)
      .ilike('vendor_name', sub.vendor_name)
      .maybeSingle();
    if (nv) matchedVendorId = nv.id;
  }

  if (matchedVendorId) {
    matchMethod = 'matched_existing';
  } else {
    // Create new
    const { data: newV } = await client
      .from('vendors')
      .insert({
        org_id: orgId,
        vendor_name: sub.vendor_name,
        vendor_code: sub.vendor_code ?? null,
        tax_id: sub.tax_id ?? null,
        email: sub.vendor_email ?? null,
        phone: sub.vendor_phone ?? null,
        status: 'active',
      })
      .select('id')
      .single();
    matchedVendorId = newV.id;
  }

  await client
    .from('work_order_vendor_submissions')
    .update({
      vendor_id: matchedVendorId,
      resolved_vendor_at: new Date().toISOString(),
      resolved_vendor_method: matchMethod,
      resolved_by: actorUserId,
    })
    .eq('id', submissionId);

  // Link documents to vendor
  const { data: files } = await client
    .from('work_order_vendor_submission_files')
    .select('document_id, doc_type')
    .eq('submission_id', submissionId)
    .eq('status', 'stored')
    .not('document_id', 'is', null);

  if (files && files.length > 0) {
    for (const f of files) {
      await client
        .from('vendor_documents')
        .insert({
          vendor_id: matchedVendorId,
          document_id: f.document_id,
          doc_type: f.doc_type,
        })
        .select()
        .maybeSingle(); // ignore unique conflicts if already linked somehow
    }
  }

  await audit(
    orgId,
    matchMethod === 'created_new'
      ? 'work_order_vendor_submission.vendor_created'
      : 'work_order_vendor_submission.vendor_matched',
    'work_order_vendor_submissions',
    submissionId,
    actorUserId,
    { vendor_id: matchedVendorId }
  );

  return { success: true, vendorId: matchedVendorId as string };
}

// ─── 7) listWorkOrderVendorSubmissions ──────────────────────────────────────

export interface SubmissionListDto {
  id: string;
  vendor_id: string | null;
  vendor_name: string;
  quoted_amount: number | null;
  currency: string;
  status: string;
  submitted_at: string;
  file_count: number;
}

export async function listWorkOrderVendorSubmissions(
  orgId: string,
  workOrderId: string
): Promise<SubmissionListDto[]> {
  const client = supabase() as any;

  const { data: subs, error } = await client
    .from('work_order_vendor_submissions')
    .select(
      'id, vendor_id, vendor_name, quoted_amount, currency, status, submitted_at, work_order_vendor_submission_files(count)'
    )
    .eq('org_id', orgId)
    .eq('work_order_id', workOrderId)
    .order('submitted_at', { ascending: false });

  if (error || !subs) return [];

  return subs.map((s: any) => ({
    id: s.id,
    vendor_id: s.vendor_id,
    vendor_name: s.vendor_name,
    quoted_amount: s.quoted_amount,
    currency: s.currency,
    status: s.status,
    submitted_at: s.submitted_at,
    file_count: s.work_order_vendor_submission_files
      ? s.work_order_vendor_submission_files[0].count
      : 0,
  }));
}
