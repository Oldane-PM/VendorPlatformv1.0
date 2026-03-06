import { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import {
  ArrowLeft,
  Building2,
  DollarSign,
  Calendar,
  User,
  FileText,
  AlertCircle,
  CheckCircle2,
  Clock,
  Receipt,
  Download,
  Shield,
  TrendingUp,
  Activity,
  Target,
  BarChart3,
  Pencil,
  Check,
  X,
  Plus,
  Upload,
  Paperclip,
  AlertTriangle,
  Sparkles,
  Edit2,
  Trash2,
  Save,
  CheckCircle,
  Loader2,
} from 'lucide-react';
import { useEngagementInvoiceUploadLink } from '@/lib/hooks/useEngagementInvoiceUploadLink';
import { useVendorEngagementDetail } from '@/lib/hooks/useVendorEngagementDetail';

interface Milestone {
  id: string;
  name: string;
  status:
    | 'Pending'
    | 'In Progress'
    | 'Submitted'
    | 'Approved'
    | 'Paid'
    | 'Not Started'
    | 'Completed';
  dueDate: string;
  amount: number;
}

interface Invoice {
  id: string;
  amount: number;
  status: 'Draft' | 'Submitted' | 'Approved' | 'Paid';
  createdDate: string;
  submitted_date?: string | null;
  description: string;
  files?: Array<{ id: string; file_name: string; storage_path: string }>;
}

export function VendorEngagementDetail() {
  const router = useRouter();
  const id = router.query.engagementId as string | undefined;

  const { detail, isLoading, error } = useVendorEngagementDetail(id);

  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [showRequestInvoiceModal, setShowRequestInvoiceModal] = useState(false);
  const [reqInvoiceExpiry, setReqInvoiceExpiry] = useState<number>(72);
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const { createLink, isLoading: isCreatingLink } =
    useEngagementInvoiceUploadLink();
  const [invoiceType, setInvoiceType] = useState<
    'Full Payment' | 'Partial Payment'
  >('Partial Payment');
  const [invoiceAmount, setInvoiceAmount] = useState('');
  const [invoiceDescription, setInvoiceDescription] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [editingMilestone, setEditingMilestone] = useState<string | null>(null);
  const [milestoneFormData, setMilestoneFormData] = useState({
    name: '',
    dueDate: '',
    amount: '',
    status: 'Pending' as Milestone['status'],
  });
  const [showAddMilestone, setShowAddMilestone] = useState(false);

  // Map live data to the component's expected shape
  const vendorEngagement = detail
    ? (() => {
        const totalPaid = detail.invoices
          .filter((inv) => inv.status.toLowerCase() === 'paid')
          .reduce((sum, inv) => sum + inv.amount, 0);
        return {
          vendorEngagementId: detail.vendor_engagement_id,
          engagementId: detail.engagement_id,
          workOrderId: detail.work_order_id,
          vendorName: detail.vendor_name,
          projectTitle: detail.project_title,
          awardAmount: detail.award_amount,
          totalPaidSoFar: totalPaid,
          remainingBalance: detail.award_amount - totalPaid,
          status:
            detail.status.charAt(0).toUpperCase() + detail.status.slice(1),
          startDate: detail.start_date ?? new Date().toISOString(),
          endDate: detail.end_date ?? undefined,
          department: detail.department ?? 'Unassigned',
          awardedBy: detail.awarded_by ?? 'System',
          decisionReason: detail.decision_reason ?? '',
          submissions: detail.submissions || [],
          milestones: detail.milestones.map((m) => ({
            id: m.id,
            name: m.activity,
            status: m.status as Milestone['status'],
            dueDate: m.due_date,
            amount: m.amount,
          })),
          invoices: detail.invoices.map((inv) => ({
            id: inv.invoice_number,
            amount: inv.amount,
            status: (inv.status.charAt(0).toUpperCase() +
              inv.status.slice(1)) as Invoice['status'],
            createdDate: inv.created_at,
            submitted_date: inv.submitted_date,
            description: `Invoice ${inv.invoice_number}`,
            files: inv.files,
          })),
        };
      })()
    : null;

  // Calculate milestone allocation (fallback to 0 if milestones don't exist yet)
  const totalMilestoneAllocation =
    vendorEngagement?.milestones?.reduce(
      (sum: number, m: any) => sum + m.amount,
      0
    ) ?? 0;
  const allocationMatch =
    totalMilestoneAllocation === (vendorEngagement?.awardAmount ?? 0);

  // Calculate payment progress
  const paymentProgress = vendorEngagement
    ? (vendorEngagement.totalPaidSoFar / vendorEngagement.awardAmount) * 100
    : 0;

  // Handle edit milestone
  const handleEditMilestone = (milestone: any) => {
    setEditingMilestone(milestone.id);
    setMilestoneFormData({
      name: milestone.name,
      dueDate: milestone.dueDate,
      amount: milestone.amount.toString(),
      status: milestone.status,
    });
  };

  // Handle save milestone
  const handleSaveMilestone = () => {
    // In real app, this would save to backend
    alert('Milestone updated successfully!');
    setEditingMilestone(null);
  };

  // Handle cancel edit
  const handleCancelEdit = () => {
    setEditingMilestone(null);
    setMilestoneFormData({
      name: '',
      dueDate: '',
      amount: '',
      status: 'Pending',
    });
  };

  // Handle add milestone
  const handleAddMilestone = () => {
    // In real app, this would save to backend
    alert('Milestone added successfully!');
    setShowAddMilestone(false);
    setMilestoneFormData({
      name: '',
      dueDate: '',
      amount: '',
      status: 'Pending',
    });
  };

  // Handle delete milestone
  const handleDeleteMilestone = (milestoneId: string) => {
    if (confirm('Are you sure you want to delete this milestone?')) {
      alert('Milestone deleted successfully!');
    }
  };

  // Get invoice status badge class
  const getInvoiceStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'Draft':
        return 'bg-gray-100 text-gray-700 border-gray-200';
      case 'Submitted':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'Approved':
        return 'bg-teal-100 text-teal-700 border-teal-200';
      case 'Paid':
        return 'bg-green-100 text-green-700 border-green-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  // Handle file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setUploadedFiles([...uploadedFiles, ...Array.from(e.target.files)]);
    }
  };

  // Remove uploaded file
  const removeFile = (index: number) => {
    setUploadedFiles(uploadedFiles.filter((_, i) => i !== index));
  };

  // Handle invoice generation
  const handleGenerateInvoice = () => {
    if (!vendorEngagement) return;
    const amount = parseFloat(invoiceAmount);

    if (!amount || amount <= 0) {
      alert('Please enter a valid invoice amount');
      return;
    }

    if (amount > vendorEngagement.remainingBalance) {
      alert(
        `Invoice amount cannot exceed remaining balance of ${formatCurrency(vendorEngagement.remainingBalance)}`
      );
      return;
    }

    if (!invoiceDescription) {
      alert('Please provide an invoice description');
      return;
    }

    // Simulate invoice creation
    const newInvoiceId =
      'INV-' +
      Math.floor(Math.random() * 9000 + 1000)
        .toString()
        .padStart(4, '0');

    alert(
      `✅ Invoice Generated Successfully!\\n\\n` +
        `Invoice ID: ${newInvoiceId}\\n` +
        `Type: ${invoiceType}\\n` +
        `Amount: ${formatCurrency(amount)}\\n` +
        `Vendor Engagement: ${vendorEngagement.vendorEngagementId}\\n\\n` +
        `The invoice has been created and is ready for submission.`
    );

    setShowInvoiceModal(false);
    setInvoiceAmount('');
    setInvoiceDescription('');
    setUploadedFiles([]);

    // Navigate to invoices page
    setTimeout(() => {
      router.push('/invoices');
    }, 500);
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

  // Status badge styling
  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'Active':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'In Progress':
        return 'bg-indigo-100 text-indigo-700 border-indigo-200';
      case 'On Hold':
        return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'Completed':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'Terminated':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'Not Started':
        return 'bg-gray-100 text-gray-700 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-white rounded-xl shadow-sm border border-gray-200 min-h-[400px]">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin mb-4" />
        <p className="text-gray-500 font-medium">
          Loading vendor engagement...
        </p>
      </div>
    );
  }

  if (error || !vendorEngagement) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 flex items-start gap-4">
        <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
        <div>
          <h3 className="text-red-800 font-medium">
            Error loading vendor engagement
          </h3>
          <p className="text-red-600 text-sm mt-1">
            {error ?? 'Vendor engagement not found.'}
          </p>
          <button
            onClick={() => router.push('/vendor-engagements')}
            className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-red-700 hover:text-red-800"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Vendor Engagements
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <button
        onClick={() => router.push('/vendor-engagements')}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span className="text-sm font-medium">Back to Vendor Engagements</span>
      </button>

      {/* Header Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-start justify-between mb-6">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-semibold text-gray-900">
                {vendorEngagement.vendorEngagementId}
              </h1>
              <span
                className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${getStatusBadgeClass(
                  vendorEngagement.status
                )}`}
              >
                {vendorEngagement.status}
              </span>
            </div>
            <h2 className="text-lg text-gray-700 mb-4">
              {vendorEngagement.projectTitle}
            </h2>
          </div>
          <button
            onClick={() => {
              setGeneratedLink(null);
              setShowRequestInvoiceModal(true);
            }}
            disabled={
              vendorEngagement.status === 'Terminated' ||
              vendorEngagement.remainingBalance === 0
            }
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-semibold shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Sparkles className="w-5 h-5" />
            Request Vendor Invoice
          </button>
        </div>

        {/* Key Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">
              Award Amount
            </p>
            <p className="text-2xl font-semibold text-gray-900">
              {formatCurrency(vendorEngagement.awardAmount)}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">
              Total Paid
            </p>
            <p className="text-2xl font-semibold text-green-700">
              {formatCurrency(vendorEngagement.totalPaidSoFar)}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">
              Remaining Balance
            </p>
            <p className="text-2xl font-semibold text-blue-700">
              {formatCurrency(vendorEngagement.remainingBalance)}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">
              Payment Progress
            </p>
            <p className="text-2xl font-semibold text-gray-900">
              {paymentProgress.toFixed(0)}%
            </p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-6">
          <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
            <div
              className="bg-primary h-full rounded-full transition-all duration-500"
              style={{ width: `${paymentProgress}%` }}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Vendor & Engagement Info */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Engagement Details
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                  Vendor
                </p>
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-gray-400" />
                  <span className="text-sm font-medium text-gray-900">
                    {vendorEngagement.vendorName}
                  </span>
                </div>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                  Department
                </p>
                <span className="text-sm font-medium text-gray-900">
                  {vendorEngagement.department}
                </span>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                  Engagement ID
                </p>
                <Link
                  href="/engagements"
                  className="text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline"
                >
                  {vendorEngagement.engagementId}
                </Link>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                  Work Order ID
                </p>
                <Link
                  href={`/rfqs/${vendorEngagement.workOrderId}`}
                  className="text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline"
                >
                  {vendorEngagement.workOrderId}
                </Link>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                  Start Date
                </p>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <span className="text-sm font-medium text-gray-900">
                    {formatDate(vendorEngagement.startDate)}
                  </span>
                </div>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                  End Date
                </p>
                <span className="text-sm text-gray-600">
                  {vendorEngagement.endDate
                    ? formatDate(vendorEngagement.endDate)
                    : 'Ongoing'}
                </span>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-200">
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">
                Award Decision Reason
              </p>
              <p className="text-sm text-gray-700">
                {vendorEngagement.decisionReason}
              </p>
            </div>
          </div>

          {/* Milestones */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Project Milestones
            </h2>
            <div className="space-y-3">
              {vendorEngagement.milestones?.map((milestone: any) => (
                <div
                  key={milestone.id}
                  className="flex items-start justify-between p-4 bg-gray-50 rounded-lg border border-gray-200"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-sm font-semibold text-gray-900">
                        {milestone.name}
                      </h3>
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${getStatusBadgeClass(
                          milestone.status
                        )}`}
                      >
                        {milestone.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-gray-600">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        <span>Due: {formatDate(milestone.dueDate)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <DollarSign className="w-3 h-3" />
                        <span>{formatCurrency(milestone.amount)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleEditMilestone(milestone)}
                      className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteMilestone(milestone.id)}
                      className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
              {showAddMilestone && (
                <div className="flex items-start justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-sm font-semibold text-gray-900">
                        New Milestone
                      </h3>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-gray-600">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        <input
                          type="date"
                          value={milestoneFormData.dueDate}
                          onChange={(e) =>
                            setMilestoneFormData({
                              ...milestoneFormData,
                              dueDate: e.target.value,
                            })
                          }
                          className="w-24 px-2 py-1 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                        />
                      </div>
                      <div className="flex items-center gap-1">
                        <DollarSign className="w-3 h-3" />
                        <input
                          type="number"
                          value={milestoneFormData.amount}
                          onChange={(e) =>
                            setMilestoneFormData({
                              ...milestoneFormData,
                              amount: e.target.value,
                            })
                          }
                          placeholder="Amount"
                          className="w-24 px-2 py-1 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                        />
                      </div>
                    </div>
                    <input
                      type="text"
                      value={milestoneFormData.name}
                      onChange={(e) =>
                        setMilestoneFormData({
                          ...milestoneFormData,
                          name: e.target.value,
                        })
                      }
                      placeholder="Milestone Name"
                      className="w-full px-2 py-1 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleAddMilestone}
                      className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                    >
                      <Save className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setShowAddMilestone(false)}
                      className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
              {!showAddMilestone && (
                <button
                  onClick={() => setShowAddMilestone(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium w-full"
                >
                  <Plus className="w-4 h-4" />
                  Add New Milestone
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Uploaded Invoices Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                Uploaded Invoices
              </h2>
              <span className="text-xs font-semibold text-gray-600 bg-gray-100 px-2 py-1 rounded-full">
                {vendorEngagement.invoices?.length || 0}
              </span>
            </div>

            <div className="space-y-3">
              {vendorEngagement.invoices?.map((invoice: any) => (
                <div
                  key={invoice.id}
                  className="p-4 bg-gray-50 rounded-lg border border-gray-200"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <Receipt className="w-4 h-4 text-blue-500 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">
                          {invoice.invoice_number || invoice.id}
                        </p>
                        <p className="text-xs text-gray-500">
                          {invoice.submitted_date
                            ? new Date(
                                invoice.submitted_date
                              ).toLocaleDateString()
                            : '—'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-sm font-semibold text-gray-900">
                        {formatCurrency(invoice.amount)}
                      </span>
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${getInvoiceStatusBadgeClass(
                          invoice.status
                        )}`}
                      >
                        {invoice.status}
                      </span>
                    </div>
                  </div>

                  {/* Invoice Files */}
                  {invoice.files && invoice.files.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-gray-200 space-y-1">
                      {invoice.files.map((file: any) => (
                        <div
                          key={file.id}
                          className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-white transition-colors"
                        >
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <Paperclip className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                            <span className="text-xs text-gray-700 truncate">
                              {file.file_name}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <a
                              href={`/api/documents/download?path=${encodeURIComponent(file.storage_path)}&bucket=vendor_invoices`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1 text-blue-600 hover:text-blue-800 transition-colors"
                              title="View / Download"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Download className="w-3.5 h-3.5" />
                            </a>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {(!invoice.files || invoice.files.length === 0) && (
                    <p className="text-xs text-gray-400 mt-1 italic">
                      No files attached
                    </p>
                  )}
                </div>
              ))}
            </div>

            {(!vendorEngagement.invoices ||
              vendorEngagement.invoices.length === 0) && (
              <div className="text-center py-6">
                <FileText className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500">
                  No invoices uploaded yet
                </p>
              </div>
            )}

            <Link
              href="/invoices"
              className="block w-full mt-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors text-center"
            >
              View All Invoices
            </Link>
          </div>

          {/* Payment Summary */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Payment Summary
            </h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Award Amount</span>
                <span className="text-sm font-semibold text-gray-900">
                  {formatCurrency(vendorEngagement.awardAmount)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Total Paid</span>
                <span className="text-sm font-semibold text-green-700">
                  {formatCurrency(vendorEngagement.totalPaidSoFar)}
                </span>
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                <span className="text-sm font-semibold text-gray-900">
                  Remaining Balance
                </span>
                <span className="text-lg font-bold text-blue-700">
                  {formatCurrency(vendorEngagement.remainingBalance)}
                </span>
              </div>
            </div>

            {/* Milestone Allocation Warning */}
            <div
              className={`mt-4 p-3 rounded-lg border ${
                allocationMatch
                  ? 'bg-green-50 border-green-200'
                  : 'bg-amber-50 border-amber-200'
              }`}
            >
              <div className="flex items-start gap-2">
                {allocationMatch ? (
                  <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                )}
                <div className="flex-1 text-xs">
                  <p
                    className={`font-semibold mb-1 ${
                      allocationMatch ? 'text-green-900' : 'text-amber-900'
                    }`}
                  >
                    Milestone Allocation
                  </p>
                  <p className="text-gray-600">
                    Total: {formatCurrency(totalMilestoneAllocation)}
                  </p>
                  {allocationMatch ? (
                    <p className="text-green-700 font-medium mt-1">
                      ✓ Balanced
                    </p>
                  ) : (
                    <p className="text-amber-700 font-medium mt-1">
                      ⚠{' '}
                      {totalMilestoneAllocation > vendorEngagement.awardAmount
                        ? 'Over'
                        : 'Under'}{' '}
                      allocated
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Quick Actions
            </h2>
            <div className="space-y-2">
              <Link
                href="/invoices"
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium w-full"
              >
                <FileText className="w-4 h-4" />
                View All Invoices
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-4 right-4 z-50 animate-fade-in-up">
          <div className="bg-gray-900 text-white px-6 py-3 rounded-xl shadow-lg flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-green-400" />
            <p className="text-sm font-medium">{toastMessage}</p>
          </div>
        </div>
      )}

      {/* Request Invoices Modal */}
      {showRequestInvoiceModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div
            className="fixed inset-0 bg-gray-900/35 backdrop-blur-sm transition-opacity"
            onClick={() => !isCreatingLink && setShowRequestInvoiceModal(false)}
          />
          <div className="flex min-h-screen items-center justify-center p-4">
            <div className="relative bg-white rounded-xl shadow-2xl max-w-lg w-full">
              <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">
                  Request Vendor Invoice
                </h2>
                <button
                  onClick={() => setShowRequestInvoiceModal(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="px-6 py-6 space-y-6">
                {!generatedLink ? (
                  <>
                    <p className="text-sm text-gray-600">
                      Generate a secure, token-gated link for the vendor to
                      upload their invoice directly against this engagement.
                    </p>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Link Expiry
                      </label>
                      <select
                        value={reqInvoiceExpiry}
                        onChange={(e) =>
                          setReqInvoiceExpiry(Number(e.target.value))
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                      >
                        <option value={24}>24 Hours</option>
                        <option value={72}>3 Days</option>
                        <option value={168}>7 Days</option>
                        <option value={336}>14 Days</option>
                      </select>
                    </div>
                  </>
                ) : (
                  <div className="space-y-4 animate-fade-in">
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex gap-3">
                      <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-semibold text-green-900">
                          Upload Link Generated
                        </p>
                        <p className="text-xs text-green-700 mt-1">
                          Share this secure link with the vendor. Do not share
                          it publicly.
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <input
                        type="text"
                        readOnly
                        value={generatedLink}
                        className="flex-1 px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm font-mono text-gray-600 select-all focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                        onClick={(e) => (e.target as HTMLInputElement).select()}
                      />
                      <button
                        onClick={async () => {
                          await navigator.clipboard.writeText(generatedLink);
                          setToastMessage('Link copied to clipboard!');
                          setTimeout(() => setToastMessage(null), 3000);
                        }}
                        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
                      >
                        Copy
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="border-t border-gray-200 px-6 py-4 bg-gray-50 rounded-b-xl flex justify-end gap-3">
                <button
                  onClick={() => setShowRequestInvoiceModal(false)}
                  className="px-5 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
                >
                  {generatedLink ? 'Close' : 'Cancel'}
                </button>
                {!generatedLink && (
                  <button
                    onClick={async () => {
                      if (!detail?.engagement_uuid || !detail?.vendor_id) {
                        setToastMessage('Missing engagement or vendor data.');
                        return;
                      }
                      const result = await createLink(
                        detail.engagement_uuid,
                        detail.vendor_id,
                        {
                          expiresInHours: reqInvoiceExpiry,
                        }
                      );
                      if (result?.data?.portalUrl) {
                        setGeneratedLink(result.data.portalUrl);
                        setToastMessage('Link generated successfully!');
                        setTimeout(() => setToastMessage(null), 3000);
                      }
                    }}
                    disabled={isCreatingLink}
                    className="inline-flex items-center gap-2 px-5 py-2 bg-primary text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-semibold shadow-sm disabled:opacity-50"
                  >
                    {isCreatingLink ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      'Generate Link'
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
