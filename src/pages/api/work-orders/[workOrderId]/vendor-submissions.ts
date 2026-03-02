import { NextApiRequest, NextApiResponse } from 'next';
import { listWorkOrderVendorSubmissions } from '@/lib/supabase/repos/workOrderVendorPortalRepo';
import { getRequestContext } from '@/lib/auth/getRequestContext';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    return handleGet(req, res);
  }
  res.setHeader('Allow', ['GET']);
  res.status(405).json({ error: `Method ${req.method} Not Allowed` });
}

async function handleGet(req: NextApiRequest, res: NextApiResponse) {
  let ctx;
  try {
    ctx = await getRequestContext(req);
  } catch (err: any) {
    return res.status(401).json({ error: err.message || 'Unauthorized' });
  }

  const { workOrderId } = req.query;
  if (!workOrderId || typeof workOrderId !== 'string') {
    return res.status(400).json({ error: 'Missing work order ID' });
  }

  try {
    const result = await listWorkOrderVendorSubmissions(ctx.orgId, workOrderId);

    return res.status(200).json(result);
  } catch (error: any) {
    console.error('[vendor-submissions] GET Error:', error);
    return res
      .status(500)
      .json({ error: error.message || 'Internal Server Error' });
  }
}
