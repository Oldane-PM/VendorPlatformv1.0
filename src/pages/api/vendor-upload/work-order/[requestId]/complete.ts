/**
 * POST /api/vendor-upload/work-order/[requestId]/complete?t=<token>
 *
 * Public route — marks an upload request as completed.
 */
import type { NextApiRequest, NextApiResponse } from 'next';
import { markCompleted } from '@/lib/supabase/repos/workOrderUploadRepo';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end();
  }

  try {
    const requestId = req.query.requestId as string;
    const token = req.query.t as string;

    if (!requestId || !token) {
      return res.status(400).json({ error: 'Missing request ID or token.' });
    }

    const result = await markCompleted(requestId, token);
    return res.status(200).json(result);
  } catch (err: any) {
    console.error('[portal/complete]', err?.message);
    return res.status(403).json({ error: err?.message ?? 'Access denied.' });
  }
}
