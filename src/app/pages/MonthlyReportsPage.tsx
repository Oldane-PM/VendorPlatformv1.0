import { useState } from 'react';
import {
  FileDown,
  ChevronDown,
  ChevronRight,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  FileText,
  Lock,
  Calendar,
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

// Mock data types
interface AccountBreakdown {
  accountCode: string;
  accountName: string;
  engagementCount: number;
  totalAwarded: number;
  totalInvoiced: number;
  paid: number;
  outstanding: number;
  vendors: VendorInAccount[];
}

interface VendorInAccount {
  vendorName: string;
  invoiceCount: number;
  amount: number;
}

interface ActiveVendor {
  vendorId: string;
  vendorName: string;
  engagements: number;
  invoices: number;
  totalAmount: number;
  riskScore: number;
  status: 'Active' | 'High Risk' | 'Pending';
}

interface AgingBucket {
  range: string;
  amount: number;
  percentage: number;
}

// Mock Data
const mockAccounts: AccountBreakdown[] = [
  {
    accountCode: 'IT-2100',
    accountName: 'Cloud Infrastructure Services',
    engagementCount: 3,
    totalAwarded: 650000,
    totalInvoiced: 294000,
    paid: 294000,
    outstanding: 0,
    vendors: [
      { vendorName: 'CloudTech Solutions', invoiceCount: 2, amount: 204000 },
      { vendorName: 'Azure Partners Inc', invoiceCount: 1, amount: 90000 },
    ],
  },
  {
    accountCode: 'IT-2200',
    accountName: 'Network Security',
    engagementCount: 2,
    totalAwarded: 450000,
    totalInvoiced: 180000,
    paid: 180000,
    outstanding: 0,
    vendors: [
      { vendorName: 'SecureNet Systems', invoiceCount: 1, amount: 180000 },
    ],
  },
  {
    accountCode: 'IT-3100',
    accountName: 'Business Intelligence & Analytics',
    engagementCount: 1,
    totalAwarded: 125000,
    totalInvoiced: 125000,
    paid: 125000,
    outstanding: 0,
    vendors: [
      { vendorName: 'DataViz Analytics', invoiceCount: 1, amount: 125000 },
    ],
  },
  {
    accountCode: 'FAC-4500',
    accountName: 'Facilities Management',
    engagementCount: 1,
    totalAwarded: 95000,
    totalInvoiced: 0,
    paid: 0,
    outstanding: 0,
    vendors: [],
  },
];

const mockActiveVendors: ActiveVendor[] = [
  {
    vendorId: 'VEN-001',
    vendorName: 'CloudTech Solutions',
    engagements: 2,
    invoices: 2,
    totalAmount: 204000,
    riskScore: 15,
    status: 'Active',
  },
  {
    vendorId: 'VEN-002',
    vendorName: 'SecureNet Systems',
    engagements: 1,
    invoices: 1,
    totalAmount: 180000,
    riskScore: 22,
    status: 'Active',
  },
  {
    vendorId: 'VEN-003',
    vendorName: 'DataViz Analytics',
    engagements: 1,
    invoices: 1,
    totalAmount: 125000,
    riskScore: 8,
    status: 'Active',
  },
  {
    vendorId: 'VEN-004',
    vendorName: 'Azure Partners Inc',
    engagements: 1,
    invoices: 1,
    totalAmount: 90000,
    riskScore: 68,
    status: 'High Risk',
  },
];

const mockAgingData: AgingBucket[] = [
  { range: '0–30 days', amount: 0, percentage: 0 },
  { range: '31–60 days', amount: 0, percentage: 0 },
  { range: '61–90 days', amount: 0, percentage: 0 },
  { range: '90+ days', amount: 0, percentage: 0 },
];

// 12-month rolling trend data
const mockTrendData = [
  { month: 'Mar 2025', spend: 420000 },
  { month: 'Apr 2025', spend: 385000 },
  { month: 'May 2025', spend: 510000 },
  { month: 'Jun 2025', spend: 475000 },
  { month: 'Jul 2025', spend: 530000 },
  { month: 'Aug 2025', spend: 490000 },
  { month: 'Sep 2025', spend: 615000 },
  { month: 'Oct 2025', spend: 580000 },
  { month: 'Nov 2025', spend: 545000 },
  { month: 'Dec 2025', spend: 620000 },
  { month: 'Jan 2026', spend: 590000 },
  { month: 'Feb 2026', spend: 599000 },
];

// Account spend comparison
const mockAccountSpendData = [
  { account: 'IT-2100', spend: 294000 },
  { account: 'IT-2200', spend: 180000 },
  { account: 'IT-3100', spend: 125000 },
  { account: 'FAC-4500', spend: 0 },
];

// Paid vs Outstanding
const mockPaidVsOutstanding = [
  { name: 'Paid', value: 599000, percentage: 100 },
  { name: 'Outstanding', value: 0, percentage: 0 },
];

export function MonthlyReportsPage() {
  const [selectedYear, setSelectedYear] = useState('2026');
  const [selectedMonth, setSelectedMonth] = useState('February');
  const [viewMode, setViewMode] = useState<'month' | 'year'>('month');
  const [expandedAccounts, setExpandedAccounts] = useState<string[]>([]);
  const [isMonthClosed, setIsMonthClosed] = useState(false);

  const years = ['2024', '2025', '2026'];
  const months = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];

  const toggleAccountExpansion = (accountCode: string) => {
    setExpandedAccounts((prev) =>
      prev.includes(accountCode)
        ? prev.filter((code) => code !== accountCode)
        : [...prev, accountCode]
    );
  };

  // Calculate summary metrics
  const totalAwarded = mockAccounts.reduce((sum, acc) => sum + acc.totalAwarded, 0);
  const totalInvoiced = mockAccounts.reduce((sum, acc) => sum + acc.totalInvoiced, 0);
  const totalPaid = mockAccounts.reduce((sum, acc) => sum + acc.paid, 0);
  const outstandingPayables = mockAccounts.reduce((sum, acc) => sum + acc.outstanding, 0);

  // Previous month comparison (mock)
  const prevMonthComparison = {
    awarded: 8.5,
    invoiced: 12.3,
    paid: 11.8,
    outstanding: -100,
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatPercent = (value: number) => {
    return `${value > 0 ? '+' : ''}${value.toFixed(1)}%`;
  };

  const handleExportPDF = () => {
    alert('PDF Export functionality would be implemented here');
  };

  const handleExportExcel = () => {
    alert('Excel Export functionality would be implemented here');
  };

  const handleCloseMonth = () => {
    setIsMonthClosed(!isMonthClosed);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-semibold text-gray-900">Monthly Accounting Report</h1>
        <p className="text-gray-500 mt-1">
          Financial summaries, account breakdowns, and reconciliation for audit and governance
        </p>
      </div>

      {/* Date Control Section - Sticky Header */}
      <div className="sticky top-16 z-20 bg-white border border-gray-200 rounded-lg shadow-sm p-4">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          {/* Left Side - Date Controls */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Year Selector */}
            <div className="relative">
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-10 text-sm font-medium text-gray-700 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                {years.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
            </div>

            {/* Month Selector */}
            <div className="relative">
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-10 text-sm font-medium text-gray-700 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                {months.map((month) => (
                  <option key={month} value={month}>
                    {month}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
            </div>

            {/* View Toggle */}
            <div className="flex items-center bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('month')}
                className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
                  viewMode === 'month'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Monthly View
              </button>
              <button
                onClick={() => setViewMode('year')}
                className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
                  viewMode === 'year'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Annual View
              </button>
            </div>

            {/* Month Status Badge */}
            {isMonthClosed && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 border border-gray-300 rounded-lg">
                <Lock className="w-3.5 h-3.5 text-gray-600" />
                <span className="text-xs font-semibold text-gray-700">Month Closed</span>
              </div>
            )}
          </div>

          {/* Right Side - Export & Close Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportPDF}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <FileDown className="w-4 h-4" />
              <span className="hidden sm:inline">Export PDF</span>
            </button>
            <button
              onClick={handleExportExcel}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <FileDown className="w-4 h-4" />
              <span className="hidden sm:inline">Export Excel</span>
            </button>
            <button
              onClick={handleCloseMonth}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                isMonthClosed
                  ? 'text-blue-700 bg-blue-50 border border-blue-200 hover:bg-blue-100'
                  : 'text-white bg-gray-700 hover:bg-gray-800'
              }`}
            >
              <Lock className="w-4 h-4" />
              <span className="hidden sm:inline">{isMonthClosed ? 'Reopen Month' : 'Close Month'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Section 1: Monthly Financial Summary */}
      <div>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
          Financial Summary – {selectedMonth} {selectedYear}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Awarded Value */}
          <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Total Awarded Value
                </p>
                <p className="text-2xl font-bold text-gray-900 mt-2">{formatCurrency(totalAwarded)}</p>
                <div className="flex items-center gap-1 mt-2">
                  {prevMonthComparison.awarded > 0 ? (
                    <TrendingUp className="w-3.5 h-3.5 text-green-600" />
                  ) : (
                    <TrendingDown className="w-3.5 h-3.5 text-red-600" />
                  )}
                  <span
                    className={`text-xs font-medium ${
                      prevMonthComparison.awarded > 0 ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    {formatPercent(prevMonthComparison.awarded)} vs prev month
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1">{mockAccounts.length} engagements</p>
              </div>
            </div>
          </div>

          {/* Total Invoiced */}
          <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Total Invoiced
                </p>
                <p className="text-2xl font-bold text-gray-900 mt-2">{formatCurrency(totalInvoiced)}</p>
                <div className="flex items-center gap-1 mt-2">
                  {prevMonthComparison.invoiced > 0 ? (
                    <TrendingUp className="w-3.5 h-3.5 text-green-600" />
                  ) : (
                    <TrendingDown className="w-3.5 h-3.5 text-red-600" />
                  )}
                  <span
                    className={`text-xs font-medium ${
                      prevMonthComparison.invoiced > 0 ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    {formatPercent(prevMonthComparison.invoiced)} vs prev month
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1">4 invoices generated</p>
              </div>
            </div>
          </div>

          {/* Total Paid */}
          <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Total Paid</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">{formatCurrency(totalPaid)}</p>
                <div className="flex items-center gap-1 mt-2">
                  {prevMonthComparison.paid > 0 ? (
                    <TrendingUp className="w-3.5 h-3.5 text-green-600" />
                  ) : (
                    <TrendingDown className="w-3.5 h-3.5 text-red-600" />
                  )}
                  <span
                    className={`text-xs font-medium ${
                      prevMonthComparison.paid > 0 ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    {formatPercent(prevMonthComparison.paid)} vs prev month
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1">3 invoices paid</p>
              </div>
            </div>
          </div>

          {/* Outstanding Payables */}
          <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Outstanding Payables
                </p>
                <p className="text-2xl font-bold text-gray-900 mt-2">
                  {formatCurrency(outstandingPayables)}
                </p>
                <div className="flex items-center gap-1 mt-2">
                  {prevMonthComparison.outstanding < 0 ? (
                    <TrendingDown className="w-3.5 h-3.5 text-green-600" />
                  ) : (
                    <TrendingUp className="w-3.5 h-3.5 text-red-600" />
                  )}
                  <span
                    className={`text-xs font-medium ${
                      prevMonthComparison.outstanding < 0 ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    {formatPercent(prevMonthComparison.outstanding)} vs prev month
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1">0 unpaid invoices</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Section 2: Account Breakdown Table */}
      <div>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
          Account Breakdown – {selectedMonth}, {selectedYear}
        </h2>
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Account Code
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Account Name
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    # Engagements
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Total Awarded
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Total Invoiced
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Paid
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Outstanding
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {mockAccounts.map((account) => {
                  const isExpanded = expandedAccounts.includes(account.accountCode);
                  return (
                    <>
                      {/* Main Account Row */}
                      <tr
                        key={account.accountCode}
                        className="hover:bg-gray-50 cursor-pointer"
                        onClick={() => toggleAccountExpansion(account.accountCode)}
                      >
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">
                          <div className="flex items-center gap-2">
                            {account.vendors.length > 0 && (
                              <>
                                {isExpanded ? (
                                  <ChevronDown className="w-4 h-4 text-gray-500" />
                                ) : (
                                  <ChevronRight className="w-4 h-4 text-gray-500" />
                                )}
                              </>
                            )}
                            {account.accountCode}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700">{account.accountName}</td>
                        <td className="px-6 py-4 text-sm text-right text-gray-700">
                          {account.engagementCount}
                        </td>
                        <td className="px-6 py-4 text-sm text-right font-medium text-gray-900">
                          {formatCurrency(account.totalAwarded)}
                        </td>
                        <td className="px-6 py-4 text-sm text-right font-medium text-gray-900">
                          {formatCurrency(account.totalInvoiced)}
                        </td>
                        <td className="px-6 py-4 text-sm text-right text-green-700 font-medium">
                          {formatCurrency(account.paid)}
                        </td>
                        <td className="px-6 py-4 text-sm text-right text-red-700 font-medium">
                          {formatCurrency(account.outstanding)}
                        </td>
                      </tr>

                      {/* Expanded Vendor Sub-rows */}
                      {isExpanded &&
                        account.vendors.map((vendor, idx) => (
                          <tr key={`${account.accountCode}-${idx}`} className="bg-gray-50">
                            <td className="px-6 py-3 text-sm text-gray-500"></td>
                            <td className="px-6 py-3 text-sm text-gray-700 pl-12">
                              <div className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 bg-gray-400 rounded-full"></div>
                                {vendor.vendorName}
                              </div>
                            </td>
                            <td className="px-6 py-3 text-sm text-right text-gray-600">
                              {vendor.invoiceCount} invoice{vendor.invoiceCount !== 1 ? 's' : ''}
                            </td>
                            <td className="px-6 py-3 text-sm text-right text-gray-700"></td>
                            <td className="px-6 py-3 text-sm text-right text-gray-700">
                              {formatCurrency(vendor.amount)}
                            </td>
                            <td className="px-6 py-3 text-sm text-right text-gray-700"></td>
                            <td className="px-6 py-3 text-sm text-right text-gray-700"></td>
                          </tr>
                        ))}
                    </>
                  );
                })}
              </tbody>
              <tfoot className="bg-gray-50 border-t border-gray-300">
                <tr>
                  <td colSpan={3} className="px-6 py-4 text-sm font-semibold text-gray-900">
                    Total
                  </td>
                  <td className="px-6 py-4 text-sm text-right font-bold text-gray-900">
                    {formatCurrency(totalAwarded)}
                  </td>
                  <td className="px-6 py-4 text-sm text-right font-bold text-gray-900">
                    {formatCurrency(totalInvoiced)}
                  </td>
                  <td className="px-6 py-4 text-sm text-right font-bold text-green-700">
                    {formatCurrency(totalPaid)}
                  </td>
                  <td className="px-6 py-4 text-sm text-right font-bold text-red-700">
                    {formatCurrency(outstandingPayables)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>

      {/* Section 3: Active Vendors This Month */}
      <div>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
          Active Vendors – {selectedMonth}
        </h2>
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Vendor
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Engagements
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Invoices
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Total Amount
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Risk Score
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {mockActiveVendors.map((vendor) => (
                  <tr key={vendor.vendorId} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {vendor.vendorName}
                    </td>
                    <td className="px-6 py-4 text-sm text-right text-gray-700">
                      {vendor.engagements}
                    </td>
                    <td className="px-6 py-4 text-sm text-right text-gray-700">{vendor.invoices}</td>
                    <td className="px-6 py-4 text-sm text-right font-medium text-gray-900">
                      {formatCurrency(vendor.totalAmount)}
                    </td>
                    <td className="px-6 py-4 text-sm text-right">
                      <span
                        className={`inline-flex items-center gap-1 ${
                          vendor.riskScore > 50
                            ? 'text-red-700 font-semibold'
                            : vendor.riskScore > 30
                            ? 'text-yellow-700'
                            : 'text-green-700'
                        }`}
                      >
                        {vendor.riskScore > 50 && <AlertTriangle className="w-3.5 h-3.5" />}
                        {vendor.riskScore}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                          vendor.status === 'High Risk'
                            ? 'bg-red-50 text-red-700 border border-red-200'
                            : vendor.status === 'Active'
                            ? 'bg-green-50 text-green-700 border border-green-200'
                            : 'bg-yellow-50 text-yellow-700 border border-yellow-200'
                        }`}
                      >
                        {vendor.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Section 4: Monthly Trend Visualization */}
      <div>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
          Financial Trends
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Line Chart: Monthly Spend (12 Month Rolling) */}
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">
              Monthly Spend Trend (12 Month Rolling)
            </h3>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={mockTrendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 11, fill: '#6b7280' }}
                  stroke="#9ca3af"
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#6b7280' }}
                  stroke="#9ca3af"
                  tickFormatter={(value) => `$${(value / 1000).toFixed(0)}K`}
                />
                <Tooltip
                  formatter={(value: number) => formatCurrency(value)}
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="spend"
                  stroke="#1e40af"
                  strokeWidth={2}
                  dot={{ fill: '#1e40af', r: 3 }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Bar Chart: Account Spend Comparison */}
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">
              Account Spend Comparison – {selectedMonth}
            </h3>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={mockAccountSpendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  dataKey="account"
                  tick={{ fontSize: 11, fill: '#6b7280' }}
                  stroke="#9ca3af"
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#6b7280' }}
                  stroke="#9ca3af"
                  tickFormatter={(value) => `$${(value / 1000).toFixed(0)}K`}
                />
                <Tooltip
                  formatter={(value: number) => formatCurrency(value)}
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="spend" fill="#4b5563" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pie Chart: Paid vs Outstanding */}
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6 mt-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Payment Status Distribution</h3>
          <div className="flex items-center justify-center">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={mockPaidVsOutstanding}
                  cx="50%"
                  cy="50%"
                  innerRadius={80}
                  outerRadius={120}
                  paddingAngle={2}
                  dataKey="value"
                  label={({ name, percentage }) => `${name}: ${percentage}%`}
                >
                  <Cell fill="#10b981" />
                  <Cell fill="#ef4444" />
                </Pie>
                <Tooltip
                  formatter={(value: number) => formatCurrency(value)}
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                />
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  wrapperStyle={{ fontSize: '12px', paddingTop: '20px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Section 5: Invoice Status Aging Report */}
      <div>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
          Invoice Aging Report
        </h2>
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Aging Bucket
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Distribution
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {mockAgingData.map((bucket, idx) => (
                <tr key={idx} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{bucket.range}</td>
                  <td className="px-6 py-4 text-sm text-right font-medium text-gray-900">
                    {formatCurrency(bucket.amount)}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <div className="flex items-center gap-3">
                      <div className="flex-1 bg-gray-200 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-blue-600 h-full rounded-full"
                          style={{ width: `${bucket.percentage}%` }}
                        ></div>
                      </div>
                      <span className="text-xs font-medium text-gray-600 min-w-[40px] text-right">
                        {bucket.percentage}%
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Section 6: Reconciliation Summary */}
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
              <tr className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm font-medium text-gray-900">Total Engagements</td>
                <td className="px-6 py-4 text-sm text-right text-gray-700">
                  {mockAccounts.length}
                </td>
                <td className="px-6 py-4 text-sm text-right font-medium text-gray-900">
                  {formatCurrency(totalAwarded)}
                </td>
              </tr>
              <tr className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm font-medium text-gray-900">Total Invoices</td>
                <td className="px-6 py-4 text-sm text-right text-gray-700">4</td>
                <td className="px-6 py-4 text-sm text-right font-medium text-gray-900">
                  {formatCurrency(totalInvoiced)}
                </td>
              </tr>
              <tr className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm font-medium text-gray-900">Paid Invoices</td>
                <td className="px-6 py-4 text-sm text-right text-gray-700">3</td>
                <td className="px-6 py-4 text-sm text-right font-medium text-green-700">
                  {formatCurrency(totalPaid)}
                </td>
              </tr>
              <tr className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm font-medium text-gray-900">Partially Paid</td>
                <td className="px-6 py-4 text-sm text-right text-gray-700">0</td>
                <td className="px-6 py-4 text-sm text-right font-medium text-gray-900">$0</td>
              </tr>
              <tr className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm font-medium text-gray-900">Cancelled</td>
                <td className="px-6 py-4 text-sm text-right text-gray-700">0</td>
                <td className="px-6 py-4 text-sm text-right font-medium text-gray-900">$0</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Audit Footer */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            <span>System Generated – {new Date().toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            <span>Audit Reference ID: RPT-{selectedYear}-{selectedMonth.substring(0, 3).toUpperCase()}-001</span>
          </div>
        </div>
      </div>
    </div>
  );
}
