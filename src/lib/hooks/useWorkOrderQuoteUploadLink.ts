import { useState, useCallback } from 'react';

interface QuoteUploadLinkConfig {
  allowedDocTypes?: string[];
  expiresInHours?: number;
  maxFiles?: number;
  maxTotalBytes?: number;
}

interface QuoteUploadLinkResult {
  requestId: string;
  expiresAt: string;
  portalUrl: string;
  rawToken: string;
}

export function useWorkOrderQuoteUploadLink() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createLink = useCallback(
    async (workOrderId: string, config: QuoteUploadLinkConfig = {}) => {
      setIsLoading(true);
      setError(null);

      try {
        const res = await fetch(
          `/api/work-orders/${workOrderId}/request-quote-upload-link`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(config),
          }
        );

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || 'Failed to generate link');
        }

        const data: QuoteUploadLinkResult = await res.json();
        return { data, error: null };
      } catch (err: any) {
        setError(err.message || 'An error occurred');
        return { data: null, error: err.message };
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  return { createLink, isLoading, error };
}
