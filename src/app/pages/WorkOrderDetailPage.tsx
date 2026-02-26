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
  ExternalLink,
  Eye,
  Download,
  X,
  Upload,
  Mail,
  Copy,
  Check,
  LinkIcon,
  Clock,
  Ban,
} from 'lucide-react';
import { StatusBadge } from '../components/StatusBadge';
import { Sheet, SheetContent } from '../components/ui/sheet';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table';
import { useWorkOrderSubmissions } from '@/lib/hooks/useWorkOrderSubmissions';
import { useVendorSubmissionDetail } from '@/lib/hooks/useVendorSubmissionDetail';
import { useAwardSubmission } from '@/lib/hooks/useAwardSubmission';
import { useWorkOrderUploadRequests } from '@/lib/hooks/useWorkOrderUploadRequests';

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
  return new Date(dateStr).toLocaleDateString('en-US', {
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

// ─── Sub-status badge ───────────────────────────────────────────────────────

function SubmissionStatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    Submitted: 'bg-blue-50 text-blue-700 border-blue-200',
    'Under Review': 'bg-amber-50 text-amber-700 border-amber-200',
    Awarded: 'bg-green-50 text-green-700 border-green-200',
    Rejected: 'bg-red-50 text-red-700 border-red-200',
  };
  const cls = styles[status] ?? 'bg-gray-50 text-gray-700 border-gray-200';
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${cls}`}
    >
      {status}
    </span>
  );
}

// ─── Compliance Badge ───────────────────────────────────────────────────────

function ComplianceBadge({ status }: { status: string }) {
  if (status === 'complete' || status === 'Complete') {
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
  if (status === 'missing_docs' || status === 'Missing Docs') {
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
  const workOrderIdStr =
    typeof workOrderId === 'string' ? workOrderId : undefined;

  const [workOrder, setWorkOrder] = useState<WorkOrder | null>(null);
  const [engagement, setEngagement] = useState<Engagement | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'table' | 'comparison'>('table');
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Upload request state
  const [showRequestDocModal, setShowRequestDocModal] = useState(false);
  const [reqDocEmail, setReqDocEmail] = useState('');
  const [reqDocVendorId, setReqDocVendorId] = useState('');
  const [reqDocTypes, setReqDocTypes] = useState<string[]>([
    'invoice',
    'quote',
    'supporting',
  ]);
  const [reqDocExpiry, setReqDocExpiry] = useState(72);
  const [reqDocMessage, setReqDocMessage] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);

  // Award decision state
  const [selectedVendor, setSelectedVendor] = useState('');
  const [selectionReason, setSelectionReason] = useState('');
  const [rejectionNotes, setRejectionNotes] = useState('');

  // Hooks
  const {
    submissions,
    isLoading: subsLoading,
    refetch: refetchSubmissions,
  } = useWorkOrderSubmissions(workOrderIdStr);

  const {
    detail: submissionDetail,
    isLoading: detailLoading,
    fetchDetail,
  } = useVendorSubmissionDetail();

  const {
    award,
    isLoading: awardLoading,
    error: awardError,
  } = useAwardSubmission();

  // Upload requests hook
  const {
    requests: uploadRequests,
    isLoading: uploadReqLoading,
    create: createUploadRequest,
    revoke: revokeUploadRequest,
  } = useWorkOrderUploadRequests(workOrderIdStr);

  // ── Fetch work order ──────────────────────────────────────────────────
  const fetchWorkOrder = useCallback(async () => {
    if (!workOrderIdStr) return;

    setIsLoading(true);
    setError(null);

    try {
      const woRes = await fetch(`/api/work-orders/${workOrderIdStr}`);
      if (!woRes.ok) throw new Error('Work order not found.');
      const woJson = await woRes.json();
      const wo = woJson.data;
      setWorkOrder(wo);

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
  }, [workOrderIdStr]);

  useEffect(() => {
    fetchWorkOrder();
  }, [fetchWorkOrder]);

  // ── Toast auto-dismiss ────────────────────────────────────────────────
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  // ── Handlers ──────────────────────────────────────────────────────────
  const handleViewSubmission = async (submissionId: string) => {
    await fetchDetail(submissionId);
    setShowDetailDialog(true);
  };

  const handleAwardFromDialog = async () => {
    if (!submissionDetail || !workOrder) return;

    const result = await award(submissionDetail.id, {
      workOrderId: workOrder.id,
      engagementId: workOrder.engagement_id,
    });

    if (result) {
      setShowDetailDialog(false);
      setToastMessage(
        `${submissionDetail.vendor_name} has been awarded this work order!`
      );
      refetchSubmissions();
      fetchWorkOrder();
    }
  };

  const handleAwardFromForm = async () => {
    if (!selectedVendor || !selectionReason.trim() || !workOrder) return;

    const result = await award(selectedVendor, {
      workOrderId: workOrder.id,
      engagementId: workOrder.engagement_id,
    });

    if (result) {
      setToastMessage('Vendor has been awarded this work order!');
      setSelectedVendor('');
      setSelectionReason('');
      setRejectionNotes('');
      refetchSubmissions();
      fetchWorkOrder();
    }
  };

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

  const lowestQuote =
    submissions.length > 0
      ? Math.min(...submissions.map((s) => s.total_amount))
      : 0;

  return (
    <div className="max-w-[1100px] mx-auto p-6">
      {/* ── Toast ──────────────────────────────────────────────────────── */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 bg-green-600 text-white px-5 py-3 rounded-lg shadow-lg flex items-center gap-2 animate-in slide-in-from-top-2">
          <svg
            className="w-5 h-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M5 13l4 4L19 7"
            />
          </svg>
          {toastMessage}
        </div>
      )}

      {/* ── Back Navigation ──────────────────────────────────────────── */}
      <button
        onClick={() => router.push('/work-orders')}
        className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Work Orders
      </button>

      {/* ── Header Card ──────────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-6">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold text-gray-900">{woNumber}</h1>
              <StatusBadge status={toBadgeStatus(workOrder.status)} />
            </div>
            <p className="text-lg text-gray-700">{workOrder.title}</p>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowRequestDocModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors shadow-sm"
            >
              <Upload className="w-4 h-4" />
              Request Documents
            </button>
            <div className="text-right">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Submissions
              </p>
              <p className="text-3xl font-bold text-gray-900">
                {submissions.length}
              </p>
            </div>
          </div>
        </div>

        {/* Linked Engagement & Submission Deadline */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6 pt-6 border-t border-gray-100">
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

      {/* ── Vendor Submissions ───────────────────────────────────────── */}
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
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Vendor
                  </TableHead>
                  <TableHead className="text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Quote Total
                  </TableHead>
                  <TableHead className="text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Taxes
                  </TableHead>
                  <TableHead className="text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Submission Date
                  </TableHead>
                  <TableHead className="text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Compliance Status
                  </TableHead>
                  <TableHead className="text-xs font-semibold text-gray-700 uppercase tracking-wider text-right">
                    Attachments
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {subsLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12">
                      <Loader2 className="w-6 h-6 animate-spin text-gray-400 mx-auto" />
                    </TableCell>
                  </TableRow>
                ) : submissions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12">
                      <FileText className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500 font-medium">
                        No vendor submissions yet
                      </p>
                      <p className="text-sm text-gray-400 mt-1">
                        Vendor submissions will appear here once vendors respond
                        to this work order.
                      </p>
                    </TableCell>
                  </TableRow>
                ) : (
                  submissions.map((sub) => (
                    <TableRow
                      key={sub.id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      {/* Vendor — name + quote number */}
                      <TableCell>
                        <div>
                          <span className="text-sm font-semibold text-gray-900 block">
                            {sub.vendor_name}
                          </span>
                          {sub.quote_number && (
                            <span className="text-xs text-gray-500">
                              {sub.quote_number}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      {/* Quote Total */}
                      <TableCell>
                        <span className="text-sm font-bold text-gray-900">
                          {formatCurrency(sub.total_amount)}
                        </span>
                        {sub.total_amount === lowestQuote &&
                          submissions.length > 1 && (
                            <span className="inline-flex items-center gap-1 ml-2 px-2 py-0.5 rounded-full bg-green-50 text-green-700 text-xs font-medium">
                              <TrendingDown className="w-3 h-3" />
                              Lowest
                            </span>
                          )}
                      </TableCell>
                      {/* Taxes */}
                      <TableCell>
                        <span className="text-sm text-gray-700">
                          {sub.taxes != null ? formatCurrency(sub.taxes) : '—'}
                        </span>
                      </TableCell>
                      {/* Submission Date */}
                      <TableCell>
                        <span className="text-sm text-gray-700">
                          {formatDate(sub.submitted_at)}
                        </span>
                      </TableCell>
                      {/* Compliance Status */}
                      <TableCell>
                        <ComplianceBadge
                          status={sub.compliance_status || 'Pending'}
                        />
                      </TableCell>
                      {/* Attachments */}
                      <TableCell className="text-right">
                        <button
                          onClick={() => handleViewSubmission(sub.id)}
                          className="inline-flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900 transition-colors"
                        >
                          <Paperclip className="w-4 h-4" />
                          <span className="font-medium">&mdash;</span>
                        </button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
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
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="text-xs font-semibold text-gray-700 uppercase tracking-wider min-w-[160px]">
                      Attributes
                    </TableHead>
                    {submissions.map((sub) => (
                      <TableHead
                        key={sub.id}
                        className="text-xs font-semibold text-gray-700 uppercase tracking-wider"
                      >
                        {sub.vendor_name}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {/* Quote Number */}
                  <TableRow>
                    <TableCell className="font-medium text-gray-900">
                      Quote Number
                    </TableCell>
                    {submissions.map((sub) => (
                      <TableCell key={sub.id} className="text-gray-700">
                        {sub.quote_number || '—'}
                      </TableCell>
                    ))}
                  </TableRow>
                  {/* Total Amount */}
                  <TableRow className="bg-gray-50/50">
                    <TableCell className="font-semibold text-gray-900">
                      Total Amount
                    </TableCell>
                    {submissions.map((sub) => (
                      <TableCell key={sub.id}>
                        <span className="font-bold text-gray-900">
                          {formatCurrency(sub.total_amount)}
                        </span>
                        {sub.total_amount === lowestQuote &&
                          submissions.length > 1 && (
                            <span className="inline-flex items-center gap-1 ml-2 px-2 py-0.5 rounded-full bg-green-50 text-green-700 text-xs font-medium">
                              <TrendingDown className="w-3 h-3" />
                              Lowest
                            </span>
                          )}
                      </TableCell>
                    ))}
                  </TableRow>
                  {/* Taxes */}
                  <TableRow>
                    <TableCell className="font-medium text-gray-900">
                      Taxes
                    </TableCell>
                    {submissions.map((sub) => (
                      <TableCell key={sub.id} className="text-gray-700">
                        {sub.taxes != null ? formatCurrency(sub.taxes) : '—'}
                      </TableCell>
                    ))}
                  </TableRow>
                  {/* Delivery Timeline */}
                  <TableRow className="bg-gray-50/50">
                    <TableCell className="font-medium text-gray-900">
                      Delivery Timeline
                    </TableCell>
                    {submissions.map((sub) => (
                      <TableCell
                        key={sub.id}
                        className="text-blue-600 font-medium"
                      >
                        {sub.delivery_timeline || '—'}
                      </TableCell>
                    ))}
                  </TableRow>
                  {/* Warranty */}
                  <TableRow>
                    <TableCell className="font-medium text-gray-900">
                      Warranty
                    </TableCell>
                    {submissions.map((sub) => (
                      <TableCell key={sub.id} className="text-gray-700">
                        {sub.warranty || '—'}
                      </TableCell>
                    ))}
                  </TableRow>
                  {/* Payment Terms */}
                  <TableRow className="bg-gray-50/50">
                    <TableCell className="font-medium text-gray-900">
                      Payment Terms
                    </TableCell>
                    {submissions.map((sub) => (
                      <TableCell key={sub.id} className="text-gray-700">
                        {sub.payment_terms || '—'}
                      </TableCell>
                    ))}
                  </TableRow>
                  {/* Compliance Status */}
                  <TableRow>
                    <TableCell className="font-medium text-gray-900">
                      Compliance Status
                    </TableCell>
                    {submissions.map((sub) => (
                      <TableCell key={sub.id}>
                        <ComplianceBadge
                          status={sub.compliance_status || 'Pending'}
                        />
                      </TableCell>
                    ))}
                  </TableRow>
                  {/* Performance Rating */}
                  <TableRow className="bg-gray-50/50">
                    <TableCell className="font-medium text-gray-900">
                      Performance Rating
                    </TableCell>
                    {submissions.map((sub) => (
                      <TableCell key={sub.id}>
                        <StarRating rating={sub.performance_rating} />
                        {sub.performance_rating != null && (
                          <a
                            href="#"
                            className="text-xs text-blue-600 hover:underline mt-1 inline-block"
                          >
                            View Profile →
                          </a>
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                  {/* AI Summary */}
                  <TableRow className="bg-purple-50/40">
                    <TableCell className="font-medium text-gray-900 align-top">
                      <div className="flex items-center gap-2">
                        <Star className="w-4 h-4 text-purple-500 fill-purple-500" />
                        AI Summary
                      </div>
                    </TableCell>
                    {submissions.map((sub) => (
                      <TableCell
                        key={sub.id}
                        className="text-gray-600 text-sm leading-relaxed align-top"
                      >
                        {sub.ai_summary || '—'}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableBody>
              </Table>
            )}
          </div>
        )}
      </div>

      {/* ── Award Decision ───────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm mb-6">
        <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-200">
          <Trophy className="w-5 h-5 text-amber-500" />
          <h2 className="text-lg font-bold text-gray-900">Award Decision</h2>
        </div>

        {(() => {
          const awardedSub = submissions.find((s) => s.status === 'Awarded');
          if (awardedSub) {
            return (
              <div className="p-6">
                <div className="bg-green-50 border border-green-200 rounded-xl p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                      <Trophy className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-green-800">
                        Vendor Awarded
                      </p>
                      <p className="text-xs text-green-600">
                        This work order has been awarded
                      </p>
                    </div>
                  </div>
                  <div className="bg-white rounded-lg border border-green-200 p-4 mt-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-base font-bold text-gray-900">
                          {awardedSub.vendor_name}
                        </p>
                        <p className="text-sm text-gray-500 mt-0.5">
                          Quote: {formatCurrency(awardedSub.total_amount)}
                        </p>
                      </div>
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-100 text-green-700 text-xs font-semibold">
                        <Trophy className="w-3.5 h-3.5" />
                        Awarded
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          }

          return (
            <>
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
                        {sub.vendor_name} — {formatCurrency(sub.total_amount)}
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
                          • Work Order status will change to &quot;Awarded&quot;
                          and Engagement will be linked to selected vendor
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Error display */}
                {awardError && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <p className="text-sm text-red-700">{awardError}</p>
                  </div>
                )}
              </div>

              {/* Footer Actions */}
              <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-xl">
                <button className="px-5 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors text-sm font-medium">
                  Close Work Order
                </button>
                <button
                  onClick={handleAwardFromForm}
                  disabled={
                    !selectedVendor || !selectionReason.trim() || awardLoading
                  }
                  className="px-5 py-2.5 bg-primary text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-semibold shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {awardLoading ? (
                    <span className="inline-flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Awarding…
                    </span>
                  ) : (
                    'Award Vendor'
                  )}
                </button>
              </div>
            </>
          );
        })()}
      </div>

      {/* ── Upload Requests Section ──────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm mb-6">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <Mail className="w-5 h-5 text-blue-500" />
            <h2 className="text-lg font-bold text-gray-900">Upload Requests</h2>
          </div>
          <span className="text-sm text-gray-500">
            {uploadRequests.length} request
            {uploadRequests.length !== 1 ? 's' : ''}
          </span>
        </div>

        {uploadReqLoading ? (
          <div className="px-6 py-8 text-center">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400 mx-auto" />
          </div>
        ) : uploadRequests.length === 0 ? (
          <div className="px-6 py-8 text-center">
            <Mail className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No upload requests yet</p>
            <p className="text-sm text-gray-400 mt-1">
              Click &quot;Request Documents&quot; to send an upload link to a
              vendor.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {uploadRequests.map((ur) => (
              <div key={ur.id} className="px-6 py-4 flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900">
                    {ur.request_email}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {ur.file_count} file{ur.file_count !== 1 ? 's' : ''}{' '}
                    uploaded · Expires{' '}
                    {new Date(ur.expires_at).toLocaleDateString()}
                  </p>
                </div>
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                    ur.status === 'completed'
                      ? 'bg-green-50 text-green-700 border-green-200'
                      : ur.status === 'revoked'
                        ? 'bg-red-50 text-red-700 border-red-200'
                        : ur.status === 'expired'
                          ? 'bg-gray-100 text-gray-600 border-gray-200'
                          : 'bg-blue-50 text-blue-700 border-blue-200'
                  }`}
                >
                  {ur.status}
                </span>
                {(ur.status === 'pending' ||
                  ur.status === 'partially_uploaded') && (
                  <button
                    onClick={() => revokeUploadRequest(ur.id)}
                    className="text-gray-400 hover:text-red-500 transition-colors p-1"
                    title="Revoke"
                  >
                    <Ban className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Request Documents Modal ──────────────────────────────────── */}
      {showRequestDocModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowRequestDocModal(false)}
          />
          <div className="relative bg-white rounded-2xl shadow-xl border border-gray-200 w-full max-w-lg mx-4 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <Upload className="w-5 h-5 text-blue-600" />
                <h2 className="text-lg font-bold text-gray-900">
                  Request Documents
                </h2>
              </div>
              <button
                onClick={() => setShowRequestDocModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="px-6 py-5 space-y-4 max-h-[60vh] overflow-y-auto">
              {/* Vendor */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Vendor <span className="text-red-500">*</span>
                </label>
                <select
                  value={reqDocVendorId}
                  onChange={(e) => setReqDocVendorId(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                >
                  <option value="">Select vendor…</option>
                  {submissions.map((sub) => (
                    <option key={sub.vendor_id} value={sub.vendor_id}>
                      {sub.vendor_name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Recipient Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={reqDocEmail}
                  onChange={(e) => setReqDocEmail(e.target.value)}
                  placeholder="vendor@example.com"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Document Types */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Allowed Document Types
                </label>
                <div className="flex gap-3">
                  {['invoice', 'quote', 'supporting'].map((t) => (
                    <label
                      key={t}
                      className="inline-flex items-center gap-2 text-sm"
                    >
                      <input
                        type="checkbox"
                        checked={reqDocTypes.includes(t)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setReqDocTypes((prev) => [...prev, t]);
                          } else {
                            setReqDocTypes((prev) =>
                              prev.filter((x) => x !== t)
                            );
                          }
                        }}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="capitalize">{t}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Expiry */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Link Expiry (hours)
                </label>
                <select
                  value={reqDocExpiry}
                  onChange={(e) => setReqDocExpiry(Number(e.target.value))}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                >
                  <option value={24}>24 hours</option>
                  <option value={48}>48 hours</option>
                  <option value={72}>72 hours (default)</option>
                  <option value={168}>7 days</option>
                </select>
              </div>

              {/* Message */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Message (Optional)
                </label>
                <textarea
                  value={reqDocMessage}
                  onChange={(e) => setReqDocMessage(e.target.value)}
                  placeholder="Optional note to the vendor…"
                  rows={3}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50">
              <button
                onClick={() => setShowRequestDocModal(false)}
                className="px-5 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors text-sm font-medium"
              >
                Cancel
              </button>
              <button
                disabled={!reqDocVendorId || !reqDocEmail}
                onClick={async () => {
                  const result = await createUploadRequest({
                    vendorId: reqDocVendorId,
                    requestEmail: reqDocEmail,
                    allowedDocTypes: reqDocTypes,
                    expiresInHours: reqDocExpiry,
                    message: reqDocMessage || undefined,
                  });
                  if (result) {
                    setShowRequestDocModal(false);
                    setReqDocEmail('');
                    setReqDocVendorId('');
                    setReqDocMessage('');
                    setToastMessage('Upload link sent successfully!');
                    // Copy to clipboard
                    try {
                      await navigator.clipboard.writeText(result.portalUrl);
                      setCopiedLink(true);
                      setTimeout(() => setCopiedLink(false), 3000);
                    } catch {}
                  }
                }}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-semibold shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Mail className="w-4 h-4" />
                Send Upload Link
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Vendor Attachments Drawer ────────────────────────────────── */}
      <Sheet open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <SheetContent
          side="right"
          className="w-[420px] sm:max-w-[420px] p-0 flex flex-col"
        >
          {/* Header */}
          <div className="px-6 pt-6 pb-4 border-b border-gray-200">
            <h2 className="text-lg font-bold text-gray-900">
              Vendor Attachments
            </h2>
            {submissionDetail && (
              <p className="text-sm text-blue-600 font-medium mt-0.5">
                {submissionDetail.vendor_name}
              </p>
            )}
          </div>

          {detailLoading ? (
            <div className="flex-1 flex items-center justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
            </div>
          ) : submissionDetail ? (
            <>
              {/* File List — scrollable */}
              <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
                {submissionDetail.files.length === 0 ? (
                  <div className="text-center py-12">
                    <FileText className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 font-medium">No attachments</p>
                  </div>
                ) : (
                  submissionDetail.files.map((file) => {
                    const ext =
                      file.file_name.split('.').pop()?.toLowerCase() ?? '';
                    let iconBg = 'bg-gray-100';
                    let iconColor = 'text-gray-500';
                    if (ext === 'pdf') {
                      iconBg = 'bg-red-50';
                      iconColor = 'text-red-500';
                    } else if (
                      ext === 'xlsx' ||
                      ext === 'xls' ||
                      ext === 'csv'
                    ) {
                      iconBg = 'bg-green-50';
                      iconColor = 'text-green-600';
                    } else if (
                      ext === 'png' ||
                      ext === 'jpg' ||
                      ext === 'jpeg' ||
                      ext === 'svg'
                    ) {
                      iconBg = 'bg-blue-50';
                      iconColor = 'text-blue-500';
                    } else if (ext === 'doc' || ext === 'docx') {
                      iconBg = 'bg-blue-50';
                      iconColor = 'text-blue-600';
                    }

                    return (
                      <div
                        key={file.id}
                        className="flex items-center gap-3 bg-gray-50 rounded-xl px-4 py-3 border border-gray-200 hover:border-gray-300 transition-colors"
                      >
                        {/* File type icon */}
                        <div
                          className={`w-10 h-10 rounded-lg ${iconBg} flex items-center justify-center flex-shrink-0`}
                        >
                          <FileText className={`w-5 h-5 ${iconColor}`} />
                        </div>
                        {/* File info */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900 truncate">
                            {file.file_name}
                          </p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {file.mime_type} &bull;{' '}
                            {formatDate(file.uploaded_at)}
                          </p>
                        </div>
                        {/* Actions */}
                        <div className="flex items-center gap-1 flex-shrink-0">
                          {file.signedUrl ? (
                            <>
                              <a
                                href={file.signedUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-2 rounded-lg hover:bg-gray-200 text-gray-500 hover:text-gray-700 transition-colors"
                                title="View"
                              >
                                <Eye className="w-4 h-4" />
                              </a>
                              <a
                                href={file.signedUrl}
                                download={file.file_name}
                                className="p-2 rounded-lg hover:bg-gray-200 text-gray-500 hover:text-gray-700 transition-colors"
                                title="Download"
                              >
                                <Download className="w-4 h-4" />
                              </a>
                            </>
                          ) : (
                            <span className="text-xs text-gray-400 px-2">
                              Unavailable
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
                <p className="text-sm text-gray-500">
                  {submissionDetail.files.length} file
                  {submissionDetail.files.length !== 1 ? 's' : ''} total
                </p>
                <button
                  onClick={() => setShowDetailDialog(false)}
                  className="px-5 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
                >
                  Close
                </button>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-gray-500">No submission data available.</p>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
