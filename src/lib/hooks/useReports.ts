import { useState, useEffect, useCallback, useRef } from 'react';

export interface ReportsFilters {
  startDate?: string;
  endDate?: string;
  category?: 'vendor' | 'department';
}

export interface ReportsData {
  summary: {
    totalInvoices: number;
    totalPaidInvoices: number;
    totalEngagements: number;
    totalInvoicedAmount: number;
    totalAwardedValue: number;
    totalPaidAmount: number;
    outstandingPayables: number;
  };
  trends: Array<{ month: string; spend: number; invoices: number }>;
  categoryBreakdown: Array<{ name: string; spend: number; invoices: number }>;
  detailedTable: Array<{
    id: string;
    vendorName: string;
    engagementTitle: string;
    invoiceNumber: string;
    totalAmount: number;
    status: string;
    date: string;
  }>;
}

/**
 * Accepts filters directly as a parameter (no internal filter state).
 * Re-fetches whenever the filters object values change.
 * Uses AbortController to cancel stale in-flight requests.
 */
export function useReports(filters: ReportsFilters) {
  const [data, setData] = useState<ReportsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const fetchReports = useCallback(async (f: ReportsFilters, signal?: AbortSignal) => {
    setIsLoading(true);
    setError(null);
    try {
      const queryParams = new URLSearchParams();
      if (f.startDate) queryParams.append('startDate', f.startDate);
      if (f.endDate) queryParams.append('endDate', f.endDate);
      if (f.category) queryParams.append('category', f.category);

      const res = await fetch(`/api/reports?${queryParams.toString()}`, { signal });
      if (!res.ok) {
        throw new Error('Failed to fetch report data');
      }
      const json = await res.json();
      setData(json);
    } catch (err: any) {
      if (err.name === 'AbortError') return; // request was cancelled, ignore
      setError(err.message || 'Unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Re-fetch whenever filters change; abort previous in-flight request
  useEffect(() => {
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    fetchReports(filters, controller.signal);

    return () => controller.abort();
  }, [filters.startDate, filters.endDate, filters.category, fetchReports]);

  const refetch = useCallback(() => {
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    fetchReports(filters, controller.signal);
  }, [filters, fetchReports]);

  return { data, isLoading, error, refetch };
}
