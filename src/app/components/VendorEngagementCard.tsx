import { useState } from 'react';
import Link from 'next/link';
import {
  ChevronDown,
  ChevronUp,
  Plus,
  Edit2,
  Trash2,
  Save,
  X,
  Calendar,
  DollarSign,
  FileText,
  AlertTriangle,
  CheckCircle,
  Eye,
} from 'lucide-react';

interface Milestone {
  id: string;
  activity: string;
  dueDate: string;
  amount: number;
  status: 'Pending' | 'In Progress' | 'Submitted' | 'Approved' | 'Paid';
}

interface Invoice {
  id: string;
  amount: number;
  status: 'Draft' | 'Submitted' | 'Approved' | 'Paid';
  createdDate: string;
}

interface VendorEngagement {
  vendorEngagementId: string;
  engagementId: string;
  workOrderId: string;
  vendorName: string;
  projectTitle: string;
  awardAmount: number;
  status: 'Active' | 'In Progress' | 'On Hold' | 'Completed' | 'Terminated';
  startDate: string;
  endDate?: string;
  department: string;
  awardedBy: string;
  decisionReason: string;
  milestones: Milestone[];
  invoices: Invoice[];
}

interface VendorEngagementCardProps {
  engagement: VendorEngagement;
}

export function VendorEngagementCard({ engagement }: VendorEngagementCardProps) {
  const [expandedMilestones, setExpandedMilestones] = useState(false);
  const [expandedInvoices, setExpandedInvoices] = useState(false);
  const [editingMilestone, setEditingMilestone] = useState<string | null>(null);
  const [milestoneFormData, setMilestoneFormData] = useState({
    activity: '',
    dueDate: '',
    amount: '',
    status: 'Pending' as Milestone['status'],
  });

  // Calculate paid amount
  const paidAmount = engagement.invoices
    .filter(inv => inv.status === 'Paid')
    .reduce((sum, inv) => sum + inv.amount, 0);

  const remainingAmount = engagement.awardAmount - paidAmount;
  const paymentProgress = (paidAmount / engagement.awardAmount) * 100;

  // Calculate milestone allocation
  const totalMilestoneAllocation = engagement.milestones.reduce((sum, m) => sum + m.amount, 0);
  const allocationMatch = totalMilestoneAllocation === engagement.awardAmount;

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

  // Status badge class
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
      case 'Pending':
        return 'bg-gray-100 text-gray-700 border-gray-200';
      case 'Submitted':
        return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'Approved':
        return 'bg-teal-100 text-teal-700 border-teal-200';
      case 'Paid':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'Draft':
        return 'bg-gray-100 text-gray-700 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  // Invoice badge class
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

  // Handle edit milestone
  const handleEditMilestone = (milestone: Milestone) => {
    setEditingMilestone(milestone.id);
    setMilestoneFormData({
      activity: milestone.activity,
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
      activity: '',
      dueDate: '',
      amount: '',
      status: 'Pending',
    });
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
      {/* Header Section */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-1">
              {engagement.projectTitle}
            </h3>
            <p className="text-sm text-gray-600">{engagement.vendorName}</p>
          </div>
          <span
            className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${getStatusBadgeClass(
              engagement.status
            )}`}
          >
            {engagement.status}
          </span>
        </div>

        <div className="flex items-center gap-4 text-sm text-gray-500">
          <span className="font-mono">{engagement.vendorEngagementId}</span>
          <span>•</span>
          <span>{engagement.department}</span>
        </div>
      </div>

      {/* Award Breakdown Summary */}
      <div className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 border-b border-gray-200">
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <p className="text-xs text-gray-600 uppercase tracking-wide mb-1">Total Award</p>
            <p className="text-2xl font-bold text-gray-900">{formatCurrency(engagement.awardAmount)}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-600 uppercase tracking-wide mb-1">Milestones</p>
            <p className="text-2xl font-bold text-gray-900">{engagement.milestones.length}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-3">
          <div>
            <p className="text-xs text-gray-600 mb-1">Paid</p>
            <p className="text-sm font-semibold text-green-700">{formatCurrency(paidAmount)}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-600 mb-1">Remaining</p>
            <p className="text-sm font-semibold text-gray-700">{formatCurrency(remainingAmount)}</p>
          </div>
        </div>

        {/* Progress Bar */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-gray-600">Payment Progress</span>
            <span className="text-xs font-semibold text-gray-700">{paymentProgress.toFixed(0)}%</span>
          </div>
          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-green-500 to-green-600 transition-all duration-300"
              style={{ width: `${paymentProgress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Milestones Section */}
      <div className="border-b border-gray-200">
        <button
          onClick={() => setExpandedMilestones(!expandedMilestones)}
          className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-gray-900">
              Milestones ({engagement.milestones.length})
            </span>
          </div>
          {expandedMilestones ? (
            <ChevronUp className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          )}
        </button>

        {expandedMilestones && (
          <div className="px-6 pb-6 space-y-3">
            {/* Add Milestone Button */}
            <button className="w-full py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors flex items-center justify-center gap-2">
              <Plus className="w-4 h-4" />
              Add Milestone
            </button>

            {/* Milestone List */}
            {engagement.milestones.map((milestone) => (
              <div
                key={milestone.id}
                className="bg-gray-50 rounded-lg p-4 border border-gray-200"
              >
                {editingMilestone === milestone.id ? (
                  // Edit Mode
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Activity
                      </label>
                      <input
                        type="text"
                        value={milestoneFormData.activity}
                        onChange={(e) =>
                          setMilestoneFormData({ ...milestoneFormData, activity: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Due Date
                      </label>
                      <input
                        type="date"
                        value={milestoneFormData.dueDate}
                        onChange={(e) =>
                          setMilestoneFormData({ ...milestoneFormData, dueDate: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Amount
                      </label>
                      <input
                        type="number"
                        value={milestoneFormData.amount}
                        onChange={(e) =>
                          setMilestoneFormData({ ...milestoneFormData, amount: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Status
                      </label>
                      <select
                        value={milestoneFormData.status}
                        onChange={(e) =>
                          setMilestoneFormData({
                            ...milestoneFormData,
                            status: e.target.value as Milestone['status'],
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      >
                        <option value="Pending">Pending</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Submitted">Submitted</option>
                        <option value="Approved">Approved</option>
                        <option value="Paid">Paid</option>
                      </select>
                    </div>
                    <div className="flex items-center gap-2 pt-2">
                      <button
                        onClick={handleSaveMilestone}
                        className="flex-1 px-3 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                      >
                        <Save className="w-4 h-4" />
                        Save
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        className="flex-1 px-3 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                      >
                        <X className="w-4 h-4" />
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  // View Mode
                  <div>
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-gray-900 mb-1">
                          {milestone.activity}
                        </p>
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
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${getStatusBadgeClass(
                            milestone.status
                          )}`}
                        >
                          {milestone.status}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEditMilestone(milestone)}
                        className="flex-1 px-3 py-1.5 border border-gray-300 text-gray-700 rounded-lg text-xs font-medium hover:bg-gray-50 transition-colors flex items-center justify-center gap-1"
                      >
                        <Edit2 className="w-3 h-3" />
                        Edit
                      </button>
                      <button className="flex-1 px-3 py-1.5 border border-red-300 text-red-700 rounded-lg text-xs font-medium hover:bg-red-50 transition-colors flex items-center justify-center gap-1">
                        <Trash2 className="w-3 h-3" />
                        Delete
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {/* Allocation Summary */}
            <div
              className={`p-3 rounded-lg border ${
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
                    Total Milestone Allocation: {formatCurrency(totalMilestoneAllocation)}
                  </p>
                  <p className="text-gray-600">
                    Award Amount: {formatCurrency(engagement.awardAmount)}
                  </p>
                  {allocationMatch ? (
                    <p className="text-green-700 font-medium mt-1">✓ Balanced</p>
                  ) : (
                    <p className="text-amber-700 font-medium mt-1">
                      ⚠ Allocation {totalMilestoneAllocation > engagement.awardAmount ? 'exceeds' : 'below'} Award Amount
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Generated Invoices Section */}
      <div className="border-b border-gray-200">
        <button
          onClick={() => setExpandedInvoices(!expandedInvoices)}
          className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-gray-900">
              Generated Invoices ({engagement.invoices.length})
            </span>
          </div>
          {expandedInvoices ? (
            <ChevronUp className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          )}
        </button>

        {expandedInvoices && (
          <div className="px-6 pb-6 space-y-2">
            {engagement.invoices.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-sm text-gray-500 mb-3">No invoices generated yet.</p>
                <button className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
                  Generate Invoice
                </button>
              </div>
            ) : (
              <>
                {engagement.invoices.map((invoice) => (
                  <div
                    key={invoice.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <FileText className="w-4 h-4 text-gray-400 group-hover:text-blue-600" />
                      <div>
                        <Link
                          href={`/invoices/${invoice.id}`}
                          className="text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline"
                        >
                          {invoice.id}
                        </Link>
                        <p className="text-xs text-gray-500">
                          Created: {formatDate(invoice.createdDate)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
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
                ))}

                <Link
                  href="/invoices"
                  className="block w-full py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors text-center"
                >
                  View All Invoices
                </Link>
              </>
            )}
          </div>
        )}
      </div>

      {/* Footer - Quick Actions */}
      <div className="p-6">
        <Link
          href={`/engagements/${engagement.vendorEngagementId}`}
          className="block w-full py-2.5 bg-primary text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors text-center flex items-center justify-center gap-2"
        >
          <Eye className="w-4 h-4" />
          View Full Details
        </Link>
      </div>
    </div>
  );
}
