/**
 * API Route — /api/bank-accounts/[id]
 *
 * GET   → fetch single bank account
 * PATCH → update bank account (e.g. deactivate)
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
      const account = await bankAccountsRepo.getBankAccountById(id);
      if (!account) {
        return res.status(404).json({ error: 'Account not found' });
      }
      return res.status(200).json({ account });
    }

    if (req.method === 'PATCH') {
      const account = await bankAccountsRepo.updateBankAccount(
        id,
        req.body ?? {}
      );
      return res.status(200).json({ account });
    }

    res.setHeader('Allow', ['GET', 'PATCH']);
    return res.status(405).end();
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : 'Internal server error';
    console.error('[/api/bank-accounts/[id]] Error:', message);
    return res.status(500).json({ error: message });
  }
}
