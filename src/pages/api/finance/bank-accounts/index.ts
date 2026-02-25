import type { NextApiRequest, NextApiResponse } from 'next';
import { listBankAccounts } from '../../../../lib/supabase/repos/bankAccounts.repo';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    const { data, error } = await listBankAccounts();

    if (error) {
      return res.status(500).json({ data: null, error });
    }

    return res.status(200).json({ data, error: null });
  } catch (err: any) {
    return res.status(500).json({ data: null, error: err.message });
  }
}
