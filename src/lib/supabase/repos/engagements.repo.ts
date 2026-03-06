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
  engagement_uuid: string | null; // raw engagement UUID
  work_order_id: string; // mapping to rfq.id for UI compat or keeping as string
  work_order_uuid: string | null; // raw work order UUID
  vendor_id: string | null;
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
  submissions?: any[];
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
 * Fetch a vendor engagement, including its related work order vendor submissions
 * and vendor submission files.
 */
export async function getVendorEngagementById(id: string): Promise<{
  data: any | null; // using any here for brevity instead of creating entirely new types for the UI format expected, it'll mirror the previous one layout slightly
  error: string | null;
}> {
  const sb = supabase();

  // The UI currently expects a very specific structure
  // 1. Get the vendor engagement record
  const { data: ve, error: veError } = await sb
    .from('vendor_engagements')
    .select('*')
    .eq('id', id)
    .single();

  if (veError) {
    console.error('[engagements.repo] getVendorEngagementById error:', veError);
    return { data: null, error: veError.message };
  }

  // 2. Fetch the work order
  const { data: wo } = await sb
    .from('work_orders')
    .select('id, work_order_number, title, engagement_id')
    .eq('id', ve.work_order_id)
    .single();

  // 3. Fetch the parent engagement
  const engId = ve.engagement_id || wo?.engagement_id;
  const { data: eng } = await sb
    .from('engagements')
    .select(
      'id, engagement_number, title, department, assigned_approver, start_date, end_date, status'
    )
    .eq('id', engId)
    .maybeSingle();

  // 4. Fetch the submissions linked to this vendor and work order
  let vendorSubmissions = [];
  if (ve.vendor_id && ve.work_order_id) {
    const { data: subs } = await sb
      .from('work_order_vendor_submissions')
      .select('*, work_order_vendor_submission_files(*)')
      .eq('work_order_id', ve.work_order_id)
      .eq('vendor_id', ve.vendor_id)
      .order('submitted_at', { ascending: false });

    vendorSubmissions = subs || [];
  }

  // Formatting response similarly to what UI expects
  const projectTitle = eng?.title ?? wo?.title ?? ve.title ?? 'Unknown Project';

  const detail = {
    vendorEngagementId: ve.id,
    engagementId: eng
      ? `ENG-${String(eng.engagement_number).padStart(4, '0')}`
      : (ve.engagement_id ?? '—'),
    workOrderId: wo
      ? `WO-${String(wo.work_order_number).padStart(4, '0')}`
      : ve.work_order_id,
    vendorName: ve.title,
    projectTitle: projectTitle,
    awardAmount: ve.amount,
    totalPaidSoFar: 0, // This is mock since we don't have complete logic tracking it in the repo yet, but could be derived from paid invoices
    remainingBalance: ve.amount,
    status: ve.status ?? 'Active',
    startDate: eng?.start_date ?? ve.created_at,
    endDate: eng?.end_date ?? null,
    department: eng?.department ?? 'IT Operations', // Fallback
    awardedBy: eng?.assigned_approver ?? 'Admin',
    decisionReason: 'Awarded via platform',
    milestones: [],
    invoices: [],
    submissions: vendorSubmissions, // Attach the fetched submissions here!
  };

  return { data: detail, error: null };
}

/**
 * Fetch all Vendor Engagements from the vendor_engagements table
 * (created by the award flow) and join with work_orders and engagements
 * for human-readable IDs and correct project titles.
 */
export async function listVendorEngagements(): Promise<{
  data: VendorEngagementRow[] | null;
  error: string | null;
}> {
  const sb = supabase();

  // 1. Fetch all vendor engagement records
  const { data: veRows, error: veError } = await sb
    .from('vendor_engagements')
    .select('*')
    .order('created_at', { ascending: true });

  if (veError) {
    console.error('[engagements.repo] listVendorEngagements error:', veError);
    return {
      data: null,
      error: veError.message ?? 'Failed to fetch vendor engagements.',
    };
  }

  if (!veRows || veRows.length === 0) {
    return { data: [], error: null };
  }

  // 2. Collect unique work_order_ids and engagement_ids to look up
  const workOrderIds = [
    ...new Set(veRows.map((v: any) => v.work_order_id).filter(Boolean)),
  ];
  const engagementIds = [
    ...new Set(veRows.map((v: any) => v.engagement_id).filter(Boolean)),
  ];

  // 3. Fetch work orders and engagements for human-readable numbers / titles
  const [woRes, engRes] = await Promise.all([
    workOrderIds.length > 0
      ? sb
          .from('work_orders')
          .select('id, work_order_number, title, engagement_id')
          .in('id', workOrderIds)
      : Promise.resolve({ data: [], error: null }),
    engagementIds.length > 0
      ? sb
          .from('engagements')
          .select(
            'id, engagement_number, title, department, assigned_approver, start_date, end_date, status'
          )
          .in('id', engagementIds)
      : Promise.resolve({ data: [], error: null }),
  ]);

  // Build lookup maps
  const woMap = new Map((woRes.data ?? []).map((wo: any) => [wo.id, wo]));
  const engMap = new Map((engRes.data ?? []).map((e: any) => [e.id, e]));

  // 4. Construct VendorEngagementRow array with human-readable IDs
  const results: VendorEngagementRow[] = veRows.map((ve: any, idx: number) => {
    const wo = woMap.get(ve.work_order_id);
    // Try the engagement_id from the vendor_engagement row first, fall back to work order's engagement_id
    const engId = ve.engagement_id || wo?.engagement_id;
    const eng = engId ? engMap.get(engId) : null;

    // Human-readable numbers
    const veNumber = `VE-${String(idx + 1).padStart(4, '0')}`;
    const woNumber = wo
      ? `WO-${String(wo.work_order_number).padStart(4, '0')}`
      : ve.work_order_id;
    const engNumber = eng
      ? `ENG-${String(eng.engagement_number).padStart(4, '0')}`
      : (ve.engagement_id ?? '—');

    // Project title: prefer engagement title, fall back to work order title, then vendor_engagement title
    const projectTitle =
      eng?.title ?? wo?.title ?? ve.title ?? 'Unknown Project';

    return {
      vendor_engagement_id: veNumber,
      engagement_id: engNumber,
      engagement_uuid: engId ?? null,
      work_order_id: woNumber,
      work_order_uuid: ve.work_order_id ?? null,
      vendor_id: ve.vendor_id ?? null,
      vendor_name: ve.title, // vendor_engagements.title stores vendor name
      project_title: projectTitle,
      award_amount: ve.amount,
      status: ve.status ?? 'Active',
      start_date: eng?.start_date ?? ve.created_at,
      end_date: eng?.end_date ?? null,
      department: eng?.department ?? null,
      awarded_by: eng?.assigned_approver ?? null,
      decision_reason: 'Awarded via platform',
      milestones: [],
      invoices: [],
    };
  });

  return { data: results, error: null };
}

/**
 * Fetch a single Vendor Engagement by its human-readable VE number (e.g. "VE-0001").
 * Also populates milestones and invoices from their respective tables.
 */
export async function getVendorEngagementByVeNumber(
  veNumber: string
): Promise<{ data: VendorEngagementRow | null; error: string | null }> {
  // 1. Reuse listVendorEngagements to get the full list and find the match
  const { data: allVe, error: listError } = await listVendorEngagements();

  if (listError) {
    return { data: null, error: listError };
  }

  const match = (allVe ?? []).find(
    (ve) => ve.vendor_engagement_id === veNumber
  );

  if (!match) {
    return { data: null, error: `Vendor engagement ${veNumber} not found.` };
  }

  const sb = supabase();

  // 2. Fetch milestones — they are linked via engagement_rfqs for the engagement
  let milestones: MilestoneRow[] = [];
  if (match.engagement_uuid) {
    // Get RFQ IDs for this engagement
    const { data: rfqs } = await sb
      .from('engagement_rfqs')
      .select('id')
      .eq('engagement_id', match.engagement_uuid);

    const rfqIds = (rfqs ?? []).map((r: any) => r.id);

    if (rfqIds.length > 0) {
      const { data: milestoneRows } = await sb
        .from('vendor_engagement_milestones')
        .select('*')
        .in('rfq_id', rfqIds)
        .order('due_date', { ascending: true });

      milestones = (milestoneRows ?? []) as MilestoneRow[];
    }
  }

  // 3. Fetch invoices linked to this vendor + engagement
  let invoices: InvoiceRow[] = [];
  if (match.engagement_uuid) {
    const { data: invRows } = await sb
      .from('engagement_invoice_submissions')
      .select('*, engagement_invoice_submission_files(*)')
      .eq('engagement_id', match.engagement_uuid)
      .order('submitted_at', { ascending: true });

    invoices = (invRows ?? []).map((inv: any) => ({
      id: inv.id,
      engagement_id: inv.engagement_id,
      invoice_number: inv.invoice_number_text ?? `INV-${inv.id.slice(0, 8)}`,
      vendor_name: match.vendor_name,
      amount: inv.total ?? 0,
      due_date: inv.due_date ?? null,
      status: inv.status ?? 'Submitted',
      submitted_date: inv.submitted_at,
      approved_date: null,
      paid_date: null,
      aging_days: 0,
      files:
        inv.engagement_invoice_submission_files?.map((f: any) => ({
          id: f.id,
          file_name: f.file_name,
          storage_path: f.storage_path,
        })) || [],
      created_at: inv.submitted_at,
    }));
  }

  // 4. Fetch the submissions linked to this vendor and work order
  let submissions: any[] = [];
  if (match.work_order_uuid && match.vendor_name) {
    // Attempt to use match.vendor_id first, fallback to name
    let actualVendorId = match.vendor_id;
    if (!actualVendorId) {
      const { data: vendorData } = await sb
        .from('vendors')
        .select('id')
        .eq('vendor_name', match.vendor_name)
        .maybeSingle();
      actualVendorId = vendorData?.id;
    }

    if (actualVendorId) {
      const { data: subs } = await sb
        .from('work_order_vendor_submissions')
        .select('*, work_order_vendor_submission_files(*)')
        .eq('work_order_id', match.work_order_uuid)
        .eq('vendor_id', actualVendorId)
        .order('submitted_at', { ascending: false });
      submissions = subs || [];
    }
  }

  return {
    data: {
      ...match,
      milestones,
      invoices,
      submissions, // Attach the fetched submissions here!
    },
    error: null,
  };
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
