/**
 * POST /api/upload-requests/work-order/[requestId]/revoke
 */
import type { NextApiRequest, NextApiResponse } from 'next';
import { getRequestContext } from '@/lib/auth/getRequestContext';
import { revokeRequest } from '@/lib/supabase/repos/workOrderUploadRepo';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end();
  }

  try {
    const ctx = await getRequestContext(req);
    const requestId = req.query.requestId as string;

    if (!requestId) {
      return res.status(400).json({ error: 'Request ID is required.' });
    }

    await revokeRequest(ctx.orgId, requestId, ctx.userId);

    return res.status(200).json({ success: true });
  } catch (err: any) {
    console.error('[revoke]', err?.message);
    const status = err?.message?.includes('Unauthorized') ? 401 : 500;
    return res.status(status).json({ error: err?.message ?? 'Server error' });
  }
}
