/**
 * useVendor — React hook for fetching and updating a single vendor by ID.
 *
 * Used by VendorProfile.tsx.
 */
import { useState, useEffect, useCallback } from 'react';
import * as vendorsApiRepo from '@/lib/domain/vendors/vendorsApiRepo';
import type {
  VendorDto,
  UpdateVendorPayload,
} from '@/lib/domain/vendors/vendorsApiRepo';

export interface UseVendorReturn {
  vendor: VendorDto | null;
  loading: boolean;
  error: string | null;
  updating: boolean;
  updateVendor: (payload: UpdateVendorPayload) => Promise<VendorDto>;
}

export function useVendor(id: string | undefined): UseVendorReturn {
  const [vendor, setVendor] = useState<VendorDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);

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

  const updateVendor = useCallback(
    async (payload: UpdateVendorPayload): Promise<VendorDto> => {
      if (!id) throw new Error('No vendor id');
      setUpdating(true);
      try {
        const updated = await vendorsApiRepo.update(id, payload);
        setVendor(updated);
        return updated;
      } catch (err: unknown) {
        const msg =
          err instanceof Error ? err.message : 'Failed to update vendor';
        console.error('[useVendor] update error:', msg);
        throw new Error(msg);
      } finally {
        setUpdating(false);
      }
    },
    [id]
  );

  return { vendor, loading, error, updating, updateVendor };
}
