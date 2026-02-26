/**
 * /vendor-upload/work-order/[requestId] — Public vendor upload portal.
 *
 * Vendors open this page via an emailed link to upload documents
 * against a work order. No authentication required; access is
 * controlled via a time-bound token passed as ?t=<token>.
 */
import { useRouter } from 'next/router';
import { useState } from 'react';
import {
  useVendorWorkOrderUploadPortal,
  type FileUploadState,
} from '@/lib/hooks/useVendorWorkOrderUploadPortal';
import { validateFile } from '@/lib/uploads/fileValidation';
import {
  Loader2,
  Upload,
  FileText,
  CheckCircle2,
  AlertTriangle,
  X,
  Clock,
  ShieldCheck,
} from 'lucide-react';

// ─── Status badge ───────────────────────────────────────────────────────────

function FileStatusBadge({ status }: { status: FileUploadState['status'] }) {
  const map: Record<string, { cls: string; label: string }> = {
    pending: { cls: 'bg-gray-100 text-gray-600', label: 'Pending' },
    uploading: { cls: 'bg-blue-100 text-blue-700', label: 'Uploading…' },
    finalizing: { cls: 'bg-amber-100 text-amber-700', label: 'Processing…' },
    done: { cls: 'bg-green-100 text-green-700', label: 'Uploaded' },
    error: { cls: 'bg-red-100 text-red-700', label: 'Failed' },
  };
  const s = map[status] ?? map.pending;
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${s.cls}`}
    >
      {s.label}
    </span>
  );
}

// ─── Page ───────────────────────────────────────────────────────────────────

export default function VendorUploadPortal() {
  const router = useRouter();
  const requestId = router.query.requestId as string | undefined;
  const token = router.query.t as string | undefined;

  const {
    portalStatus,
    isLoading,
    error,
    files,
    isCompleted,
    addFiles,
    removeFile,
    updateDocType,
    uploadAll,
    markComplete,
  } = useVendorWorkOrderUploadPortal(requestId, token);

  const [dragOver, setDragOver] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  // ── File selection ────────────────────────────────────────────────────
  function handleFiles(fileList: FileList | null) {
    if (!fileList || !portalStatus) return;
    setValidationError(null);

    const newFiles: File[] = [];
    for (let i = 0; i < fileList.length; i++) {
      const result = validateFile(fileList[i]);
      if (!result.valid) {
        setValidationError(result.error ?? 'Invalid file.');
        return;
      }
      newFiles.push(fileList[i]);
    }

    const defaultDocType = portalStatus.allowedDocTypes[0] ?? 'supporting';
    addFiles(newFiles, defaultDocType);
  }

  // ── Upload all ────────────────────────────────────────────────────────
  async function handleUploadAll() {
    setUploading(true);
    await uploadAll();
    setUploading(false);
  }

  // ── Complete ──────────────────────────────────────────────────────────
  async function handleComplete() {
    await markComplete();
  }

  // ── Loading ───────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600 font-medium">
            Validating your upload link…
          </p>
        </div>
      </div>
    );
  }

  // ── Error / Expired / Revoked ─────────────────────────────────────────
  if (error || !portalStatus) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl border border-red-200 shadow-sm p-8 text-center">
          <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-7 h-7 text-red-600" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">
            Upload Link Unavailable
          </h1>
          <p className="text-gray-600">
            {error ?? 'This upload link is invalid or has expired.'}
          </p>
        </div>
      </div>
    );
  }

  // ── Completed Screen ──────────────────────────────────────────────────
  if (isCompleted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl border border-green-200 shadow-sm p-8 text-center">
          <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-7 h-7 text-green-600" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">
            Upload Complete
          </h1>
          <p className="text-gray-600">
            Your documents have been submitted successfully. You can safely
            close this page.
          </p>
        </div>
      </div>
    );
  }

  // ── Main Portal UI ────────────────────────────────────────────────────
  const pendingFiles = files.filter((f) => f.status === 'pending');
  const doneFiles = files.filter((f) => f.status === 'done');
  const hasUploaded =
    doneFiles.length > 0 || (portalStatus.uploadedFiles?.length ?? 0) > 0;
  const allDone =
    files.length > 0 &&
    files.every((f) => f.status === 'done' || f.status === 'error');

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header gradient */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
        <div className="max-w-2xl mx-auto px-6 py-8">
          <div className="flex items-center gap-3 mb-1">
            <ShieldCheck className="w-6 h-6 opacity-80" />
            <span className="text-sm font-medium opacity-80">
              Secure Document Upload
            </span>
          </div>
          <h1 className="text-2xl font-bold">
            {portalStatus.workOrderNumber
              ? `${portalStatus.workOrderNumber} — `
              : ''}
            {portalStatus.workOrderTitle ?? 'Document Upload'}
          </h1>
          {portalStatus.vendorName && (
            <p className="mt-1 opacity-80">For: {portalStatus.vendorName}</p>
          )}
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-8 space-y-6">
        {/* Info cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
              Allowed Types
            </p>
            <div className="flex flex-wrap gap-1">
              {portalStatus.allowedDocTypes.map((t) => (
                <span
                  key={t}
                  className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700"
                >
                  {t}
                </span>
              ))}
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
              Max Files
            </p>
            <p className="text-lg font-bold text-gray-900">
              {portalStatus.maxFiles}
            </p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
              Expires
            </p>
            <div className="flex items-center gap-1.5 text-gray-900">
              <Clock className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium">
                {new Date(portalStatus.expiresAt).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  hour: 'numeric',
                  minute: '2-digit',
                })}
              </span>
            </div>
          </div>
        </div>

        {/* Message */}
        {portalStatus.message && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <p className="text-sm text-blue-800 italic">
              &ldquo;{portalStatus.message}&rdquo;
            </p>
          </div>
        )}

        {/* Drop zone */}
        <div
          className={`relative rounded-xl border-2 border-dashed transition-colors p-8 text-center ${
            dragOver
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-300 bg-white hover:border-gray-400'
          }`}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            handleFiles(e.dataTransfer.files);
          }}
        >
          <Upload className="w-10 h-10 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-700 font-medium mb-1">
            Drag & drop files here
          </p>
          <p className="text-sm text-gray-500 mb-4">or click below to browse</p>
          <label className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg font-medium cursor-pointer hover:bg-blue-700 transition-colors">
            <Upload className="w-4 h-4" />
            Browse Files
            <input
              type="file"
              multiple
              className="hidden"
              accept=".pdf,.jpg,.jpeg,.png,.docx,.xlsx"
              onChange={(e) => handleFiles(e.target.files)}
            />
          </label>
        </div>

        {/* Validation error */}
        {validationError && (
          <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
            {validationError}
          </div>
        )}

        {/* File list */}
        {files.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-sm font-bold text-gray-900">
                Files ({files.length})
              </h2>
              {pendingFiles.length > 0 && (
                <button
                  onClick={handleUploadAll}
                  disabled={uploading}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {uploading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Upload className="w-4 h-4" />
                  )}
                  Upload All
                </button>
              )}
            </div>

            <ul className="divide-y divide-gray-100">
              {files.map((f, idx) => (
                <li key={idx} className="flex items-center gap-4 px-5 py-3">
                  <FileText className="w-5 h-5 text-gray-400 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {f.file.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {(f.file.size / 1024).toFixed(0)} KB
                    </p>
                    {f.error && (
                      <p className="text-xs text-red-600 mt-0.5">{f.error}</p>
                    )}
                    {/* Progress bar */}
                    {(f.status === 'uploading' ||
                      f.status === 'finalizing') && (
                      <div className="mt-1.5 w-full bg-gray-200 rounded-full h-1.5">
                        <div
                          className="bg-blue-600 h-1.5 rounded-full transition-all"
                          style={{ width: `${f.progress}%` }}
                        />
                      </div>
                    )}
                  </div>
                  {/* Doc type selector */}
                  {f.status === 'pending' && (
                    <select
                      value={f.docType}
                      onChange={(e) => updateDocType(idx, e.target.value)}
                      className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-gray-50"
                    >
                      {portalStatus.allowedDocTypes.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  )}
                  <FileStatusBadge status={f.status} />
                  {f.status === 'pending' && (
                    <button
                      onClick={() => removeFile(idx)}
                      className="text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Previously uploaded */}
        {(portalStatus.uploadedFiles?.length ?? 0) > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-5 py-3.5 border-b border-gray-100">
              <h2 className="text-sm font-bold text-gray-900">
                Previously Uploaded ({portalStatus.uploadedFiles.length})
              </h2>
            </div>
            <ul className="divide-y divide-gray-100">
              {portalStatus.uploadedFiles.map((f) => (
                <li key={f.id} className="flex items-center gap-4 px-5 py-3">
                  <FileText className="w-5 h-5 text-green-500 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {f.file_name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {f.doc_type} ·{' '}
                      {f.size_bytes
                        ? `${(f.size_bytes / 1024).toFixed(0)} KB`
                        : ''}{' '}
                      · {new Date(f.uploaded_at).toLocaleString()}
                    </p>
                  </div>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                    {f.status}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Done button */}
        {(hasUploaded || allDone) && (
          <div className="flex justify-center pt-4">
            <button
              onClick={handleComplete}
              className="inline-flex items-center gap-2 px-8 py-3 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition-colors text-base"
            >
              <CheckCircle2 className="w-5 h-5" />
              Done — Submit All Documents
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
