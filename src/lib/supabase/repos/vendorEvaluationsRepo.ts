/**
 * vendorEvaluationsRepo — Supabase queries for vendor_evaluations table.
 *
 * This is the ONLY file that touches the DB for vendor evaluations.
 */
import { createServerClient } from '../server';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface VendorEvaluationRow {
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
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface UpsertEvaluationInput {
  delivery_timeliness: number;
  quality_of_work: number;
  budget_adherence: number;
  communication_responsiveness: number;
  compliance_documentation: number;
  grading_mode?: 'unweighted' | 'weighted';
  notes?: string;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

function computeScores(input: UpsertEvaluationInput) {
  const c1 = clamp(input.delivery_timeliness, 1, 5);
  const c2 = clamp(input.quality_of_work, 1, 5);
  const c3 = clamp(input.budget_adherence, 1, 5);
  const c4 = clamp(input.communication_responsiveness, 1, 5);
  const c5 = clamp(input.compliance_documentation, 1, 5);

  let average_stars: number;
  let final_score: number;

  if (input.grading_mode === 'weighted') {
    // Weighted: timeliness 0.25, quality 0.25, budget 0.20, comms 0.15, compliance 0.15
    average_stars = c1 * 0.25 + c2 * 0.25 + c3 * 0.2 + c4 * 0.15 + c5 * 0.15;
    final_score = average_stars * 2;
  } else {
    // Unweighted (default)
    average_stars = (c1 + c2 + c3 + c4 + c5) / 5;
    final_score = average_stars * 2;
  }

  // Clamp final score to 1–10
  final_score = clamp(final_score, 1, 10);

  // Round to 1 decimal
  average_stars = Math.round(average_stars * 10) / 10;
  final_score = Math.round(final_score * 10) / 10;

  // Grade
  let grade: string;
  if (final_score <= 3) {
    grade = 'Bad';
  } else if (final_score <= 7) {
    grade = 'Good';
  } else {
    grade = 'Excellent';
  }

  return { average_stars, final_score, grade };
}

/* ------------------------------------------------------------------ */
/*  Queries                                                            */
/* ------------------------------------------------------------------ */

/**
 * Fetch the evaluation for a specific vendor within an org.
 */
export async function getByVendor(
  orgId: string,
  vendorId: string
): Promise<VendorEvaluationRow | null> {
  const supabase = createServerClient();

  const { data, error } = await supabase
    .from('vendor_evaluations')
    .select('*')
    .eq('org_id', orgId)
    .eq('vendor_id', vendorId)
    .maybeSingle();

  if (error) {
    console.error('[vendorEvaluationsRepo.getByVendor]', error);
    throw new Error(error.message);
  }

  return data as VendorEvaluationRow | null;
}

/**
 * Get evaluation by vendor ID only (dev bypass — no org filter).
 */
export async function getByVendorDev(
  vendorId: string
): Promise<VendorEvaluationRow | null> {
  const supabase = createServerClient();

  const { data, error } = await supabase
    .from('vendor_evaluations')
    .select('*')
    .eq('vendor_id', vendorId)
    .maybeSingle();

  if (error) {
    console.error('[vendorEvaluationsRepo.getByVendorDev]', error);
    throw new Error(error.message);
  }

  return data as VendorEvaluationRow | null;
}

/**
 * Upsert an evaluation for a vendor. Validates star values and computes derived fields.
 */
export async function upsert(
  orgId: string,
  vendorId: string,
  userId: string | null,
  input: UpsertEvaluationInput
): Promise<VendorEvaluationRow> {
  const supabase = createServerClient();

  // Validate star values
  const stars = [
    input.delivery_timeliness,
    input.quality_of_work,
    input.budget_adherence,
    input.communication_responsiveness,
    input.compliance_documentation,
  ];

  for (const s of stars) {
    if (!Number.isInteger(s) || s < 1 || s > 5) {
      throw new Error(
        `Star ratings must be integers between 1 and 5. Got: ${s}`
      );
    }
  }

  const { average_stars, final_score, grade } = computeScores(input);

  const { data, error } = await supabase
    .from('vendor_evaluations')
    .upsert(
      {
        org_id: orgId,
        vendor_id: vendorId,
        delivery_timeliness: input.delivery_timeliness,
        quality_of_work: input.quality_of_work,
        budget_adherence: input.budget_adherence,
        communication_responsiveness: input.communication_responsiveness,
        compliance_documentation: input.compliance_documentation,
        average_stars,
        final_score,
        grade,
        grading_mode: input.grading_mode ?? 'unweighted',
        notes: input.notes ?? null,
        updated_by: userId,
      },
      { onConflict: 'org_id,vendor_id' }
    )
    .select('*')
    .single();

  if (error) {
    console.error('[vendorEvaluationsRepo.upsert]', error);
    throw new Error(error.message);
  }

  return data as VendorEvaluationRow;
}
