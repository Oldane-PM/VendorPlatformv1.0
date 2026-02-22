import { useState } from 'react';
import { usePlatform } from '../contexts/PlatformContext';
import Link from 'next/link';
import { useRouter } from 'next/router';
import {
  Search,
  Filter,
  Eye,
  Star,
  Plus,
  X,
  Upload,
  FileText,
  CheckCircle,
  AlertCircle,
  MoreVertical,
} from 'lucide-react';
import { AddVendorPanel } from '../components/AddVendorPanel';

export function Vendors() {
  const { vendors } = usePlatform();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [showAddVendorPanel, setShowAddVendorPanel] = useState(false);

  // Vendor form state
  const [vendorForm, setVendorForm] = useState({
    // Basic Information
    vendorName: '',
    vendorType: 'Company',
    registrationNumber: '',
    taxId: '',
    industryCategory: 'Technology',
    status: true, // Active by default
    
    // Contact Information
    primaryContactName: '',
    email: '',
    phone: '',
    secondaryContact: '',
    
    // Address
    streetAddress: '',
    city: '',
    country: '',
    postalCode: '',
    
    // Financial Information
    bankingInstitution: '',
    accountName: '',
    accountNumber: '',
    currency: 'USD',
    paymentTerms: 'Net 30',
    
    // Compliance & Documentation
    documents: [] as File[],
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);

  const categories = Array.from(new Set(vendors.map((v) => v.category)));

  const filteredVendors = vendors.filter((vendor) => {
    const matchesSearch =
      vendor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vendor.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vendor.contactPerson.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === 'all' || vendor.status === statusFilter;

    const matchesCategory =
      categoryFilter === 'all' || vendor.category === categoryFilter;

    return matchesSearch && matchesStatus && matchesCategory;
  });

  // Generate Vendor ID
  const generateVendorId = () => {
    const vendorCount = vendors.length + 1;
    return `VND-${vendorCount.toString().padStart(4, '0')}`;
  };

  // Validate form
  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!vendorForm.vendorName.trim()) errors.vendorName = 'Vendor name is required';
    if (!vendorForm.email.trim()) errors.email = 'Email is required';
    if (!vendorForm.primaryContactName.trim()) errors.primaryContactName = 'Primary contact is required';
    if (!vendorForm.phone.trim()) errors.phone = 'Phone number is required';
    if (!vendorForm.taxId.trim()) errors.taxId = 'Tax ID is required';

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const newFiles = Array.from(files);
      setUploadedFiles([...uploadedFiles, ...newFiles]);
    }
  };

  // Remove uploaded file
  const removeFile = (index: number) => {
    setUploadedFiles(uploadedFiles.filter((_, i) => i !== index));
  };

  // Handle form submission
  const handleSaveVendor = () => {
    if (!validateForm()) {
      alert('Please fill in all required fields');
      return;
    }

    const newVendorId = generateVendorId();
    
    // In a real app, this would call an API
    alert(
      `✅ Vendor Successfully Created!\n\n` +
      `Vendor ID: ${newVendorId}\n` +
      `Name: ${vendorForm.vendorName}\n` +
      `Type: ${vendorForm.vendorType}\n` +
      `Contact: ${vendorForm.primaryContactName}\n` +
      `Email: ${vendorForm.email}\n` +
      `Status: ${vendorForm.status ? 'Active' : 'Inactive'}\n` +
      `Documents Uploaded: ${uploadedFiles.length}`
    );

    // Reset form and close panel
    setShowAddVendorPanel(false);
    resetForm();
  };

  // Reset form
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
          <p className="text-gray-500 mt-2">
            Manage your vendor relationships
          </p>
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

          {/* Category Filter */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
            >
              <option value="all">All Categories</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Vendors Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Vendor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rating
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Orders
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Spend
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredVendors.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
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
                          {vendor.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {vendor.contactPerson}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">
                        {vendor.category}
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
                      <div className="flex items-center">
                        <Star className="w-4 h-4 text-yellow-400 fill-yellow-400 mr-1" />
                        <span className="text-sm text-gray-900">
                          {vendor.rating}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">
                        {vendor.totalEngagements}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">
                        ${vendor.totalSpent.toLocaleString()}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Results Count */}
      <div className="text-sm text-gray-500">
        Showing {filteredVendors.length} of {vendors.length} vendors
      </div>

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