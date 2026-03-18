import type { DashboardData } from '../../supabase/repos/dashboardRepo';

export async function getDashboard(): Promise<DashboardData> {
  const response = await fetch('/api/dashboard');
  if (!response.ok) {
    let errorMessage = 'Failed to fetch dashboard data';
    try {
      const errorData = await response.json();
      errorMessage = errorData.error || errorMessage;
    } catch {
      // ignore
    }
    throw new Error(errorMessage);
  }
  return response.json();
}
