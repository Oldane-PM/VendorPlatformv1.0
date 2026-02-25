import type { NextApiRequest, NextApiResponse } from 'next';
import { markInvoiceAsPaid } from '../../../../../lib/supabase/repos/paymentProcessingRepo';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const { id } = req.query;
  const paymentDetails = req.body;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ success: false, error: 'Invalid ID' });
  }

  if (!paymentDetails || !paymentDetails.amount) {
    return res
      .status(400)
      .json({
        success: false,
        error: 'Payment details with amount are required',
      });
  }

  try {
    const { success, error } = await markInvoiceAsPaid(id, paymentDetails);

    if (error || !success) {
      return res.status(500).json({ success: false, error });
    }

    return res.status(200).json({ success: true, error: null });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}
