/**
 * POST /api/vendor-upload/work-order/[requestId]/create-upload-url?t=<token>
 *
 * Public route — generates a signed upload URL for Supabase Storage.
 */
import type { NextApiRequest, NextApiResponse } from 'next';
import { createSignedUploadUrl } from '@/lib/supabase/repos/workOrderUploadRepo';

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

    const { fileName, mimeType, sizeBytes, docType } = req.body ?? {};
    if (!fileName || !mimeType || !sizeBytes || !docType) {
      return res
        .status(400)
        .json({
          error: 'fileName, mimeType, sizeBytes, and docType are required.',
        });
    }

    const ip =
      (req.headers['x-forwarded-for'] as string)?.split(',')[0] ??
      req.socket.remoteAddress ??
      undefined;

    const result = await createSignedUploadUrl(
      requestId,
      token,
      { fileName, mimeType, sizeBytes, docType },
      ip
    );

    return res.status(200).json({ data: result });
  } catch (err: any) {
    console.error('[portal/create-upload-url]', err?.message);
    const status = err?.message?.includes('not allowed') ? 400 : 403;
    return res.status(status).json({ error: err?.message ?? 'Access denied.' });
  }
}
