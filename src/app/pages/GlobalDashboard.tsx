import { usePlatform } from '../contexts/PlatformContext';
import Link from 'next/link';
import { useState } from 'react';
import {
  Briefcase,
  CheckSquare,
  Receipt,
  DollarSign,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Clock,
  Sparkles,
  Activity,
  Users,
  Layers,
  FileText,
} from 'lucide-react';
import { StatusBadge } from '../components/StatusBadge';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
  ComposedChart,
} from 'recharts';

// Stable date formatter to avoid server/client hydration mismatch (fixed locale + UTC)
const formatDate = (d: Date) =>
  new Intl.DateTimeFormat('en-CA', {
    timeZone: 'UTC',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(d);

// Modern SaaS Color Palette
const COLORS = {
  primary: '#2563EB',      // Blue - Approved/Core
  primaryDeep: '#1E40AF',  // Deep Blue
  success: '#10B981',      // Emerald - Positive/Growth
  warning: '#F59E0B',      // Amber - Pending/Review
  danger: '#EF4444',       // Rose - Alerts
  neutral: '#64748B',      // Slate - Neutral
  background: '#F8FAFC',   // Background
  teal: '#14B8A6',         // Teal - Active
  purple: '#8B5CF6',       // Purple - Marketing/Secondary
};

export function GlobalDashboard() {
  const { engagements, vendors } = usePlatform();
  const [timeRange, setTimeRange] = useState<'monthly' | 'quarterly' | 'ytd'>('monthly');

  // Calculate KPIs
  const activeEngagements = engagements.filter((e) => e.status === 'active' || e.status === 'under-review').length;
  const pendingApprovals = engagements.filter((e) =>
    e.approvalSteps.some((step) => step.status === 'pending')
  ).length;
  
  const allInvoices = engagements.flatMap((e) => e.invoices);
  const outstandingInvoices = allInvoices.filter((i) => i.status === 'outstanding' || i.status === 'overdue').length;
  const totalSpendYTD = engagements.reduce((sum, e) => sum + e.totalValue, 0);

  // Engagement Status Distribution for Stacked Bar
  const totalEngagements = engagements.length;
  const approvedCount = engagements.filter((e) => e.status === 'approved').length;
  const underReviewCount = engagements.filter((e) => e.status === 'under-review').length;
  const activeCount = engagements.filter((e) => e.status === 'active').length;
  const completedCount = engagements.filter((e) => e.status === 'completed').length;

  const statusStackedData = [{
    name: 'Status',
    approved: approvedCount,
    underReview: underReviewCount,
    active: activeCount,
    completed: completedCount,
  }];

  // Calculate completion rate
  const completionRate = totalEngagements > 0 ? Math.round((completedCount / totalEngagements) * 100) : 0;

  // Approval Pipeline by Department
  const departmentData = Array.from(
    new Set(engagements.map((e) => e.department))
  ).map((dept) => {
    const pending = engagements.filter((e) => e.department === dept && e.status === 'under-review').length;
    const approved = engagements.filter((e) => e.department === dept && e.status === 'approved').length;
    const completed = engagements.filter((e) => e.department === dept && e.status === 'completed').length;
    const total = pending + approved + completed;
    
    return {
      name: dept,
      pending,
      approved,
      completed,
      total,
    };
  });

  // Monthly Spending Trends (Last 6 months) - Curved with gradient
  const spendingTrends = [
    { month: 'Aug', IT: 45000, Operations: 32000, Finance: 28000, Marketing: 15000 },
    { month: 'Sep', IT: 52000, Operations: 38000, Finance: 31000, Marketing: 18000 },
    { month: 'Oct', IT: 48000, Operations: 42000, Finance: 35000, Marketing: 22000 },
    { month: 'Nov', IT: 61000, Operations: 45000, Finance: 38000, Marketing: 25000 },
    { month: 'Dec', IT: 58000, Operations: 48000, Finance: 42000, Marketing: 28000 },
    { month: 'Jan', IT: 65000, Operations: 51000, Finance: 45000, Marketing: 31000 },
  ];

  // Calculate trend percentage
  const latestIT = spendingTrends[spendingTrends.length - 1].IT;
  const previousIT = spendingTrends[spendingTrends.length - 2].IT;
  const trendPercentage = Math.round(((latestIT - previousIT) / previousIT) * 100);

  // Department Engagement Volume & Value - Dual Axis
  const engagementVolume = Array.from(
    new Set(engagements.map((e) => e.department))
  ).map((dept) => ({
    name: dept,
    volume: engagements.filter((e) => e.department === dept).length,
    value: engagements.filter((e) => e.department === dept).reduce((sum, e) => sum + e.totalValue, 0) / 1000,
  }));

  // Recent Activity
  const recentActivity = engagements
    .flatMap((e) => 
      e.activityLog.map((log) => ({
        ...log,
        engagementId: e.id,
        engagementTitle: e.title,
      }))
    )
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 8);

  // High-Risk Flags
  const highRiskEngagements = engagements.filter((e) => 
    e.rfqs.some((rfq) => rfq.aiRiskFlag && rfq.aiRiskFlag !== 'None')
  );

  // System Health Indicator
  const systemHealth = highRiskEngagements.length === 0 && pendingApprovals < 5 ? 'Stable' : 
                       highRiskEngagements.length > 2 || pendingApprovals > 10 ? 'Attention' : 'Good';

  // Spend Alert
  const showSpendAlert = trendPercentage > 15;

  // Custom Tooltip for Charts
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white px-4 py-3 rounded-lg shadow-lg border border-gray-200">
          <p className="text-sm font-semibold text-gray-900 mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-xs text-gray-700 flex items-center gap-2">
              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }}></span>
              <span className="font-medium">{entry.name}:</span>
              <span className="font-semibold">{typeof entry.value === 'number' && entry.value > 1000 
                ? `$${entry.value.toLocaleString()}` 
                : entry.value}</span>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Header with System Health */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900">Global Dashboard</h1>
          <p className="text-gray-500 mt-1">
            Executive overview across all departments
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600 font-medium">System Health:</span>
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-semibold ${
            systemHealth === 'Stable' ? 'bg-emerald-50 text-emerald-700' :
            systemHealth === 'Good' ? 'bg-blue-50 text-blue-700' :
            'bg-amber-50 text-amber-700'
          }`}>
            <span className={`w-2 h-2 rounded-full ${
              systemHealth === 'Stable' ? 'bg-emerald-500 animate-pulse' :
              systemHealth === 'Good' ? 'bg-blue-500' :
              'bg-amber-500 animate-pulse'
            }`}></span>
            {systemHealth}
          </div>
        </div>
      </div>

      {/* Spend Alert Banner */}
      {showSpendAlert && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-amber-900">
              ⚠ IT Spend up {trendPercentage}% this month
            </p>
            <p className="text-xs text-amber-700 mt-1">
              Current trajectory exceeds quarterly budget projections. Review recommended.
            </p>
          </div>
        </div>
      )}

      {/* AI Insights Banner */}
      <div className="bg-gradient-to-r from-indigo-600 to-blue-600 rounded-xl p-6 text-white shadow-lg">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-6 h-6" />
              <h2 className="text-xl font-semibold">AI-Powered Insights</h2>
            </div>
            <p className="text-blue-100 text-sm mb-4">
              Get instant analysis of all engagements, vendors, and financial data with AI
            </p>
            <button
              onClick={() => alert('AI Platform Analysis\n\nGenerating insights:\n• Risk assessment across all vendors\n• Spending pattern analysis\n• Approval bottleneck detection\n• Contract compliance review\n• Vendor performance trends\n• Budget optimization recommendations')}
              className="px-5 py-2.5 bg-white text-indigo-600 rounded-lg hover:bg-blue-50 transition-colors text-sm font-semibold shadow-sm"
            >
              <Sparkles className="w-4 h-4 inline mr-2" />
              Generate Platform Analysis
            </button>
          </div>
          <div className="hidden lg:flex items-center justify-center ml-6">
            <div className="w-24 h-24 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-sm">
              <TrendingUp className="w-12 h-12 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced KPI Cards with Accent Bar */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Active Engagements */}
        <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6 relative overflow-hidden hover:shadow-lg transition-shadow">
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500"></div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Active Engagements</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {activeEngagements}
              </p>
            </div>
            <div className="bg-blue-100 p-3 rounded-xl">
              <Briefcase className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <div className="flex items-center mt-4 text-sm">
            <TrendingUp className="w-4 h-4 text-emerald-600 mr-1" />
            <span className="text-emerald-600 font-semibold">12%</span>
            <span className="text-gray-500 ml-2">vs last month</span>
          </div>
        </div>

        {/* Pending Approvals */}
        <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6 relative overflow-hidden hover:shadow-lg transition-shadow">
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-amber-500"></div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Pending Approvals</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {pendingApprovals}
              </p>
            </div>
            <div className="bg-amber-100 p-3 rounded-xl">
              <CheckSquare className="w-6 h-6 text-amber-600" />
            </div>
          </div>
          <div className="flex items-center mt-4 text-sm">
            <Clock className="w-4 h-4 text-amber-600 mr-1" />
            <span className="text-gray-600">Avg. 2.4 days to approve</span>
          </div>
        </div>

        {/* Outstanding Invoices */}
        <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6 relative overflow-hidden hover:shadow-lg transition-shadow">
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-rose-500"></div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Outstanding Invoices</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {outstandingInvoices}
              </p>
            </div>
            <div className="bg-rose-100 p-3 rounded-xl">
              <Receipt className="w-6 h-6 text-rose-600" />
            </div>
          </div>
          <div className="flex items-center mt-4 text-sm">
            <TrendingDown className="w-4 h-4 text-emerald-600 mr-1" />
            <span className="text-emerald-600 font-semibold">8%</span>
            <span className="text-gray-500 ml-2">vs last month</span>
          </div>
        </div>

        {/* Total Spend */}
        <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6 relative overflow-hidden hover:shadow-lg transition-shadow">
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-500"></div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Total Spend (YTD)</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                ${(totalSpendYTD / 1000).toFixed(0)}K
              </p>
            </div>
            <div className="bg-emerald-100 p-3 rounded-xl">
              <DollarSign className="w-6 h-6 text-emerald-600" />
            </div>
          </div>
          <div className="flex items-center mt-4 text-sm">
            <TrendingUp className="w-4 h-4 text-emerald-600 mr-1" />
            <span className="text-emerald-600 font-semibold">18%</span>
            <span className="text-gray-500 ml-2">vs last quarter</span>
          </div>
        </div>
      </div>

      {/* Main Analytics - 60/40 Split */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Monthly Spending Trends - 60% */}
        <div className="lg:col-span-3 bg-white rounded-xl shadow-md border border-gray-200 p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-gray-900">
              Monthly Spending Trends by Department
            </h2>
            <div className="flex items-center gap-2">
              {/* Time Range Toggle */}
              <div className="flex items-center bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setTimeRange('monthly')}
                  className={`px-3 py-1 text-xs font-semibold rounded transition-all ${
                    timeRange === 'monthly' 
                      ? 'bg-white text-blue-600 shadow-sm' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Monthly
                </button>
                <button
                  onClick={() => setTimeRange('quarterly')}
                  className={`px-3 py-1 text-xs font-semibold rounded transition-all ${
                    timeRange === 'quarterly' 
                      ? 'bg-white text-blue-600 shadow-sm' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Quarterly
                </button>
                <button
                  onClick={() => setTimeRange('ytd')}
                  className={`px-3 py-1 text-xs font-semibold rounded transition-all ${
                    timeRange === 'ytd' 
                      ? 'bg-white text-blue-600 shadow-sm' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  YTD
                </button>
              </div>
              
              {/* Trend Badge */}
              <div className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold ${
                trendPercentage > 0 
                  ? 'bg-emerald-50 text-emerald-700' 
                  : 'bg-rose-50 text-rose-700'
              }`}>
                {trendPercentage > 0 ? '↑' : '↓'} {Math.abs(trendPercentage)}% vs last period
              </div>
            </div>
          </div>
          
          <ResponsiveContainer width="100%" height={320}>
            <ComposedChart data={spendingTrends}>
              <defs>
                {/* Gradient for IT (Primary) */}
                <linearGradient id="colorIT" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={COLORS.primary} stopOpacity={0.3}/>
                  <stop offset="95%" stopColor={COLORS.primary} stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" strokeOpacity={0.5} vertical={false} />
              <XAxis 
                dataKey="month" 
                tick={{ fill: '#64748B', fontSize: 12 }}
                axisLine={{ stroke: '#e5e7eb' }}
              />
              <YAxis 
                tick={{ fill: '#64748B', fontSize: 12 }}
                axisLine={{ stroke: '#e5e7eb' }}
                tickFormatter={(value) => `$${(value / 1000).toFixed(0)}K`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend 
                wrapperStyle={{ paddingTop: '20px' }}
                iconType="circle"
              />
              
              {/* IT - Primary with Area Fill */}
              <Area 
                type="natural" 
                dataKey="IT" 
                stroke={COLORS.primary} 
                strokeWidth={2.5}
                fill="url(#colorIT)" 
                name="IT" 
                dot={{ fill: COLORS.primary, r: 5, strokeWidth: 2, stroke: '#fff' }}
              />
              
              {/* Secondary Lines - Thinner and Lower Opacity */}
              <Line 
                type="natural" 
                dataKey="Operations" 
                stroke={COLORS.neutral} 
                strokeWidth={1.5}
                strokeOpacity={0.8}
                name="Operations" 
                dot={{ fill: COLORS.neutral, r: 4 }}
              />
              <Line 
                type="natural" 
                dataKey="Finance" 
                stroke={COLORS.success} 
                strokeWidth={1.5}
                strokeOpacity={0.8}
                name="Finance" 
                dot={{ fill: COLORS.success, r: 4 }}
              />
              <Line 
                type="natural" 
                dataKey="Marketing" 
                stroke={COLORS.purple} 
                strokeWidth={1.5}
                strokeOpacity={0.8}
                name="Marketing" 
                dot={{ fill: COLORS.purple, r: 4 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Approval Pipeline - 40% */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-md border border-gray-200 p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center gap-2 mb-6">
            <Activity className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-bold text-gray-900">
              Approval Pipeline Overview
            </h2>
          </div>
          
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={departmentData} layout="horizontal">
              <CartesianGrid 
                strokeDasharray="3 3" 
                stroke="#e5e7eb" 
                strokeOpacity={0.3}
                horizontal={true}
                vertical={false}
              />
              <XAxis type="number" tick={{ fill: '#64748B', fontSize: 11 }} />
              <YAxis 
                type="category" 
                dataKey="name" 
                tick={{ fill: '#64748B', fontSize: 11 }}
                width={80}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend 
                wrapperStyle={{ paddingTop: '10px' }}
                iconType="circle"
              />
              
              <Bar dataKey="pending" fill={COLORS.warning} name="Pending" radius={[4, 4, 4, 4]} />
              <Bar dataKey="approved" fill={COLORS.primary} name="Approved" radius={[4, 4, 4, 4]} />
              <Bar dataKey="completed" fill={COLORS.success} name="Completed" radius={[4, 4, 4, 4]} />
            </BarChart>
          </ResponsiveContainer>

          {/* Mini Department Stats */}
          <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-gray-200">
            {departmentData.slice(0, 4).map((dept) => (
              <div key={dept.name} className="text-center">
                <p className="text-xs text-gray-500 font-medium">{dept.name}</p>
                <p className="text-lg font-bold text-gray-900">{dept.total}</p>
              </div>
            ))}
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
            <p className="text-2xl font-bold text-emerald-600">{completionRate}%</p>
          </div>
        </div>

        {/* Horizontal Stacked Bar */}
        <div className="relative">
          <div className="flex h-16 rounded-lg overflow-hidden shadow-sm">
            {approvedCount > 0 && (
              <div 
                className="bg-blue-500 hover:bg-blue-600 transition-colors flex items-center justify-center text-white font-semibold text-sm cursor-pointer"
                style={{ width: `${(approvedCount / totalEngagements) * 100}%` }}
                title={`Approved: ${approvedCount}`}
              >
                {((approvedCount / totalEngagements) * 100).toFixed(0)}%
              </div>
            )}
            {underReviewCount > 0 && (
              <div 
                className="bg-amber-500 hover:bg-amber-600 transition-colors flex items-center justify-center text-white font-semibold text-sm cursor-pointer"
                style={{ width: `${(underReviewCount / totalEngagements) * 100}%` }}
                title={`Under Review: ${underReviewCount}`}
              >
                {((underReviewCount / totalEngagements) * 100).toFixed(0)}%
              </div>
            )}
            {activeCount > 0 && (
              <div 
                className="bg-teal-500 hover:bg-teal-600 transition-colors flex items-center justify-center text-white font-semibold text-sm cursor-pointer"
                style={{ width: `${(activeCount / totalEngagements) * 100}%` }}
                title={`Active: ${activeCount}`}
              >
                {((activeCount / totalEngagements) * 100).toFixed(0)}%
              </div>
            )}
            {completedCount > 0 && (
              <div 
                className="bg-slate-500 hover:bg-slate-600 transition-colors flex items-center justify-center text-white font-semibold text-sm cursor-pointer"
                style={{ width: `${(completedCount / totalEngagements) * 100}%` }}
                title={`Completed: ${completedCount}`}
              >
                {((completedCount / totalEngagements) * 100).toFixed(0)}%
              </div>
            )}
          </div>

          {/* Legend */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-500 rounded"></div>
              <div>
                <p className="text-xs text-gray-500">Approved</p>
                <p className="text-sm font-bold text-gray-900">{approvedCount}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-amber-500 rounded"></div>
              <div>
                <p className="text-xs text-gray-500">Under Review</p>
                <p className="text-sm font-bold text-gray-900">{underReviewCount}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-teal-500 rounded"></div>
              <div>
                <p className="text-xs text-gray-500">Active</p>
                <p className="text-sm font-bold text-gray-900">{activeCount}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-slate-500 rounded"></div>
              <div>
                <p className="text-xs text-gray-500">Completed</p>
                <p className="text-sm font-bold text-gray-900">{completedCount}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Department Engagement - Dual Chart Approach */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Volume Chart */}
        <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center gap-2 mb-6">
            <Layers className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-bold text-gray-900">
              Department Engagement Volume
            </h2>
          </div>
          
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={engagementVolume}>
              <CartesianGrid 
                strokeDasharray="3 3" 
                stroke="#e5e7eb" 
                strokeOpacity={0.3}
                vertical={false}
              />
              <XAxis 
                dataKey="name" 
                tick={{ fill: '#64748B', fontSize: 11 }}
                angle={-15}
                textAnchor="end"
                height={60}
              />
              <YAxis tick={{ fill: '#64748B', fontSize: 11 }} />
              <Tooltip content={<CustomTooltip />} />
              <Bar 
                dataKey="volume" 
                fill={COLORS.primary} 
                name="Engagements"
                radius={[8, 8, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Value Chart */}
        <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center gap-2 mb-6">
            <DollarSign className="w-5 h-5 text-emerald-600" />
            <h2 className="text-lg font-bold text-gray-900">
              Department Spend Value ($K)
            </h2>
          </div>
          
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={engagementVolume}>
              <CartesianGrid 
                strokeDasharray="3 3" 
                stroke="#e5e7eb" 
                strokeOpacity={0.3}
                vertical={false}
              />
              <XAxis 
                dataKey="name" 
                tick={{ fill: '#64748B', fontSize: 11 }}
                angle={-15}
                textAnchor="end"
                height={60}
              />
              <YAxis tick={{ fill: '#64748B', fontSize: 11 }} />
              <Tooltip content={<CustomTooltip />} />
              <Bar 
                dataKey="value" 
                fill={COLORS.success} 
                name="Value ($K)"
                radius={[8, 8, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bottom Section - Activity & Risk */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity Log */}
        <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow">
          <div className="p-6 border-b border-gray-200 bg-gray-50">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-600" />
              Recent Activity Log
            </h2>
          </div>
          <div className="p-6 max-h-96 overflow-y-auto">
            <div className="space-y-4">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="flex gap-4 pb-4 border-b border-gray-100 last:border-0">
                  <div className="flex-shrink-0 w-2 h-2 mt-2 rounded-full bg-blue-500"></div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-gray-900">
                          {activity.action}
                        </p>
                        <p className="text-sm text-gray-600 mt-1">
                          {activity.details}
                        </p>
                        <Link
                          href={`/engagements/${activity.engagementId}`}
                          className="text-xs text-blue-600 hover:text-blue-700 font-medium mt-1 inline-block"
                        >
                          {activity.engagementTitle}
                        </Link>
                      </div>
                      <div className="flex-shrink-0 text-right">
                        <p className="text-xs text-gray-500 font-medium">
                          {formatDate(new Date(activity.timestamp))}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {activity.user}
                        </p>
                      </div>
                    </div>
                    {activity.statusChange && (
                      <div className="mt-2">
                        <span className="text-xs px-2 py-1 bg-blue-50 text-blue-700 rounded-lg font-medium">
                          {activity.statusChange}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* High-Risk Flags Panel */}
        <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow">
          <div className="p-6 border-b border-gray-200 bg-gray-50">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-rose-600" />
              High-Risk Flags
            </h2>
          </div>
          <div className="p-6">
            {highRiskEngagements.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckSquare className="w-8 h-8 text-emerald-600" />
                </div>
                <p className="text-sm font-semibold text-gray-900">No high-risk engagements</p>
                <p className="text-xs text-gray-500 mt-1">
                  All engagements are within acceptable risk parameters
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {highRiskEngagements.map((eng) => (
                  <Link
                    key={eng.id}
                    href={`/engagements/${eng.id}`}
                    className="block p-4 bg-rose-50 border border-rose-200 rounded-lg hover:bg-rose-100 hover:border-rose-300 transition-all"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900 text-sm">
                          {eng.title}
                        </p>
                        <p className="text-xs text-gray-600 mt-1">
                          {eng.department} • {eng.vendorName}
                        </p>
                      </div>
                      <StatusBadge status={eng.status} />
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                      <p className="text-xs text-rose-700 font-semibold">
                        {eng.rfqs.find((r) => r.aiRiskFlag && r.aiRiskFlag !== 'None')?.aiRiskFlag}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
