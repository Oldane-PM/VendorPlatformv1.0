/**
 * Vendor Engagements – Supabase repository layer.
 *
 * Data-access for the `vendor_engagements` table.
 */

import { createServerClient } from '../server';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface VendorEngagement {
  id: string;
  vendor_id: string;
  work_order_id: string;
  engagement_id: string | null;
  awarded_submission_id: string;
  title: string;
  amount: number;
  status: string;
  created_at: string;
}

export interface CreateVendorEngagementPayload {
  vendor_id: string;
  work_order_id: string;
  engagement_id: string | null;
  awarded_submission_id: string;
  title: string;
  amount: number;
  status: string;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function supabase() {
  return createServerClient();
}

// ─── Queries ────────────────────────────────────────────────────────────────

/**
 * Get the vendor engagement record linked to a given work order.
 */
export async function getVendorEngagementByWorkOrder(
  workOrderId: string
): Promise<{ data: VendorEngagement | null; error: string | null }> {
  const { data, error } = await supabase()
    .from('vendor_engagements')
    .select('*')
    .eq('work_order_id', workOrderId)
    .maybeSingle();

  if (error) {
    return {
      data: null,
      error: error.message ?? 'Failed to fetch vendor engagement.',
    };
  }

  return { data: data as VendorEngagement | null, error: null };
}

// ─── Mutations ──────────────────────────────────────────────────────────────

/**
 * Create a new vendor engagement record.
 */
export async function createVendorEngagement(
  payload: CreateVendorEngagementPayload
): Promise<{ data: VendorEngagement | null; error: string | null }> {
  const { data, error } = await supabase()
    .from('vendor_engagements')
    .insert(payload)
    .select()
    .single();

  if (error) {
    return {
      data: null,
      error: error.message ?? 'Failed to create vendor engagement.',
    };
  }

  return { data: data as VendorEngagement, error: null };
}
