import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import {
  useWorkOrderQuoteUploadPortal,
  UploadFileState,
} from '@/lib/hooks/useWorkOrderQuoteUploadPortal';
import {
  Loader2,
  AlertCircle,
  FileText,
  Upload,
  CheckCircle,
  X,
  Sparkles,
  Download,
  Save,
} from 'lucide-react';
import { CreateSubmissionPayload } from '@/lib/supabase/repos/workOrderQuotePortalRepo';
import { ExtractedDocumentData, ExtractedLineItem } from '@/lib/server/services/aiDocumentExtractionService';

export default function VendorWorkOrderPortalPage() {
  const router = useRouter();
  const { requestId, t: token } = router.query;
  const isReady = router.isReady;

  const {
    context,
    submissionId,
    uploads,
    setUploads,
    loading,
    error,
    loadContext,
    submitVendorInfo,
    uploadFiles,
    confirmSubmission,
    extractDocument,
  } = useWorkOrderQuoteUploadPortal(requestId as string, token as string);

  useEffect(() => {
    if (isReady && requestId && token) {
      loadContext();
    }
  }, [isReady, requestId, token, loadContext]);

  const [formData, setFormData] = useState<CreateSubmissionPayload>({
    vendorName: '',
    vendorEmail: '',
    vendorPhone: '',
    taxId: '',
    vendorCode: '',
    currency: 'JMD',
    quotedAmount: undefined,
    message: '',
  });

  const [autoSubmitted, setAutoSubmitted] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [extractedData, setExtractedData] = useState<ExtractedDocumentData | null>(null);

  // Auto-submit vendor info as draft to prepare the session
  useEffect(() => {
    if (!context || autoSubmitted || submissionId) return;
    const payload: CreateSubmissionPayload = {
      vendorName: context.vendor?.name || 'Vendor',
      vendorEmail: context.vendor?.email || '',
      vendorPhone: context.vendor?.phone || '',
      taxId: context.vendor?.taxId || '',
      vendorCode: context.vendor?.vendorCode || '',
      currency: 'JMD',
      quotedAmount: undefined,
      message: '',
    };
    setFormData(payload);
    setAutoSubmitted(true);
    submitVendorInfo(payload).catch(() => {});
  }, [context, autoSubmitted, submissionId]);

  // ─── Loading / Error ──────────────────────────────────────────────────

  if (!isReady || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600 mb-4" />
        <h1 className="text-xl font-semibold text-gray-900">Loading Security Check...</h1>
        <p className="text-sm text-gray-500 mt-2">Verifying your secure link, please wait.</p>
      </div>
    );
  }

  if ((error && !context) || !context) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-red-100 max-w-md w-full text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-xl font-semibold text-gray-900 mb-2">Link Invalid or Expired</h1>
          <p className="text-gray-600 mb-6">{error || 'The secure link you clicked is no longer valid.'}</p>
          <div className="bg-gray-50 p-4 rounded-lg text-sm text-gray-500 border border-gray-100">
            Please contact your Oldane representative to request a new secure upload link.
          </div>
        </div>
      </div>
    );
  }

  // ─── Handlers ─────────────────────────────────────────────────────────

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
    else if (e.type === 'dragleave') setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      addFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      addFiles(Array.from(e.target.files));
    }
  };

  const addFiles = (files: File[]) => {
    const newUploads = files.map((file) => ({
      id: Math.random().toString(36).substring(2, 9),
      file,
      doc_type: 'quote',
      progress: 0,
      status: 'pending' as const,
    }));
    setUploads((prev) => [...prev, ...newUploads]);
  };

  const removeFile = (id: string) => {
    setUploads((prev) => prev.filter((u) => u.id !== id));
  };

  // Upload files to storage, then run AI extraction on the first completed file
  const handleAIExtract = async () => {
    if (!submissionId) return;
    setProcessing(true);
    try {
      // 1. Upload all pending files
      const pendingFiles = uploads.filter((u) => u.status === 'pending' || u.status === 'error');
      if (pendingFiles.length > 0) {
        await uploadFiles(pendingFiles);
      }

      // 2. Wait a tick for state to settle, then find the first completed file
      // We need to read the latest uploads so we use a callback
      await new Promise<void>((resolve) => {
        setTimeout(() => {
          setUploads((currentUploads) => {
            const completedFile = currentUploads.find((u) => u.status === 'completed' && u.uploadFileId);
            if (completedFile && completedFile.uploadFileId) {
              // Trigger extraction (async, outside setState)
              extractDocument(completedFile.uploadFileId)
                .then((data) => {
                  setExtractedData(data);
                  if (data.paymentTerms.totalAmount) {
                    setFormData((prev) => ({ ...prev, quotedAmount: data.paymentTerms.totalAmount }));
                  }
                })
                .catch((err) => console.error('Extraction failed:', err))
                .finally(() => setProcessing(false));
            } else {
              setProcessing(false);
            }
            return currentUploads; // don't mutate
          });
          resolve();
        }, 500);
      });
    } catch (err) {
      console.error(err);
      setProcessing(false);
    }
  };

  const handleConfirm = async () => {
    setConfirming(true);
    try {
      await confirmSubmission();
      setIsConfirmed(true);
    } catch (err) {
      console.error(err);
    } finally {
      setConfirming(false);
    }
  };

  const updateExtractedLineItem = (index: number, field: keyof ExtractedLineItem, value: string) => {
    if (!extractedData) return;
    const updatedItems = [...extractedData.lineItems];
    if (field === 'description') {
      updatedItems[index] = { ...updatedItems[index], description: value };
    } else {
      updatedItems[index] = { ...updatedItems[index], [field]: Number(value) || 0 };
    }
    setExtractedData({ ...extractedData, lineItems: updatedItems });
  };

  const exportCSV = () => {
    if (!extractedData) return;
    let csv = 'Section,Field,Value\n';
    csv += `Vendor Information,Vendor Name,"${extractedData.vendorInfo.vendorName}"\n`;
    csv += `Vendor Information,Contact Person,"${extractedData.vendorInfo.contactPerson}"\n`;
    csv += `Vendor Information,Email,"${extractedData.vendorInfo.email}"\n`;
    csv += `Vendor Information,Phone,"${extractedData.vendorInfo.phone}"\n`;
    csv += `Vendor Information,Address,"${extractedData.vendorInfo.address}"\n`;
    csv += '\nItem Description,Quantity,Unit Price,Total\n';
    for (const item of extractedData.lineItems) {
      csv += `"${item.description}",${item.quantity},${item.unitPrice},${item.total}\n`;
    }
    csv += `\nPayment Terms,${extractedData.paymentTerms.paymentTerms}\n`;
    csv += `Total Amount,${extractedData.paymentTerms.totalAmount}\n`;
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `extraction-${extractedData.fileName}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: formData.currency || 'USD' }).format(val);

  const pendingFiles = uploads.filter((u) => u.status === 'pending');
  const hasFiles = uploads.length > 0;

  // ─── Success Screen ───────────────────────────────────────────────────

  if (isConfirmed) {
    return (
      <>
        <Head><title>Upload Complete | Oldane</title></Head>
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
          <div className="bg-white p-10 rounded-2xl shadow-sm border border-gray-200 max-w-md w-full text-center">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-6">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Submission Complete!</h3>
            <p className="text-gray-600 mb-8 max-w-sm mx-auto">
              Your documents have been successfully submitted for review. The procurement team will be notified.
            </p>
            <button type="button" onClick={() => window.close()}
              className="inline-flex items-center px-6 py-3 border border-gray-300 shadow-sm text-sm font-semibold rounded-xl text-gray-700 bg-white hover:bg-gray-50 transition-colors">
              Close Window
            </button>
          </div>
        </div>
      </>
    );
  }

  // ─── Main Portal Page ─────────────────────────────────────────────────

  return (
    <>
      <Head><title>Secure Document Upload | Oldane</title></Head>
      <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl w-full mx-auto space-y-6">

          {/* Header */}
          <div className="text-center">
            <div className="mx-auto h-12 w-12 bg-blue-600 text-white rounded-xl flex items-center justify-center font-bold text-xl shadow-sm mb-4">OP</div>
            <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">Secure Document Upload</h2>
            <p className="mt-2 text-sm text-gray-500">Submit your quotation and related documents securely.</p>
          </div>

          {/* Work Order Information */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <span className="w-1 h-5 bg-blue-600 rounded-full inline-block"></span>
                Work Order Information
              </h3>
            </div>
            <div className="px-6 py-4">
              <table className="w-full text-sm">
                <tbody>
                  <tr className="border-b border-gray-50">
                    <td className="py-3 pr-4 font-medium text-gray-500 w-1/3">Work Order Number</td>
                    <td className="py-3 text-gray-900">{context.workOrderNumber || 'N/A'}</td>
                  </tr>
                  <tr className="border-b border-gray-50">
                    <td className="py-3 pr-4 font-medium text-gray-500 w-1/3">Title</td>
                    <td className="py-3 text-gray-900">{context.workOrderTitle || 'N/A'}</td>
                  </tr>
                  <tr className="border-b border-gray-50">
                    <td className="py-3 pr-4 font-medium text-gray-500 w-1/3">Required Documents</td>
                    <td className="py-3 text-gray-900 capitalize">{context.allowedDocTypes.join(', ')}</td>
                  </tr>
                  <tr>
                    <td className="py-3 pr-4 font-medium text-gray-500 w-1/3">Link Expires</td>
                    <td className="py-3 text-gray-900">{new Date(context.expiresAt).toLocaleDateString()}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Vendor Information */}
          {context.vendor && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100">
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <span className="w-1 h-5 bg-indigo-600 rounded-full inline-block"></span>
                  Vendor Information
                </h3>
              </div>
              <div className="px-6 py-4">
                <table className="w-full text-sm">
                  <tbody>
                    <tr className="border-b border-gray-50">
                      <td className="py-3 pr-4 font-medium text-gray-500 w-1/3">Vendor Name</td>
                      <td className="py-3 text-gray-900">{context.vendor.name}</td>
                    </tr>
                    {context.vendor.email && (
                      <tr className="border-b border-gray-50">
                        <td className="py-3 pr-4 font-medium text-gray-500 w-1/3">Email</td>
                        <td className="py-3 text-gray-900">{context.vendor.email}</td>
                      </tr>
                    )}
                    {context.vendor.phone && (
                      <tr className="border-b border-gray-50">
                        <td className="py-3 pr-4 font-medium text-gray-500 w-1/3">Phone</td>
                        <td className="py-3 text-gray-900">{context.vendor.phone}</td>
                      </tr>
                    )}
                    {context.vendor.taxId && (
                      <tr className="border-b border-gray-50">
                        <td className="py-3 pr-4 font-medium text-gray-500 w-1/3">Tax ID</td>
                        <td className="py-3 text-gray-900">{context.vendor.taxId}</td>
                      </tr>
                    )}
                    {context.vendor.vendorCode && (
                      <tr>
                        <td className="py-3 pr-4 font-medium text-gray-500 w-1/3">Vendor Code</td>
                        <td className="py-3 text-gray-900">{context.vendor.vendorCode}</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ═══ Upload Documents ═══ */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <span className="w-1 h-5 bg-emerald-600 rounded-full inline-block"></span>
                Upload Documents
              </h3>
            </div>
            <div className="px-6 py-6 space-y-5">
              {/* Dropzone — always visible until extraction is done */}
              {!extractedData && (
                <div
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-xl p-10 text-center transition-colors ${
                    dragActive
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
                  }`}
                >
                  <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <p className="text-base font-semibold text-gray-700 mb-1">Drag and drop files here</p>
                  <p className="text-sm text-gray-500 mb-3">
                    or{' '}
                    <span className="text-blue-600 cursor-pointer hover:underline relative">
                      click to browse your computer
                      <input
                        type="file"
                        multiple
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        onChange={handleFileInput}
                      />
                    </span>
                  </p>
                  <p className="text-xs text-gray-400">
                    Supported formats: PDF, DOC, DOCX, XLS, XLSX, PNG, JPG up to 10MB
                  </p>
                </div>
              )}

              {/* File List + AI Extract button */}
              {hasFiles && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold text-gray-700">
                      Files Ready for Processing ({uploads.length})
                    </h4>
                    {/* AI Extract Data button */}
                    {!extractedData && submissionId && (
                      <button
                        onClick={handleAIExtract}
                        disabled={processing || pendingFiles.length === 0}
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-blue-600 text-white text-sm font-bold rounded-lg hover:from-indigo-700 hover:to-blue-700 transition-all disabled:opacity-50 shadow-sm"
                      >
                        {processing ? (
                          <><Loader2 className="w-4 h-4 animate-spin" /> Processing...</>
                        ) : (
                          <><Sparkles className="w-4 h-4" /> AI Extract Data</>
                        )}
                      </button>
                    )}
                  </div>

                  {uploads.map((file) => (
                    <div
                      key={file.id}
                      className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-200 rounded-lg"
                    >
                      <FileText className={`w-6 h-6 flex-shrink-0 ${
                        file.status === 'completed' ? 'text-green-500' : 'text-blue-500'
                      }`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{file.file.name}</p>
                        <p className="text-xs text-gray-500">{(file.file.size / 1024 / 1024).toFixed(2)} MB</p>
                        {file.status === 'uploading' && (
                          <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                            <div className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
                              style={{ width: `${file.progress}%` }}></div>
                          </div>
                        )}
                        {file.status === 'error' && (
                          <p className="text-xs text-red-600 mt-1">{file.errorMessage}</p>
                        )}
                      </div>
                      {file.status === 'completed' && <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />}
                      {(file.status === 'pending' || file.status === 'error') && !processing && (
                        <button type="button" onClick={() => removeFile(file.id)}
                          className="p-1 text-gray-400 hover:text-red-500 rounded transition-colors">
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Waiting for session */}
              {hasFiles && !submissionId && (
                <div className="flex items-center justify-center gap-2 py-3 text-sm text-gray-500">
                  <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                  Preparing upload session...
                </div>
              )}
            </div>
          </div>

          {/* ═══ Extracted Data ═══ */}
          {extractedData && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              {/* Header */}
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Sparkles className="w-5 h-5 text-indigo-600" />
                  <h3 className="text-lg font-bold text-gray-900">Extracted Data</h3>
                  <span className="text-xs font-semibold bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                    {uploads.filter((u) => u.status === 'completed').length} Document{uploads.filter((u) => u.status === 'completed').length !== 1 ? 's' : ''}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={handleConfirm} disabled={confirming}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-green-600 text-white text-sm font-bold rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50">
                    {confirming ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    {confirming ? 'Saving...' : 'Save to Database'}
                  </button>
                  <button onClick={exportCSV}
                    className="inline-flex items-center gap-1.5 px-3 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors">
                    <Download className="w-4 h-4" /> Export CSV
                  </button>
                </div>
              </div>

              {/* File banner */}
              <div className="px-6 py-3 bg-blue-50 border-b border-blue-100 flex items-center gap-3">
                <FileText className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="text-sm font-semibold text-gray-900">{extractedData.fileName}</p>
                  <p className="text-xs text-gray-500">
                    Extracted on {new Date(extractedData.extractedAt).toLocaleDateString()},{' '}
                    {new Date(extractedData.extractedAt).toLocaleTimeString()}
                  </p>
                </div>
              </div>

              <div className="divide-y divide-gray-100">
                {/* Vendor Information */}
                <div className="px-6 py-5">
                  <h4 className="text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <span className="w-1 h-4 bg-blue-600 rounded-full inline-block"></span>
                    Vendor Information
                  </h4>
                  <table className="w-full text-sm">
                    <tbody>
                      {([
                        ['Vendor Name', 'vendorName'],
                        ['Vendor ID', 'vendorId'],
                        ['Contact Person', 'contactPerson'],
                        ['Email', 'email'],
                        ['Phone', 'phone'],
                        ['Address', 'address'],
                      ] as const).map(([label, key]) => (
                        <tr key={key} className="border-b border-gray-50">
                          <td className="py-2.5 pr-4 font-medium text-gray-500 w-1/3">{label}</td>
                          <td className="py-2.5">
                            <input type="text"
                              value={(extractedData.vendorInfo as any)[key] || ''}
                              onChange={(e) => setExtractedData({
                                ...extractedData,
                                vendorInfo: { ...extractedData.vendorInfo, [key]: e.target.value },
                              })}
                              className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Line Items */}
                {extractedData.lineItems.length > 0 && (
                  <div className="px-6 py-5">
                    <h4 className="text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
                      <span className="w-1 h-4 bg-blue-600 rounded-full inline-block"></span>
                      Line Items
                    </h4>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-gray-50 text-left">
                            <th className="px-3 py-2.5 font-semibold text-gray-600">Item Description</th>
                            <th className="px-3 py-2.5 font-semibold text-gray-600">Quantity</th>
                            <th className="px-3 py-2.5 font-semibold text-gray-600">Unit Price</th>
                            <th className="px-3 py-2.5 font-semibold text-gray-600">Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {extractedData.lineItems.map((item, idx) => (
                            <tr key={idx} className="border-b border-gray-50">
                              <td className="px-3 py-2">
                                <input type="text" value={item.description}
                                  onChange={(e) => updateExtractedLineItem(idx, 'description', e.target.value)}
                                  className="w-full px-2 py-1 border border-gray-200 rounded text-sm focus:ring-2 focus:ring-blue-500" />
                              </td>
                              <td className="px-3 py-2">
                                <input type="number" value={item.quantity}
                                  onChange={(e) => updateExtractedLineItem(idx, 'quantity', e.target.value)}
                                  className="w-20 px-2 py-1 border border-gray-200 rounded text-sm focus:ring-2 focus:ring-blue-500" />
                              </td>
                              <td className="px-3 py-2">
                                <input type="number" step="0.01" value={item.unitPrice}
                                  onChange={(e) => updateExtractedLineItem(idx, 'unitPrice', e.target.value)}
                                  className="w-28 px-2 py-1 border border-gray-200 rounded text-sm focus:ring-2 focus:ring-blue-500" />
                              </td>
                              <td className="px-3 py-2 font-semibold text-gray-900">{formatCurrency(item.total)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Payment Terms */}
                <div className="px-6 py-5">
                  <h4 className="text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <span className="w-1 h-4 bg-indigo-600 rounded-full inline-block"></span>
                    Payment Terms
                  </h4>
                  <table className="w-full text-sm">
                    <tbody>
                      {([
                        ['Payment Terms', 'paymentTerms'],
                        ['Delivery Date', 'deliveryDate'],
                        ['Warranty', 'warranty'],
                      ] as const).map(([label, key]) => (
                        <tr key={key} className="border-b border-gray-50">
                          <td className="py-2.5 pr-4 font-medium text-gray-500 w-1/3">{label}</td>
                          <td className="py-2.5">
                            <input type="text"
                              value={(extractedData.paymentTerms as any)[key] || ''}
                              onChange={(e) => setExtractedData({
                                ...extractedData,
                                paymentTerms: { ...extractedData.paymentTerms, [key]: e.target.value },
                              })}
                              className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                            />
                          </td>
                        </tr>
                      ))}
                      <tr className="border-b border-gray-50">
                        <td className="py-2.5 pr-4 font-medium text-gray-500 w-1/3">Subtotal</td>
                        <td className="py-2.5 font-medium">{formatCurrency(extractedData.paymentTerms.subtotal)}</td>
                      </tr>
                      <tr className="border-b border-gray-50">
                        <td className="py-2.5 pr-4 font-medium text-gray-500 w-1/3">
                          Tax {extractedData.paymentTerms.taxRate ? `(${extractedData.paymentTerms.taxRate})` : ''}
                        </td>
                        <td className="py-2.5 font-medium">{formatCurrency(extractedData.paymentTerms.tax)}</td>
                      </tr>
                      <tr>
                        <td className="py-2.5 pr-4 font-bold text-gray-700 w-1/3">Total Amount</td>
                        <td className="py-2.5 font-bold text-gray-900">{formatCurrency(extractedData.paymentTerms.totalAmount)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Contract Details */}
                <div className="px-6 py-5">
                  <h4 className="text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <span className="w-1 h-4 bg-green-600 rounded-full inline-block"></span>
                    Contract Details
                  </h4>
                  <table className="w-full text-sm">
                    <tbody>
                      {([
                        ['Contract Number', 'contractNumber'],
                        ['Contract Date', 'contractDate'],
                        ['Valid Until', 'validUntil'],
                        ['Approval Required', 'approvalRequired'],
                        ['Department', 'department'],
                      ] as const).map(([label, key]) => (
                        <tr key={key} className="border-b border-gray-50 last:border-b-0">
                          <td className="py-2.5 pr-4 font-medium text-gray-500 w-1/3">{label}</td>
                          <td className="py-2.5">
                            <input type="text"
                              value={(extractedData.contractDetails as any)[key] || ''}
                              onChange={(e) => setExtractedData({
                                ...extractedData,
                                contractDetails: { ...extractedData.contractDetails, [key]: e.target.value },
                              })}
                              className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Error display */}
          {error && (
            <div className="p-4 bg-red-50 text-red-700 text-sm rounded-xl border border-red-100">{error}</div>
          )}

          {/* Footer */}
          <div className="text-center pb-8">
            <p className="text-xs text-gray-400">Powered by Oldane Vendor Platform</p>
          </div>
        </div>
      </div>
    </>
  );
}
