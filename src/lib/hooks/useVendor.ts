/**
 * useVendor — React hook for fetching a single vendor by ID.
 *
 * Used by VendorProfile.tsx.
 */
import { useState, useEffect } from 'react';
import * as vendorsApiRepo from '@/lib/domain/vendors/vendorsApiRepo';
import type { VendorDto } from '@/lib/domain/vendors/vendorsApiRepo';

export interface UseVendorReturn {
  vendor: VendorDto | null;
  loading: boolean;
  error: string | null;
}

export function useVendor(id: string | undefined): UseVendorReturn {
  const [vendor, setVendor] = useState<VendorDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function fetchVendor() {
      setLoading(true);
      setError(null);
      try {
        const data = await vendorsApiRepo.getById(id!);
        if (!cancelled) {
          setVendor(data);
        }
      } catch (err: unknown) {
        if (!cancelled) {
          const msg =
            err instanceof Error ? err.message : 'Failed to load vendor';
          console.error('[useVendor] fetch error:', msg);
          setError(msg);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchVendor();

    return () => {
      cancelled = true;
    };
  }, [id]);

  return { vendor, loading, error };
}
