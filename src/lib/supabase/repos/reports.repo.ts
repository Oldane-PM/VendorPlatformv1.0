import { createServerClient } from '../server';

export interface ReportsFilters {
  startDate?: string;
  endDate?: string;
  category?: string; // e.g., 'vendor' or 'department'
}

export interface SummaryMetrics {
  totalInvoices: number;
  totalPaidInvoices: number;
  totalEngagements: number;
  totalInvoicedAmount: number;
  totalAwardedValue: number;
  totalPaidAmount: number;
  outstandingPayables: number;
}

export interface TrendData {
  month: string;
  spend: number;
  invoices: number;
}

export interface CategoryBreakdown {
  name: string;
  spend: number;
  invoices: number;
}

export interface DetailedReportTable {
  id: string;
  vendorName: string;
  engagementTitle: string;
  invoiceNumber: string;
  totalAmount: number;
  status: string;
  date: string;
}

/**
 * Helper to build common filters
 */
function applyFilters(query: any, dateField: string, filters: ReportsFilters) {
  if (filters.startDate) {
    query = query.gte(dateField, filters.startDate);
  }
  if (filters.endDate) {
    query = query.lte(dateField, filters.endDate);
  }
  return query;
}

export async function getSummaryMetrics(orgId: string, filters: ReportsFilters): Promise<SummaryMetrics> {
  const supabase = createServerClient();

  // Fetch Invoices
  let invQuery = supabase
    .from('engagement_invoice_submissions')
    .select('total, status, submitted_at, engagements!inner(org_id)');
  
  invQuery = invQuery.eq('engagements.org_id', orgId);
  invQuery = applyFilters(invQuery, 'submitted_at', filters);

  const { data: invoices, error: invError } = await invQuery;
  if (invError) throw new Error(`[ReportsRepo.getSummaryMetrics] Invoices ${invError.message}`);

  // Fetch Engagements
  let engQuery = supabase
    .from('engagements')
    .select('total_value, created_at, org_id');
  
  engQuery = engQuery.eq('org_id', orgId);
  engQuery = applyFilters(engQuery, 'created_at', filters);

  const { data: engagements, error: engError } = await engQuery;
  if (engError) throw new Error(`[ReportsRepo.getSummaryMetrics] Engagements ${engError.message}`);

  // Calculate Metrics
  let totalInvoices = 0;
  let totalPaidInvoices = 0;
  let totalInvoicedAmount = 0;
  let totalPaidAmount = 0;
  let outstandingPayables = 0;

  for (const inv of invoices || []) {
    totalInvoices++;
    const amt = Number(inv.total || 0);
    totalInvoicedAmount += amt;

    const status = (inv.status || '').toLowerCase();
    if (status === 'paid' || status === 'approved') {
      totalPaidInvoices++;
      totalPaidAmount += amt;
    } else if (status !== 'cancelled' && status !== 'rejected') {
      outstandingPayables += amt;
    }
  }

  let totalEngagements = 0;
  let totalAwardedValue = 0;

  for (const eng of engagements || []) {
    totalEngagements++;
    totalAwardedValue += Number(eng.total_value || 0);
  }

  return {
    totalInvoices,
    totalPaidInvoices,
    totalEngagements,
    totalInvoicedAmount,
    totalAwardedValue,
    totalPaidAmount,
    outstandingPayables
  };
}

export async function getTrendData(orgId: string, filters: ReportsFilters): Promise<TrendData[]> {
  const supabase = createServerClient();
  
  let query = supabase
    .from('engagement_invoice_submissions')
    .select('total, submitted_at, engagements!inner(org_id)');
  
  query = query.eq('engagements.org_id', orgId);
  query = applyFilters(query, 'submitted_at', filters);

  const { data: invoices, error } = await query;
  if (error) throw new Error(`[ReportsRepo.getTrendData] ${error.message}`);

  const monthlyMap = new Map<string, { spend: number, invoices: number }>();

  // Use a sensible range based on what we fetched, or just aggregate what we have
  for (const inv of invoices || []) {
    if (!inv.submitted_at) continue;
    
    // Group by Month/Year e.g., 'Feb 2026'
    const date = new Date(inv.submitted_at);
    const monthKey = date.toLocaleString('default', { month: 'short', year: 'numeric' });

    const current = monthlyMap.get(monthKey) || { spend: 0, invoices: 0 };
    current.spend += Number(inv.total || 0);
    current.invoices += 1;
    
    monthlyMap.set(monthKey, current);
  }

  // Convert map to array and sort chronologically
  const trends: TrendData[] = [];
  for (const [month, stats] of monthlyMap.entries()) {
    trends.push({ month, ...stats });
  }

  // Date parsing hack for correct sort
  trends.sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime());

  return trends;
}

export async function getCategoryBreakdown(orgId: string, filters: ReportsFilters, groupBy: 'vendor' | 'department' = 'department'): Promise<CategoryBreakdown[]> {
  const supabase = createServerClient();

  let query = supabase
    .from('engagement_invoice_submissions')
    .select('total, submitted_at, engagements!inner(org_id, department), vendors!inner(vendor_name)');
  
  query = query.eq('engagements.org_id', orgId);
  query = applyFilters(query, 'submitted_at', filters);

  const { data: invoices, error } = await query;
  if (error) throw new Error(`[ReportsRepo.getCategoryBreakdown] ${error.message}`);

  const map = new Map<string, { spend: number, invoices: number }>();

  for (const inv of invoices || []) {
    let key = 'Unknown';
    if (groupBy === 'department') {
      key = (inv.engagements as any)?.department || 'Unassigned';
    } else {
      key = (inv.vendors as any)?.vendor_name || 'Unknown Vendor';
    }

    const current = map.get(key) || { spend: 0, invoices: 0 };
    current.spend += Number(inv.total || 0);
    current.invoices += 1;
    map.set(key, current);
  }

  const breakdown: CategoryBreakdown[] = [];
  for (const [name, stats] of map.entries()) {
    breakdown.push({ name, ...stats });
  }

  // Sort by spend descending
  breakdown.sort((a, b) => b.spend - a.spend);

  return breakdown;
}

export async function getDetailedReportTable(orgId: string, filters: ReportsFilters): Promise<DetailedReportTable[]> {
  const supabase = createServerClient();

  let query = supabase
    .from('engagement_invoice_submissions')
    .select(`
      id, invoice_number_text, total, status, submitted_at,
      engagements!inner(org_id, title),
      vendors!inner(vendor_name)
    `);
  
  query = query.eq('engagements.org_id', orgId);
  query = applyFilters(query, 'submitted_at', filters);
  query = query.order('submitted_at', { ascending: false });

  const { data: invoices, error } = await query;
  if (error) throw new Error(`[ReportsRepo.getDetailedReportTable] ${error.message}`);

  return (invoices || []).map((inv: any) => ({
    id: inv.id,
    vendorName: inv.vendors?.vendor_name || 'Unknown',
    engagementTitle: inv.engagements?.title || 'Unknown',
    invoiceNumber: inv.invoice_number_text || `INV-${inv.id.substring(0, 8)}`,
    totalAmount: Number(inv.total || 0),
    status: inv.status || 'Unknown',
    date: inv.submitted_at
  }));
}
