import { useState } from 'react';
import {
  X,
  FileText,
  Download,
  Building2,
  Calendar,
  DollarSign,
  Upload,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  CheckCircle,
  Info,
  Paperclip,
  CreditCard,
} from 'lucide-react';

interface InvoicePayment {
  id: string;
  invoiceNumber: string;
  vendorName: string;
  engagementId: string;
  invoiceAmount: number;
  currency: string;
  status: 'Pending Payment' | 'Completed' | 'Draft';
  dueDate: string;
  uploadedDate: string;
  description: string;
  paymentDetails?: PaymentDetails;
}

interface PaymentDetails {
  bankAccountId: string;
  paymentMethod: string;
  paymentDate: string;
  referenceNumber: string;
  notes: string;
  receiptFile?: File;
  fees: {
    exchangeRateVariance: number;
    bankTransferFee: number;
    gctOnTransaction: number;
    otherFees: number;
  };
  completedBy?: string;
  completedDate?: string;
}

interface BankAccount {
  id: string;
  bankName: string;
  accountName: string;
  accountNumber: string;
  currentBalance: number;
  currency: string;
}

interface PaymentReviewDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: InvoicePayment | null;
  bankAccounts: BankAccount[];
  onMarkAsPaid: (paymentData: any) => void;
  onSaveDraft: (paymentData: any) => void;
}

export function PaymentReviewDrawer({
  isOpen,
  onClose,
  invoice,
  bankAccounts,
  onMarkAsPaid,
  onSaveDraft,
}: PaymentReviewDrawerProps) {
  const [selectedBankAccountId, setSelectedBankAccountId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Wire Transfer');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [referenceNumber, setReferenceNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [showFeesSection, setShowFeesSection] = useState(false);
  const [showAuditTrail, setShowAuditTrail] = useState(false);
  const [otherPaymentMethod, setOtherPaymentMethod] = useState('');

  // Fees
  const [exchangeRateVariance, setExchangeRateVariance] = useState('0');
  const [bankTransferFee, setBankTransferFee] = useState('0');
  const [gctOnTransaction, setGctOnTransaction] = useState('0');
  const [otherFees, setOtherFees] = useState('0');

  if (!isOpen || !invoice) return null;

  const isCompleted = invoice.status === 'Completed';
  const selectedAccount = bankAccounts.find(acc => acc.id === selectedBankAccountId);

  // Calculate totals
  const totalFees =
    parseFloat(exchangeRateVariance || '0') +
    parseFloat(bankTransferFee || '0') +
    parseFloat(gctOnTransaction || '0') +
    parseFloat(otherFees || '0');

  const totalPayment = invoice.invoiceAmount + totalFees;
  const netVendorReceives = invoice.invoiceAmount;

  // Remaining balance after payment
  const remainingBalance = selectedAccount
    ? selectedAccount.currentBalance - totalPayment
    : 0;

  const hasInsufficientBalance = remainingBalance < 0;

  // Format currency
  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
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

  // Handle file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setReceiptFile(file);
    }
  };

  // Handle mark as paid
  const handleMarkAsPaid = () => {
    if (!selectedBankAccountId || !paymentMethod || !paymentDate) {
      alert('Please fill in all required payment fields');
      return;
    }

    if (hasInsufficientBalance) {
      alert('Insufficient balance in selected bank account');
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to complete this payment of ${formatCurrency(
        totalPayment,
        invoice.currency
      )}?`
    );

    if (confirmed) {
      onMarkAsPaid({
        invoiceId: invoice.id,
        bankAccountId: selectedBankAccountId,
        paymentMethod: paymentMethod === 'Other' ? otherPaymentMethod : paymentMethod,
        paymentDate,
        referenceNumber,
        notes,
        receiptFile,
        fees: {
          exchangeRateVariance: parseFloat(exchangeRateVariance || '0'),
          bankTransferFee: parseFloat(bankTransferFee || '0'),
          gctOnTransaction: parseFloat(gctOnTransaction || '0'),
          otherFees: parseFloat(otherFees || '0'),
        },
        totalPayment,
      });
    }
  };

  // Handle save draft
  const handleSaveDraft = () => {
    onSaveDraft({
      invoiceId: invoice.id,
      bankAccountId: selectedBankAccountId,
      paymentMethod: paymentMethod === 'Other' ? otherPaymentMethod : paymentMethod,
      paymentDate,
      referenceNumber,
      notes,
      receiptFile,
      fees: {
        exchangeRateVariance: parseFloat(exchangeRateVariance || '0'),
        bankTransferFee: parseFloat(bankTransferFee || '0'),
        gctOnTransaction: parseFloat(gctOnTransaction || '0'),
        otherFees: parseFloat(otherFees || '0'),
      },
    });
  };

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-gray-900/20 z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed right-0 top-0 bottom-0 w-full max-w-xl bg-white shadow-2xl z-50 overflow-y-auto animate-slide-in-right">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 z-10">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Payment Review</h2>
              <p className="text-sm text-gray-500 mt-0.5">
                {isCompleted ? 'View payment details' : 'Review and execute payment'}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          {/* Section 1: Invoice Summary */}
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">
                Invoice Summary
              </h3>
              <div className="flex items-center gap-2">
                <button className="p-2 text-gray-600 hover:bg-gray-200 rounded-lg transition-colors">
                  <Download className="w-4 h-4" />
                </button>
                <button className="px-3 py-1.5 text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors flex items-center gap-1">
                  <FileText className="w-4 h-4" />
                  View Invoice PDF
                </button>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Building2 className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Vendor Name
                  </p>
                  <p className="text-sm text-gray-900 font-medium">{invoice.vendorName}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                    Invoice Number
                  </p>
                  <p className="text-sm text-gray-900 font-mono">{invoice.invoiceNumber}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                    Engagement
                  </p>
                  <p className="text-sm text-blue-600 font-mono">{invoice.engagementId}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                    Due Date
                  </p>
                  <p className="text-sm text-gray-900">{formatDate(invoice.dueDate)}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                    Uploaded Date
                  </p>
                  <p className="text-sm text-gray-900">{formatDate(invoice.uploadedDate)}</p>
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                  Description
                </p>
                <p className="text-sm text-gray-700">{invoice.description}</p>
              </div>

              <div className="pt-3 border-t border-gray-300">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                  Invoice Amount
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(invoice.invoiceAmount, invoice.currency)}
                </p>
              </div>
            </div>
          </div>

          {/* Section 2: Payment Configuration */}
          {!isCompleted && (
            <>
              <div className="bg-white border border-gray-200 rounded-xl p-5">
                <h3 className="text-sm font-semibold text-gray-900 mb-4 uppercase tracking-wider">
                  Payment Configuration
                </h3>

                <div className="space-y-4">
                  {/* Select Bank Account */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Pay From Account <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={selectedBankAccountId}
                      onChange={(e) => setSelectedBankAccountId(e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    >
                      <option value="">Select bank account...</option>
                      {bankAccounts.map((account) => (
                        <option key={account.id} value={account.id}>
                          {account.bankName} - {account.accountName} (****
                          {account.accountNumber.slice(-4)}) - Balance:{' '}
                          {formatCurrency(account.currentBalance, account.currency)}
                        </option>
                      ))}
                    </select>

                    {selectedAccount && (
                      <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-xs font-semibold text-blue-900 mb-1">
                          Remaining Balance After Payment
                        </p>
                        <p
                          className={`text-lg font-bold ${
                            hasInsufficientBalance ? 'text-red-600' : 'text-green-600'
                          }`}
                        >
                          {formatCurrency(remainingBalance, selectedAccount.currency)}
                        </p>
                      </div>
                    )}

                    {hasInsufficientBalance && (
                      <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                        <p className="text-xs text-red-700">
                          <strong>Insufficient Balance:</strong> The selected account does not have enough funds to complete this payment.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Payment Method */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Payment Method <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    >
                      <option value="Wire Transfer">Wire Transfer</option>
                      <option value="Cash">Cash</option>
                      <option value="Manager's Check">Manager's Check</option>
                      <option value="Payoneer">Payoneer</option>
                      <option value="Other">Other</option>
                    </select>

                    {paymentMethod === 'Other' && (
                      <input
                        type="text"
                        value={otherPaymentMethod}
                        onChange={(e) => setOtherPaymentMethod(e.target.value)}
                        placeholder="Specify payment method..."
                        className="mt-2 w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                      />
                    )}
                  </div>

                  {/* Payment Date */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Payment Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={paymentDate}
                      onChange={(e) => setPaymentDate(e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                  </div>

                  {/* Reference Number */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Reference Number / Transaction ID
                    </label>
                    <input
                      type="text"
                      value={referenceNumber}
                      onChange={(e) => setReferenceNumber(e.target.value)}
                      placeholder="TXN-2025-..."
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                  </div>

                  {/* Notes */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Notes
                    </label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Add any additional payment notes..."
                      rows={3}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                    />
                  </div>

                  {/* Upload Receipt */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Upload Receipt (Optional)
                    </label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                      <input
                        type="file"
                        id="receipt-upload"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                      <label
                        htmlFor="receipt-upload"
                        className="flex flex-col items-center cursor-pointer"
                      >
                        <Upload className="w-8 h-8 text-gray-400 mb-2" />
                        <p className="text-sm text-gray-600">Click to upload receipt</p>
                        <p className="text-xs text-gray-400 mt-1">PDF, Image (max 10MB)</p>
                      </label>

                      {receiptFile && (
                        <div className="mt-3 flex items-center gap-2 p-2 bg-gray-50 rounded border border-gray-200">
                          <Paperclip className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-700 flex-1">{receiptFile.name}</span>
                          <button
                            onClick={() => setReceiptFile(null)}
                            className="text-gray-400 hover:text-red-600"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 3: Fee & Adjustment Tracking */}
              <div className="bg-white border border-gray-200 rounded-xl">
                <button
                  onClick={() => setShowFeesSection(!showFeesSection)}
                  className="w-full flex items-center justify-between p-5 hover:bg-gray-50 transition-colors"
                >
                  <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">
                    Transaction Costs & Adjustments
                  </h3>
                  {showFeesSection ? (
                    <ChevronUp className="w-5 h-5 text-gray-400" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  )}
                </button>

                {showFeesSection && (
                  <div className="px-5 pb-5 space-y-4 border-t border-gray-200 pt-4">
                    {/* Exchange Rate Variance */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Exchange Rate Variance
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          step="0.01"
                          value={exchangeRateVariance}
                          onChange={(e) => setExchangeRateVariance(e.target.value)}
                          placeholder="0.00"
                          className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                        />
                        <select className="px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent">
                          <option value="USD">USD</option>
                          <option value="CAD">CAD</option>
                          <option value="JMD">JMD</option>
                        </select>
                      </div>
                    </div>

                    {/* Bank Transfer Fee */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Bank Transfer Fee
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          step="0.01"
                          value={bankTransferFee}
                          onChange={(e) => setBankTransferFee(e.target.value)}
                          placeholder="0.00"
                          className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                        />
                        <select className="px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent">
                          <option value="USD">USD</option>
                          <option value="CAD">CAD</option>
                          <option value="JMD">JMD</option>
                        </select>
                      </div>
                    </div>

                    {/* GCT on Transaction */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        GCT on Transaction
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          step="0.01"
                          value={gctOnTransaction}
                          onChange={(e) => setGctOnTransaction(e.target.value)}
                          placeholder="0.00"
                          className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                        />
                        <select className="px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent">
                          <option value="USD">USD</option>
                          <option value="CAD">CAD</option>
                          <option value="JMD">JMD</option>
                        </select>
                      </div>
                    </div>

                    {/* Other Fees */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Other Fees
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          step="0.01"
                          value={otherFees}
                          onChange={(e) => setOtherFees(e.target.value)}
                          placeholder="0.00"
                          className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                        />
                        <select className="px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent">
                          <option value="USD">USD</option>
                          <option value="CAD">CAD</option>
                          <option value="JMD">JMD</option>
                        </select>
                      </div>
                    </div>

                    {/* Summary Card */}
                    <div className="p-4 bg-gray-50 rounded-lg border border-gray-300 space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Invoice Amount:</span>
                        <span className="font-semibold text-gray-900">
                          {formatCurrency(invoice.invoiceAmount, invoice.currency)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Total Fees:</span>
                        <span className="font-semibold text-gray-900">
                          {formatCurrency(totalFees, invoice.currency)}
                        </span>
                      </div>
                      <div className="pt-2 border-t border-gray-300 flex items-center justify-between">
                        <span className="text-sm font-semibold text-gray-900">
                          Total Payment:
                        </span>
                        <span className="text-lg font-bold text-gray-900">
                          {formatCurrency(totalPayment, invoice.currency)}
                        </span>
                      </div>
                      <div className="pt-2 border-t border-gray-300 flex items-center justify-between">
                        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          Net Vendor Receives:
                        </span>
                        <span className="text-sm font-semibold text-green-600">
                          {formatCurrency(netVendorReceives, invoice.currency)}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Completed Payment View */}
          {isCompleted && invoice.paymentDetails && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <h3 className="text-sm font-semibold text-green-900 uppercase tracking-wider">
                  Payment Completed
                </h3>
              </div>

              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs font-semibold text-green-700 uppercase tracking-wider mb-1">
                      Payment Method
                    </p>
                    <p className="text-sm text-green-900">{invoice.paymentDetails.paymentMethod}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-green-700 uppercase tracking-wider mb-1">
                      Payment Date
                    </p>
                    <p className="text-sm text-green-900">
                      {formatDate(invoice.paymentDetails.paymentDate)}
                    </p>
                  </div>
                </div>

                {invoice.paymentDetails.referenceNumber && (
                  <div>
                    <p className="text-xs font-semibold text-green-700 uppercase tracking-wider mb-1">
                      Reference Number
                    </p>
                    <p className="text-sm text-green-900 font-mono">
                      {invoice.paymentDetails.referenceNumber}
                    </p>
                  </div>
                )}

                <button className="w-full px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-semibold flex items-center justify-center gap-2">
                  <Download className="w-4 h-4" />
                  Download Payment Summary PDF
                </button>
              </div>
            </div>
          )}

          {/* Audit Trail */}
          <div className="bg-white border border-gray-200 rounded-xl">
            <button
              onClick={() => setShowAuditTrail(!showAuditTrail)}
              className="w-full flex items-center justify-between p-5 hover:bg-gray-50 transition-colors"
            >
              <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">
                Audit Trail
              </h3>
              {showAuditTrail ? (
                <ChevronUp className="w-5 h-5 text-gray-400" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-400" />
              )}
            </button>

            {showAuditTrail && (
              <div className="px-5 pb-5 space-y-3 border-t border-gray-200 pt-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Info className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Invoice Uploaded</p>
                    <p className="text-xs text-gray-500">
                      By John Smith • {formatDate(invoice.uploadedDate)}
                    </p>
                  </div>
                </div>

                {isCompleted && invoice.paymentDetails && (
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Payment Completed</p>
                      <p className="text-xs text-gray-500">
                        By {invoice.paymentDetails.completedBy} •{' '}
                        {formatDate(invoice.paymentDetails.completedDate!)}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        {!isCompleted && (
          <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4">
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={handleSaveDraft}
                className="px-5 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
              >
                Save Draft
              </button>
              <button
                onClick={handleMarkAsPaid}
                disabled={!selectedBankAccountId || !paymentMethod || hasInsufficientBalance}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-semibold shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <CheckCircle className="w-4 h-4" />
                Mark as Paid
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}