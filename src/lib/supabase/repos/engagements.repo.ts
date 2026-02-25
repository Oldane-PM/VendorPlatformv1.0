/**
 * Engagements – Supabase repository layer.
 *
 * All data-access for the `engagements` table and its sub-tables
 * (rfqs, documents, approval_steps, invoices, activity_log) is
 * centralised here.
 */

import { createServerClient } from '../server';

// ─── Row Types ──────────────────────────────────────────────────────────────

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
  // extended columns
  vendor_id: string | null;
  vendor_name: string | null;
  department: string | null;
  total_value: number;
  assigned_approver: string | null;
}

export interface RfqLineItemRow {
  id: string;
  rfq_id: string;
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
}

export interface RfqRow {
  id: string;
  engagement_id: string;
  vendor_id: string | null;
  vendor_name: string;
  subtotal: number;
  taxes: number;
  total: number;
  ai_risk_flag: string | null;
  decision: string;
  submitted_date: string | null;
  created_at: string;
  line_items: RfqLineItemRow[];
}

export interface DocumentRow {
  id: string;
  engagement_id: string;
  name: string;
  type: string | null;
  size: number;
  uploaded_date: string | null;
  uploaded_by: string | null;
  ai_summary: string | null;
  missing_fields: string[] | null;
  risk_flags: string[] | null;
  created_at: string;
}

export interface ApprovalStepRow {
  id: string;
  engagement_id: string;
  approver_name: string;
  approver_role: string;
  status: string;
  timestamp: string | null;
  comments: string | null;
  escalated: boolean;
  sort_order: number;
  created_at: string;
}

export interface InvoiceRow {
  id: string;
  engagement_id: string;
  invoice_number: string;
  vendor_name: string;
  amount: number;
  due_date: string | null;
  status: string;
  submitted_date: string | null;
  approved_date: string | null;
  paid_date: string | null;
  aging_days: number;
  created_at: string;
}

export interface ActivityLogRow {
  id: string;
  engagement_id: string;
  timestamp: string;
  user_name: string;
  action: string;
  details: string | null;
  status_change: string | null;
  created_at: string;
}

export interface MilestoneRow {
  id: string;
  rfq_id: string;
  activity: string;
  due_date: string;
  amount: number;
  status: string;
  created_at: string;
}

export interface VendorEngagementRow {
  vendor_engagement_id: string; // rfq.id
  engagement_id: string; // parent engagement.id
  work_order_id: string; // mapping to rfq.id for UI compat or keeping as string
  vendor_name: string;
  project_title: string;
  award_amount: number; // rfq.total
  status: string; // derived or parent status
  start_date: string | null;
  end_date: string | null;
  department: string | null;
  awarded_by: string | null;
  decision_reason: string | null;
  milestones: MilestoneRow[];
  invoices: InvoiceRow[];
}

/** Full engagement detail including all sub-table data. */
export interface EngagementDetailRow extends EngagementRow {
  rfqs: RfqRow[];
  documents: DocumentRow[];
  approval_steps: ApprovalStepRow[];
  invoices: InvoiceRow[];
  activity_log: ActivityLogRow[];
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
 * Fetch all engagements, ordered by engagement_number ascending.
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
 * Fetch a single engagement by UUID with all related sub-table data.
 */
export async function getEngagementById(
  id: string
): Promise<{ data: EngagementDetailRow | null; error: string | null }> {
  const sb = supabase();

  // Fetch the engagement + all sub-tables in parallel
  const [engRes, rfqRes, docRes, approvalRes, invoiceRes, logRes] =
    await Promise.all([
      sb.from('engagements').select('*').eq('id', id).single(),
      sb
        .from('engagement_rfqs')
        .select('*')
        .eq('engagement_id', id)
        .order('created_at'),
      sb
        .from('engagement_documents')
        .select('*')
        .eq('engagement_id', id)
        .order('created_at'),
      sb
        .from('engagement_approval_steps')
        .select('*')
        .eq('engagement_id', id)
        .order('sort_order'),
      sb
        .from('engagement_invoices')
        .select('*')
        .eq('engagement_id', id)
        .order('created_at'),
      sb
        .from('engagement_activity_log')
        .select('*')
        .eq('engagement_id', id)
        .order('timestamp'),
    ]);

  if (engRes.error) {
    console.error('[engagements.repo] getEngagementById error:', engRes.error);
    return {
      data: null,
      error: engRes.error.message ?? 'Engagement not found.',
    };
  }

  const engagement = engRes.data as EngagementRow;

  // Fetch line items for each RFQ
  const rfqs: RfqRow[] = [];
  if (rfqRes.data && rfqRes.data.length > 0) {
    const rfqIds = rfqRes.data.map((r: any) => r.id);
    const { data: lineItems } = await sb
      .from('engagement_rfq_line_items')
      .select('*')
      .in('rfq_id', rfqIds);

    const lineItemsByRfq = new Map<string, RfqLineItemRow[]>();
    for (const li of (lineItems ?? []) as RfqLineItemRow[]) {
      const existing = lineItemsByRfq.get(li.rfq_id) ?? [];
      existing.push(li);
      lineItemsByRfq.set(li.rfq_id, existing);
    }

    for (const r of rfqRes.data) {
      rfqs.push({
        ...(r as Omit<RfqRow, 'line_items'>),
        line_items: lineItemsByRfq.get(r.id) ?? [],
      });
    }
  }

  const detail: EngagementDetailRow = {
    ...engagement,
    rfqs,
    documents: (docRes.data ?? []) as DocumentRow[],
    approval_steps: (approvalRes.data ?? []) as ApprovalStepRow[],
    invoices: (invoiceRes.data ?? []) as InvoiceRow[],
    activity_log: (logRes.data ?? []) as ActivityLogRow[],
  };

  return { data: detail, error: null };
}

/**
 * Fetch all Vendor Engagements (awarded RFQs) and their related data.
 */
export async function listVendorEngagements(): Promise<{
  data: VendorEngagementRow[] | null;
  error: string | null;
}> {
  const sb = supabase();

  // 1. Fetch all awarded RFQs (these represent Vendor Engagements)
  const { data: awardedRfqs, error: rfqError } = await sb
    .from('engagement_rfqs')
    .select('*')
    .eq('decision', 'selected')
    .order('created_at', { ascending: false });

  if (rfqError) {
    console.error(
      '[engagements.repo] listVendorEngagements RFQ error:',
      rfqError
    );
    return {
      data: null,
      error: rfqError.message ?? 'Failed to fetch awarded RFQs.',
    };
  }

  if (!awardedRfqs || awardedRfqs.length === 0) {
    return { data: [], error: null };
  }

  const engagementIds = [
    ...new Set(awardedRfqs.map((r: any) => r.engagement_id)),
  ];
  const rfqIds = awardedRfqs.map((r: any) => r.id);

  // 2. Fetch parent engagements, milestones, and invoices
  const [engRes, milestoneRes, invoiceRes] = await Promise.all([
    sb.from('engagements').select('*').in('id', engagementIds),
    sb
      .from('vendor_engagement_milestones')
      .select('*')
      .in('rfq_id', rfqIds)
      .order('due_date'),
    sb
      .from('engagement_invoices')
      .select('*')
      .in('engagement_id', engagementIds)
      .order('created_at'),
  ]);

  if (engRes.error || milestoneRes.error || invoiceRes.error) {
    console.error(
      '[engagements.repo] Failed to fetch related data:',
      engRes.error || milestoneRes.error || invoiceRes.error
    );
    return { data: null, error: 'Failed to fetch vendor engagement details.' };
  }

  const engagementsMap = new Map(
    (engRes.data ?? []).map((e: any) => [e.id, e])
  );

  const milestonesByRfq = new Map<string, MilestoneRow[]>();
  for (const m of (milestoneRes.data ?? []) as MilestoneRow[]) {
    const existing = milestonesByRfq.get(m.rfq_id) ?? [];
    existing.push(m);
    milestonesByRfq.set(m.rfq_id, existing);
  }

  const invoicesByEng = new Map<string, InvoiceRow[]>();
  for (const inv of (invoiceRes.data ?? []) as InvoiceRow[]) {
    const existing = invoicesByEng.get(inv.engagement_id) ?? [];
    existing.push(inv);
    invoicesByEng.set(inv.engagement_id, existing);
  }

  // 3. Construct VendorEngagementRow array
  const results: VendorEngagementRow[] = awardedRfqs.map((rfq: any) => {
    const parentEng = engagementsMap.get(rfq.engagement_id);

    // Fallbacks if parent engagement is missing (shouldn't happen with FK)
    const title = parentEng?.title ?? 'Unknown Project';
    const dept = parentEng?.department ?? null;
    const awBy = parentEng?.assigned_approver ?? null;
    const sDate = parentEng?.start_date ?? null;
    const eDate = parentEng?.end_date ?? null;
    const st = parentEng?.status ?? 'active';

    return {
      vendor_engagement_id: rfq.id,
      engagement_id: rfq.engagement_id,
      work_order_id: rfq.id, // currently using rfq.id as the work order identifier
      vendor_name: rfq.vendor_name,
      project_title: title,
      award_amount: rfq.total,
      status: st,
      start_date: sDate,
      end_date: eDate,
      department: dept,
      awarded_by: awBy,
      decision_reason: 'Awarded via platform', // Could be added to schema later
      milestones: milestonesByRfq.get(rfq.id) ?? [],
      invoices: invoicesByEng.get(rfq.engagement_id) ?? [],
    };
  });

  return { data: results, error: null };
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
