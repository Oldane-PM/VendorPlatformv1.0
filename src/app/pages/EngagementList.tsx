import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import {
  Search,
  Filter,
  Eye,
  ArrowUpDown,
  FileCheck,
  LayoutGrid,
  LayoutList,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { VendorEngagementCard } from '../components/VendorEngagementCard';
import { useVendorEngagements } from '@/lib/hooks/useVendorEngagements';

// Milestone type
interface Milestone {
  id: string;
  activity: string;
  dueDate: string;
  amount: number;
  status: 'Pending' | 'In Progress' | 'Submitted' | 'Approved' | 'Paid';
}

// Invoice type
interface Invoice {
  id: string;
  amount: number;
  status: 'Draft' | 'Submitted' | 'Approved' | 'Paid';
  createdDate: string;
}

// Vendor Engagement type
interface VendorEngagement {
  vendorEngagementId: string;
  engagementId: string;
  engagementUuid: string | null;
  workOrderId: string;
  workOrderUuid: string | null;
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

// mock data removed, using live Supabase data now

export function EngagementList() {
  const {
    vendorEngagements: rawData,
    isLoading,
    error,
  } = useVendorEngagements();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date' | 'value'>('date');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
  const [editingMilestone, setEditingMilestone] = useState<{
    engagementId: string;
    milestoneId: string;
  } | null>(null);
  const [milestoneFormData, setMilestoneFormData] = useState({
    activity: '',
    dueDate: '',
    amount: '',
    status: 'Pending' as Milestone['status'],
  });

  // Map DTO to the component's expected format
  const vendorEngagements: VendorEngagement[] = rawData.map((dto) => ({
    vendorEngagementId: dto.vendor_engagement_id,
    engagementId: dto.engagement_id,
    engagementUuid: dto.engagement_uuid,
    workOrderId: dto.work_order_id,
    workOrderUuid: dto.work_order_uuid,
    vendorName: dto.vendor_name,
    projectTitle: dto.project_title,
    awardAmount: dto.award_amount,
    status: (dto.status.charAt(0).toUpperCase() + dto.status.slice(1)) as any, // Capitalize for old style badge
    startDate: dto.start_date || new Date().toISOString(),
    endDate: dto.end_date || undefined,
    department: dto.department || 'Unassigned',
    awardedBy: dto.awarded_by || 'System',
    decisionReason: dto.decision_reason || '',
    milestones: dto.milestones.map((m) => ({
      id: m.id,
      activity: m.activity,
      dueDate: m.due_date,
      amount: m.amount,
      status: m.status as any,
    })),
    invoices: dto.invoices.map((inv) => ({
      id: inv.id,
      amount: inv.amount,
      status: (inv.status.charAt(0).toUpperCase() + inv.status.slice(1)) as any,
      createdDate: inv.created_at,
    })),
  }));

  const departments = Array.from(
    new Set(vendorEngagements.map((e) => e.department))
  );

  const filteredEngagements = vendorEngagements
    .filter((eng) => {
      const matchesSearch =
        eng.projectTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
        eng.vendorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        eng.vendorEngagementId
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        eng.engagementId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        eng.workOrderId.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus =
        statusFilter === 'all' || eng.status === statusFilter;

      const matchesDepartment =
        departmentFilter === 'all' || eng.department === departmentFilter;

      return matchesSearch && matchesStatus && matchesDepartment;
    })
    .sort((a, b) => {
      if (sortBy === 'date') {
        return (
          new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
        );
      } else {
        return b.awardAmount - a.awardAmount;
      }
    });

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

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const router = useRouter();

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-white rounded-xl shadow-sm border border-gray-200 min-h-[400px]">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin mb-4" />
        <p className="text-gray-500 font-medium">
          Loading vendor engagements...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 flex items-start gap-4">
        <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
        <div>
          <h3 className="text-red-800 font-medium">
            Error loading vendor engagements
          </h3>
          <p className="text-red-600 text-sm mt-1">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900">
            Vendor Engagements
          </h1>
          <p className="text-gray-500 mt-1">
            Active and completed awarded vendor work
          </p>
        </div>
      </div>

      {/* Filters */}
      {vendorEngagements.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative md:col-span-2">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by title, vendor, or ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
              />
            </div>

            {/* Department Filter */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
              <select
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent appearance-none bg-white text-sm"
              >
                <option value="all">All Departments</option>
                {departments.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
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
                <option value="Active">Active</option>
                <option value="In Progress">In Progress</option>
                <option value="On Hold">On Hold</option>
                <option value="Completed">Completed</option>
                <option value="Terminated">Terminated</option>
              </select>
            </div>
          </div>

          {/* View Toggle and Sort Options */}
          <div className="flex items-center justify-between mt-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600 font-medium">
                Sort by:
              </span>
              <button
                onClick={() => setSortBy('date')}
                className={`text-sm px-3 py-1 rounded ${
                  sortBy === 'date'
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Date
              </button>
              <button
                onClick={() => setSortBy('value')}
                className={`text-sm px-3 py-1 rounded ${
                  sortBy === 'value'
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Value
              </button>
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg">
              <button
                onClick={() => setViewMode('table')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'table'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <LayoutList className="w-4 h-4" />
                Table View
              </button>
              <button
                onClick={() => setViewMode('cards')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'cards'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <LayoutGrid className="w-4 h-4" />
                Card View
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Engagements - Card or Table View */}
      {vendorEngagements.length === 0 ? (
        // Empty State
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12">
          <div className="max-w-md mx-auto text-center">
            <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileCheck className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No vendor engagements yet
            </h3>
            <p className="text-gray-600 text-sm mb-6">
              Vendor engagements are created automatically when a work order is
              awarded.
            </p>
            <Link
              href="/rfqs"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-semibold shadow-sm"
            >
              View Work Orders
            </Link>
          </div>
        </div>
      ) : viewMode === 'cards' ? (
        // Card View
        <>
          {filteredEngagements.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12">
              <div className="max-w-md mx-auto text-center">
                <p className="text-gray-500">
                  No engagements match your filters
                </p>
                <p className="text-sm text-gray-400 mt-1">
                  Try adjusting your search or filter criteria
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredEngagements.map((engagement) => (
                <VendorEngagementCard
                  key={engagement.vendorEngagementId}
                  engagement={engagement}
                />
              ))}
            </div>
          )}

          {/* Results Count */}
          <div className="text-sm text-gray-600">
            Showing{' '}
            <span className="font-medium">{filteredEngagements.length}</span> of{' '}
            <span className="font-medium">{vendorEngagements.length}</span>{' '}
            vendor engagements
          </div>
        </>
      ) : (
        // Table View
        <>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Vendor Engagement ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Engagement ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Work Order ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Vendor Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Project Title
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      <div className="flex items-center gap-1">
                        Award Amount
                        <ArrowUpDown className="w-3 h-3" />
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Start Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      End Date
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredEngagements.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="px-6 py-12 text-center">
                        <p className="text-gray-500">
                          No engagements match your filters
                        </p>
                        <p className="text-sm text-gray-400 mt-1">
                          Try adjusting your search or filter criteria
                        </p>
                      </td>
                    </tr>
                  ) : (
                    filteredEngagements.map((engagement) => (
                      <tr
                        key={engagement.vendorEngagementId}
                        onClick={() =>
                          engagement.engagementUuid &&
                          router.push(
                            `/engagements/${engagement.engagementUuid}`
                          )
                        }
                        className="hover:bg-gray-50 transition-colors cursor-pointer"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm font-mono font-medium text-gray-900">
                            {engagement.vendorEngagementId}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Link
                            href={
                              engagement.engagementUuid
                                ? `/engagements/${engagement.engagementUuid}`
                                : '/engagements'
                            }
                            onClick={(e) => e.stopPropagation()}
                            className="text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline"
                          >
                            {engagement.engagementId}
                          </Link>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Link
                            href={
                              engagement.workOrderUuid
                                ? `/work-orders/${engagement.workOrderUuid}`
                                : '/work-orders'
                            }
                            onClick={(e) => e.stopPropagation()}
                            className="text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline"
                          >
                            {engagement.workOrderId}
                          </Link>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm font-medium text-gray-900">
                            {engagement.vendorName}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-gray-900 line-clamp-2">
                            {engagement.projectTitle}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm font-semibold text-gray-900">
                            {formatCurrency(engagement.awardAmount)}
                          </span>
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
                          <span className="text-sm text-gray-600">
                            {formatDate(engagement.startDate)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {engagement.endDate ? (
                            <span className="text-sm text-gray-600">
                              {formatDate(engagement.endDate)}
                            </span>
                          ) : (
                            <span className="text-sm text-gray-400">—</span>
                          )}
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
            Showing{' '}
            <span className="font-medium">{filteredEngagements.length}</span> of{' '}
            <span className="font-medium">{vendorEngagements.length}</span>{' '}
            vendor engagements
          </div>
        </>
      )}
    </div>
  );
}
