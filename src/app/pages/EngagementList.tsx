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
import { MonthPicker } from '../components/MonthPicker';
import { SearchableSelect } from '../components/SearchableSelect';

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
  const [dateFilter, setDateFilter] = useState('');
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

      const matchesDate =
        !dateFilter ||
        (eng.startDate &&
          new Date(eng.startDate).toISOString().slice(0, 7) === dateFilter);

      return matchesSearch && matchesStatus && matchesDepartment && matchesDate;
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
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900">
            Vendor Engagements
          </h1>
          <p className="text-gray-500 mt-1">
            Active and completed awarded vendor work
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
              <LayoutList className="w-4 h-4" />
              <span className="hidden sm:inline">Table</span>
            </button>
          </div>
        </div>
      </div>

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
            {/* Filter Bar inside table */}
            <div className="bg-gray-50 border-b border-gray-200 px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-3">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by title, vendor, or ID..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 pr-3 py-1.5 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-primary focus:border-transparent w-56"
                  />
                </div>

                {/* Department Filter */}
                <SearchableSelect
                  value={departmentFilter}
                  onChange={(val) => setDepartmentFilter(val)}
                  icon={<Filter className="w-4 h-4" />}
                  width="w-48"
                  placeholder="All Departments"
                  searchPlaceholder="Search departments..."
                  options={[
                    { label: 'All Departments', value: 'all' },
                    ...departments.map((dept) => ({
                      label: dept,
                      value: dept,
                    })),
                  ]}
                />

                {/* Status Filter */}
                <SearchableSelect
                  value={statusFilter}
                  onChange={(val) => setStatusFilter(val)}
                  icon={<Filter className="w-4 h-4" />}
                  width="w-44"
                  placeholder="All Status"
                  searchPlaceholder="Search status..."
                  options={[
                    { label: 'All Status', value: 'all' },
                    { label: 'Active', value: 'Active' },
                    { label: 'In Progress', value: 'In Progress' },
                    { label: 'On Hold', value: 'On Hold' },
                    { label: 'Completed', value: 'Completed' },
                    { label: 'Terminated', value: 'Terminated' },
                  ]}
                />

                {/* Sort */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setSortBy('date')}
                    className={`text-xs px-3 py-1.5 rounded-lg ${
                      sortBy === 'date'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    Date
                  </button>
                  <button
                    onClick={() => setSortBy('value')}
                    className={`text-xs px-3 py-1.5 rounded-lg ${
                      sortBy === 'value'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    Value
                  </button>
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
                Showing {filteredEngagements.length} of{' '}
                {vendorEngagements.length} engagements
              </p>
            </div>

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
                          router.push(
                            `/vendor-engagements/${engagement.vendorEngagementId}`
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
