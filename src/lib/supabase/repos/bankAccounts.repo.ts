/**
 * bankAccounts.repo — all Supabase queries for bank account tables.
 *
 * This is the ONLY file that touches the DB for bank_accounts,
 * bank_transactions and bank_fees.
 */
import { createServerClient } from '../server';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface BankAccountRow {
  id: string;
  bank_name: string;
  account_name: string;
  currency: string;
  last_four_digits: string;
  current_balance: number;
  pending_payments: number;
  last_funding: string | null;
  card_color: string;
  account_type: string | null;
  purpose: string | null;
  status: string;
  card_brand: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface BankTransactionRow {
  id: string;
  bank_account_id: string;
  transaction_date: string;
  type: string;
  vendor: string | null;
  amount: number;
  fee_amount: number;
  exchange_rate: number | null;
  balance_after: number;
  currency: string;
  receipt_uploaded: boolean;
  reconciled: boolean;
  funding_source: string | null;
  fee_type: string | null;
  reference_number: string | null;
  notes: string | null;
  created_at: string;
}

export interface BankFeeRow {
  id: string;
  bank_account_id: string;
  bank_transaction_id: string | null;
  transaction_date: string;
  transaction_type: string;
  fee_type: string;
  exchange_rate_variance: number | null;
  bank_transfer_fee: number | null;
  related_payment_id: string | null;
  amount: number;
  currency: string;
  notes: string | null;
  created_at: string;
}

export interface CreateBankAccountInput {
  bank_name: string;
  account_name: string;
  currency: string;
  last_four_digits: string;
  current_balance?: number;
  card_color?: string;
  account_type?: string;
  purpose?: string;
  card_brand?: string;
  notes?: string;
}

export interface UpdateBankAccountInput {
  bank_name?: string;
  account_name?: string;
  status?: string;
  notes?: string;
  current_balance?: number;
  pending_payments?: number;
  last_funding?: string;
  card_color?: string;
}

export interface CreateTransactionInput {
  bank_account_id: string;
  date?: string;
  type: string;
  vendor?: string;
  amount: number;
  fee_amount?: number;
  exchange_rate?: number;
  balance_after?: number;
  currency?: string;
  receipt_uploaded?: boolean;
  funding_source?: string;
  fee_type?: string;
  reference_number?: string;
  notes?: string;
}

/* ------------------------------------------------------------------ */
/*  Bank Account Queries                                               */
/* ------------------------------------------------------------------ */

/** List all bank accounts ordered by creation date. */
export async function listBankAccounts(): Promise<BankAccountRow[]> {
  const supabase = createServerClient();

  const { data, error } = await supabase
    .from('bank_accounts')
    .select('*')
    .order('created_at', { ascending: true });

  if (error) {
    console.error('[bankAccounts.repo.listBankAccounts]', error);
    throw new Error(error.message);
  }

  return (data ?? []) as BankAccountRow[];
}

/** Fetch a single bank account by ID. */
export async function getBankAccountById(
  id: string
): Promise<BankAccountRow | null> {
  const supabase = createServerClient();

  const { data, error } = await supabase
    .from('bank_accounts')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) {
    console.error('[bankAccounts.repo.getBankAccountById]', error);
    throw new Error(error.message);
  }

  return data as BankAccountRow | null;
}

/** Create a new bank account. */
export async function createBankAccount(
  input: CreateBankAccountInput
): Promise<BankAccountRow> {
  const supabase = createServerClient();

  const { data, error } = await supabase
    .from('bank_accounts')
    .insert({
      bank_name: input.bank_name,
      account_name: input.account_name,
      currency: input.currency,
      last_four_digits: input.last_four_digits,
      current_balance: input.current_balance ?? 0,
      card_color: input.card_color ?? 'blue',
      account_type: input.account_type ?? 'Checking',
      purpose: input.purpose ?? 'Operations',
      card_brand: input.card_brand ?? 'unknown',
      notes: input.notes ?? null,
    })
    .select('*')
    .single();

  if (error) {
    console.error('[bankAccounts.repo.createBankAccount]', error);
    throw new Error(error.message);
  }

  return data as BankAccountRow;
}

/** Update an existing bank account. */
export async function updateBankAccount(
  id: string,
  input: UpdateBankAccountInput
): Promise<BankAccountRow> {
  const supabase = createServerClient();

  const payload: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(input)) {
    if (value !== undefined) {
      payload[key] = value;
    }
  }

  const { data, error } = await supabase
    .from('bank_accounts')
    .update(payload)
    .eq('id', id)
    .select('*')
    .single();

  if (error) {
    console.error('[bankAccounts.repo.updateBankAccount]', error);
    throw new Error(error.message);
  }

  return data as BankAccountRow;
}

/* ------------------------------------------------------------------ */
/*  Transaction Queries                                                */
/* ------------------------------------------------------------------ */

/** List transactions for a given bank account order by date descending. */
export async function listTransactions(
  accountId: string
): Promise<BankTransactionRow[]> {
  const supabase = createServerClient();

  const { data, error } = await supabase
    .from('bank_transactions')
    .select('*')
    .eq('bank_account_id', accountId)
    .order('transaction_date', { ascending: false });

  if (error) {
    console.error('[bankAccounts.repo.listTransactions]', error);
    throw new Error(error.message);
  }

  return (data ?? []) as BankTransactionRow[];
}

/** Create a new transaction. */
export async function createTransaction(
  input: CreateTransactionInput
): Promise<BankTransactionRow> {
  const supabase = createServerClient();

  const { data, error } = await supabase
    .from('bank_transactions')
    .insert({
      bank_account_id: input.bank_account_id,
      transaction_date: input.date ?? new Date().toISOString().split('T')[0],
      type: input.type,
      vendor: input.vendor ?? null,
      amount: input.amount,
      fee_amount: input.fee_amount ?? 0,
      exchange_rate: input.exchange_rate ?? null,
      balance_after: input.balance_after ?? 0,
      currency: input.currency ?? 'USD',
      receipt_uploaded: input.receipt_uploaded ?? false,
      funding_source: input.funding_source ?? null,
      fee_type: input.fee_type ?? null,
      reference_number: input.reference_number ?? null,
      notes: input.notes ?? null,
    })
    .select('*')
    .single();

  if (error) {
    console.error('[bankAccounts.repo.createTransaction]', error);
    throw new Error(error.message);
  }

  return data as BankTransactionRow;
}

/* ------------------------------------------------------------------ */
/*  Fee Queries                                                        */
/* ------------------------------------------------------------------ */

/** List fees for a given bank account. */
export async function listFees(accountId: string): Promise<BankFeeRow[]> {
  const supabase = createServerClient();

  const { data, error } = await supabase
    .from('bank_fees')
    .select('*')
    .eq('bank_account_id', accountId)
    .order('transaction_date', { ascending: false });

  if (error) {
    console.error('[bankAccounts.repo.listFees]', error);
    throw new Error(error.message);
  }

  return (data ?? []) as BankFeeRow[];
}
