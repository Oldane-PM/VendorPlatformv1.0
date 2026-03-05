import { useState } from 'react';
import { workOrderVendorUploadLinkApiRepo } from '../domain/uploads/workOrderVendorUploadLinkApiRepo';
import {
  CreateUploadLinkPayload,
  CreateUploadLinkResult,
} from '../supabase/repos/workOrderQuotePortalRepo';

export function useWorkOrderVendorUploadLink() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createLink = async (
    workOrderId: string,
    payload: CreateUploadLinkPayload
  ): Promise<CreateUploadLinkResult | null> => {
    setLoading(true);
    setError(null);
    try {
      const result = await workOrderVendorUploadLinkApiRepo.createLink(
        workOrderId,
        payload
      );
      return result;
    } catch (err: any) {
      setError(err.message || 'Failed to create link');
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    createLink,
    loading,
    error,
  };
}
