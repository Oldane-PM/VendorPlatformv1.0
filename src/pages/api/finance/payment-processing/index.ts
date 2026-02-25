import type { NextApiRequest, NextApiResponse } from 'next';
import { listPaymentQueue } from '../../../../lib/supabase/repos/paymentProcessingRepo';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    const { data, error } = await listPaymentQueue();

    if (error) {
      return res.status(500).json({ data: null, error });
    }

    return res.status(200).json({ data, error: null });
  } catch (err: any) {
    return res.status(500).json({ data: null, error: err.message });
  }
}
