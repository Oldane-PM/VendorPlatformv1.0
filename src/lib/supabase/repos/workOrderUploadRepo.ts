/**
 * workOrderUploadRepo — server-side repository for work-order upload requests.
 *
 * Handles token generation/validation, signed upload URLs, file finalization,
 * and audit-event logging. Uses the service-role Supabase client only.
 */

import crypto from 'crypto';
import { createServerClient } from '../server';

// ─── Constants ──────────────────────────────────────────────────────────────

const BUCKET = 'vendor-uploads';
const SIGNED_URL_TTL_SECONDS = 600; // 10 minutes
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
  vendor_id: string;
  request_email: string;
  allowed_doc_types: string[];
  expires_at: string;
  status: string;
  max_files: number;
  max_total_bytes: number;
  message: string | null;
  created_at: string;
}

/**
 * Validate a request ID + raw token. Returns the request row if valid,
 * or throws an Error with a user-safe message.
 */
export async function validateToken(
  requestId: string,
  rawToken: string
): Promise<ValidatedRequest> {
  const client = supabase() as any;
  const hash = hashToken(rawToken);

  const { data, error } = await client
    .from('work_order_upload_requests')
    .select('*')
    .eq('id', requestId)
    .eq('token_hash', hash)
    .single();

  if (error || !data) {
    throw new Error('Invalid or expired upload link.');
  }

  // Check revoked
  if (data.status === 'revoked') {
    throw new Error('This upload link has been revoked.');
  }

  // Check expiry
  if (new Date(data.expires_at) <= new Date()) {
    // Auto-transition to expired status
    await client
      .from('work_order_upload_requests')
      .update({ status: 'expired' })
      .eq('id', requestId);
    throw new Error('This upload link has expired.');
  }

  return data as ValidatedRequest;
}

// ─── createRequest ──────────────────────────────────────────────────────────

export interface CreateRequestPayload {
  workOrderId: string;
  vendorId: string;
  requestEmail: string;
  allowedDocTypes?: string[];
  expiresInHours?: number;
  maxFiles?: number;
  maxTotalBytes?: number;
  message?: string;
}

export interface CreateRequestResult {
  requestId: string;
  expiresAt: string;
  portalUrl: string;
  rawToken: string;
}

export async function createRequest(
  orgId: string,
  createdBy: string,
  payload: CreateRequestPayload
): Promise<CreateRequestResult> {
  const client = supabase() as any;

  const rawToken = generateToken();
  const tokenHash = hashToken(rawToken);
  const expiresAt = new Date(
    Date.now() + (payload.expiresInHours ?? 72) * 60 * 60 * 1000
  ).toISOString();

  const row = {
    org_id: orgId,
    work_order_id: payload.workOrderId,
    vendor_id: payload.vendorId,
    request_email: payload.requestEmail,
    allowed_doc_types: payload.allowedDocTypes ?? [
      'invoice',
      'quote',
      'supporting',
    ],
    token_hash: tokenHash,
    expires_at: expiresAt,
    max_files: payload.maxFiles ?? 10,
    max_total_bytes: payload.maxTotalBytes ?? 52428800,
    message: payload.message ?? null,
    created_by:
      createdBy === '00000000-0000-0000-0000-000000000000' ? null : createdBy,
  };

  const { data, error } = await client
    .from('work_order_upload_requests')
    .insert(row)
    .select('id, expires_at')
    .single();

  if (error || !data) {
    console.error('[createRequest] Insert error:', error?.message);
    throw new Error('Failed to create upload request.');
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
  const portalUrl = `${appUrl}/vendor-upload/work-order/${data.id}?t=${rawToken}`;

  // Audit
  await audit(
    orgId,
    'work_order_upload_request.created',
    'work_order_upload_request',
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

// ─── getPortalStatus ────────────────────────────────────────────────────────

export interface PortalStatusDto {
  requestId: string;
  vendorName: string | null;
  workOrderTitle: string | null;
  workOrderNumber: string | null;
  allowedDocTypes: string[];
  expiresAt: string;
  maxFiles: number;
  maxTotalBytes: number;
  message: string | null;
  uploadedFiles: Array<{
    id: string;
    file_name: string;
    doc_type: string;
    status: string;
    size_bytes: number | null;
    uploaded_at: string;
  }>;
}

export async function getPortalStatus(
  requestId: string,
  rawToken: string,
  ip?: string
): Promise<PortalStatusDto> {
  const req = await validateToken(requestId, rawToken);
  const client = supabase() as any;

  // Fetch vendor name
  const { data: vendor } = await client
    .from('vendors')
    .select('vendor_name')
    .eq('id', req.vendor_id)
    .single();

  // Fetch work order info
  const { data: wo } = await client
    .from('work_orders')
    .select('title, work_order_number')
    .eq('id', req.work_order_id)
    .single();

  // Fetch uploaded files for this request
  const { data: files } = await client
    .from('work_order_upload_files')
    .select('id, file_name, doc_type, status, size_bytes, uploaded_at')
    .eq('upload_request_id', requestId)
    .order('uploaded_at', { ascending: true });

  // Audit – opened
  await audit(
    req.org_id,
    'work_order_upload_request.opened',
    'work_order_upload_request',
    requestId,
    null,
    {},
    ip
  );

  return {
    requestId,
    vendorName: vendor?.vendor_name ?? null,
    workOrderTitle: wo?.title ?? null,
    workOrderNumber: wo?.work_order_number
      ? `WO-${String(wo.work_order_number).padStart(4, '0')}`
      : null,
    allowedDocTypes: req.allowed_doc_types,
    expiresAt: req.expires_at,
    maxFiles: req.max_files,
    maxTotalBytes: req.max_total_bytes,
    message: req.message,
    uploadedFiles: files ?? [],
  };
}

// ─── createSignedUploadUrl ──────────────────────────────────────────────────

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
  fileMeta: FileMetaInput,
  ip?: string
): Promise<SignedUploadResult> {
  const req = await validateToken(requestId, rawToken);
  const client = supabase() as any;

  // Validate doc type
  if (!req.allowed_doc_types.includes(fileMeta.docType)) {
    throw new Error(`Document type "${fileMeta.docType}" is not allowed.`);
  }

  // Validate MIME
  if (!ALLOWED_MIME_TYPES.includes(fileMeta.mimeType)) {
    throw new Error(`File type "${fileMeta.mimeType}" is not allowed.`);
  }

  // Validate per-file size
  if (fileMeta.sizeBytes > MAX_FILE_SIZE) {
    throw new Error(
      `File exceeds maximum size of ${MAX_FILE_SIZE / 1024 / 1024} MB.`
    );
  }

  // Check request-level limits
  const { data: existingFiles } = await client
    .from('work_order_upload_files')
    .select('id, size_bytes, status')
    .eq('upload_request_id', requestId)
    .in('status', ['queued', 'uploading', 'stored']);

  const currentCount = existingFiles?.length ?? 0;
  const currentBytes = (existingFiles ?? []).reduce(
    (sum: number, f: any) => sum + (f.size_bytes ?? 0),
    0
  );

  if (currentCount >= req.max_files) {
    throw new Error(`Maximum number of files (${req.max_files}) reached.`);
  }

  if (currentBytes + fileMeta.sizeBytes > req.max_total_bytes) {
    throw new Error('Total upload size limit exceeded.');
  }

  // Build storage path
  const fileId = crypto.randomUUID();
  const safeName = sanitizeFileName(fileMeta.fileName);
  const storagePath = `org/${req.org_id}/work_orders/${req.work_order_id}/vendors/${req.vendor_id}/upload_requests/${requestId}/${fileId}-${safeName}`;

  // Insert tracking row
  const { data: fileRow, error: insertErr } = await client
    .from('work_order_upload_files')
    .insert({
      org_id: req.org_id,
      upload_request_id: requestId,
      work_order_id: req.work_order_id,
      vendor_id: req.vendor_id,
      doc_type: fileMeta.docType,
      file_name: fileMeta.fileName,
      mime_type: fileMeta.mimeType,
      size_bytes: fileMeta.sizeBytes,
      storage_bucket: BUCKET,
      storage_path: storagePath,
      status: 'queued',
      uploader_ip: ip ?? null,
    })
    .select('id')
    .single();

  if (insertErr || !fileRow) {
    console.error('[createSignedUploadUrl] Insert error:', insertErr?.message);
    throw new Error('Failed to prepare upload.');
  }

  // Generate signed upload URL
  const { data: signedData, error: signErr } = await client.storage
    .from(BUCKET)
    .createSignedUploadUrl(storagePath);

  if (signErr || !signedData?.signedUrl) {
    console.error('[createSignedUploadUrl] Storage error:', signErr?.message);
    // Mark as failed
    await client
      .from('work_order_upload_files')
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

// ─── finalizeUpload ─────────────────────────────────────────────────────────

export interface FinalizeInput {
  sha256?: string;
  sizeBytes?: number;
}

export async function finalizeUpload(
  requestId: string,
  rawToken: string,
  uploadFileId: string,
  meta: FinalizeInput = {}
): Promise<{ success: boolean }> {
  const req = await validateToken(requestId, rawToken);
  const client = supabase() as any;

  // Fetch the upload file row
  const { data: fileRow, error: fetchErr } = await client
    .from('work_order_upload_files')
    .select('*')
    .eq('id', uploadFileId)
    .eq('upload_request_id', requestId)
    .single();

  if (fetchErr || !fileRow) {
    throw new Error('Upload file record not found.');
  }

  // 1. Create documents row
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
    console.error('[finalizeUpload] documents insert error:', docErr?.message);
    throw new Error('Failed to create document record.');
  }

  // 2. Insert into work_order_documents
  await client.from('work_order_documents').insert({
    work_order_id: req.work_order_id,
    document_id: doc.id,
    doc_type: fileRow.doc_type,
  });

  // 3. Insert into vendor_documents
  await client.from('vendor_documents').insert({
    vendor_id: req.vendor_id,
    document_id: doc.id,
    doc_type: fileRow.doc_type,
  });

  // 4. Update the upload file row
  await client
    .from('work_order_upload_files')
    .update({
      document_id: doc.id,
      status: 'stored',
      sha256: meta.sha256 ?? null,
      size_bytes: meta.sizeBytes ?? fileRow.size_bytes,
    })
    .eq('id', uploadFileId);

  // 5. Update request status to partially_uploaded
  if (req.status === 'pending') {
    await client
      .from('work_order_upload_requests')
      .update({ status: 'partially_uploaded' })
      .eq('id', requestId);
  }

  // 6. Audit
  await audit(
    req.org_id,
    'work_order_upload_file.uploaded',
    'work_order_upload_file',
    uploadFileId,
    null,
    { document_id: doc.id, file_name: fileRow.file_name }
  );

  return { success: true };
}

// ─── markCompleted ──────────────────────────────────────────────────────────

export async function markCompleted(
  requestId: string,
  rawToken: string
): Promise<{ success: boolean }> {
  const req = await validateToken(requestId, rawToken);
  const client = supabase() as any;

  // Must have at least 1 stored file
  const { count } = await client
    .from('work_order_upload_files')
    .select('id', { count: 'exact', head: true })
    .eq('upload_request_id', requestId)
    .eq('status', 'stored');

  if (!count || count === 0) {
    throw new Error('Cannot mark as complete — no files have been uploaded.');
  }

  await client
    .from('work_order_upload_requests')
    .update({ status: 'completed' })
    .eq('id', requestId);

  await audit(
    req.org_id,
    'work_order_upload_request.completed',
    'work_order_upload_request',
    requestId,
    null
  );

  return { success: true };
}

// ─── revokeRequest ──────────────────────────────────────────────────────────

export async function revokeRequest(
  orgId: string,
  requestId: string,
  revokedBy: string
): Promise<{ success: boolean }> {
  const client = supabase() as any;

  const { error } = await client
    .from('work_order_upload_requests')
    .update({
      status: 'revoked',
      revoked_at: new Date().toISOString(),
      revoked_by:
        revokedBy === '00000000-0000-0000-0000-000000000000' ? null : revokedBy,
    })
    .eq('id', requestId)
    .eq('org_id', orgId);

  if (error) {
    console.error('[revokeRequest] error:', error.message);
    throw new Error('Failed to revoke upload request.');
  }

  await audit(
    orgId,
    'work_order_upload_request.revoked',
    'work_order_upload_request',
    requestId,
    revokedBy
  );

  return { success: true };
}

// ─── listRequestsByWorkOrder ────────────────────────────────────────────────

export interface UploadRequestSummary {
  id: string;
  vendor_id: string;
  request_email: string;
  status: string;
  expires_at: string;
  max_files: number;
  created_at: string;
  file_count: number;
}

export async function listRequestsByWorkOrder(
  orgId: string,
  workOrderId: string
): Promise<UploadRequestSummary[]> {
  const client = supabase() as any;

  const { data: requests, error } = await client
    .from('work_order_upload_requests')
    .select(
      'id, vendor_id, request_email, status, expires_at, max_files, created_at'
    )
    .eq('org_id', orgId)
    .eq('work_order_id', workOrderId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[listRequestsByWorkOrder] error:', error.message);
    return [];
  }

  // Enrich with file counts
  const results: UploadRequestSummary[] = [];
  for (const req of requests ?? []) {
    const { count } = await client
      .from('work_order_upload_files')
      .select('id', { count: 'exact', head: true })
      .eq('upload_request_id', req.id)
      .eq('status', 'stored');

    results.push({ ...req, file_count: count ?? 0 });
  }

  return results;
}
