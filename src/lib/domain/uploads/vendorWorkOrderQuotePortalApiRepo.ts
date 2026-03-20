import {
  PortalContextDto,
  CreateSubmissionPayload,
  FileMetaInput,
  SignedUploadResult,
  FinalizeInput,
} from '../../supabase/repos/workOrderQuotePortalRepo';

export const vendorWorkOrderQuotePortalApiRepo = {
  async getContext(
    requestId: string,
    token: string
  ): Promise<PortalContextDto> {
    const response = await fetch(
      `/api/vendor-portal/work-order/${requestId}/context?t=${encodeURIComponent(token)}`
    );
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to fetch portal context');
    }
    return response.json();
  },

  async createSubmission(
    requestId: string,
    token: string,
    payload: CreateSubmissionPayload
  ): Promise<{ submissionId: string }> {
    const response = await fetch(
      `/api/vendor-portal/work-order/${requestId}/submission?t=${encodeURIComponent(token)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }
    );
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to submit quote');
    }
    return response.json();
  },

  async createUploadUrl(
    requestId: string,
    token: string,
    submissionId: string,
    fileMeta: FileMetaInput
  ): Promise<SignedUploadResult> {
    const response = await fetch(
      `/api/vendor-portal/work-order/${requestId}/create-upload-url?t=${encodeURIComponent(token)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ submissionId, fileMeta }),
      }
    );
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to get upload URL');
    }
    return response.json();
  },

  async finalizeFile(
    requestId: string,
    token: string,
    submissionId: string,
    uploadFileId: string,
    meta: FinalizeInput = {}
  ): Promise<{ success: boolean }> {
    const response = await fetch(
      `/api/vendor-portal/work-order/${requestId}/finalize-file?t=${encodeURIComponent(token)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ submissionId, uploadFileId, meta }),
      }
    );
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to finalize file');
    }
    return response.json();
  },

  async confirmSubmission(
    requestId: string,
    token: string,
    submissionId: string
  ): Promise<{ success: boolean; vendorId: string }> {
    const response = await fetch(
      `/api/vendor-portal/work-order/${requestId}/confirm?t=${encodeURIComponent(token)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ submissionId }),
      }
    );
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to confirm submission');
    }
    return response.json();
  },
};
