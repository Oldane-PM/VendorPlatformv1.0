import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Upload,
  Sparkles,
  FileText,
  X,
  Clock,
  Download,
  Save,
  Trash2,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { useDocumentUpload } from '@/lib/hooks/useDocumentUpload';
import { documentExtractionApiRepo } from '@/lib/domain/documents/documentExtractionApiRepo';

function parseFieldsToTables(fields: any[] = [], lineItems: any[] = []) {
  const tables: any[] = [];

  if (fields.length > 0) {
    tables.push({
      title: 'Extracted Fields',
      type: 'key-value',
      data: fields.map((f) => ({
        field: f.field_key,
        value:
          f.text_value || f.number_value?.toString() || f.date_value || '-',
      })),
    });
  }

  if (lineItems.length > 0) {
    tables.push({
      title: 'Line Items',
      type: 'table',
      columns: ['Index', 'Item Description', 'Quantity', 'Unit Price', 'Total'],
      data: lineItems.map((li) => ({
        index: li.line_index,
        item: li.description || '-',
        quantity: li.quantity?.toString() || '-',
        unitPrice: li.unit_price ? `$${li.unit_price}` : '-',
        total: li.line_total ? `$${li.line_total}` : '-',
      })),
    });
  }

  return tables;
}

export function OCRExtraction() {
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [extractedData, setExtractedData] = useState<any[]>([]);
  const {
    uploadDocuments,
    uploading,
    error: uploadError,
  } = useDocumentUpload();

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setUploadedFiles((prev) => [...prev, ...files]);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const files = Array.from(e.dataTransfer.files);
    setUploadedFiles((prev) => [...prev, ...files]);
  };

  const handleAIExtract = async () => {
    if (uploadedFiles.length === 0) return;

    try {
      const docs = await uploadDocuments(uploadedFiles);

      const initialExtractions = docs.map((d) => ({
        documentId: d.id,
        fileName: d.fileName,
        status: 'queued',
        tables: [],
        rawExtraction: null,
      }));

      setExtractedData((prev) => [...prev, ...initialExtractions]);
      setUploadedFiles([]); // clear queue
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    const processingDocs = extractedData.filter((d) =>
      ['queued', 'processing'].includes(d.status)
    );
    if (processingDocs.length === 0) return;

    let mounted = true;

    const poll = async () => {
      try {
        const updates = await Promise.all(
          processingDocs.map(async (doc) => {
            const result = await documentExtractionApiRepo.getExtraction(
              doc.documentId
            );
            return { documentId: doc.documentId, result };
          })
        );

        if (!mounted) return;

        setExtractedData((prev) =>
          prev.map((pDoc) => {
            const update = updates.find(
              (u) => u.documentId === pDoc.documentId
            );
            if (!update || !update.result) return pDoc;

            const dbDoc = update.result.document;
            const status = dbDoc?.processing_status || pDoc.status;

            if (['completed', 'review_required', 'failed'].includes(status)) {
              const newTables = parseFieldsToTables(
                update.result.fields,
                update.result.lineItems
              );
              return {
                ...pDoc,
                status,
                tables: newTables,
                rawExtraction: update.result,
                extractedAt: dbDoc?.updated_at || new Date().toISOString(),
              };
            }
            return { ...pDoc, status };
          })
        );
      } catch (err) {
        console.error('Polling error', err);
      }
    };

    const intervalId = setInterval(poll, 3000);
    poll(); // fire immediately once

    return () => {
      mounted = false;
      clearInterval(intervalId);
    };
  }, [extractedData]);

  const removeFile = (index: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const clearAllData = () => {
    setUploadedFiles([]);
    setExtractedData([]);
  };

  const exportToCSV = (fileData: any, fileName: string) => {
    alert(`Exporting "${fileName}" to CSV...`);
  };

  const saveToDatabase = (fileData: any) => {
    alert(`Saving extracted data from "${fileData.fileName}" to database...`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900">
            AI Document Upload
          </h1>
          <p className="text-gray-500 mt-1">
            Upload vendor documents and extract structured data instantly
          </p>
        </div>
        {(uploadedFiles.length > 0 || extractedData.length > 0) && (
          <button
            onClick={clearAllData}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
          >
            <Trash2 className="w-4 h-4 inline mr-2" />
            Clear All
          </button>
        )}
      </div>

      <div className="bg-gradient-to-r from-indigo-600 to-blue-600 rounded-lg p-6 text-white shadow-lg">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0 backdrop-blur-sm">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-semibold mb-2">
              AI-Powered Document Processing
            </h2>
            <p className="text-blue-100 text-sm">
              Our advanced AI OCR engine automatically extracts and structures
              data from invoices, contracts, work orders, and other vendor
              documents. The system identifies vendor information, line items,
              payment terms, and contract details with high accuracy.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
              <div className="bg-white/10 rounded-lg p-3 backdrop-blur-sm">
                <p className="text-2xl font-bold">98%</p>
                <p className="text-xs text-blue-100 mt-1">Accuracy Rate</p>
              </div>
              <div className="bg-white/10 rounded-lg p-3 backdrop-blur-sm">
                <p className="text-2xl font-bold">&lt;5s</p>
                <p className="text-xs text-blue-100 mt-1">Processing Time</p>
              </div>
              <div className="bg-white/10 rounded-lg p-3 backdrop-blur-sm">
                <p className="text-2xl font-bold">15+</p>
                <p className="text-xs text-blue-100 mt-1">Data Fields</p>
              </div>
              <div className="bg-white/10 rounded-lg p-3 backdrop-blur-sm">
                <p className="text-2xl font-bold">50+</p>
                <p className="text-xs text-blue-100 mt-1">File Formats</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {uploadError && (
        <div className="p-4 bg-red-50 text-red-700 rounded-lg flex items-center gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <p className="text-sm font-medium">{uploadError}</p>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Upload Documents
        </h2>

        <div
          className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center hover:border-blue-500 transition-colors cursor-pointer bg-gray-50"
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onClick={() => document.getElementById('file-upload-ocr')?.click()}
        >
          <Upload className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-lg text-gray-700 font-medium mb-2">
            Drag and drop files here
          </p>
          <p className="text-sm text-gray-500 mb-1">
            or click to browse your computer
          </p>
          <p className="text-xs text-gray-400 mt-3">
            Supported formats: PDF, DOC, DOCX, XLS, XLSX, PNG, JPG up to 10MB
          </p>
          <input
            id="file-upload-ocr"
            type="file"
            multiple
            accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
            onChange={handleFileUpload}
            className="hidden"
          />
        </div>

        {uploadedFiles.length > 0 && (
          <div className="mt-6">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-medium text-gray-700">
                Files Ready for Processing ({uploadedFiles.length})
              </p>
              <button
                onClick={handleAIExtract}
                disabled={uploading}
                className={`
                  px-5 py-2.5 rounded-lg font-semibold text-sm shadow-sm transition-all
                  ${
                    uploading
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white hover:from-indigo-700 hover:to-blue-700 hover:shadow-md'
                  }
                `}
              >
                {uploading ? (
                  <>
                    <Clock className="w-4 h-4 inline mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 inline mr-2" />
                    AI Extract Data
                  </>
                )}
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {uploadedFiles.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-100"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <FileText className="w-5 h-5 text-blue-600 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900 truncate font-medium">
                        {file.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFile(index);
                    }}
                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors flex-shrink-0"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {extractedData.length > 0 && (
        <div className="space-y-6">
          <div className="flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-indigo-600" />
            <h2 className="text-2xl font-semibold text-gray-900">
              Extraction Results
            </h2>
          </div>

          {extractedData.map((fileData, fileIndex) => {
            const isProcessing = ['queued', 'processing'].includes(
              fileData.status
            );
            const isFailed = fileData.status === 'failed';
            const isReview = fileData.status === 'review_required';
            const isCompleted = fileData.status === 'completed';

            return (
              <div
                key={fileIndex}
                className={`bg-white border rounded-lg shadow-md overflow-hidden ${isFailed ? 'border-red-200' : isReview ? 'border-yellow-200' : 'border-indigo-200'}`}
              >
                <div
                  className={`px-6 py-4 border-b ${isFailed ? 'bg-red-50 border-red-200' : isReview ? 'bg-yellow-50 border-yellow-200' : 'bg-gradient-to-r from-indigo-50 to-blue-50 border-indigo-200'}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {isProcessing ? (
                        <Clock className="w-6 h-6 text-indigo-600 animate-spin" />
                      ) : isFailed ? (
                        <AlertCircle className="w-6 h-6 text-red-600" />
                      ) : isReview ? (
                        <AlertCircle className="w-6 h-6 text-yellow-600" />
                      ) : (
                        <CheckCircle2 className="w-6 h-6 text-green-600" />
                      )}
                      <div>
                        <h3 className="font-semibold text-gray-900 text-lg flex items-center gap-2">
                          {fileData.fileName}
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                              isProcessing
                                ? 'bg-indigo-100 text-indigo-700'
                                : isFailed
                                  ? 'bg-red-100 text-red-700'
                                  : isReview
                                    ? 'bg-yellow-100 text-yellow-800'
                                    : 'bg-green-100 text-green-700'
                            }`}
                          >
                            {fileData.status.toUpperCase()}
                          </span>
                        </h3>
                        {fileData.extractedAt && (
                          <p className="text-xs text-gray-500 mt-0.5">
                            Updated{' '}
                            {new Date(fileData.extractedAt).toLocaleString()}
                          </p>
                        )}
                      </div>
                    </div>
                    {!isProcessing && !isFailed && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => saveToDatabase(fileData)}
                          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
                        >
                          <Save className="w-4 h-4 inline mr-2" />
                          Mark Reviewed
                        </button>
                        <button
                          onClick={() =>
                            exportToCSV(fileData, fileData.fileName)
                          }
                          className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
                        >
                          <Download className="w-4 h-4 inline mr-2" />
                          View Raw
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {isProcessing && (
                  <div className="p-8 text-center text-gray-500 italic">
                    <Sparkles className="w-8 h-8 mx-auto mb-3 text-indigo-300 animate-pulse" />
                    AI is analyzing this document...
                  </div>
                )}

                {!isProcessing && isFailed && (
                  <div className="p-8 text-center text-red-600">
                    Failed to extract data from this document. Ensure the file
                    is not corrupted and is a supported format.
                  </div>
                )}

                {/* Extracted Tables */}
                {!isProcessing && !isFailed && fileData.tables?.length > 0 && (
                  <div className="p-6 space-y-6">
                    {fileData.tables.map((table: any, tableIndex: number) => (
                      <div key={tableIndex}>
                        <h4 className="text-base font-semibold text-gray-800 mb-3 flex items-center gap-2">
                          <div
                            className={`w-1 h-5 rounded-full ${isReview ? 'bg-yellow-500' : 'bg-indigo-600'}`}
                          ></div>
                          {table.title}
                        </h4>

                        {table.type === 'table' ? (
                          <div className="overflow-x-auto rounded-lg border border-gray-200">
                            <table className="w-full">
                              <thead className="bg-gray-50">
                                <tr>
                                  {table.columns.map(
                                    (col: string, colIndex: number) => (
                                      <th
                                        key={colIndex}
                                        className="px-4 py-3 text-left text-xs font-semibold text-gray-700 border-b border-gray-200"
                                      >
                                        {col}
                                      </th>
                                    )
                                  )}
                                </tr>
                              </thead>
                              <tbody className="bg-white">
                                {table.data.map(
                                  (row: any, rowIndex: number) => (
                                    <tr
                                      key={rowIndex}
                                      className="border-b border-gray-200 last:border-b-0 hover:bg-gray-50"
                                    >
                                      <td className="px-4 py-3 text-sm text-gray-500 w-12">
                                        {row.index}
                                      </td>
                                      <td className="px-4 py-3 text-sm text-gray-900">
                                        {row.item}
                                      </td>
                                      <td className="px-4 py-3 text-sm text-gray-900">
                                        {row.quantity}
                                      </td>
                                      <td className="px-4 py-3 text-sm text-gray-900">
                                        {row.unitPrice}
                                      </td>
                                      <td className="px-4 py-3 text-sm font-semibold text-gray-900">
                                        {row.total}
                                      </td>
                                    </tr>
                                  )
                                )}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          <div className="overflow-x-auto rounded-lg border border-gray-200">
                            <table className="w-full">
                              <tbody className="bg-white">
                                {table.data.map(
                                  (row: any, rowIndex: number) => (
                                    <tr
                                      key={rowIndex}
                                      className="border-b border-gray-200 last:border-b-0 hover:bg-gray-50"
                                    >
                                      <td className="px-4 py-3 text-sm font-medium text-gray-700 bg-gray-50 w-1/3 border-r border-gray-200">
                                        {row.field}
                                      </td>
                                      <td className="px-4 py-3 text-sm text-gray-900">
                                        {row.value}
                                      </td>
                                    </tr>
                                  )
                                )}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {!isProcessing &&
                  !isFailed &&
                  (!fileData.tables || fileData.tables.length === 0) && (
                    <div className="p-8 text-center text-gray-500 italic">
                      No structured data could be extracted.
                    </div>
                  )}
              </div>
            );
          })}
        </div>
      )}

      {uploadedFiles.length === 0 && extractedData.length === 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <div className="max-w-md mx-auto">
            <div className="w-20 h-20 bg-gradient-to-r from-indigo-100 to-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-10 h-10 text-indigo-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Ready to Extract Data
            </h3>
            <p className="text-gray-600 text-sm">
              Upload your vendor documents above to get started with AI-powered
              data extraction. The system will automatically identify and
              structure all relevant information.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
