export const documentExtractionApiRepo = {
  async getExtraction(documentId: string) {
    const res = await fetch(`/api/documents/${documentId}/extraction`);

    if (!res.ok) {
      if (res.status === 404) {
        return null; // Return null if not found
      }
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to retrieve document extraction');
    }

    return res.json();
  },

  async getDocument(documentId: string) {
    const data = await this.getExtraction(documentId);
    return data?.document || null;
  },
};
