import { useState, useCallback, useEffect } from 'react';
import { getVendorEngagementDetail } from '../domain/engagements/engagementsApiRepo';

interface UseVendorEngagementDetailReturn {
  vendorEngagement: any | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useVendorEngagementDetail(
  id?: string
): UseVendorEngagementDetailReturn {
  const [vendorEngagement, setVendorEngagement] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    if (!id) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const { data, error: fetchError } = await getVendorEngagementDetail(id);

      if (fetchError) {
        setError(fetchError);
        setVendorEngagement(null);
      } else {
        setVendorEngagement(data);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch vendor engagement detail');
      setVendorEngagement(null);
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { vendorEngagement, isLoading, error, refetch };
}
