import type { NextApiRequest, NextApiResponse } from 'next';
import { getRequestContext } from '@/lib/auth/getRequestContext';
import * as reportsRepo from '@/lib/supabase/repos/reports.repo';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).end();
  }

  try {
    let orgId: string;
    try {
      const ctx = await getRequestContext(req);
      orgId = ctx.orgId;
    } catch (authErr) {
      if (process.env.NODE_ENV !== 'production') {
        throw new Error('Unauthorized');
      }
      throw authErr;
    }

    const { startDate, endDate, category } = req.query;

    const filters: reportsRepo.ReportsFilters = {};
    if (typeof startDate === 'string') filters.startDate = startDate;
    if (typeof endDate === 'string') filters.endDate = endDate;
    if (typeof category === 'string') filters.category = category;

    const [summary, detailedTable] = await Promise.all([
      reportsRepo.getSummaryMetrics(orgId, filters),
      reportsRepo.getDetailedReportTable(orgId, filters),
    ]);

    // Create CSV content
    const csvRows: string[] = [];

    // Summary Section
    csvRows.push('Monthly Accounting Report Summary');
    csvRows.push('');
    csvRows.push('Metric,Value');
    csvRows.push(`Total Awarded Value,${summary.totalAwardedValue}`);
    csvRows.push(`Total Invoiced,${summary.totalInvoicedAmount}`);
    csvRows.push(`Total Paid,${summary.totalPaidAmount}`);
    csvRows.push(`Outstanding Payables,${summary.outstandingPayables}`);
    csvRows.push(`Total Engagements,${summary.totalEngagements}`);
    csvRows.push(`Total Invoices,${summary.totalInvoices}`);
    csvRows.push(`Paid Invoices,${summary.totalPaidInvoices}`);
    csvRows.push('');
    
    // Detailed Table Section
    csvRows.push('Detailed Breakdown');
    csvRows.push('');
    csvRows.push('Invoice Number,Vendor Name,Engagement Title,Date,Status,Amount');
    
    detailedTable.forEach((row) => {
      const dateStr = row.date ? new Date(row.date).toLocaleDateString() : '';
      csvRows.push([
        row.invoiceNumber || '',
        `"${(row.vendorName || '').replace(/"/g, '""')}"`,
        `"${(row.engagementTitle || '').replace(/"/g, '""')}"`,
        dateStr,
        row.status || '',
        row.totalAmount || 0
      ].join(','));
    });

    const csvContent = csvRows.join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="report_export.csv"');
    return res.status(200).send(csvContent);

  } catch (err: any) {
    console.error('[/api/reports/export/csv] Error:', err.message);
    if (err.message === 'Unauthorized') {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    return res.status(500).json({ error: 'Internal server error' });
  }
}
