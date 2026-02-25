/**
 * useBankAccounts — React hook for bank account data.
 *
 * Manages loading, error, and data states for accounts, transactions, fees.
 * Calls bankAccountsApiRepo only — no direct Supabase usage.
 */
import { useState, useEffect, useCallback } from 'react';
import * as bankAccountsApi from '@/lib/domain/bankAccounts/bankAccountsApiRepo';
import type {
  BankAccountDto,
  BankTransactionDto,
  BankFeeDto,
  CreateBankAccountPayload,
  CreateTransactionPayload,
} from '@/lib/domain/bankAccounts/bankAccountsApiRepo';

export interface UseBankAccountsReturn {
  accounts: BankAccountDto[];
  transactions: BankTransactionDto[];
  fees: BankFeeDto[];
  selectedAccountId: string | null;
  setSelectedAccountId: (id: string) => void;
  loading: boolean;
  error: string | null;
  refresh: () => void;
  createAccount: (payload: CreateBankAccountPayload) => Promise<BankAccountDto>;
  addFunds: (payload: CreateTransactionPayload) => Promise<BankTransactionDto>;
  deactivateAccount: (id: string) => Promise<BankAccountDto>;
}

export function useBankAccounts(): UseBankAccountsReturn {
  const [accounts, setAccounts] = useState<BankAccountDto[]>([]);
  const [transactions, setTransactions] = useState<BankTransactionDto[]>([]);
  const [fees, setFees] = useState<BankFeeDto[]>([]);
  const [selectedAccountId, setSelectedAccountIdState] = useState<
    string | null
  >(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ---------- Fetch accounts ----------
  const fetchAccounts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await bankAccountsApi.listAccounts();
      setAccounts(data);

      // Auto-select first account if none selected
      if (data.length > 0) {
        setSelectedAccountIdState((prev) => {
          if (prev && data.some((a) => a.id === prev)) return prev;
          return data[0].id;
        });
      }
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : 'Failed to load accounts';
      console.error('[useBankAccounts] fetch error:', msg);
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  // ---------- Fetch transactions & fees for selected account ----------
  const fetchAccountDetails = useCallback(async (accountId: string) => {
    try {
      const [txns, feeData] = await Promise.all([
        bankAccountsApi.listTransactions(accountId),
        bankAccountsApi.listFees(accountId),
      ]);
      setTransactions(txns);
      setFees(feeData);
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : 'Failed to load account details';
      console.error('[useBankAccounts] detail error:', msg);
      setError(msg);
    }
  }, []);

  // ---------- Lifecycle ----------
  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  useEffect(() => {
    if (selectedAccountId) {
      fetchAccountDetails(selectedAccountId);
    }
  }, [selectedAccountId, fetchAccountDetails]);

  // ---------- Mutations ----------
  const setSelectedAccountId = useCallback((id: string) => {
    setSelectedAccountIdState(id);
  }, []);

  const createAccount = useCallback(
    async (payload: CreateBankAccountPayload): Promise<BankAccountDto> => {
      const created = await bankAccountsApi.createAccount(payload);
      setAccounts((prev) => [...prev, created]);
      setSelectedAccountIdState(created.id);
      return created;
    },
    []
  );

  const addFunds = useCallback(
    async (payload: CreateTransactionPayload): Promise<BankTransactionDto> => {
      if (!selectedAccountId) throw new Error('No account selected');
      const txn = await bankAccountsApi.createTransaction(
        selectedAccountId,
        payload
      );
      setTransactions((prev) => [txn, ...prev]);
      // Refresh accounts to get updated balance
      fetchAccounts();
      return txn;
    },
    [selectedAccountId, fetchAccounts]
  );

  const deactivateAccount = useCallback(
    async (id: string): Promise<BankAccountDto> => {
      const updated = await bankAccountsApi.updateAccount(id, {
        status: 'inactive',
      });
      setAccounts((prev) => prev.map((a) => (a.id === id ? updated : a)));
      return updated;
    },
    []
  );

  const refresh = useCallback(() => {
    fetchAccounts();
    if (selectedAccountId) {
      fetchAccountDetails(selectedAccountId);
    }
  }, [fetchAccounts, fetchAccountDetails, selectedAccountId]);

  return {
    accounts,
    transactions,
    fees,
    selectedAccountId,
    setSelectedAccountId,
    loading,
    error,
    refresh,
    createAccount,
    addFunds,
    deactivateAccount,
  };
}
