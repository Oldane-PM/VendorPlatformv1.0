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
  account_type: string;
  purpose: string;
  status: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export async function fetchBankAccounts(): Promise<{
  data: BankAccountDto[] | null;
  error: string | null;
}> {
  try {
    const res = await fetch('/api/finance/bank-accounts');
    if (!res.ok) {
      const err = await res.json();
      return {
        data: null,
        error: err.error || 'Failed to fetch bank accounts',
      };
    }
    return await res.json();
  } catch (error: any) {
    return { data: null, error: error.message };
  }
}
