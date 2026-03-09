import type { NextApiRequest, NextApiResponse } from 'next';
import { awardSubmission } from '../../../../lib/supabase/repos/workOrderQuotePortalRepo';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end();
  }

  const { submissionId } = req.query;

  if (!submissionId || typeof submissionId !== 'string') {
    return res
      .status(400)
      .json({ data: null, error: 'Submission ID is required.' });
  }

  const { workOrderId, engagementId } = req.body ?? {};

  if (!workOrderId) {
    return res
      .status(400)
      .json({ data: null, error: 'workOrderId is required.' });
  }

  try {
    const data = await awardSubmission({
      submissionId,
      workOrderId,
      engagementId: engagementId ?? null,
    });
    return res.status(201).json({ data, error: null });
  } catch (error: any) {
    return res.status(500).json({ data: null, error: error.message });
  }
}
