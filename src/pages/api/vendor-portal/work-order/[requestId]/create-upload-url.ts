import { NextApiRequest, NextApiResponse } from 'next';
import { createSignedUploadUrl } from '@/lib/supabase/repos/workOrderVendorPortalRepo';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    return handlePost(req, res);
  }
  res.setHeader('Allow', ['POST']);
  res.status(405).json({ error: `Method ${req.method} Not Allowed` });
}

async function handlePost(req: NextApiRequest, res: NextApiResponse) {
  const { requestId, t } = req.query;

  if (!requestId || typeof requestId !== 'string') {
    return res.status(400).json({ error: 'Missing request ID' });
  }

  if (!t || typeof t !== 'string') {
    return res.status(401).json({ error: 'Missing token' });
  }

  const { submissionId, fileMeta } = req.body;

  if (!submissionId || !fileMeta) {
    return res
      .status(400)
      .json({ error: 'Missing submission_id or file_meta' });
  }

  try {
    const result = await createSignedUploadUrl(
      requestId,
      t,
      submissionId,
      fileMeta
    );
    return res.status(200).json(result);
  } catch (error: any) {
    console.error('[portal-upload-url] Error:', error);
    const msg = error.message || 'Failed to generate upload URL';
    return res.status(400).json({ error: msg });
  }
}
