import type { NextApiRequest, NextApiResponse } from 'next';
import { getPaymentDetail } from '../../../../../lib/supabase/repos/paymentProcessingRepo';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ data: null, error: 'Invalid ID' });
  }

  try {
    const { data, error } = await getPaymentDetail(id);

    if (error) {
      return res.status(500).json({ data: null, error });
    }

    if (!data) {
      return res.status(404).json({ data: null, error: 'Not found' });
    }

    return res.status(200).json({ data, error: null });
  } catch (err: any) {
    return res.status(500).json({ data: null, error: err.message });
  }
}
