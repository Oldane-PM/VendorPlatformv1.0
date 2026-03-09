import type { NextApiRequest, NextApiResponse } from 'next';
import { getSubmissionWithFiles } from '../../../../lib/supabase/repos/workOrderQuotePortalRepo';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).end();
  }

  const { submissionId } = req.query;

  if (!submissionId || typeof submissionId !== 'string') {
    return res
      .status(400)
      .json({ data: null, error: 'Submission ID is required.' });
  }

  try {
    const data = await getSubmissionWithFiles(submissionId);
    return res.status(200).json({ data, error: null });
  } catch (error: any) {
    console.error('[vendor-submissions detail] Error:', error);
    return res.status(500).json({ data: null, error: error.message });
  }
}
