import { useState } from 'react';
import {
  Download,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  Upload,
  Lock,
  Unlock,
  ChevronDown,
  ChevronUp,
  Sparkles,
  FileText,
  DollarSign,
  TrendingUp,
  TrendingDown,
  X,
} from 'lucide-react';

interface ReconTransaction {
  id: string;
  date: string;
  transactionType: 'Invoice Payment' | 'Funding' | 'Bank Fee' | 'FX Adjustment' | 'Manual Adjustment';
  reference: string;
  vendor?: string;
  amountIn: number;
  amountOut: number;
  category: string;
  status: 'Pending' | 'Cleared' | 'Reconciled';
  matched: boolean;
  aiSuggested?: boolean;
}

interface ReconciliationPeriod {
  month: number;
  year: number;
  openingBalance: number;
  closingBalance: number;
  status: 'Open' | 'Closed';
  closedBy?: string;
  closedDate?: string;
}

export function AccountReconciliationPage() {
  const [selectedMonth, setSelectedMonth] = useState('2');
  const [selectedYear, setSelectedYear] = useState('2025');
  const [selectedAccount, setSelectedAccount] = useState('BA-001');
  const [periodStatus, setPeriodStatus] = useState<'Open' | 'Closed'>('Open');
  const [actualBankBalance, setActualBankBalance] = useState('450000.00');
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedTransactions, setSelectedTransactions] = useState<string[]>([]);

  // Mock reconciliation data
  const [transactions, setTransactions] = useState<ReconTransaction[]>([
    {
      id: 'TXN-001',
      date: '2025-02-17',
      transactionType: 'Invoice Payment',
      reference: 'INV-2025-0089',
      vendor: 'CloudTech Solutions',
      amountIn: 0,
      amountOut: 45000.0,
      category: 'Vendor Payment',
      status: 'Reconciled',
      matched: true,
    },
    {
      id: 'TXN-002',
      date: '2025-02-15',
      transactionType: 'Funding',
      reference: 'FUND-2025-012',
      vendor: 'Capital Injection',
      amountIn: 200000.0,
      amountOut: 0,
      category: 'Capital',
      status: 'Reconciled',
      matched: true,
    },
    {
      id: 'TXN-003',
      date: '2025-02-16',
      transactionType: 'Invoice Payment',
      reference: 'INV-2025-0091',
      vendor: 'SecureIT Services',
      amountIn: 0,
      amountOut: 78000.0,
      category: 'Vendor Payment',
      status: 'Reconciled',
      matched: true,
    },
    {
      id: 'TXN-004',
      date: '2025-02-14',
      transactionType: 'Bank Fee',
      reference: 'FEE-2025-02',
      vendor: 'National Commercial Bank',
      amountIn: 0,
      amountOut: 45.0,
      category: 'Bank Charges',
      status: 'Pending',
      matched: false,
      aiSuggested: true,
    },
    {
      id: 'TXN-005',
      date: '2025-02-12',
      transactionType: 'Invoice Payment',
      reference: 'INV-2025-0090',
      vendor: 'Azure Partners Inc',
      amountIn: 0,
      amountOut: 32000.0,
      category: 'Vendor Payment',
      status: 'Reconciled',
      matched: true,
    },
    {
      id: 'TXN-006',
      date: '2025-02-10',
      transactionType: 'FX Adjustment',
      reference: 'FX-2025-008',
      vendor: 'Currency Exchange',
      amountIn: 0,
      amountOut: 125.5,
      category: 'FX Variance',
      status: 'Pending',
      matched: false,
    },
    {
      id: 'TXN-007',
      date: '2025-02-08',
      transactionType: 'Invoice Payment',
      reference: 'INV-2025-0093',
      vendor: 'Marketing Pros Agency',
      amountIn: 0,
      amountOut: 22000.0,
      category: 'Vendor Payment',
      status: 'Cleared',
      matched: false,
      aiSuggested: true,
    },
    {
      id: 'TXN-008',
      date: '2025-02-05',
      transactionType: 'Manual Adjustment',
      reference: 'ADJ-2025-003',
      vendor: 'Accounting Correction',
      amountIn: 500.0,
      amountOut: 0,
      category: 'Manual Entry',
      status: 'Reconciled',
      matched: true,
    },
  ]);

  // Opening balance from previous period
  const openingBalance = 327670.5;

  // Calculate totals
  const totalFundsIn = transactions.reduce((sum, t) => sum + t.amountIn, 0);
  const totalFundsOut = transactions.reduce((sum, t) => sum + t.amountOut, 0);
  const expectedClosingBalance = openingBalance + totalFundsIn - totalFundsOut;
  const actualBalance = parseFloat(actualBankBalance || '0');
  const variance = actualBalance - expectedClosingBalance;
  const isBalanced = Math.abs(variance) < 0.01; // Allow 1 cent variance
  const allMatched = transactions.every((t) => t.matched);
  const canClosePeriod = isBalanced && allMatched && periodStatus === 'Open';

  // Breakdown calculations
  const invoicePaymentsCount = transactions.filter(
    (t) => t.transactionType === 'Invoice Payment'
  ).length;
  const invoicePaymentsTotal = transactions
    .filter((t) => t.transactionType === 'Invoice Payment')
    .reduce((sum, t) => sum + t.amountOut, 0);

  const totalFees = transactions
    .filter((t) => t.transactionType === 'Bank Fee')
    .reduce((sum, t) => sum + t.amountOut, 0);

  const fxVarianceTotal = transactions
    .filter((t) => t.transactionType === 'FX Adjustment')
    .reduce((sum, t) => sum + t.amountOut, 0);

  const manualAdjustmentsTotal = transactions
    .filter((t) => t.transactionType === 'Manual Adjustment')
    .reduce((sum, t) => sum + t.amountIn - t.amountOut, 0);

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  // Format date
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Get status badge class
  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'Pending':
        return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'Cleared':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'Reconciled':
        return 'bg-green-100 text-green-700 border-green-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  // Handle match checkbox
  const handleMatchToggle = (id: string) => {
    setTransactions((prev) =>
      prev.map((t) => (t.id === id ? { ...t, matched: !t.matched } : t))
    );
  };

  // Handle bulk select
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedTransactions(transactions.map((t) => t.id));
    } else {
      setSelectedTransactions([]);
    }
  };

  // Handle individual select
  const handleSelectTransaction = (id: string) => {
    if (selectedTransactions.includes(id)) {
      setSelectedTransactions((prev) => prev.filter((t) => t !== id));
    } else {
      setSelectedTransactions((prev) => [...prev, id]);
    }
  };

  // Handle close period
  const handleClosePeriod = () => {
    if (!canClosePeriod) {
      alert('Cannot close period. Please ensure all transactions are matched and balanced.');
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to close the period for ${getMonthName(
        parseInt(selectedMonth)
      )} ${selectedYear}? This action cannot be undone.`
    );

    if (confirmed) {
      setPeriodStatus('Closed');
      alert('✅ Period closed successfully! A reconciliation report has been generated.');
    }
  };

  // Get month name
  const getMonthName = (month: number) => {
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
    return months[month - 1];
  };

  return (
    <div className="space-y-6 max-w-[1280px] mx-auto">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-semibold text-gray-900">Account Reconciliation</h1>
        <p className="text-gray-500 mt-1">
          Validate and balance your accounts with complete audit trails
        </p>
      </div>

      {/* Filter & Period Control Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-end justify-between">
          {/* Left Side - Filters */}
          <div className="flex flex-col sm:flex-row gap-4 flex-1">
            {/* Month / Year Selector */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
                Period
              </label>
              <div className="flex items-center gap-2">
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="1">January</option>
                  <option value="2">February</option>
                  <option value="3">March</option>
                  <option value="4">April</option>
                  <option value="5">May</option>
                  <option value="6">June</option>
                  <option value="7">July</option>
                  <option value="8">August</option>
                  <option value="9">September</option>
                  <option value="10">October</option>
                  <option value="11">November</option>
                  <option value="12">December</option>
                </select>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  className="px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="2023">2023</option>
                  <option value="2024">2024</option>
                  <option value="2025">2025</option>
                </select>
              </div>
            </div>

            {/* Bank Account Selector */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
                Bank Account
              </label>
              <select
                value={selectedAccount}
                onChange={(e) => setSelectedAccount(e.target.value)}
                className="px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent min-w-[240px]"
              >
                <option value="all">All Accounts</option>
                <option value="BA-001">Operations Account (****4582)</option>
                <option value="BA-002">Payroll Account (****7293)</option>
                <option value="BA-003">Reserve Account (****1456)</option>
              </select>
            </div>

            {/* Status Toggle */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
                Period Status
              </label>
              <div className="flex items-center gap-2 p-1 bg-gray-100 rounded-lg">
                <button
                  onClick={() => periodStatus === 'Closed' && setPeriodStatus('Open')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                    periodStatus === 'Open'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                  disabled={periodStatus === 'Open'}
                >
                  <Unlock className="w-4 h-4" />
                  Open Period
                </button>
                <button
                  onClick={() => periodStatus === 'Open' && setPeriodStatus('Closed')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                    periodStatus === 'Closed'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                  disabled={periodStatus === 'Closed'}
                >
                  <Lock className="w-4 h-4" />
                  Closed Period
                </button>
              </div>
            </div>
          </div>

          {/* Right Side - Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={() => setShowUploadModal(true)}
              className="flex items-center gap-2 px-5 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
            >
              <Upload className="w-4 h-4" />
              Upload Statement
            </button>
            <button
              onClick={handleClosePeriod}
              disabled={!canClosePeriod}
              className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-semibold shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Lock className="w-4 h-4" />
              {periodStatus === 'Closed' ? 'Period Locked' : 'Lock Period'}
            </button>
          </div>
        </div>
      </div>

      {/* Reconciliation Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {/* Card 1: Opening Balance */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-blue-600" />
            </div>
          </div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
            Opening Balance
          </p>
          <p className="text-xl font-bold text-gray-900">{formatCurrency(openingBalance)}</p>
          <p className="text-xs text-gray-500 mt-1">Start of period</p>
        </div>

        {/* Card 2: Total Funds In */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
          </div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
            Total Funds In
          </p>
          <p className="text-xl font-bold text-green-600">{formatCurrency(totalFundsIn)}</p>
          <p className="text-xs text-gray-500 mt-1">Incoming funds</p>
        </div>

        {/* Card 3: Total Funds Out */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <TrendingDown className="w-5 h-5 text-red-600" />
            </div>
          </div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
            Total Funds Out
          </p>
          <p className="text-xl font-bold text-red-600">{formatCurrency(totalFundsOut)}</p>
          <p className="text-xs text-gray-500 mt-1">Outgoing payments</p>
        </div>

        {/* Card 4: Expected Closing Balance */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-indigo-600" />
            </div>
          </div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
            Expected Balance
          </p>
          <p className="text-xl font-bold text-gray-900">
            {formatCurrency(expectedClosingBalance)}
          </p>
          <p className="text-xs text-gray-500 mt-1">Auto-calculated</p>
        </div>

        {/* Card 5: Actual Bank Balance */}
        <div
          className={`rounded-xl shadow-sm border p-5 ${
            isBalanced
              ? 'bg-green-50 border-green-200'
              : variance !== 0
              ? 'bg-red-50 border-red-200'
              : 'bg-white border-gray-200'
          }`}
        >
          <div className="flex items-center gap-2 mb-3">
            <div
              className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                isBalanced
                  ? 'bg-green-100'
                  : variance !== 0
                  ? 'bg-red-100'
                  : 'bg-gray-100'
              }`}
            >
              <CheckCircle2
                className={`w-5 h-5 ${
                  isBalanced
                    ? 'text-green-600'
                    : variance !== 0
                    ? 'text-red-600'
                    : 'text-gray-600'
                }`}
              />
            </div>
          </div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
            Actual Bank Balance
          </p>
          <input
            type="number"
            step="0.01"
            value={actualBankBalance}
            onChange={(e) => setActualBankBalance(e.target.value)}
            disabled={periodStatus === 'Closed'}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-lg font-bold text-gray-900 mb-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:bg-gray-100"
          />
          {variance !== 0 && (
            <div
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold ${
                isBalanced
                  ? 'bg-green-100 text-green-700'
                  : 'bg-red-100 text-red-700'
              }`}
            >
              {isBalanced ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Reconciled
                </>
              ) : (
                <>
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Variance: {formatCurrency(Math.abs(variance))}
                </>
              )}
            </div>
          )}
          {isBalanced && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-green-100 text-green-700">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Reconciled
            </div>
          )}
        </div>
      </div>

      {/* Detailed Reconciliation Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Transaction Details</h3>
              <p className="text-sm text-gray-500 mt-0.5">
                {transactions.length} transactions • {transactions.filter((t) => t.matched).length}{' '}
                matched
              </p>
            </div>
            <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium">
              <Download className="w-4 h-4" />
              Export Report
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-4 text-left">
                  <input
                    type="checkbox"
                    checked={selectedTransactions.length === transactions.length}
                    onChange={handleSelectAll}
                    className="w-4 h-4 text-primary rounded border-gray-300 focus:ring-primary"
                  />
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Transaction Type
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Reference
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Vendor
                </th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Amount In
                </th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Amount Out
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Matched
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {transactions.map((transaction) => (
                <tr
                  key={transaction.id}
                  className="hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  <td className="px-4 py-4">
                    <input
                      type="checkbox"
                      checked={selectedTransactions.includes(transaction.id)}
                      onChange={() => handleSelectTransaction(transaction.id)}
                      className="w-4 h-4 text-primary rounded border-gray-300 focus:ring-primary"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-700">{formatDate(transaction.date)}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-900">{transaction.transactionType}</span>
                      {transaction.aiSuggested && (
                        <Sparkles className="w-4 h-4 text-purple-500" title="AI Match Suggested" />
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-mono text-blue-600">{transaction.reference}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-900">{transaction.vendor || '-'}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <span className="text-sm font-semibold text-green-600">
                      {transaction.amountIn > 0 ? formatCurrency(transaction.amountIn) : '-'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <span className="text-sm font-semibold text-red-600">
                      {transaction.amountOut > 0 ? formatCurrency(transaction.amountOut) : '-'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-700">{transaction.category}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${getStatusBadgeClass(
                        transaction.status
                      )}`}
                    >
                      {transaction.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <input
                      type="checkbox"
                      checked={transaction.matched}
                      onChange={() => handleMatchToggle(transaction.id)}
                      disabled={periodStatus === 'Closed'}
                      className="w-5 h-5 text-green-600 rounded border-gray-300 focus:ring-green-500 disabled:opacity-50"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Reconciliation Breakdown Panel */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <button
          onClick={() => setShowBreakdown(!showBreakdown)}
          className="w-full flex items-center justify-between p-5 hover:bg-gray-50 transition-colors"
        >
          <h3 className="text-lg font-semibold text-gray-900">Reconciliation Breakdown</h3>
          {showBreakdown ? (
            <ChevronUp className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          )}
        </button>

        {showBreakdown && (
          <div className="px-5 pb-5 border-t border-gray-200 pt-5">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Invoice Payments */}
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-xs font-semibold text-blue-700 uppercase tracking-wider mb-2">
                  Invoice Payments
                </p>
                <p className="text-2xl font-bold text-blue-900 mb-1">
                  {formatCurrency(invoicePaymentsTotal)}
                </p>
                <p className="text-sm text-blue-600">
                  {invoicePaymentsCount} transaction{invoicePaymentsCount !== 1 ? 's' : ''}
                </p>
              </div>

              {/* Total Fees */}
              <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
                <p className="text-xs font-semibold text-amber-700 uppercase tracking-wider mb-2">
                  Total Bank Fees
                </p>
                <p className="text-2xl font-bold text-amber-900 mb-1">
                  {formatCurrency(totalFees)}
                </p>
                <p className="text-sm text-amber-600">Service charges</p>
              </div>

              {/* FX Variance */}
              <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                <p className="text-xs font-semibold text-purple-700 uppercase tracking-wider mb-2">
                  FX Variance Total
                </p>
                <p className="text-2xl font-bold text-purple-900 mb-1">
                  {formatCurrency(fxVarianceTotal)}
                </p>
                <p className="text-sm text-purple-600">Currency adjustments</p>
              </div>

              {/* Manual Adjustments */}
              <div className="p-4 bg-indigo-50 rounded-lg border border-indigo-200">
                <p className="text-xs font-semibold text-indigo-700 uppercase tracking-wider mb-2">
                  Manual Adjustments
                </p>
                <p className="text-2xl font-bold text-indigo-900 mb-1">
                  {formatCurrency(Math.abs(manualAdjustmentsTotal))}
                </p>
                <p className="text-sm text-indigo-600">
                  {manualAdjustmentsTotal >= 0 ? 'Added' : 'Deducted'}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bank Statement Upload Modal */}
      {showUploadModal && (
        <>
          <div
            className="fixed inset-0 bg-gray-900/20 z-40 transition-opacity"
            onClick={() => setShowUploadModal(false)}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900">Upload Bank Statement</h3>
                <button
                  onClick={() => setShowUploadModal(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="border-2 border-dashed border-gray-300 rounded-xl p-8">
                <div className="text-center">
                  <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-lg font-medium text-gray-900 mb-2">
                    Drop your bank statement here
                  </p>
                  <p className="text-sm text-gray-500 mb-4">or click to browse</p>
                  <input type="file" id="statement-upload" className="hidden" accept=".pdf,.csv" />
                  <label
                    htmlFor="statement-upload"
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-semibold cursor-pointer"
                  >
                    <Upload className="w-4 h-4" />
                    Browse Files
                  </label>
                  <p className="text-xs text-gray-400 mt-4">Supports PDF and CSV files</p>
                </div>
              </div>

              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex gap-3">
                  <Sparkles className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-blue-900 mb-1">AI-Powered Matching</p>
                    <p className="text-sm text-blue-700">
                      Our system will automatically parse transactions and suggest matches with your
                      existing records.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
