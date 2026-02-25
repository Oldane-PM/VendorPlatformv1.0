import type { NextApiRequest, NextApiResponse } from 'next';
import { listSubmissionsByWorkOrder } from '../../../../lib/supabase/repos/vendorSubmissions.repo';

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
    return res
      .status(400)
      .json({ data: null, error: 'Work order ID is required.' });
  }

  const { data, error } = await listSubmissionsByWorkOrder(workOrderId);

  if (error) {
    console.error('[submissions API] Error:', error);
    return res.status(500).json({ data: null, error });
  }

  return res.status(200).json({ data, error: null });
}
