import { useDashboard } from '../../lib/hooks/useDashboard';
import { useMemo } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  FunnelChart, Funnel, LabelList
} from 'recharts';
import Link from 'next/link';
import {
  Briefcase,
  CheckSquare,
  Receipt,
  DollarSign,
  Clock,
  Activity,
  AlertCircle,
} from 'lucide-react';

// Stable date formatter to avoid server/client hydration mismatch (fixed locale + UTC)
const formatDate = (d: Date) => {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'UTC',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
};

export function GlobalDashboard() {
  const {
    summary,
    engagementStatusDistribution,
    recentActivity,
    spendingTrends,
    approvalPipeline,
    loading,
    error,
    refresh
  } = useDashboard();

  const departments = useMemo(() => {
    if (!spendingTrends) return [];
    const deptSet = new Set<string>();
    spendingTrends.forEach((item: any) => {
      Object.keys(item).forEach((k) => {
        if (k !== 'month') deptSet.add(k);
      });
    });
    return Array.from(deptSet);
  }, [spendingTrends]);

  const COLORS = ['#3b82f6', '#64748b', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444', '#0ea5e9'];

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-10 bg-gray-200 rounded w-1/4"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="h-32 bg-gray-200 rounded-xl"></div>
          <div className="h-32 bg-gray-200 rounded-xl"></div>
          <div className="h-32 bg-gray-200 rounded-xl"></div>
          <div className="h-32 bg-gray-200 rounded-xl"></div>
        </div>
        <div className="h-64 bg-gray-200 rounded-xl"></div>
      </div>
    );
  }

  if (error || !summary) {
    return (
      <div className="p-6 bg-red-50 text-red-700 rounded-xl flex items-center gap-3">
        <AlertCircle className="w-5 h-5" />
        <p className="font-medium text-sm">Failed to load dashboard: {error}</p>
        <button onClick={refresh} className="ml-auto underline text-sm font-semibold hover:text-red-800">Retry</button>
      </div>
    );
  }

  // Calculate stats for Stacked Bar from engagementStatusDistribution
  const totalEngagements = engagementStatusDistribution?.reduce((acc: any, curr: any) => acc + curr.count, 0) || 0;
  
  const getStatusCount = (statusName: string) => {
    return engagementStatusDistribution?.find((d: any) => d.status === statusName)?.count || 0;
  };

  const activeCount = getStatusCount('active');
  const onHoldCount = getStatusCount('on_hold');
  const completedCount = getStatusCount('completed');
  const cancelledCount = getStatusCount('cancelled');
  const underReviewCount = getStatusCount('under-review');
  const approvedCount = getStatusCount('approved');

  // Specific statuses to highlight in the chart
  const mainActiveCount = activeCount + onHoldCount;
  
  const completionRate =
    totalEngagements > 0
      ? Math.round((completedCount / totalEngagements) * 100)
      : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900">
            Global Dashboard
          </h1>
          <p className="text-gray-500 mt-1">
            Executive overview across all departments
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Active Engagements */}
        <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6 relative overflow-hidden hover:shadow-lg transition-shadow">
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500"></div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">
                Active Engagements
              </p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {summary.activeEngagements}
              </p>
            </div>
            <div className="bg-blue-100 p-3 rounded-xl">
              <Briefcase className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        {/* Pending Approvals */}
        <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6 relative overflow-hidden hover:shadow-lg transition-shadow">
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-amber-500"></div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">
                Pending Approvals
              </p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {summary.pendingApprovals}
              </p>
            </div>
            <div className="bg-amber-100 p-3 rounded-xl">
              <CheckSquare className="w-6 h-6 text-amber-600" />
            </div>
          </div>
          {summary.pendingApprovalAvgDays !== null && (
            <div className="flex items-center mt-4 text-sm">
              <Clock className="w-4 h-4 text-amber-600 mr-1" />
              <span className="text-gray-600">Avg. {summary.pendingApprovalAvgDays} days pending</span>
            </div>
          )}
        </div>

        {/* Outstanding Invoices */}
        <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6 relative overflow-hidden hover:shadow-lg transition-shadow">
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-rose-500"></div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">
                Outstanding Invoices
              </p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {summary.outstandingInvoices}
              </p>
            </div>
            <div className="bg-rose-100 p-3 rounded-xl">
              <Receipt className="w-6 h-6 text-rose-600" />
            </div>
          </div>
        </div>

        {/* Total Spend */}
        <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6 relative overflow-hidden hover:shadow-lg transition-shadow">
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-500"></div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">
                Total Spend (YTD)
              </p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                ${summary.totalSpendYtd > 1000 ? (summary.totalSpendYtd / 1000).toFixed(1) + 'K' : summary.totalSpendYtd}
              </p>
            </div>
            <div className="bg-emerald-100 p-3 rounded-xl">
              <DollarSign className="w-6 h-6 text-emerald-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Engagement Status - Full Width Stacked Bar */}
      <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6 hover:shadow-lg transition-shadow">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-bold text-gray-900">
              Engagement Status Distribution
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Overview of all engagement statuses across the platform
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500 font-medium">Completion Rate</p>
            <p className="text-2xl font-bold text-emerald-600">
              {completionRate}%
            </p>
          </div>
        </div>

        {/* Horizontal Stacked Bar */}
        <div className="relative">
          <div className="flex h-16 rounded-lg overflow-hidden shadow-sm">
            {totalEngagements === 0 && (
              <div className="bg-gray-100 w-full flex items-center justify-center text-gray-500 text-sm">
                No active engagement data
              </div>
            )}
            
            {(approvedCount + underReviewCount) > 0 && (
              <div
                className="bg-blue-500 hover:bg-blue-600 transition-colors flex items-center justify-center text-white font-semibold text-sm cursor-pointer"
                style={{
                  width: `${((approvedCount + underReviewCount) / totalEngagements) * 100}%`,
                }}
                title={`Approved/In Review: ${approvedCount + underReviewCount}`}
              >
                {(( (approvedCount + underReviewCount) / totalEngagements) * 100).toFixed(0)}%
              </div>
            )}
            {mainActiveCount > 0 && (
              <div
                className="bg-teal-500 hover:bg-teal-600 transition-colors flex items-center justify-center text-white font-semibold text-sm cursor-pointer"
                style={{ width: `${(mainActiveCount / totalEngagements) * 100}%` }}
                title={`Active/On Hold: ${mainActiveCount}`}
              >
                {((mainActiveCount / totalEngagements) * 100).toFixed(0)}%
              </div>
            )}
            {completedCount > 0 && (
              <div
                className="bg-slate-500 hover:bg-slate-600 transition-colors flex items-center justify-center text-white font-semibold text-sm cursor-pointer"
                style={{
                  width: `${(completedCount / totalEngagements) * 100}%`,
                }}
                title={`Completed: ${completedCount}`}
              >
                {((completedCount / totalEngagements) * 100).toFixed(0)}%
              </div>
            )}
            {cancelledCount > 0 && (
              <div
                className="bg-rose-500 hover:bg-rose-600 transition-colors flex items-center justify-center text-white font-semibold text-sm cursor-pointer"
                style={{
                  width: `${(cancelledCount / totalEngagements) * 100}%`,
                }}
                title={`Cancelled: ${cancelledCount}`}
              >
                {((cancelledCount / totalEngagements) * 100).toFixed(0)}%
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-500 rounded"></div>
              <div>
                <p className="text-xs text-gray-500">Early Stage (Appr/Rev)</p>
                <p className="text-sm font-bold text-gray-900">
                  {approvedCount + underReviewCount}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-teal-500 rounded"></div>
              <div>
                <p className="text-xs text-gray-500">Active Stage (Active/Hold)</p>
                <p className="text-sm font-bold text-gray-900">{mainActiveCount}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-slate-500 rounded"></div>
              <div>
                <p className="text-xs text-gray-500">Completed</p>
                <p className="text-sm font-bold text-gray-900">
                  {completedCount}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-rose-500 rounded"></div>
              <div>
                <p className="text-xs text-gray-500">Cancelled</p>
                <p className="text-sm font-bold text-gray-900">
                  {cancelledCount}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Spending Trends by Department */}
        <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-gray-900 bg-blue-600 text-white px-2 py-1 rounded">
              Monthly Spending Trends by Department
            </h2>
            <div className="flex items-center gap-2">
              <span className="text-xs bg-emerald-50 text-emerald-600 font-semibold px-2 py-1 rounded">
                Dynamic Live Data
              </span>
            </div>
          </div>
          <div className="h-80">
            {(!spendingTrends || spendingTrends.length === 0) ? (
              <div className="w-full h-full flex justify-center items-center text-gray-400">No data available</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={spendingTrends}
                  margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                >
                  <defs>
                    {departments.map((dept, index) => (
                      <linearGradient key={dept} id={`color${index}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={COLORS[index % COLORS.length]} stopOpacity={0.1} />
                        <stop offset="95%" stopColor={COLORS[index % COLORS.length]} stopOpacity={0} />
                      </linearGradient>
                    ))}
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} dy={10} />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#6B7280', fontSize: 12 }}
                    tickFormatter={(value) => `$${value >= 1000 ? (value / 1000) + 'K' : value}`}
                    dx={-10}
                  />
                  <RechartsTooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                    formatter={(value: number) => [`$${value.toLocaleString()}`, '']}
                  />
                  {departments.map((dept, index) => (
                    <Area
                      key={dept}
                      type="monotone"
                      dataKey={dept}
                      name={dept}
                      stroke={COLORS[index % COLORS.length]}
                      strokeWidth={2}
                      fillOpacity={1}
                      fill={`url(#color${index})`}
                      activeDot={{ r: 6, strokeWidth: 0 }}
                    />
                  ))}
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
          <div className="flex flex-wrap justify-center gap-4 mt-6">
            {departments.map((dept, idx) => (
              <div key={dept} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></div>
                <span className="text-sm font-medium text-gray-600">{dept}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Approval Pipeline Overview (Funnel) */}
        <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-600" />
              Approval Pipeline Overview
            </h2>
          </div>
          <div className="h-96 overflow-y-auto pr-2">
            {(!approvalPipeline || approvalPipeline.length === 0) ? (
              <div className="w-full h-full flex justify-center items-center text-gray-400">No data available</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-4">
                {(approvalPipeline || []).map((deptData: any) => (
                  <div key={deptData.department} className="flex flex-col items-center bg-gray-50 border border-gray-100 rounded-xl p-4">
                    <h3 className="text-sm font-semibold text-gray-700 bg-white px-3 py-1 rounded-full shadow-sm mb-4">{deptData.department}</h3>
                    <div className="w-full h-40">
                      <ResponsiveContainer width="100%" height="100%">
                        <FunnelChart margin={{ top: 0, right: 10, left: 10, bottom: 0 }}>
                          <RechartsTooltip 
                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                          />
                          <Funnel
                            dataKey="value"
                            data={deptData.pipeline}
                            isAnimationActive
                          >
                            <LabelList position="right" fill="#374151" stroke="none" dataKey="name" fontSize={11} fontWeight="bold" />
                          </Funnel>
                        </FunnelChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="flex justify-center gap-6 mt-4 border-t border-gray-100 pt-6">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#FFA500' }}></div>
              <span className="text-sm font-medium text-gray-600">Pending</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#0088FE' }}></div>
              <span className="text-sm font-medium text-gray-600">Approved</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#00C49F' }}></div>
              <span className="text-sm font-medium text-gray-600">Completed</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity Log */}
      <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow max-w-full">
        <div className="p-6 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Activity className="w-5 h-5 text-blue-600" />
            Recent Activity Log
          </h2>
        </div>
        <div className="p-6 max-h-96 overflow-y-auto">
          {(!recentActivity || recentActivity.length === 0) ? (
            <p className="text-sm text-gray-500 text-center py-4">No recent activity found.</p>
          ) : (
            <div className="space-y-4">
              {(recentActivity || []).map((activity: any) => (
                <div
                  key={activity.id}
                  className="flex gap-4 pb-4 border-b border-gray-100 last:border-0"
                >
                  <div className="flex-shrink-0 w-2 h-2 mt-2 rounded-full bg-blue-500"></div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-gray-900">
                          {activity.description}
                        </p>
                        {activity.entityType === 'engagement' && activity.entityId && (
                           <Link
                             href={`/engagements/${activity.entityId}`}
                             className="text-xs text-blue-600 hover:text-blue-700 font-medium mt-1 inline-block"
                           >
                             View Engagement
                           </Link>
                        )}
                        {activity.entityType === 'work_order' && activity.entityId && (
                           <Link
                             href={`/work-orders/${activity.entityId}`}
                             className="text-xs text-blue-600 hover:text-blue-700 font-medium mt-1 inline-block"
                           >
                             View Work Order
                           </Link>
                        )}
                        {activity.entityType === 'vendor' && activity.entityId && (
                           <Link
                             href={`/vendors/${activity.entityId}`}
                             className="text-xs text-blue-600 hover:text-blue-700 font-medium mt-1 inline-block"
                           >
                             View Vendor
                           </Link>
                        )}
                      </div>
                      <div className="flex-shrink-0 text-right">
                        <p className="text-xs text-gray-500 font-medium flex-nowrap whitespace-nowrap">
                          {formatDate(new Date(activity.createdAt))}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
