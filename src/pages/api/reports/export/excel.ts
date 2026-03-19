import type { NextApiRequest, NextApiResponse } from 'next';
import { getRequestContext } from '@/lib/auth/getRequestContext';
import * as reportsRepo from '@/lib/supabase/repos/reports.repo';
import ExcelJS from 'exceljs';

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

    // ── Build workbook ──────────────────────────────────────────
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'VendorBase';
    workbook.created = new Date();

    // ── Sheet 1: Summary ────────────────────────────────────────
    const summarySheet = workbook.addWorksheet('Summary');

    // Title row
    summarySheet.mergeCells('A1:B1');
    const titleCell = summarySheet.getCell('A1');
    titleCell.value = 'Monthly Accounting Report';
    titleCell.font = { size: 16, bold: true };
    titleCell.alignment = { vertical: 'middle' };
    summarySheet.getRow(1).height = 30;

    // Spacer
    summarySheet.addRow([]);

    // Header row
    const headerRow = summarySheet.addRow(['Metric', 'Value']);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.eachCell((cell) => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4B5563' } };
      cell.border = {
        bottom: { style: 'thin', color: { argb: 'FFD1D5DB' } },
      };
    });

    // Data rows
    const summaryData = [
      ['Total Awarded Value', summary.totalAwardedValue],
      ['Total Invoiced', summary.totalInvoicedAmount],
      ['Total Paid', summary.totalPaidAmount],
      ['Outstanding Payables', summary.outstandingPayables],
      ['Total Engagements', summary.totalEngagements],
      ['Total Invoices', summary.totalInvoices],
      ['Paid Invoices', summary.totalPaidInvoices],
    ];

    summaryData.forEach(([label, value]) => {
      const row = summarySheet.addRow([label, value]);
      row.getCell(2).numFmt = typeof value === 'number' && (value as number) > 100 ? '$#,##0' : '0';
      row.eachCell((cell) => {
        cell.border = {
          bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } },
        };
      });
    });

    summarySheet.getColumn(1).width = 28;
    summarySheet.getColumn(2).width = 22;

    // ── Sheet 2: Detailed Table ─────────────────────────────────
    const detailSheet = workbook.addWorksheet('Detailed Breakdown');

    // Header
    const detailHeader = detailSheet.addRow([
      'Invoice Number', 'Vendor Name', 'Engagement Title', 'Date', 'Status', 'Amount',
    ]);
    detailHeader.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    detailHeader.eachCell((cell) => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4B5563' } };
      cell.border = {
        bottom: { style: 'thin', color: { argb: 'FFD1D5DB' } },
      };
    });

    // Data
    detailedTable.forEach((row) => {
      const dataRow = detailSheet.addRow([
        row.invoiceNumber,
        row.vendorName,
        row.engagementTitle,
        row.date ? new Date(row.date) : '',
        row.status,
        row.totalAmount,
      ]);
      dataRow.getCell(4).numFmt = 'mm/dd/yyyy';
      dataRow.getCell(6).numFmt = '$#,##0.00';
      dataRow.eachCell((cell) => {
        cell.border = {
          bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } },
        };
      });
    });

    // Auto-fit column widths
    detailSheet.getColumn(1).width = 18;
    detailSheet.getColumn(2).width = 24;
    detailSheet.getColumn(3).width = 30;
    detailSheet.getColumn(4).width = 14;
    detailSheet.getColumn(5).width = 14;
    detailSheet.getColumn(6).width = 16;

    // ── Write to response ───────────────────────────────────────
    const buffer = await workbook.xlsx.writeBuffer();

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="report_export.xlsx"');
    return res.status(200).send(Buffer.from(buffer as ArrayBuffer));

  } catch (err: any) {
    console.error('[/api/reports/export/excel] Error:', err.message);
    if (err.message === 'Unauthorized') {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    return res.status(500).json({ error: 'Internal server error' });
  }
}
