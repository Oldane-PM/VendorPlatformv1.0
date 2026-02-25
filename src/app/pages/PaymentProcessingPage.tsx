import { useState, useMemo } from 'react';
import {
  CreditCard,
  Download,
  Filter,
  Search,
  CheckCircle2,
  Clock,
  FileText,
  ChevronRight,
  Calendar,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { PaymentReviewDrawer } from '../components/PaymentReviewDrawer';
import { usePaymentProcessing } from '@/lib/hooks/usePaymentProcessing';

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
  paymentDetails?: any;
}

interface BankAccount {
  id: string;
  bankName: string;
  accountName: string;
  accountNumber: string;
  currentBalance: number;
  currency: string;
}

export function PaymentProcessingPage() {
  const {
    items: rawItems,
    summary,
    bankAccounts: rawBankAccounts,
    isLoading,
    error,
    selectedItemDetail,
    isDetailLoading,
    detailError,
    fetchDetail,
    markAsPaid,
  } = usePaymentProcessing();

  // Map to component types
  const invoices: InvoicePayment[] = useMemo(() => {
    return rawItems.map((item) => {
      let uiStatus: 'Pending Payment' | 'Completed' | 'Draft' = 'Draft';
      if (item.status === 'paid') uiStatus = 'Completed';
      else if (['approved', 'scheduled', 'submitted'].includes(item.status)) {
        uiStatus = 'Pending Payment';
      }

      return {
        id: item.id,
        invoiceNumber: item.invoice_number,
        vendorName: item.vendor_name,
        engagementId: item.engagement_id,
        invoiceAmount: item.amount,
        currency: 'USD', // defaulting for now, could be added to schema later
        status: uiStatus,
        dueDate: item.due_date || '',
        uploadedDate: item.submitted_date || item.created_at,
        description: `Invoice ${item.invoice_number}`,
      };
    });
  }, [rawItems]);

  const bankAccounts: BankAccount[] = useMemo(() => {
    return rawBankAccounts.map((account) => ({
      id: account.id,
      bankName: account.bank_name,
      accountName: account.account_name,
      accountNumber: `******${account.last_four_digits}`,
      currentBalance: account.current_balance,
      currency: account.currency,
    }));
  }, [rawBankAccounts]);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [vendorFilter, setVendorFilter] = useState<string>('All');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<string>('All');
  const [selectedInvoice, setSelectedInvoice] = useState<InvoicePayment | null>(
    null
  );
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Summary Metrics defaulting
  const totalPendingAmount = summary?.totalPendingAmount || 0;
  const pendingCount = summary?.pendingCount || 0;
  const completedCount = summary?.completedCount || 0;
  const totalProcessed = summary?.totalProcessedAmount || 0;

  // Get unique vendors
  const uniqueVendors = Array.from(
    new Set(invoices.map((inv) => inv.vendorName))
  );

  // Filter invoices
  const filteredInvoices = invoices.filter((invoice) => {
    const matchesSearch =
      invoice.vendorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      invoice.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      invoice.engagementId.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === 'All' || invoice.status === statusFilter;
    const matchesVendor =
      vendorFilter === 'All' || invoice.vendorName === vendorFilter;

    return matchesSearch && matchesStatus && matchesVendor;
  });

  // Status badge styling
  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'Pending Payment':
        return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'Completed':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'Draft':
        return 'bg-gray-100 text-gray-700 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  // Get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Pending Payment':
        return <Clock className="w-4 h-4" />;
      case 'Completed':
        return <CheckCircle2 className="w-4 h-4" />;
      default:
        return null;
    }
  };

  // Format currency
  const formatCurrency = (amount: number, currency: string) => {
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

  // Handle row click
  const handleRowClick = async (invoice: InvoicePayment) => {
    setSelectedInvoice(invoice);
    setIsDrawerOpen(true);
    await fetchDetail(invoice.id);
  };

  // Handle mark as paid
  const handleMarkAsPaid = async (paymentData: any) => {
    if (!selectedInvoice) return;
    const success = await markAsPaid(selectedInvoice.id, {
      bankAccountId: paymentData.bankAccountId,
      paymentMethod: paymentData.paymentMethod,
      paymentDate: paymentData.paymentDate,
      referenceNumber: paymentData.referenceNumber,
      notes: paymentData.notes,
      amount: selectedInvoice.invoiceAmount,
      fees: paymentData.fees,
    });

    if (success) {
      alert('✅ Payment marked as completed successfully!');
      setIsDrawerOpen(false);
    } else {
      alert('❌ Failed to mark as completed.');
    }
  };

  // Handle save draft
  const handleSaveDraft = (paymentData: any) => {
    // Draft functionality would ideally call another mutation in the hook
    // Let's stub it for now with an alert since this was mock UI state previously
    alert('💾 Payment draft save is not fully implemented in the backend yet.');
    setIsDrawerOpen(false);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-white rounded-xl shadow-sm border border-gray-200 min-h-[400px]">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin mb-4" />
        <p className="text-gray-500 font-medium">Loading payment data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 flex items-start gap-4">
        <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
        <div>
          <h3 className="text-red-800 font-medium">
            Error loading payment data
          </h3>
          <p className="text-red-600 text-sm mt-1">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-semibold text-gray-900">
          Payment Processing
        </h1>
        <p className="text-gray-500 mt-1">
          Review and execute vendor invoice payments
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Pending Amount */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-start justify-between mb-3">
            <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-amber-600" />
            </div>
          </div>
          <p className="text-2xl font-semibold text-gray-900 mb-1">
            {formatCurrency(totalPendingAmount, 'USD')}
          </p>
          <p className="text-sm text-gray-500">Total Pending Payments</p>
        </div>

        {/* Pending Count */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-start justify-between mb-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-blue-600" />
            </div>
          </div>
          <p className="text-2xl font-semibold text-gray-900 mb-1">
            {pendingCount}
          </p>
          <p className="text-sm text-gray-500">Invoices Awaiting Payment</p>
        </div>

        {/* Completed Count */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-start justify-between mb-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
            </div>
          </div>
          <p className="text-2xl font-semibold text-gray-900 mb-1">
            {completedCount}
          </p>
          <p className="text-sm text-gray-500">Completed This Month</p>
        </div>

        {/* Total Processed */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-start justify-between mb-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
            </div>
          </div>
          <p className="text-2xl font-semibold text-gray-900 mb-1">
            {formatCurrency(totalProcessed, 'USD')}
          </p>
          <p className="text-sm text-gray-500">Total Processed Amount</p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by invoice #, vendor name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>

          {/* Filters */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-gray-400" />
              <span className="text-sm font-medium text-gray-700">
                Filters:
              </span>
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="All">All Status</option>
              <option value="Pending Payment">Pending Payment</option>
              <option value="Completed">Completed</option>
              <option value="Draft">Draft</option>
            </select>

            {/* Vendor Filter */}
            <select
              value={vendorFilter}
              onChange={(e) => setVendorFilter(e.target.value)}
              className="px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="All">All Vendors</option>
              {uniqueVendors.map((vendor) => (
                <option key={vendor} value={vendor}>
                  {vendor}
                </option>
              ))}
            </select>
          </div>

          {/* Export Button */}
          <button className="flex items-center gap-2 px-5 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium">
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      {/* Invoice Payment Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Invoice #
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Vendor
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Engagement
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Invoice Amount
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Currency
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Due Date
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Uploaded Date
                </th>
                <th className="px-6 py-4"></th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredInvoices.map((invoice) => (
                <tr
                  key={invoice.id}
                  onClick={() => handleRowClick(invoice)}
                  className="hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-mono font-medium text-blue-600">
                      {invoice.invoiceNumber}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-900">
                      {invoice.vendorName}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-mono text-blue-600">
                      {invoice.engagementId}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-semibold text-gray-900">
                      {formatCurrency(invoice.invoiceAmount, invoice.currency)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-700">
                      {invoice.currency}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${getStatusBadgeClass(
                        invoice.status
                      )}`}
                    >
                      {getStatusIcon(invoice.status)}
                      {invoice.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-700">
                        {formatDate(invoice.dueDate)}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-500">
                      {formatDate(invoice.uploadedDate)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Empty State */}
        {filteredInvoices.length === 0 && (
          <div className="p-12 text-center">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">
              No invoices found matching your criteria
            </p>
          </div>
        )}
      </div>

      {/* Payment Review Drawer */}
      <PaymentReviewDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        invoice={selectedInvoice}
        bankAccounts={bankAccounts}
        paymentDetail={selectedItemDetail}
        isDetailLoading={isDetailLoading}
        onMarkAsPaid={handleMarkAsPaid}
        onSaveDraft={handleSaveDraft}
      />
    </div>
  );
}
