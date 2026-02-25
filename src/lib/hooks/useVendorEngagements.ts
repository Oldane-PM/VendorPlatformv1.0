import { useState, useCallback, useEffect } from 'react';
import {
  VendorEngagementDto,
  listVendorEngagements,
} from '@/lib/domain/engagements/engagementsApiRepo';

interface UseVendorEngagementsReturn {
  vendorEngagements: VendorEngagementDto[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useVendorEngagements(): UseVendorEngagementsReturn {
  const [vendorEngagements, setVendorEngagements] = useState<
    VendorEngagementDto[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const { data, error: fetchError } = await listVendorEngagements();

      if (fetchError) {
        setError(fetchError);
        setVendorEngagements([]);
      } else {
        setVendorEngagements(data || []);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch vendor engagements');
      setVendorEngagements([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { vendorEngagements, isLoading, error, refetch };
}
