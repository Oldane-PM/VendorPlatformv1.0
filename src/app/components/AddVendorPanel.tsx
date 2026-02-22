import { X, Upload, FileText, CheckCircle, Trash2 } from 'lucide-react';

interface AddVendorPanelProps {
  show: boolean;
  onClose: () => void;
  onSave: () => void;
  vendorForm: any;
  setVendorForm: (form: any) => void;
  formErrors: Record<string, string>;
  uploadedFiles: File[];
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onFileRemove: (index: number) => void;
  generateVendorId: () => string;
}

export function AddVendorPanel({
  show,
  onClose,
  onSave,
  vendorForm,
  setVendorForm,
  formErrors,
  uploadedFiles,
  onFileUpload,
  onFileRemove,
  generateVendorId,
}: AddVendorPanelProps) {
  if (!show) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-gray-900/35 backdrop-blur-sm z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Slide-over Panel */}
      <div className="fixed inset-y-0 right-0 w-full max-w-[520px] bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-out flex flex-col">
        {/* Sticky Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 z-10">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Add Vendor</h2>
              <p className="text-sm text-gray-500 mt-1">
                Vendor ID: <span className="font-mono font-semibold text-blue-600">{generateVendorId()}</span>
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

        {/* Scrollable Form Content */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-8">
          {/* Section 1: Basic Information */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-4 uppercase tracking-wide">
              Basic Information
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Vendor Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={vendorForm.vendorName}
                  onChange={(e) => setVendorForm({ ...vendorForm, vendorName: e.target.value })}
                  className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    formErrors.vendorName ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter vendor name"
                />
                {formErrors.vendorName && (
                  <p className="text-xs text-red-500 mt-1">{formErrors.vendorName}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Vendor Type <span className="text-red-500">*</span>
                </label>
                <select
                  value={vendorForm.vendorType}
                  onChange={(e) => setVendorForm({ ...vendorForm, vendorType: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Individual">Individual</option>
                  <option value="Company">Company</option>
                  <option value="Consultant">Consultant</option>
                  <option value="Contractor">Contractor</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Registration Number
                </label>
                <input
                  type="text"
                  value={vendorForm.registrationNumber}
                  onChange={(e) => setVendorForm({ ...vendorForm, registrationNumber: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Company registration number"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Tax ID / TRN <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={vendorForm.taxId}
                  onChange={(e) => setVendorForm({ ...vendorForm, taxId: e.target.value })}
                  className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    formErrors.taxId ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Tax identification number"
                />
                {formErrors.taxId && (
                  <p className="text-xs text-red-500 mt-1">{formErrors.taxId}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Industry Category
                </label>
                <select
                  value={vendorForm.industryCategory}
                  onChange={(e) => setVendorForm({ ...vendorForm, industryCategory: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Technology">Technology</option>
                  <option value="Manufacturing">Manufacturing</option>
                  <option value="Logistics">Logistics</option>
                  <option value="Consulting">Consulting</option>
                  <option value="Professional Services">Professional Services</option>
                  <option value="Healthcare">Healthcare</option>
                  <option value="Finance">Finance</option>
                  <option value="Retail">Retail</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="flex items-center justify-between pt-2">
                <label className="text-sm font-medium text-gray-700">
                  Status
                </label>
                <button
                  onClick={() => setVendorForm({ ...vendorForm, status: !vendorForm.status })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    vendorForm.status ? 'bg-green-600' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      vendorForm.status ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
                <span className={`text-xs font-medium ${vendorForm.status ? 'text-green-700' : 'text-gray-500'}`}>
                  {vendorForm.status ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
          </div>

          {/* Section 2: Contact Information */}
          <div className="pt-6 border-t border-gray-200">
            <h3 className="text-sm font-semibold text-gray-900 mb-4 uppercase tracking-wide">
              Contact Information
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Primary Contact Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={vendorForm.primaryContactName}
                  onChange={(e) => setVendorForm({ ...vendorForm, primaryContactName: e.target.value })}
                  className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    formErrors.primaryContactName ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Full name"
                />
                {formErrors.primaryContactName && (
                  <p className="text-xs text-red-500 mt-1">{formErrors.primaryContactName}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={vendorForm.email}
                  onChange={(e) => setVendorForm({ ...vendorForm, email: e.target.value })}
                  className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    formErrors.email ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="vendor@example.com"
                />
                {formErrors.email && (
                  <p className="text-xs text-red-500 mt-1">{formErrors.email}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Phone Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  value={vendorForm.phone}
                  onChange={(e) => setVendorForm({ ...vendorForm, phone: e.target.value })}
                  className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    formErrors.phone ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="+1 (555) 000-0000"
                />
                {formErrors.phone && (
                  <p className="text-xs text-red-500 mt-1">{formErrors.phone}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Secondary Contact (Optional)
                </label>
                <input
                  type="text"
                  value={vendorForm.secondaryContact}
                  onChange={(e) => setVendorForm({ ...vendorForm, secondaryContact: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Alternative contact name"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Address */}
          <div className="pt-6 border-t border-gray-200">
            <h3 className="text-sm font-semibold text-gray-900 mb-4 uppercase tracking-wide">
              Address
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Street Address
                </label>
                <input
                  type="text"
                  value={vendorForm.streetAddress}
                  onChange={(e) => setVendorForm({ ...vendorForm, streetAddress: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="123 Business Street"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    City
                  </label>
                  <input
                    type="text"
                    value={vendorForm.city}
                    onChange={(e) => setVendorForm({ ...vendorForm, city: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="City"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Postal Code
                  </label>
                  <input
                    type="text"
                    value={vendorForm.postalCode}
                    onChange={(e) => setVendorForm({ ...vendorForm, postalCode: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="10001"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Country
                </label>
                <input
                  type="text"
                  value={vendorForm.country}
                  onChange={(e) => setVendorForm({ ...vendorForm, country: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="United States"
                />
              </div>
            </div>
          </div>

          {/* Section 4: Financial Information */}
          <div className="pt-6 border-t border-gray-200">
            <h3 className="text-sm font-semibold text-gray-900 mb-4 uppercase tracking-wide">
              Financial Information
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Banking Institution
                </label>
                <input
                  type="text"
                  value={vendorForm.bankingInstitution}
                  onChange={(e) => setVendorForm({ ...vendorForm, bankingInstitution: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Bank name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Account Name
                </label>
                <input
                  type="text"
                  value={vendorForm.accountName}
                  onChange={(e) => setVendorForm({ ...vendorForm, accountName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Account holder name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Account Number
                </label>
                <input
                  type="text"
                  value={vendorForm.accountNumber}
                  onChange={(e) => setVendorForm({ ...vendorForm, accountNumber: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="••••••••••1234"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Currency
                  </label>
                  <select
                    value={vendorForm.currency}
                    onChange={(e) => setVendorForm({ ...vendorForm, currency: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                    <option value="GBP">GBP</option>
                    <option value="JPY">JPY</option>
                    <option value="CAD">CAD</option>
                    <option value="AUD">AUD</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Payment Terms
                  </label>
                  <select
                    value={vendorForm.paymentTerms}
                    onChange={(e) => setVendorForm({ ...vendorForm, paymentTerms: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Net 15">Net 15</option>
                    <option value="Net 30">Net 30</option>
                    <option value="Net 45">Net 45</option>
                    <option value="Custom">Custom</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Section 5: Compliance & Documentation */}
          <div className="pt-6 border-t border-gray-200">
            <h3 className="text-sm font-semibold text-gray-900 mb-4 uppercase tracking-wide">
              Compliance & Documentation
            </h3>
            <div className="space-y-4">
              {/* File Upload Zone */}
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
                <input
                  type="file"
                  multiple
                  onChange={onFileUpload}
                  className="hidden"
                  id="file-upload"
                  accept=".pdf,.doc,.docx,.jpg,.png"
                />
                <label htmlFor="file-upload" className="cursor-pointer">
                  <Upload className="w-10 h-10 text-gray-400 mx-auto mb-3" />
                  <p className="text-sm font-medium text-gray-900 mb-1">
                    Click to upload or drag and drop
                  </p>
                  <p className="text-xs text-gray-500">
                    Business Registration, Tax Certificates, Insurance, etc.
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    PDF, DOC, JPG, PNG (Max 10MB)
                  </p>
                </label>
              </div>

              {/* Uploaded Files List */}
              {uploadedFiles.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                    Uploaded Documents ({uploadedFiles.length})
                  </p>
                  {uploadedFiles.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg group hover:bg-blue-100 transition-colors"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <FileText className="w-5 h-5 text-blue-600 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {file.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {(file.size / 1024).toFixed(2)} KB
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => onFileRemove(index)}
                        className="p-1.5 text-red-600 hover:bg-red-100 rounded-lg transition-colors flex-shrink-0"
                        title="Remove file"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sticky Footer */}
        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-5 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors text-sm font-medium"
          >
            Cancel
          </button>
          <button
            onClick={onSave}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm text-sm font-medium"
          >
            <CheckCircle className="w-4 h-4" />
            Save Vendor
          </button>
        </div>
      </div>
    </>
  );
}