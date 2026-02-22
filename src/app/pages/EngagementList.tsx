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
} from 'lucide-react';
import { VendorEngagementCard } from '../components/VendorEngagementCard';

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

// Mock data - In real app, this would come from RFQ awards
const mockVendorEngagements: VendorEngagement[] = [
  {
    vendorEngagementId: 'VE-0001',
    engagementId: 'ENG-0001',
    workOrderId: 'WO-0001',
    vendorName: 'CloudTech Solutions',
    projectTitle: 'Cloud Infrastructure Modernization',
    awardAmount: 285000,
    status: 'Active',
    startDate: '2026-02-20',
    department: 'IT Operations',
    awardedBy: 'Sarah Johnson',
    decisionReason: 'Strong proposal with proven AWS expertise and competitive pricing',
    milestones: [
      {
        id: 'M-0001',
        activity: 'Initial Setup',
        dueDate: '2026-03-01',
        amount: 50000,
        status: 'Pending',
      },
      {
        id: 'M-0002',
        activity: 'Configuration',
        dueDate: '2026-04-01',
        amount: 100000,
        status: 'In Progress',
      },
      {
        id: 'M-0003',
        activity: 'Testing',
        dueDate: '2026-05-01',
        amount: 50000,
        status: 'Submitted',
      },
      {
        id: 'M-0004',
        activity: 'Deployment',
        dueDate: '2026-06-01',
        amount: 85000,
        status: 'Approved',
      },
    ],
    invoices: [
      {
        id: 'INV-0001',
        amount: 50000,
        status: 'Draft',
        createdDate: '2026-03-01',
      },
      {
        id: 'INV-0002',
        amount: 100000,
        status: 'Submitted',
        createdDate: '2026-04-01',
      },
      {
        id: 'INV-0003',
        amount: 50000,
        status: 'Approved',
        createdDate: '2026-05-01',
      },
      {
        id: 'INV-0004',
        amount: 85000,
        status: 'Paid',
        createdDate: '2026-06-01',
      },
    ],
  },
  {
    vendorEngagementId: 'VE-0002',
    engagementId: 'ENG-0003',
    workOrderId: 'WO-0005',
    vendorName: 'SecureNet Systems',
    projectTitle: 'Network Security Infrastructure Upgrade',
    awardAmount: 450000,
    status: 'In Progress',
    startDate: '2026-01-15',
    department: 'IT Security',
    awardedBy: 'Michael Chen',
    decisionReason: 'Best-in-class security credentials and comprehensive approach',
    milestones: [
      {
        id: 'M-0005',
        activity: 'Initial Assessment',
        dueDate: '2026-02-01',
        amount: 50000,
        status: 'Pending',
      },
      {
        id: 'M-0006',
        activity: 'Configuration',
        dueDate: '2026-03-01',
        amount: 100000,
        status: 'In Progress',
      },
      {
        id: 'M-0007',
        activity: 'Testing',
        dueDate: '2026-04-01',
        amount: 50000,
        status: 'Submitted',
      },
      {
        id: 'M-0008',
        activity: 'Deployment',
        dueDate: '2026-05-01',
        amount: 250000,
        status: 'Approved',
      },
    ],
    invoices: [
      {
        id: 'INV-0005',
        amount: 50000,
        status: 'Draft',
        createdDate: '2026-02-01',
      },
      {
        id: 'INV-0006',
        amount: 100000,
        status: 'Submitted',
        createdDate: '2026-03-01',
      },
      {
        id: 'INV-0007',
        amount: 50000,
        status: 'Approved',
        createdDate: '2026-04-01',
      },
      {
        id: 'INV-0008',
        amount: 250000,
        status: 'Paid',
        createdDate: '2026-05-01',
      },
    ],
  },
  {
    vendorEngagementId: 'VE-0003',
    engagementId: 'ENG-0006',
    workOrderId: 'WO-0008',
    vendorName: 'DataViz Analytics',
    projectTitle: 'Business Intelligence Dashboard Implementation',
    awardAmount: 125000,
    status: 'Completed',
    startDate: '2025-11-01',
    endDate: '2026-02-01',
    department: 'Finance',
    awardedBy: 'Jennifer Lopez',
    decisionReason: 'Lowest bid with proven track record in BI implementations',
    milestones: [
      {
        id: 'M-0009',
        activity: 'Initial Setup',
        dueDate: '2025-11-15',
        amount: 25000,
        status: 'Pending',
      },
      {
        id: 'M-0010',
        activity: 'Configuration',
        dueDate: '2025-12-15',
        amount: 50000,
        status: 'In Progress',
      },
      {
        id: 'M-0011',
        activity: 'Testing',
        dueDate: '2026-01-15',
        amount: 25000,
        status: 'Submitted',
      },
      {
        id: 'M-0012',
        activity: 'Deployment',
        dueDate: '2026-02-01',
        amount: 25000,
        status: 'Approved',
      },
    ],
    invoices: [
      {
        id: 'INV-0009',
        amount: 25000,
        status: 'Draft',
        createdDate: '2025-11-15',
      },
      {
        id: 'INV-0010',
        amount: 50000,
        status: 'Submitted',
        createdDate: '2025-12-15',
      },
      {
        id: 'INV-0011',
        amount: 25000,
        status: 'Approved',
        createdDate: '2026-01-15',
      },
      {
        id: 'INV-0012',
        amount: 25000,
        status: 'Paid',
        createdDate: '2026-02-01',
      },
    ],
  },
];

export function EngagementList() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date' | 'value'>('date');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
  const [editingMilestone, setEditingMilestone] = useState<{ engagementId: string; milestoneId: string } | null>(null);
  const [milestoneFormData, setMilestoneFormData] = useState({
    activity: '',
    dueDate: '',
    amount: '',
    status: 'Pending' as Milestone['status'],
  });

  const vendorEngagements = mockVendorEngagements;
  const departments = Array.from(new Set(vendorEngagements.map((e) => e.department)));

  const filteredEngagements = vendorEngagements
    .filter((eng) => {
      const matchesSearch =
        eng.projectTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
        eng.vendorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        eng.vendorEngagementId.toLowerCase().includes(searchTerm.toLowerCase()) ||
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
        return new Date(b.startDate).getTime() - new Date(a.startDate).getTime();
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
              <span className="text-sm text-gray-600 font-medium">Sort by:</span>
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
              Vendor engagements are created automatically when a work order is awarded.
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
                <p className="text-gray-500">No engagements match your filters</p>
                <p className="text-sm text-gray-400 mt-1">
                  Try adjusting your search or filter criteria
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredEngagements.map((engagement) => (
                <VendorEngagementCard key={engagement.vendorEngagementId} engagement={engagement} />
              ))}
            </div>
          )}

          {/* Results Count */}
          <div className="text-sm text-gray-600">
            Showing <span className="font-medium">{filteredEngagements.length}</span> of{' '}
            <span className="font-medium">{vendorEngagements.length}</span> vendor engagements
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
                        <p className="text-gray-500">No engagements match your filters</p>
                        <p className="text-sm text-gray-400 mt-1">
                          Try adjusting your search or filter criteria
                        </p>
                      </td>
                    </tr>
                  ) : (
                    filteredEngagements.map((engagement) => (
                      <tr
                        key={engagement.vendorEngagementId}
                        onClick={() => router.push(`/engagements/${engagement.vendorEngagementId}`)}
                        className="hover:bg-gray-50 transition-colors cursor-pointer"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm font-mono font-medium text-gray-900">
                            {engagement.vendorEngagementId}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Link
                            href="/engagements"
                            onClick={(e) => e.stopPropagation()}
                            className="text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline"
                          >
                            {engagement.engagementId}
                          </Link>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Link
                            href={`/rfqs/${engagement.workOrderId}`}
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
            Showing <span className="font-medium">{filteredEngagements.length}</span> of{' '}
            <span className="font-medium">{vendorEngagements.length}</span> vendor engagements
          </div>
        </>
      )}
    </div>
  );
}