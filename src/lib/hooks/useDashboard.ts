import { useState, useEffect, useCallback } from 'react';
import type { DashboardData } from '../supabase/repos/dashboardRepo';
import { getDashboard } from '../domain/dashboard/dashboardApiRepo';

export function useDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await getDashboard();
      setData(result);
    } catch (err: any) {
      setError(err.message || 'An error occurred while fetching dashboard data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  return {
    summary: data?.summary,
    engagementStatusDistribution: data?.engagementStatusDistribution,
    recentActivity: data?.recentActivity,
    spendingTrends: data?.spendingTrends,
    approvalPipeline: data?.approvalPipeline,
    loading,
    error,
    refresh: fetchDashboard,
  };
}
