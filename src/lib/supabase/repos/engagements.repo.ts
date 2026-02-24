/**
 * Engagements – Supabase repository layer.
 *
 * All data-access for the `engagements` table is centralised here.
 *
 * engagements table schema:
 *   org_id (uuid, NOT NULL)
 *   engagement_number (bigint, NOT NULL)
 *   title (text, NOT NULL)
 *   description (text, nullable)
 *   status (engagement_status enum, NOT NULL, default 'active')
 *   project_impact (text, NOT NULL, default 'Medium')
 *   start_date (date, nullable)
 *   end_date (date, nullable)
 *   created_by (uuid, nullable)
 *   created_at (timestamptz, NOT NULL, default now())
 */

import { createServerClient } from '../server';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface EngagementRow {
  id: string;
  org_id: string;
  engagement_number: number;
  title: string;
  description: string | null;
  status: string;
  project_impact: string;
  start_date: string | null;
  end_date: string | null;
  created_by: string | null;
  created_at: string;
}

export interface CreateEngagementInput {
  title: string;
  description?: string;
  project_impact?: string;
  status?: string;
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
    .order('engagement_number', { ascending: true });

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

/**
 * Insert a new engagement and return the created row.
 */
export async function createEngagement(
  input: CreateEngagementInput
): Promise<{ data: EngagementRow | null; error: string | null }> {
  const row = {
    org_id: '00000000-0000-0000-0000-000000000001',
    title: input.title,
    description: input.description ?? null,
    project_impact: input.project_impact ?? 'Medium',
    status: input.status ?? 'active',
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

/**
 * Update an existing engagement by ID.
 */
export async function updateEngagement(
  id: string,
  input: Partial<CreateEngagementInput>
): Promise<{ data: EngagementRow | null; error: string | null }> {
  const updates: Record<string, unknown> = {};
  if (input.title !== undefined) updates.title = input.title;
  if (input.description !== undefined) updates.description = input.description;
  if (input.project_impact !== undefined)
    updates.project_impact = input.project_impact;
  if (input.status !== undefined) updates.status = input.status;

  const { data, error } = await supabase()
    .from('engagements')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return {
      data: null,
      error: error.message ?? 'Failed to update engagement.',
    };
  }

  return { data: data as EngagementRow, error: null };
}
