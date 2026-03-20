import { NextApiRequest, NextApiResponse } from 'next';
import { confirmSubmission } from '@/lib/supabase/repos/workOrderQuotePortalRepo';

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

  const { submissionId } = req.body;
  if (!submissionId) {
    return res.status(400).json({ error: 'Missing submission ID' });
  }

  try {
    const result = await confirmSubmission(requestId, t, submissionId);
    return res.status(200).json(result);
  } catch (error: any) {
    console.error('[portal-confirm] Error:', error);
    const msg = error.message || 'Error confirming submission';
    return res.status(400).json({ error: msg });
  }
}
