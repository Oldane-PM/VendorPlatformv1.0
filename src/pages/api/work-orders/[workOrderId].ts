import type { NextApiRequest, NextApiResponse } from 'next';
import { getWorkOrderById } from '../../../lib/supabase/repos/workOrders.repo';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).end();
  }

  const { workOrderId } = req.query;

  if (!workOrderId || typeof workOrderId !== 'string') {
    return res.status(400).json({ error: 'Work order ID is required.' });
  }

  const { data, error } = await getWorkOrderById(workOrderId);

  if (error) {
    return res.status(500).json({ error });
  }

  if (!data) {
    return res.status(404).json({ error: 'Work order not found.' });
  }

  return res.status(200).json({ data });
}
