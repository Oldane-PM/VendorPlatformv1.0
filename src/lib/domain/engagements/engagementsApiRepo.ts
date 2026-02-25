/**
 * Engagements – client-side API repository.
 *
 * Defines DTOs and helper functions for fetching engagement data
 * from Next.js API routes. No Supabase client usage here.
 */

// ─── DTOs ────────────────────────────────────────────────────────────────────

export interface RfqLineItemDto {
  id: string;
  rfq_id: string;
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
}

export interface RfqDto {
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
  line_items: RfqLineItemDto[];
}

export interface DocumentDto {
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

export interface ApprovalStepDto {
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

export interface InvoiceDto {
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

export interface ActivityLogDto {
  id: string;
  engagement_id: string;
  timestamp: string;
  user_name: string;
  action: string;
  details: string | null;
  status_change: string | null;
  created_at: string;
}

export interface MilestoneDto {
  id: string;
  rfq_id: string;
  activity: string;
  due_date: string;
  amount: number;
  status: string;
  created_at: string;
}

export interface VendorEngagementDto {
  vendor_engagement_id: string;
  engagement_id: string;
  work_order_id: string;
  vendor_name: string;
  project_title: string;
  award_amount: number;
  status: string;
  start_date: string | null;
  end_date: string | null;
  department: string | null;
  awarded_by: string | null;
  decision_reason: string | null;
  milestones: MilestoneDto[];
  invoices: InvoiceDto[];
}

export interface EngagementDetailDto {
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
  vendor_id: string | null;
  vendor_name: string | null;
  department: string | null;
  total_value: number;
  assigned_approver: string | null;
  rfqs: RfqDto[];
  documents: DocumentDto[];
  approval_steps: ApprovalStepDto[];
  invoices: InvoiceDto[];
  activity_log: ActivityLogDto[];
}

// ─── API Functions ───────────────────────────────────────────────────────────

/**
 * Fetch a single engagement with all sub-table data.
 */
export async function getEngagement(
  id: string
): Promise<{ data: EngagementDetailDto | null; error: string | null }> {
  try {
    const res = await fetch(`/api/engagements/${id}`);
    if (!res.ok) {
      const err = await res.json();
      return { data: null, error: err.error || 'Failed to fetch engagement' };
    }
    const json = await res.json();
    return json; // { data, error }
  } catch (error: any) {
    return { data: null, error: error.message };
  }
}

export async function listVendorEngagements(): Promise<{
  data: VendorEngagementDto[] | null;
  error: string | null;
}> {
  try {
    const res = await fetch('/api/vendor-engagements');
    if (!res.ok) {
      const err = await res.json();
      return {
        data: null,
        error: err.error || 'Failed to fetch vendor engagements',
      };
    }
    const json = await res.json();
    return json;
  } catch (error: any) {
    return { data: null, error: error.message };
  }
}
