import {
  InvoicePortalContextDto,
  CreateInvoiceSubmissionPayload,
  InvoiceFileMetaInput,
  SignedInvoiceUploadResult,
  FinalizeInvoiceInput,
} from '../../supabase/repos/engagementInvoicePortalRepo';

export const vendorEngagementInvoicePortalApiRepo = {
  async getContext(
    requestId: string,
    token: string
  ): Promise<InvoicePortalContextDto> {
    const response = await fetch(
      `/api/vendor-portal/engagement/${requestId}/context?t=${encodeURIComponent(token)}`
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
    payload: CreateInvoiceSubmissionPayload
  ): Promise<{ submissionId: string }> {
    const response = await fetch(
      `/api/vendor-portal/engagement/${requestId}/submission?t=${encodeURIComponent(token)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }
    );
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to create invoice submission');
    }
    return response.json();
  },

  async createUploadUrl(
    requestId: string,
    token: string,
    submissionId: string,
    fileMeta: InvoiceFileMetaInput
  ): Promise<SignedInvoiceUploadResult> {
    const response = await fetch(
      `/api/vendor-portal/engagement/${requestId}/create-upload-url?t=${encodeURIComponent(token)}`,
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
    meta: FinalizeInvoiceInput = {}
  ): Promise<{ success: boolean; documentId: string }> {
    const response = await fetch(
      `/api/vendor-portal/engagement/${requestId}/finalize-file?t=${encodeURIComponent(token)}`,
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
};
