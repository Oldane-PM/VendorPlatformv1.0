/**
 * useInvoices — fetch invoice list from /api/invoices.
 */
import { useState, useEffect, useCallback } from 'react';

export interface InvoiceListItem {
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
}

interface UseInvoicesReturn {
  invoices: InvoiceListItem[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useInvoices(): UseInvoicesReturn {
  const [invoices, setInvoices] = useState<InvoiceListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/invoices');

      if (!res.ok) {
        throw new Error('Failed to load invoices.');
      }

      const json = await res.json();

      if (json.error) {
        throw new Error(json.error);
      }

      setInvoices(json.data ?? []);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'An unexpected error occurred.';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { invoices, isLoading, error, refetch };
}
