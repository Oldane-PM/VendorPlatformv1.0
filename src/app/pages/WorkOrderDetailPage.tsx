import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import {
  ArrowLeft,
  Calendar,
  Loader2,
  Trophy,
  AlertTriangle,
  Star,
  FileText,
  Paperclip,
  TrendingDown,
} from 'lucide-react';
import { StatusBadge } from '../components/StatusBadge';

// ─── Types ──────────────────────────────────────────────────────────────────

interface WorkOrder {
  id: string;
  work_order_number: number;
  engagement_id: string | null;
  title: string;
  description: string | null;
  submission_deadline: string | null;
  notes: string | null;
  status: string;
  created_at: string;
  created_by: string | null;
}

interface Engagement {
  id: string;
  engagement_number: number;
  title: string;
  description?: string;
  status: string;
}

// ─── Mock Vendor Submissions ────────────────────────────────────────────────
// These will be replaced with real data once vendor_submissions table is built

interface VendorSubmission {
  id: string;
  vendorName: string;
  quoteNumber: string;
  quoteTotal: number;
  taxes: number;
  submissionDate: string;
  complianceStatus: 'complete' | 'missing_docs' | 'pending';
  attachmentCount: number;
  deliveryTimeline: string;
  warranty: string;
  paymentTerms: string;
  performanceRating: number | null;
  aiSummary: string;
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

function formatDate(dateStr: string) {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

// ─── Compliance Badge ───────────────────────────────────────────────────────

function ComplianceBadge({ status }: { status: string }) {
  if (status === 'complete') {
    return (
      <span className="inline-flex items-center gap-1.5 text-sm">
        <span className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center">
          <svg
            className="w-3 h-3 text-green-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={3}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M5 13l4 4L19 7"
            />
          </svg>
        </span>
        <span className="text-green-700 font-medium">Complete</span>
      </span>
    );
  }
  if (status === 'missing_docs') {
    return (
      <span className="inline-flex items-center gap-1.5 text-sm">
        <AlertTriangle className="w-4 h-4 text-amber-500" />
        <span className="text-amber-700 font-medium">Missing Docs</span>
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-sm">
      <span className="w-2 h-2 rounded-full bg-gray-400" />
      <span className="text-gray-600">Pending</span>
    </span>
  );
}

// ─── Star Rating ────────────────────────────────────────────────────────────

function StarRating({ rating }: { rating: number | null }) {
  if (rating === null) return <span className="text-gray-400 text-sm">—</span>;
  const fullStars = Math.floor(rating);
  const hasHalf = rating % 1 >= 0.5;
  return (
    <span className="inline-flex items-center gap-1">
      {[...Array(5)].map((_, i) => (
        <Star
          key={i}
          className={`w-4 h-4 ${
            i < fullStars
              ? 'text-amber-400 fill-amber-400'
              : i === fullStars && hasHalf
                ? 'text-amber-400 fill-amber-200'
                : 'text-gray-300'
          }`}
        />
      ))}
      <span className="text-sm font-medium text-gray-700 ml-1">{rating}</span>
    </span>
  );
}

// ─── Component ──────────────────────────────────────────────────────────────

export function WorkOrderDetailPage() {
  const router = useRouter();
  const { workOrderId } = router.query;

  const [workOrder, setWorkOrder] = useState<WorkOrder | null>(null);
  const [engagement, setEngagement] = useState<Engagement | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'table' | 'comparison'>('table');

  // Award decision state
  const [selectedVendor, setSelectedVendor] = useState('');
  const [selectionReason, setSelectionReason] = useState('');
  const [rejectionNotes, setRejectionNotes] = useState('');

  // Mock submissions — replace with real data later
  const [submissions] = useState<VendorSubmission[]>([]);

  // ── Fetch work order ──────────────────────────────────────────────────
  const fetchWorkOrder = useCallback(async () => {
    if (!workOrderId) return;

    setIsLoading(true);
    setError(null);

    try {
      // Fetch work order
      const woRes = await fetch(`/api/work-orders/${workOrderId}`);
      if (!woRes.ok) throw new Error('Work order not found.');
      const woJson = await woRes.json();
      const wo = woJson.data;
      setWorkOrder(wo);

      // Fetch engagement if linked
      if (wo?.engagement_id) {
        const engRes = await fetch('/api/engagements');
        if (engRes.ok) {
          const engJson = await engRes.json();
          const engs = engJson.data ?? [];
          const linked = engs.find(
            (e: Engagement) => e.id === wo.engagement_id
          );
          setEngagement(linked ?? null);
        }
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'An unexpected error occurred.';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [workOrderId]);

  useEffect(() => {
    fetchWorkOrder();
  }, [fetchWorkOrder]);

  // ── Loading State ─────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // ── Error / Not Found ─────────────────────────────────────────────────
  if (error || !workOrder) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <button
          onClick={() => router.push('/work-orders')}
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Work Orders
        </button>
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <p className="text-red-700 font-medium">
            {error ?? 'Work order not found.'}
          </p>
        </div>
      </div>
    );
  }

  const woNumber = `WO-${String(workOrder.work_order_number).padStart(4, '0')}`;
  const engCode = engagement
    ? `ENG-${String(engagement.engagement_number).padStart(4, '0')}`
    : null;

  // Find the lowest quote
  const lowestQuote =
    submissions.length > 0
      ? Math.min(...submissions.map((s) => s.quoteTotal))
      : 0;

  return (
    <div className="max-w-[1100px] mx-auto p-6">
      {/* ── Back Navigation ──────────────────────────────────────────────── */}
      <button
        onClick={() => router.push('/work-orders')}
        className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Work Orders
      </button>

      {/* ── Header Card ──────────────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-6">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold text-gray-900">{woNumber}</h1>
              <StatusBadge status={toBadgeStatus(workOrder.status)} />
            </div>
            <p className="text-lg text-gray-700">{workOrder.title}</p>
          </div>
          <div className="text-right">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Submissions
            </p>
            <p className="text-3xl font-bold text-gray-900">
              {submissions.length}
            </p>
          </div>
        </div>

        {/* Linked Engagement & Submission Deadline */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6 pt-6 border-t border-gray-100">
          {/* Linked Engagement */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              Linked Engagement
            </p>
            {engagement ? (
              <>
                <p className="text-sm font-semibold text-blue-600 mb-1">
                  {engCode} - {engagement.title}
                </p>
                {engagement.description && (
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {engagement.description}
                  </p>
                )}
              </>
            ) : (
              <p className="text-sm text-gray-400">No engagement linked</p>
            )}
          </div>

          {/* Submission Deadline */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              Submission Deadline
            </p>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-900">
                {workOrder.submission_deadline
                  ? formatDate(workOrder.submission_deadline)
                  : '—'}
              </span>
            </div>
          </div>
        </div>

        {/* Notes */}
        {workOrder.notes && (
          <div className="mt-6 pt-6 border-t border-gray-100">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              Notes
            </p>
            <p className="text-sm text-gray-700 leading-relaxed">
              {workOrder.notes}
            </p>
          </div>
        )}
      </div>

      {/* ── Vendor Submissions ───────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm mb-6">
        {/* Section Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-900">
            Vendor Submissions
          </h2>
          <div className="flex rounded-lg border border-gray-200 overflow-hidden">
            <button
              onClick={() => setViewMode('table')}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                viewMode === 'table'
                  ? 'bg-gray-900 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              Table View
            </button>
            <button
              onClick={() => setViewMode('comparison')}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                viewMode === 'comparison'
                  ? 'bg-gray-900 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              Comparison View
            </button>
          </div>
        </div>

        {/* Table View */}
        {viewMode === 'table' && (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Vendor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Quote Total
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Taxes
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Submission Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Compliance Status
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Attachments
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {submissions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <FileText className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500 font-medium">
                        No vendor submissions yet
                      </p>
                      <p className="text-sm text-gray-400 mt-1">
                        Vendor submissions will appear here once vendors respond
                        to this work order.
                      </p>
                    </td>
                  </tr>
                ) : (
                  submissions.map((sub) => (
                    <tr
                      key={sub.id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <p className="text-sm font-medium text-gray-900">
                          {sub.vendorName}
                        </p>
                        <p className="text-xs text-gray-500">
                          {sub.quoteNumber}
                        </p>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-semibold text-gray-900">
                          {formatCurrency(sub.quoteTotal)}
                        </span>
                        {sub.quoteTotal === lowestQuote && (
                          <span className="inline-flex items-center gap-1 ml-2 px-2 py-0.5 rounded-full bg-green-50 text-green-700 text-xs font-medium">
                            <TrendingDown className="w-3 h-3" />
                            Lowest
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-700">
                          {formatCurrency(sub.taxes)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-700">
                          {formatDate(sub.submissionDate)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <ComplianceBadge status={sub.complianceStatus} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className="inline-flex items-center gap-1.5 text-sm text-gray-600">
                          <Paperclip className="w-4 h-4" />
                          {sub.attachmentCount}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Comparison View */}
        {viewMode === 'comparison' && (
          <div className="overflow-x-auto">
            {submissions.length === 0 ? (
              <div className="px-6 py-12 text-center">
                <FileText className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 font-medium">
                  No vendor submissions to compare
                </p>
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider min-w-[160px]">
                      Attributes
                    </th>
                    {submissions.map((sub) => (
                      <th
                        key={sub.id}
                        className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider"
                      >
                        {sub.vendorName}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {/* Quote Number */}
                  <tr>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      Quote Number
                    </td>
                    {submissions.map((sub) => (
                      <td
                        key={sub.id}
                        className="px-6 py-4 text-sm text-gray-700"
                      >
                        {sub.quoteNumber}
                      </td>
                    ))}
                  </tr>
                  {/* Total Amount */}
                  <tr className="bg-gray-50/50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      Total Amount
                    </td>
                    {submissions.map((sub) => (
                      <td key={sub.id} className="px-6 py-4 text-sm">
                        <span className="font-semibold text-gray-900">
                          {formatCurrency(sub.quoteTotal)}
                        </span>
                        {sub.quoteTotal === lowestQuote && (
                          <span className="inline-flex items-center gap-1 ml-2 px-2 py-0.5 rounded-full bg-green-50 text-green-700 text-xs font-medium">
                            <TrendingDown className="w-3 h-3" />
                            Lowest
                          </span>
                        )}
                      </td>
                    ))}
                  </tr>
                  {/* Taxes */}
                  <tr>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      Taxes
                    </td>
                    {submissions.map((sub) => (
                      <td
                        key={sub.id}
                        className="px-6 py-4 text-sm text-gray-700"
                      >
                        {formatCurrency(sub.taxes)}
                      </td>
                    ))}
                  </tr>
                  {/* Delivery Timeline */}
                  <tr className="bg-gray-50/50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      Delivery Timeline
                    </td>
                    {submissions.map((sub) => (
                      <td
                        key={sub.id}
                        className="px-6 py-4 text-sm text-gray-700"
                      >
                        {sub.deliveryTimeline}
                      </td>
                    ))}
                  </tr>
                  {/* Warranty */}
                  <tr>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      Warranty
                    </td>
                    {submissions.map((sub) => (
                      <td
                        key={sub.id}
                        className="px-6 py-4 text-sm text-gray-700"
                      >
                        {sub.warranty}
                      </td>
                    ))}
                  </tr>
                  {/* Payment Terms */}
                  <tr className="bg-gray-50/50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      Payment Terms
                    </td>
                    {submissions.map((sub) => (
                      <td
                        key={sub.id}
                        className="px-6 py-4 text-sm text-gray-700"
                      >
                        {sub.paymentTerms}
                      </td>
                    ))}
                  </tr>
                  {/* Compliance Status */}
                  <tr>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      Compliance Status
                    </td>
                    {submissions.map((sub) => (
                      <td key={sub.id} className="px-6 py-4">
                        <ComplianceBadge status={sub.complianceStatus} />
                      </td>
                    ))}
                  </tr>
                  {/* Performance Rating */}
                  <tr className="bg-gray-50/50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      Performance Rating
                    </td>
                    {submissions.map((sub) => (
                      <td key={sub.id} className="px-6 py-4">
                        <StarRating rating={sub.performanceRating} />
                        {sub.performanceRating && (
                          <a
                            href="#"
                            className="text-xs text-blue-600 hover:underline mt-1 inline-block"
                          >
                            View Profile →
                          </a>
                        )}
                      </td>
                    ))}
                  </tr>
                  {/* AI Summary */}
                  <tr>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900 align-top">
                      AI Summary
                    </td>
                    {submissions.map((sub) => (
                      <td
                        key={sub.id}
                        className="px-6 py-4 text-sm text-gray-600 leading-relaxed"
                      >
                        {sub.aiSummary}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>

      {/* ── Award Decision ───────────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm mb-6">
        <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-200">
          <Trophy className="w-5 h-5 text-amber-500" />
          <h2 className="text-lg font-bold text-gray-900">Award Decision</h2>
        </div>

        <div className="p-6 space-y-5">
          {/* Selected Vendor */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Selected Vendor <span className="text-red-500">*</span>
            </label>
            <select
              value={selectedVendor}
              onChange={(e) => setSelectedVendor(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent appearance-none bg-white"
            >
              <option value="">Select winning vendor...</option>
              {submissions.map((sub) => (
                <option key={sub.id} value={sub.id}>
                  {sub.vendorName}
                </option>
              ))}
            </select>
          </div>

          {/* Reason for Selection */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Reason for Selection <span className="text-red-500">*</span>
            </label>
            <textarea
              value={selectionReason}
              onChange={(e) => setSelectionReason(e.target.value)}
              placeholder="Provide detailed reasoning for vendor selection (required for audit trail)..."
              rows={3}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
            />
          </div>

          {/* Rejection Notes */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Rejection Notes (Optional)
            </label>
            <textarea
              value={rejectionNotes}
              onChange={(e) => setRejectionNotes(e.target.value)}
              placeholder="Optional notes for rejected vendors..."
              rows={3}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
            />
          </div>

          {/* Governance Requirements */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-amber-800 mb-2">
                  Governance Requirements
                </p>
                <ul className="space-y-1">
                  <li className="text-sm text-amber-700">
                    • Award decision is permanent and logged for audit
                  </li>
                  <li className="text-sm text-amber-700">
                    • Reason for selection is mandatory
                  </li>
                  <li className="text-sm text-amber-700">
                    • Work Order status will change to &quot;Awarded&quot; and
                    Engagement will be linked to selected vendor
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-xl">
          <button className="px-5 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors text-sm font-medium">
            Close Work Order
          </button>
          <button
            disabled={!selectedVendor || !selectionReason.trim()}
            className="px-5 py-2.5 bg-primary text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-semibold shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Award Vendor
          </button>
        </div>
      </div>
    </div>
  );
}
