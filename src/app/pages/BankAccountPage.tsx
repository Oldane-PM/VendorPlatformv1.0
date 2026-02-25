import { useState, useMemo } from 'react';
import { useBankAccounts } from '@/lib/hooks/useBankAccounts';
import { cardBrandLabel } from '@/lib/utils/detectCardBrand';
import type { CardBrand } from '@/lib/utils/detectCardBrand';
import {
  Plus,
  Wallet,
  TrendingUp,
  Percent,
  ShieldCheck,
  Upload,
  X,
  Download,
  Filter,
  Paperclip,
  Eye,
  ChevronDown,
  CreditCard,
  AlertTriangle,
} from 'lucide-react';

interface BankAccount {
  id: string;
  bankName: string;
  accountName: string;
  currency: 'USD' | 'CAD' | 'JMD' | 'EUR' | 'GBP';
  lastFourDigits: string;
  currentBalance: number;
  pendingPayments: number;
  lastFunding: string;
  cardColor:
    | 'blue'
    | 'purple'
    | 'indigo'
    | 'green'
    | 'orange'
    | 'pink'
    | 'teal'
    | 'red';
  cardBrand: CardBrand;
}

interface Transaction {
  id: string;
  date: string;
  type: 'Funding' | 'Payment' | 'Fee';
  vendor?: string;
  amount: number;
  feeAmount: number;
  exchangeRate?: number;
  balanceAfter: number;
  currency: string;
  receiptUploaded: boolean;
  reconciled: boolean;
  fundingSource?: string;
  feeType?: 'Exchange Variance' | 'Transfer Fee';
}

interface Fee {
  id: string;
  date: string;
  transactionType: string;
  feeType: 'Exchange Variance' | 'Transfer Fee';
  exchangeRateVariance?: number;
  bankTransferFee?: number;
  relatedPaymentId: string;
  amount: number;
  currency: string;
  notes: string;
}

export function BankAccountPage() {
  const {
    accounts: rawAccounts,
    transactions: rawTransactions,
    fees: rawFees,
    selectedAccountId,
    setSelectedAccountId,
    loading,
    error,
    createAccount: hookCreateAccount,
    addFunds: hookAddFunds,
    deactivateAccount: hookDeactivate,
  } = useBankAccounts();

  const [viewMode, setViewMode] = useState<'month' | 'all'>('month');
  const [isAddFundsModalOpen, setIsAddFundsModalOpen] = useState(false);
  const [isTransactionDetailOpen, setIsTransactionDetailOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] =
    useState<Transaction | null>(null);
  const [isDeactivateModalOpen, setIsDeactivateModalOpen] = useState(false);
  const [isCreateAccountModalOpen, setIsCreateAccountModalOpen] =
    useState(false);
  const [selectedCardColor, setSelectedCardColor] =
    useState<BankAccount['cardColor']>('blue');

  // Map DTOs to UI interfaces
  const accounts: BankAccount[] = useMemo(
    () =>
      rawAccounts.map((a) => ({
        id: a.id,
        bankName: a.bank_name,
        accountName: a.account_name,
        currency: a.currency as BankAccount['currency'],
        lastFourDigits: a.last_four_digits,
        currentBalance: Number(a.current_balance),
        pendingPayments: Number(a.pending_payments),
        lastFunding: a.last_funding ?? '',
        cardColor: a.card_color as BankAccount['cardColor'],
        cardBrand: (a.card_brand ?? 'unknown') as CardBrand,
      })),
    [rawAccounts]
  );

  const transactions: Transaction[] = useMemo(
    () =>
      rawTransactions.map((t) => ({
        id: t.id,
        date: t.transaction_date,
        type: t.type as Transaction['type'],
        vendor: t.vendor ?? undefined,
        amount: Number(t.amount),
        feeAmount: Number(t.fee_amount),
        exchangeRate: t.exchange_rate ? Number(t.exchange_rate) : undefined,
        balanceAfter: Number(t.balance_after),
        currency: t.currency,
        receiptUploaded: t.receipt_uploaded,
        reconciled: t.reconciled,
        fundingSource: t.funding_source ?? undefined,
        feeType: (t.fee_type as Transaction['feeType']) ?? undefined,
      })),
    [rawTransactions]
  );

  const fees: Fee[] = useMemo(
    () =>
      rawFees.map((f) => ({
        id: f.id,
        date: f.transaction_date,
        transactionType: f.transaction_type,
        feeType: f.fee_type as Fee['feeType'],
        exchangeRateVariance: f.exchange_rate_variance
          ? Number(f.exchange_rate_variance)
          : undefined,
        bankTransferFee: f.bank_transfer_fee
          ? Number(f.bank_transfer_fee)
          : undefined,
        relatedPaymentId: f.related_payment_id ?? '',
        amount: Number(f.amount),
        currency: f.currency,
        notes: f.notes ?? '',
      })),
    [rawFees]
  );

  // Add Funds Form State
  const [fundingForm, setFundingForm] = useState({
    amount: '',
    currency: 'USD',
    fundingSource: '',
    referenceNumber: '',
    fundingDate: new Date().toISOString().split('T')[0],
    notes: '',
    exchangeRate: '1.0',
    bankTransferFee: '',
  });

  // Get current account
  const currentAccount = accounts.find((acc) => acc.id === selectedAccountId);

  // Calculate summary metrics
  const totalFundedMonth = transactions
    .filter((t) => t.type === 'Funding')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalFeesMonth = transactions.reduce((sum, t) => sum + t.feeAmount, 0);

  const availableAfterCommitments =
    (currentAccount?.currentBalance || 0) -
    (currentAccount?.pendingPayments || 0);

  // Calculate utilization percentage
  const utilizationPercentage = currentAccount
    ? Math.round(
        (currentAccount.pendingPayments / currentAccount.currentBalance) * 100
      )
    : 0;

  // Format currency
  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(Math.abs(amount));
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

  // Fee type badge color
  const getFeeTypeBadgeClass = (feeType: string) => {
    return feeType === 'Exchange Variance'
      ? 'bg-purple-100 text-purple-700 border-purple-200'
      : 'bg-orange-100 text-orange-700 border-orange-200';
  };

  // Handle Add Funds Submit
  const handleAddFundsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const amount = parseFloat(fundingForm.amount) || 0;
      const fee = parseFloat(fundingForm.bankTransferFee) || 0;
      await hookAddFunds({
        type: 'Funding',
        amount,
        fee_amount: fee,
        currency: fundingForm.currency,
        funding_source: fundingForm.fundingSource || undefined,
        exchange_rate: parseFloat(fundingForm.exchangeRate) || undefined,
        reference_number: fundingForm.referenceNumber || undefined,
        notes: fundingForm.notes || undefined,
        date: fundingForm.fundingDate,
      });
      setIsAddFundsModalOpen(false);
    } catch (err) {
      console.error('Add funds failed:', err);
    }

    // Reset form
    setFundingForm({
      amount: '',
      currency: 'USD',
      fundingSource: '',
      referenceNumber: '',
      fundingDate: new Date().toISOString().split('T')[0],
      notes: '',
      exchangeRate: '1.0',
      bankTransferFee: '',
    });
  };

  // Calculate net added amount
  const calculateNetAmount = () => {
    const amount = parseFloat(fundingForm.amount) || 0;
    const fee = parseFloat(fundingForm.bankTransferFee) || 0;
    return amount - fee;
  };

  // Open transaction detail
  const openTransactionDetail = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setIsTransactionDetailOpen(true);
  };

  // Get card gradient colors based on selection
  const getCardGradient = (color: BankAccount['cardColor']) => {
    const gradients = {
      blue: 'from-blue-600 via-indigo-600 to-purple-700',
      purple: 'from-purple-600 via-violet-600 to-fuchsia-700',
      indigo: 'from-indigo-600 via-blue-600 to-cyan-700',
      green: 'from-green-600 via-emerald-600 to-teal-700',
      orange: 'from-orange-600 via-amber-600 to-yellow-700',
      pink: 'from-pink-600 via-rose-600 to-red-700',
      teal: 'from-teal-600 via-cyan-600 to-blue-700',
      red: 'from-red-600 via-rose-600 to-pink-700',
    };
    return gradients[color];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <p className="text-red-800 font-medium">Failed to load bank accounts</p>
        <p className="text-red-600 text-sm mt-1">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900">
            Bank Account Management
          </h1>
          <p className="text-gray-500 mt-1">
            Enhanced treasury management with balance tracking and transaction
            ledger
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsCreateAccountModalOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-semibold shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Create Bank Account
          </button>
          <button
            onClick={() => setIsAddFundsModalOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-semibold shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Add Funds
          </button>
        </div>
      </div>

      {/* Account Selector */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="flex items-center gap-3">
          <label className="text-sm font-semibold text-gray-700">
            Select Account:
          </label>
          <select
            value={selectedAccountId ?? ''}
            onChange={(e) => setSelectedAccountId(e.target.value)}
            className="flex-1 max-w-md px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          >
            {accounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.bankName} - {account.accountName} ({account.currency})
                ****{account.lastFourDigits}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Current Account Details Card */}
      {currentAccount && (
        <div
          className={`relative bg-gradient-to-br ${getCardGradient(currentAccount.cardColor)} rounded-2xl shadow-2xl overflow-hidden max-w-2xl`}
        >
          {/* Card Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 right-0 w-40 h-40 bg-white rounded-full -mr-20 -mt-20"></div>
            <div className="absolute bottom-0 left-0 w-56 h-56 bg-white rounded-full -ml-28 -mb-28"></div>
          </div>

          <div className="relative p-5">
            {/* Card Header */}
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-blue-100 text-xs font-medium mb-0.5">
                  Bank Account
                </p>
                <h3 className="text-white text-base font-semibold">
                  {currentAccount.bankName} – {currentAccount.accountName}
                </h3>
                <p className="text-blue-100 text-xs mt-0.5">
                  ({currentAccount.currency})
                </p>
              </div>
              <div className="flex flex-col items-end">
                <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center mb-1">
                  <CreditCard className="w-5 h-5 text-white" />
                </div>
                <p className="text-white/60 text-[10px] font-mono tracking-wider">
                  DEBIT
                </p>
              </div>
            </div>

            {/* Brand + Account Number */}
            <div className="mb-4">
              <p className="text-blue-100 text-[10px] mb-1 uppercase tracking-wider">
                Account Number
              </p>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center px-2 py-0.5 rounded bg-white/15 text-white text-[10px] font-semibold uppercase tracking-wider">
                  {cardBrandLabel(currentAccount.cardBrand)}
                </span>
                <p className="text-white text-lg font-mono tracking-wider">
                  •••• •••• •••• {currentAccount.lastFourDigits}
                </p>
              </div>
            </div>

            {/* Current Balance */}
            <div className="mb-4">
              <p className="text-blue-100 text-[10px] mb-1 uppercase tracking-wider">
                Current Balance
              </p>
              <p className="text-white text-lg font-bold">
                {formatCurrency(
                  currentAccount.currentBalance,
                  currentAccount.currency
                )}
              </p>
            </div>

            {/* Card Footer */}
            <div className="flex items-center justify-between pt-3 border-t border-white/20">
              <div className="flex items-center gap-3">
                <div>
                  <p className="text-blue-100 text-[10px] mb-0.5">
                    Last Funding
                  </p>
                  <p className="text-white text-xs font-medium">
                    {formatDate(currentAccount.lastFunding)}
                  </p>
                </div>
                <button
                  onClick={() => setIsDeactivateModalOpen(true)}
                  className="px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-100 border border-red-300/30 rounded-lg transition-colors text-[10px] font-semibold backdrop-blur-sm"
                >
                  Deactivate Account
                </button>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 backdrop-blur-sm rounded-lg">
                <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-white text-[10px] font-semibold">
                  Active
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Transactions & Fees - Combined View */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Section Header */}
        <div className="bg-gray-50 border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">Transactions & Fees</h3>
          <div className="flex items-center gap-3">
            {/* View Toggle */}
            <div className="inline-flex items-center bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('month')}
                className={`px-4 py-1.5 rounded-md text-xs font-medium transition-all ${
                  viewMode === 'month'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                This Month
              </button>
              <button
                onClick={() => setViewMode('all')}
                className={`px-4 py-1.5 rounded-md text-xs font-medium transition-all ${
                  viewMode === 'all'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                View All
              </button>
            </div>

            {/* Export CSV */}
            <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-xs font-medium">
              <Download className="w-4 h-4" />
              Export CSV
            </button>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Transaction ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Vendor / Source
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Fee Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Fee Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Exchange Rate
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Balance After
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Receipt
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Reconciled
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {transactions.map((transaction) => (
                <tr
                  key={transaction.id}
                  onClick={() => openTransactionDetail(transaction)}
                  className="hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {formatDate(transaction.date)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-xs font-mono text-gray-500 uppercase">
                      {transaction.id}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${
                        transaction.type === 'Funding'
                          ? 'bg-green-100 text-green-700 border-green-200'
                          : transaction.type === 'Payment'
                            ? 'bg-blue-100 text-blue-700 border-blue-200'
                            : 'bg-gray-100 text-gray-700 border-gray-200'
                      }`}
                    >
                      {transaction.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">
                    {transaction.vendor || transaction.fundingSource || '—'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`text-sm font-semibold ${
                        transaction.amount > 0
                          ? 'text-green-600'
                          : 'text-red-600'
                      }`}
                    >
                      {transaction.amount > 0 ? '+' : ''}
                      {formatCurrency(transaction.amount, transaction.currency)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {transaction.feeAmount > 0
                      ? formatCurrency(
                          transaction.feeAmount,
                          transaction.currency
                        )
                      : '—'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {transaction.feeType ? (
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${getFeeTypeBadgeClass(
                          transaction.feeType
                        )}`}
                      >
                        {transaction.feeType}
                      </span>
                    ) : (
                      <span className="text-sm text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {transaction.exchangeRate &&
                    transaction.exchangeRate !== 1.0 ? (
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                          transaction.amount < 0
                            ? 'bg-red-50 text-red-700'
                            : 'bg-green-50 text-green-700'
                        }`}
                      >
                        {transaction.exchangeRate}
                      </span>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {formatCurrency(
                      transaction.balanceAfter,
                      transaction.currency
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    {transaction.receiptUploaded ? (
                      <button className="p-1 text-blue-600 hover:bg-blue-50 rounded">
                        <Paperclip className="w-4 h-4" />
                      </button>
                    ) : (
                      <button className="p-1 text-gray-400 hover:bg-gray-50 rounded">
                        <Upload className="w-4 h-4" />
                      </button>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    {transaction.reconciled ? (
                      <span className="inline-flex items-center w-5 h-5 bg-green-100 rounded-full">
                        <svg
                          className="w-3 h-3 text-green-600 mx-auto"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </span>
                    ) : (
                      <span className="inline-flex items-center w-5 h-5 bg-gray-100 rounded-full">
                        <span className="w-2 h-2 bg-gray-400 rounded-full mx-auto"></span>
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Governance Note */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <div className="flex gap-3">
          <ShieldCheck className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-amber-900 mb-1">
              Access Control Notice
            </p>
            <p className="text-sm text-amber-700">
              <strong>Finance & Admin roles only:</strong> Add Funds, Edit Fees.{' '}
              <strong>Department Users:</strong> View-only access.
            </p>
          </div>
        </div>
      </div>

      {/* Add Funds Modal */}
      {isAddFundsModalOpen && (
        <div className="fixed inset-0 bg-gray-900/35 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-2xl font-semibold text-gray-900">
                Add Funds to Account
              </h2>
              <button
                onClick={() => setIsAddFundsModalOpen(false)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleAddFundsSubmit} className="p-6 space-y-6">
              {/* Amount & Currency */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Amount <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={fundingForm.amount}
                    onChange={(e) =>
                      setFundingForm({ ...fundingForm, amount: e.target.value })
                    }
                    placeholder="50000.00"
                    required
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Currency <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={fundingForm.currency}
                    onChange={(e) =>
                      setFundingForm({
                        ...fundingForm,
                        currency: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  >
                    <option value="USD">USD</option>
                    <option value="CAD">CAD</option>
                    <option value="JMD">JMD</option>
                    <option value="EUR">EUR</option>
                    <option value="GBP">GBP</option>
                  </select>
                </div>
              </div>

              {/* Funding Source */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Funding Source <span className="text-red-500">*</span>
                </label>
                <select
                  value={fundingForm.fundingSource}
                  onChange={(e) =>
                    setFundingForm({
                      ...fundingForm,
                      fundingSource: e.target.value,
                    })
                  }
                  required
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="">Select source...</option>
                  <option value="Wire Transfer - Head Office">
                    Wire Transfer - Head Office
                  </option>
                  <option value="ACH Transfer">ACH Transfer</option>
                  <option value="Check Deposit">Check Deposit</option>
                  <option value="Cash Deposit">Cash Deposit</option>
                  <option value="Internal Transfer">Internal Transfer</option>
                </select>
              </div>

              {/* Reference Number & Funding Date */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Reference Number
                  </label>
                  <input
                    type="text"
                    value={fundingForm.referenceNumber}
                    onChange={(e) =>
                      setFundingForm({
                        ...fundingForm,
                        referenceNumber: e.target.value,
                      })
                    }
                    placeholder="REF-2025-001"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Funding Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={fundingForm.fundingDate}
                    onChange={(e) =>
                      setFundingForm({
                        ...fundingForm,
                        fundingDate: e.target.value,
                      })
                    }
                    required
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
              </div>

              {/* Exchange Rate & Bank Transfer Fee */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Exchange Rate
                  </label>
                  <input
                    type="number"
                    step="0.0001"
                    value={fundingForm.exchangeRate}
                    onChange={(e) =>
                      setFundingForm({
                        ...fundingForm,
                        exchangeRate: e.target.value,
                      })
                    }
                    placeholder="1.0000"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    For cross-currency transfers
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Bank Transfer Fee
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={fundingForm.bankTransferFee}
                    onChange={(e) =>
                      setFundingForm({
                        ...fundingForm,
                        bankTransferFee: e.target.value,
                      })
                    }
                    placeholder="45.00"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
              </div>

              {/* Net Added Amount Calculation */}
              {fundingForm.amount && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-blue-900">
                      Net Added Amount:
                    </span>
                    <span className="text-lg font-bold text-blue-900">
                      {formatCurrency(
                        calculateNetAmount(),
                        fundingForm.currency
                      )}
                    </span>
                  </div>
                  <p className="text-xs text-blue-700 mt-1">
                    Amount (
                    {formatCurrency(
                      parseFloat(fundingForm.amount) || 0,
                      fundingForm.currency
                    )}
                    ) - Fee (
                    {formatCurrency(
                      parseFloat(fundingForm.bankTransferFee) || 0,
                      fundingForm.currency
                    )}
                    )
                  </p>
                </div>
              )}

              {/* Notes */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Notes
                </label>
                <textarea
                  value={fundingForm.notes}
                  onChange={(e) =>
                    setFundingForm({ ...fundingForm, notes: e.target.value })
                  }
                  placeholder="Additional notes about this funding..."
                  rows={3}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                />
              </div>

              {/* Upload Receipt */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Upload Receipt (PDF / Image)
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-primary transition-colors cursor-pointer">
                  <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600 mb-1">
                    Click to upload or drag and drop
                  </p>
                  <p className="text-xs text-gray-500">
                    PDF, PNG, JPG up to 10MB
                  </p>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setIsAddFundsModalOpen(false)}
                  className="px-5 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-primary text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-semibold shadow-sm"
                >
                  Confirm & Fund
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Transaction Detail Drawer */}
      {isTransactionDetailOpen && selectedTransaction && (
        <div className="fixed inset-0 bg-gray-900/35 backdrop-blur-sm flex items-end justify-end z-50">
          <div className="bg-white w-full max-w-2xl h-full shadow-2xl overflow-y-auto">
            {/* Drawer Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gray-50">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Transaction Details
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  {selectedTransaction.id}
                </p>
              </div>
              <button
                onClick={() => setIsTransactionDetailOpen(false)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Body */}
            <div className="p-6 space-y-6">
              {/* Transaction Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                    Date
                  </p>
                  <p className="text-sm text-gray-900">
                    {formatDate(selectedTransaction.date)}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                    Type
                  </p>
                  <span
                    className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${
                      selectedTransaction.type === 'Funding'
                        ? 'bg-green-100 text-green-700 border-green-200'
                        : selectedTransaction.type === 'Payment'
                          ? 'bg-blue-100 text-blue-700 border-blue-200'
                          : 'bg-gray-100 text-gray-700 border-gray-200'
                    }`}
                  >
                    {selectedTransaction.type}
                  </span>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                    Amount
                  </p>
                  <p
                    className={`text-lg font-bold ${
                      selectedTransaction.amount > 0
                        ? 'text-green-600'
                        : 'text-red-600'
                    }`}
                  >
                    {selectedTransaction.amount > 0 ? '+' : ''}
                    {formatCurrency(
                      selectedTransaction.amount,
                      selectedTransaction.currency
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                    Fee Amount
                  </p>
                  <p className="text-sm text-gray-900">
                    {selectedTransaction.feeAmount > 0
                      ? formatCurrency(
                          selectedTransaction.feeAmount,
                          selectedTransaction.currency
                        )
                      : '—'}
                  </p>
                </div>
                {selectedTransaction.vendor && (
                  <div className="col-span-2">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                      Vendor
                    </p>
                    <p className="text-sm text-gray-900">
                      {selectedTransaction.vendor}
                    </p>
                  </div>
                )}
                {selectedTransaction.fundingSource && (
                  <div className="col-span-2">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                      Funding Source
                    </p>
                    <p className="text-sm text-gray-900">
                      {selectedTransaction.fundingSource}
                    </p>
                  </div>
                )}
                {selectedTransaction.exchangeRate &&
                  selectedTransaction.exchangeRate !== 1.0 && (
                    <>
                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                          Exchange Rate
                        </p>
                        <p className="text-sm text-gray-900">
                          {selectedTransaction.exchangeRate}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                          Currency
                        </p>
                        <p className="text-sm text-gray-900">
                          {selectedTransaction.currency}
                        </p>
                      </div>
                    </>
                  )}
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                    Balance After
                  </p>
                  <p className="text-sm font-semibold text-gray-900">
                    {formatCurrency(
                      selectedTransaction.balanceAfter,
                      selectedTransaction.currency
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                    Reconciled
                  </p>
                  <p className="text-sm text-gray-900">
                    {selectedTransaction.reconciled ? (
                      <span className="text-green-600 font-medium">Yes</span>
                    ) : (
                      <span className="text-red-600 font-medium">No</span>
                    )}
                  </p>
                </div>
              </div>

              {/* Receipt Section */}
              <div className="border-t border-gray-200 pt-6">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                  Receipt
                </p>
                {selectedTransaction.receiptUploaded ? (
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Paperclip className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          receipt_{selectedTransaction.id}.pdf
                        </p>
                        <p className="text-xs text-gray-500">
                          Uploaded Feb 17, 2025
                        </p>
                      </div>
                    </div>
                    <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-white transition-colors text-sm font-medium">
                      <Eye className="w-4 h-4" />
                      View
                    </button>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600 mb-1">
                      No receipt uploaded
                    </p>
                    <button className="mt-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">
                      Upload Receipt
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Deactivate Account Modal */}
      {isDeactivateModalOpen && currentAccount && (
        <div className="fixed inset-0 bg-gray-900/35 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
            {/* Modal Header */}
            <div className="p-6">
              <div className="flex items-center justify-center w-12 h-12 bg-red-100 rounded-full mb-4 mx-auto">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 text-center mb-2">
                Deactivate Bank Account
              </h2>
              <p className="text-sm text-gray-600 text-center mb-4">
                Are you sure you want to deactivate this account? This action
                will prevent any new transactions.
              </p>

              {/* Account Details */}
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Account Name:</span>
                    <span className="font-medium text-gray-900">
                      {currentAccount.bankName} – {currentAccount.accountName}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Account Number:</span>
                    <span className="font-mono text-gray-900">
                      ****{currentAccount.lastFourDigits}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Current Balance:</span>
                    <span className="font-semibold text-gray-900">
                      {formatCurrency(
                        currentAccount.currentBalance,
                        currentAccount.currency
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Pending Payments:</span>
                    <span className="font-semibold text-red-600">
                      {formatCurrency(
                        currentAccount.pendingPayments,
                        currentAccount.currency
                      )}
                    </span>
                  </div>
                </div>
              </div>

              {/* Warning Message */}
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-6">
                <div className="flex gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-red-800">
                    <strong>Warning:</strong> Ensure all pending payments are
                    cleared before deactivating this account. You can reactivate
                    the account later if needed.
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setIsDeactivateModalOpen(false)}
                  className="flex-1 px-5 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    try {
                      await hookDeactivate(currentAccount.id);
                    } catch (err) {
                      console.error('Deactivate failed:', err);
                    }
                    setIsDeactivateModalOpen(false);
                  }}
                  className="flex-1 px-5 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-semibold shadow-sm"
                >
                  Deactivate
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Bank Account Modal */}
      {isCreateAccountModalOpen && (
        <div className="fixed inset-0 bg-gray-900/35 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div>
                <h2 className="text-2xl font-semibold text-gray-900">
                  Create New Bank Account
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  Add a new bank account to your treasury management system
                </p>
              </div>
              <button
                onClick={() => setIsCreateAccountModalOpen(false)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                try {
                  await hookCreateAccount({
                    bank_name: formData.get('bankName') as string,
                    account_name: formData.get('accountName') as string,
                    currency: formData.get('currency') as string,
                    last_four_digits: formData.get('lastFourDigits') as string,
                    current_balance:
                      parseFloat(formData.get('initialBalance') as string) || 0,
                    card_color: selectedCardColor,
                    card_brand:
                      (formData.get('cardBrand') as string) || 'unknown',
                    account_type:
                      (formData.get('accountType') as string) || 'Checking',
                    purpose:
                      (formData.get('purpose') as string) || 'Operations',
                    notes: (formData.get('notes') as string) || undefined,
                  });
                  setIsCreateAccountModalOpen(false);
                  setSelectedCardColor('blue');
                } catch (err) {
                  console.error('Create account failed:', err);
                }
              }}
              className="p-6 space-y-6"
            >
              {/* Bank Information */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-4 uppercase tracking-wider">
                  Bank Information
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Bank Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="bankName"
                      placeholder="ScotiaBank"
                      required
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Account Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="accountName"
                      placeholder="Operations Account"
                      required
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              {/* Account Details */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-4 uppercase tracking-wider">
                  Account Details
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Account Number (Last 4 Digits){' '}
                      <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="lastFourDigits"
                      placeholder="4582"
                      maxLength={4}
                      pattern="[0-9]{4}"
                      required
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent font-mono"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Enter the last 4 digits of the account number
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Card Brand
                    </label>
                    <select
                      name="cardBrand"
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    >
                      <option value="visa">Visa</option>
                      <option value="mastercard">Mastercard</option>
                      <option value="unknown">Unknown</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Currency <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="currency"
                      required
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    >
                      <option value="USD">USD - US Dollar</option>
                      <option value="CAD">CAD - Canadian Dollar</option>
                      <option value="JMD">JMD - Jamaican Dollar</option>
                      <option value="EUR">EUR - Euro</option>
                      <option value="GBP">GBP - British Pound</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Initial Balance */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-4 uppercase tracking-wider">
                  Initial Setup
                </h3>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Initial Balance
                  </label>
                  <input
                    type="number"
                    name="initialBalance"
                    step="0.01"
                    placeholder="0.00"
                    defaultValue="0"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Optional: Set the current account balance
                  </p>
                </div>
              </div>

              {/* Account Type & Purpose */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-4 uppercase tracking-wider">
                  Account Classification
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Account Type
                    </label>
                    <select
                      name="accountType"
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    >
                      <option value="Checking">Checking Account</option>
                      <option value="Savings">Savings Account</option>
                      <option value="Business">Business Account</option>
                      <option value="Reserve">Reserve Account</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Primary Purpose
                    </label>
                    <select
                      name="purpose"
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    >
                      <option value="Operations">Operations</option>
                      <option value="Payroll">Payroll</option>
                      <option value="Vendor Payments">Vendor Payments</option>
                      <option value="Reserve Funds">Reserve Funds</option>
                      <option value="Project Specific">Project Specific</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Card Color Selection */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-4 uppercase tracking-wider">
                  Card Appearance
                </h3>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Select Card Color <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-4 gap-3">
                    {/* Blue */}
                    <button
                      type="button"
                      onClick={() => setSelectedCardColor('blue')}
                      className={`relative h-20 rounded-xl bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 transition-all ${
                        selectedCardColor === 'blue'
                          ? 'ring-4 ring-blue-500 ring-offset-2 scale-105'
                          : 'hover:scale-105 opacity-70 hover:opacity-100'
                      }`}
                    >
                      {selectedCardColor === 'blue' && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center">
                            <svg
                              className="w-4 h-4 text-blue-600"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </div>
                        </div>
                      )}
                    </button>

                    {/* Purple */}
                    <button
                      type="button"
                      onClick={() => setSelectedCardColor('purple')}
                      className={`relative h-20 rounded-xl bg-gradient-to-br from-purple-600 via-violet-600 to-fuchsia-700 transition-all ${
                        selectedCardColor === 'purple'
                          ? 'ring-4 ring-purple-500 ring-offset-2 scale-105'
                          : 'hover:scale-105 opacity-70 hover:opacity-100'
                      }`}
                    >
                      {selectedCardColor === 'purple' && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center">
                            <svg
                              className="w-4 h-4 text-purple-600"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </div>
                        </div>
                      )}
                    </button>

                    {/* Indigo */}
                    <button
                      type="button"
                      onClick={() => setSelectedCardColor('indigo')}
                      className={`relative h-20 rounded-xl bg-gradient-to-br from-indigo-600 via-blue-600 to-cyan-700 transition-all ${
                        selectedCardColor === 'indigo'
                          ? 'ring-4 ring-indigo-500 ring-offset-2 scale-105'
                          : 'hover:scale-105 opacity-70 hover:opacity-100'
                      }`}
                    >
                      {selectedCardColor === 'indigo' && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center">
                            <svg
                              className="w-4 h-4 text-indigo-600"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </div>
                        </div>
                      )}
                    </button>

                    {/* Green */}
                    <button
                      type="button"
                      onClick={() => setSelectedCardColor('green')}
                      className={`relative h-20 rounded-xl bg-gradient-to-br from-green-600 via-emerald-600 to-teal-700 transition-all ${
                        selectedCardColor === 'green'
                          ? 'ring-4 ring-green-500 ring-offset-2 scale-105'
                          : 'hover:scale-105 opacity-70 hover:opacity-100'
                      }`}
                    >
                      {selectedCardColor === 'green' && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center">
                            <svg
                              className="w-4 h-4 text-green-600"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </div>
                        </div>
                      )}
                    </button>

                    {/* Orange */}
                    <button
                      type="button"
                      onClick={() => setSelectedCardColor('orange')}
                      className={`relative h-20 rounded-xl bg-gradient-to-br from-orange-600 via-amber-600 to-yellow-700 transition-all ${
                        selectedCardColor === 'orange'
                          ? 'ring-4 ring-orange-500 ring-offset-2 scale-105'
                          : 'hover:scale-105 opacity-70 hover:opacity-100'
                      }`}
                    >
                      {selectedCardColor === 'orange' && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center">
                            <svg
                              className="w-4 h-4 text-orange-600"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </div>
                        </div>
                      )}
                    </button>

                    {/* Pink */}
                    <button
                      type="button"
                      onClick={() => setSelectedCardColor('pink')}
                      className={`relative h-20 rounded-xl bg-gradient-to-br from-pink-600 via-rose-600 to-red-700 transition-all ${
                        selectedCardColor === 'pink'
                          ? 'ring-4 ring-pink-500 ring-offset-2 scale-105'
                          : 'hover:scale-105 opacity-70 hover:opacity-100'
                      }`}
                    >
                      {selectedCardColor === 'pink' && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center">
                            <svg
                              className="w-4 h-4 text-pink-600"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </div>
                        </div>
                      )}
                    </button>

                    {/* Teal */}
                    <button
                      type="button"
                      onClick={() => setSelectedCardColor('teal')}
                      className={`relative h-20 rounded-xl bg-gradient-to-br from-teal-600 via-cyan-600 to-blue-700 transition-all ${
                        selectedCardColor === 'teal'
                          ? 'ring-4 ring-teal-500 ring-offset-2 scale-105'
                          : 'hover:scale-105 opacity-70 hover:opacity-100'
                      }`}
                    >
                      {selectedCardColor === 'teal' && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center">
                            <svg
                              className="w-4 h-4 text-teal-600"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </div>
                        </div>
                      )}
                    </button>

                    {/* Red */}
                    <button
                      type="button"
                      onClick={() => setSelectedCardColor('red')}
                      className={`relative h-20 rounded-xl bg-gradient-to-br from-red-600 via-rose-600 to-pink-700 transition-all ${
                        selectedCardColor === 'red'
                          ? 'ring-4 ring-red-500 ring-offset-2 scale-105'
                          : 'hover:scale-105 opacity-70 hover:opacity-100'
                      }`}
                    >
                      {selectedCardColor === 'red' && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center">
                            <svg
                              className="w-4 h-4 text-red-600"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </div>
                        </div>
                      )}
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-3">
                    Choose a color scheme for your bank account card
                  </p>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Notes
                </label>
                <textarea
                  name="notes"
                  placeholder="Additional information about this bank account..."
                  rows={3}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                />
              </div>

              {/* Info Banner */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex gap-3">
                  <CreditCard className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-blue-900 mb-1">
                      Account Creation
                    </p>
                    <p className="text-xs text-blue-700">
                      The new bank account will be immediately available in your
                      treasury management system. You can add funds and begin
                      transactions right away.
                    </p>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setIsCreateAccountModalOpen(false)}
                  className="px-5 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-primary text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-semibold shadow-sm"
                >
                  Create Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
