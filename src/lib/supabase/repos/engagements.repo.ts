/**
 * Engagements – Supabase repository layer.
 *
 * All data-access for the `engagements` table is centralised here.
 */

import { createServerClient } from '../server';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface EngagementRow {
  id: string;
  title: string;
  description: string | null;
  status: string;
  department: string | null;
  budget: number | null;
  created_at: string;
  created_by: string;
}

export interface CreateEngagementInput {
  title: string;
  description?: string;
  status?: string;
  department?: string;
  budget?: number;
  created_by?: string;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function supabase() {
  return createServerClient();
}

// ─── Queries ────────────────────────────────────────────────────────────────

/**
 * Fetch all engagements, newest first.
 */
export async function listEngagements(): Promise<{
  data: EngagementRow[] | null;
  error: string | null;
}> {
  const { data, error } = await supabase()
    .from('engagements')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    return {
      data: null,
      error: error.message ?? 'Failed to fetch engagements.',
    };
  }

  return { data: data as EngagementRow[], error: null };
}

/**
 * Fetch a single engagement by UUID.
 */
export async function getEngagementById(
  id: string
): Promise<{ data: EngagementRow | null; error: string | null }> {
  const { data, error } = await supabase()
    .from('engagements')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    return { data: null, error: error.message ?? 'Engagement not found.' };
  }

  return { data: data as EngagementRow, error: null };
}

// ─── Mutations ──────────────────────────────────────────────────────────────

/**
 * Insert a new engagement and return the created row.
 */
export async function createEngagement(
  input: CreateEngagementInput
): Promise<{ data: EngagementRow | null; error: string | null }> {
  const row = {
    title: input.title,
    description: input.description ?? null,
    status: input.status ?? 'Draft',
    department: input.department ?? null,
    budget: input.budget ?? null,
    created_by: input.created_by ?? '00000000-0000-0000-0000-000000000000',
  };

  const { data, error } = await supabase()
    .from('engagements')
    .insert([row])
    .select()
    .single();

  if (error) {
    return {
      data: null,
      error: error.message ?? 'Failed to create engagement.',
    };
  }

  return { data: data as EngagementRow, error: null };
}
