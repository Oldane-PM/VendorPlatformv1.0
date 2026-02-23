/**
 * vendorsApiRepo — frontend data-access layer for vendors.
 *
 * Calls Next.js API routes only. No Supabase imports.
 */

export interface VendorDto {
  id: string;
  org_id: string;
  vendor_name: string;
  vendor_code: string | null;
  tax_id: string | null;
  status: string;
  created_at: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  category: string | null;
  rating: number;
  risk_score: number;
  total_engagements: number;
  total_spent: number;
  contact_person: string | null;
  joined_date: string | null;
  last_engagement_date: string | null;
  notes: string | null;
}

export interface CreateVendorPayload {
  vendor_name: string;
  vendor_code?: string;
  tax_id?: string;
  status?: string;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

async function apiFetch<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json', ...init?.headers },
    ...init,
  });

  const json = await res.json();

  if (!res.ok) {
    throw new Error(json.error ?? `API error ${res.status}`);
  }

  return json as T;
}

/* ------------------------------------------------------------------ */
/*  Public API                                                         */
/* ------------------------------------------------------------------ */

/**
 * Fetch the list of vendors, with optional search and status filter.
 */
export async function list(params?: {
  search?: string;
  status?: string;
}): Promise<VendorDto[]> {
  const qs = new URLSearchParams();
  if (params?.search) qs.set('search', params.search);
  if (params?.status && params.status !== 'all')
    qs.set('status', params.status);

  const qsStr = qs.toString();
  const url = `/api/vendors${qsStr ? `?${qsStr}` : ''}`;

  const data = await apiFetch<{ vendors: VendorDto[] }>(url);
  return data.vendors;
}

/**
 * Create a new vendor and return the created row.
 */
export async function create(payload: CreateVendorPayload): Promise<VendorDto> {
  const data = await apiFetch<{ vendor: VendorDto }>('/api/vendors', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return data.vendor;
}

/**
 * Fetch a single vendor by ID.
 */
export async function getById(id: string): Promise<VendorDto | null> {
  try {
    const data = await apiFetch<{ vendor: VendorDto }>(`/api/vendors/${id}`);
    return data.vendor;
  } catch (err: unknown) {
    // 404 means vendor doesn't exist — return null instead of throwing
    if (err instanceof Error && err.message.includes('404')) return null;
    throw err;
  }
}
