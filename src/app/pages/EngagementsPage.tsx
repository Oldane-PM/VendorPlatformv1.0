import { useState } from 'react';
import Link from 'next/link';
import { Plus, Edit, X, FileText, Briefcase, LayoutGrid, Table } from 'lucide-react';

interface Engagement {
  id: string;
  title: string;
  projectImpact: 'High' | 'Medium' | 'Low';
  description: string;
  status: 'Open' | 'In Progress' | 'Closed';
  createdAt: string;
}

type ViewMode = 'cards' | 'table';

export function EngagementsPage() {
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [engagements, setEngagements] = useState<Engagement[]>([
    {
      id: 'ENG-0001',
      title: 'Cloud Infrastructure Modernization',
      projectImpact: 'High',
      description: 'Migrate legacy on-premise infrastructure to cloud-based architecture. Requires evaluation of AWS, Azure, and GCP capabilities for enterprise workloads.',
      status: 'Open',
      createdAt: '2025-02-10T10:30:00Z',
    },
    {
      id: 'ENG-0002',
      title: 'HR Management System Upgrade',
      projectImpact: 'Medium',
      description: 'Replace existing HR platform with modern HRIS solution. Must support employee onboarding, payroll integration, and performance management workflows.',
      status: 'Open',
      createdAt: '2025-02-12T14:15:00Z',
    },
    {
      id: 'ENG-0003',
      title: 'Office Supplies Procurement',
      projectImpact: 'Low',
      description: 'Establish vendor relationship for quarterly office supplies including stationery, pantry items, and cleaning materials for 3 office locations.',
      status: 'Open',
      createdAt: '2025-02-13T09:45:00Z',
    },
    {
      id: 'ENG-0004',
      title: 'Cybersecurity Assessment & Remediation',
      projectImpact: 'High',
      description: 'Conduct comprehensive security audit of IT infrastructure and implement recommended security controls. Includes penetration testing and vulnerability management.',
      status: 'Open',
      createdAt: '2025-02-14T11:20:00Z',
    },
    {
      id: 'ENG-0005',
      title: 'Marketing Automation Platform',
      projectImpact: 'Medium',
      description: 'Source marketing automation tool to streamline email campaigns, lead nurturing, and customer engagement analytics. Must integrate with existing CRM.',
      status: 'Open',
      createdAt: '2025-02-15T08:00:00Z',
    },
    {
      id: 'ENG-0006',
      title: 'Legal Contract Management System',
      projectImpact: 'Medium',
      description: 'Implement contract lifecycle management software with AI-powered clause analysis, automated renewals, and compliance tracking capabilities.',
      status: 'Open',
      createdAt: '2025-02-15T16:30:00Z',
    },
  ]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentEngagement, setCurrentEngagement] = useState<Engagement | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    title: '',
    projectImpact: 'Medium' as 'High' | 'Medium' | 'Low',
    description: '',
  });

  // Generate auto-incrementing ID
  const generateEngagementId = () => {
    const nextNum = engagements.length + 1;
    return `ENG-${nextNum.toString().padStart(4, '0')}`;
  };

  // Open create modal
  const openCreateModal = () => {
    setIsEditMode(false);
    setFormData({
      title: '',
      projectImpact: 'Medium',
      description: '',
    });
    setIsModalOpen(true);
  };

  // Open edit modal
  const openEditModal = (engagement: Engagement, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click
    setIsEditMode(true);
    setCurrentEngagement(engagement);
    setFormData({
      title: engagement.title,
      projectImpact: engagement.projectImpact,
      description: engagement.description,
    });
    setIsModalOpen(true);
  };

  // Close modal
  const closeModal = () => {
    setIsModalOpen(false);
    setCurrentEngagement(null);
    setFormData({
      title: '',
      projectImpact: 'Medium',
      description: '',
    });
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (isEditMode && currentEngagement) {
      // Update existing engagement
      setEngagements(prev => prev.map(eng => 
        eng.id === currentEngagement.id 
          ? { ...eng, ...formData }
          : eng
      ));
    } else {
      // Create new engagement
      const newEngagement: Engagement = {
        id: generateEngagementId(),
        ...formData,
        status: 'Open',
        createdAt: new Date().toISOString(),
      };
      setEngagements(prev => [...prev, newEngagement]);
    }

    closeModal();
  };

  // Impact badge styling
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

  // Status badge styling
  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'Open':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'In Progress':
        return 'bg-indigo-100 text-indigo-700 border-indigo-200';
      case 'Closed':
        return 'bg-gray-100 text-gray-700 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  // Get accent bar color
  const getAccentBarColor = (impact: string) => {
    switch (impact) {
      case 'High':
        return 'bg-red-500';
      case 'Medium':
        return 'bg-orange-500';
      case 'Low':
        return 'bg-green-500';
      default:
        return 'bg-gray-300';
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

  // Handle card click
  const handleCardClick = (engagementId: string) => {
    alert(`Viewing engagement ${engagementId}`);
  };

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
          {/* View Mode Toggle - Segmented Control */}
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

      {/* Engagements Cards */}
      {engagements.length === 0 ? (
        // Empty State (same for both views)
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
      ) : (
        <>
          {/* Card View */}
          {viewMode === 'cards' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 animate-fadeIn">
              {engagements.map((engagement) => (
                <div
                  key={engagement.id}
                  onClick={() => handleCardClick(engagement.id)}
                  className="relative bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all duration-200 cursor-pointer group"
                >
                  {/* Accent Bar */}
                  <div className={`absolute left-0 top-0 bottom-0 w-1 ${getAccentBarColor(engagement.projectImpact)}`} />

                  {/* Card Content */}
                  <div className="p-6 pl-8">
                    {/* Top Section - ID & Status */}
                    <div className="flex items-start justify-between mb-4">
                      <span className="text-xs font-mono font-medium text-gray-500 uppercase tracking-wide">
                        {engagement.id}
                      </span>
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${getStatusBadgeClass(
                          engagement.status
                        )}`}
                      >
                        {engagement.status}
                      </span>
                    </div>

                    {/* Title Section */}
                    <h3 className="text-lg font-semibold text-gray-900 mb-3 line-clamp-2 min-h-[3.5rem]">
                      {engagement.title}
                    </h3>

                    {/* Project Impact Badge */}
                    <div className="mb-4">
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${getImpactBadgeClass(
                          engagement.projectImpact
                        )}`}
                      >
                        {engagement.projectImpact} Impact
                      </span>
                    </div>

                    {/* Description */}
                    <p
                      className="text-sm text-gray-600 line-clamp-3 mb-6 min-h-[4.5rem]"
                      title={engagement.description}
                    >
                      {engagement.description}
                    </p>

                    {/* Bottom Section - Divider Above */}
                    <div className="pt-4 border-t border-gray-200 flex items-center justify-between">
                      <span className="text-xs text-gray-500">
                        Created {formatDate(engagement.createdAt)}
                      </span>

                      {/* Action Icons */}
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCardClick(engagement.id);
                          }}
                          className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="View"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Table View */}
          {viewMode === 'table' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
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
                    {engagements.map((engagement) => (
                      <tr 
                        key={engagement.id} 
                        onClick={() => handleCardClick(engagement.id)}
                        className="hover:bg-gray-50 transition-colors cursor-pointer"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-xs font-mono font-medium text-gray-500 uppercase tracking-wide">
                            {engagement.id}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-gray-900">
                            {engagement.title}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${getImpactBadgeClass(
                              engagement.projectImpact
                            )}`}
                          >
                            {engagement.projectImpact} Impact
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="max-w-md">
                            <p
                              className="text-sm text-gray-600 line-clamp-2 cursor-help"
                              title={engagement.description}
                            >
                              {engagement.description}
                            </p>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${getStatusBadgeClass(
                              engagement.status
                            )}`}
                          >
                            {engagement.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-xs text-gray-500">
                            {formatDate(engagement.createdAt)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
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
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
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
                  value={isEditMode ? currentEngagement?.id : generateEngagementId()}
                  disabled
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-600 cursor-not-allowed"
                />
                <p className="text-xs text-gray-500 mt-1">Auto-generated incremental ID</p>
              </div>

              {/* Title */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Enter engagement title"
                  required
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
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
                    onChange={(e) => setFormData({ ...formData, projectImpact: e.target.value as 'High' | 'Medium' | 'Low' })}
                    className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  >
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                  <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold border ${getImpactBadgeClass(formData.projectImpact)}`}>
                    {formData.projectImpact}
                  </span>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe the scope and objective of this engagement..."
                  required
                  rows={5}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
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
                    value="Open"
                    disabled
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-600 cursor-not-allowed"
                  />
                  <p className="text-xs text-gray-500 mt-1">Default status for new engagements</p>
                </div>
              )}

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
                  {isEditMode ? 'Save Changes' : 'Create Engagement'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}