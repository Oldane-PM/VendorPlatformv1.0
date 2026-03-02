import { NextApiRequest, NextApiResponse } from 'next';
import { resolveVendorForSubmission } from '@/lib/supabase/repos/workOrderVendorPortalRepo';
import { getRequestContext } from '@/lib/auth/getRequestContext';

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

  const { submissionId } = req.query;
  if (!submissionId || typeof submissionId !== 'string') {
    return res.status(400).json({ error: 'Missing submission ID' });
  }

  try {
    const result = await resolveVendorForSubmission(
      ctx.orgId,
      submissionId,
      ctx.userId
    );

    return res.status(200).json(result);
  } catch (error: any) {
    console.error('[resolve-vendor] Error:', error);
    return res
      .status(500)
      .json({ error: error.message || 'Internal Server Error' });
  }
}
