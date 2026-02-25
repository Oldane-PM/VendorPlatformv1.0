/**
 * API Route — /api/bank-accounts
 *
 * GET  → list all bank accounts
 * POST → create a new bank account
 */
import type { NextApiRequest, NextApiResponse } from 'next';
import * as bankAccountsRepo from '@/lib/supabase/repos/bankAccounts.repo';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    if (req.method === 'GET') {
      const accounts = await bankAccountsRepo.listBankAccounts();
      return res.status(200).json({ accounts });
    }

    if (req.method === 'POST') {
      const {
        bank_name,
        account_name,
        currency,
        last_four_digits,
        current_balance,
        card_color,
        account_type,
        purpose,
        card_brand,
        notes,
      } = req.body ?? {};

      if (!bank_name || !account_name || !currency || !last_four_digits) {
        return res.status(400).json({
          error:
            'bank_name, account_name, currency, and last_four_digits are required',
        });
      }

      const account = await bankAccountsRepo.createBankAccount({
        bank_name,
        account_name,
        currency,
        last_four_digits,
        current_balance: current_balance ?? 0,
        card_color: card_color ?? 'blue',
        account_type: account_type ?? 'Checking',
        purpose: purpose ?? 'Operations',
        card_brand: card_brand ?? 'unknown',
        notes: notes ?? undefined,
      });

      return res.status(201).json({ account });
    }

    res.setHeader('Allow', ['GET', 'POST']);
    return res.status(405).end();
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : 'Internal server error';
    console.error('[/api/bank-accounts] Error:', message);
    return res.status(500).json({ error: message });
  }
}
