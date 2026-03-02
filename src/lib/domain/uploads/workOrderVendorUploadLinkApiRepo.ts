import {
  CreateUploadLinkPayload,
  CreateUploadLinkResult,
} from '../../supabase/repos/workOrderVendorPortalRepo';

export const workOrderVendorUploadLinkApiRepo = {
  async createLink(
    workOrderId: string,
    payload: CreateUploadLinkPayload
  ): Promise<CreateUploadLinkResult> {
    const response = await fetch(
      `/api/work-orders/${workOrderId}/vendor-upload-link`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to generate upload link.');
    }

    return response.json();
  },
};
