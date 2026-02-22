import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { Plus, Eye, FileText, Calendar, X } from 'lucide-react';

interface WorkOrder {
  id: string;
  engagementId: string;
  engagementTitle: string;
  title: string;
  submissionCount: number;
  status: 'Draft' | 'Open' | 'Closed' | 'Awarded';
  deadline: string;
  createdDate: string;
  notes?: string;
}

// Mock engagements data (In real app, this would come from context or API)
const mockEngagements = [
  { id: 'ENG-0001', title: 'Cloud Infrastructure Modernization', status: 'Open' },
  { id: 'ENG-0002', title: 'HR Management System Upgrade', status: 'Open' },
  { id: 'ENG-0004', title: 'Cybersecurity Assessment & Remediation', status: 'Open' },
  { id: 'ENG-0005', title: 'Marketing Automation Platform', status: 'Open' },
];

export function WorkOrdersPage() {
  const router = useRouter();
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([
    {
      id: 'WO-0001',
      engagementId: 'ENG-0001',
      engagementTitle: 'Cloud Infrastructure Modernization',
      title: 'AWS/Azure/GCP Enterprise Migration Services',
      submissionCount: 3,
      status: 'Open',
      deadline: '2026-03-15',
      createdDate: '2026-02-10',
      notes: 'Looking for comprehensive cloud migration services with 24/7 support',
    },
    {
      id: 'WO-0002',
      engagementId: 'ENG-0002',
      engagementTitle: 'HR Management System Upgrade',
      title: 'Cloud-based HRIS Solution',
      submissionCount: 2,
      status: 'Open',
      deadline: '2026-03-20',
      createdDate: '2026-02-12',
      notes: 'Must integrate with existing payroll system',
    },
    {
      id: 'WO-0003',
      engagementId: 'ENG-0004',
      engagementTitle: 'Cybersecurity Assessment & Remediation',
      title: 'Enterprise Security Audit & Pen Testing',
      submissionCount: 4,
      status: 'Open',
      deadline: '2026-03-10',
      createdDate: '2026-02-14',
      notes: 'ISO 27001 certified vendors preferred',
    },
    {
      id: 'WO-0004',
      engagementId: 'ENG-0005',
      engagementTitle: 'Marketing Automation Platform',
      title: 'Marketing Automation Software License',
      submissionCount: 5,
      status: 'Awarded',
      deadline: '2026-02-25',
      createdDate: '2026-02-05',
      notes: 'Must include Salesforce integration',
    },
  ]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    engagementId: '',
    title: '',
    deadline: '',
    notes: '',
  });

  // Generate auto-incrementing ID
  const generateWorkOrderId = () => {
    const nextNum = workOrders.length + 1;
    return `WO-${nextNum.toString().padStart(4, '0')}`;
  };

  // Open create modal
  const openCreateModal = () => {
    setFormData({
      engagementId: '',
      title: '',
      deadline: '',
      notes: '',
    });
    setIsModalOpen(true);
  };

  // Close modal
  const closeModal = () => {
    setIsModalOpen(false);
    setFormData({
      engagementId: '',
      title: '',
      deadline: '',
      notes: '',
    });
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const selectedEngagement = mockEngagements.find(
      (eng) => eng.id === formData.engagementId
    );

    if (!selectedEngagement) return;

    const newWorkOrder: WorkOrder = {
      id: generateWorkOrderId(),
      engagementId: formData.engagementId,
      engagementTitle: selectedEngagement.title,
      title: formData.title,
      submissionCount: 0,
      status: 'Draft',
      deadline: formData.deadline,
      createdDate: new Date().toISOString().split('T')[0],
      notes: formData.notes,
    };

    setWorkOrders((prev) => [...prev, newWorkOrder]);
    closeModal();
  };

  // Status badge styling
  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'Draft':
        return 'bg-gray-100 text-gray-700 border-gray-200';
      case 'Open':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'Closed':
        return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'Awarded':
        return 'bg-green-100 text-green-700 border-green-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
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

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900">Work Orders</h1>
          <p className="text-gray-500 mt-1">
            Manage work orders and compare vendor submissions
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-semibold shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Create Work Order
        </button>
      </div>

      {/* Work Orders Table */}
      {workOrders.length === 0 ? (
        // Empty State
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12">
          <div className="max-w-md mx-auto text-center">
            <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No work orders created yet
            </h3>
            <p className="text-gray-600 text-sm mb-6">
              Start by creating your first work order linked to an engagement to begin vendor sourcing.
            </p>
            <button
              onClick={openCreateModal}
              className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-semibold shadow-sm mx-auto"
            >
              <Plus className="w-4 h-4" />
              Create Work Order
            </button>
          </div>
        </div>
      ) : (
        // Table with Data
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Work Order ID
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Engagement ID
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Engagement Title
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Submissions
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Created Date
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {workOrders.map((workOrder) => (
                  <tr
                    key={workOrder.id}
                    onClick={() => router.push(`/rfqs/${workOrder.id}`)}
                    className="hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-medium text-gray-900">
                        {workOrder.id}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Link
                        href="/engagements"
                        onClick={(e) => e.stopPropagation()}
                        className="text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline"
                      >
                        {workOrder.engagementId}
                      </Link>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-900">
                        {workOrder.engagementTitle}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold">
                          {workOrder.submissionCount}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${getStatusBadgeClass(
                          workOrder.status
                        )}`}
                      >
                        {workOrder.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-600">
                        {formatDate(workOrder.createdDate)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create Work Order Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-900/35 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-2xl font-semibold text-gray-900">
                Create New Work Order
              </h2>
              <button
                onClick={closeModal}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Work Order ID */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Work Order ID
                </label>
                <input
                  type="text"
                  value={generateWorkOrderId()}
                  disabled
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-600 cursor-not-allowed"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Auto-generated incremental ID
                </p>
              </div>

              {/* Select Engagement */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Select Engagement <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.engagementId}
                  onChange={(e) =>
                    setFormData({ ...formData, engagementId: e.target.value })
                  }
                  required
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="">Select an engagement...</option>
                  {mockEngagements.map((eng) => (
                    <option key={eng.id} value={eng.id}>
                      {eng.id} - {eng.title}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Only open engagements are shown
                </p>
              </div>

              {/* Work Order Title */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Work Order Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  placeholder="Enter work order title"
                  required
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>

              {/* Submission Deadline */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Submission Deadline <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="date"
                    value={formData.deadline}
                    onChange={(e) =>
                      setFormData({ ...formData, deadline: e.target.value })
                    }
                    required
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                  <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                </div>
              </div>

              {/* Notes / Scope Clarification */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Notes / Scope Clarification
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                  placeholder="Add additional notes or scope clarification..."
                  rows={4}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                />
              </div>

              {/* Status Info */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <FileText className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-blue-900">
                      Initial Status: Draft
                    </p>
                    <p className="text-xs text-blue-700 mt-1">
                      Work order will be created with "Draft" status. You can publish
                      it to vendors from the work order detail page.
                    </p>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-5 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-primary text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-semibold shadow-sm"
                >
                  Create Work Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}