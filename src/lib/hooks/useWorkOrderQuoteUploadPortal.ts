import { useState, useCallback } from 'react';
import { vendorWorkOrderQuotePortalApiRepo } from '../domain/uploads/vendorWorkOrderQuotePortalApiRepo';
import {
  PortalContextDto,
  CreateSubmissionPayload,
} from '../supabase/repos/workOrderQuotePortalRepo';
import { ExtractedDocumentData } from '../server/services/aiDocumentExtractionService';

export interface UploadFileState {
  id: string; // temp client-side id
  file: File;
  doc_type: string;
  progress: number;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  errorMessage?: string;
  uploadFileId?: string;
}

export function useWorkOrderQuoteUploadPortal(
  requestId: string,
  token: string
) {
  const [context, setContext] = useState<PortalContextDto | null>(null);
  const [submissionId, setSubmissionId] = useState<string | null>(null);
  const [uploads, setUploads] = useState<UploadFileState[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadContext = useCallback(async () => {
    if (!requestId || !token) return;
    setLoading(true);
    setError(null);
    try {
      const ctx = await vendorWorkOrderQuotePortalApiRepo.getContext(
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

  const submitVendorInfo = async (payload: CreateSubmissionPayload) => {
    setError(null);
    try {
      const { submissionId: newId } =
        await vendorWorkOrderQuotePortalApiRepo.createSubmission(
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

  const uploadFiles = async (filesToUpload: UploadFileState[]) => {
    if (!submissionId) throw new Error('No submission context found');

    // Process sequentially or limited concurrency
    for (const f of filesToUpload) {
      setUploads((prev) =>
        prev.map((u) => (u.id === f.id ? { ...u, status: 'uploading' } : u))
      );
      try {
        const { signedUrl, uploadFileId } =
          await vendorWorkOrderQuotePortalApiRepo.createUploadUrl(
            requestId,
            token,
            submissionId,
            {
              fileName: f.file.name,
              mimeType: f.file.type,
              sizeBytes: f.file.size,
              docType: f.doc_type,
            }
          );

        // Actual PUT to supabase storage
        const putRes = await fetch(signedUrl, {
          method: 'PUT',
          body: f.file,
          headers: {
            'Content-Type': f.file.type || 'application/octet-stream',
          },
        });

        if (!putRes.ok) throw new Error('Storage upload failed');

        // Finalize
        await vendorWorkOrderQuotePortalApiRepo.finalizeFile(
          requestId,
          token,
          submissionId,
          uploadFileId
        );

        setUploads((prev) =>
          prev.map((u) =>
            u.id === f.id
              ? { ...u, status: 'completed', uploadFileId, progress: 100 }
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

  const confirmSubmission = async () => {
    if (!submissionId) throw new Error('No submission context found');
    setError(null);
    try {
      await vendorWorkOrderQuotePortalApiRepo.confirmSubmission(
        requestId,
        token,
        submissionId
      );
    } catch (err: any) {
      setError(err.message || 'Failed to confirm submission');
      throw err;
    }
  };

  const extractDocument = async (uploadFileId: string): Promise<ExtractedDocumentData> => {
    if (!submissionId) throw new Error('No submission context found');
    setError(null);
    try {
      return await vendorWorkOrderQuotePortalApiRepo.extractDocument(
        requestId,
        token,
        submissionId,
        uploadFileId
      );
    } catch (err: any) {
      setError(err.message || 'Failed to extract document');
      throw err;
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
    submitVendorInfo,
    uploadFiles,
    confirmSubmission,
    extractDocument,
  };
}
