import type { NextApiRequest, NextApiResponse } from 'next';
import { getVendorEngagementByVeNumber } from '../../../lib/supabase/repos/engagements.repo';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).end();
  }

  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ data: null, error: 'Missing id parameter' });
  }

  const { data, error } = await getVendorEngagementByVeNumber(id);

  if (error) {
    const status = error.includes('not found') ? 404 : 500;
    return res.status(status).json({ data: null, error });
  }

  return res.status(200).json({ data, error: null });
}
