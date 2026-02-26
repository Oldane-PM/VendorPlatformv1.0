/**
 * useVendorWorkOrderUploadPortal — hook for the public vendor upload portal.
 *
 * Manages the full upload lifecycle: load status → select files → get signed
 * URL → upload to Storage → finalize → mark complete.
 */
import { useState, useEffect, useCallback } from 'react';
import {
  getStatus,
  createUploadUrl,
  finalize,
  complete,
  type PortalStatus,
} from '@/lib/domain/uploads/vendorWorkOrderPortalApiRepo';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface FileUploadState {
  file: File;
  docType: string;
  status: 'pending' | 'uploading' | 'finalizing' | 'done' | 'error';
  progress: number; // 0-100
  error?: string;
  uploadFileId?: string;
}

// ─── Hook ───────────────────────────────────────────────────────────────────

export function useVendorWorkOrderUploadPortal(
  requestId: string | undefined,
  token: string | undefined
) {
  const [portalStatus, setPortalStatus] = useState<PortalStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [files, setFiles] = useState<FileUploadState[]>([]);
  const [isCompleted, setIsCompleted] = useState(false);

  // ── Load portal status ────────────────────────────────────────────────
  const loadStatus = useCallback(async () => {
    if (!requestId || !token) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await getStatus(requestId, token);
      setPortalStatus(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load portal.');
    } finally {
      setIsLoading(false);
    }
  }, [requestId, token]);

  useEffect(() => {
    loadStatus();
  }, [loadStatus]);

  // ── Add files ─────────────────────────────────────────────────────────
  const addFiles = useCallback((newFiles: File[], docType: string) => {
    const items: FileUploadState[] = newFiles.map((f) => ({
      file: f,
      docType,
      status: 'pending',
      progress: 0,
    }));
    setFiles((prev) => [...prev, ...items]);
  }, []);

  // ── Remove file ───────────────────────────────────────────────────────
  const removeFile = useCallback((index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }, []);

  // ── Update doc type ───────────────────────────────────────────────────
  const updateDocType = useCallback((index: number, docType: string) => {
    setFiles((prev) =>
      prev.map((f, i) => (i === index ? { ...f, docType } : f))
    );
  }, []);

  // ── Upload a single file ──────────────────────────────────────────────
  const uploadFile = useCallback(
    async (index: number) => {
      if (!requestId || !token) return;

      const fileState = files[index];
      if (!fileState || fileState.status !== 'pending') return;

      // Update status
      setFiles((prev) =>
        prev.map((f, i) =>
          i === index ? { ...f, status: 'uploading', progress: 10 } : f
        )
      );

      try {
        // 1. Get signed URL
        const { signedUrl, uploadFileId } = await createUploadUrl(
          requestId,
          token,
          {
            fileName: fileState.file.name,
            mimeType: fileState.file.type,
            sizeBytes: fileState.file.size,
            docType: fileState.docType,
          }
        );

        setFiles((prev) =>
          prev.map((f, i) =>
            i === index ? { ...f, progress: 30, uploadFileId } : f
          )
        );

        // 2. Upload to Storage via PUT
        const uploadRes = await fetch(signedUrl, {
          method: 'PUT',
          headers: { 'Content-Type': fileState.file.type },
          body: fileState.file,
        });

        if (!uploadRes.ok) {
          throw new Error('Upload to storage failed.');
        }

        setFiles((prev) =>
          prev.map((f, i) =>
            i === index ? { ...f, progress: 70, status: 'finalizing' } : f
          )
        );

        // 3. Finalize
        await finalize(requestId, token, uploadFileId, {
          sizeBytes: fileState.file.size,
        });

        setFiles((prev) =>
          prev.map((f, i) =>
            i === index ? { ...f, progress: 100, status: 'done' } : f
          )
        );
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Upload failed.';
        setFiles((prev) =>
          prev.map((f, i) =>
            i === index ? { ...f, status: 'error', error: msg } : f
          )
        );
      }
    },
    [requestId, token, files]
  );

  // ── Upload all pending files ──────────────────────────────────────────
  const uploadAll = useCallback(async () => {
    for (let i = 0; i < files.length; i++) {
      if (files[i].status === 'pending') {
        await uploadFile(i);
      }
    }
  }, [files, uploadFile]);

  // ── Mark complete ─────────────────────────────────────────────────────
  const markComplete = useCallback(async () => {
    if (!requestId || !token) return;
    try {
      await complete(requestId, token);
      setIsCompleted(true);
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : 'Failed to mark as complete.'
      );
    }
  }, [requestId, token]);

  return {
    portalStatus,
    isLoading,
    error,
    files,
    isCompleted,
    addFiles,
    removeFile,
    updateDocType,
    uploadFile,
    uploadAll,
    markComplete,
    refreshStatus: loadStatus,
  };
}
