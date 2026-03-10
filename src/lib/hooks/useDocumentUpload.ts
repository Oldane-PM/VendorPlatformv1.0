import { useState } from 'react';
import { documentUploadApiRepo } from '@/lib/domain/documents/documentUploadApiRepo';

export function useDocumentUpload() {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [documents, setDocuments] = useState<
    Array<{ id: string; fileName: string }>
  >([]);

  const uploadDocuments = async (
    files: File[],
    options?: { documentTypeHint?: string }
  ) => {
    setUploading(true);
    setError(null);
    try {
      const response = await documentUploadApiRepo.upload(files, options);
      setDocuments((prev) => [...prev, ...response.documents]);
      return response.documents;
    } catch (err: any) {
      setError(err.message || 'Failed to upload documents');
      throw err;
    } finally {
      setUploading(false);
    }
  };

  return {
    uploading,
    error,
    documents,
    uploadDocuments,
  };
}
