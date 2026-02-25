import 'server-only';
import { createServerClient } from '../server';

export interface PaymentProcessingItemRow {
  id: string; // invoice.id
  invoice_number: string;
  vendor_name: string;
  engagement_id: string;
  amount: number;
  status: string; // 'submitted'|'approved'|'scheduled'|'paid'|'outstanding'|'overdue'
  due_date: string | null;
  submitted_date: string | null;
  created_at: string;
}

export interface PaymentProcessingDetailRow extends PaymentProcessingItemRow {
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

export async function listPaymentQueue(): Promise<{
  data: PaymentProcessingItemRow[] | null;
  error: string | null;
}> {
  const sb = createServerClient();

  // We fetch pending invoices and paid invoices
  // In our system, valid invoice statuses are: 'submitted','approved','scheduled','paid','outstanding','overdue'
  // The UI maps:
  // 'Pending Payment' <- 'approved' or 'scheduled'
  // 'Completed' <- 'paid'
  // 'Draft' <- 'submitted'
  const { data, error } = await sb
    .from('engagement_invoices')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[paymentProcessingRepo] listPaymentQueue error:', error);
    return { data: null, error: error.message };
  }

  return { data, error: null };
}

export async function getPaymentDetail(id: string): Promise<{
  data: PaymentProcessingDetailRow | null;
  error: string | null;
}> {
  const sb = createServerClient();

  // Fetch the invoice
  const { data: invoice, error: invoiceError } = await sb
    .from('engagement_invoices')
    .select('*')
    .eq('id', id)
    .single();

  if (invoiceError || !invoice) {
    console.error(
      '[paymentProcessingRepo] getPaymentDetail invoice error:',
      invoiceError
    );
    return { data: null, error: invoiceError?.message || 'Invoice not found' };
  }

  let detail: PaymentProcessingDetailRow = {
    ...invoice,
  };

  // If paid, try to fetch the associated bank transaction
  if (invoice.status === 'paid') {
    // Assuming we store the invoice id in 'reference_number' or 'notes' for this simple association,
    // or we fetch the most recent transaction for this vendor with matching amount.
    // Ideally, we'd have an 'invoice_id' on bank_transactions.
    // For now, we will look for a payment transaction where reference_number contains the invoice id or invoice number.
    const { data: txns, error: txnError } = await sb
      .from('bank_transactions')
      .select('*')
      .eq('type', 'Payment')
      .eq('amount', invoice.amount) // match amount
      .ilike('reference_number', `%${invoice.invoice_number}%`)
      .order('transaction_date', { ascending: false })
      .limit(1);

    if (!txnError && txns && txns.length > 0) {
      const txn = txns[0];
      detail.bank_transaction_id = txn.id;
      detail.bank_account_id = txn.bank_account_id;
      detail.payment_date = txn.transaction_date;
      detail.reference_number = txn.reference_number;
      detail.notes = txn.notes;
      detail.payment_method = 'Bank Transfer'; // default assumption

      // Fetch fees if any
      const { data: fees } = await sb
        .from('bank_fees')
        .select('*')
        .eq('bank_transaction_id', txn.id);

      if (fees && fees.length > 0) {
        detail.exchange_rate_variance =
          fees.find((f: any) => f.fee_type === 'Exchange Variance')?.amount ||
          0;
        detail.bank_transfer_fee =
          fees.find((f: any) => f.fee_type === 'Transfer Fee')?.amount || 0;
      }
    }
  }

  return { data: detail, error: null };
}

export async function markInvoiceAsPaid(
  invoiceId: string,
  paymentDetails: {
    bankAccountId: string;
    paymentMethod: string;
    paymentDate: string;
    referenceNumber: string;
    notes: string;
    amount: number;
    completionUser?: string;
    fees?: {
      exchangeRateVariance?: number;
      bankTransferFee?: number;
      gctOnTransaction?: number;
      otherFees?: number;
    };
  }
): Promise<{ success: boolean; error: string | null }> {
  const sb = createServerClient();

  // 1. Update Invoice Status
  const { error: invoiceError } = await sb
    .from('engagement_invoices')
    .update({
      status: 'paid',
      paid_date: paymentDetails.paymentDate,
    })
    .eq('id', invoiceId);

  if (invoiceError) {
    console.error(
      '[paymentProcessingRepo] update invoice error:',
      invoiceError
    );
    return { success: false, error: invoiceError.message };
  }

  // Fetch invoice details for the transaction record
  const { data: invoice } = await sb
    .from('engagement_invoices')
    .select('invoice_number, vendor_name')
    .eq('id', invoiceId)
    .single();

  const referenceStr = invoice
    ? `INV-${invoice.invoice_number} | ${paymentDetails.referenceNumber}`
    : paymentDetails.referenceNumber;

  // 2. Create Bank Transaction
  const { data: txn, error: txnError } = await sb
    .from('bank_transactions')
    .insert({
      bank_account_id: paymentDetails.bankAccountId,
      transaction_date: paymentDetails.paymentDate,
      type: 'Payment',
      vendor: invoice?.vendor_name || 'Unknown Vendor',
      amount: paymentDetails.amount,
      reference_number: referenceStr,
      notes: paymentDetails.notes,
    })
    .select('id')
    .single();

  if (txnError) {
    console.error('[paymentProcessingRepo] insert bank_txn error:', txnError);
    // Note: in a real system we'd use a transaction/RPC to rollback the invoice update if this fails
    return { success: false, error: txnError.message };
  }

  // 3. Insert Fees if any
  if (paymentDetails.fees && txn) {
    const feeInserts = [];

    if (paymentDetails.fees.exchangeRateVariance) {
      feeInserts.push({
        bank_account_id: paymentDetails.bankAccountId,
        bank_transaction_id: txn.id,
        transaction_date: paymentDetails.paymentDate,
        transaction_type: 'Payment',
        fee_type: 'Exchange Variance',
        amount: paymentDetails.fees.exchangeRateVariance,
      });
    }

    if (paymentDetails.fees.bankTransferFee) {
      feeInserts.push({
        bank_account_id: paymentDetails.bankAccountId,
        bank_transaction_id: txn.id,
        transaction_date: paymentDetails.paymentDate,
        transaction_type: 'Payment',
        fee_type: 'Transfer Fee',
        amount: paymentDetails.fees.bankTransferFee,
      });
    }

    if (feeInserts.length > 0) {
      const { error: feeError } = await sb.from('bank_fees').insert(feeInserts);
      if (feeError) {
        console.error(
          '[paymentProcessingRepo] insert bank_fees error:',
          feeError
        );
        // We still return true because payment was recorded, but log the error
      }
    }
  }

  return { success: true, error: null };
}
