import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/router';
import {
  FileDown,
  ChevronDown,
  TrendingUp,
  TrendingDown,
  FileText,
  Calendar,
  AlertCircle,
  Share2,
  Check,
  RefreshCcw,
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { useReports } from '@/lib/hooks/useReports';
import { Skeleton } from '@/app/components/ui/skeleton';

/* ------------------------------------------------------------------ */
/*  MonthlyReportsPage — matches Figma "Monthly Accounting Report"    */
/* ------------------------------------------------------------------ */
export function MonthlyReportsPage() {
  const router = useRouter();

  const years = ['2024', '2025', '2026'];
  const months = [
    'January','February','March','April','May','June',
    'July','August','September','October','November','December',
  ];

  const today = new Date();
  const currentMonth = months[today.getMonth()];
  const currentYear = today.getFullYear().toString();

  const [selectedYear, setSelectedYear] = useState(years.includes(currentYear) ? currentYear : '2026');
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [selectedCategory, setSelectedCategory] = useState<'department' | 'vendor'>('department');
  const [linkCopied, setLinkCopied] = useState(false);

  // Derive start / end dates from selection
  const { startDate, endDate } = useMemo(() => {
    const y = parseInt(selectedYear);
    const m = months.indexOf(selectedMonth);
    const start = new Date(y, m, 1).toISOString();
    const end = new Date(y, m + 1, 0, 23, 59, 59).toISOString();
    return { startDate: start, endDate: end };
  }, [selectedYear, selectedMonth]);

  // Read URL params initially
  useEffect(() => {
    if (router.isReady) {
      const qYear = router.query.year as string;
      const qMonth = router.query.month as string;
      const qCategory = router.query.category as string;
      if (qYear && years.includes(qYear)) setSelectedYear(qYear);
      if (qMonth && months.includes(qMonth)) setSelectedMonth(qMonth);
      if (qCategory === 'department' || qCategory === 'vendor') setSelectedCategory(qCategory);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router.isReady]);

  const filters = useMemo(() => ({
    startDate,
    endDate,
    category: selectedCategory,
  }), [startDate, endDate, selectedCategory]);

  const { data, isLoading, error, refetch } = useReports(filters);

  /* ---- Share Link ---- */
  const handleShareLink = () => {
    const url = new URL(window.location.origin + '/reports');
    url.searchParams.set('year', selectedYear);
    url.searchParams.set('month', selectedMonth);
    url.searchParams.set('category', selectedCategory);
    navigator.clipboard.writeText(url.toString());
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  };

  /* ---- Export PDF (browser print) ---- */
  const handleExportPDF = () => {
    window.print();
  };

  /* ---- Export Excel ---- */
  const handleExportExcel = () => {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    params.append('category', selectedCategory);
    window.location.href = `/api/reports/export/excel?${params.toString()}`;
  };

  /* ---- Formatting helpers ---- */
  const fmt = (amount: number) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency', currency: 'USD',
      minimumFractionDigits: 0, maximumFractionDigits: 0,
    }).format(amount);

  const fmtPct = (v: number) => `${v > 0 ? '+' : ''}${v.toFixed(1)}%`;

  /* ---- Derived reconciliation rows ---- */
  const reconRows = useMemo(() => {
    if (!data) return [];
    const s = data.summary;
    return [
      { label: 'Total Engagements', count: s.totalEngagements, amount: s.totalAwardedValue },
      { label: 'Total Invoices', count: s.totalInvoices, amount: s.totalInvoicedAmount },
      { label: 'Paid Invoices', count: s.totalPaidInvoices, amount: s.totalPaidAmount },
      { label: 'Partially Paid', count: 0, amount: 0 },
      { label: 'Cancelled', count: 0, amount: 0 },
    ];
  }, [data]);

  /* ---- Pie data ---- */
  const pieData = useMemo(() => {
    if (!data) return [];
    return [
      { name: 'Paid', value: data.summary.totalPaidAmount },
      { name: 'Outstanding', value: data.summary.outstandingPayables },
    ];
  }, [data]);

  /* ---- Previous-month comparison (static placeholder — replace when backend supports) ---- */
  const prevPct = { awarded: 8.5, invoiced: 12.3, paid: 11.8, outstanding: -100 };

  /* ================================================================ */
  /*  RENDER                                                          */
  /* ================================================================ */
  return (
    <div className="space-y-6">
      {/* ── Page Header ─────────────────────────────────────────── */}
      <div>
        <h1 className="text-3xl font-semibold text-gray-900">Monthly Accounting Report</h1>
        <p className="text-gray-500 mt-1">
          Financial summaries, account breakdowns, and reconciliation for audit and governance
        </p>
      </div>

      {/* ── Toolbar (date + export) ──────────────────────────────── */}
      <div className="sticky top-16 z-20 bg-white border border-gray-200 rounded-lg shadow-sm p-4">
        <div className="flex items-center justify-between">
          {/* Combined month-year dropdown */}
          <div className="relative">
            <select
              value={`${selectedMonth} ${selectedYear}`}
              onChange={(e) => {
                const parts = e.target.value.split(' ');
                setSelectedMonth(parts[0]);
                setSelectedYear(parts[1]);
              }}
              className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-10 text-sm font-medium text-gray-700 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              {[...years].reverse().map((y) =>
                [...months].reverse().map((m) => (
                  <option key={`${m}-${y}`} value={`${m} ${y}`}>
                    {m} {y}
                  </option>
                ))
              )}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
          </div>

          {/* Category dropdown */}
          <div className="relative border-l border-gray-200 ml-4 pl-4 hidden sm:block">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value as 'department' | 'vendor')}
              className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-10 text-sm font-medium text-gray-700 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              <option value="department">By Department</option>
              <option value="vendor">By Vendor</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 mt-4 sm:mt-0">
            <button
              onClick={handleShareLink}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border transition-colors ${
                linkCopied
                  ? 'text-green-700 bg-green-50 border-green-300'
                  : 'text-gray-700 bg-white border-gray-300 hover:bg-gray-50'
              }`}
            >
              {linkCopied ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
              {linkCopied ? 'Link Copied!' : 'Share Link'}
            </button>
            <button
              onClick={handleExportPDF}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <FileDown className="w-4 h-4" />
              Export PDF
            </button>
            <button
              onClick={handleExportExcel}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <FileDown className="w-4 h-4" />
              Export Excel
            </button>
          </div>
        </div>
      </div>

      {/* ── Error state ──────────────────────────────────────────── */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p className="text-sm">{error}</p>
          </div>
          <button
            onClick={refetch}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-700 bg-red-100 rounded-lg hover:bg-red-200 transition-colors"
          >
            <RefreshCcw className="w-3.5 h-3.5" />
            Retry
          </button>
        </div>
      )}

      {/* ── Section 1 — Financial Summary ────────────────────────── */}
      <div>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
          Financial Summary – {selectedMonth} {selectedYear}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="Total Awarded Value"
            value={data?.summary.totalAwardedValue ?? null}
            pctChange={prevPct.awarded}
            subtitle={`${data?.summary.totalEngagements ?? 0} engagements`}
            isLoading={isLoading}
          />
          <MetricCard
            title="Total Invoiced"
            value={data?.summary.totalInvoicedAmount ?? null}
            pctChange={prevPct.invoiced}
            subtitle={`${data?.summary.totalInvoices ?? 0} invoices generated`}
            isLoading={isLoading}
          />
          <MetricCard
            title="Total Paid"
            value={data?.summary.totalPaidAmount ?? null}
            pctChange={prevPct.paid}
            subtitle={`${data?.summary.totalPaidInvoices ?? 0} invoices paid`}
            isLoading={isLoading}
          />
          <MetricCard
            title="Outstanding Payables"
            value={data?.summary.outstandingPayables ?? null}
            pctChange={prevPct.outstanding}
            invertColor
            subtitle="0 unpaid invoices"
            isLoading={isLoading}
          />
        </div>
      </div>

      {/* ── Section 2 — Financial Trends ─────────────────────────── */}
      <div>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
          Financial Trends
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Line Chart – Monthly Spend Trend */}
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">
              Monthly Spend Trend (12 Month Rolling)
            </h3>
            {isLoading ? (
              <Skeleton className="w-full h-[280px]" />
            ) : data?.trends && data.trends.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={data.trends} onClick={(e) => e?.activeLabel && alert(`Drill down into ${e.activeLabel} spend trend`)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#6b7280' }} stroke="#9ca3af" />
                  <YAxis
                    tick={{ fontSize: 11, fill: '#6b7280' }}
                    stroke="#9ca3af"
                    tickFormatter={(v) => `$${(v / 1000).toFixed(0)}K`}
                  />
                  <Tooltip
                    formatter={(value: number) => fmt(value)}
                    contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '12px' }}
                  />
                  <Line type="monotone" dataKey="spend" stroke="#1e40af" strokeWidth={2} dot={{ fill: '#1e40af', r: 3 }} activeDot={{ r: 5 }} cursor="pointer" />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <EmptyChart />
            )}
          </div>

          {/* Bar Chart – Account Spend Comparison */}
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">
              Account Spend Comparison – {selectedMonth}
            </h3>
            {isLoading ? (
              <Skeleton className="w-full h-[280px]" />
            ) : data?.categoryBreakdown && data.categoryBreakdown.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={data.categoryBreakdown.slice(0, 8)} onClick={(e) => e?.activePayload?.[0]?.payload?.name && alert(`Drill down into component: ${e.activePayload[0].payload.name}`)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#6b7280' }} stroke="#9ca3af" />
                  <YAxis
                    tick={{ fontSize: 11, fill: '#6b7280' }}
                    stroke="#9ca3af"
                    tickFormatter={(v) => `$${(v / 1000).toFixed(0)}K`}
                  />
                  <Tooltip
                    formatter={(value: number) => fmt(value)}
                    contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '12px' }}
                  />
                  <Bar dataKey="spend" fill="#4b5563" radius={[4, 4, 0, 0]} cursor="pointer" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <EmptyChart />
            )}
          </div>
        </div>
      </div>

      {/* ── Section 3 — Payment Status Distribution (Donut) ──────── */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">Payment Status Distribution</h3>
        {isLoading ? (
          <Skeleton className="w-full h-[300px]" />
        ) : pieData.some((d) => d.value > 0) ? (
          <div className="flex items-center justify-center">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={80}
                  outerRadius={120}
                  paddingAngle={2}
                  dataKey="value"
                  label={({ name, percent }) =>
                    percent > 0 ? `${name}: ${(percent * 100).toFixed(0)}%` : ''
                  }
                >
                  <Cell fill="#10b981" />
                  <Cell fill="#ef4444" />
                </Pie>
                <Tooltip
                  formatter={(value: number) => fmt(value)}
                  contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '12px' }}
                />
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  wrapperStyle={{ fontSize: '12px', paddingTop: '20px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <EmptyChart />
        )}
      </div>

      {/* ── Section 4 — Reconciliation Summary ───────────────────── */}
      <div>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
          Reconciliation Summary
        </h2>
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Count
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Amount
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td className="px-6 py-4"><Skeleton className="h-4 w-32" /></td>
                    <td className="px-6 py-4 text-right"><Skeleton className="h-4 w-8 ml-auto" /></td>
                    <td className="px-6 py-4 text-right"><Skeleton className="h-4 w-20 ml-auto" /></td>
                  </tr>
                ))
              ) : reconRows.length > 0 ? (
                reconRows.map((row, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className={`px-6 py-4 text-sm font-medium ${
                      row.label === 'Paid Invoices' ? 'text-green-700' :
                      row.label === 'Total Engagements' || row.label === 'Total Invoices'
                        ? 'text-blue-700' : 'text-gray-900'
                    }`}>
                      {row.label}
                    </td>
                    <td className="px-6 py-4 text-sm text-right text-gray-700">{row.count}</td>
                    <td className={`px-6 py-4 text-sm text-right font-medium ${
                      row.label === 'Paid Invoices' ? 'text-green-700' : 'text-gray-900'
                    }`}>
                      {fmt(row.amount)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={3} className="px-6 py-12 text-center text-sm text-gray-500">
                    No data available for selected filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>      {/* ── Section 5 — Detailed Invoice Report ──────────────────── */}
      <div>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4 mt-8">
          Detailed Invoice Report
        </h2>
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-x-auto">
          <table className="w-full min-w-[800px]">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Invoice / Vendor</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Engagement</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {isLoading ? (
                 Array.from({ length: 3 }).map((_, i) => (
                  <tr key={i}>
                    <td className="px-6 py-4"><Skeleton className="h-4 w-32 mb-1" /><Skeleton className="h-3 w-24" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-4 w-40" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-4 w-20" /></td>
                    <td className="px-6 py-4 text-right"><Skeleton className="h-4 w-24 ml-auto" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-6 w-16" /></td>
                  </tr>
                ))
              ) : data?.detailedTable && data.detailedTable.length > 0 ? (
                data.detailedTable.map((row) => (
                  <tr key={row.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => alert(`Drill down into invoice: ${row.invoiceNumber}`)}>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-blue-600 hover:underline">{row.invoiceNumber || 'N/A'}</div>
                      <div className="text-xs text-gray-500">{row.vendorName}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">{row.engagementTitle}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{row.date ? new Date(row.date).toLocaleDateString() : 'N/A'}</td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900 text-right">{fmt(row.totalAmount)}</td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        row.status.toLowerCase() === 'paid' ? 'bg-green-100 text-green-800' :
                        row.status.toLowerCase() === 'draft' ? 'bg-gray-100 text-gray-800' :
                        row.status.toLowerCase() === 'approved' ? 'bg-blue-100 text-blue-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {row.status}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-sm text-gray-500">
                    No detailed data found for the selected month.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      {/* ── Audit Footer ─────────────────────────────────────────── */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mt-8">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            <span>System Generated – {new Date().toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            <span>
              Audit Reference ID: RPT-{selectedYear}-{selectedMonth.substring(0, 3).toUpperCase()}-001
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ================================================================== */
/*  Sub-components                                                     */
/* ================================================================== */
function MetricCard({
  title, value, pctChange, subtitle, isLoading, invertColor = false,
}: {
  title: string;
  value: number | null;
  pctChange: number;
  subtitle: string;
  isLoading: boolean;
  invertColor?: boolean;
}) {
  const fmt = (n: number) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency', currency: 'USD',
      minimumFractionDigits: 0, maximumFractionDigits: 0,
    }).format(n);

  const isPositive = invertColor ? pctChange < 0 : pctChange > 0;

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{title}</p>
      {isLoading ? (
        <Skeleton className="h-8 w-1/2 mt-2 mb-1" />
      ) : (
        <p className="text-2xl font-bold text-gray-900 mt-2">{fmt(value || 0)}</p>
      )}
      <div className="flex items-center gap-1 mt-2">
        {isPositive ? (
          <TrendingUp className="w-3.5 h-3.5 text-green-600" />
        ) : (
          <TrendingDown className="w-3.5 h-3.5 text-red-600" />
        )}
        <span className={`text-xs font-medium ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
          {pctChange > 0 ? '+' : ''}{pctChange.toFixed(1)}% vs prev month
        </span>
      </div>
      <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
    </div>
  );
}

function EmptyChart() {
  return (
    <div className="flex items-center justify-center h-[280px] bg-gray-50 rounded border border-dashed border-gray-200">
      <p className="text-sm text-gray-500">No data available for selected filters.</p>
    </div>
  );
}
