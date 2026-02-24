import { useRouter } from 'next/router';
import Link from 'next/link';
import { usePlatform } from '../contexts/PlatformContext';
import { useVendor } from '@/lib/hooks/useVendor';
import { useVendorEvaluation } from '@/lib/hooks/useVendorEvaluation';
import type { CriterionKey } from '@/lib/hooks/useVendorEvaluation';
import { useState } from 'react';
import {
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  User,
  Calendar,
  Star,
  AlertTriangle,
  TrendingUp,
  FileText,
  DollarSign,
  Edit2,
  Save,
  X,
  ChevronDown,
  ChevronUp,
  Info,
  Loader2,
} from 'lucide-react';
import { StatusBadge } from '../components/StatusBadge';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from 'recharts';

export function VendorProfile() {
  const router = useRouter();
  const id = router.query.vendorId as string | undefined;
  const { engagements } = usePlatform();
  const {
    vendor: vendorDto,
    loading,
    error,
    updateVendor,
    updating,
  } = useVendor(id);
  const evalHook = useVendorEvaluation(id);

  // Map DTO snake_case → camelCase so the template works unchanged
  const vendor = vendorDto
    ? {
        id: vendorDto.id,
        name: vendorDto.vendor_name,
        email: vendorDto.email ?? '',
        phone: vendorDto.phone ?? '',
        address: vendorDto.address ?? '',
        category: vendorDto.category ?? '',
        status: vendorDto.status as 'active' | 'inactive' | 'suspended',
        rating: vendorDto.rating ?? 0,
        riskScore: vendorDto.risk_score ?? 0,
        totalEngagements: vendorDto.total_engagements ?? 0,
        totalSpent: vendorDto.total_spent ?? 0,
        contactPerson: vendorDto.contact_person ?? '',
        taxId: vendorDto.tax_id ?? '',
        joinedDate: vendorDto.joined_date ?? '',
        lastEngagementDate: vendorDto.last_engagement_date ?? '',
        performanceMetrics: {
          onTimeDelivery: 95,
          paymentDisputes: 0,
          complianceIncidents: 0,
        },
        notes: vendorDto.notes ?? '',
      }
    : undefined;

  const vendorEngagements = engagements.filter((e) => e.vendorId === id);

  // State management

  // Inline edit state for vendor details
  const [editingDetails, setEditingDetails] = useState(false);
  const [editForm, setEditForm] = useState({
    email: '',
    phone: '',
    address: '',
    contactPerson: '',
  });

  // State for notes editing
  const [isEditing, setIsEditing] = useState(false);
  const [editedNotes, setEditedNotes] = useState(vendor?.notes || '');

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <span className="ml-3 text-gray-600">Loading vendor…</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 mb-2">Failed to load vendor</p>
        <p className="text-gray-500 text-sm mb-4">{error}</p>
        <Link
          href="/vendors"
          className="text-blue-600 hover:text-blue-700 inline-block"
        >
          Back to Vendors
        </Link>
      </div>
    );
  }

  if (!vendor) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Vendor not found</p>
        <Link
          href="/vendors"
          className="text-blue-600 hover:text-blue-700 mt-4 inline-block"
        >
          Back to Vendors
        </Link>
      </div>
    );
  }

  // Evaluation criteria labels
  const CRITERIA_LABELS: { key: CriterionKey; label: string }[] = [
    { key: 'delivery_timeliness', label: 'Delivery Timeliness' },
    { key: 'quality_of_work', label: 'Quality of Work' },
    { key: 'budget_adherence', label: 'Budget Adherence' },
    {
      key: 'communication_responsiveness',
      label: 'Communication & Responsiveness',
    },
    { key: 'compliance_documentation', label: 'Compliance & Documentation' },
  ];

  // Radar chart data from evaluation criteria
  const performanceData = CRITERIA_LABELS.map((c) => ({
    metric: c.label,
    value: evalHook.criteria[c.key] * 20, // Scale 1-5 to 0-100 for radar
    fullMark: 100,
  }));

  // Score card styling based on grade band
  const getBandClasses = () => {
    switch (evalHook.band) {
      case 'red':
        return {
          bg: 'bg-red-50',
          border: 'border-red-200',
          text: 'text-red-800',
          badgeBg: 'bg-red-100',
        };
      case 'amber':
        return {
          bg: 'bg-amber-50',
          border: 'border-amber-200',
          text: 'text-amber-800',
          badgeBg: 'bg-amber-100',
        };
      case 'green':
      default:
        return {
          bg: 'bg-green-50',
          border: 'border-green-200',
          text: 'text-green-800',
          badgeBg: 'bg-green-100',
        };
    }
  };
  const bandClasses = getBandClasses();

  // Render clickable stars for a criterion
  const renderCriterionStars = (key: CriterionKey) => {
    return [1, 2, 3, 4, 5].map((star) => (
      <button
        key={star}
        type="button"
        onClick={() => evalHook.setCriterion(key, star)}
        className="p-0.5 focus:outline-none transition-transform hover:scale-110"
      >
        <Star
          className={`w-5 h-5 ${
            star <= evalHook.criteria[key]
              ? 'text-yellow-400 fill-yellow-400'
              : 'text-gray-300'
          }`}
        />
      </button>
    ));
  };

  // Handle feedback submission

  // Spending history data (last 6 months)
  const spendingHistory = [
    { month: 'Aug', amount: vendorEngagements.length > 0 ? 18500 : 0 },
    { month: 'Sep', amount: vendorEngagements.length > 0 ? 22300 : 0 },
    { month: 'Oct', amount: vendorEngagements.length > 0 ? 19800 : 0 },
    { month: 'Nov', amount: vendorEngagements.length > 0 ? 26400 : 0 },
    { month: 'Dec', amount: vendorEngagements.length > 0 ? 24100 : 0 },
    { month: 'Jan', amount: vendorEngagements.length > 0 ? 28900 : 0 },
  ];

  const getRiskScoreColor = (score: number) => {
    if (score <= 20) return 'text-green-600';
    if (score <= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getRiskScoreBg = (score: number) => {
    if (score <= 20) return 'bg-green-100';
    if (score <= 50) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  // Render header star rating from evaluation average
  const renderStars = () => {
    const ratingRounded = Math.round(evalHook.averageStars);
    return [1, 2, 3, 4, 5].map((star) => (
      <Star
        key={star}
        className={`w-5 h-5 ${
          star <= ratingRounded
            ? 'text-yellow-400 fill-yellow-400'
            : 'text-gray-300'
        }`}
      />
    ));
  };

  // Handle notes editing
  const handleEditClick = () => {
    setIsEditing(true);
  };

  const handleSaveClick = async () => {
    try {
      await updateVendor({ notes: editedNotes });
      setIsEditing(false);
    } catch {
      alert('Failed to save notes');
    }
  };

  const handleCancelClick = () => {
    setEditedNotes(vendor.notes);
    setIsEditing(false);
  };

  // Handle inline detail editing
  const handleStartEditDetails = () => {
    setEditForm({
      email: vendor.email,
      phone: vendor.phone,
      address: vendor.address,
      contactPerson: vendor.contactPerson,
    });
    setEditingDetails(true);
  };

  const handleCancelEditDetails = () => {
    setEditingDetails(false);
  };

  const handleSaveDetails = async () => {
    try {
      await updateVendor({
        email: editForm.email || undefined,
        phone: editForm.phone || undefined,
        address: editForm.address || undefined,
        contact_person: editForm.contactPerson || undefined,
      });
      setEditingDetails(false);
    } catch {
      alert('Failed to save vendor details');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Link
          href="/vendors"
          className="inline-flex items-center text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back to Vendors
        </Link>
      </div>

      {/* Vendor Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
          <div className="flex-1">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-3xl font-semibold text-gray-900">
                  {vendor.name}
                </h1>
                <p className="text-gray-600 mt-1">{vendor.category}</p>
              </div>
              <StatusBadge status={vendor.status} />
            </div>

            <div className="space-y-3">
              {editingDetails ? (
                <>
                  <div className="flex items-center text-gray-600">
                    <Mail className="w-5 h-5 mr-3 flex-shrink-0" />
                    <input
                      type="email"
                      value={editForm.email}
                      onChange={(e) =>
                        setEditForm({ ...editForm, email: e.target.value })
                      }
                      className="flex-1 px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Email address"
                    />
                  </div>
                  <div className="flex items-center text-gray-600">
                    <Phone className="w-5 h-5 mr-3 flex-shrink-0" />
                    <input
                      type="tel"
                      value={editForm.phone}
                      onChange={(e) =>
                        setEditForm({ ...editForm, phone: e.target.value })
                      }
                      className="flex-1 px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Phone number"
                    />
                  </div>
                  <div className="flex items-center text-gray-600">
                    <MapPin className="w-5 h-5 mr-3 flex-shrink-0" />
                    <input
                      type="text"
                      value={editForm.address}
                      onChange={(e) =>
                        setEditForm({ ...editForm, address: e.target.value })
                      }
                      className="flex-1 px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Address"
                    />
                  </div>
                  <div className="flex items-center text-gray-600">
                    <User className="w-5 h-5 mr-3 flex-shrink-0" />
                    <input
                      type="text"
                      value={editForm.contactPerson}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          contactPerson: e.target.value,
                        })
                      }
                      className="flex-1 px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Contact person"
                    />
                  </div>
                  <div className="flex items-center gap-2 pt-2">
                    <button
                      onClick={handleSaveDetails}
                      disabled={updating}
                      className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium disabled:opacity-50"
                    >
                      <Save className="w-3.5 h-3.5" />
                      {updating ? 'Saving…' : 'Save'}
                    </button>
                    <button
                      onClick={handleCancelEditDetails}
                      disabled={updating}
                      className="inline-flex items-center gap-1.5 px-4 py-1.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium disabled:opacity-50"
                    >
                      <X className="w-3.5 h-3.5" />
                      Cancel
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center text-gray-600">
                    <Mail className="w-5 h-5 mr-3" />
                    <a
                      href={`mailto:${vendor.email}`}
                      className="hover:text-blue-600"
                    >
                      {vendor.email || '—'}
                    </a>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <Phone className="w-5 h-5 mr-3" />
                    <a
                      href={`tel:${vendor.phone}`}
                      className="hover:text-blue-600"
                    >
                      {vendor.phone || '—'}
                    </a>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <MapPin className="w-5 h-5 mr-3" />
                    <span>{vendor.address || '—'}</span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <User className="w-5 h-5 mr-3" />
                    <span>{vendor.contactPerson || '—'}</span>
                  </div>
                  <button
                    onClick={handleStartEditDetails}
                    className="inline-flex items-center gap-1.5 mt-1 px-3 py-1.5 text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors font-medium"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    Edit Details
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Risk Score Badge */}
          <div className="flex flex-col items-center gap-2">
            <div
              className={`${bandClasses.bg} ${bandClasses.border} border p-6 rounded-lg text-center`}
            >
              {/* Vendor Score Card — color-banded */}
              <p className="text-sm text-gray-600 mb-1">Vendor Score</p>
              <p className={`text-4xl font-bold ${bandClasses.text}`}>
                {evalHook.finalScore}
              </p>
              <span
                className={`inline-block mt-1 px-3 py-0.5 rounded-full text-xs font-bold ${bandClasses.badgeBg} ${bandClasses.text}`}
              >
                {evalHook.grade}
              </span>

              {/* Star average */}
              <div className="mt-4 pt-4 border-t border-gray-300">
                <div className="flex items-center justify-center gap-1 mb-1">
                  {renderStars()}
                </div>
                <p className="text-xs text-gray-500">
                  {evalHook.averageStars} / 5 avg
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Engagements</p>
              <p className="text-2xl font-semibold text-gray-900 mt-2">
                {vendor.totalEngagements}
              </p>
            </div>
            <FileText className="w-8 h-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Spent</p>
              <p className="text-2xl font-semibold text-gray-900 mt-2">
                ${(vendor.totalSpent / 1000).toFixed(0)}K
              </p>
            </div>
            <DollarSign className="w-8 h-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">On-Time Delivery</p>
              <p className="text-2xl font-semibold text-gray-900 mt-2">
                {vendor.performanceMetrics.onTimeDelivery}%
              </p>
            </div>
            <TrendingUp className="w-8 h-8 text-purple-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Compliance Issues</p>
              <p className="text-2xl font-semibold text-gray-900 mt-2">
                {vendor.performanceMetrics.complianceIncidents}
              </p>
            </div>
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Vendor Evaluation — 5 Criteria Star Ratings */}
        <div
          className={`rounded-xl shadow-sm border p-6 ${bandClasses.bg} ${bandClasses.border}`}
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">
              Vendor Evaluation
            </h2>
            <span
              className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold ${bandClasses.badgeBg} ${bandClasses.text}`}
            >
              {evalHook.grade} — {evalHook.finalScore}/10
            </span>
          </div>

          {/* Radar Chart */}
          <ResponsiveContainer width="100%" height={260}>
            <RadarChart data={performanceData}>
              <PolarGrid stroke="#e5e7eb" />
              <PolarAngleAxis dataKey="metric" tick={{ fontSize: 11 }} />
              <PolarRadiusAxis angle={90} domain={[0, 100]} tick={false} />
              <Radar
                name="Rating"
                dataKey="value"
                stroke={
                  evalHook.band === 'red'
                    ? '#ef4444'
                    : evalHook.band === 'amber'
                      ? '#f59e0b'
                      : '#22c55e'
                }
                fill={
                  evalHook.band === 'red'
                    ? '#ef4444'
                    : evalHook.band === 'amber'
                      ? '#f59e0b'
                      : '#22c55e'
                }
                fillOpacity={0.5}
                animationDuration={300}
              />
              <Tooltip />
            </RadarChart>
          </ResponsiveContainer>

          {/* Criteria star rows */}
          <div className="mt-4 space-y-3">
            {CRITERIA_LABELS.map((c) => (
              <div key={c.key} className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700 w-56 flex-shrink-0">
                  {c.label}
                </span>
                <div className="flex items-center gap-0.5">
                  {renderCriterionStars(c.key)}
                </div>
              </div>
            ))}
          </div>

          {/* Score summary + save */}
          <div className="mt-6 pt-4 border-t border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold text-gray-900">
                  Final Score:
                </span>
                <span className={`text-2xl font-bold ${bandClasses.text}`}>
                  {evalHook.finalScore}/10
                </span>
              </div>
              <span
                className={`px-3 py-1 rounded-full text-xs font-bold ${bandClasses.badgeBg} ${bandClasses.text}`}
              >
                {evalHook.grade}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={evalHook.save}
                disabled={evalHook.saving}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {evalHook.saving ? 'Saving…' : 'Save Evaluation'}
              </button>
              {evalHook.error && (
                <span className="text-xs text-red-600">{evalHook.error}</span>
              )}
              {evalHook.hasBeenRated && !evalHook.saving && !evalHook.error && (
                <span className="text-xs text-green-600">✓ Saved</span>
              )}
            </div>
            <div className="flex items-start gap-2 mt-3">
              <Info className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-gray-500">
                Score = average of 5 criteria × 2. 1–3 = Bad (red), 4–7 = Good
                (amber), 8–10 = Excellent (green).
              </p>
            </div>
          </div>
        </div>

        {/* Spending History */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            6-Month Spending Trend
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={spendingHistory}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip
                formatter={(value) => `$${Number(value).toLocaleString()}`}
              />
              <Line
                type="monotone"
                dataKey="amount"
                stroke="#6366f1"
                strokeWidth={3}
                dot={{ fill: '#6366f1', r: 5 }}
                activeDot={{ r: 7 }}
                name="Spending"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Company Information - Full Width */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Company Information
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div>
            <p className="text-sm text-gray-500">Tax ID</p>
            <p className="text-gray-900 mt-1 font-medium">{vendor.taxId}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Joined Date</p>
            <div className="flex items-center mt-1">
              <Calendar className="w-4 h-4 text-gray-400 mr-2" />
              <p className="text-gray-900">
                {new Date(vendor.joinedDate).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
            </div>
          </div>
          <div>
            <p className="text-sm text-gray-500">Last Engagement</p>
            <div className="flex items-center mt-1">
              <Calendar className="w-4 h-4 text-gray-400 mr-2" />
              <p className="text-gray-900">
                {new Date(vendor.lastEngagementDate).toLocaleDateString(
                  'en-US',
                  {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  }
                )}
              </p>
            </div>
          </div>
          <div>
            <p className="text-sm text-gray-500">Payment Disputes</p>
            <p className="text-gray-900 mt-1 font-medium">
              {vendor.performanceMetrics.paymentDisputes}
            </p>
          </div>
        </div>
      </div>

      {/* Engagement History */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Engagement History
          </h2>
        </div>
        <div className="p-6">
          {vendorEngagements.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No engagements found</p>
            </div>
          ) : (
            <div className="space-y-3">
              {vendorEngagements.map((eng) => (
                <Link
                  key={eng.id}
                  href={`/engagements/${eng.id}`}
                  className="block p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors border border-gray-200"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{eng.title}</p>
                      <p className="text-sm text-gray-600 mt-1">
                        {eng.department} •{' '}
                        {new Date(eng.createdDate).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">
                        ${eng.totalValue.toLocaleString()}
                      </p>
                      <StatusBadge status={eng.status} className="mt-1" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Notes */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Notes</h2>
        {isEditing ? (
          <div className="relative">
            <textarea
              value={editedNotes}
              onChange={(e) => setEditedNotes(e.target.value)}
              className="w-full h-24 p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="absolute top-2 right-2">
              <button
                onClick={handleSaveClick}
                className="text-green-600 hover:text-green-700 mr-2"
              >
                <Save className="w-5 h-5" />
              </button>
              <button
                onClick={handleCancelClick}
                className="text-red-600 hover:text-red-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        ) : (
          <div className="relative">
            <p className="text-gray-700">{vendor.notes}</p>
            <button
              onClick={handleEditClick}
              className="absolute top-2 right-2 text-blue-600 hover:text-blue-700"
            >
              <Edit2 className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
