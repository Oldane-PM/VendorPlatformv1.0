import { useState } from 'react';
import {
  X,
  Upload,
  FileText,
  Sparkles,
  Edit,
  AlertTriangle,
  CheckCircle,
  Info,
  Paperclip,
} from 'lucide-react';

interface EngagementContext {
  engagementId: string;
  vendorName: string;
  awardAmount: number;
  totalPaid: number;
  remainingBalance: number;
  currency: string;
}

interface InvoiceDetails {
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  currency: string;
  invoiceAmount: string;
  taxVat: string;
  description: string;
}

interface AIExtractionResult {
  confidence: 'High' | 'Medium' | 'Low';
  fieldsDetected: number;
  totalFields: number;
  issues: string[];
  extractedData: Partial<InvoiceDetails>;
  fieldConfidence: Record<keyof InvoiceDetails, 'High' | 'Medium' | 'Low'>;
}

interface UploadVendorInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  engagementContext: EngagementContext;
  onSave: (data: any) => void;
}

export function UploadVendorInvoiceModal({
  isOpen,
  onClose,
  engagementContext,
  onSave,
}: UploadVendorInvoiceModalProps) {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [entryMode, setEntryMode] = useState<'ai' | 'manual' | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractionResult, setExtractionResult] = useState<AIExtractionResult | null>(null);
  const [editedFields, setEditedFields] = useState<Set<string>>(new Set());
  const [showDuplicateWarning, setShowDuplicateWarning] = useState(false);

  const [invoiceDetails, setInvoiceDetails] = useState<InvoiceDetails>({
    invoiceNumber: '',
    invoiceDate: '',
    dueDate: '',
    currency: engagementContext.currency || 'USD',
    invoiceAmount: '',
    taxVat: '',
    description: '',
  });

  // Handle file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      setUploadedFile(file);
      setEntryMode(null);
      setExtractionResult(null);
    }
  };

  // Handle drag and drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type === 'application/pdf') {
      setUploadedFile(file);
      setEntryMode(null);
      setExtractionResult(null);
    }
  };

  // Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  // Run AI extraction
  const handleRunAIExtraction = async () => {
    setIsExtracting(true);
    setEntryMode('ai');

    // Simulate AI extraction (replace with actual API call)
    setTimeout(() => {
      const mockResult: AIExtractionResult = {
        confidence: 'High',
        fieldsDetected: 7,
        totalFields: 9,
        issues: ['Tax not found'],
        extractedData: {
          invoiceNumber: 'INV-2025-0089',
          invoiceDate: '2025-02-15',
          dueDate: '2025-03-15',
          currency: 'USD',
          invoiceAmount: '45000.00',
          taxVat: '',
          description: 'Q1 Cloud Infrastructure Services - February 2025',
        },
        fieldConfidence: {
          invoiceNumber: 'High',
          invoiceDate: 'High',
          dueDate: 'Medium',
          currency: 'High',
          invoiceAmount: 'High',
          taxVat: 'Low',
          description: 'Medium',
        },
      };

      setExtractionResult(mockResult);
      setInvoiceDetails((prev) => ({
        ...prev,
        ...mockResult.extractedData,
      }));
      setIsExtracting(false);

      // Check for duplicate invoice number (mock check)
      if (mockResult.extractedData.invoiceNumber === 'INV-2025-0089') {
        setShowDuplicateWarning(true);
      }
    }, 2500);
  };

  // Handle manual entry
  const handleEnterManually = () => {
    setEntryMode('manual');
    setExtractionResult(null);
  };

  // Handle field change
  const handleFieldChange = (field: keyof InvoiceDetails, value: string) => {
    setInvoiceDetails({ ...invoiceDetails, [field]: value });
    if (entryMode === 'ai') {
      setEditedFields(new Set(editedFields).add(field));
    }
  };

  // Replace file
  const handleReplaceFile = () => {
    if (window.confirm('Replace file and re-run extraction?')) {
      setUploadedFile(null);
      setEntryMode(null);
      setExtractionResult(null);
      setEditedFields(new Set());
    }
  };

  // Calculate total
  const calculateTotal = () => {
    const amount = parseFloat(invoiceDetails.invoiceAmount) || 0;
    const tax = parseFloat(invoiceDetails.taxVat) || 0;
    return amount + tax;
  };

  // Format currency
  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  // Check if amount exceeds remaining balance
  const amountExceedsBalance = () => {
    const total = calculateTotal();
    return total > engagementContext.remainingBalance;
  };

  // Handle save
  const handleSave = () => {
    // Validation
    if (!uploadedFile) {
      alert('Please upload an invoice file');
      return;
    }

    if (!invoiceDetails.invoiceNumber || !invoiceDetails.invoiceDate || !invoiceDetails.invoiceAmount) {
      alert('Please fill in all required fields');
      return;
    }

    if (amountExceedsBalance()) {
      if (!window.confirm('Invoice amount exceeds remaining balance. Save as "Requires Approval"?')) {
        return;
      }
    }

    // Save logic
    onSave({
      file: uploadedFile,
      details: invoiceDetails,
      extractionResult,
      editedFields: Array.from(editedFields),
    });
  };

  // Get confidence badge
  const getConfidenceBadge = (confidence: 'High' | 'Medium' | 'Low') => {
    const colors = {
      High: 'bg-green-100 text-green-700 border-green-200',
      Medium: 'bg-amber-100 text-amber-700 border-amber-200',
      Low: 'bg-red-100 text-red-700 border-red-200',
    };
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${colors[confidence]}`}>
        {confidence}
      </span>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-900/35 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-xl z-10">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-gray-900">Upload Vendor Invoice</h2>
              <p className="text-sm text-gray-500 mt-1">
                Upload the vendor's invoice PDF. Use AI extraction to prefill fields, or enter details manually.
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          {/* Section A: Upload Invoice File */}
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <h3 className="text-sm font-semibold text-gray-900 mb-4 uppercase tracking-wider">
              Vendor Invoice File
            </h3>

            {!uploadedFile ? (
              /* Dropzone */
              <div
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-primary transition-colors cursor-pointer"
              >
                <input
                  type="file"
                  id="invoice-upload"
                  accept="application/pdf"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <label htmlFor="invoice-upload" className="cursor-pointer">
                  <Upload className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-sm font-medium text-gray-700 mb-1">
                    Upload Invoice (PDF)
                  </p>
                  <p className="text-xs text-gray-500 mb-3">
                    Click to browse or drag and drop
                  </p>
                  <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium">
                    Browse Files
                  </button>
                  <p className="text-xs text-gray-400 mt-3">
                    Accepted types: PDF (max 10MB)
                  </p>
                </label>
              </div>
            ) : (
              /* File Chip */
              <div>
                <div className="flex items-center justify-between p-4 bg-blue-50 border border-blue-200 rounded-lg mb-4">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <FileText className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {uploadedFile.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatFileSize(uploadedFile.size)} • PDF
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleReplaceFile}
                    className="px-3 py-1.5 text-sm font-medium text-blue-700 hover:bg-blue-100 rounded-lg transition-colors"
                  >
                    Replace
                  </button>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleRunAIExtraction}
                    disabled={isExtracting || entryMode === 'ai'}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-semibold shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Sparkles className="w-4 h-4" />
                    {isExtracting ? 'Extracting...' : 'Run AI Extraction'}
                  </button>
                  <button
                    onClick={handleEnterManually}
                    disabled={entryMode === 'manual'}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Edit className="w-4 h-4" />
                    Enter Manually
                  </button>
                </div>

                {/* Loading State */}
                {isExtracting && (
                  <div className="mt-4">
                    <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                      <span>Extracting invoice data...</span>
                      <span>65%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                      <div className="bg-primary h-2 rounded-full animate-pulse" style={{ width: '65%' }}></div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Section B: Engagement Context (Read-only) */}
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">
                Engagement Context
              </h3>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-200 text-gray-600">
                Read-only
              </span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                  Vendor Engagement ID
                </p>
                <p className="text-sm text-gray-900 font-mono">{engagementContext.engagementId}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                  Vendor Name
                </p>
                <p className="text-sm text-gray-900">{engagementContext.vendorName}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                  Award Amount
                </p>
                <p className="text-sm font-semibold text-gray-900">
                  {formatCurrency(engagementContext.awardAmount, engagementContext.currency)}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                  Total Paid So Far
                </p>
                <p className="text-sm font-semibold text-gray-900">
                  {formatCurrency(engagementContext.totalPaid, engagementContext.currency)}
                </p>
              </div>
              <div className="col-span-2">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                  Remaining Balance
                </p>
                <p className="text-lg font-bold text-green-600">
                  {formatCurrency(engagementContext.remainingBalance, engagementContext.currency)}
                </p>
              </div>
            </div>
          </div>

          {/* AI Extraction Summary */}
          {extractionResult && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-semibold text-blue-900">Extraction Summary</h4>
                    {getConfidenceBadge(extractionResult.confidence)}
                  </div>
                  <div className="space-y-1 text-xs text-blue-700">
                    <p>
                      <strong>Fields detected:</strong> {extractionResult.fieldsDetected} / {extractionResult.totalFields}
                    </p>
                    {extractionResult.issues.length > 0 && (
                      <p>
                        <strong>Issues:</strong> {extractionResult.issues.join(', ')}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Duplicate Invoice Warning */}
          {showDuplicateWarning && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-amber-900 mb-1">Possible Duplicate Invoice</p>
                  <p className="text-xs text-amber-700">
                    An invoice with this number already exists for this vendor. Please verify before saving.
                  </p>
                </div>
                <button
                  onClick={() => setShowDuplicateWarning(false)}
                  className="text-amber-600 hover:text-amber-800"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Amount Exceeds Balance Warning */}
          {entryMode && amountExceedsBalance() && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-red-900 mb-1">Invoice Exceeds Remaining Balance</p>
                  <p className="text-xs text-red-700">
                    The invoice amount ({formatCurrency(calculateTotal(), invoiceDetails.currency)}) exceeds the
                    remaining engagement balance ({formatCurrency(engagementContext.remainingBalance, engagementContext.currency)}).
                    This will require approval workflow.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Section C: Invoice Details */}
          {entryMode && (
            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <h3 className="text-sm font-semibold text-gray-900 mb-4 uppercase tracking-wider">
                Invoice Details
              </h3>

              <div className="grid grid-cols-2 gap-4">
                {/* Invoice Number */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Invoice Number <span className="text-red-500">*</span>
                    {entryMode === 'ai' && extractionResult && (
                      <span className="ml-2">
                        {getConfidenceBadge(extractionResult.fieldConfidence.invoiceNumber)}
                      </span>
                    )}
                    {editedFields.has('invoiceNumber') && (
                      <span className="ml-2 inline-flex items-center text-xs text-blue-600">
                        <Edit className="w-3 h-3 mr-1" />
                        Edited
                      </span>
                    )}
                  </label>
                  <input
                    type="text"
                    value={invoiceDetails.invoiceNumber}
                    onChange={(e) => handleFieldChange('invoiceNumber', e.target.value)}
                    placeholder="INV-2025-0001"
                    required
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>

                {/* Invoice Date */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Invoice Date <span className="text-red-500">*</span>
                    {entryMode === 'ai' && extractionResult && (
                      <span className="ml-2">
                        {getConfidenceBadge(extractionResult.fieldConfidence.invoiceDate)}
                      </span>
                    )}
                    {editedFields.has('invoiceDate') && (
                      <span className="ml-2 inline-flex items-center text-xs text-blue-600">
                        <Edit className="w-3 h-3 mr-1" />
                        Edited
                      </span>
                    )}
                  </label>
                  <input
                    type="date"
                    value={invoiceDetails.invoiceDate}
                    onChange={(e) => handleFieldChange('invoiceDate', e.target.value)}
                    required
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>

                {/* Due Date */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Due Date
                    {entryMode === 'ai' && extractionResult && (
                      <span className="ml-2">
                        {getConfidenceBadge(extractionResult.fieldConfidence.dueDate)}
                      </span>
                    )}
                    {editedFields.has('dueDate') && (
                      <span className="ml-2 inline-flex items-center text-xs text-blue-600">
                        <Edit className="w-3 h-3 mr-1" />
                        Edited
                      </span>
                    )}
                  </label>
                  <input
                    type="date"
                    value={invoiceDetails.dueDate}
                    onChange={(e) => handleFieldChange('dueDate', e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>

                {/* Currency */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Currency <span className="text-red-500">*</span>
                    {entryMode === 'ai' && extractionResult && (
                      <span className="ml-2">
                        {getConfidenceBadge(extractionResult.fieldConfidence.currency)}
                      </span>
                    )}
                  </label>
                  <select
                    value={invoiceDetails.currency}
                    onChange={(e) => handleFieldChange('currency', e.target.value)}
                    required
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  >
                    <option value="USD">USD - US Dollar</option>
                    <option value="CAD">CAD - Canadian Dollar</option>
                    <option value="JMD">JMD - Jamaican Dollar</option>
                    <option value="EUR">EUR - Euro</option>
                    <option value="GBP">GBP - British Pound</option>
                  </select>
                </div>

                {/* Invoice Amount */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Invoice Amount <span className="text-red-500">*</span>
                    {entryMode === 'ai' && extractionResult && (
                      <span className="ml-2">
                        {getConfidenceBadge(extractionResult.fieldConfidence.invoiceAmount)}
                      </span>
                    )}
                    {editedFields.has('invoiceAmount') && (
                      <span className="ml-2 inline-flex items-center text-xs text-blue-600">
                        <Edit className="w-3 h-3 mr-1" />
                        Edited
                      </span>
                    )}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={invoiceDetails.invoiceAmount}
                    onChange={(e) => handleFieldChange('invoiceAmount', e.target.value)}
                    placeholder="0.00"
                    required
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Remaining: {formatCurrency(engagementContext.remainingBalance, engagementContext.currency)}
                  </p>
                </div>

                {/* Tax/VAT */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Tax/VAT
                    {entryMode === 'ai' && extractionResult && (
                      <span className="ml-2">
                        {getConfidenceBadge(extractionResult.fieldConfidence.taxVat)}
                      </span>
                    )}
                    {editedFields.has('taxVat') && (
                      <span className="ml-2 inline-flex items-center text-xs text-blue-600">
                        <Edit className="w-3 h-3 mr-1" />
                        Edited
                      </span>
                    )}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={invoiceDetails.taxVat}
                    onChange={(e) => handleFieldChange('taxVat', e.target.value)}
                    placeholder="0.00"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>

                {/* Total (calculated) */}
                <div className="col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Total Amount
                  </label>
                  <div className="px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-lg">
                    <p className="text-lg font-bold text-gray-900">
                      {formatCurrency(calculateTotal(), invoiceDetails.currency)}
                    </p>
                  </div>
                </div>

                {/* Description */}
                <div className="col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Description / Notes <span className="text-red-500">*</span>
                    {entryMode === 'ai' && extractionResult && (
                      <span className="ml-2">
                        {getConfidenceBadge(extractionResult.fieldConfidence.description)}
                      </span>
                    )}
                    {editedFields.has('description') && (
                      <span className="ml-2 inline-flex items-center text-xs text-blue-600">
                        <Edit className="w-3 h-3 mr-1" />
                        Edited
                      </span>
                    )}
                  </label>
                  <textarea
                    value={invoiceDetails.description}
                    onChange={(e) => handleFieldChange('description', e.target.value)}
                    placeholder="Describe the work completed or services provided..."
                    rows={4}
                    required
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Info Banner */}
          {!entryMode && uploadedFile && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex gap-3">
                <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-blue-900 mb-1">Next Step</p>
                  <p className="text-xs text-blue-700">
                    Choose to run AI extraction for automatic field population, or enter invoice details manually.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 rounded-b-xl">
          <div className="flex items-center justify-end gap-3">
            <button
              onClick={onClose}
              className="px-5 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!entryMode || isExtracting}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-semibold shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <CheckCircle className="w-4 h-4" />
              Save Invoice
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}