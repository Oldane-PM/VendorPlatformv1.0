import { SubmissionListDto } from '../../supabase/repos/workOrderQuotePortalRepo';

export const workOrdersVendorSubmissionsApiRepo = {
  async getVendorSubmissions(
    workOrderId: string
  ): Promise<SubmissionListDto[]> {
    const response = await fetch(
      `/api/work-orders/${workOrderId}/vendor-submissions`
    );
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to fetch vendor submissions');
    }
    return response.json();
  },

  async resolveVendor(
    submissionId: string
  ): Promise<{ success: boolean; vendorId: string }> {
    const response = await fetch(
      `/api/vendor-submissions/${submissionId}/resolve-vendor`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      }
    );
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to resolve vendor');
    }
    return response.json();
  },
};
