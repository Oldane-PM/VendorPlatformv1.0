import { useRouter } from 'next/router';
import Link from 'next/link';
import { usePlatform } from '../contexts/PlatformContext';
import { useVendor } from '@/lib/hooks/useVendor';
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
  MessageSquare,
  Paperclip,
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
  const [isEditMode, setIsEditMode] = useState(false);
  const [performanceMetrics, setPerformanceMetrics] = useState({
    onTimeDelivery: 92,
    qualityScore: 88,
    communication: 85,
    pricing: 78,
    compliance: 90,
  });
  const [performanceNotes, setPerformanceNotes] = useState(
    'Vendor consistently delivers quality work on schedule. Communication has been excellent throughout all engagements.'
  );
  const [showPerformanceNotes, setShowPerformanceNotes] = useState(false);
  const [vendorRating, setVendorRating] = useState(4);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbackForm, setFeedbackForm] = useState({
    engagementRef: '',
    categories: [] as string[],
    notes: '',
    internalOnly: true,
  });
  const [attachedFile, setAttachedFile] = useState<File | null>(null);

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

  // Calculate overall performance score
  const overallScore = Math.round(
    (performanceMetrics.onTimeDelivery +
      performanceMetrics.qualityScore +
      performanceMetrics.communication +
      performanceMetrics.pricing +
      performanceMetrics.compliance) /
      5
  );

  // Determine risk level based on overall score
  const getRiskLevel = (score: number) => {
    if (score >= 85) return { label: 'LOW', color: 'green', icon: '🟢' };
    if (score >= 70) return { label: 'MEDIUM', color: 'yellow', icon: '🟡' };
    return { label: 'HIGH', color: 'red', icon: '🔴' };
  };

  const riskLevel = getRiskLevel(overallScore);

  // Performance trend data (last 3 engagements)
  const performanceTrend = [
    { engagement: 'Eng 1', score: 82 },
    { engagement: 'Eng 2', score: 86 },
    { engagement: 'Eng 3', score: overallScore },
  ];

  // Performance data for radar chart
  const performanceData = [
    {
      metric: 'On-Time Delivery',
      value: performanceMetrics.onTimeDelivery,
      fullMark: 100,
    },
    {
      metric: 'Quality Score',
      value: performanceMetrics.qualityScore,
      fullMark: 100,
    },
    {
      metric: 'Communication',
      value: performanceMetrics.communication,
      fullMark: 100,
    },
    { metric: 'Pricing', value: performanceMetrics.pricing, fullMark: 100 },
    {
      metric: 'Compliance',
      value: performanceMetrics.compliance,
      fullMark: 100,
    },
  ];

  // Handle metric update
  const handleMetricChange = (
    metric: keyof typeof performanceMetrics,
    value: number
  ) => {
    setPerformanceMetrics({
      ...performanceMetrics,
      [metric]: Math.min(100, Math.max(0, value)),
    });
  };

  // Handle feedback submission
  const handleSubmitFeedback = () => {
    if (
      !feedbackForm.engagementRef ||
      feedbackForm.categories.length === 0 ||
      !feedbackForm.notes
    ) {
      alert('Please fill in all required fields');
      return;
    }

    alert(
      `✅ Feedback Submitted Successfully!\n\n` +
        `Engagement: ${feedbackForm.engagementRef}\n` +
        `Categories: ${feedbackForm.categories.join(', ')}\n` +
        `Internal Only: ${feedbackForm.internalOnly ? 'Yes' : 'No'}\n` +
        `File Attached: ${attachedFile ? attachedFile.name : 'None'}`
    );

    // Reset form
    setShowFeedbackModal(false);
    setFeedbackForm({
      engagementRef: '',
      categories: [],
      notes: '',
      internalOnly: true,
    });
    setAttachedFile(null);
  };

  // Toggle feedback category
  const toggleCategory = (category: string) => {
    setFeedbackForm({
      ...feedbackForm,
      categories: feedbackForm.categories.includes(category)
        ? feedbackForm.categories.filter((c) => c !== category)
        : [...feedbackForm.categories, category],
    });
  };

  // Handle file attachment
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setAttachedFile(e.target.files[0]);
    }
  };

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

  // Render star rating
  const renderStars = () => {
    return [1, 2, 3, 4, 5].map((star) => (
      <Star
        key={star}
        className={`w-5 h-5 ${
          star <= vendorRating
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
              className={`${getRiskScoreBg(vendor.riskScore)} p-6 rounded-lg text-center`}
            >
              <p className="text-sm text-gray-600 mb-2">Risk Score</p>
              <p
                className={`text-4xl font-bold ${getRiskScoreColor(vendor.riskScore)}`}
              >
                {vendor.riskScore}
              </p>

              {/* Editable Star Rating */}
              <div className="mt-4 pt-4 border-t border-gray-300">
                <div className="flex items-center justify-center gap-1 mb-2">
                  {renderStars()}
                </div>
                <select
                  value={vendorRating}
                  onChange={(e) => setVendorRating(parseInt(e.target.value))}
                  className="text-xs px-2 py-1 border border-gray-300 rounded bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value={1}>1 Star</option>
                  <option value={2}>2 Stars</option>
                  <option value={3}>3 Stars</option>
                  <option value={4}>4 Stars</option>
                  <option value={5}>5 Stars</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">Engagement rating</p>
              </div>
            </div>

            {/* Provide Vendor Feedback Button */}
            <button
              onClick={() => setShowFeedbackModal(true)}
              className="w-full px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all shadow-sm font-medium text-sm flex items-center justify-center gap-2"
            >
              <MessageSquare className="w-4 h-4" />
              Provide Vendor Feedback
            </button>
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
        {/* Performance Metrics - EDITABLE */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">
              Performance Metrics
            </h2>
            <button
              onClick={() => setIsEditMode(!isEditMode)}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                isEditMode
                  ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Edit2 className="w-4 h-4" />
              {isEditMode ? 'View Mode' : 'Edit Mode'}
            </button>
          </div>

          {/* Radar Chart */}
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart data={performanceData}>
              <PolarGrid stroke="#e5e7eb" />
              <PolarAngleAxis dataKey="metric" tick={{ fontSize: 12 }} />
              <PolarRadiusAxis angle={90} domain={[0, 100]} />
              <Radar
                name="Performance"
                dataKey="value"
                stroke="#3b82f6"
                fill="#3b82f6"
                fillOpacity={0.6}
                animationDuration={300}
              />
              <Tooltip />
            </RadarChart>
          </ResponsiveContainer>

          {/* Editable Metrics Input Fields */}
          {isEditMode && (
            <div className="mt-6 space-y-3 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-xs font-semibold text-blue-900 mb-3">
                Edit Performance Scores (0-100)
              </p>

              {/* On-Time Delivery */}
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700">
                  On-Time Delivery
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="1"
                    value={performanceMetrics.onTimeDelivery}
                    onChange={(e) =>
                      handleMetricChange(
                        'onTimeDelivery',
                        parseInt(e.target.value) || 0
                      )
                    }
                    className="w-20 px-3 py-1.5 border border-gray-300 rounded-lg text-sm text-center font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-600">/ 100</span>
                </div>
              </div>

              {/* Quality Score */}
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700">
                  Quality Score
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="1"
                    value={performanceMetrics.qualityScore}
                    onChange={(e) =>
                      handleMetricChange(
                        'qualityScore',
                        parseInt(e.target.value) || 0
                      )
                    }
                    className="w-20 px-3 py-1.5 border border-gray-300 rounded-lg text-sm text-center font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-600">/ 100</span>
                </div>
              </div>

              {/* Communication */}
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700">
                  Communication
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="1"
                    value={performanceMetrics.communication}
                    onChange={(e) =>
                      handleMetricChange(
                        'communication',
                        parseInt(e.target.value) || 0
                      )
                    }
                    className="w-20 px-3 py-1.5 border border-gray-300 rounded-lg text-sm text-center font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-600">/ 100</span>
                </div>
              </div>

              {/* Pricing */}
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700">
                  Pricing
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="1"
                    value={performanceMetrics.pricing}
                    onChange={(e) =>
                      handleMetricChange(
                        'pricing',
                        parseInt(e.target.value) || 0
                      )
                    }
                    className="w-20 px-3 py-1.5 border border-gray-300 rounded-lg text-sm text-center font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-600">/ 100</span>
                </div>
              </div>

              {/* Compliance */}
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700">
                  Compliance
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="1"
                    value={performanceMetrics.compliance}
                    onChange={(e) =>
                      handleMetricChange(
                        'compliance',
                        parseInt(e.target.value) || 0
                      )
                    }
                    className="w-20 px-3 py-1.5 border border-gray-300 rounded-lg text-sm text-center font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-600">/ 100</span>
                </div>
              </div>

              {/* Risk Score Display */}
              <div className="mt-4 pt-4 border-t border-blue-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-gray-900">
                      Overall Score:
                    </span>
                    <span className="text-2xl font-bold text-blue-600">
                      {overallScore}/100
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-gray-900">
                      Risk Level:
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold ${
                        riskLevel.color === 'green'
                          ? 'bg-green-100 text-green-800'
                          : riskLevel.color === 'yellow'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {riskLevel.icon} {riskLevel.label}
                    </span>
                  </div>
                </div>
                <div className="flex items-start gap-2 mt-2">
                  <Info className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-blue-700">
                    Calculated automatically as average of all metrics. 85-100 =
                    Low Risk, 70-84 = Medium Risk, &lt;70 = High Risk
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Performance Notes Section */}
          <div className="mt-6">
            <button
              onClick={() => setShowPerformanceNotes(!showPerformanceNotes)}
              className="flex items-center justify-between w-full text-left"
            >
              <span className="text-sm font-semibold text-gray-900">
                Performance Notes
              </span>
              {showPerformanceNotes ? (
                <ChevronUp className="w-5 h-5 text-gray-400" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-400" />
              )}
            </button>

            {showPerformanceNotes && (
              <div className="mt-3">
                <textarea
                  value={performanceNotes}
                  onChange={(e) => setPerformanceNotes(e.target.value)}
                  placeholder="Add qualitative feedback about vendor performance…"
                  className="w-full h-32 px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white resize-none"
                />
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs text-gray-500">
                    {performanceNotes.length} characters
                  </span>
                  <button
                    onClick={() => alert('Performance notes saved!')}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-xs font-medium"
                  >
                    <Save className="w-3 h-3" />
                    Save Notes
                  </button>
                </div>
              </div>
            )}
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

      {/* Vendor Feedback Modal */}
      {showFeedbackModal && (
        <div className="fixed inset-0 bg-gray-900/35 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-xl z-10">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">
                  Vendor Feedback Submission
                </h2>
                <button
                  onClick={() => setShowFeedbackModal(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6">
              {/* Engagement Reference */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Engagement Reference <span className="text-red-500">*</span>
                </label>
                <select
                  value={feedbackForm.engagementRef}
                  onChange={(e) =>
                    setFeedbackForm({
                      ...feedbackForm,
                      engagementRef: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                >
                  <option value="">Select an engagement...</option>
                  {vendorEngagements.map((eng) => (
                    <option key={eng.id} value={eng.id}>
                      {eng.title} - {eng.id}
                    </option>
                  ))}
                </select>
              </div>

              {/* Performance Categories */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-3">
                  Performance Category <span className="text-red-500">*</span>
                </label>
                <div className="space-y-2">
                  {[
                    'Delivery',
                    'Quality',
                    'Communication',
                    'Pricing',
                    'Compliance',
                  ].map((category) => (
                    <label
                      key={category}
                      className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={feedbackForm.categories.includes(category)}
                        onChange={() => toggleCategory(category)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                      />
                      <span className="text-sm font-medium text-gray-700">
                        {category}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Feedback Notes */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Feedback Notes <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={feedbackForm.notes}
                  onChange={(e) =>
                    setFeedbackForm({ ...feedbackForm, notes: e.target.value })
                  }
                  placeholder="Provide detailed feedback about vendor performance..."
                  className="w-full h-32 px-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {feedbackForm.notes.length} characters
                </p>
              </div>

              {/* Attach File */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Attach File
                </label>
                <div className="flex items-center gap-3">
                  <label className="inline-flex items-center gap-2 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 cursor-pointer transition-colors text-sm font-medium">
                    <Paperclip className="w-4 h-4" />
                    Choose File
                    <input
                      type="file"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>
                  {attachedFile && (
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-sm">
                      <span>{attachedFile.name}</span>
                      <button
                        onClick={() => setAttachedFile(null)}
                        className="text-blue-700 hover:text-blue-900"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Internal Only Toggle */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm font-semibold text-gray-900">
                    Internal Only
                  </p>
                  <p className="text-xs text-gray-600 mt-1">
                    Feedback will not be shared with the vendor
                  </p>
                </div>
                <button
                  onClick={() =>
                    setFeedbackForm({
                      ...feedbackForm,
                      internalOnly: !feedbackForm.internalOnly,
                    })
                  }
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    feedbackForm.internalOnly ? 'bg-blue-600' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      feedbackForm.internalOnly
                        ? 'translate-x-6'
                        : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 rounded-b-xl flex items-center justify-end gap-3">
              <button
                onClick={() => setShowFeedbackModal(false)}
                className="px-5 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors text-sm font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitFeedback}
                className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all shadow-sm text-sm font-medium"
              >
                Submit Feedback
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
