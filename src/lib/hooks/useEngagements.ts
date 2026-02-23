import { useState, useEffect, useCallback } from 'react';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface Engagement {
  id: string;
  title: string;
  description: string | null;
  status: string;
  department: string | null;
  budget: number | null;
  created_at: string;
  created_by: string;
}

export interface CreateEngagementPayload {
  title: string;
  description?: string;
  department?: string;
  budget?: number;
  status?: string;
}

interface UseEngagementsReturn {
  engagements: Engagement[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  createEngagement: (payload: CreateEngagementPayload) => Promise<Engagement>;
}

// ─── Hook ───────────────────────────────────────────────────────────────────

export function useEngagements(): UseEngagementsReturn {
  const [engagements, setEngagements] = useState<Engagement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/engagements');

      if (!res.ok) {
        throw new Error('Failed to load engagements.');
      }

      const json = await res.json();

      if (json.error) {
        throw new Error(json.error);
      }

      setEngagements(json.data ?? []);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'An unexpected error occurred.';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const createEngagement = useCallback(
    async (payload: CreateEngagementPayload): Promise<Engagement> => {
      const res = await fetch('/api/engagements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json();

      if (!res.ok || json.error) {
        throw new Error(json.error || 'Failed to create engagement.');
      }

      // Refetch the list after creation
      await refetch();

      return json.data as Engagement;
    },
    [refetch]
  );

  return { engagements, isLoading, error, refetch, createEngagement };
}
