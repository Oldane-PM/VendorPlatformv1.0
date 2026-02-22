import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export function AddVendor() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link
          href="/vendors"
          className="inline-flex items-center text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back to Vendors
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
        <h1 className="text-2xl font-semibold text-gray-900 mb-4">
          Add New Vendor
        </h1>
        <p className="text-gray-600 mb-6">
          In the full platform, you would be able to add and manage vendors here.
          This demo focuses on the engagement workflow and reporting features.
        </p>
        <div className="flex gap-4 justify-center">
          <Link
            href="/vendors"
            className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            View Existing Vendors
          </Link>
          <Link
            href="/engagements"
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            View Engagements
          </Link>
        </div>
      </div>
    </div>
  );
}