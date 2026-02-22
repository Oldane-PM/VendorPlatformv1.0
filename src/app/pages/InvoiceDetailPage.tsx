import { useRouter } from 'next/router';
import Link from 'next/link';
import {
  ArrowLeft,
  FileText,
  Download,
  Eye,
  CheckCircle,
  AlertTriangle,
  Receipt,
  Calendar,
  DollarSign,
} from 'lucide-react';

export function InvoiceDetailPage() {
  const router = useRouter();
  const id = router.query.invoiceId as string | undefined;

  // Mock invoice data
  const invoice = {
    invoiceId: 'INV-0001',
    vendorEngagementId: 'VE-0001',
    engagementId: 'ENG-0001',
    rfqId: 'RFQ-0001',
    vendorName: 'CloudTech Solutions',
    vendorAddress: '123 Cloud Street, San Francisco, CA 94102',
    vendorContact: 'john.doe@cloudtech.com',
    projectTitle: 'Cloud Infrastructure Modernization',
    invoiceType: 'Partial Payment',
    invoiceAmount: 114000,
    tax: 11400,
    totalAmount: 125400,
    status: 'Paid',
    createdDate: '2026-02-10',
    paidDate: '2026-02-15',
    description: 'Payment for cloud migration planning and assessment phase completion',
    awardAmount: 285000,
    totalPaidSoFar: 114000,
    remainingBalance: 171000,
    attachments: [
      {
        id: 'ATT-INV-001-1',
        name: 'Milestone_Completion_Certificate.pdf',
        type: 'application/pdf',
        size: 456000,
        uploadedAt: '2026-02-10T14:30:00',
        uploadedBy: 'Sarah Johnson',
      },
      {
        id: 'ATT-INV-001-2',
        name: 'Work_Verification_Report.pdf',
        type: 'application/pdf',
        size: 892000,
        uploadedAt: '2026-02-10T14:32:00',
        uploadedBy: 'Sarah Johnson',
      },
      {
        id: 'ATT-INV-001-3',
        name: 'Payment_Authorization.pdf',
        type: 'application/pdf',
        size: 234000,
        uploadedAt: '2026-02-10T14:35:00',
        uploadedBy: 'Michael Chen',
      },
    ],
  };

  // Mock payment history
  const paymentHistory = [
    {
      invoiceId: 'INV-0001',
      amount: 114000,
      percentage: 40,
      date: '2026-02-15',
      status: 'Paid',
      description: 'Planning & Assessment Phase',
    },
  ];

  // Calculate payment progress
  const paymentProgress = (invoice.totalPaidSoFar / invoice.awardAmount) * 100;

  // Status badge styling
  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'Draft':
        return 'bg-gray-100 text-gray-700 border-gray-200';
      case 'Submitted':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'Approved':
        return 'bg-indigo-100 text-indigo-700 border-indigo-200';
      case 'Rejected':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'Paid':
        return 'bg-green-100 text-green-700 border-green-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  // Format date
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  // Format datetime
  const formatDateTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Handle PDF download
  const handleDownloadPDF = () => {
    alert(`Downloading PDF for ${invoice.invoiceId}`);
  };

  // Handle PDF preview
  const handlePreviewPDF = () => {
    alert(`Opening PDF preview for ${invoice.invoiceId}`);
  };

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <button
        onClick={() => router.push('/invoices')}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span className="text-sm font-medium">Back to Invoices</span>
      </button>

      {/* Invoice Summary Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-start justify-between mb-6">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-semibold text-gray-900">
                {invoice.invoiceId}
              </h1>
              <span
                className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${getStatusBadgeClass(
                  invoice.status
                )}`}
              >
                {invoice.status}
              </span>
            </div>
            <p className="text-gray-600">{invoice.description}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePreviewPDF}
              className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
            >
              <Eye className="w-4 h-4" />
              Preview PDF
            </button>
            <button
              onClick={handleDownloadPDF}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-semibold shadow-sm"
            >
              <Download className="w-4 h-4" />
              Download PDF
            </button>
          </div>
        </div>

        {/* Key Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">
              Invoice Amount
            </p>
            <p className="text-2xl font-semibold text-gray-900">
              {formatCurrency(invoice.invoiceAmount)}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">
              Invoice Type
            </p>
            <p className="text-sm font-medium text-gray-900">
              {invoice.invoiceType}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">
              Created Date
            </p>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-400" />
              <span className="text-sm font-medium text-gray-900">
                {formatDate(invoice.createdDate)}
              </span>
            </div>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">
              {invoice.status === 'Paid' ? 'Paid Date' : 'Due Date'}
            </p>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-400" />
              <span className="text-sm font-medium text-gray-900">
                {invoice.paidDate ? formatDate(invoice.paidDate) : 'Pending'}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Vendor Information */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Vendor Information
            </h2>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                  Vendor Name
                </p>
                <p className="text-sm font-medium text-gray-900">
                  {invoice.vendorName}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                  Address
                </p>
                <p className="text-sm text-gray-700">{invoice.vendorAddress}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                  Contact
                </p>
                <p className="text-sm text-gray-700">{invoice.vendorContact}</p>
              </div>
            </div>
          </div>

          {/* Engagement Reference */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Engagement Reference
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                  Vendor Engagement ID
                </p>
                <Link
                  href={`/engagements/${invoice.vendorEngagementId}`}
                  className="text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline"
                >
                  {invoice.vendorEngagementId}
                </Link>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                  Engagement ID
                </p>
                <Link
                  href="/engagements"
                  className="text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline"
                >
                  {invoice.engagementId}
                </Link>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                  RFQ ID
                </p>
                <Link
                  href={`/rfqs/${invoice.rfqId}`}
                  className="text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline"
                >
                  {invoice.rfqId}
                </Link>
              </div>
            </div>
            <div className="mt-4">
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                Project Title
              </p>
              <p className="text-sm font-medium text-gray-900">
                {invoice.projectTitle}
              </p>
            </div>
          </div>

          {/* Invoice Breakdown */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Invoice Breakdown
            </h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2 border-b border-gray-200">
                <span className="text-sm text-gray-600">Description</span>
                <span className="text-sm font-medium text-gray-900">Amount</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-gray-900">
                  {invoice.description}
                </span>
                <span className="text-sm font-medium text-gray-900">
                  {formatCurrency(invoice.invoiceAmount)}
                </span>
              </div>
              <div className="flex items-center justify-between py-2 border-t border-gray-200">
                <span className="text-sm text-gray-600">Tax (10%)</span>
                <span className="text-sm font-medium text-gray-900">
                  {formatCurrency(invoice.tax)}
                </span>
              </div>
              <div className="flex items-center justify-between py-3 bg-blue-50 -mx-6 px-6 border-t-2 border-blue-200">
                <span className="text-base font-semibold text-gray-900">
                  Total Amount
                </span>
                <span className="text-xl font-bold text-primary">
                  {formatCurrency(invoice.totalAmount)}
                </span>
              </div>
            </div>
          </div>

          {/* Attachments */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Supporting Documents
            </h2>
            {invoice.attachments.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-6">
                No supporting documents attached
              </p>
            ) : (
              <div className="space-y-3">
                {invoice.attachments.map((file) => (
                  <div
                    key={file.id}
                    className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all"
                  >
                    {/* File Icon */}
                    <div className="flex-shrink-0 mt-1">
                      <FileText className="w-5 h-5 text-red-600" />
                    </div>

                    {/* File Info */}
                    <div className="flex-1 min-w-0">
                      <p
                        className="text-sm font-medium text-gray-900 truncate"
                        title={file.name}
                      >
                        {file.name}
                      </p>
                      <div className="mt-1 flex items-center gap-3 text-xs text-gray-500">
                        <span>{formatFileSize(file.size)}</span>
                        <span>•</span>
                        <span>{formatDateTime(file.uploadedAt)}</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Uploaded by {file.uploadedBy}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        onClick={() => alert(`Viewing: ${file.name}`)}
                        className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                        title="View"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => alert(`Downloading: ${file.name}`)}
                        className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                        title="Download"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column - Payment Summary */}
        <div className="space-y-6">
          {/* Payment Summary */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Payment Summary
            </h2>
            <div className="space-y-4">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                  Award Amount
                </p>
                <p className="text-lg font-semibold text-gray-900">
                  {formatCurrency(invoice.awardAmount)}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                  Amount Paid So Far
                </p>
                <p className="text-lg font-semibold text-green-700">
                  {formatCurrency(invoice.totalPaidSoFar)}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                  Current Invoice
                </p>
                <p className="text-lg font-semibold text-blue-700">
                  {formatCurrency(invoice.invoiceAmount)}
                </p>
              </div>
              <div className="pt-4 border-t border-gray-200">
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                  Remaining Balance
                </p>
                <p className="text-xl font-bold text-gray-900">
                  {formatCurrency(invoice.remainingBalance)}
                </p>
              </div>

              {/* Progress Bar */}
              <div className="pt-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-gray-600 font-medium">
                    Payment Progress
                  </span>
                  <span className="text-xs font-semibold text-primary">
                    {paymentProgress.toFixed(0)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                  <div
                    className="bg-primary h-full rounded-full transition-all duration-500"
                    style={{ width: `${paymentProgress}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Payment History */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Payment History
            </h2>
            <div className="space-y-4">
              {paymentHistory.map((payment, index) => (
                <div
                  key={payment.invoiceId}
                  className="flex items-start gap-3 pb-4 border-b border-gray-200 last:border-0 last:pb-0"
                >
                  <div className="flex-shrink-0 mt-1">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-medium text-gray-900">
                        {payment.invoiceId}
                      </p>
                      <span className="text-xs font-semibold text-green-700">
                        {payment.percentage}%
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 mb-1">
                      {payment.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">
                        {formatDate(payment.date)}
                      </span>
                      <span className="text-sm font-semibold text-gray-900">
                        {formatCurrency(payment.amount)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Status Info */}
          {invoice.status === 'Paid' && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-green-900">
                    Payment Completed
                  </p>
                  <p className="text-xs text-green-700 mt-1">
                    This invoice has been paid in full on{' '}
                    {formatDate(invoice.paidDate || '')}.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
