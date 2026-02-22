import { useState } from 'react';
import {
  UserPlus,
  Search,
  Edit,
  Ban,
  RotateCcw,
  Mail,
  Phone,
  Building2,
  Shield,
  X,
  Calendar,
  Check,
  AlertCircle,
} from 'lucide-react';

// User type
interface User {
  userId: string;
  fullName: string;
  email: string;
  phone?: string;
  department: string;
  businessUnit: string;
  location: string;
  role: 'Admin' | 'Finance' | 'Department Head' | 'Procurement' | 'Viewer';
  status: 'Active' | 'Suspended' | 'Pending Invite';
  lastLogin: string | null;
  attributes: string[];
  mfaRequired: boolean;
  createdAt: string;
}

// Mock user data
const mockUsers: User[] = [
  {
    userId: 'USR-001',
    fullName: 'Oldane Graham',
    email: 'oldane.graham@intellibus.com',
    phone: '+1 (555) 123-4567',
    department: 'Finance',
    businessUnit: 'Corporate',
    location: 'New York, NY',
    role: 'Admin',
    status: 'Active',
    lastLogin: '2026-02-17T14:30:00',
    attributes: ['Can Approve High Value > $100K', 'Can Create RFQ', 'Can Award Vendor', 'Can Generate Invoice'],
    mfaRequired: true,
    createdAt: '2025-01-15',
  },
  {
    userId: 'USR-002',
    fullName: 'Sarah Mitchell',
    email: 'sarah.mitchell@intellibus.com',
    phone: '+1 (555) 234-5678',
    department: 'Procurement',
    businessUnit: 'Operations',
    location: 'Boston, MA',
    role: 'Procurement',
    status: 'Active',
    lastLogin: '2026-02-17T09:15:00',
    attributes: ['Can Create RFQ', 'Can Award Vendor'],
    mfaRequired: true,
    createdAt: '2025-03-22',
  },
  {
    userId: 'USR-003',
    fullName: 'David Chen',
    email: 'david.chen@intellibus.com',
    department: 'IT',
    businessUnit: 'Technology',
    location: 'San Francisco, CA',
    role: 'Department Head',
    status: 'Active',
    lastLogin: '2026-02-16T16:45:00',
    attributes: ['Can Approve High Value > $100K', 'Can Create RFQ'],
    mfaRequired: false,
    createdAt: '2025-02-10',
  },
  {
    userId: 'USR-004',
    fullName: 'Emily Rodriguez',
    email: 'emily.rodriguez@intellibus.com',
    phone: '+1 (555) 345-6789',
    department: 'Finance',
    businessUnit: 'Corporate',
    location: 'New York, NY',
    role: 'Finance',
    status: 'Active',
    lastLogin: '2026-02-17T11:20:00',
    attributes: ['Finance View Only', 'Can Generate Invoice'],
    mfaRequired: true,
    createdAt: '2025-04-05',
  },
  {
    userId: 'USR-005',
    fullName: 'Michael Thompson',
    email: 'michael.thompson@intellibus.com',
    department: 'Operations',
    businessUnit: 'Operations',
    location: 'Chicago, IL',
    role: 'Viewer',
    status: 'Active',
    lastLogin: '2026-02-15T13:10:00',
    attributes: ['Finance View Only'],
    mfaRequired: false,
    createdAt: '2025-06-18',
  },
  {
    userId: 'USR-006',
    fullName: 'Jessica Park',
    email: 'jessica.park@intellibus.com',
    department: 'Procurement',
    businessUnit: 'Operations',
    location: 'Seattle, WA',
    role: 'Procurement',
    status: 'Pending Invite',
    lastLogin: null,
    attributes: ['Can Create RFQ'],
    mfaRequired: true,
    createdAt: '2026-02-15',
  },
  {
    userId: 'USR-007',
    fullName: 'Robert Wilson',
    email: 'robert.wilson@intellibus.com',
    department: 'Legal',
    businessUnit: 'Corporate',
    location: 'New York, NY',
    role: 'Viewer',
    status: 'Suspended',
    lastLogin: '2026-01-20T10:30:00',
    attributes: ['Finance View Only'],
    mfaRequired: false,
    createdAt: '2025-05-12',
  },
];

const availableAttributes = [
  'Can Approve High Value > $100K',
  'Can Create RFQ',
  'Can Award Vendor',
  'Can Generate Invoice',
  'Finance View Only',
  'Can Manage Users',
  'Can Export Reports',
  'Can Close Month',
];

const departments = ['Finance', 'Procurement', 'IT', 'Operations', 'Legal', 'HR', 'Marketing'];
const businessUnits = ['Corporate', 'Operations', 'Technology', 'Sales'];
const locations = ['New York, NY', 'Boston, MA', 'San Francisco, CA', 'Chicago, IL', 'Seattle, WA', 'Austin, TX'];
const roles = ['Admin', 'Finance', 'Department Head', 'Procurement', 'Viewer'];

export function UsersPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<'create' | 'edit'>('create');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    department: '',
    businessUnit: '',
    location: '',
    role: 'Viewer' as User['role'],
    attributes: [] as string[],
    sendInvite: true,
    forcePasswordReset: true,
    mfaRequired: false,
  });

  const users = mockUsers;

  // Calculate summary metrics
  const totalUsers = users.length;
  const activeUsers = users.filter((u) => u.status === 'Active').length;
  const adminUsers = users.filter((u) => u.role === 'Admin').length;
  const pendingInvitations = users.filter((u) => u.status === 'Pending Invite').length;

  // Filter users
  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.userId.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;

    return matchesSearch && matchesStatus && matchesRole;
  });

  const handleCreateUser = () => {
    setDrawerMode('create');
    setSelectedUser(null);
    setFormData({
      fullName: '',
      email: '',
      phone: '',
      department: '',
      businessUnit: '',
      location: '',
      role: 'Viewer',
      attributes: [],
      sendInvite: true,
      forcePasswordReset: true,
      mfaRequired: false,
    });
    setIsDrawerOpen(true);
  };

  const handleEditUser = (user: User) => {
    setDrawerMode('edit');
    setSelectedUser(user);
    setFormData({
      fullName: user.fullName,
      email: user.email,
      phone: user.phone || '',
      department: user.department,
      businessUnit: user.businessUnit,
      location: user.location,
      role: user.role,
      attributes: user.attributes,
      sendInvite: false,
      forcePasswordReset: false,
      mfaRequired: user.mfaRequired,
    });
    setIsDrawerOpen(true);
  };

  const handleCloseDrawer = () => {
    setIsDrawerOpen(false);
    setSelectedUser(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission
    alert(`${drawerMode === 'create' ? 'Creating' : 'Updating'} user: ${formData.email}`);
    handleCloseDrawer();
  };

  const toggleAttribute = (attribute: string) => {
    setFormData((prev) => ({
      ...prev,
      attributes: prev.attributes.includes(attribute)
        ? prev.attributes.filter((a) => a !== attribute)
        : [...prev.attributes, attribute],
    }));
  };

  const formatLastLogin = (lastLogin: string | null) => {
    if (!lastLogin) return 'Never';
    const date = new Date(lastLogin);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadgeColor = (status: User['status']) => {
    switch (status) {
      case 'Active':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'Suspended':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'Pending Invite':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const getRoleBadgeColor = (role: User['role']) => {
    switch (role) {
      case 'Admin':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'Finance':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Department Head':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'Procurement':
        return 'bg-cyan-50 text-cyan-700 border-cyan-200';
      case 'Viewer':
        return 'bg-gray-50 text-gray-700 border-gray-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900">Users</h1>
          <p className="text-gray-500 mt-1">Manage system access and permissions</p>
        </div>
        <button
          onClick={handleCreateUser}
          className="flex items-center gap-2 px-5 py-3 bg-primary text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold shadow-sm"
        >
          <UserPlus className="w-5 h-5" />
          Create User
        </button>
      </div>

      {/* Access Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Total Users</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{totalUsers}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Active Users</p>
          <p className="text-3xl font-bold text-green-600 mt-2">{activeUsers}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Admin Users</p>
          <p className="text-3xl font-bold text-purple-600 mt-2">{adminUsers}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Pending Invitations</p>
          <p className="text-3xl font-bold text-amber-600 mt-2">{pendingInvitations}</p>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, email, or user ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full lg:w-48 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            >
              <option value="all">All Status</option>
              <option value="Active">Active</option>
              <option value="Suspended">Suspended</option>
              <option value="Pending Invite">Pending Invite</option>
            </select>
          </div>

          {/* Role Filter */}
          <div>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-full lg:w-48 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            >
              <option value="all">All Roles</option>
              {roles.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* User Table */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Full Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Department
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredUsers.map((user) => (
                <tr
                  key={user.userId}
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={() => handleEditUser(user)}
                >
                  <td className="px-6 py-4 text-sm text-gray-900">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-xs font-semibold text-blue-600">
                          {user.fullName
                            .split(' ')
                            .map((n) => n[0])
                            .join('')
                            .toUpperCase()}
                        </span>
                      </div>
                      <span className="font-medium">{user.fullName}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">{user.email}</td>
                  <td className="px-6 py-4 text-sm text-gray-700">{user.department}</td>
                  <td className="px-6 py-4 text-sm">
                    <span
                      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusBadgeColor(
                        user.status
                      )}`}
                    >
                      {user.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Right Drawer for Create/Edit User */}
      {isDrawerOpen && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-40"
            onClick={handleCloseDrawer}
          />

          {/* Drawer */}
          <div className="fixed top-0 right-0 h-full w-full md:w-[450px] bg-white shadow-2xl z-50 overflow-y-auto">
            <form onSubmit={handleSubmit}>
              {/* Drawer Header */}
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    {drawerMode === 'create' ? 'Create User' : 'Edit User'}
                  </h2>
                  {drawerMode === 'edit' && selectedUser && (
                    <p className="text-sm text-gray-500 mt-1">{selectedUser.userId}</p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={handleCloseDrawer}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-600" />
                </button>
              </div>

              {/* Drawer Content */}
              <div className="px-6 py-6 space-y-6">
                {/* Section 1: Basic Information */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-4">
                    Basic Information
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Full Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.fullName}
                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="John Doe"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="john.doe@intellibus.com"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Phone (Optional)</label>
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="+1 (555) 123-4567"
                      />
                    </div>
                  </div>
                </div>

                {/* Section 2: Organizational Details */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-4">
                    Organizational Details
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Department <span className="text-red-500">*</span>
                      </label>
                      <select
                        required
                        value={formData.department}
                        onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select Department</option>
                        {departments.map((dept) => (
                          <option key={dept} value={dept}>
                            {dept}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Business Unit <span className="text-red-500">*</span>
                      </label>
                      <select
                        required
                        value={formData.businessUnit}
                        onChange={(e) => setFormData({ ...formData, businessUnit: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select Business Unit</option>
                        {businessUnits.map((unit) => (
                          <option key={unit} value={unit}>
                            {unit}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Location <span className="text-red-500">*</span>
                      </label>
                      <select
                        required
                        value={formData.location}
                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select Location</option>
                        {locations.map((loc) => (
                          <option key={loc} value={loc}>
                            {loc}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Section 3: Role & Access */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-4">
                    Role & Access
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Role <span className="text-red-500">*</span>
                      </label>
                      <select
                        required
                        value={formData.role}
                        onChange={(e) => setFormData({ ...formData, role: e.target.value as User['role'] })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        {roles.map((role) => (
                          <option key={role} value={role}>
                            {role}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Attribute Rules
                      </label>
                      <div className="space-y-2 max-h-64 overflow-y-auto border border-gray-200 rounded-lg p-3">
                        {availableAttributes.map((attribute) => (
                          <label
                            key={attribute}
                            className="flex items-start gap-3 p-2 hover:bg-gray-50 rounded cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={formData.attributes.includes(attribute)}
                              onChange={() => toggleAttribute(attribute)}
                              className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                            />
                            <span className="text-sm text-gray-700 flex-1">{attribute}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section 4: Account Controls */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-4">
                    Account Controls
                  </h3>
                  <div className="space-y-4">
                    {drawerMode === 'create' && (
                      <>
                        <label className="flex items-center justify-between p-4 bg-gray-50 rounded-lg cursor-pointer">
                          <div className="flex items-center gap-3">
                            <Mail className="w-5 h-5 text-gray-600" />
                            <div>
                              <p className="text-sm font-medium text-gray-900">Send Invite Email</p>
                              <p className="text-xs text-gray-500">Email invitation to set up account</p>
                            </div>
                          </div>
                          <input
                            type="checkbox"
                            checked={formData.sendInvite}
                            onChange={(e) =>
                              setFormData({ ...formData, sendInvite: e.target.checked })
                            }
                            className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          />
                        </label>
                        <label className="flex items-center justify-between p-4 bg-gray-50 rounded-lg cursor-pointer">
                          <div className="flex items-center gap-3">
                            <RotateCcw className="w-5 h-5 text-gray-600" />
                            <div>
                              <p className="text-sm font-medium text-gray-900">
                                Force Password Reset on First Login
                              </p>
                              <p className="text-xs text-gray-500">Require password change after first login</p>
                            </div>
                          </div>
                          <input
                            type="checkbox"
                            checked={formData.forcePasswordReset}
                            onChange={(e) =>
                              setFormData({ ...formData, forcePasswordReset: e.target.checked })
                            }
                            className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          />
                        </label>
                      </>
                    )}
                    <label className="flex items-center justify-between p-4 bg-gray-50 rounded-lg cursor-pointer">
                      <div className="flex items-center gap-3">
                        <Shield className="w-5 h-5 text-gray-600" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">MFA Required</p>
                          <p className="text-xs text-gray-500">Enable multi-factor authentication</p>
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={formData.mfaRequired}
                        onChange={(e) => setFormData({ ...formData, mfaRequired: e.target.checked })}
                        className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                    </label>
                  </div>
                </div>

                {/* Warning for Edit Mode */}
                {drawerMode === 'edit' && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-amber-900">Changing User Permissions</p>
                      <p className="text-xs text-amber-700 mt-1">
                        Modifying roles or attributes will immediately affect user access. Changes are logged
                        for audit purposes.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Drawer Footer */}
              <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={handleCloseDrawer}
                  className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 text-sm font-semibold text-white bg-primary rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {drawerMode === 'create' ? 'Create User' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </>
      )}
    </div>
  );
}