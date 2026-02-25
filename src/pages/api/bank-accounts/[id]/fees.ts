/**
 * API Route — /api/bank-accounts/[id]/fees
 *
 * GET → list fees for a bank account
 */
import type { NextApiRequest, NextApiResponse } from 'next';
import * as bankAccountsRepo from '@/lib/supabase/repos/bankAccounts.repo';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { id } = req.query;
  if (typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid account ID' });
  }

  try {
    if (req.method === 'GET') {
      const fees = await bankAccountsRepo.listFees(id);
      return res.status(200).json({ fees });
    }

    res.setHeader('Allow', ['GET']);
    return res.status(405).end();
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : 'Internal server error';
    console.error('[/api/bank-accounts/[id]/fees] Error:', message);
    return res.status(500).json({ error: message });
  }
}
