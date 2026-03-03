import { NextApiRequest, NextApiResponse } from 'next';
import { createInvoiceSubmission } from '@/lib/supabase/repos/engagementInvoicePortalRepo';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    return handlePost(req, res);
  }
  res.setHeader('Allow', ['POST']);
  res.status(405).json({ error: `Method ${req.method} Not Allowed` });
}

async function handlePost(req: NextApiRequest, res: NextApiResponse) {
  const { requestId, t } = req.query;

  if (!requestId || typeof requestId !== 'string') {
    return res.status(400).json({ error: 'Missing request ID' });
  }

  if (!t || typeof t !== 'string') {
    return res.status(401).json({ error: 'Missing token' });
  }

  try {
    const result = await createInvoiceSubmission(requestId, t, req.body);
    return res.status(200).json(result);
  } catch (error: any) {
    console.error('[invoice-portal-submission] Error:', error);
    const msg = error.message || 'Failed to create submission';
    return res.status(400).json({ error: msg });
  }
}
