import { NextApiRequest, NextApiResponse } from 'next';
import { getInvoicePortalContext } from '@/lib/supabase/repos/engagementInvoicePortalRepo';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    return handleGet(req, res);
  }
  res.setHeader('Allow', ['GET']);
  res.status(405).json({ error: `Method ${req.method} Not Allowed` });
}

async function handleGet(req: NextApiRequest, res: NextApiResponse) {
  const { requestId, t } = req.query;

  if (!requestId || typeof requestId !== 'string') {
    return res.status(400).json({ error: 'Missing request ID' });
  }

  if (!t || typeof t !== 'string') {
    return res.status(401).json({ error: 'Missing token' });
  }

  try {
    const ip =
      (req.headers['x-forwarded-for'] as string) ||
      req.socket.remoteAddress ||
      'unknown';
    const ctx = await getInvoicePortalContext(requestId, t, ip);
    return res.status(200).json(ctx);
  } catch (error: any) {
    console.error('[invoice-portal-context] Error:', error);
    const msg = error.message || 'Failed to get portal context';
    const status = msg.toLowerCase().includes('expired')
      ? 410
      : msg.toLowerCase().includes('invalid') ||
          msg.toLowerCase().includes('revoked')
        ? 403
        : 400;
    return res.status(status).json({ error: msg });
  }
}
