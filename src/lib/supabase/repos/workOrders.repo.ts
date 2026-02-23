/**
 * Work Orders – Supabase repository layer.
 *
 * All data-access for the `work_orders` table is centralised here.
 * The Supabase client is imported from the shared server client helper.
 */

import { createServerClient } from '../server';
import type { WorkOrder } from '../../domain/workOrders';

// ─── Helpers ────────────────────────────────────────────────────────────────

function supabase() {
  return createServerClient();
}

// ─── Queries ────────────────────────────────────────────────────────────────

/**
 * Fetch every work order, newest first.
 */
export async function getWorkOrders(): Promise<{
  data: WorkOrder[] | null;
  error: string | null;
}> {
  const client = supabase() as any;
  const { data, error } = await client
    .from('work_orders')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    return {
      data: null,
      error: error.message ?? 'Failed to fetch work orders.',
    };
  }

  return { data: data as WorkOrder[], error: null };
}

/**
 * Fetch a single work order by its UUID.
 */
export async function getWorkOrderById(
  id: string
): Promise<{ data: WorkOrder | null; error: string | null }> {
  const client = supabase() as any;
  const { data, error } = await client
    .from('work_orders')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    return { data: null, error: error.message ?? 'Work order not found.' };
  }

  return { data: data as WorkOrder, error: null };
}

// ─── Mutations ──────────────────────────────────────────────────────────────

export interface CreateWorkOrderRow {
  work_order_number: string;
  engagement_id: string;
  title: string;
  description: string;
  status: string;
  created_by: string;
}

/**
 * Insert a new work order row and return the created record.
 */
export async function createWorkOrder(
  row: CreateWorkOrderRow
): Promise<{ data: WorkOrder | null; error: string | null }> {
  const client = supabase() as any;
  const { data, error } = await client
    .from('work_orders')
    .insert([row])
    .select()
    .single();

  if (error) {
    return {
      data: null,
      error: error.message ?? 'Failed to create work order.',
    };
  }

  return { data: data as WorkOrder, error: null };
}

/**
 * Return the total number of work orders (used for generating the next WO number).
 */
export async function getWorkOrderCount(): Promise<{
  count: number;
  error: string | null;
}> {
  const client = supabase() as any;
  const { count, error } = await client
    .from('work_orders')
    .select('id', { count: 'exact', head: true });

  if (error) {
    return { count: 0, error: error.message ?? 'Failed to count work orders.' };
  }

  return { count: count ?? 0, error: null };
}
