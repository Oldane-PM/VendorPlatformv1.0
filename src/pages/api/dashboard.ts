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
    let orgId: string;
    try {
      const ctx = await getRequestContext(req);
      orgId = ctx.orgId;
    } catch (authErr) {
      if (process.env.NODE_ENV !== 'production') {
        console.log('[/api/dashboard] Auth failed in dev — using dev bypass');
        // Retrieve a fallback org for dev if needed, or throw if we don't have one
        // For simplicity we will just throw unauthorized, but we can try to get first org
        // Wait, dashboard repo doesn't have getFirstOrgId. Let's just import vendorsRepo or simple supabase query
        // Actually let's assume getRequestContext works or we return 401
        throw new Error('Unauthorized');
      }
      throw authErr;
    }

    const dashboardData = await dashboardRepo.getDashboardData(orgId);

    return res.status(200).json(dashboardData);
  } catch (err: any) {
    console.error('[/api/dashboard] Error:', err.message);
    if (err.message === 'Unauthorized') {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    return res.status(500).json({ error: 'Internal server error' });
  }
}
