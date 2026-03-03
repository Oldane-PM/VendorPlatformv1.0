/**
 * useVendorEngagementDetail — fetch a single vendor engagement by VE number.
 */
import { useState, useEffect, useCallback } from 'react';
import {
  VendorEngagementDto,
  getVendorEngagement,
} from '@/lib/domain/engagements/engagementsApiRepo';

interface UseVendorEngagementDetailReturn {
  detail: VendorEngagementDto | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useVendorEngagementDetail(
  veId: string | undefined
): UseVendorEngagementDetailReturn {
  const [detail, setDetail] = useState<VendorEngagementDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    if (!veId) return;
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await getVendorEngagement(veId);

      if (fetchError) {
        setError(fetchError);
        setDetail(null);
      } else {
        setDetail(data ?? null);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch vendor engagement detail');
      setDetail(null);
    } finally {
      setIsLoading(false);
    }
  }, [veId]);

  useEffect(() => {
    if (veId) {
      refetch();
    } else {
      setIsLoading(false);
    }
  }, [veId, refetch]);

  return { detail, isLoading, error, refetch };
}
