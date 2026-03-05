import { NextApiRequest, NextApiResponse } from 'next';
import { getEngagementInvoiceFiles } from '@/lib/supabase/repos/engagementInvoicePortalRepo';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    return handleGet(req, res);
  }
  res.setHeader('Allow', ['GET']);
  res.status(405).json({ error: `Method ${req.method} Not Allowed` });
}

async function handleGet(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Missing engagement ID' });
  }

  // Bypassing auth check for now as done elsewhere
  const orgId = '00000000-0000-0000-0000-000000000001';

  try {
    const result = await getEngagementInvoiceFiles(orgId, id);
    return res.status(200).json({ data: result });
  } catch (error: any) {
    console.error('[engagement-invoice-files] Error getting files:', error);
    return res
      .status(500)
      .json({ error: error.message || 'Failed to fetch invoice files' });
  }
}
