import { useState, useCallback } from 'react';

interface InvoiceUploadLinkConfig {
  expiresInHours?: number;
  maxFiles?: number;
  maxTotalBytes?: number;
}

interface InvoiceUploadLinkResult {
  requestId: string;
  expiresAt: string;
  portalUrl: string;
  rawToken: string;
}

export function useEngagementInvoiceUploadLink() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createLink = useCallback(
    async (
      engagementId: string,
      vendorId: string,
      config: InvoiceUploadLinkConfig = {}
    ) => {
      setIsLoading(true);
      setError(null);

      try {
        const res = await fetch(
          `/api/engagements/${engagementId}/request-invoice-upload-link`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ vendorId, ...config }),
          }
        );

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || 'Failed to generate link');
        }

        const data: InvoiceUploadLinkResult = await res.json();
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
