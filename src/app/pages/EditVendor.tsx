import { useRouter } from 'next/router';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export function EditVendor() {
  const router = useRouter();
  const id = router.query.vendorId as string | undefined;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link
          href={id ? `/vendors/${id}` : '/vendors'}
          className="inline-flex items-center text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back to Vendor Details
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
        <h1 className="text-2xl font-semibold text-gray-900 mb-4">
          Edit Vendor
        </h1>
        <p className="text-gray-600 mb-6">
          In the full platform, you would be able to edit vendor information here.
          This demo focuses on the engagement workflow and reporting features.
        </p>
        <div className="flex gap-4 justify-center">
          <Link
            href={id ? `/vendors/${id}` : '/vendors'}
            className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            View Vendor Profile
          </Link>
          <Link
            href="/vendors"
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            All Vendors
          </Link>
        </div>
      </div>
    </div>
  );
}