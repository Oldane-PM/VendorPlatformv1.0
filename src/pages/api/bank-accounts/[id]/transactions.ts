/**
 * API Route — /api/bank-accounts/[id]/transactions
 *
 * GET  → list transactions for a bank account
 * POST → create a new transaction (e.g. add funds)
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
      const transactions = await bankAccountsRepo.listTransactions(id);
      return res.status(200).json({ transactions });
    }

    if (req.method === 'POST') {
      const {
        type,
        amount,
        vendor,
        fee_amount,
        exchange_rate,
        balance_after,
        currency,
        receipt_uploaded,
        funding_source,
        fee_type,
        reference_number,
        notes,
        date,
      } = req.body ?? {};

      if (!type || amount === undefined) {
        return res.status(400).json({ error: 'type and amount are required' });
      }

      const transaction = await bankAccountsRepo.createTransaction({
        bank_account_id: id,
        date,
        type,
        vendor,
        amount,
        fee_amount,
        exchange_rate,
        balance_after,
        currency,
        receipt_uploaded,
        funding_source,
        fee_type,
        reference_number,
        notes,
      });

      return res.status(201).json({ transaction });
    }

    res.setHeader('Allow', ['GET', 'POST']);
    return res.status(405).end();
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : 'Internal server error';
    console.error('[/api/bank-accounts/[id]/transactions] Error:', message);
    return res.status(500).json({ error: message });
  }
}
