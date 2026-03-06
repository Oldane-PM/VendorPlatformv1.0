import type { NextApiRequest, NextApiResponse } from 'next';
import { updateTransaction } from '@/lib/supabase/repos/bankAccounts.repo';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'PATCH') {
    res.setHeader('Allow', ['PATCH']);
    return res.status(405).json({ error: `Method ${req.method} not allowed` });
  }

  try {
    const { transactionId } = req.query;
    if (!transactionId || typeof transactionId !== 'string') {
      return res
        .status(400)
        .json({ error: 'Missing or invalid transaction field' });
    }

    const payload = req.body;
    const updated = await updateTransaction(transactionId, payload);

    return res.status(200).json({ transaction: updated });
  } catch (error: any) {
    console.error('[API Route] update transaction error:', error);
    return res
      .status(500)
      .json({ error: error.message || 'Internal Server Error' });
  }
}
