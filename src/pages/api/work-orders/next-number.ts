import type { NextApiRequest, NextApiResponse } from 'next';
import { getWorkOrderCount } from '../../../lib/supabase/repos/workOrders.repo';
import { generateWorkOrderNumber } from '../../../lib/domain/workOrders';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).end();
  }

  const { count, error } = await getWorkOrderCount();

  if (error) {
    return res.status(500).json({ error });
  }

  return res.status(200).json({ nextNumber: generateWorkOrderNumber(count) });
}
