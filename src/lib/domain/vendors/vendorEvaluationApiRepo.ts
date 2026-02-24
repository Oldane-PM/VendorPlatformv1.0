/**
 * vendorEvaluationApiRepo — Client-side API calls for vendor evaluations.
 *
 * No Supabase usage — talks only to Next.js API routes.
 */

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface VendorEvaluationDto {
  id: string;
  org_id: string;
  vendor_id: string;
  delivery_timeliness: number;
  quality_of_work: number;
  budget_adherence: number;
  communication_responsiveness: number;
  compliance_documentation: number;
  average_stars: number;
  final_score: number;
  grade: string;
  grading_mode: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface SaveEvaluationInput {
  delivery_timeliness: number;
  quality_of_work: number;
  budget_adherence: number;
  communication_responsiveness: number;
  compliance_documentation: number;
  grading_mode?: 'unweighted' | 'weighted';
  notes?: string;
}

/* ------------------------------------------------------------------ */
/*  API calls                                                          */
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

/**
 * Fetch the evaluation for a vendor. Returns null if none exists.
 */
export async function get(
  vendorId: string
): Promise<VendorEvaluationDto | null> {
  const data = await apiFetch<{ evaluation: VendorEvaluationDto | null }>(
    `/api/vendors/${vendorId}/evaluation`
  );
  return data.evaluation;
}

/**
 * Save (upsert) an evaluation for a vendor.
 */
export async function save(
  vendorId: string,
  input: SaveEvaluationInput
): Promise<VendorEvaluationDto> {
  const data = await apiFetch<{ evaluation: VendorEvaluationDto }>(
    `/api/vendors/${vendorId}/evaluation`,
    {
      method: 'PUT',
      body: JSON.stringify(input),
    }
  );
  return data.evaluation;
}
