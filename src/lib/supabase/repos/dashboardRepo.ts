import { createServerClient } from '../server';
import { formatAuditEvent } from '@/lib/domain/audit/formatAuditEvent';

export interface DashboardSummary {
  activeEngagements: number;
  pendingApprovals: number;
  pendingApprovalAvgDays: number | null;
  outstandingInvoices: number;
  totalSpendYtd: number;
}

export interface EngagementStatusDistributionItem {
  status: 'active' | 'on_hold' | 'completed' | 'cancelled' | string;
  count: number;
}

export interface RecentActivityItem {
  id: string;
  eventType: string;
  description: string;
  entityType?: string | null;
  entityId?: string | null;
  createdAt: string;
}

export interface SpendingTrendItem {
  month: string;
  [department: string]: string | number; // dynamic keys for departments e.g., 'IT': 45000
}

export interface ApprovalPipelineItem {
  name: string;
  value: number;
  fill: string;
}

export interface DepartmentApprovalPipeline {
  department: string;
  pipeline: ApprovalPipelineItem[];
}

export interface DashboardData {
  summary: DashboardSummary;
  engagementStatusDistribution: EngagementStatusDistributionItem[];
  recentActivity: RecentActivityItem[];
  spendingTrends: SpendingTrendItem[];
  approvalPipeline: DepartmentApprovalPipeline[];
}

export async function getDashboardSummary(orgId: string): Promise<DashboardSummary> {
  const supabase = createServerClient();
  
  // 1. Active Engagements
  const { count: activeEngagementsCount, error: engagementsError } = await supabase
    .from('engagements')
    .select('*', { count: 'exact', head: true })
    .eq('org_id', orgId)
    .in('status', ['active', 'on_hold']);

  if (engagementsError) {
    console.error('Error fetching active engagements:', engagementsError);
    throw new Error('Failed to fetch active engagements');
  }

  // 2. Pending Approvals
  const { data: pendingApprovalsData, error: approvalsError } = await supabase
    .from('engagement_approval_steps')
    .select('created_at, engagements!inner(org_id)')
    .eq('engagements.org_id', orgId)
    .eq('status', 'pending');

  if (approvalsError) {
    console.error('Error fetching pending approvals:', approvalsError);
    throw new Error('Failed to fetch pending approvals');
  }

  const pendingApprovalsCount = pendingApprovalsData.length;
  let pendingApprovalAvgDays: number | null = null;
  
  if (pendingApprovalsCount > 0) {
    const totalMs = pendingApprovalsData.reduce((acc, current) => {
      const ms = new Date().getTime() - new Date(current.created_at).getTime();
      return acc + ms;
    }, 0);
    pendingApprovalAvgDays = totalMs / pendingApprovalsCount / (1000 * 60 * 60 * 24);
  }

  // 3. Outstanding Invoices
  const { count: outstandingInvoicesCount, error: invoicesError } = await supabase
    .from('engagement_invoice_submissions')
    .select('*, engagements!inner(org_id)', { count: 'exact', head: true })
    .eq('engagements.org_id', orgId)
    .in('status', ['submitted', 'approved', 'partially_paid', 'overdue']);

  if (invoicesError) {
    console.error('Error fetching outstanding invoices:', invoicesError);
    throw new Error('Failed to fetch outstanding invoices');
  }

  // 4. Total Spend (YTD)
  const currentYear = new Date().getFullYear();
  const startOfYear = `${currentYear}-01-01`;
  
  const { data: spendData, error: spendError } = await supabase
    .from('bank_transactions')
    .select('amount')
    .eq('type', 'Payment')
    .gte('transaction_date', startOfYear);

  if (spendError) {
    console.error('Error fetching total spend:', spendError);
    throw new Error('Failed to fetch total spend');
  }

  const totalSpendYtd = spendData.reduce((acc, curr) => acc + Number(curr.amount || 0), 0);

  return {
    activeEngagements: activeEngagementsCount || 0,
    pendingApprovals: pendingApprovalsCount,
    pendingApprovalAvgDays: pendingApprovalAvgDays !== null ? Number(pendingApprovalAvgDays.toFixed(1)) : null,
    outstandingInvoices: outstandingInvoicesCount || 0,
    totalSpendYtd,
  };
}

export async function getEngagementStatusDistribution(orgId: string): Promise<EngagementStatusDistributionItem[]> {
  const supabase = createServerClient();
  
  // Group by status by pulling all statuses and aggregating in memory since Supabase JS client doesn't 
  // expose raw SQL GROUP BY easily without RPC, and this table isn't expected to be millions of rows per org.
  const { data, error } = await supabase
    .from('engagements')
    .select('status')
    .eq('org_id', orgId);

  if (error) {
    console.error('Error fetching engagement distribution:', error);
    throw new Error('Failed to fetch engagement status distribution');
  }

  const distributionMap = new Map<string, number>();
  for (const row of data) {
    const status = row.status || 'unknown';
    distributionMap.set(status, (distributionMap.get(status) || 0) + 1);
  }

  return Array.from(distributionMap.entries()).map(([status, count]) => ({
    status,
    count,
  }));
}

export async function getRecentActivity(orgId: string, limit: number = 20): Promise<RecentActivityItem[]> {
  const supabase = createServerClient();
  
  const { data, error } = await supabase
    .from('audit_events')
    .select('id, event_type, entity_type, entity_id, created_at, metadata')
    .eq('org_id', orgId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching recent activity:', error);
    throw new Error('Failed to fetch recent activity');
  }

  // formatAuditEvent is imported statically

  return data.map((event) => {
    return {
      id: event.id,
      eventType: event.event_type,
      entityType: event.entity_type,
      entityId: event.entity_id,
      createdAt: event.created_at,
      description: formatAuditEvent(event.event_type, event.metadata),
    };
  });
}

export async function getSpendingTrends(orgId: string): Promise<SpendingTrendItem[]> {
  const supabase = createServerClient();
  
  // Get date 6 months ago
  const d = new Date();
  d.setMonth(d.getMonth() - 5);
  d.setDate(1);
  const sixMonthsAgo = d.toISOString();

  // Fetch all invoices from last 6 months joined with engagements to get department
  const { data, error } = await supabase
    .from('engagement_invoice_submissions')
    .select('total, submitted_at, engagements!inner(department, org_id)')
    .eq('engagements.org_id', orgId)
    .gte('submitted_at', sixMonthsAgo);

  if (error) {
    console.error('Error fetching spending trends:', error);
    throw new Error('Failed to fetch spending trends');
  }

  // Aggregate by Month and Department
  const monthMap = new Map<string, Record<string, number>>();
  const months: string[] = [];
  
  // Initialize the last 6 months in order
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const mStr = d.toLocaleString('default', { month: 'short' });
    if (!monthMap.has(mStr)) {
      monthMap.set(mStr, {});
      months.push(mStr);
    }
  }

  for (const row of data) {
    if (!row.submitted_at || !row.total) continue;
    const date = new Date(row.submitted_at);
    const mStr = date.toLocaleString('default', { month: 'short' });
    const dept = (row.engagements as any)?.department || 'Other';
    const amount = Number(row.total);

    if (monthMap.has(mStr)) {
      const deptTotals = monthMap.get(mStr)!;
      deptTotals[dept] = (deptTotals[dept] || 0) + amount;
    }
  }

  return months.map(mStr => {
    return {
      month: mStr,
      ...monthMap.get(mStr)
    };
  });
}

export async function getApprovalPipeline(orgId: string): Promise<DepartmentApprovalPipeline[]> {
  const supabase = createServerClient();
  
  // Fetch approval steps to count pending and approved
  const { data: approvalsData, error: appError } = await supabase
    .from('engagement_approval_steps')
    .select('status, engagements!inner(org_id, department)')
    .eq('engagements.org_id', orgId);

  if (appError) {
    console.error('Error fetching approval pipeline:', appError);
    throw new Error('Failed to fetch approval pipeline');
  }

  // Fetch completed engagements for the final step of the funnel
  const { data: completedData, error: compError } = await supabase
    .from('engagements')
    .select('department')
    .eq('org_id', orgId)
    .eq('status', 'completed');

  if (compError) {
    console.error('Error fetching completed engagements:', compError);
    throw new Error('Failed to fetch completed engagements for pipeline');
  }

  const deptMap = new Map<string, { pending: number; approved: number; completed: number }>();

  const getDept = (dept: string) => {
    const d = dept || 'Other';
    if (!deptMap.has(d)) deptMap.set(d, { pending: 0, approved: 0, completed: 0 });
    return deptMap.get(d)!;
  };

  for (const row of approvalsData || []) {
    const dept = (row.engagements as any)?.department;
    if (row.status === 'pending') getDept(dept).pending++;
    else if (row.status === 'approved') getDept(dept).approved++;
  }

  for (const row of completedData || []) {
    const dept = row.department;
    getDept(dept).completed++;
  }

  return Array.from(deptMap.entries()).map(([department, counts]) => ({
    department,
    pipeline: [
      { name: 'Pending', value: counts.pending, fill: '#FFA500' },
      { name: 'Approved', value: counts.approved, fill: '#0088FE' },
      { name: 'Completed', value: counts.completed, fill: '#00C49F' }
    ]
  })).sort((a,b) => a.department.localeCompare(b.department));
}

export async function getDashboardData(orgId: string): Promise<DashboardData> {
  const [summary, engagementStatusDistribution, recentActivity, spendingTrends, approvalPipeline] = await Promise.all([
    getDashboardSummary(orgId),
    getEngagementStatusDistribution(orgId),
    getRecentActivity(orgId, 15),
    getSpendingTrends(orgId),
    getApprovalPipeline(orgId),
  ]);

  return {
    summary,
    engagementStatusDistribution,
    recentActivity,
    spendingTrends,
    approvalPipeline,
  };
}
