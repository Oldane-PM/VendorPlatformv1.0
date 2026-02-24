/**
 * useVendors — React hook for vendor data.
 *
 * Manages loading, error, search, status filter states.
 * Calls vendorsApiRepo only — no direct Supabase usage.
 */
import { useState, useEffect, useCallback } from 'react';
import * as vendorsApiRepo from '@/lib/domain/vendors/vendorsApiRepo';
import type {
  VendorDto,
  CreateVendorPayload,
} from '@/lib/domain/vendors/vendorsApiRepo';

export interface UseVendorsReturn {
  vendors: VendorDto[];
  loading: boolean;
  error: string | null;
  search: string;
  setSearch: (s: string) => void;
  statusFilter: string;
  setStatusFilter: (s: string) => void;
  refresh: () => void;
  createVendor: (payload: CreateVendorPayload) => Promise<VendorDto>;
}

export function useVendors(): UseVendorsReturn {
  const [vendors, setVendors] = useState<VendorDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const fetchVendors = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await vendorsApiRepo.list({
        search: search || undefined,
        status: statusFilter,
      });
      setVendors(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load vendors';
      console.error('[useVendors] fetch error:', msg);
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter]);

  // Auto-fetch on mount and when filters change
  useEffect(() => {
    fetchVendors();
  }, [fetchVendors]);

  const createVendor = useCallback(
    async (payload: CreateVendorPayload): Promise<VendorDto> => {
      const created = await vendorsApiRepo.create(payload);
      // Optimistic: prepend to local list
      setVendors((prev) => [created, ...prev]);
      return created;
    },
    []
  );

  return {
    vendors,
    loading,
    error,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    refresh: fetchVendors,
    createVendor,
  };
}
