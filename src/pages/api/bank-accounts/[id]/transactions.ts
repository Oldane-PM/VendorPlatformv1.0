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

      // 1. Fetch current account to get balance
      const account = await bankAccountsRepo.getBankAccountById(id);
      if (!account) {
        return res.status(404).json({ error: 'Account not found' });
      }

      const numAmount = parseFloat(amount) || 0;
      const numFee = parseFloat(fee_amount) || 0;
      const currentBalance = parseFloat(String(account.current_balance)) || 0;

      // 2. Compute new balance based on transaction type
      let newBalance: number;
      if (type === 'Funding') {
        newBalance = currentBalance + numAmount - numFee;
      } else {
        // Payment or Fee — amount should be negative or we subtract
        newBalance = currentBalance + numAmount; // amount is already negative for payments
      }

      // 3. Create the transaction with correct balance_after
      const transaction = await bankAccountsRepo.createTransaction({
        bank_account_id: id,
        date,
        type,
        vendor,
        amount: numAmount,
        fee_amount: numFee,
        exchange_rate,
        balance_after: newBalance,
        currency,
        receipt_uploaded,
        funding_source,
        fee_type,
        reference_number,
        notes,
      });

      // 4. Update the account balance (and last_funding for Funding transactions)
      const updatePayload: Record<string, unknown> = {
        current_balance: newBalance,
      };
      if (type === 'Funding') {
        updatePayload.last_funding =
          date || new Date().toISOString().split('T')[0];
      }
      await bankAccountsRepo.updateBankAccount(id, updatePayload);

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
