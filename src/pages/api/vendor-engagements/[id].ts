import type { NextApiRequest, NextApiResponse } from 'next';
import { getVendorEngagementById } from '../../../lib/supabase/repos/engagements.repo';

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
    return res.status(400).json({ data: null, error: 'Invalid ID' });
  }

  const { data, error } = await getVendorEngagementById(id);

  if (error) {
    return res.status(500).json({ data: null, error });
  }

  return res.status(200).json({ data, error: null });
}
