import { useState, useCallback } from 'react';
import { documentExtractionApiRepo } from '@/lib/domain/documents/documentExtractionApiRepo';

export function useDocumentExtraction(documentId?: string | null) {
  const [document, setDocument] = useState<any | null>(null);
  const [extraction, setExtraction] = useState<any | null>(null);
  const [fields, setFields] = useState<any[]>([]);
  const [lineItems, setLineItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!documentId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await documentExtractionApiRepo.getExtraction(documentId);
      if (data) {
        setDocument(data.document);
        setExtraction(data.extraction);
        setFields(data.fields || []);
        setLineItems(data.lineItems || []);
      }
    } catch (err: any) {
      setError(err.message || 'Error fetching extraction');
    } finally {
      setLoading(false);
    }
  }, [documentId]);

  return {
    document,
    extraction,
    fields,
    lineItems,
    loading,
    error,
    refresh,
  };
}
