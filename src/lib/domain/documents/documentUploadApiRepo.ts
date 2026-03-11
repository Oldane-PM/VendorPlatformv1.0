export const documentUploadApiRepo = {
  async upload(files: File[], options?: { documentTypeHint?: string }) {
    const formData = new FormData();
    files.forEach((f) => formData.append('file', f));
    if (options?.documentTypeHint) {
      formData.append('documentTypeHint', options.documentTypeHint);
    }

    const res = await fetch('/api/documents/upload', {
      method: 'POST',
      body: formData,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to upload documents');
    }

    return res.json() as Promise<{
      documents: Array<{ id: string; fileName: string }>;
    }>;
  },
};
