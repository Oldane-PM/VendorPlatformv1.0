/**
 * useInvoiceDetail — fetch a single invoice with files (incl. signed URLs).
 */
import { useState, useEffect, useCallback } from 'react';

export interface InvoiceFile {
  id: string;
  invoice_id: string;
  storage_path: string;
  file_name: string;
  mime_type: string;
  uploaded_at: string;
  signedUrl: string;
}

export interface InvoiceDetailData {
  id: string;
  vendor_id: string;
  engagement_id: string;
  invoice_number: string | null;
  status: string;
  total_amount: number | null;
  due_date: string | null;
  created_at: string;
  created_by: string | null;
  vendor_name: string | null;
  engagement_title: string | null;
  files: InvoiceFile[];
}

interface UseInvoiceDetailReturn {
  invoice: InvoiceDetailData | null;
  files: InvoiceFile[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useInvoiceDetail(
  invoiceId: string | undefined
): UseInvoiceDetailReturn {
  const [invoice, setInvoice] = useState<InvoiceDetailData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    if (!invoiceId) return;
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/invoices/${invoiceId}`);

      if (!res.ok) {
        if (res.status === 404) {
          throw new Error('Invoice not found.');
        }
        throw new Error('Failed to load invoice.');
      }

      const json = await res.json();

      if (json.error) {
        throw new Error(json.error);
      }

      setInvoice(json.data ?? null);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'An unexpected error occurred.';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [invoiceId]);

  useEffect(() => {
    if (invoiceId) {
      refetch();
    } else {
      setIsLoading(false);
    }
  }, [invoiceId, refetch]);

  return {
    invoice,
    files: invoice?.files ?? [],
    isLoading,
    error,
    refetch,
  };
}
