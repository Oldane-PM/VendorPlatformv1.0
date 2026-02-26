/**
 * vendorWorkOrderPortalApiRepo — client-side repo for the public vendor upload portal.
 *
 * Calls Next.js API routes only. No Supabase imports.
 * All calls pass the token via `?t=` query parameter.
 */

// ─── Types ──────────────────────────────────────────────────────────────────

export interface PortalStatus {
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

export interface SignedUploadResult {
  signedUrl: string;
  uploadFileId: string;
  storagePath: string;
}

export interface FileMetaPayload {
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  docType: string;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function baseUrl(requestId: string, token: string) {
  return `/api/vendor-upload/work-order/${requestId}`;
}

function withToken(url: string, token: string) {
  return `${url}?t=${encodeURIComponent(token)}`;
}

async function apiFetch<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json', ...init?.headers },
    ...init,
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error ?? `API error ${res.status}`);
  return json as T;
}

// ─── Public API ─────────────────────────────────────────────────────────────

export async function getStatus(
  requestId: string,
  token: string
): Promise<PortalStatus> {
  const res = await apiFetch<{ data: PortalStatus }>(
    withToken(`${baseUrl(requestId, token)}/status`, token)
  );
  return res.data;
}

export async function createUploadUrl(
  requestId: string,
  token: string,
  fileMeta: FileMetaPayload
): Promise<SignedUploadResult> {
  const res = await apiFetch<{ data: SignedUploadResult }>(
    withToken(`${baseUrl(requestId, token)}/create-upload-url`, token),
    { method: 'POST', body: JSON.stringify(fileMeta) }
  );
  return res.data;
}

export async function finalize(
  requestId: string,
  token: string,
  uploadFileId: string,
  meta: { sha256?: string; sizeBytes?: number } = {}
): Promise<{ success: boolean }> {
  return apiFetch<{ success: boolean }>(
    withToken(`${baseUrl(requestId, token)}/finalize`, token),
    { method: 'POST', body: JSON.stringify({ uploadFileId, ...meta }) }
  );
}

export async function complete(
  requestId: string,
  token: string
): Promise<{ success: boolean }> {
  return apiFetch<{ success: boolean }>(
    withToken(`${baseUrl(requestId, token)}/complete`, token),
    { method: 'POST' }
  );
}
