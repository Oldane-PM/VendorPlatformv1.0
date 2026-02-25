import { useState, useCallback, useEffect } from 'react';
import {
  fetchPaymentQueue,
  fetchPaymentDetail,
  postMarkAsPaid,
  PaymentQueueItemDto,
  PaymentProcessingDetailDto,
  MarkAsPaidRequestDto,
} from '@/lib/domain/finance/paymentProcessingApiRepo';
import {
  fetchBankAccounts,
  BankAccountDto,
} from '@/lib/domain/finance/bankAccountsApiRepo';

interface PaymentProcessingSummary {
  totalPendingAmount: number;
  pendingCount: number;
  completedCount: number;
  totalProcessedAmount: number;
}

interface UsePaymentProcessingReturn {
  items: PaymentQueueItemDto[];
  summary: PaymentProcessingSummary | null;
  bankAccounts: BankAccountDto[];
  isLoading: boolean;
  error: string | null;
  selectedItemDetail: PaymentProcessingDetailDto | null;
  isDetailLoading: boolean;
  detailError: string | null;
  refetch: () => Promise<void>;
  fetchDetail: (id: string) => Promise<void>;
  markAsPaid: (id: string, data: MarkAsPaidRequestDto) => Promise<boolean>;
}

export function usePaymentProcessing(): UsePaymentProcessingReturn {
  const [items, setItems] = useState<PaymentQueueItemDto[]>([]);
  const [summary, setSummary] = useState<PaymentProcessingSummary | null>(null);
  const [bankAccounts, setBankAccounts] = useState<BankAccountDto[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedItemDetail, setSelectedItemDetail] =
    useState<PaymentProcessingDetailDto | null>(null);
  const [isDetailLoading, setIsDetailLoading] = useState<boolean>(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  const calculateSummary = (data: PaymentQueueItemDto[]) => {
    let pendingCount = 0;
    let pendingAmount = 0;
    let completedCount = 0;
    let processedAmount = 0;

    data.forEach((item) => {
      // In our UI mapped terms
      const status = item.status;
      if (
        status === 'approved' ||
        status === 'scheduled' ||
        status === 'submitted'
      ) {
        // treating submitted as draft/pending
        pendingCount++;
        pendingAmount += Number(item.amount);
      } else if (status === 'paid') {
        completedCount++;
        processedAmount += Number(item.amount);
      }
    });

    setSummary({
      totalPendingAmount: pendingAmount,
      pendingCount,
      completedCount,
      totalProcessedAmount: processedAmount,
    });
  };

  const refetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    const [queueRes, accountsRes] = await Promise.all([
      fetchPaymentQueue(),
      fetchBankAccounts(),
    ]);

    if (queueRes.error) {
      setError(queueRes.error);
      setItems([]);
      setSummary(null);
    } else {
      setItems(queueRes.data || []);
      calculateSummary(queueRes.data || []);
    }

    if (accountsRes.error) {
      console.error('Failed to fetch bank accounts', accountsRes.error);
    } else {
      setBankAccounts(accountsRes.data || []);
    }

    setIsLoading(false);
  }, []);

  const fetchDetail = useCallback(async (id: string) => {
    setIsDetailLoading(true);
    setDetailError(null);
    setSelectedItemDetail(null);

    const { data, error } = await fetchPaymentDetail(id);

    if (error) {
      setDetailError(error);
    } else {
      setSelectedItemDetail(data);
    }

    setIsDetailLoading(false);
  }, []);

  const markAsPaid = useCallback(
    async (id: string, data: MarkAsPaidRequestDto) => {
      const { success, error: backendError } = await postMarkAsPaid(id, data);
      if (!success) {
        setError(backendError || 'Failed to mark as paid');
        return false;
      }

      // Refresh queue & banks to get updated balances
      await refetch();
      return true;
    },
    [refetch]
  );

  useEffect(() => {
    refetch();
  }, [refetch]);

  return {
    items,
    summary,
    bankAccounts,
    isLoading,
    error,
    selectedItemDetail,
    isDetailLoading,
    detailError,
    refetch,
    fetchDetail,
    markAsPaid,
  };
}
