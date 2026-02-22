import { useState } from 'react';
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
} from 'lucide-react';
import { PaymentReviewDrawer } from '../components/PaymentReviewDrawer';

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
  const [invoices, setInvoices] = useState<InvoicePayment[]>([
    {
      id: 'INV-2025-0089',
      invoiceNumber: 'INV-2025-0089',
      vendorName: 'CloudTech Solutions',
      engagementId: 'VE-0001',
      invoiceAmount: 45000.0,
      currency: 'USD',
      status: 'Pending Payment',
      dueDate: '2025-03-15',
      uploadedDate: '2025-02-15',
      description: 'Q1 Cloud Infrastructure Services - February 2025',
    },
    {
      id: 'INV-2025-0090',
      invoiceNumber: 'INV-2025-0090',
      vendorName: 'Azure Partners Inc',
      engagementId: 'VE-0002',
      invoiceAmount: 32000.0,
      currency: 'USD',
      status: 'Completed',
      dueDate: '2025-02-28',
      uploadedDate: '2025-02-10',
      description: 'Azure Migration Services - January 2025',
      paymentDetails: {
        bankAccountId: 'BA-001',
        paymentMethod: 'Wire Transfer',
        paymentDate: '2025-02-15',
        referenceNumber: 'TXN-2025-00145',
        notes: 'Payment processed successfully',
        fees: {
          exchangeRateVariance: 0,
          bankTransferFee: 25,
          gctOnTransaction: 0,
          otherFees: 0,
        },
        completedBy: 'Sarah Johnson',
        completedDate: '2025-02-15',
      },
    },
    {
      id: 'INV-2025-0091',
      invoiceNumber: 'INV-2025-0091',
      vendorName: 'SecureIT Services',
      engagementId: 'VE-0003',
      invoiceAmount: 78000.0,
      currency: 'USD',
      status: 'Pending Payment',
      dueDate: '2025-03-20',
      uploadedDate: '2025-02-12',
      description: 'Security Audit & Compliance Review Q1',
    },
    {
      id: 'INV-2025-0092',
      invoiceNumber: 'INV-2025-0092',
      vendorName: 'DataSync Corporation',
      engagementId: 'VE-0004',
      invoiceAmount: 15500.0,
      currency: 'USD',
      status: 'Draft',
      dueDate: '2025-03-10',
      uploadedDate: '2025-02-14',
      description: 'Data Integration Services - Monthly',
    },
    {
      id: 'INV-2025-0093',
      invoiceNumber: 'INV-2025-0093',
      vendorName: 'Marketing Pros Agency',
      engagementId: 'VE-0005',
      invoiceAmount: 22000.0,
      currency: 'USD',
      status: 'Pending Payment',
      dueDate: '2025-03-01',
      uploadedDate: '2025-02-08',
      description: 'Digital Marketing Campaign - February',
    },
    {
      id: 'INV-2025-0094',
      invoiceNumber: 'INV-2025-0094',
      vendorName: 'LegalTech Solutions',
      engagementId: 'VE-0006',
      invoiceAmount: 35000.0,
      currency: 'USD',
      status: 'Completed',
      dueDate: '2025-02-25',
      uploadedDate: '2025-02-05',
      description: 'Legal Consulting Services - January',
      paymentDetails: {
        bankAccountId: 'BA-001',
        paymentMethod: "Manager's Check",
        paymentDate: '2025-02-12',
        referenceNumber: 'CHK-2025-00089',
        notes: 'Check delivered',
        fees: {
          exchangeRateVariance: 0,
          bankTransferFee: 0,
          gctOnTransaction: 0,
          otherFees: 0,
        },
        completedBy: 'Michael Chen',
        completedDate: '2025-02-12',
      },
    },
    {
      id: 'INV-2025-0095',
      invoiceNumber: 'INV-2025-0095',
      vendorName: 'Office Supplies Co',
      engagementId: 'VE-0007',
      invoiceAmount: 1850.0,
      currency: 'USD',
      status: 'Pending Payment',
      dueDate: '2025-02-28',
      uploadedDate: '2025-02-16',
      description: 'Office Supplies - February Batch',
    },
    {
      id: 'INV-2025-0096',
      invoiceNumber: 'INV-2025-0096',
      vendorName: 'CloudTech Solutions',
      engagementId: 'VE-0001',
      invoiceAmount: 52000.0,
      currency: 'USD',
      status: 'Pending Payment',
      dueDate: '2025-03-25',
      uploadedDate: '2025-02-17',
      description: 'Q1 Cloud Infrastructure Services - March 2025',
    },
  ]);

  const [bankAccounts] = useState<BankAccount[]>([
    {
      id: 'BA-001',
      bankName: 'National Commercial Bank',
      accountName: 'Operations Account',
      accountNumber: '123456784582',
      currentBalance: 450000,
      currency: 'USD',
    },
    {
      id: 'BA-002',
      bankName: 'Scotiabank Jamaica',
      accountName: 'Payroll Account',
      accountNumber: '987654327293',
      currentBalance: 125000,
      currency: 'USD',
    },
    {
      id: 'BA-003',
      bankName: 'Jamaica National Bank',
      accountName: 'Reserve Account',
      accountNumber: '456789121456',
      currentBalance: 800000,
      currency: 'USD',
    },
  ]);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [vendorFilter, setVendorFilter] = useState<string>('All');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<string>('All');
  const [selectedInvoice, setSelectedInvoice] = useState<InvoicePayment | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Calculate summary metrics
  const totalPendingAmount = invoices
    .filter((inv) => inv.status === 'Pending Payment')
    .reduce((sum, inv) => sum + inv.invoiceAmount, 0);
  const pendingCount = invoices.filter((inv) => inv.status === 'Pending Payment').length;
  const completedCount = invoices.filter((inv) => inv.status === 'Completed').length;
  const totalProcessed = invoices
    .filter((inv) => inv.status === 'Completed')
    .reduce((sum, inv) => sum + inv.invoiceAmount, 0);

  // Get unique vendors
  const uniqueVendors = Array.from(new Set(invoices.map((inv) => inv.vendorName)));

  // Filter invoices
  const filteredInvoices = invoices.filter((invoice) => {
    const matchesSearch =
      invoice.vendorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      invoice.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      invoice.engagementId.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'All' || invoice.status === statusFilter;
    const matchesVendor = vendorFilter === 'All' || invoice.vendorName === vendorFilter;

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
  const handleRowClick = (invoice: InvoicePayment) => {
    setSelectedInvoice(invoice);
    setIsDrawerOpen(true);
  };

  // Handle mark as paid
  const handleMarkAsPaid = (paymentData: any) => {
    setInvoices((prev) =>
      prev.map((inv) =>
        inv.id === paymentData.invoiceId
          ? {
              ...inv,
              status: 'Completed' as const,
              paymentDetails: {
                ...paymentData,
                completedBy: 'Current User',
                completedDate: new Date().toISOString().split('T')[0],
              },
            }
          : inv
      )
    );
    alert('✅ Payment marked as completed successfully!');
    setIsDrawerOpen(false);
  };

  // Handle save draft
  const handleSaveDraft = (paymentData: any) => {
    setInvoices((prev) =>
      prev.map((inv) =>
        inv.id === paymentData.invoiceId
          ? {
              ...inv,
              status: 'Draft' as const,
              paymentDetails: paymentData,
            }
          : inv
      )
    );
    alert('💾 Payment draft saved successfully!');
    setIsDrawerOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-semibold text-gray-900">Payment Processing</h1>
        <p className="text-gray-500 mt-1">Review and execute vendor invoice payments</p>
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
          <p className="text-2xl font-semibold text-gray-900 mb-1">{pendingCount}</p>
          <p className="text-sm text-gray-500">Invoices Awaiting Payment</p>
        </div>

        {/* Completed Count */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-start justify-between mb-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
            </div>
          </div>
          <p className="text-2xl font-semibold text-gray-900 mb-1">{completedCount}</p>
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
              <span className="text-sm font-medium text-gray-700">Filters:</span>
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
                    <span className="text-sm text-gray-900">{invoice.vendorName}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-mono text-blue-600">{invoice.engagementId}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-semibold text-gray-900">
                      {formatCurrency(invoice.invoiceAmount, invoice.currency)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-700">{invoice.currency}</span>
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
                      <span className="text-sm text-gray-700">{formatDate(invoice.dueDate)}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-500">{formatDate(invoice.uploadedDate)}</span>
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
            <p className="text-gray-500">No invoices found matching your criteria</p>
          </div>
        )}
      </div>

      {/* Payment Review Drawer */}
      <PaymentReviewDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        invoice={selectedInvoice}
        bankAccounts={bankAccounts}
        onMarkAsPaid={handleMarkAsPaid}
        onSaveDraft={handleSaveDraft}
      />
    </div>
  );
}
