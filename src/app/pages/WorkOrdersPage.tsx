import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import { Plus, FileCheck, Search, Filter, Loader2 } from 'lucide-react';
import { StatusBadge } from '../components/StatusBadge';
import { CreateWorkOrderModal } from '../components/CreateWorkOrderModal';

// ─── Types ──────────────────────────────────────────────────────────────────

interface WorkOrder {
  id: string;
  work_order_number: number;
  engagement_id: string | null;
  title: string;
  description: string;
  submission_deadline: string | null;
  notes: string | null;
  status: string;
  created_at: string;
  created_by: string | null;
}

// ─── Status helpers ─────────────────────────────────────────────────────────

type BadgeStatus = 'draft' | 'open' | 'in-progress' | 'completed' | 'awarded';

function toBadgeStatus(status: string): BadgeStatus {
  const map: Record<string, BadgeStatus> = {
    draft: 'draft',
    open: 'open',
    in_progress: 'in-progress',
    completed: 'completed',
    awarded: 'awarded',
  };
  return map[status] ?? 'draft';
}

// ─── Date formatter ─────────────────────────────────────────────────────────

function formatDate(dateStr: string) {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

// ─── Component ──────────────────────────────────────────────────────────────

interface EngagementLookup {
  id: string;
  engagement_number: number;
  title: string;
}

export function WorkOrdersPage() {
  const router = useRouter();
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [engagements, setEngagements] = useState<EngagementLookup[]>([]);
  const [submissionCounts, setSubmissionCounts] = useState<
    Record<string, number>
  >({});
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // ── Fetch ──────────────────────────────────────────────────────────────
  const fetchWorkOrders = useCallback(async () => {
    setIsLoading(true);
    setFetchError(null);

    try {
      const [woRes, engRes] = await Promise.all([
        fetch('/api/work-orders'),
        fetch('/api/engagements'),
      ]);

      if (!woRes.ok) {
        throw new Error('Failed to load work orders.');
      }

      const woJson = await woRes.json();
      const woList: WorkOrder[] = woJson.data ?? [];
      setWorkOrders(woList);

      if (engRes.ok) {
        const engJson = await engRes.json();
        setEngagements(engJson.data ?? []);
      }

      // Fetch submission counts for each work order
      const counts: Record<string, number> = {};
      await Promise.all(
        woList.map(async (wo) => {
          try {
            const res = await fetch(`/api/work-orders/${wo.id}/submissions`);
            if (res.ok) {
              const json = await res.json();
              counts[wo.id] = (json.data ?? []).length;
            } else {
              counts[wo.id] = 0;
            }
          } catch {
            counts[wo.id] = 0;
          }
        })
      );
      setSubmissionCounts(counts);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'An unexpected error occurred.';
      setFetchError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ── Engagement lookup helper ───────────────────────────────────────────
  const getEngagementLabel = (engId: string | null) => {
    if (!engId) return '—';
    const eng = engagements.find((e) => e.id === engId);
    if (eng) {
      return `ENG-${String(eng.engagement_number).padStart(4, '0')} — ${eng.title}`;
    }
    return engId.substring(0, 8) + '…';
  };

  useEffect(() => {
    fetchWorkOrders();
  }, [fetchWorkOrders]);

  // ── Filter logic ───────────────────────────────────────────────────────
  const filteredWorkOrders = workOrders.filter((wo) => {
    const search = searchTerm.toLowerCase();
    const matchesSearch =
      String(wo.work_order_number).toLowerCase().includes(search) ||
      wo.title.toLowerCase().includes(search) ||
      (wo.engagement_id ?? '').toLowerCase().includes(search);

    const matchesStatus = statusFilter === 'all' || wo.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900">Work Orders</h1>
          <p className="text-gray-500 mt-1">
            Manage and track work orders across engagements
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-semibold shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Create Work Order
        </button>
      </div>

      {/* Filters */}
      {!isLoading && workOrders.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="relative md:col-span-2">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by WO number, title, or engagement…"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
              />
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
                <option value="draft">Draft</option>
                <option value="open">Open</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="awarded">Awarded</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12">
          <div className="flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            <p className="text-sm text-gray-500">Loading work orders…</p>
          </div>
        </div>
      )}

      {/* Error State */}
      {!isLoading && fetchError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-700">{fetchError}</p>
          <button
            onClick={fetchWorkOrders}
            className="mt-2 text-sm font-semibold text-red-700 underline hover:text-red-800"
          >
            Retry
          </button>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !fetchError && workOrders.length === 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12">
          <div className="max-w-md mx-auto text-center">
            <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileCheck className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No work orders yet
            </h3>
            <p className="text-gray-600 text-sm mb-6">
              Create your first work order to start tracking scope of work for
              your engagements.
            </p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-semibold shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Create Work Order
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      {!isLoading && !fetchError && workOrders.length > 0 && (
        <>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Work Order ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Engagement ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Engagement Title
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Submissions
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Created Date
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredWorkOrders.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center">
                        <p className="text-gray-500">
                          No work orders match your filters
                        </p>
                        <p className="text-sm text-gray-400 mt-1">
                          Try adjusting your search or filter criteria
                        </p>
                      </td>
                    </tr>
                  ) : (
                    filteredWorkOrders.map((wo) => {
                      const eng = engagements.find(
                        (e) => e.id === wo.engagement_id
                      );
                      const engCode = eng
                        ? `ENG-${String(eng.engagement_number).padStart(4, '0')}`
                        : '—';
                      const engTitle = eng ? eng.title : '—';

                      return (
                        <tr
                          key={wo.id}
                          onClick={() => router.push(`/work-orders/${wo.id}`)}
                          className="hover:bg-gray-50 transition-colors cursor-pointer"
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm font-medium text-gray-900">
                              WO-{String(wo.work_order_number).padStart(4, '0')}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm font-medium text-blue-600">
                              {engCode}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-sm text-gray-900">
                              {engTitle}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold">
                              {submissionCounts[wo.id] ?? 0}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <StatusBadge status={toBadgeStatus(wo.status)} />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm text-gray-600">
                              {formatDate(wo.created_at)}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Results Count */}
          <div className="text-sm text-gray-600">
            Showing{' '}
            <span className="font-medium">{filteredWorkOrders.length}</span> of{' '}
            <span className="font-medium">{workOrders.length}</span> work orders
          </div>
        </>
      )}

      {/* Create Modal */}
      <CreateWorkOrderModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        onCreated={fetchWorkOrders}
      />
    </div>
  );
}
