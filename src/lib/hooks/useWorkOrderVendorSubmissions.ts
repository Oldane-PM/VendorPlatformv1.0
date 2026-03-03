import { useState, useEffect, useCallback } from 'react';
import { workOrdersVendorSubmissionsApiRepo } from '../domain/uploads/workOrdersVendorSubmissionsApiRepo';
import { SubmissionListDto } from '../supabase/repos/workOrderQuotePortalRepo';

export function useWorkOrderVendorSubmissions(workOrderId: string | null) {
  const [submissions, setSubmissions] = useState<SubmissionListDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSubmissions = useCallback(async () => {
    if (!workOrderId) return;
    setLoading(true);
    setError(null);
    try {
      const data =
        await workOrdersVendorSubmissionsApiRepo.getVendorSubmissions(
          workOrderId
        );
      setSubmissions(data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to list submissions');
    } finally {
      setLoading(false);
    }
  }, [workOrderId]);

  useEffect(() => {
    fetchSubmissions();
  }, [fetchSubmissions]);

  const resolveVendor = async (submissionId: string) => {
    setError(null);
    try {
      const res =
        await workOrdersVendorSubmissionsApiRepo.resolveVendor(submissionId);
      await fetchSubmissions(); // reload list
      return res;
    } catch (err: any) {
      setError(err.message || 'Failed to resolve vendor');
      throw err;
    }
  };

  return {
    submissions,
    loading,
    error,
    refetch: fetchSubmissions,
    resolveVendor,
  };
}
