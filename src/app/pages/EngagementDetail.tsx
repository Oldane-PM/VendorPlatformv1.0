import { useRouter } from 'next/router';
import Link from 'next/link';
import { useState } from 'react';
import {
  ArrowLeft,
  Edit,
  Trash2,
  FileText,
  CheckSquare,
  DollarSign,
  Activity,
  Upload,
  AlertTriangle,
  Check,
  X,
  Clock,
  Sparkles,
  Loader2,
} from 'lucide-react';
import { StatusBadge } from '../components/StatusBadge';
import { useEngagementDetail } from '@/lib/hooks/useEngagements';
import type { EngagementDetailDto } from '@/lib/domain/engagements/engagementsApiRepo';

type TabType =
  | 'overview'
  | 'workOrders'
  | 'documents'
  | 'approvals'
  | 'financials'
  | 'activity';

export function EngagementDetail() {
  const router = useRouter();
  const id = router.query.engagementId as string | undefined;
  const { engagement, isLoading, error } = useEngagementDetail(id);
  const [activeTab, setActiveTab] = useState<TabType>('overview');

  // ── Loading state ─────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        <p className="text-sm text-gray-500">Loading engagement…</p>
      </div>
    );
  }

  // ── Error state ───────────────────────────────────────────────────
  if (error) {
    return (
      <div className="text-center py-12">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 max-w-md mx-auto">
          <p className="text-sm text-red-700">{error}</p>
        </div>
        <Link
          href="/engagements"
          className="text-blue-600 hover:text-blue-700 mt-4 inline-block"
        >
          Back to Engagements
        </Link>
      </div>
    );
  }

  // ── Not found ─────────────────────────────────────────────────────
  if (!engagement) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Engagement not found</p>
        <Link
          href="/engagements"
          className="text-blue-600 hover:text-blue-700 mt-4 inline-block"
        >
          Back to Engagements
        </Link>
      </div>
    );
  }

  const handleDelete = () => {
    if (
      window.confirm(`Are you sure you want to delete "${engagement.title}"?`)
    ) {
      // TODO: wire to API delete
      router.push('/engagements');
    }
  };

  const tabs = [
    { id: 'overview' as TabType, label: 'Overview', icon: FileText },
    { id: 'workOrders' as TabType, label: 'Work Orders', icon: FileText },
    { id: 'documents' as TabType, label: 'Documents', icon: Upload },
    { id: 'approvals' as TabType, label: 'Approvals', icon: CheckSquare },
    { id: 'financials' as TabType, label: 'Financials', icon: DollarSign },
    { id: 'activity' as TabType, label: 'Activity Log', icon: Activity },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <Link
          href="/engagements"
          className="inline-flex items-center text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back to Engagements
        </Link>
        <div className="flex gap-2">
          <button className="inline-flex items-center px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
            <Edit className="w-4 h-4 mr-2" />
            Edit
          </button>
          <button
            onClick={handleDelete}
            className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete
          </button>
        </div>
      </div>

      {/* Engagement Header Card */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
          <div className="flex-1">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-2xl font-semibold text-gray-900">
                  {engagement.title}
                </h1>
                <p className="text-sm text-gray-500 mt-1 font-mono">
                  ENG-{String(engagement.engagement_number).padStart(4, '0')}
                </p>
              </div>
              <StatusBadge status={engagement.status as any} />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">
                  Vendor
                </p>
                <p className="text-sm font-medium text-gray-900 mt-1">
                  {engagement.vendor_name || '—'}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">
                  Department
                </p>
                <p className="text-sm font-medium text-gray-900 mt-1">
                  {engagement.department || '—'}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">
                  Total Value
                </p>
                <p className="text-sm font-semibold text-gray-900 mt-1">
                  ${(engagement.total_value ?? 0).toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">
                  Assigned Approver
                </p>
                <p className="text-sm font-medium text-gray-900 mt-1">
                  {engagement.assigned_approver || '—'}
                </p>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-700">
                {engagement.description || 'No description provided.'}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-2">
            <button className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium whitespace-nowrap">
              Submit for Approval
            </button>
            <button className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium whitespace-nowrap">
              Cancel Engagement
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <div className="flex overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    flex items-center px-6 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap
                    ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                    }
                  `}
                >
                  <Icon className="w-4 h-4 mr-2" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="p-6">
          {activeTab === 'overview' && <OverviewTab engagement={engagement} />}
          {activeTab === 'workOrders' && (
            <WorkOrdersTab engagement={engagement} />
          )}
          {activeTab === 'documents' && (
            <DocumentsTab engagement={engagement} />
          )}
          {activeTab === 'approvals' && (
            <ApprovalsTab engagement={engagement} />
          )}
          {activeTab === 'financials' && (
            <FinancialsTab engagement={engagement} />
          )}
          {activeTab === 'activity' && <ActivityTab engagement={engagement} />}
        </div>
      </div>
    </div>
  );
}

function OverviewTab({ engagement }: { engagement: EngagementDetailDto }) {
  const awardedCount = engagement.rfqs.filter(
    (r) => r.decision === 'selected'
  ).length;

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">RFQs</p>
              <p className="text-2xl font-semibold text-gray-900 mt-1">
                {engagement.rfqs.length}
              </p>
            </div>
            <FileText className="w-8 h-8 text-blue-600" />
          </div>
        </div>
        <div className="bg-green-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Documents</p>
              <p className="text-2xl font-semibold text-gray-900 mt-1">
                {engagement.documents.length}
              </p>
            </div>
            <Upload className="w-8 h-8 text-green-600" />
          </div>
        </div>
        <div className="bg-purple-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Vendor Engagements</p>
              <p className="text-2xl font-semibold text-gray-900 mt-1">
                {awardedCount}
              </p>
            </div>
            <DollarSign className="w-8 h-8 text-purple-600" />
          </div>
        </div>
      </div>

      {/* Engagement Details */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Engagement Details
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-500">Created Date</p>
            <p className="text-sm font-medium text-gray-900 mt-1">
              {new Date(engagement.created_at).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Start Date</p>
            <p className="text-sm font-medium text-gray-900 mt-1">
              {engagement.start_date
                ? new Date(engagement.start_date).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })
                : '—'}
            </p>
          </div>
        </div>
      </div>

      {/* Linked Vendor Profile */}
      {engagement.vendor_id && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Linked Vendor Profile
          </h3>
          <Link
            href={`/vendors/${engagement.vendor_id}`}
            className="block p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors border border-gray-200"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">
                  {engagement.vendor_name}
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  View full vendor profile
                </p>
              </div>
              <ArrowLeft className="w-5 h-5 text-gray-400 rotate-180" />
            </div>
          </Link>
        </div>
      )}
    </div>
  );
}

function WorkOrdersTab({ engagement }: { engagement: EngagementDetailDto }) {
  const handleAIRiskAnalysis = () => {
    alert(
      'AI Risk Analysis\n\nAnalyzing all RFQs for:\n• Price anomalies\n• Hidden costs\n• Vendor reliability\n• Contract compliance\n• Delivery feasibility\n• Payment terms risks'
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">
          Request for Quotations
        </h3>
        <div className="flex gap-2">
          <button
            onClick={handleAIRiskAnalysis}
            className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-lg hover:from-indigo-700 hover:to-blue-700 transition-all text-sm font-medium shadow-sm"
          >
            <Sparkles className="w-4 h-4 inline mr-2" />
            AI Risk Analysis
          </button>
          <button className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">
            Create RFQ
          </button>
        </div>
      </div>

      {engagement.rfqs.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600">No RFQs yet</p>
          <p className="text-sm text-gray-500 mt-1">
            Create your first RFQ to start vendor comparison
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {engagement.rfqs.map((rfq) => (
            <div
              key={rfq.id}
              className="bg-white border border-gray-200 rounded-lg p-6"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h4 className="font-medium text-gray-900">
                    {rfq.vendor_name}
                  </h4>
                  <p className="text-sm text-gray-500 mt-1">
                    Submitted{' '}
                    {rfq.submitted_date
                      ? new Date(rfq.submitted_date).toLocaleDateString()
                      : '—'}
                  </p>
                </div>
                <StatusBadge status={rfq.decision as any} />
              </div>

              {/* Line Items */}
              <div className="space-y-2 mb-4">
                {rfq.line_items.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span className="text-gray-700">
                      {item.description} (x{item.quantity})
                    </span>
                    <span className="font-medium text-gray-900">
                      ${item.total.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div className="border-t border-gray-200 pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-medium">
                    ${rfq.subtotal.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Taxes</span>
                  <span className="font-medium">
                    ${rfq.taxes.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-base font-semibold">
                  <span>Total</span>
                  <span>${rfq.total.toLocaleString()}</span>
                </div>
              </div>

              {rfq.ai_risk_flag && rfq.ai_risk_flag !== 'None' && (
                <div className="mt-4 p-3 bg-gradient-to-br from-red-50 to-orange-50 border border-red-100 rounded-lg flex items-start">
                  <AlertTriangle className="w-5 h-5 text-red-600 mr-2 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-red-900">
                      AI Risk Flag
                    </p>
                    <p className="text-sm text-red-700 mt-1">
                      {rfq.ai_risk_flag}
                    </p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function DocumentsTab({ engagement }: { engagement: EngagementDetailDto }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Documents</h3>
        <button className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">
          <Upload className="w-4 h-4 inline mr-2" />
          Upload Document
        </button>
      </div>

      {/* Upload Area */}
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-500 transition-colors cursor-pointer bg-gray-50">
        <Upload className="w-12 h-12 text-gray-400 mx-auto mb-3" />
        <p className="text-sm text-gray-600">
          Drag and drop files here, or click to browse
        </p>
        <p className="text-xs text-gray-500 mt-1">
          PDF, DOC, DOCX, XLS, XLSX up to 10MB
        </p>
      </div>

      {/* Documents List */}
      {engagement.documents.length > 0 && (
        <div className="space-y-3">
          {engagement.documents.map((doc) => (
            <div
              key={doc.id}
              className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center">
                    <FileText className="w-5 h-5 text-gray-400 mr-2" />
                    <h4 className="font-medium text-gray-900">{doc.name}</h4>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    {(doc.size / 1024 / 1024).toFixed(2)} MB • Uploaded by{' '}
                    {doc.uploaded_by || 'Unknown'} on{' '}
                    {doc.uploaded_date
                      ? new Date(doc.uploaded_date).toLocaleDateString()
                      : '—'}
                  </p>

                  {doc.ai_summary && (
                    <div className="mt-3 p-3 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-blue-100">
                      <div className="flex items-start">
                        <Sparkles className="w-4 h-4 text-blue-600 mr-2 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <p className="text-xs font-medium text-blue-900">
                            AI Executive Summary
                          </p>
                          <p className="text-sm text-blue-700 mt-1">
                            {doc.ai_summary}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-2 ml-4">
                  <button className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors">
                    <FileText className="w-4 h-4" />
                  </button>
                  <button className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ApprovalsTab({ engagement }: { engagement: EngagementDetailDto }) {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900">Approval Timeline</h3>

      {engagement.approval_steps.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <CheckSquare className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600">No approval steps configured</p>
        </div>
      ) : (
        <div className="relative">
          {engagement.approval_steps.map((step, index) => (
            <div key={step.id} className="relative flex gap-4 pb-8">
              {/* Timeline Line */}
              {index < engagement.approval_steps.length - 1 && (
                <div className="absolute left-4 top-8 bottom-0 w-0.5 bg-gray-200"></div>
              )}

              {/* Status Icon */}
              <div className="relative flex-shrink-0">
                <div
                  className={`
                  w-8 h-8 rounded-full flex items-center justify-center
                  ${
                    step.status === 'approved'
                      ? 'bg-green-100'
                      : step.status === 'rejected'
                        ? 'bg-red-100'
                        : step.status === 'pending'
                          ? 'bg-yellow-100'
                          : 'bg-gray-100'
                  }
                `}
                >
                  {step.status === 'approved' && (
                    <Check className="w-5 h-5 text-green-600" />
                  )}
                  {step.status === 'rejected' && (
                    <X className="w-5 h-5 text-red-600" />
                  )}
                  {step.status === 'pending' && (
                    <Clock className="w-5 h-5 text-yellow-600" />
                  )}
                </div>
              </div>

              {/* Step Content */}
              <div className="flex-1 bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900">
                      {step.approver_name}
                    </h4>
                    <p className="text-sm text-gray-600">
                      {step.approver_role}
                    </p>
                  </div>
                  <StatusBadge status={step.status as any} />
                </div>

                {step.timestamp && (
                  <p className="text-xs text-gray-500 mt-2">
                    {new Date(step.timestamp).toLocaleString()}
                  </p>
                )}

                {step.comments && (
                  <div className="mt-3 p-3 bg-gray-50 rounded">
                    <p className="text-sm text-gray-700">{step.comments}</p>
                  </div>
                )}

                {step.escalated && (
                  <div className="mt-2 flex items-center text-xs text-orange-600">
                    <AlertTriangle className="w-3 h-3 mr-1" />
                    Escalated
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function FinancialsTab({ engagement }: { engagement: EngagementDetailDto }) {
  // Count RFQs with "selected" decision as awarded vendor engagements
  const awardedRfqs = engagement.rfqs.filter((r) => r.decision === 'selected');
  const totalAwardedValue = awardedRfqs.reduce(
    (sum, r) => sum + (r.total || 0),
    0
  );

  return (
    <div className="space-y-6">
      {/* Financial Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-blue-50 rounded-lg p-4">
          <p className="text-sm text-gray-600">Engagement Value</p>
          <p className="text-2xl font-semibold text-gray-900 mt-1">
            ${(engagement.total_value ?? 0).toLocaleString()}
          </p>
        </div>
        <div className="bg-green-50 rounded-lg p-4">
          <p className="text-sm text-gray-600">Awarded Value</p>
          <p className="text-2xl font-semibold text-gray-900 mt-1">
            ${totalAwardedValue.toLocaleString()}
          </p>
        </div>
        <div className="bg-purple-50 rounded-lg p-4">
          <p className="text-sm text-gray-600">Invoices</p>
          <p className="text-2xl font-semibold text-gray-900 mt-1">
            {engagement.invoices.length}
          </p>
        </div>
      </div>

      {/* Invoicing Information */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-start gap-3">
          <DollarSign className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-semibold text-blue-900 mb-2">
              Invoice Generation
            </h3>
            <p className="text-sm text-blue-700 mb-3">
              Invoices are generated and managed through{' '}
              <strong>Vendor Engagements</strong> only. Once a Work Order is
              awarded to a vendor, it becomes a Vendor Engagement where you can:
            </p>
            <ul className="text-sm text-blue-700 space-y-1 ml-4 list-disc">
              <li>Break down the project into milestones</li>
              <li>Generate partial or full payment invoices</li>
              <li>Track payment progress</li>
              <li>Manage invoice approvals</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Invoices Table */}
      {engagement.invoices.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Invoices</h3>
          <div className="space-y-3">
            {engagement.invoices.map((inv) => (
              <div
                key={inv.id}
                className="bg-white border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-gray-900">
                        {inv.invoice_number}
                      </h4>
                      <StatusBadge status={inv.status as any} />
                    </div>
                    <p className="text-sm text-gray-600">
                      {inv.vendor_name} • Due{' '}
                      {inv.due_date
                        ? new Date(inv.due_date).toLocaleDateString()
                        : '—'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-semibold text-gray-900">
                      ${(inv.amount ?? 0).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ActivityTab({ engagement }: { engagement: EngagementDetailDto }) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">Activity Log</h3>

      {engagement.activity_log.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <Activity className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600">No activity recorded yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {engagement.activity_log.map((log) => (
            <div key={log.id} className="flex gap-3">
              <div className="flex-shrink-0 w-2 h-2 mt-2 rounded-full bg-blue-500"></div>
              <div className="flex-1 bg-gray-50 rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{log.action}</p>
                    <p className="text-sm text-gray-600 mt-1">{log.details}</p>
                    {log.status_change && (
                      <span className="inline-block mt-2 text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded">
                        {log.status_change}
                      </span>
                    )}
                  </div>
                  <div className="text-right flex-shrink-0 ml-4">
                    <p className="text-xs text-gray-500">
                      {new Date(log.timestamp).toLocaleDateString()}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {log.user_name}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
