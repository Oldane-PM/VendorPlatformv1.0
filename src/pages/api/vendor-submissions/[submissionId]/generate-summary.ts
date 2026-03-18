import type { NextApiRequest, NextApiResponse } from 'next';
import { generateVendorSummary } from '@/lib/server/services/aiSummaryService';
import { createServerClient } from '@/lib/supabase/server';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ data: null, error: 'Method not allowed' });
  }

  const { submissionId } = req.query;
  if (!submissionId || typeof submissionId !== 'string') {
    return res.status(400).json({ data: null, error: 'Missing submissionId.' });
  }

  try {
    // 1. Generate the summary using the AI service
    const summaryText = await generateVendorSummary(submissionId);

    // 2. Save the summary to the correct table (work_order_vendor_submissions)
    const supabase = createServerClient();
    const { data, error } = await supabase
      .from('work_order_vendor_submissions')
      .update({ ai_summary: summaryText })
      .eq('id', submissionId)
      .select()
      .single();

    if (error) {
      return res.status(500).json({ data: null, error: error.message });
    }

    return res.status(200).json({ data, error: null });
  } catch (err: any) {
    console.error('Error generating AI summary:', err);
    return res.status(500).json({ data: null, error: err.message || 'Failed to generate summary' });
  }
}
