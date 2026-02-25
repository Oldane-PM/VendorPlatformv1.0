import { useState, useCallback } from 'react';

interface SubmissionFile {
  id: string;
  submission_id: string;
  file_name: string;
  storage_path: string;
  mime_type: string;
  uploaded_at: string;
  signedUrl: string;
}

interface SubmissionDetail {
  id: string;
  work_order_id: string;
  vendor_id: string;
  vendor_name: string;
  submitted_at: string;
  total_amount: number;
  notes: string | null;
  status: string;
  files: SubmissionFile[];
}

export function useVendorSubmissionDetail() {
  const [detail, setDetail] = useState<SubmissionDetail | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDetail = useCallback(async (submissionId: string) => {
    setIsLoading(true);
    setError(null);
    setDetail(null);

    try {
      const res = await fetch(`/api/vendor-submissions/${submissionId}`);

      if (!res.ok) throw new Error('Failed to load submission detail.');

      const json = await res.json();

      if (json.error) {
        setError(json.error);
      } else {
        setDetail(json.data);
      }
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : 'An unexpected error occurred.'
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { detail, isLoading, error, fetchDetail };
}
