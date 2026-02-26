/**
 * workOrderUploadApiRepo — client-side repo for internal upload request management.
 *
 * Calls Next.js API routes only. No Supabase imports.
 */

// ─── Types ──────────────────────────────────────────────────────────────────

export interface CreateUploadRequestPayload {
  vendorId: string;
  requestEmail: string;
  allowedDocTypes?: string[];
  expiresInHours?: number;
  maxFiles?: number;
  maxTotalBytes?: number;
  message?: string;
}

export interface CreateUploadRequestResult {
  requestId: string;
  portalUrl: string;
  expiresAt: string;
}

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

// ─── Helpers ────────────────────────────────────────────────────────────────

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

export async function createRequest(
  workOrderId: string,
  payload: CreateUploadRequestPayload
): Promise<CreateUploadRequestResult> {
  return apiFetch<CreateUploadRequestResult>(
    `/api/work-orders/${workOrderId}/upload-requests`,
    { method: 'POST', body: JSON.stringify(payload) }
  );
}

export async function listRequests(
  workOrderId: string
): Promise<UploadRequestSummary[]> {
  const res = await apiFetch<{ data: UploadRequestSummary[] }>(
    `/api/work-orders/${workOrderId}/upload-requests`
  );
  return res.data;
}

export async function revokeRequest(
  requestId: string
): Promise<{ success: boolean }> {
  return apiFetch<{ success: boolean }>(
    `/api/upload-requests/work-order/${requestId}/revoke`,
    { method: 'POST' }
  );
}
