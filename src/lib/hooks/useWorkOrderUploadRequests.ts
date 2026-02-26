/**
 * useWorkOrderUploadRequests — hook for internal upload request management.
 *
 * Provides create, list, and revoke operations with loading/error state.
 */
import { useState, useEffect, useCallback } from 'react';
import {
  createRequest,
  listRequests,
  revokeRequest,
  type CreateUploadRequestPayload,
  type CreateUploadRequestResult,
  type UploadRequestSummary,
} from '@/lib/domain/uploads/workOrderUploadApiRepo';

export function useWorkOrderUploadRequests(workOrderId: string | undefined) {
  const [requests, setRequests] = useState<UploadRequestSummary[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createResult, setCreateResult] =
    useState<CreateUploadRequestResult | null>(null);

  // ── List ─────────────────────────────────────────────────────────────────
  const fetchRequests = useCallback(async () => {
    if (!workOrderId) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await listRequests(workOrderId);
      setRequests(data);
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : 'Failed to load upload requests.'
      );
    } finally {
      setIsLoading(false);
    }
  }, [workOrderId]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  // ── Create ──────────────────────────────────────────────────────────────
  const create = useCallback(
    async (payload: CreateUploadRequestPayload) => {
      if (!workOrderId) return null;
      setIsLoading(true);
      setError(null);
      try {
        const result = await createRequest(workOrderId, payload);
        setCreateResult(result);
        // Refresh list
        await fetchRequests();
        return result;
      } catch (err: unknown) {
        const msg =
          err instanceof Error ? err.message : 'Failed to create request.';
        setError(msg);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [workOrderId, fetchRequests]
  );

  // ── Revoke ──────────────────────────────────────────────────────────────
  const revoke = useCallback(
    async (requestId: string) => {
      setIsLoading(true);
      setError(null);
      try {
        await revokeRequest(requestId);
        await fetchRequests();
        return true;
      } catch (err: unknown) {
        setError(
          err instanceof Error ? err.message : 'Failed to revoke request.'
        );
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [fetchRequests]
  );

  return {
    requests,
    isLoading,
    error,
    createResult,
    create,
    revoke,
    refetch: fetchRequests,
  };
}
