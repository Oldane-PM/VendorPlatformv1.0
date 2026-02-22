import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import {
  Search,
  Filter,
  Eye,
  Download,
  FileText,
  Receipt,
} from 'lucide-react';

// Invoice type
interface Invoice {
  invoiceId: string;
  vendorEngagementId: string;
  engagementId: string;
  rfqId: string;
  vendorName: string;
  invoiceType: 'Full Payment' | 'Partial Payment';
  invoiceAmount: number;
  status: 'Draft' | 'Submitted' | 'Approved' | 'Rejected' | 'Paid';
  createdDate: string;
  description: string;
  attachments?: number;
  totalPaidSoFar: number;
  awardAmount: number;
}

// Mock invoice data
const mockInvoices: Invoice[] = [
  {
    invoiceId: 'INV-0001',
    vendorEngagementId: 'VE-0001',
    engagementId: 'ENG-0001',
    rfqId: 'RFQ-0001',
    vendorName: 'CloudTech Solutions',
    invoiceType: 'Partial Payment',
    invoiceAmount: 114000,
    status: 'Paid',
    createdDate: '2026-02-10',
    description: 'Payment for cloud migration planning and assessment phase completion',
    attachments: 3,
    totalPaidSoFar: 114000,
    awardAmount: 285000,
  },
  {
    invoiceId: 'INV-0002',
    vendorEngagementId: 'VE-0002',
    engagementId: 'ENG-0003',
    rfqId: 'RFQ-0005',
    vendorName: 'SecureNet Systems',
    invoiceType: 'Partial Payment',
    invoiceAmount: 180000,
    status: 'Approved',
    createdDate: '2026-02-12',
    description: 'Initial payment for network security infrastructure deployment',
    attachments: 5,
    totalPaidSoFar: 180000,
    awardAmount: 450000,
  },
  {
    invoiceId: 'INV-0003',
    vendorEngagementId: 'VE-0003',
    engagementId: 'ENG-0006',
    rfqId: 'RFQ-0008',
    vendorName: 'DataViz Analytics',
    invoiceType: 'Full Payment',
    invoiceAmount: 125000,
    status: 'Paid',
    createdDate: '2026-02-01',
    description: 'Final payment for business intelligence dashboard implementation',
    attachments: 2,
    totalPaidSoFar: 125000,
    awardAmount: 125000,
  },
  {
    invoiceId: 'INV-0004',
    vendorEngagementId: 'VE-0001',
    engagementId: 'ENG-0001',
    rfqId: 'RFQ-0001',
    vendorName: 'CloudTech Solutions',
    invoiceType: 'Partial Payment',
    invoiceAmount: 90000,
    status: 'Submitted',
    createdDate: '2026-02-14',
    description: 'Payment for infrastructure migration services - Phase 2',
    attachments: 4,
    totalPaidSoFar: 204000,
    awardAmount: 285000,
  },
];

export function InvoicesPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  const invoices = mockInvoices;

  const filteredInvoices = invoices.filter((inv) => {
    const matchesSearch =
      inv.invoiceId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.vendorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.vendorEngagementId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.engagementId.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || inv.status === statusFilter;
    const matchesType = typeFilter === 'all' || inv.invoiceType === typeFilter;

    return matchesSearch && matchesStatus && matchesType;
  });

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
      month: 'short',
      day: 'numeric',
    });
  };

  // Handle PDF download
  const handleDownloadPDF = (invoiceId: string) => {
    alert(`Downloading PDF for ${invoiceId}`);
  };

  const router = useRouter();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900">Invoices</h1>
          <p className="text-gray-500 mt-1">
            Track vendor invoices and payment lifecycle
          </p>
        </div>
      </div>

      {/* Info Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Receipt className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-blue-900">
              Invoice Generation
            </p>
            <p className="text-xs text-blue-700 mt-1">
              Invoices can only be generated from existing Vendor Engagements. Navigate to a Vendor Engagement detail page and click "Generate Invoice" to create a new invoice.
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      {invoices.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative md:col-span-2">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by invoice ID, vendor, or engagement..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
              />
            </div>

            {/* Type Filter */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent appearance-none bg-white text-sm"
              >
                <option value="all">All Types</option>
                <option value="Full Payment">Full Payment</option>
                <option value="Partial Payment">Partial Payment</option>
              </select>
            </div>

            {/* Status Filter */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent appearance-none bg-white text-sm"
              >
                <option value="all">All Status</option>
                <option value="Draft">Draft</option>
                <option value="Submitted">Submitted</option>
                <option value="Approved">Approved</option>
                <option value="Rejected">Rejected</option>
                <option value="Paid">Paid</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Invoices Table or Empty State */}
      {invoices.length === 0 ? (
        // Empty State
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12">
          <div className="max-w-md mx-auto text-center">
            <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Receipt className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No invoices yet
            </h3>
            <p className="text-gray-600 text-sm mb-6">
              Invoices are generated from Vendor Engagements. Create a Vendor Engagement first by awarding an RFQ.
            </p>
            <Link
              href="/engagements"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-semibold shadow-sm"
            >
              View Vendor Engagements
            </Link>
          </div>
        </div>
      ) : (
        // Table with Data
        <>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Invoice ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Vendor
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Vendor Engagement ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Invoice Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Invoice Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Created Date
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      PDF
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredInvoices.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-6 py-12 text-center">
                        <p className="text-gray-500">No invoices match your filters</p>
                        <p className="text-sm text-gray-400 mt-1">
                          Try adjusting your search or filter criteria
                        </p>
                      </td>
                    </tr>
                  ) : (
                    filteredInvoices.map((invoice) => (
                      <tr
                        key={invoice.invoiceId}
                        onClick={() => router.push(`/invoices/${invoice.invoiceId}`)}
                        className="hover:bg-gray-50 transition-colors cursor-pointer"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm font-mono font-medium text-gray-900">
                            {invoice.invoiceId}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm font-medium text-gray-900">
                            {invoice.vendorName}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Link
                            href={`/engagements/${invoice.vendorEngagementId}`}
                            onClick={(e) => e.stopPropagation()}
                            className="text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline"
                          >
                            {invoice.vendorEngagementId}
                          </Link>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-gray-700">
                            {invoice.invoiceType}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm font-semibold text-gray-900">
                            {formatCurrency(invoice.invoiceAmount)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${getStatusBadgeClass(
                              invoice.status
                            )}`}
                          >
                            {invoice.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-gray-600">
                            {formatDate(invoice.createdDate)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDownloadPDF(invoice.invoiceId);
                            }}
                            className="inline-flex items-center justify-center p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Download PDF"
                          >
                            <FileText className="w-5 h-5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Results Count */}
          <div className="text-sm text-gray-600">
            Showing <span className="font-medium">{filteredInvoices.length}</span> of{' '}
            <span className="font-medium">{invoices.length}</span> invoices
          </div>
        </>
      )}
    </div>
  );
}