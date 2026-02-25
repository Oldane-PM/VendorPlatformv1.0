import type { NextApiRequest, NextApiResponse } from 'next';
import { updateAiSummary } from '@/lib/supabase/repos/vendorSubmissions.repo';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ data: null, error: 'Method not allowed' });
  }

  const { submissionId } = req.query;
  if (!submissionId || typeof submissionId !== 'string') {
    return res.status(400).json({ data: null, error: 'Missing submissionId.' });
  }

  const { ai_summary } = req.body;
  if (typeof ai_summary !== 'string') {
    return res
      .status(400)
      .json({ data: null, error: 'ai_summary must be a string.' });
  }

  const { data, error } = await updateAiSummary(submissionId, ai_summary);

  if (error) {
    return res.status(500).json({ data: null, error });
  }

  return res.status(200).json({ data, error: null });
}
