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

    const [summary, trends, categoryBreakdown, detailedTable] = await Promise.all([
      reportsRepo.getSummaryMetrics(orgId, filters),
      reportsRepo.getTrendData(orgId, filters),
      reportsRepo.getCategoryBreakdown(orgId, filters, (filters.category as any) || 'department'),
      reportsRepo.getDetailedReportTable(orgId, filters),
    ]);

    return res.status(200).json({
      summary,
      trends,
      categoryBreakdown,
      detailedTable,
    });
  } catch (err: any) {
    console.error('[/api/reports] Error:', err.message);
    if (err.message === 'Unauthorized') {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    return res.status(500).json({ error: 'Internal server error' });
  }
}
