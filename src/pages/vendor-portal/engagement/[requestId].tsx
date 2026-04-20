import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import {
  useEngagementInvoiceUploadPortal,
  InvoiceUploadFileState,
} from '@/lib/hooks/useEngagementInvoiceUploadPortal';
import {
  Loader2,
  AlertCircle,
  FileText,
  Upload,
  CheckCircle,
  X,
  CreditCard,
  Building,
  Plus,
  Trash2,
} from 'lucide-react';
import { CreateInvoiceSubmissionPayload } from '@/lib/supabase/repos/engagementInvoicePortalRepo';
import Decimal from 'decimal.js';

interface InvoiceLineItem {
  id: string;
  description: string;
  amount: string;
  taxPercentage: string;
}

export default function VendorEngagementInvoicePortalPage() {
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
    submitInvoiceMeta,
    uploadFiles,
  } = useEngagementInvoiceUploadPortal(requestId as string, token as string);

  useEffect(() => {
    if (isReady && requestId && token) {
      loadContext();
    }
  }, [isReady, requestId, token, loadContext]);

  // Form State
  const [formData, setFormData] = useState<CreateInvoiceSubmissionPayload>(
    () => {
      let seq = 1;

      // Only access localStorage on the client side
      if (typeof window !== 'undefined') {
        seq = parseInt(localStorage.getItem('invoiceSeq') || '1', 10);
        localStorage.setItem('invoiceSeq', (seq + 1).toString());
      }

      const today = new Date().toISOString().split('T')[0];

      return {
        invoiceNumber: `INV-${seq.toString().padStart(4, '0')}`,
        invoiceDate: today,
        dueDate: '',
        currency: 'JMD',
        subtotal: undefined,
        taxTotal: undefined,
        total: undefined,
        message: '',
      };
    }
  );

  const [submittingInfo, setSubmittingInfo] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const [isDone, setIsDone] = useState(false);

  // Line Items State
  const [lineItems, setLineItems] = useState<InvoiceLineItem[]>([]);

  useEffect(() => {
    if (lineItems.length === 0) return;

    let subtotal = new Decimal(0);
    let taxTotal = new Decimal(0);

    lineItems.forEach((item) => {
      const amount = new Decimal(item.amount || 0);
      const taxPercentage = new Decimal(item.taxPercentage || 0);

      const tax = amount.times(taxPercentage).dividedBy(100);

      subtotal = subtotal.plus(amount);
      taxTotal = taxTotal.plus(tax);
    });

    const total = subtotal.plus(taxTotal);

    setFormData((prev) => ({
      ...prev,
      subtotal: subtotal.toDecimalPlaces(2).toNumber(),
      taxTotal: taxTotal.toDecimalPlaces(2).toNumber(),
      total: total.toDecimalPlaces(2).toNumber(),
    }));
  }, [lineItems]);

  const addLineItem = () => {
    setLineItems([
      ...lineItems,
      {
        id: Math.random().toString(36).substring(2, 9),
        description: '',
        amount: '',
        taxPercentage: '',
      },
    ]);
  };

  const removeLineItem = (id: string) => {
    setLineItems(lineItems.filter((item) => item.id !== id));
  };

  const updateLineItem = (
    id: string,
    field: keyof InvoiceLineItem,
    value: string
  ) => {
    setLineItems(
      lineItems.map((item) =>
        item.id === id ? { ...item, [field]: value } : item
      )
    );
  };

  const formatCurrency = (amount: number | undefined) => {
    if (amount === undefined) return '';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: formData.currency || 'USD',
    }).format(amount);
  };

  // File Drag & Drop State
  const [dragActive, setDragActive] = useState(false);

  if (!isReady || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600 mb-4" />
        <h1 className="text-xl font-semibold text-gray-900">
          Loading Security Check...
        </h1>
        <p className="text-sm text-gray-500 mt-2">
          Verifying your secure link, please wait.
        </p>
      </div>
    );
  }

  if (error || !context) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-red-100 max-w-md w-full text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-xl font-semibold text-gray-900 mb-2">
            Link Invalid or Expired
          </h1>
          <p className="text-gray-600 mb-6">
            {error || 'The secure link you clicked is no longer valid.'}
          </p>
          <div className="bg-gray-50 p-4 rounded-lg text-sm text-gray-500 border border-gray-100">
            Please contact your Oldane representative to request a new secure
            upload link.
          </div>
        </div>
      </div>
    );
  }

  const handleInfoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingInfo(true);
    try {
      await submitInvoiceMeta(formData);
    } catch (err) {
      // Error is handled in the hook
    } finally {
      setSubmittingInfo(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(Array.from(e.target.files));
    }
  };

  const handleFiles = (files: File[]) => {
    const newUploads = files.map((file) => {
      return {
        id: Math.random().toString(36).substring(2, 9),
        file,
        progress: 0,
        status: 'pending' as const,
      };
    });

    setUploads((prev) => [...prev, ...newUploads]);
  };

  const removeFile = (id: string) => {
    setUploads((prev) => prev.filter((u) => u.id !== id));
  };

  const startUploadProcess = async () => {
    setUploadingFiles(true);
    try {
      await uploadFiles(
        uploads.filter((u) => u.status === 'pending' || u.status === 'error')
      );
      setIsDone(true);
    } catch (err) {
      // Error handled partially in hook
    } finally {
      setUploadingFiles(false);
    }
  };

  const allCompleted =
    uploads.length > 0 && uploads.every((u) => u.status === 'completed');

  return (
    <>
      <Head>
        <title>Secure Invoice Upload | Oldane</title>
      </Head>

      <div className="min-h-screen bg-gray-50 flex flex-col py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl w-full mx-auto space-y-8">
          {/* Header */}
          <div className="text-center">
            <div className="mx-auto h-12 w-12 bg-blue-600 text-white rounded-xl flex items-center justify-center font-bold text-xl shadow-sm mb-4">
              OP
            </div>
            <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">
              Secure Invoice Upload
            </h2>
            <p className="mt-2 text-sm text-gray-500">
              Submit your invoice securely for your engagement.
            </p>
          </div>

          <div className="bg-white px-6 py-8 sm:p-10 shadow-sm border border-gray-200 rounded-2xl overflow-hidden">
            {/* Context Notice */}
            <div className="mb-8 p-4 bg-blue-50 border border-blue-100 rounded-xl flex gap-3 text-sm text-blue-800">
              <Building className="w-5 h-5 flex-shrink-0 text-blue-600 mt-0.5" />
              <div>
                <p className="font-semibold mb-1">Engagement Details</p>
                {context.engagementTitle && (
                  <p>
                    <span className="text-blue-600/70">Engagement:</span>{' '}
                    {context.engagementNumber
                      ? `${context.engagementNumber} - `
                      : ''}
                    {context.engagementTitle}
                  </p>
                )}
                {context.vendorName && (
                  <p className="mt-1">
                    <span className="text-blue-600/70">Vendor:</span>{' '}
                    {context.vendorName}
                  </p>
                )}
                <p className="mt-1">
                  <span className="text-blue-600/70">Required:</span> Invoices
                  Only
                </p>
              </div>
            </div>

            {/* Step 1: Submission Form */}
            {!submissionId ? (
              <form onSubmit={handleInfoSubmit} className="space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-1 border-b border-gray-100 pb-2">
                    Invoice Information
                  </h3>
                  <p className="text-xs text-gray-500 mb-4">
                    Please provide your invoice details before uploading the
                    document(s).
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-5">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">
                        Invoice Number (Auto-generated)
                      </label>
                      <input
                        type="text"
                        required
                        readOnly
                        value={formData.invoiceNumber}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-100 text-gray-500 font-medium cursor-not-allowed"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">
                        Invoice Date
                      </label>
                      <input
                        type="date"
                        value={formData.invoiceDate}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            invoiceDate: e.target.value,
                          })
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">
                        Due Date
                      </label>
                      <input
                        type="date"
                        value={formData.dueDate}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            dueDate: e.target.value,
                          })
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">
                        Currency
                      </label>
                      <select
                        value={formData.currency}
                        onChange={(e) =>
                          setFormData({ ...formData, currency: e.target.value })
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                      >
                        <option value="JMD">JMD - Jamaican Dollar</option>
                        <option value="USD">USD - US Dollar</option>
                        <option value="GBP">GBP - British Pound</option>
                        <option value="EUR">EUR - Euro</option>
                        <option value="CAD">CAD - Canadian Dollar</option>
                      </select>
                    </div>
                  </div>

                  <div className="mb-5">
                    <div className="flex justify-between items-center mb-2">
                      <label className="block text-sm font-semibold text-gray-700">
                        Line Items (Optional)
                      </label>
                      <button
                        type="button"
                        onClick={addLineItem}
                        className="text-xs flex items-center gap-1 text-blue-600 hover:text-blue-800 font-medium bg-blue-50 px-2 py-1 rounded-md transition-colors"
                      >
                        <Plus className="w-3 h-3" /> Add Line Item
                      </button>
                    </div>
                    {lineItems.length > 0 && (
                      <div className="space-y-3 mb-4">
                        {lineItems.map((item) => (
                          <div
                            key={item.id}
                            className="flex flex-wrap sm:flex-nowrap gap-2 items-end bg-gray-50 p-3 rounded-lg border border-gray-200"
                          >
                            <div className="flex-1 min-w-[150px]">
                              <label className="block text-xs font-medium text-gray-600 mb-1">
                                Description
                              </label>
                              <input
                                type="text"
                                value={item.description}
                                onChange={(e) =>
                                  updateLineItem(
                                    item.id,
                                    'description',
                                    e.target.value
                                  )
                                }
                                className="w-full px-2 py-1.5 border border-gray-300 rounded-md text-sm focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                                placeholder="Item description"
                              />
                            </div>
                            <div className="w-24 flex-shrink-0">
                              <label className="block text-xs font-medium text-gray-600 mb-1">
                                Amount
                              </label>
                              <input
                                type="number"
                                step="0.01"
                                min="0"
                                value={item.amount}
                                onChange={(e) =>
                                  updateLineItem(
                                    item.id,
                                    'amount',
                                    e.target.value
                                  )
                                }
                                className="w-full px-2 py-1.5 border border-gray-300 rounded-md text-sm focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                                placeholder="0.00"
                              />
                            </div>
                            <div className="w-20 flex-shrink-0">
                              <label className="block text-xs font-medium text-gray-600 mb-1">
                                Tax %
                              </label>
                              <input
                                type="number"
                                step="0.01"
                                min="0"
                                value={item.taxPercentage}
                                onChange={(e) =>
                                  updateLineItem(
                                    item.id,
                                    'taxPercentage',
                                    e.target.value
                                  )
                                }
                                className="w-full px-2 py-1.5 border border-gray-300 rounded-md text-sm focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                                placeholder="0"
                              />
                            </div>
                            <button
                              type="button"
                              onClick={() => removeLineItem(item.id)}
                              className="text-red-500 hover:text-red-700 p-1.5 mb-0.5 rounded-md hover:bg-red-50 transition-colors flex-shrink-0"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-5">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">
                        Subtotal{' '}
                        {lineItems.length > 0 ? '(Auto)' : '(Optional)'}
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <CreditCard className="h-4 w-4 text-gray-400" />
                        </div>
                        <input
                          type={lineItems.length > 0 ? 'text' : 'number'}
                          step={lineItems.length > 0 ? undefined : '0.01'}
                          min={lineItems.length > 0 ? undefined : '0'}
                          value={
                            lineItems.length > 0 &&
                            formData.subtotal !== undefined
                              ? formatCurrency(formData.subtotal)
                              : formData.subtotal || ''
                          }
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              subtotal: e.target.value
                                ? parseFloat(e.target.value)
                                : undefined,
                            })
                          }
                          readOnly={lineItems.length > 0}
                          className={`w-full pl-10 px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent ${lineItems.length > 0 ? 'bg-gray-100 text-gray-500 font-medium' : ''}`}
                          placeholder="0.00"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">
                        Total Tax{' '}
                        {lineItems.length > 0 ? '(Auto)' : '(Optional)'}
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <CreditCard className="h-4 w-4 text-gray-400" />
                        </div>
                        <input
                          type={lineItems.length > 0 ? 'text' : 'number'}
                          step={lineItems.length > 0 ? undefined : '0.01'}
                          min={lineItems.length > 0 ? undefined : '0'}
                          value={
                            lineItems.length > 0 &&
                            formData.taxTotal !== undefined
                              ? formatCurrency(formData.taxTotal)
                              : formData.taxTotal || ''
                          }
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              taxTotal: e.target.value
                                ? parseFloat(e.target.value)
                                : undefined,
                            })
                          }
                          readOnly={lineItems.length > 0}
                          className={`w-full pl-10 px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent ${lineItems.length > 0 ? 'bg-gray-100 text-gray-500 font-medium' : ''}`}
                          placeholder="0.00"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">
                        Net Total Amount{' '}
                        {lineItems.length > 0 ? '(Auto)' : '(Optional)'}
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <CreditCard className="h-4 w-4 text-gray-400" />
                        </div>
                        <input
                          type={lineItems.length > 0 ? 'text' : 'number'}
                          step={lineItems.length > 0 ? undefined : '0.01'}
                          min={lineItems.length > 0 ? undefined : '0'}
                          value={
                            lineItems.length > 0 && formData.total !== undefined
                              ? formatCurrency(formData.total)
                              : formData.total || ''
                          }
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              total: e.target.value
                                ? parseFloat(e.target.value)
                                : undefined,
                            })
                          }
                          readOnly={lineItems.length > 0}
                          className={`w-full pl-10 px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent ${lineItems.length > 0 ? 'bg-gray-100 text-gray-800 font-bold' : ''}`}
                          placeholder="0.00"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      Message / Notes (Optional)
                    </label>
                    <textarea
                      rows={3}
                      value={formData.message}
                      onChange={(e) =>
                        setFormData({ ...formData, message: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    />
                  </div>
                </div>

                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={submittingInfo || !formData.invoiceNumber?.trim()}
                    className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-colors"
                  >
                    {submittingInfo ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      'Continue to File Upload'
                    )}
                  </button>
                </div>
              </form>
            ) : isDone && allCompleted ? (
              /* Step 3: Success */
              <div className="text-center py-8">
                <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-6">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  Upload Complete!
                </h3>
                <p className="text-gray-600 mb-8 max-w-sm mx-auto">
                  Your vendor invoices have been successfully submitted for
                  review.
                </p>
                <button
                  type="button"
                  onClick={() => window.close()}
                  className="inline-flex items-center px-6 py-3 border border-gray-300 shadow-sm text-sm font-semibold rounded-xl text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                >
                  Close Window
                </button>
              </div>
            ) : (
              /* Step 2: File Upload */
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-1 border-b border-gray-100 pb-2">
                    Upload Documents
                  </h3>
                  <p className="text-xs text-gray-500 mb-4">
                    Please upload the associated invoice documents. Maximum{' '}
                    {context.maxFiles} files,{' '}
                    {Math.round(context.maxTotalBytes / 1024 / 1024)}MB total.
                  </p>
                </div>

                {/* Dropzone */}
                <div
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
                    dragActive
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
                  }`}
                >
                  <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <p className="text-sm text-gray-600 mb-2">
                    <span className="font-semibold text-blue-600 cursor-pointer hover:underline relative">
                      Click to upload
                      <input
                        type="file"
                        multiple
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        onChange={handleFileInput}
                      />
                    </span>{' '}
                    or drag and drop
                  </p>
                  <p className="text-xs text-gray-500">
                    PDF, DOCX, XLSX, JPEG, PNG
                  </p>
                </div>

                {/* File List */}
                {uploads.length > 0 && (
                  <div className="space-y-3 pt-4">
                    <h4 className="text-sm font-semibold text-gray-900">
                      Selected Files ({uploads.length})
                    </h4>
                    <ul className="divide-y divide-gray-100 border border-gray-200 rounded-lg overflow-hidden bg-white">
                      {uploads.map((file) => (
                        <li
                          key={file.id}
                          className="p-4 flex items-center gap-4"
                        >
                          <FileText
                            className={`w-8 h-8 flex-shrink-0 ${
                              file.status === 'completed'
                                ? 'text-green-500'
                                : 'text-blue-500'
                            }`}
                          />

                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-900 truncate">
                              {file.file.name}
                            </p>
                            <div className="flex items-center gap-3 mt-1">
                              <span className="text-xs text-gray-500">
                                {(file.file.size / 1024 / 1024).toFixed(2)} MB
                              </span>
                              <span className="text-xs font-medium text-gray-600 bg-gray-100 px-2 py-0.5 rounded">
                                Invoice
                              </span>
                            </div>

                            {/* Status logic */}
                            {file.status === 'uploading' && (
                              <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
                                <div
                                  className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
                                  style={{ width: `${file.progress}%` }}
                                ></div>
                              </div>
                            )}
                            {file.status === 'error' && (
                              <p className="text-xs text-red-600 mt-1">
                                {file.errorMessage}
                              </p>
                            )}
                          </div>

                          {(file.status === 'pending' ||
                            file.status === 'error') && (
                            <button
                              type="button"
                              onClick={() => removeFile(file.id)}
                              className="p-2 text-gray-400 hover:text-red-500 rounded-lg transition-colors"
                            >
                              <X className="w-5 h-5" />
                            </button>
                          )}

                          {file.status === 'completed' && (
                            <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="pt-6">
                  <button
                    onClick={startUploadProcess}
                    disabled={
                      uploads.length === 0 ||
                      uploadingFiles ||
                      uploads.every((u) => u.status === 'completed')
                    }
                    className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-colors"
                  >
                    {uploadingFiles ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Uploading Files...
                      </>
                    ) : (
                      <>
                        <Upload className="w-5 h-5" />
                        Submit Documents
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="text-center pb-8">
            <p className="text-xs text-gray-400">
              Powered by Oldane Vendor Platform
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
