import { NextApiRequest, NextApiResponse } from 'next';
import { createInvoiceUploadLink } from '../../../../lib/supabase/repos/engagementInvoicePortalRepo';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    return handlePost(req, res);
  }
  res.setHeader('Allow', ['POST']);
  res.status(405).json({ error: `Method ${req.method} Not Allowed` });
}

async function handlePost(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Missing engagement ID' });
  }

  const { vendorId, expiresInHours, maxFiles, maxTotalBytes } = req.body;

  if (!vendorId) {
    return res
      .status(400)
      .json({ error: 'Missing vendorId for Invoice portal.' });
  }

  // We are not enforcing explicit auth verification here, relying on the internal architecture logic matching
  const orgId = '00000000-0000-0000-0000-000000000001';
  const userId = '00000000-0000-0000-0000-000000000000';

  try {
    const result = await createInvoiceUploadLink(orgId, userId, id, vendorId, {
      expiresInHours: expiresInHours ?? 72,
      maxFiles: maxFiles ?? 10,
      maxTotalBytes: maxTotalBytes ?? 50 * 1024 * 1024,
    });
    return res.status(200).json(result);
  } catch (error: any) {
    console.error('[invoice-upload-link] Error generating link:', error);
    return res
      .status(500)
      .json({ error: error.message || 'Failed to generate link' });
  }
}
