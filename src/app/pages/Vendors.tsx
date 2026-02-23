import { useState } from 'react';
import { useRouter } from 'next/router';
import { Search, Filter, Star, Plus, Loader2, AlertCircle } from 'lucide-react';
import { AddVendorPanel } from '../components/AddVendorPanel';
import { useVendors } from '@/lib/hooks/useVendors';

export function Vendors() {
  const {
    vendors,
    loading,
    error,
    search: searchTerm,
    setSearch: setSearchTerm,
    statusFilter,
    setStatusFilter,
    createVendor,
    refresh,
  } = useVendors();

  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [showAddVendorPanel, setShowAddVendorPanel] = useState(false);

  // Vendor form state
  const [vendorForm, setVendorForm] = useState({
    vendorName: '',
    vendorType: 'Company',
    registrationNumber: '',
    taxId: '',
    industryCategory: 'Technology',
    status: true,
    primaryContactName: '',
    email: '',
    phone: '',
    secondaryContact: '',
    streetAddress: '',
    city: '',
    country: '',
    postalCode: '',
    bankingInstitution: '',
    accountName: '',
    accountNumber: '',
    currency: 'USD',
    paymentTerms: 'Net 30',
    documents: [] as File[],
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);

  // Client-side category filter (category is not in the DB yet)
  const filteredVendors = vendors.filter((vendor) => {
    // Category filtering is a no-op until the column is added to DB
    return categoryFilter === 'all' || true;
  });

  const generateVendorId = () => {
    const vendorCount = vendors.length + 1;
    return `VND-${vendorCount.toString().padStart(4, '0')}`;
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!vendorForm.vendorName.trim())
      errors.vendorName = 'Vendor name is required';
    if (!vendorForm.email.trim()) errors.email = 'Email is required';
    if (!vendorForm.primaryContactName.trim())
      errors.primaryContactName = 'Primary contact is required';
    if (!vendorForm.phone.trim()) errors.phone = 'Phone number is required';
    if (!vendorForm.taxId.trim()) errors.taxId = 'Tax ID is required';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const newFiles = Array.from(files);
      setUploadedFiles([...uploadedFiles, ...newFiles]);
    }
  };

  const removeFile = (index: number) => {
    setUploadedFiles(uploadedFiles.filter((_, i) => i !== index));
  };

  const handleSaveVendor = async () => {
    if (!validateForm()) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      await createVendor({
        vendor_name: vendorForm.vendorName.trim(),
        vendor_code: vendorForm.registrationNumber || undefined,
        tax_id: vendorForm.taxId || undefined,
        status: vendorForm.status ? 'active' : 'inactive',
      });

      setShowAddVendorPanel(false);
      resetForm();
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : 'Failed to create vendor';
      alert(`Error creating vendor: ${msg}`);
    }
  };

  const resetForm = () => {
    setVendorForm({
      vendorName: '',
      vendorType: 'Company',
      registrationNumber: '',
      taxId: '',
      industryCategory: 'Technology',
      status: true,
      primaryContactName: '',
      email: '',
      phone: '',
      secondaryContact: '',
      streetAddress: '',
      city: '',
      country: '',
      postalCode: '',
      bankingInstitution: '',
      accountName: '',
      accountNumber: '',
      currency: 'USD',
      paymentTerms: 'Net 30',
      documents: [],
    });
    setUploadedFiles([]);
    setFormErrors({});
  };

  const router = useRouter();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900">Vendors</h1>
          <p className="text-gray-500 mt-2">Manage your vendor relationships</p>
        </div>
        <button
          onClick={() => setShowAddVendorPanel(true)}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm font-medium"
        >
          <Plus className="w-5 h-5" />
          Add Vendor
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search vendors..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Status Filter */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="pending">Pending</option>
            </select>
          </div>

          {/* Category Filter (placeholder until DB column exists) */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
            >
              <option value="all">All Categories</option>
            </select>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="bg-white rounded-lg shadow p-12 flex flex-col items-center justify-center">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin mb-3" />
          <p className="text-gray-500">Loading vendors…</p>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-medium text-red-800">Failed to load vendors</p>
            <p className="text-sm text-red-600 mt-1">{error}</p>
            <button
              onClick={refresh}
              className="mt-3 text-sm font-medium text-red-700 hover:text-red-900 underline"
            >
              Try again
            </button>
          </div>
        </div>
      )}

      {/* Vendors Table */}
      {!loading && !error && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Vendor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Code
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tax ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredVendors.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center">
                      <p className="text-gray-500">No vendors found</p>
                    </td>
                  </tr>
                ) : (
                  filteredVendors.map((vendor) => (
                    <tr
                      key={vendor.id}
                      onClick={() => router.push(`/vendors/${vendor.id}`)}
                      className="hover:bg-gray-50 cursor-pointer transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="font-medium text-gray-900">
                            {vendor.vendor_name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {vendor.vendor_code ?? '—'}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-900">
                          {vendor.vendor_code ?? '—'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`
                          inline-flex px-2 py-1 text-xs rounded-full
                          ${
                            vendor.status === 'active'
                              ? 'bg-green-100 text-green-700'
                              : vendor.status === 'pending'
                                ? 'bg-yellow-100 text-yellow-700'
                                : 'bg-gray-100 text-gray-700'
                          }
                        `}
                        >
                          {vendor.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-900">
                          {vendor.tax_id ?? '—'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-500">
                          {vendor.created_at
                            ? new Date(vendor.created_at).toLocaleDateString()
                            : '—'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Results Count */}
      {!loading && !error && (
        <div className="text-sm text-gray-500">
          Showing {filteredVendors.length} of {vendors.length} vendors
        </div>
      )}

      {/* Add Vendor Slide-over Panel */}
      <AddVendorPanel
        show={showAddVendorPanel}
        onClose={() => {
          setShowAddVendorPanel(false);
          resetForm();
        }}
        onSave={handleSaveVendor}
        vendorForm={vendorForm}
        setVendorForm={setVendorForm}
        formErrors={formErrors}
        uploadedFiles={uploadedFiles}
        onFileUpload={handleFileUpload}
        onFileRemove={removeFile}
        generateVendorId={generateVendorId}
      />
    </div>
  );
}
