import { useState } from 'react';
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
} from 'lucide-react';

export function OCRExtraction() {
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [extractedData, setExtractedData] = useState<any[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

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

  const handleAIExtract = () => {
    setIsProcessing(true);

    // Simulate AI OCR processing
    setTimeout(() => {
      const mockExtractedData = uploadedFiles.map((file, index) => ({
        fileName: file.name,
        extractedAt: new Date().toISOString(),
        tables: [
          {
            title: 'Vendor Information',
            type: 'key-value',
            data: [
              { field: 'Vendor Name', value: 'TechEquip Manufacturing Co.' },
              { field: 'Vendor ID', value: 'VND-2026-00234' },
              { field: 'Contact Person', value: 'John Smith' },
              { field: 'Email', value: 'john.smith@techequip.com' },
              { field: 'Phone', value: '+1 (555) 123-4567' },
              { field: 'Address', value: '123 Industrial Park, Boston, MA 02101' },
            ],
          },
          {
            title: 'Line Items',
            type: 'table',
            columns: ['Item Description', 'Quantity', 'Unit Price', 'Total'],
            data: [
              { item: 'CNC Machine Model X200', quantity: '2', unitPrice: '$45,000.00', total: '$90,000.00' },
              { item: 'Installation & Setup', quantity: '1', unitPrice: '$5,000.00', total: '$5,000.00' },
              { item: 'Training Package (2 days)', quantity: '1', unitPrice: '$3,000.00', total: '$3,000.00' },
              { item: 'Extended Warranty (3 years)', quantity: '2', unitPrice: '$2,500.00', total: '$5,000.00' },
            ],
          },
          {
            title: 'Payment Terms',
            type: 'key-value',
            data: [
              { field: 'Payment Terms', value: 'Net 30' },
              { field: 'Delivery Date', value: '2026-03-15' },
              { field: 'Warranty', value: '24 months standard + 36 months extended' },
              { field: 'Subtotal', value: '$103,000.00' },
              { field: 'Tax (6.25%)', value: '$6,437.50' },
              { field: 'Total Amount', value: '$109,437.50' },
            ],
          },
          {
            title: 'Contract Details',
            type: 'key-value',
            data: [
              { field: 'Contract Number', value: 'CNT-2026-002134' },
              { field: 'Contract Date', value: '2026-02-10' },
              { field: 'Valid Until', value: '2026-05-10' },
              { field: 'Approval Required', value: 'Yes - Executive Level' },
              { field: 'Department', value: 'Manufacturing & Operations' },
            ],
          },
        ],
      }));

      setExtractedData(mockExtractedData);
      setIsProcessing(false);
    }, 2000);
  };

  const removeFile = (index: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const clearAllData = () => {
    setUploadedFiles([]);
    setExtractedData([]);
  };

  const exportToCSV = (tableData: any, fileName: string) => {
    alert(`Exporting "${fileName}" to CSV...`);
  };

  const saveToDatabase = (fileData: any) => {
    alert(`Saving extracted data from "${fileData.fileName}" to database...`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900">AI Document Upload</h1>
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

      {/* AI Info Banner */}
      <div className="bg-gradient-to-r from-indigo-600 to-blue-600 rounded-lg p-6 text-white shadow-lg">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0 backdrop-blur-sm">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-semibold mb-2">AI-Powered Document Processing</h2>
            <p className="text-blue-100 text-sm">
              Our advanced AI OCR engine automatically extracts and structures data from invoices, contracts, 
              work orders, and other vendor documents. The system identifies vendor information, line items, payment 
              terms, and contract details with high accuracy.
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

      {/* Upload Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Upload Documents</h2>

        {/* Upload Area */}
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

        {/* Uploaded Files Queue */}
        {uploadedFiles.length > 0 && (
          <div className="mt-6">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-medium text-gray-700">
                Files Ready for Processing ({uploadedFiles.length})
              </p>
              <button
                onClick={handleAIExtract}
                disabled={isProcessing}
                className={`
                  px-5 py-2.5 rounded-lg font-semibold text-sm shadow-sm transition-all
                  ${isProcessing
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white hover:from-indigo-700 hover:to-blue-700 hover:shadow-md'
                  }
                `}
              >
                {isProcessing ? (
                  <>
                    <Clock className="w-4 h-4 inline mr-2 animate-spin" />
                    Processing...
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
                <div key={index} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-100">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <FileText className="w-5 h-5 text-blue-600 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900 truncate font-medium">{file.name}</p>
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

      {/* Extracted Data Section */}
      {extractedData.length > 0 && (
        <div className="space-y-6">
          <div className="flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-indigo-600" />
            <h2 className="text-2xl font-semibold text-gray-900">Extracted Data</h2>
            <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
              {extractedData.length} {extractedData.length === 1 ? 'Document' : 'Documents'}
            </span>
          </div>

          {extractedData.map((fileData, fileIndex) => (
            <div key={fileIndex} className="bg-white border border-indigo-200 rounded-lg shadow-md overflow-hidden">
              {/* File Header */}
              <div className="bg-gradient-to-r from-indigo-50 to-blue-50 px-6 py-4 border-b border-indigo-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FileText className="w-6 h-6 text-indigo-600" />
                    <div>
                      <h3 className="font-semibold text-gray-900 text-lg">{fileData.fileName}</h3>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Extracted on {new Date(fileData.extractedAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => saveToDatabase(fileData)}
                      className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                    >
                      <Save className="w-4 h-4 inline mr-2" />
                      Save to Database
                    </button>
                    <button
                      onClick={() => exportToCSV(fileData, fileData.fileName)}
                      className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
                    >
                      <Download className="w-4 h-4 inline mr-2" />
                      Export CSV
                    </button>
                  </div>
                </div>
              </div>

              {/* Extracted Tables */}
              <div className="p-6 space-y-6">
                {fileData.tables.map((table: any, tableIndex: number) => (
                  <div key={tableIndex}>
                    <h4 className="text-base font-semibold text-gray-800 mb-3 flex items-center gap-2">
                      <div className="w-1 h-5 bg-indigo-600 rounded-full"></div>
                      {table.title}
                    </h4>

                    {table.type === 'table' ? (
                      <div className="overflow-x-auto rounded-lg border border-gray-200">
                        <table className="w-full">
                          <thead className="bg-indigo-50">
                            <tr>
                              {table.columns.map((col: string, colIndex: number) => (
                                <th
                                  key={colIndex}
                                  className="px-4 py-3 text-left text-xs font-semibold text-gray-700 border-b border-gray-200"
                                >
                                  {col}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="bg-white">
                            {table.data.map((row: any, rowIndex: number) => (
                              <tr key={rowIndex} className="border-b border-gray-200 last:border-b-0 hover:bg-gray-50">
                                <td className="px-4 py-3 text-sm text-gray-900">{row.item}</td>
                                <td className="px-4 py-3 text-sm text-gray-900">{row.quantity}</td>
                                <td className="px-4 py-3 text-sm text-gray-900">{row.unitPrice}</td>
                                <td className="px-4 py-3 text-sm font-semibold text-gray-900">{row.total}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="overflow-x-auto rounded-lg border border-gray-200">
                        <table className="w-full">
                          <tbody className="bg-white">
                            {table.data.map((row: any, rowIndex: number) => (
                              <tr key={rowIndex} className="border-b border-gray-200 last:border-b-0 hover:bg-gray-50">
                                <td className="px-4 py-3 text-sm font-medium text-gray-700 bg-gray-50 w-1/3">
                                  {row.field}
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-900">{row.value}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
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
              Upload your vendor documents above to get started with AI-powered data extraction.
              The system will automatically identify and structure all relevant information.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}