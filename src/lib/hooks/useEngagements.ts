import { useState, useEffect, useCallback } from 'react';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface Engagement {
  id: string;
  org_id: string;
  engagement_number: number;
  title: string;
  description: string | null;
  status: string;
  project_impact: string;
  start_date: string | null;
  end_date: string | null;
  created_by: string | null;
  created_at: string;
}

export interface CreateEngagementPayload {
  title: string;
  description?: string;
  project_impact?: string;
  status?: string;
}

interface UseEngagementsReturn {
  engagements: Engagement[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  createEngagement: (payload: CreateEngagementPayload) => Promise<Engagement>;
  updateEngagement: (
    id: string,
    payload: Partial<CreateEngagementPayload>
  ) => Promise<Engagement>;
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

  const updateEngagement = useCallback(
    async (
      id: string,
      payload: Partial<CreateEngagementPayload>
    ): Promise<Engagement> => {
      const res = await fetch('/api/engagements', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...payload }),
      });

      const json = await res.json();

      if (!res.ok || json.error) {
        throw new Error(json.error || 'Failed to update engagement.');
      }

      await refetch();

      return json.data as Engagement;
    },
    [refetch]
  );

  return {
    engagements,
    isLoading,
    error,
    refetch,
    createEngagement,
    updateEngagement,
  };
}
