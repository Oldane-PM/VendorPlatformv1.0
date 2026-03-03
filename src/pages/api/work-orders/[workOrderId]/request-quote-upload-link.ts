import { NextApiRequest, NextApiResponse } from 'next';
import { createUploadLink } from '../../../../lib/supabase/repos/workOrderQuotePortalRepo';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    return handlePost(req, res);
  }
  res.setHeader('Allow', ['POST']);
  res.status(405).json({ error: `Method ${req.method} Not Allowed` });
}

async function handlePost(req: NextApiRequest, res: NextApiResponse) {
  const { workOrderId } = req.query;

  if (!workOrderId || typeof workOrderId !== 'string') {
    return res.status(400).json({ error: 'Missing work order ID' });
  }

  // We are not enforcing auth via session right here assuming internal route for simplicity right now
  const orgId = '00000000-0000-0000-0000-000000000001';
  const userId = '00000000-0000-0000-0000-000000000000';

  const { expiresInHours, allowedDocTypes, maxFiles, maxTotalBytes } = req.body;

  try {
    const result = await createUploadLink(orgId, userId, workOrderId, {
      expiresInHours: expiresInHours ?? 72,
      allowedDocTypes: allowedDocTypes ?? ['quote', 'supporting'],
      maxFiles: maxFiles ?? 10,
      maxTotalBytes: maxTotalBytes ?? 50 * 1024 * 1024,
    });
    return res.status(200).json(result);
  } catch (error: any) {
    console.error('[quote-upload-link] Error generating link:', error);
    return res
      .status(500)
      .json({ error: error.message || 'Failed to generate link' });
  }
}
