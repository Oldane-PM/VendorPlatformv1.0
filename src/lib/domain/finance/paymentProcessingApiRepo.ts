export interface PaymentQueueItemDto {
  id: string; // invoice id
  invoice_number: string;
  vendor_name: string;
  engagement_id: string;
  amount: number;
  status: string; // 'submitted'|'approved'|'scheduled'|'paid'|'outstanding'|'overdue'
  due_date: string | null;
  submitted_date: string | null;
  created_at: string;
}

export interface PaymentProcessingDetailDto extends PaymentQueueItemDto {
  bank_transaction_id?: string | null;
  bank_account_id?: string | null;
  payment_method?: string | null;
  payment_date?: string | null;
  reference_number?: string | null;
  notes?: string | null;
  exchange_rate_variance?: number;
  bank_transfer_fee?: number;
  gct_on_transaction?: number;
  other_fees?: number;
}

export interface MarkAsPaidRequestDto {
  bankAccountId: string;
  paymentMethod: string;
  paymentDate: string;
  referenceNumber: string;
  notes: string;
  amount: number;
  fees?: {
    exchangeRateVariance?: number;
    bankTransferFee?: number;
    gctOnTransaction?: number;
    otherFees?: number;
  };
}

export async function fetchPaymentQueue(): Promise<{
  data: PaymentQueueItemDto[] | null;
  error: string | null;
}> {
  try {
    const res = await fetch('/api/finance/payment-processing');
    if (!res.ok) {
      const err = await res.json();
      return {
        data: null,
        error: err.error || 'Failed to fetch payment queue',
      };
    }
    return await res.json();
  } catch (error: any) {
    return { data: null, error: error.message };
  }
}

export async function fetchPaymentDetail(
  id: string
): Promise<{ data: PaymentProcessingDetailDto | null; error: string | null }> {
  try {
    const res = await fetch(`/api/finance/payment-processing/${id}`);
    if (!res.ok) {
      const err = await res.json();
      return {
        data: null,
        error: err.error || 'Failed to fetch payment detail',
      };
    }
    return await res.json();
  } catch (error: any) {
    return { data: null, error: error.message };
  }
}

export async function postMarkAsPaid(
  id: string,
  data: MarkAsPaidRequestDto
): Promise<{ success: boolean; error: string | null }> {
  try {
    const res = await fetch(`/api/finance/payment-processing/${id}/pay`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      return { success: false, error: err.error || 'Failed to mark as paid' };
    }
    return await res.json();
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
