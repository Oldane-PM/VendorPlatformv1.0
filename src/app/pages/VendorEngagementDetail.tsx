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
} from 'lucide-react';
import { UploadVendorInvoiceModal } from '../components/UploadVendorInvoiceModal';

interface Milestone {
  id: string;
  name: string;
  status: 'Pending' | 'In Progress' | 'Submitted' | 'Approved' | 'Paid' | 'Not Started' | 'Completed';
  dueDate: string;
  amount: number;
}

interface Invoice {
  id: string;
  amount: number;
  status: 'Draft' | 'Submitted' | 'Approved' | 'Paid';
  createdDate: string;
  description: string;
}

export function VendorEngagementDetail() {
  const router = useRouter();
  const id = router.query.engagementId as string | undefined;
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [showUploadInvoiceModal, setShowUploadInvoiceModal] = useState(false);
  const [invoiceType, setInvoiceType] = useState<'Full Payment' | 'Partial Payment'>('Partial Payment');
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

  // Mock vendor engagement data
  const vendorEngagement = {
    vendorEngagementId: 'VE-0001',
    engagementId: 'ENG-0001',
    workOrderId: 'WO-0001',
    vendorName: 'CloudTech Solutions',
    projectTitle: 'Cloud Infrastructure Modernization',
    awardAmount: 285000,
    totalPaidSoFar: 85000,
    remainingBalance: 200000,
    status: 'Active',
    startDate: '2026-02-20',
    endDate: undefined,
    department: 'IT Operations',
    awardedBy: 'Sarah Johnson',
    decisionReason: 'Strong proposal with proven AWS expertise and competitive pricing',
    milestones: [
      {
        id: 'M1',
        name: 'Planning & Assessment',
        status: 'Paid' as Milestone['status'],
        dueDate: '2026-03-15',
        amount: 45000,
      },
      {
        id: 'M2',
        name: 'Infrastructure Migration',
        status: 'In Progress' as Milestone['status'],
        dueDate: '2026-04-30',
        amount: 180000,
      },
      {
        id: 'M3',
        name: 'Post-Migration Support',
        status: 'Pending' as Milestone['status'],
        dueDate: '2026-10-31',
        amount: 60000,
      },
    ],
    invoices: [
      {
        id: 'INV-0001',
        amount: 45000,
        status: 'Paid' as Invoice['status'],
        createdDate: '2026-03-01',
        description: 'Planning & Assessment Phase',
      },
      {
        id: 'INV-0002',
        amount: 40000,
        status: 'Approved' as Invoice['status'],
        createdDate: '2026-03-15',
        description: 'Initial Infrastructure Setup',
      },
      {
        id: 'INV-0003',
        amount: 35000,
        status: 'Submitted' as Invoice['status'],
        createdDate: '2026-04-01',
        description: 'Database Migration',
      },
      {
        id: 'INV-0004',
        amount: 25000,
        status: 'Draft' as Invoice['status'],
        createdDate: '2026-04-10',
        description: 'Progress Payment - Phase 2',
      },
    ],
  };

  // Calculate milestone allocation
  const totalMilestoneAllocation = vendorEngagement.milestones.reduce((sum, m) => sum + m.amount, 0);
  const allocationMatch = totalMilestoneAllocation === vendorEngagement.awardAmount;

  // Calculate payment progress
  const paymentProgress = (vendorEngagement.totalPaidSoFar / vendorEngagement.awardAmount) * 100;

  // Handle edit milestone
  const handleEditMilestone = (milestone: Milestone) => {
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
    const amount = parseFloat(invoiceAmount);
    
    if (!amount || amount <= 0) {
      alert('Please enter a valid invoice amount');
      return;
    }
    
    if (amount > vendorEngagement.remainingBalance) {
      alert(`Invoice amount cannot exceed remaining balance of ${formatCurrency(vendorEngagement.remainingBalance)}`);
      return;
    }
    
    if (!invoiceDescription) {
      alert('Please provide an invoice description');
      return;
    }
    
    // Simulate invoice creation
    const newInvoiceId = 'INV-' + Math.floor(Math.random() * 9000 + 1000).toString().padStart(4, '0');
    
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

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <button
        onClick={() => router.push('/engagements')}
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
            <h2 className="text-lg text-gray-700 mb-4">{vendorEngagement.projectTitle}</h2>
          </div>
          <button
            onClick={() => setShowUploadInvoiceModal(true)}
            disabled={vendorEngagement.status === 'Terminated' || vendorEngagement.remainingBalance === 0}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-semibold shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Sparkles className="w-5 h-5" />
            Upload Vendor Invoice
          </button>
        </div>

        {/* Key Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Award Amount</p>
            <p className="text-2xl font-semibold text-gray-900">
              {formatCurrency(vendorEngagement.awardAmount)}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Total Paid</p>
            <p className="text-2xl font-semibold text-green-700">
              {formatCurrency(vendorEngagement.totalPaidSoFar)}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Remaining Balance</p>
            <p className="text-2xl font-semibold text-blue-700">
              {formatCurrency(vendorEngagement.remainingBalance)}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Payment Progress</p>
            <p className="text-2xl font-semibold text-gray-900">{paymentProgress.toFixed(0)}%</p>
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
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Engagement Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Vendor</p>
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-gray-400" />
                  <span className="text-sm font-medium text-gray-900">
                    {vendorEngagement.vendorName}
                  </span>
                </div>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Department</p>
                <span className="text-sm font-medium text-gray-900">
                  {vendorEngagement.department}
                </span>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Engagement ID</p>
                <Link
                  href="/engagements"
                  className="text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline"
                >
                  {vendorEngagement.engagementId}
                </Link>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Work Order ID</p>
                <Link
                  href={`/rfqs/${vendorEngagement.workOrderId}`}
                  className="text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline"
                >
                  {vendorEngagement.workOrderId}
                </Link>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Start Date</p>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <span className="text-sm font-medium text-gray-900">
                    {formatDate(vendorEngagement.startDate)}
                  </span>
                </div>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">End Date</p>
                <span className="text-sm text-gray-600">
                  {vendorEngagement.endDate ? formatDate(vendorEngagement.endDate) : 'Ongoing'}
                </span>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-200">
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Award Decision Reason</p>
              <p className="text-sm text-gray-700">{vendorEngagement.decisionReason}</p>
            </div>
          </div>

          {/* Milestones */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Project Milestones</h2>
            <div className="space-y-3">
              {vendorEngagement.milestones.map((milestone) => (
                <div
                  key={milestone.id}
                  className="flex items-start justify-between p-4 bg-gray-50 rounded-lg border border-gray-200"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-sm font-semibold text-gray-900">{milestone.name}</h3>
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
                      <h3 className="text-sm font-semibold text-gray-900">New Milestone</h3>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-gray-600">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        <input
                          type="date"
                          value={milestoneFormData.dueDate}
                          onChange={(e) => setMilestoneFormData({ ...milestoneFormData, dueDate: e.target.value })}
                          className="w-24 px-2 py-1 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                        />
                      </div>
                      <div className="flex items-center gap-1">
                        <DollarSign className="w-3 h-3" />
                        <input
                          type="number"
                          value={milestoneFormData.amount}
                          onChange={(e) => setMilestoneFormData({ ...milestoneFormData, amount: e.target.value })}
                          placeholder="Amount"
                          className="w-24 px-2 py-1 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                        />
                      </div>
                    </div>
                    <input
                      type="text"
                      value={milestoneFormData.name}
                      onChange={(e) => setMilestoneFormData({ ...milestoneFormData, name: e.target.value })}
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
              <h2 className="text-lg font-semibold text-gray-900">Uploaded Invoices</h2>
              <span className="text-xs font-semibold text-gray-600 bg-gray-100 px-2 py-1 rounded-full">
                {vendorEngagement.invoices.length}
              </span>
            </div>
            
            <div className="space-y-2">
              {vendorEngagement.invoices.map((invoice) => (
                <Link
                  key={invoice.id}
                  href={`/invoices/${invoice.id}`}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all group"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <FileText className="w-4 h-4 text-gray-400 group-hover:text-blue-600 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-blue-600 group-hover:text-blue-700">
                        {invoice.id}
                      </p>
                      <p className="text-xs text-gray-500 truncate">{invoice.description}</p>
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
                </Link>
              ))}
            </div>

            {vendorEngagement.invoices.length === 0 && (
              <div className="text-center py-6">
                <FileText className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500">No invoices uploaded yet</p>
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
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Payment Summary</h2>
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
                <span className="text-sm font-semibold text-gray-900">Remaining Balance</span>
                <span className="text-lg font-bold text-blue-700">
                  {formatCurrency(vendorEngagement.remainingBalance)}
                </span>
              </div>
            </div>
            
            {/* Milestone Allocation Warning */}
            <div className={`mt-4 p-3 rounded-lg border ${
              allocationMatch
                ? 'bg-green-50 border-green-200'
                : 'bg-amber-50 border-amber-200'
            }`}>
              <div className="flex items-start gap-2">
                {allocationMatch ? (
                  <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                )}
                <div className="flex-1 text-xs">
                  <p className={`font-semibold mb-1 ${
                    allocationMatch ? 'text-green-900' : 'text-amber-900'
                  }`}>
                    Milestone Allocation
                  </p>
                  <p className="text-gray-600">
                    Total: {formatCurrency(totalMilestoneAllocation)}
                  </p>
                  {allocationMatch ? (
                    <p className="text-green-700 font-medium mt-1">✓ Balanced</p>
                  ) : (
                    <p className="text-amber-700 font-medium mt-1">
                      ⚠ {totalMilestoneAllocation > vendorEngagement.awardAmount ? 'Over' : 'Under'} allocated
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
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

      {/* Invoice Generation Modal */}
      {showInvoiceModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          {/* Overlay */}
          <div
            className="fixed inset-0 bg-gray-900/35 backdrop-blur-sm transition-opacity"
            onClick={() => setShowInvoiceModal(false)}
          />

          {/* Modal */}
          <div className="flex min-h-screen items-center justify-center p-4">
            <div className="relative bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              {/* Header */}
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-xl z-10">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-gray-900">Generate Invoice</h2>
                  <button
                    onClick={() => setShowInvoiceModal(false)}
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Body */}
              <div className="px-6 py-6 space-y-6">
                {/* Pre-populated Fields */}
                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                  <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                    Pre-Populated Information
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Vendor Engagement ID</p>
                      <p className="text-sm font-medium text-gray-900">
                        {vendorEngagement.vendorEngagementId}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Vendor Name</p>
                      <p className="text-sm font-medium text-gray-900">
                        {vendorEngagement.vendorName}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Award Amount</p>
                      <p className="text-sm font-medium text-gray-900">
                        {formatCurrency(vendorEngagement.awardAmount)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Total Paid So Far</p>
                      <p className="text-sm font-medium text-green-700">
                        {formatCurrency(vendorEngagement.totalPaidSoFar)}
                      </p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-xs text-gray-500 mb-1">Remaining Balance</p>
                      <p className="text-lg font-bold text-blue-700">
                        {formatCurrency(vendorEngagement.remainingBalance)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Editable Fields */}
                <div className="space-y-4">
                  {/* Invoice Type */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Invoice Type <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={invoiceType}
                      onChange={(e) => {
                        setInvoiceType(e.target.value as 'Full Payment' | 'Partial Payment');
                        if (e.target.value === 'Full Payment') {
                          setInvoiceAmount(vendorEngagement.remainingBalance.toString());
                        } else {
                          setInvoiceAmount('');
                        }
                      }}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    >
                      <option value="Partial Payment">Partial Payment</option>
                      <option value="Full Payment">Full Payment</option>
                    </select>
                  </div>

                  {/* Invoice Amount */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Invoice Amount <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                        $
                      </span>
                      <input
                        type="number"
                        value={invoiceAmount}
                        onChange={(e) => setInvoiceAmount(e.target.value)}
                        disabled={invoiceType === 'Full Payment'}
                        placeholder="Enter amount"
                        className="w-full pl-8 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Maximum: {formatCurrency(vendorEngagement.remainingBalance)}
                    </p>
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Description / Notes <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={invoiceDescription}
                      onChange={(e) => setInvoiceDescription(e.target.value)}
                      placeholder="Describe the work completed or milestone achieved..."
                      rows={4}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                    />
                  </div>

                  {/* File Upload */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Supporting Documents (Optional)
                    </label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                      <input
                        type="file"
                        id="invoice-file-upload"
                        multiple
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                      <label
                        htmlFor="invoice-file-upload"
                        className="flex flex-col items-center cursor-pointer"
                      >
                        <Upload className="w-8 h-8 text-gray-400 mb-2" />
                        <p className="text-sm text-gray-600">
                          Click to upload or drag and drop
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          PDF, Excel, Images (max 10MB each)
                        </p>
                      </label>
                    </div>

                    {/* Uploaded Files List */}
                    {uploadedFiles.length > 0 && (
                      <div className="mt-3 space-y-2">
                        {uploadedFiles.map((file, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                          >
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              <Paperclip className="w-4 h-4 text-gray-400 flex-shrink-0" />
                              <span className="text-sm text-gray-700 truncate">{file.name}</span>
                              <span className="text-xs text-gray-500">
                                ({formatFileSize(file.size)})
                              </span>
                            </div>
                            <button
                              onClick={() => removeFile(index)}
                              className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Validation Warning */}
                {vendorEngagement.status === 'Terminated' && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-semibold text-red-900">
                          Cannot Generate Invoice
                        </p>
                        <p className="text-xs text-red-700 mt-1">
                          This vendor engagement has been terminated.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 rounded-b-xl">
                <div className="flex items-center justify-end gap-3">
                  <button
                    onClick={() => setShowInvoiceModal(false)}
                    className="px-5 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleGenerateInvoice}
                    disabled={vendorEngagement.status === 'Terminated'}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-semibold shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Receipt className="w-4 h-4" />
                    Generate Invoice
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Upload Vendor Invoice Modal (AI Extraction) */}
      <UploadVendorInvoiceModal
        isOpen={showUploadInvoiceModal}
        onClose={() => setShowUploadInvoiceModal(false)}
        engagementContext={{
          engagementId: vendorEngagement.vendorEngagementId,
          vendorName: vendorEngagement.vendorName,
          awardAmount: vendorEngagement.awardAmount,
          totalPaid: vendorEngagement.totalPaidSoFar,
          remainingBalance: vendorEngagement.remainingBalance,
          currency: 'USD',
        }}
        onSave={(data) => {
          console.log('Invoice saved:', data);
          alert('✅ Invoice uploaded and saved successfully!');
          setShowUploadInvoiceModal(false);
          setTimeout(() => {
            router.push('/invoices');
          }, 500);
        }}
      />
    </div>
  );
}