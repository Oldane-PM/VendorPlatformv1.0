import { NextApiRequest, NextApiResponse } from 'next';
import { createUploadLink } from '../../../../lib/supabase/repos/workOrderQuotePortalRepo';
import { getRequestContext } from '../../../../lib/auth/getRequestContext';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    return handlePost(req, res);
  }
  res.setHeader('Allow', ['POST']);
  res.status(405).json({ error: `Method ${req.method} Not Allowed` });
}

async function handlePost(req: NextApiRequest, res: NextApiResponse) {
  let ctx;
  try {
    ctx = await getRequestContext(req);
  } catch (err: any) {
    return res.status(401).json({ error: err.message || 'Unauthorized' });
  }

  const { workOrderId } = req.query;

  if (!workOrderId || typeof workOrderId !== 'string') {
    return res.status(400).json({ error: 'Missing work order ID' });
  }

  const { expiresInHours, allowedDocTypes, maxFiles, maxTotalBytes } = req.body;

  try {
    const result = await createUploadLink(ctx.orgId, ctx.userId, workOrderId, {
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
