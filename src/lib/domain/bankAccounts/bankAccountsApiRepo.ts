/**
 * bankAccountsApiRepo — frontend data-access layer for bank accounts.
 *
 * Calls Next.js API routes only. No Supabase imports.
 */

/* ------------------------------------------------------------------ */
/*  DTOs                                                               */
/* ------------------------------------------------------------------ */

export interface BankAccountDto {
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

export interface BankTransactionDto {
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

export interface BankFeeDto {
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

export interface CreateBankAccountPayload {
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

export interface CreateTransactionPayload {
  type: string;
  amount: number;
  date?: string;
  vendor?: string;
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
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

async function apiFetch<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json', ...init?.headers },
    ...init,
  });

  const json = await res.json();

  if (!res.ok) {
    throw new Error(json.error ?? `API error ${res.status}`);
  }

  return json as T;
}

/* ------------------------------------------------------------------ */
/*  Bank Accounts                                                      */
/* ------------------------------------------------------------------ */

export async function listAccounts(): Promise<BankAccountDto[]> {
  const data = await apiFetch<{ accounts: BankAccountDto[] }>(
    '/api/bank-accounts'
  );
  return data.accounts;
}

export async function getAccount(id: string): Promise<BankAccountDto | null> {
  try {
    const data = await apiFetch<{ account: BankAccountDto }>(
      `/api/bank-accounts/${id}`
    );
    return data.account;
  } catch (err: unknown) {
    if (err instanceof Error && err.message.includes('404')) return null;
    throw err;
  }
}

export async function createAccount(
  payload: CreateBankAccountPayload
): Promise<BankAccountDto> {
  const data = await apiFetch<{ account: BankAccountDto }>(
    '/api/bank-accounts',
    {
      method: 'POST',
      body: JSON.stringify(payload),
    }
  );
  return data.account;
}

export async function updateAccount(
  id: string,
  payload: Record<string, unknown>
): Promise<BankAccountDto> {
  const data = await apiFetch<{ account: BankAccountDto }>(
    `/api/bank-accounts/${id}`,
    {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }
  );
  return data.account;
}

/* ------------------------------------------------------------------ */
/*  Transactions                                                       */
/* ------------------------------------------------------------------ */

export async function listTransactions(
  accountId: string
): Promise<BankTransactionDto[]> {
  const data = await apiFetch<{ transactions: BankTransactionDto[] }>(
    `/api/bank-accounts/${accountId}/transactions`
  );
  return data.transactions;
}

export async function createTransaction(
  accountId: string,
  payload: CreateTransactionPayload
): Promise<BankTransactionDto> {
  const data = await apiFetch<{ transaction: BankTransactionDto }>(
    `/api/bank-accounts/${accountId}/transactions`,
    {
      method: 'POST',
      body: JSON.stringify(payload),
    }
  );
  return data.transaction;
}

/* ------------------------------------------------------------------ */
/*  Fees                                                               */
/* ------------------------------------------------------------------ */

export async function listFees(accountId: string): Promise<BankFeeDto[]> {
  const data = await apiFetch<{ fees: BankFeeDto[] }>(
    `/api/bank-accounts/${accountId}/fees`
  );
  return data.fees;
}
