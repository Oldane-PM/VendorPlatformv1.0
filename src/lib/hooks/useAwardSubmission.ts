import { useState, useCallback } from 'react';

export function useAwardSubmission() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const award = useCallback(
    async (
      submissionId: string,
      payload: { workOrderId: string; engagementId: string | null }
    ) => {
      setIsLoading(true);
      setError(null);

      try {
        const res = await fetch(
          `/api/vendor-submissions/${submissionId}/award`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          }
        );

        const json = await res.json();

        if (!res.ok || json.error) {
          setError(json.error ?? 'Failed to award vendor.');
          return null;
        }

        return json.data;
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : 'An unexpected error occurred.';
        setError(message);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  return { award, isLoading, error };
}
