import { useState } from 'react';
import {
  Plus,
  Edit,
  X,
  Briefcase,
  LayoutGrid,
  Table,
  Loader2,
  Calendar,
  FileText,
  Search,
  Filter,
} from 'lucide-react';
import { useEngagements, type Engagement } from '@/lib/hooks/useEngagements';
import { useWorkOrderVendorSubmissions } from '@/lib/hooks/useWorkOrderVendorSubmissions';
import { MonthPicker } from '../components/MonthPicker';

// ─── Types ──────────────────────────────────────────────────────────────────

type ViewMode = 'cards' | 'table';

// ─── Component ──────────────────────────────────────────────────────────────

export function EngagementsPage() {
  const {
    engagements,
    isLoading,
    error: fetchError,
    refetch,
    createEngagement,
    updateEngagement,
  } = useEngagements();

  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [impactFilter, setImpactFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentEngagement, setCurrentEngagement] = useState<Engagement | null>(
    null
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Drawer state
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedEngagement, setSelectedEngagement] =
    useState<Engagement | null>(null);
  const [drawerWorkOrderId, setDrawerWorkOrderId] = useState<string | null>(
    null
  );
  const [isDrawerEditing, setIsDrawerEditing] = useState(false);
  const [drawerFormData, setDrawerFormData] = useState({
    title: '',
    projectImpact: 'Medium' as 'High' | 'Medium' | 'Low',
    description: '',
  });
  const [isDrawerSubmitting, setIsDrawerSubmitting] = useState(false);
  const [drawerError, setDrawerError] = useState<string | null>(null);

  // Auto-incrementing ID
  const generateEngagementId = () => {
    const maxNum = engagements.reduce(
      (max, e) => Math.max(max, e.engagement_number ?? 0),
      0
    );
    return `ENG-${(maxNum + 1).toString().padStart(4, '0')}`;
  };

  // Submissions for selected engagement (Work Order)
  const {
    submissions: vendorSubmissions,
    loading: submissionsLoading,
    resolveVendor,
    refetch: refetchSubmissions,
  } = useWorkOrderVendorSubmissions(drawerWorkOrderId);
  const [resolvingId, setResolvingId] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    projectImpact: 'Medium' as 'High' | 'Medium' | 'Low',
    description: '',
  });

  // ── Modal handlers ─────────────────────────────────────────────────────

  const openCreateModal = () => {
    setIsEditMode(false);
    setCurrentEngagement(null);
    setSubmitError(null);
    setFormData({
      title: '',
      projectImpact: 'Medium',
      description: '',
    });
    setIsModalOpen(true);
  };

  const openEditModal = (engagement: Engagement, e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditMode(true);
    setCurrentEngagement(engagement);
    setSubmitError(null);
    setFormData({
      title: engagement.title,
      projectImpact: (engagement.project_impact || 'Medium') as
        | 'High'
        | 'Medium'
        | 'Low',
      description: engagement.description ?? '',
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    if (isSubmitting) return;
    setIsModalOpen(false);
    setCurrentEngagement(null);
    setSubmitError(null);
    setFormData({
      title: '',
      projectImpact: 'Medium',
      description: '',
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    setIsSubmitting(true);

    try {
      if (isEditMode && currentEngagement) {
        await updateEngagement(currentEngagement.id, {
          title: formData.title.trim(),
          description: formData.description.trim() || undefined,
          project_impact: formData.projectImpact,
        });
      } else {
        await createEngagement({
          title: formData.title.trim(),
          description: formData.description.trim() || undefined,
          project_impact: formData.projectImpact,
          status: 'active',
        });
      }
      closeModal();
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Failed to create engagement.';
      setSubmitError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Style helpers ──────────────────────────────────────────────────────

  const getImpactBadgeClass = (impact: string) => {
    switch (impact) {
      case 'High':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'Medium':
        return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'Low':
        return 'bg-green-100 text-green-700 border-green-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'on_hold':
        return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'completed':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'cancelled':
        return 'bg-red-100 text-red-700 border-red-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const handleCardClick = (engagementId: string) => {
    const engagement = engagements.find((e) => e.id === engagementId);
    if (engagement) {
      setSelectedEngagement(engagement);
      // Let's assume engagement.id is the work_order_id under the hood for submissions
      setDrawerWorkOrderId(engagement.id);
      setIsDrawerOpen(true);
    }
  };

  const closeDrawer = () => {
    setIsDrawerOpen(false);
    setIsDrawerEditing(false);
    setDrawerError(null);
    setTimeout(() => {
      setSelectedEngagement(null);
      setDrawerWorkOrderId(null);
    }, 300);
  };

  const startDrawerEdit = () => {
    if (!selectedEngagement) return;
    setDrawerFormData({
      title: selectedEngagement.title,
      projectImpact: (selectedEngagement.project_impact || 'Medium') as
        | 'High'
        | 'Medium'
        | 'Low',
      description: selectedEngagement.description ?? '',
    });
    setDrawerError(null);
    setIsDrawerEditing(true);
  };

  const cancelDrawerEdit = () => {
    setIsDrawerEditing(false);
    setDrawerError(null);
  };

  const handleDrawerSave = async () => {
    if (!selectedEngagement) return;
    setIsDrawerSubmitting(true);
    setDrawerError(null);
    try {
      const updated = await updateEngagement(selectedEngagement.id, {
        title: drawerFormData.title.trim(),
        description: drawerFormData.description.trim() || undefined,
        project_impact: drawerFormData.projectImpact,
      });
      setSelectedEngagement(updated);
      setIsDrawerEditing(false);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Failed to save changes.';
      setDrawerError(message);
    } finally {
      setIsDrawerSubmitting(false);
    }
  };

  const filteredEngagements = engagements.filter((engagement) => {
    // 1. Search (Title or ID)
    const matchesSearch =
      engagement.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      `ENG-${String(engagement.engagement_number).padStart(4, '0')}`
        .toLowerCase()
        .includes(searchTerm.toLowerCase());

    // 2. Status
    const matchesStatus =
      statusFilter === 'all' || engagement.status === statusFilter;

    // 3. Impact
    const matchesImpact =
      impactFilter === 'all' ||
      (engagement.project_impact &&
        engagement.project_impact.toLowerCase() === impactFilter.toLowerCase());

    // 4. Month
    const matchesDate =
      !dateFilter ||
      (engagement.created_at &&
        new Date(engagement.created_at).toISOString().slice(0, 7) ===
          dateFilter);

    return matchesSearch && matchesStatus && matchesImpact && matchesDate;
  });

  // ── Render ─────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900">Engagements</h1>
          <p className="text-gray-500 mt-1">
            Create and manage vendor sourcing engagements
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* View Mode Toggle */}
          <div className="inline-flex items-center bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('cards')}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                viewMode === 'cards'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
              <span className="hidden sm:inline">Cards</span>
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                viewMode === 'table'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Table className="w-4 h-4" />
              <span className="hidden sm:inline">Table</span>
            </button>
          </div>

          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-semibold shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Create Engagement
          </button>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12">
          <div className="flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            <p className="text-sm text-gray-500">Loading engagements…</p>
          </div>
        </div>
      )}

      {/* Error State */}
      {!isLoading && fetchError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-700">{fetchError}</p>
          <button
            onClick={refetch}
            className="mt-2 text-sm font-semibold text-red-700 underline hover:text-red-800"
          >
            Retry
          </button>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !fetchError && filteredEngagements.length === 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12">
          <div className="max-w-md mx-auto text-center">
            <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Briefcase className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No engagements yet
            </h3>
            <p className="text-gray-600 text-sm mb-6">
              Start by creating a new engagement to identify a vendor need.
            </p>
            <button
              onClick={openCreateModal}
              className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-semibold shadow-sm mx-auto"
            >
              <Plus className="w-4 h-4" />
              Create Engagement
            </button>
          </div>
        </div>
      )}

      {/* Content */}
      {!isLoading && !fetchError && filteredEngagements.length > 0 && (
        <>
          {/* Card View */}
          {viewMode === 'cards' && (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 animate-fadeIn">
              {filteredEngagements.map((engagement) => {
                const impact = (engagement.project_impact || 'Medium') as
                  | 'High'
                  | 'Medium'
                  | 'Low';
                const borderColor =
                  impact === 'High'
                    ? 'border-l-red-500'
                    : impact === 'Medium'
                      ? 'border-l-orange-400'
                      : 'border-l-green-500';

                return (
                  <div
                    key={engagement.id}
                    onClick={() => handleCardClick(engagement.id)}
                    className={`relative bg-white rounded-xl shadow-sm border border-gray-200 border-l-4 ${borderColor} overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all duration-200 cursor-pointer group`}
                  >
                    <div className="p-5">
                      {/* Top Section - ID & Status */}
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-mono font-semibold text-blue-600 tracking-wide">
                          ENG-
                          {String(engagement.engagement_number).padStart(
                            4,
                            '0'
                          )}
                        </span>
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getStatusBadgeClass(
                            engagement.status
                          )}`}
                        >
                          {engagement.status.charAt(0).toUpperCase() +
                            engagement.status.slice(1).replace('_', ' ')}
                        </span>
                      </div>

                      {/* Title */}
                      <h3 className="text-base font-semibold text-gray-900 mb-3 line-clamp-2 min-h-[2.75rem]">
                        {engagement.title}
                      </h3>

                      {/* Project Impact Badge */}
                      <div className="mb-3">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${getImpactBadgeClass(impact)}`}
                        >
                          {impact} Impact
                        </span>
                      </div>

                      {/* Description */}
                      <p
                        className="text-sm text-gray-600 line-clamp-3 mb-4 min-h-[3.75rem]"
                        title={engagement.description ?? ''}
                      >
                        {engagement.description || 'No description provided.'}
                      </p>

                      {/* Bottom Section */}
                      <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                        <span className="text-xs text-gray-500">
                          Created {formatDate(engagement.created_at)}
                        </span>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={(e) => openEditModal(engagement, e)}
                            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Table View */}
          {viewMode === 'table' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              {/* Filter Bar inside table */}
              <div className="bg-gray-50 border-b border-gray-200 px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-3">
                  {/* Search */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search by title or ID..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9 pr-3 py-1.5 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-primary focus:border-transparent w-48"
                    />
                  </div>

                  {/* Status Filter */}
                  <div className="relative">
                    <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="pl-9 pr-8 py-1.5 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-primary focus:border-transparent appearance-none bg-white"
                    >
                      <option value="all">All Statuses</option>
                      <option value="active">Active</option>
                      <option value="on_hold">On Hold</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>

                  {/* Impact Filter */}
                  <div className="relative">
                    <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    <select
                      value={impactFilter}
                      onChange={(e) => setImpactFilter(e.target.value)}
                      className="pl-9 pr-8 py-1.5 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-primary focus:border-transparent appearance-none bg-white"
                    >
                      <option value="all">All Impacts</option>
                      <option value="High">High Impact</option>
                      <option value="Medium">Medium Impact</option>
                      <option value="Low">Low Impact</option>
                    </select>
                  </div>

                  {/* Date Filter */}
                  <div className="relative">
                    <MonthPicker
                      value={dateFilter}
                      onChange={(val) => setDateFilter(val)}
                    />
                  </div>
                </div>

                <p className="text-xs text-gray-500">
                  Showing {filteredEngagements.length} of {engagements.length}{' '}
                  engagements
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200 sticky top-0">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Engagement ID
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Title
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Project Impact
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Description
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
                    {filteredEngagements.map((engagement, index) => (
                      <tr
                        key={engagement.id}
                        onClick={() => handleCardClick(engagement.id)}
                        className="hover:bg-gray-50 transition-colors cursor-pointer"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-blue-600 font-medium">
                            ENG-
                            {String(
                              engagement.engagement_number ?? index + 1
                            ).padStart(4, '0')}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm font-medium text-gray-900">
                            {engagement.title}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${getImpactBadgeClass(
                              engagement.project_impact || 'Medium'
                            )}`}
                          >
                            {engagement.project_impact || 'Medium'} Impact
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="max-w-md">
                            <p
                              className="text-sm text-gray-600 line-clamp-2 cursor-help"
                              title={engagement.description ?? ''}
                            >
                              {engagement.description || '—'}
                            </p>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${getStatusBadgeClass(
                              engagement.status
                            )}`}
                          >
                            {engagement.status.charAt(0).toUpperCase() +
                              engagement.status.slice(1).replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-xs text-gray-500">
                            {formatDate(engagement.created_at)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Results Count */}
          <div className="text-sm text-gray-600">
            Showing <span className="font-medium">{engagements.length}</span>{' '}
            engagement{engagements.length !== 1 ? 's' : ''}
          </div>
        </>
      )}

      {/* Create/Edit Engagement Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-900/35 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-2xl font-semibold text-gray-900">
                {isEditMode ? 'Edit Engagement' : 'Create New Engagement'}
              </h2>
              <button
                onClick={closeModal}
                disabled={isSubmitting}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Engagement ID */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Engagement ID
                </label>
                <input
                  type="text"
                  value={
                    isEditMode
                      ? `ENG-${String(currentEngagement?.engagement_number ?? '').padStart(4, '0')}`
                      : generateEngagementId()
                  }
                  disabled
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-600 cursor-not-allowed"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Auto-generated incremental ID
                </p>
              </div>

              {/* Title */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  placeholder="Enter engagement title"
                  required
                  disabled={isSubmitting}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:opacity-50"
                />
              </div>

              {/* Project Impact */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Project Impact <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center gap-4">
                  <select
                    value={formData.projectImpact}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        projectImpact: e.target.value as
                          | 'High'
                          | 'Medium'
                          | 'Low',
                      })
                    }
                    disabled={isSubmitting}
                    className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:opacity-50"
                  >
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                  <span
                    className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold border ${getImpactBadgeClass(formData.projectImpact)}`}
                  >
                    {formData.projectImpact}
                  </span>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Describe the scope and objective of this engagement..."
                  rows={5}
                  disabled={isSubmitting}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none disabled:opacity-50"
                />
              </div>

              {/* Status (Read-only for creation) */}
              {!isEditMode && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Status
                  </label>
                  <input
                    type="text"
                    value="Active"
                    disabled
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-600 cursor-not-allowed"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Default status for new engagements
                  </p>
                </div>
              )}

              {/* Error */}
              {submitError && (
                <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3">
                  <p className="text-sm text-red-700">{submitError}</p>
                </div>
              )}

              {/* Modal Footer */}
              <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={isSubmitting}
                  className="px-5 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !formData.title.trim()}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-semibold shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  {isSubmitting
                    ? 'Creating…'
                    : isEditMode
                      ? 'Save Changes'
                      : 'Create Engagement'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* ── Details Drawer ────────────────────────────────────────────── */}
      {(isDrawerOpen || selectedEngagement) && (
        <>
          {/* Backdrop */}
          <div
            className={`fixed inset-0 bg-black/30 z-40 transition-opacity duration-300 ${isDrawerOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
            onClick={closeDrawer}
          />

          {/* Drawer */}
          <div
            className={`fixed top-0 right-0 h-[100dvh] w-full max-w-md bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out ${isDrawerOpen ? 'translate-x-0' : 'translate-x-full'}`}
          >
            {selectedEngagement && (
              <div className="h-full flex flex-col">
                {/* Drawer Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50">
                  <div>
                    <span className="text-xs font-mono font-semibold text-blue-600 tracking-wide">
                      ENG-
                      {String(selectedEngagement.engagement_number).padStart(
                        4,
                        '0'
                      )}
                    </span>
                    {!isDrawerEditing ? (
                      <h2 className="text-lg font-semibold text-gray-900 mt-1">
                        {selectedEngagement.title}
                      </h2>
                    ) : (
                      <p className="text-sm text-gray-500 mt-1">
                        Editing engagement
                      </p>
                    )}
                  </div>
                  <button
                    onClick={closeDrawer}
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Drawer Body */}
                <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
                  {!isDrawerEditing ? (
                    /* ── View Mode ─────────────────────────────── */
                    <>
                      {/* Status & Impact */}
                      <div className="flex items-center gap-3">
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${getStatusBadgeClass(selectedEngagement.status)}`}
                        >
                          {selectedEngagement.status.charAt(0).toUpperCase() +
                            selectedEngagement.status
                              .slice(1)
                              .replace('_', ' ')}
                        </span>
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${getImpactBadgeClass(selectedEngagement.project_impact || 'Medium')}`}
                        >
                          {selectedEngagement.project_impact || 'Medium'} Impact
                        </span>
                      </div>

                      {/* Description */}
                      <div>
                        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                          <FileText className="w-3.5 h-3.5" />
                          Description
                        </h3>
                        <p className="text-sm text-gray-700 leading-relaxed bg-gray-50 rounded-lg p-4">
                          {selectedEngagement.description ||
                            'No description provided.'}
                        </p>
                      </div>

                      {/* Created Date */}
                      <div>
                        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                          Details
                        </h3>
                        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <div>
                            <p className="text-xs text-gray-500">Created</p>
                            <p className="text-sm font-medium text-gray-800">
                              {formatDate(selectedEngagement.created_at)}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Vendor Submissions */}
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                            Vendor Submissions
                          </h3>
                          <span className="bg-blue-100 text-blue-700 py-0.5 px-2 rounded-full text-xs font-bold">
                            {vendorSubmissions?.length || 0}
                          </span>
                        </div>

                        {submissionsLoading ? (
                          <div className="flex justify-center p-4">
                            <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                          </div>
                        ) : vendorSubmissions &&
                          vendorSubmissions.length > 0 ? (
                          <div className="space-y-3">
                            {vendorSubmissions.map((sub) => (
                              <div
                                key={sub.id}
                                className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm"
                              >
                                <div className="flex justify-between items-start mb-2">
                                  <div>
                                    <p className="text-sm font-semibold text-gray-900">
                                      {sub.vendor_name}
                                    </p>
                                  </div>
                                  <span
                                    className={`text-xs px-2 py-0.5 rounded-full font-medium ${sub.status === 'resolved' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}
                                  >
                                    {sub.status === 'resolved'
                                      ? 'Resolved'
                                      : 'Pending'}
                                  </span>
                                </div>

                                {sub.quoted_amount !== null && (
                                  <p className="text-sm font-medium text-gray-900 mt-1 mb-2">
                                    Quote: $
                                    {sub.quoted_amount.toLocaleString(
                                      undefined,
                                      {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2,
                                      }
                                    )}
                                  </p>
                                )}

                                <div className="text-xs text-gray-500 mb-3 flex items-center gap-2">
                                  <FileText className="w-3.5 h-3.5" />
                                  {sub.file_count || 0} document
                                  {sub.file_count !== 1 ? 's' : ''} uploaded
                                </div>

                                {sub.status === 'pending' && (
                                  <button
                                    onClick={async () => {
                                      setResolvingId(sub.id);
                                      try {
                                        await resolveVendor(sub.id);
                                      } catch (err) {
                                        console.error(
                                          'Failed to resolve:',
                                          err
                                        );
                                      } finally {
                                        setResolvingId(null);
                                      }
                                    }}
                                    disabled={resolvingId === sub.id}
                                    className="w-full py-1.5 px-3 bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs font-semibold rounded transition-colors disabled:opacity-50 flex justify-center items-center gap-2"
                                  >
                                    {resolvingId === sub.id && (
                                      <Loader2 className="w-3 h-3 animate-spin" />
                                    )}
                                    Resolve Vendor
                                  </button>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center p-4 bg-gray-50 rounded-lg border border-gray-100">
                            <p className="text-sm text-gray-500">
                              No submissions yet.
                            </p>
                          </div>
                        )}
                      </div>
                    </>
                  ) : (
                    /* ── Edit Mode ───────────────────────────── */
                    <>
                      {/* Title */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Title <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={drawerFormData.title}
                          onChange={(e) =>
                            setDrawerFormData((prev) => ({
                              ...prev,
                              title: e.target.value,
                            }))
                          }
                          disabled={isDrawerSubmitting}
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:opacity-50"
                        />
                      </div>

                      {/* Project Impact */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Project Impact <span className="text-red-500">*</span>
                        </label>
                        <div className="flex items-center gap-3">
                          <select
                            value={drawerFormData.projectImpact}
                            onChange={(e) =>
                              setDrawerFormData((prev) => ({
                                ...prev,
                                projectImpact: e.target.value as
                                  | 'High'
                                  | 'Medium'
                                  | 'Low',
                              }))
                            }
                            disabled={isDrawerSubmitting}
                            className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:opacity-50"
                          >
                            <option value="High">High</option>
                            <option value="Medium">Medium</option>
                            <option value="Low">Low</option>
                          </select>
                          <span
                            className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold border ${getImpactBadgeClass(drawerFormData.projectImpact)}`}
                          >
                            {drawerFormData.projectImpact}
                          </span>
                        </div>
                      </div>

                      {/* Description */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Description
                        </label>
                        <textarea
                          value={drawerFormData.description}
                          onChange={(e) =>
                            setDrawerFormData((prev) => ({
                              ...prev,
                              description: e.target.value,
                            }))
                          }
                          placeholder="Describe the scope and objective..."
                          rows={5}
                          disabled={isDrawerSubmitting}
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none disabled:opacity-50"
                        />
                      </div>

                      {/* Error */}
                      {drawerError && (
                        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3">
                          <p className="text-sm text-red-700">{drawerError}</p>
                        </div>
                      )}
                    </>
                  )}
                </div>

                {/* Drawer Footer */}
                <div className="px-6 py-4 pb-10 border-t border-gray-200 bg-gray-50">
                  <div className="flex items-center gap-3">
                    {!isDrawerEditing ? (
                      <>
                        <button
                          onClick={startDrawerEdit}
                          className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-semibold"
                        >
                          <Edit className="w-4 h-4" />
                          Edit Engagement
                        </button>
                        <button
                          onClick={closeDrawer}
                          className="px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors text-sm font-medium"
                        >
                          Close
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={handleDrawerSave}
                          disabled={
                            isDrawerSubmitting || !drawerFormData.title.trim()
                          }
                          className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isDrawerSubmitting && (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          )}
                          {isDrawerSubmitting ? 'Saving…' : 'Save Changes'}
                        </button>
                        <button
                          onClick={cancelDrawerEdit}
                          disabled={isDrawerSubmitting}
                          className="px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors text-sm font-medium disabled:opacity-50"
                        >
                          Cancel
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
