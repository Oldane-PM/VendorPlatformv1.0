import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import {
  useVendorWorkOrderPortal,
  UploadFileState,
} from '@/lib/hooks/useVendorWorkOrderUploadPortal';
import {
  Loader2,
  AlertCircle,
  FileText,
  Upload,
  CheckCircle,
  X,
  CreditCard,
  Building,
} from 'lucide-react';
import { CreateSubmissionPayload } from '@/lib/supabase/repos/workOrderVendorPortalRepo';

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
  } = useVendorWorkOrderPortal(requestId as string, token as string);

  useEffect(() => {
    if (isReady && requestId && token) {
      loadContext();
    }
  }, [isReady, requestId, token, loadContext]);

  // Form State
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

  const [submittingInfo, setSubmittingInfo] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const [isDone, setIsDone] = useState(false);

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
      await submitVendorInfo(formData);
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
    // Check against allowed types
    const allowedDocTypes = context.allowedDocTypes;

    // In a real app we would map mime type to doc type, but we can default to 'supporting' initially
    // Since we need to know what doc type they mapped it to, we'll let them select it later or default it
    const newUploads = files.map((file) => {
      // Very basic type mapping, a proper implementation would have a UI dropdown for each file
      let inferredDocType = 'supporting';
      if (
        file.name.toLowerCase().includes('invoice') &&
        allowedDocTypes.includes('invoice')
      ) {
        inferredDocType = 'invoice';
      } else if (
        file.name.toLowerCase().includes('quote') &&
        allowedDocTypes.includes('quote')
      ) {
        inferredDocType = 'quote';
      }

      return {
        id: Math.random().toString(36).substring(2, 9),
        file,
        doc_type: inferredDocType,
        progress: 0,
        status: 'pending' as const,
      };
    });

    setUploads((prev) => [...prev, ...newUploads]);
  };

  const removeFile = (id: string) => {
    setUploads((prev) => prev.filter((u) => u.id !== id));
  };

  const updateDocType = (id: string, newType: string) => {
    setUploads((prev) =>
      prev.map((u) => (u.id === id ? { ...u, doc_type: newType } : u))
    );
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
        <title>Secure Document Upload | Oldane</title>
      </Head>

      <div className="min-h-screen bg-gray-50 flex flex-col py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl w-full mx-auto space-y-8">
          {/* Header */}
          <div className="text-center">
            <div className="mx-auto h-12 w-12 bg-blue-600 text-white rounded-xl flex items-center justify-center font-bold text-xl shadow-sm mb-4">
              OP
            </div>
            <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">
              Secure Document Upload
            </h2>
            <p className="mt-2 text-sm text-gray-500">
              Submit your quote and related documents securely.
            </p>
          </div>

          <div className="bg-white px-6 py-8 sm:p-10 shadow-sm border border-gray-200 rounded-2xl overflow-hidden">
            {/* Context Notice */}
            <div className="mb-8 p-4 bg-blue-50 border border-blue-100 rounded-xl flex gap-3 text-sm text-blue-800">
              <Building className="w-5 h-5 flex-shrink-0 text-blue-600 mt-0.5" />
              <div>
                <p className="font-semibold mb-1">Upload Request Details</p>
                {context.workOrderTitle && (
                  <p>
                    <span className="text-blue-600/70">Work Order:</span>{' '}
                    {context.workOrderNumber
                      ? `${context.workOrderNumber} - `
                      : ''}
                    {context.workOrderTitle}
                  </p>
                )}
                <p className="mt-1">
                  <span className="text-blue-600/70">Required Documents:</span>{' '}
                  {context.allowedDocTypes.join(', ')}
                </p>
              </div>
            </div>

            {/* Step 1: Submission Form */}
            {!submissionId ? (
              <form onSubmit={handleInfoSubmit} className="space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-1 border-b border-gray-100 pb-2">
                    Vendor Information
                  </h3>
                  <p className="text-xs text-gray-500 mb-4">
                    Please provide your details before uploading documents.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div className="sm:col-span-2">
                      <label className="block text-sm font-semibold text-gray-700 mb-1">
                        Company / Vendor Name{' '}
                        <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.vendorName}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            vendorName: e.target.value,
                          })
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">
                        Contact Email
                      </label>
                      <input
                        type="email"
                        value={formData.vendorEmail}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            vendorEmail: e.target.value,
                          })
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">
                        Contact Phone
                      </label>
                      <input
                        type="tel"
                        value={formData.vendorPhone}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            vendorPhone: e.target.value,
                          })
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">
                        Tax ID (TRN / EIN)
                      </label>
                      <input
                        type="text"
                        value={formData.taxId}
                        onChange={(e) =>
                          setFormData({ ...formData, taxId: e.target.value })
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">
                        Vendor Code (if known)
                      </label>
                      <input
                        type="text"
                        value={formData.vendorCode}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            vendorCode: e.target.value,
                          })
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4 border-b border-gray-100 pb-2">
                    Quote Details
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-5">
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

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">
                        Quoted Amount (Optional)
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <CreditCard className="h-4 w-4 text-gray-400" />
                        </div>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={formData.quotedAmount || ''}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              quotedAmount: e.target.value
                                ? parseFloat(e.target.value)
                                : undefined,
                            })
                          }
                          className="w-full pl-10 px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                    disabled={submittingInfo || !formData.vendorName.trim()}
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
                  Your vendor information and documents have been successfully
                  submitted for review.
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
                    Please upload the required documents. Maximum{' '}
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

                              {file.status === 'pending' ||
                              file.status === 'error' ? (
                                <select
                                  value={file.doc_type}
                                  onChange={(e) =>
                                    updateDocType(file.id, e.target.value)
                                  }
                                  className="text-xs border border-gray-300 rounded p-1 max-w-[120px]"
                                >
                                  {context.allowedDocTypes.map((type) => (
                                    <option key={type} value={type}>
                                      {type}
                                    </option>
                                  ))}
                                </select>
                              ) : (
                                <span className="text-xs font-medium text-gray-600 bg-gray-100 px-2 py-0.5 rounded">
                                  {file.doc_type}
                                </span>
                              )}
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
