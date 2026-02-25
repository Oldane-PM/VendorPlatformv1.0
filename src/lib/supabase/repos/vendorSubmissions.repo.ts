/**
 * Vendor Submissions – Supabase repository layer.
 *
 * Data-access for the `vendor_submissions` and `vendor_submission_files` tables.
 */

import { createServerClient } from '../server';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface VendorSubmission {
  id: string;
  work_order_id: string;
  vendor_id: string;
  vendor_name: string;
  submitted_at: string;
  total_amount: number;
  notes: string | null;
  status: string; // Submitted | Under Review | Awarded | Rejected
  quote_number: string | null;
  taxes: number | null;
  delivery_timeline: string | null;
  warranty: string | null;
  payment_terms: string | null;
  compliance_status: string | null;
  performance_rating: number | null;
  ai_summary: string | null;
}

export interface VendorSubmissionFile {
  id: string;
  submission_id: string;
  file_name: string;
  storage_path: string;
  mime_type: string;
  uploaded_at: string;
}

export interface SubmissionWithFiles extends VendorSubmission {
  files: VendorSubmissionFile[];
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function supabase() {
  return createServerClient();
}

// ─── Queries ────────────────────────────────────────────────────────────────

/**
 * List all vendor submissions for a given work order.
 */
export async function listSubmissionsByWorkOrder(
  workOrderId: string
): Promise<{ data: VendorSubmission[] | null; error: string | null }> {
  const { data, error } = await supabase()
    .from('vendor_submissions')
    .select('*')
    .eq('work_order_id', workOrderId)
    .order('submitted_at', { ascending: true });

  if (error) {
    return {
      data: null,
      error: error.message ?? 'Failed to fetch submissions.',
    };
  }

  return { data: data as VendorSubmission[], error: null };
}

/**
 * Fetch a single submission with its associated files.
 */
export async function getSubmissionWithFiles(
  submissionId: string
): Promise<{ data: SubmissionWithFiles | null; error: string | null }> {
  // Fetch the submission
  const { data: submission, error: subError } = await supabase()
    .from('vendor_submissions')
    .select('*')
    .eq('id', submissionId)
    .single();

  if (subError || !submission) {
    return {
      data: null,
      error: subError?.message ?? 'Submission not found.',
    };
  }

  // Fetch associated files
  const { data: files, error: filesError } = await supabase()
    .from('vendor_submission_files')
    .select('*')
    .eq('submission_id', submissionId)
    .order('uploaded_at', { ascending: true });

  if (filesError) {
    return {
      data: null,
      error: filesError.message ?? 'Failed to fetch submission files.',
    };
  }

  return {
    data: {
      ...(submission as VendorSubmission),
      files: (files as VendorSubmissionFile[]) ?? [],
    },
    error: null,
  };
}

// ─── Mutations ──────────────────────────────────────────────────────────────

/**
 * Mark a submission as "Awarded" and create a vendor engagement row.
 */
export async function awardSubmission({
  submissionId,
  workOrderId,
  engagementId,
}: {
  submissionId: string;
  workOrderId: string;
  engagementId: string | null;
}): Promise<{ data: any | null; error: string | null }> {
  const client = supabase();

  // 1. Fetch the submission to get vendor details
  const { data: submission, error: fetchError } = await client
    .from('vendor_submissions')
    .select('*')
    .eq('id', submissionId)
    .single();

  if (fetchError || !submission) {
    return {
      data: null,
      error: fetchError?.message ?? 'Submission not found.',
    };
  }

  // 2. Update submission status to "Awarded"
  const { error: updateError } = await client
    .from('vendor_submissions')
    .update({ status: 'Awarded' })
    .eq('id', submissionId);

  if (updateError) {
    return {
      data: null,
      error: updateError.message ?? 'Failed to update submission status.',
    };
  }

  // 3. Create vendor engagement record
  const { data: engagement, error: engError } = await client
    .from('vendor_engagements')
    .insert({
      vendor_id: submission.vendor_id,
      work_order_id: workOrderId,
      engagement_id: engagementId,
      awarded_submission_id: submissionId,
      title: submission.vendor_name,
      amount: submission.total_amount,
      status: 'Active',
    })
    .select()
    .single();

  if (engError) {
    return {
      data: null,
      error: engError.message ?? 'Failed to create vendor engagement.',
    };
  }

  // 4. Also update the work order status to "awarded"
  await client
    .from('work_orders')
    .update({ status: 'awarded' })
    .eq('id', workOrderId);

  return { data: engagement, error: null };
}

/**
 * Update the AI summary text for a submission.
 */
export async function updateAiSummary(
  submissionId: string,
  aiSummary: string
): Promise<{ data: VendorSubmission | null; error: string | null }> {
  const { data, error } = await supabase()
    .from('vendor_submissions')
    .update({ ai_summary: aiSummary })
    .eq('id', submissionId)
    .select()
    .single();

  if (error) {
    return {
      data: null,
      error: error.message ?? 'Failed to update AI summary.',
    };
  }

  return { data: data as VendorSubmission, error: null };
}
