import { useState, useCallback } from 'react';
import { vendorEngagementInvoicePortalApiRepo } from '../domain/uploads/vendorEngagementInvoicePortalApiRepo';
import {
  InvoicePortalContextDto,
  CreateInvoiceSubmissionPayload,
} from '../supabase/repos/engagementInvoicePortalRepo';

export interface InvoiceUploadFileState {
  id: string; // temp client-side id
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  errorMessage?: string;
  uploadFileId?: string;
  documentId?: string;
}

export function useEngagementInvoiceUploadPortal(
  requestId: string,
  token: string
) {
  const [context, setContext] = useState<InvoicePortalContextDto | null>(null);
  const [submissionId, setSubmissionId] = useState<string | null>(null);
  const [uploads, setUploads] = useState<InvoiceUploadFileState[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadContext = useCallback(async () => {
    if (!requestId || !token) return;
    setLoading(true);
    setError(null);
    try {
      const ctx = await vendorEngagementInvoicePortalApiRepo.getContext(
        requestId,
        token
      );
      setContext(ctx);
    } catch (err: any) {
      setError(err.message || 'Failed to load portal context');
    } finally {
      setLoading(false);
    }
  }, [requestId, token]);

  const submitInvoiceMeta = async (payload: CreateInvoiceSubmissionPayload) => {
    setError(null);
    try {
      const { submissionId: newId } =
        await vendorEngagementInvoicePortalApiRepo.createSubmission(
          requestId,
          token,
          payload
        );
      setSubmissionId(newId);
      return newId;
    } catch (err: any) {
      setError(err.message || 'Failed to submit info');
      throw err;
    }
  };

  const uploadFiles = async (filesToUpload: InvoiceUploadFileState[]) => {
    if (!submissionId) throw new Error('No submission context found');

    for (const f of filesToUpload) {
      setUploads((prev) =>
        prev.map((u) => (u.id === f.id ? { ...u, status: 'uploading' } : u))
      );
      try {
        const { signedUrl, uploadFileId } =
          await vendorEngagementInvoicePortalApiRepo.createUploadUrl(
            requestId,
            token,
            submissionId,
            {
              fileName: f.file.name,
              mimeType: f.file.type,
              sizeBytes: f.file.size,
            }
          );

        const putRes = await fetch(signedUrl, {
          method: 'PUT',
          body: f.file,
          headers: {
            'Content-Type': f.file.type || 'application/octet-stream',
          },
        });

        if (!putRes.ok) throw new Error('Storage upload failed');

        const { documentId } =
          await vendorEngagementInvoicePortalApiRepo.finalizeFile(
            requestId,
            token,
            submissionId,
            uploadFileId
          );

        setUploads((prev) =>
          prev.map((u) =>
            u.id === f.id
              ? {
                  ...u,
                  status: 'completed',
                  uploadFileId,
                  documentId,
                  progress: 100,
                }
              : u
          )
        );
      } catch (err: any) {
        console.error('File upload error:', err);
        setUploads((prev) =>
          prev.map((u) =>
            u.id === f.id
              ? {
                  ...u,
                  status: 'error',
                  errorMessage: err.message || 'Upload failed',
                }
              : u
          )
        );
      }
    }
  };

  return {
    context,
    submissionId,
    uploads,
    setUploads,
    loading,
    error,
    loadContext,
    submitInvoiceMeta,
    uploadFiles,
  };
}
