/**
 * GET /api/vendor-upload/work-order/[requestId]/status?t=<token>
 *
 * Public route — no auth session required. Validates via token.
 */
import type { NextApiRequest, NextApiResponse } from 'next';
import { getPortalStatus } from '@/lib/supabase/repos/workOrderUploadRepo';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).end();
  }

  try {
    const requestId = req.query.requestId as string;
    const token = req.query.t as string;

    if (!requestId || !token) {
      return res.status(400).json({ error: 'Missing request ID or token.' });
    }

    const ip =
      (req.headers['x-forwarded-for'] as string)?.split(',')[0] ??
      req.socket.remoteAddress ??
      undefined;

    const data = await getPortalStatus(requestId, token, ip);
    return res.status(200).json({ data });
  } catch (err: any) {
    console.error('[portal/status]', err?.message);
    return res.status(403).json({ error: err?.message ?? 'Access denied.' });
  }
}
