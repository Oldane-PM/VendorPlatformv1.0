import { NextApiRequest, NextApiResponse } from 'next';
import { getPortalContext } from '@/lib/supabase/repos/workOrderVendorPortalRepo';

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

  // Get client IP for audit logs
  let ip = req.headers['x-forwarded-for'] || req.socket?.remoteAddress;
  if (Array.isArray(ip)) ip = ip[0];

  try {
    const result = await getPortalContext(requestId, t, ip);
    return res.status(200).json(result);
  } catch (error: any) {
    console.error('[portal-context] Error:', error);
    // Return a generic error to obfuscate exact reasons (expired/invalid etc) unless we want to map it
    const msg = error.message || 'Error loading portal context';
    return res.status(403).json({ error: msg });
  }
}
