import type { NextApiRequest, NextApiResponse } from 'next';
import { getRequestContext } from '@/lib/auth/getRequestContext';
import * as dashboardRepo from '@/lib/supabase/repos/dashboardRepo';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).end();
  }

  try {
    const ctx = await getRequestContext(req);
    const dashboardData = await dashboardRepo.getDashboardData(ctx.orgId);
    return res.status(200).json(dashboardData);
  } catch (err: any) {
    console.error('[/api/dashboard] Error:', err.message);
    if (err.message === 'Unauthorized') {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    if (
      typeof err.message === 'string' &&
      err.message.includes('No organization membership')
    ) {
      return res.status(403).json({ error: err.message });
    }
    return res.status(500).json({ error: 'Internal server error' });
  }
}
