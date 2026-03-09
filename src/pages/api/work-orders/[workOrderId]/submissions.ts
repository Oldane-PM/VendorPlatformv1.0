import type { NextApiRequest, NextApiResponse } from 'next';
import { listWorkOrderVendorSubmissions } from '../../../../lib/supabase/repos/workOrderQuotePortalRepo';
import { getRequestContext } from '../../../../lib/auth/getRequestContext';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).end();
  }

  let ctx;
  try {
    ctx = await getRequestContext(req);
  } catch (err: any) {
    return res.status(401).json({ error: err.message || 'Unauthorized' });
  }

  const { workOrderId } = req.query;

  if (!workOrderId || typeof workOrderId !== 'string') {
    return res
      .status(400)
      .json({ data: null, error: 'Work order ID is required.' });
  }

  try {
    const data = await listWorkOrderVendorSubmissions(ctx.orgId, workOrderId);

    // Map data to the format expected by the frontend hook
    const mappedData = data.map((sub) => ({
      ...sub,
      total_amount: sub.quoted_amount, // Maintain compatibility with old UI expectations
    }));

    return res.status(200).json({ data: mappedData, error: null });
  } catch (error: any) {
    console.error('[submissions API] Error:', error);
    return res.status(500).json({ data: null, error: error.message });
  }
}
