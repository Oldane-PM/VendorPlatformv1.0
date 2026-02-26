/**
 * POST /api/vendor-upload/work-order/[requestId]/finalize?t=<token>
 *
 * Public route — finalises an uploaded file (creates document + links).
 */
import type { NextApiRequest, NextApiResponse } from 'next';
import { finalizeUpload } from '@/lib/supabase/repos/workOrderUploadRepo';

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

    const { uploadFileId, sha256, sizeBytes } = req.body ?? {};
    if (!uploadFileId) {
      return res.status(400).json({ error: 'uploadFileId is required.' });
    }

    const result = await finalizeUpload(requestId, token, uploadFileId, {
      sha256,
      sizeBytes,
    });

    return res.status(200).json(result);
  } catch (err: any) {
    console.error('[portal/finalize]', err?.message);
    return res.status(403).json({ error: err?.message ?? 'Access denied.' });
  }
}
