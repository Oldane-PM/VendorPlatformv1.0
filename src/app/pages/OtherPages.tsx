import Link from 'next/link';
import { Construction, Users, Shield, Settings as SettingsIcon } from 'lucide-react';

export function AdminPage() {
  const adminModules = [
    {
      title: 'User Management',
      description: 'Manage user accounts, roles, and permissions',
      icon: Users,
      path: '/admin/users',
      color: 'from-blue-600 to-cyan-600',
      available: false,
    },
    {
      title: 'Access Control (ABAC)',
      description: 'Configure attribute-based access control rules',
      icon: Shield,
      path: '/admin/abac',
      color: 'from-purple-600 to-indigo-600',
      available: false,
    },
    {
      title: 'System Settings',
      description: 'Configure system-wide settings and preferences',
      icon: SettingsIcon,
      path: '/admin/settings',
      color: 'from-gray-600 to-gray-800',
      available: false,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-gray-900">Admin / ABAC Configuration</h1>
        <p className="text-gray-500 mt-1">
          System administration and access control
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {adminModules.map((module) => {
          const Icon = module.icon;
          return (
            <div
              key={module.path}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-lg bg-gradient-to-r ${module.color} flex items-center justify-center flex-shrink-0`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900">{module.title}</h3>
                  <p className="text-sm text-gray-600 mt-1">{module.description}</p>
                  {module.available ? (
                    <Link
                      href={module.path}
                      className="inline-flex items-center mt-4 text-sm font-medium text-blue-600 hover:text-blue-700"
                    >
                      Open Module
                      <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>
                  ) : (
                    <div className="inline-flex items-center mt-4 text-sm text-gray-400">
                      <Construction className="w-4 h-4 mr-1" />
                      Coming Soon
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}