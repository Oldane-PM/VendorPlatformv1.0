import { useState, useEffect, useCallback } from 'react';

interface VendorSubmission {
  id: string;
  work_order_id: string;
  vendor_id: string;
  vendor_name: string;
  submitted_at: string;
  total_amount: number;
  notes: string | null;
  status: string;
  quote_number: string | null;
  taxes: number | null;
  delivery_timeline: string | null;
  warranty: string | null;
  payment_terms: string | null;
  compliance_status: string | null;
  performance_rating: number | null;
  ai_summary: string | null;
}

export function useWorkOrderSubmissions(workOrderId: string | undefined) {
  const [submissions, setSubmissions] = useState<VendorSubmission[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSubmissions = useCallback(async () => {
    if (!workOrderId) return;

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/work-orders/${workOrderId}/submissions`);

      if (!res.ok) throw new Error('Failed to load submissions.');

      const json = await res.json();

      if (json.error) {
        setError(json.error);
      } else {
        setSubmissions(json.data ?? []);
      }
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : 'An unexpected error occurred.'
      );
    } finally {
      setIsLoading(false);
    }
  }, [workOrderId]);

  useEffect(() => {
    fetchSubmissions();
  }, [fetchSubmissions]);

  return { submissions, isLoading, error, refetch: fetchSubmissions };
}
