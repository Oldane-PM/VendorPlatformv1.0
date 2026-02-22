import { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import {
  ArrowLeft,
  Calendar,
  FileText,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Award,
  TrendingDown,
  Sparkles,
  Paperclip,
  X,
  Download,
  Eye,
  File,
  FileImage,
  FileSpreadsheet,
  Star,
} from 'lucide-react';
import { PerformanceRating } from '../components/PerformanceRating';

interface FileAttachment {
  id: string;
  name: string;
  type: string;
  size: number;
  uploadedAt: string;
  uploadedBy: string;
  url?: string;
}

interface VendorSubmission {
  vendorId: string;
  vendorName: string;
  quoteNumber: string;
  totalAmount: number;
  taxes: number;
  submissionDate: string;
  deliveryTimeline: string;
  warranty: string;
  paymentTerms: string;
  complianceStatus: 'Complete' | 'Missing Docs' | 'Needs Review';
  aiSummary: string;
  attachments: FileAttachment[];
  lineItems: {
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }[];
  performanceRating?: number; // 0-5
  vendorStatus: 'Existing' | 'New'; // Track if vendor is new or existing
}

export function WorkOrderDetailPage() {
  const router = useRouter();
  const id = router.query.rfqId as string | undefined;
  const [viewMode, setViewMode] = useState<'table' | 'comparison'>('table');
  const [selectedVendor, setSelectedVendor] = useState('');
  const [selectionReason, setSelectionReason] = useState('');
  const [rejectionNotes, setRejectionNotes] = useState('');
  const [showAwardPanel, setShowAwardPanel] = useState(false);
  const [attachmentsDrawer, setAttachmentsDrawer] = useState<{
    isOpen: boolean;
    vendorName: string;
    files: FileAttachment[];
  }>({ isOpen: false, vendorName: '', files: [] });

  // Mock Work Order data
  const workOrder = {
    id: 'WO-0001',
    engagementId: 'ENG-0001',
    engagementTitle: 'Cloud Infrastructure Modernization',
    engagementDescription:
      'Migrate legacy on-premise infrastructure to cloud-based architecture. Requires evaluation of AWS, Azure, and GCP capabilities for enterprise workloads.',
    title: 'AWS/Azure/GCP Enterprise Migration Services',
    deadline: '2026-03-15',
    status: 'Open',
    notes: 'Looking for comprehensive cloud migration services with 24/7 support',
    submissionCount: 3,
  };

  // Mock vendor submissions
  const submissions: VendorSubmission[] = [
    {
      vendorId: 'VEN-001',
      vendorName: 'CloudTech Solutions',
      quoteNumber: 'QT-2026-0145',
      totalAmount: 285000,
      taxes: 28500,
      submissionDate: '2026-02-18',
      deliveryTimeline: '90 days',
      warranty: '24 months',
      paymentTerms: 'Net 30',
      complianceStatus: 'Complete',
      aiSummary:
        'Strong proposal with proven AWS expertise. Includes migration roadmap, 24/7 support, and disaster recovery. Competitive pricing with comprehensive deliverables.',
      attachments: [
        {
          id: 'ATT-001-1',
          name: 'CloudTech_Solutions_Proposal.pdf',
          type: 'application/pdf',
          size: 2458000,
          uploadedAt: '2026-02-18T10:30:00',
          uploadedBy: 'John Doe',
        },
        {
          id: 'ATT-001-2',
          name: 'ISO_27001_Certificate.pdf',
          type: 'application/pdf',
          size: 512000,
          uploadedAt: '2026-02-18T10:32:00',
          uploadedBy: 'John Doe',
        },
        {
          id: 'ATT-001-3',
          name: 'Technical_Architecture_Diagram.png',
          type: 'image/png',
          size: 1024000,
          uploadedAt: '2026-02-18T10:35:00',
          uploadedBy: 'John Doe',
        },
        {
          id: 'ATT-001-4',
          name: 'Cost_Breakdown.xlsx',
          type: 'application/vnd.ms-excel',
          size: 128000,
          uploadedAt: '2026-02-18T10:38:00',
          uploadedBy: 'John Doe',
        },
      ],
      lineItems: [
        {
          description: 'Cloud Migration Planning & Assessment',
          quantity: 1,
          unitPrice: 45000,
          total: 45000,
        },
        {
          description: 'Infrastructure Migration Services',
          quantity: 1,
          unitPrice: 180000,
          total: 180000,
        },
        {
          description: 'Post-Migration Support (6 months)',
          quantity: 6,
          unitPrice: 10000,
          total: 60000,
        },
      ],
      performanceRating: 4.5,
      vendorStatus: 'Existing',
    },
    {
      vendorId: 'VEN-002',
      vendorName: 'Azure Global Partners',
      quoteNumber: 'AZ-2026-0789',
      totalAmount: 320000,
      taxes: 32000,
      submissionDate: '2026-02-20',
      deliveryTimeline: '120 days',
      warranty: '36 months',
      paymentTerms: 'Net 45',
      complianceStatus: 'Missing Docs',
      aiSummary:
        'Higher cost but longer warranty. Azure-focused with strong enterprise credentials. Missing compliance certifications. Extended timeline may impact project schedule.',
      attachments: [
        {
          id: 'ATT-002-1',
          name: 'Azure_Proposal_2026.pdf',
          type: 'application/pdf',
          size: 3145000,
          uploadedAt: '2026-02-20T14:15:00',
          uploadedBy: 'Jane Smith',
        },
        {
          id: 'ATT-002-2',
          name: 'Company_Profile.pdf',
          type: 'application/pdf',
          size: 789000,
          uploadedAt: '2026-02-20T14:18:00',
          uploadedBy: 'Jane Smith',
        },
      ],
      lineItems: [
        {
          description: 'Azure Assessment & Strategy',
          quantity: 1,
          unitPrice: 50000,
          total: 50000,
        },
        {
          description: 'Full Infrastructure Migration',
          quantity: 1,
          unitPrice: 200000,
          total: 200000,
        },
        {
          description: 'Managed Services (12 months)',
          quantity: 12,
          unitPrice: 5833,
          total: 70000,
        },
      ],
      performanceRating: 3.8,
      vendorStatus: 'New',
    },
    {
      vendorId: 'VEN-003',
      vendorName: 'MultiCloud Dynamics',
      quoteNumber: 'MCD-456-2026',
      totalAmount: 295000,
      taxes: 29500,
      submissionDate: '2026-02-19',
      deliveryTimeline: '100 days',
      warranty: '24 months',
      paymentTerms: 'Net 30',
      complianceStatus: 'Complete',
      aiSummary:
        'Multi-cloud expertise across AWS, Azure, and GCP. Balanced pricing with hybrid cloud capabilities. Strong technical team with Fortune 500 references.',
      attachments: [
        {
          id: 'ATT-003-1',
          name: 'MultiCloud_Dynamics_Quote.pdf',
          type: 'application/pdf',
          size: 1987000,
          uploadedAt: '2026-02-19T09:45:00',
          uploadedBy: 'Alice Johnson',
        },
        {
          id: 'ATT-003-2',
          name: 'SOC2_Compliance_Report.pdf',
          type: 'application/pdf',
          size: 645000,
          uploadedAt: '2026-02-19T09:48:00',
          uploadedBy: 'Alice Johnson',
        },
        {
          id: 'ATT-003-3',
          name: 'Client_References.docx',
          type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          size: 256000,
          uploadedAt: '2026-02-19T09:50:00',
          uploadedBy: 'Alice Johnson',
        },
        {
          id: 'ATT-003-4',
          name: 'Migration_Roadmap.png',
          type: 'image/png',
          size: 892000,
          uploadedAt: '2026-02-19T09:52:00',
          uploadedBy: 'Alice Johnson',
        },
        {
          id: 'ATT-003-5',
          name: 'Service_Level_Agreement.pdf',
          type: 'application/pdf',
          size: 434000,
          uploadedAt: '2026-02-19T09:55:00',
          uploadedBy: 'Alice Johnson',
        },
      ],
      lineItems: [
        {
          description: 'Multi-Cloud Architecture Design',
          quantity: 1,
          unitPrice: 55000,
          total: 55000,
        },
        {
          description: 'Migration Execution',
          quantity: 1,
          unitPrice: 190000,
          total: 190000,
        },
        {
          description: 'Optimization & Support',
          quantity: 1,
          unitPrice: 50000,
          total: 50000,
        },
      ],
      performanceRating: 4.2,
      vendorStatus: 'Existing',
    },
  ];

  // Get compliance icon
  const getComplianceIcon = (status: string) => {
    switch (status) {
      case 'Complete':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'Missing Docs':
        return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
      case 'Needs Review':
        return <XCircle className="w-5 h-5 text-red-600" />;
      default:
        return null;
    }
  };

  // Get compliance badge class
  const getComplianceBadgeClass = (status: string) => {
    switch (status) {
      case 'Complete':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'Missing Docs':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'Needs Review':
        return 'bg-red-100 text-red-700 border-red-200';
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

  // Find lowest price
  const lowestPrice = Math.min(...submissions.map((s) => s.totalAmount));

  // Handle award
  const handleAward = () => {
    if (!selectedVendor || !selectionReason) {
      alert('Please select a vendor and provide a reason for selection');
      return;
    }
    
    // Find the selected vendor submission
    const selectedSubmission = submissions.find(s => s.vendorId === selectedVendor);
    
    if (selectedSubmission) {
      // Simulate vendor engagement creation
      const vendorEngagementId = 'VE-' + Math.floor(Math.random() * 9000 + 1000).toString().padStart(4, '0');
      
      alert(
        `✅ Work Order ${workOrder.id} has been awarded!\n\n` +
        `Vendor: ${selectedSubmission.vendorName}\n` +
        `Award Amount: ${formatCurrency(selectedSubmission.totalAmount)}\n\n` +
        `🎯 Vendor Engagement Created: ${vendorEngagementId}\n\n` +
        `Actions Completed:\n` +
        `• Work Order status → Awarded\n` +
        `• Vendor Engagement auto-created\n` +
        `• Engagement linked to Work Order and Vendor\n` +
        `• Award decision logged for audit\n\n` +
        `View the new Vendor Engagement in the Vendor Engagements section.`
      );
      
      // Navigate to vendor engagements
      setTimeout(() => {
        router.push('/engagements');
      }, 500);
    }
  };

  // Open attachments drawer
  const openAttachmentsDrawer = (vendorName: string, files: FileAttachment[]) => {
    setAttachmentsDrawer({ isOpen: true, vendorName, files });
  };

  // Close attachments drawer
  const closeAttachmentsDrawer = () => {
    setAttachmentsDrawer({ isOpen: false, vendorName: '', files: [] });
  };

  // Get file icon based on type
  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) {
      return <FileImage className="w-5 h-5 text-blue-600" />;
    } else if (fileType.includes('spreadsheet') || fileType.includes('excel')) {
      return <FileSpreadsheet className="w-5 h-5 text-green-600" />;
    } else if (fileType.includes('pdf')) {
      return <FileText className="w-5 h-5 text-red-600" />;
    } else {
      return <File className="w-5 h-5 text-gray-600" />;
    }
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

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <button
        onClick={() => router.push('/rfqs')}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span className="text-sm font-medium">Back to Work Orders</span>
      </button>

      {/* Work Order Summary Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-start justify-between mb-6">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-semibold text-gray-900">
                {workOrder.id}
              </h1>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700 border border-blue-200">
                {workOrder.status}
              </span>
            </div>
            <h2 className="text-lg text-gray-700 mb-4">{workOrder.title}</h2>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-right">
              <p className="text-xs text-gray-500 uppercase tracking-wide">
                Submissions
              </p>
              <p className="text-2xl font-semibold text-gray-900">
                {workOrder.submissionCount}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">
              Linked Engagement
            </p>
            <Link
              href="/engagements"
              className="text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline"
            >
              {workOrder.engagementId} - {workOrder.engagementTitle}
            </Link>
            <p className="text-sm text-gray-600 mt-2">
              {workOrder.engagementDescription}
            </p>
          </div>
          <div className="space-y-4">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">
                Submission Deadline
              </p>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-400" />
                <span className="text-sm font-medium text-gray-900">
                  {formatDate(workOrder.deadline)}
                </span>
              </div>
            </div>
            {workOrder.notes && (
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">
                  Notes
                </p>
                <p className="text-sm text-gray-600">{workOrder.notes}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* View Toggle */}
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold text-gray-900">
          Vendor Submissions
        </h3>
        <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-lg">
          <button
            onClick={() => setViewMode('table')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              viewMode === 'table'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Table View
          </button>
          <button
            onClick={() => setViewMode('comparison')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              viewMode === 'comparison'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Comparison View
          </button>
        </div>
      </div>

      {/* Table View */}
      {viewMode === 'table' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Vendor
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Quote Total
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Taxes
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Submission Date
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Compliance Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Attachments
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {submissions.map((submission) => (
                  <tr
                    key={submission.vendorId}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {submission.vendorName}
                        </p>
                        <p className="text-xs text-gray-500">
                          {submission.quoteNumber}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-gray-900">
                          {formatCurrency(submission.totalAmount)}
                        </span>
                        {submission.totalAmount === lowestPrice && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700">
                            <TrendingDown className="w-3 h-3 mr-1" />
                            Lowest
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-600">
                        {formatCurrency(submission.taxes)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-600">
                        {formatDate(submission.submissionDate)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {getComplianceIcon(submission.complianceStatus)}
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${getComplianceBadgeClass(
                            submission.complianceStatus
                          )}`}
                        >
                          {submission.complianceStatus}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => openAttachmentsDrawer(submission.vendorName, submission.attachments)}
                        className="relative flex items-center gap-1.5 p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <Paperclip className="w-5 h-5" />
                        <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold">
                          {submission.attachments.length}
                        </span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Comparison View */}
      {viewMode === 'comparison' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider sticky left-0 bg-gray-50 z-10">
                    Attributes
                  </th>
                  {submissions.map((submission) => (
                    <th
                      key={submission.vendorId}
                      className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider min-w-[250px]"
                    >
                      {submission.vendorName}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {/* Quote Number */}
                <tr className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900 sticky left-0 bg-white z-10">
                    Quote Number
                  </td>
                  {submissions.map((submission) => (
                    <td
                      key={submission.vendorId}
                      className="px-6 py-4 text-sm text-gray-600"
                    >
                      {submission.quoteNumber}
                    </td>
                  ))}
                </tr>

                {/* Total Amount */}
                <tr className="hover:bg-gray-50 bg-blue-50">
                  <td className="px-6 py-4 text-sm font-semibold text-gray-900 sticky left-0 bg-blue-50 z-10">
                    Total Amount
                  </td>
                  {submissions.map((submission) => (
                    <td
                      key={submission.vendorId}
                      className="px-6 py-4 text-sm font-semibold text-gray-900"
                    >
                      <div className="flex items-center gap-2">
                        {formatCurrency(submission.totalAmount)}
                        {submission.totalAmount === lowestPrice && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700">
                            <TrendingDown className="w-3 h-3 mr-1" />
                            Lowest
                          </span>
                        )}
                      </div>
                    </td>
                  ))}
                </tr>

                {/* Taxes */}
                <tr className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900 sticky left-0 bg-white z-10">
                    Taxes
                  </td>
                  {submissions.map((submission) => (
                    <td
                      key={submission.vendorId}
                      className="px-6 py-4 text-sm text-gray-600"
                    >
                      {formatCurrency(submission.taxes)}
                    </td>
                  ))}
                </tr>

                {/* Delivery Timeline */}
                <tr className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900 sticky left-0 bg-white z-10">
                    Delivery Timeline
                  </td>
                  {submissions.map((submission) => (
                    <td
                      key={submission.vendorId}
                      className="px-6 py-4 text-sm text-gray-600"
                    >
                      {submission.deliveryTimeline}
                    </td>
                  ))}
                </tr>

                {/* Warranty */}
                <tr className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900 sticky left-0 bg-white z-10">
                    Warranty
                  </td>
                  {submissions.map((submission) => (
                    <td
                      key={submission.vendorId}
                      className="px-6 py-4 text-sm text-gray-600"
                    >
                      {submission.warranty}
                    </td>
                  ))}
                </tr>

                {/* Payment Terms */}
                <tr className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900 sticky left-0 bg-white z-10">
                    Payment Terms
                  </td>
                  {submissions.map((submission) => (
                    <td
                      key={submission.vendorId}
                      className="px-6 py-4 text-sm text-gray-600"
                    >
                      {submission.paymentTerms}
                    </td>
                  ))}
                </tr>

                {/* Compliance Status */}
                <tr className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900 sticky left-0 bg-white z-10">
                    Compliance Status
                  </td>
                  {submissions.map((submission) => (
                    <td key={submission.vendorId} className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {getComplianceIcon(submission.complianceStatus)}
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${getComplianceBadgeClass(
                            submission.complianceStatus
                          )}`}
                        >
                          {submission.complianceStatus}
                        </span>
                      </div>
                    </td>
                  ))}
                </tr>

                {/* Performance Rating */}
                <tr className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900 sticky left-0 bg-white z-10">
                    <div className="flex items-center gap-2">
                      <Star className="w-4 h-4 text-gray-600" />
                      Performance Rating
                    </div>
                  </td>
                  {submissions.map((submission) => (
                    <td key={submission.vendorId} className="px-6 py-4">
                      <PerformanceRating
                        vendorId={submission.vendorId}
                        vendorName={submission.vendorName}
                        rating={submission.performanceRating}
                        status={
                          submission.vendorStatus === 'New'
                            ? 'NewVendor'
                            : submission.performanceRating
                            ? 'Rated'
                            : 'NotRated'
                        }
                        showProfileLink={true}
                      />
                    </td>
                  ))}
                </tr>

                {/* AI Summary */}
                <tr className="hover:bg-gray-50 bg-purple-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900 sticky left-0 bg-purple-50 z-10">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-purple-600" />
                      AI Summary
                    </div>
                  </td>
                  {submissions.map((submission) => (
                    <td
                      key={submission.vendorId}
                      className="px-6 py-4 text-sm text-gray-700 leading-relaxed"
                    >
                      {submission.aiSummary}
                    </td>
                  ))}
                </tr>

                {/* Attachments */}
                <tr className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900 sticky left-0 bg-white z-10">
                    <div className="flex items-center gap-2">
                      <Paperclip className="w-4 h-4 text-gray-600" />
                      Attachments
                    </div>
                  </td>
                  {submissions.map((submission) => (
                    <td key={submission.vendorId} className="px-6 py-4">
                      <button
                        onClick={() => openAttachmentsDrawer(submission.vendorName, submission.attachments)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-700 bg-gray-100 hover:bg-blue-50 hover:text-blue-700 rounded-lg transition-colors"
                      >
                        <Paperclip className="w-4 h-4" />
                        <span className="font-medium">{submission.attachments.length} files</span>
                      </button>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Award Decision Panel */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-6">
          <Award className="w-6 h-6 text-indigo-600" />
          <h3 className="text-xl font-semibold text-gray-900">
            Award Decision
          </h3>
        </div>

        <div className="space-y-4">
          {/* Selected Vendor */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Selected Vendor <span className="text-red-500">*</span>
            </label>
            <select
              value={selectedVendor}
              onChange={(e) => setSelectedVendor(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="">Select winning vendor...</option>
              {submissions.map((submission) => (
                <option key={submission.vendorId} value={submission.vendorId}>
                  {submission.vendorName} - {formatCurrency(submission.totalAmount)}
                </option>
              ))}
            </select>
          </div>

          {/* Reason for Selection */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Reason for Selection <span className="text-red-500">*</span>
            </label>
            <textarea
              value={selectionReason}
              onChange={(e) => setSelectionReason(e.target.value)}
              placeholder="Provide detailed reasoning for vendor selection (required for audit trail)..."
              rows={4}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
            />
          </div>

          {/* Rejection Notes */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Rejection Notes (Optional)
            </label>
            <textarea
              value={rejectionNotes}
              onChange={(e) => setRejectionNotes(e.target.value)}
              placeholder="Optional notes for rejected vendors..."
              rows={3}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
            />
          </div>

          {/* Governance Notice */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-amber-900">
                  Governance Requirements
                </p>
                <ul className="text-xs text-amber-700 mt-2 space-y-1 list-disc list-inside">
                  <li>Award decision is permanent and logged for audit</li>
                  <li>Reason for selection is mandatory</li>
                  <li>
                    Work Order status will change to "Awarded" and Engagement will be
                    linked to selected vendor
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              onClick={() => router.push('/rfqs')}
              className="px-5 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
            >
              Close Work Order
            </button>
            <button
              onClick={handleAward}
              disabled={!selectedVendor || !selectionReason}
              className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-semibold shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Award className="w-4 h-4" />
              Award Vendor
            </button>
          </div>
        </div>
      </div>

      {/* Attachments Drawer */}
      {attachmentsDrawer.isOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Overlay */}
          <div 
            className="absolute inset-0 bg-gray-900/35 backdrop-blur-sm transition-opacity"
            onClick={closeAttachmentsDrawer}
          />
          
          {/* Drawer Panel */}
          <div className="absolute inset-y-0 right-0 max-w-full flex">
            <div className="w-screen max-w-lg">
              <div className="h-full flex flex-col bg-white shadow-2xl">
                {/* Header */}
                <div className="px-6 py-5 bg-gray-50 border-b border-gray-200">
                  <div className="flex items-start justify-between">
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900">
                        Vendor Attachments
                      </h2>
                      <p className="text-sm text-gray-600 mt-1">
                        {attachmentsDrawer.vendorName}
                      </p>
                    </div>
                    <button
                      onClick={closeAttachmentsDrawer}
                      className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto px-6 py-6">
                  <div className="space-y-3">
                    {attachmentsDrawer.files.map((file) => (
                      <div
                        key={file.id}
                        className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all"
                      >
                        {/* File Icon */}
                        <div className="flex-shrink-0 mt-1">
                          {getFileIcon(file.type)}
                        </div>

                        {/* File Info */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate" title={file.name}>
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
                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-600">
                      {attachmentsDrawer.files.length} {attachmentsDrawer.files.length === 1 ? 'file' : 'files'} total
                    </p>
                    <button
                      onClick={closeAttachmentsDrawer}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}