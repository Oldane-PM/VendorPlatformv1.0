import { Link, Outlet, useLocation } from 'react-router';
import {
  LayoutDashboard,
  FileText,
  Receipt,
  Users,
  CheckSquare,
  BarChart3,
  Settings,
  Menu,
  X,
  Search,
  Bell,
  User as UserIcon,
  Briefcase,
  Sparkles,
  Clipboard,
  FileCheck,
  Handshake,
  Building2,
  Landmark,
  CreditCard,
  ReceiptText,
  type LucideIcon,
} from 'lucide-react';
import { useState } from 'react';

interface BaseNavItem {
  path: string;
  label: string;
  icon: LucideIcon;
  badge?: string;
  isPrimaryAction?: boolean;
}

interface DividerNavItem {
  type: 'divider';
  label?: string;
}

type NavItem = BaseNavItem | DividerNavItem;

export function Layout() {
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems: NavItem[] = [
    {
      path: '/ai-ocr',
      label: 'AI Document Upload',
      icon: Sparkles,
      badge: 'AI',
      isPrimaryAction: true,
    },
    { path: '/', label: 'Dashboard', icon: LayoutDashboard },
    { type: 'divider', label: 'Planning' },
    { path: '/sourcing', label: 'Engagements', icon: Clipboard },
    { path: '/work-orders', label: 'Work Orders', icon: FileCheck },
    { type: 'divider', label: 'Execution' },
    {
      path: '/vendor-engagements',
      label: 'Vendor Engagements',
      icon: Handshake,
    },
    { path: '/invoices', label: 'Invoices', icon: Receipt },
    { type: 'divider', label: 'Directory' },
    { path: '/vendors', label: 'Vendors', icon: Building2 },
    { type: 'divider', label: 'Financial' },
    { path: '/bank-account', label: 'Bank Account', icon: Landmark },
    {
      path: '/payment-processing',
      label: 'Payment Processing',
      icon: CreditCard,
    },
    {
      path: '/account-reconciliation',
      label: 'Account Reconciliation',
      icon: ReceiptText,
    },
    { type: 'divider' },
    { path: '/users', label: 'Users', icon: Users },
    { path: '/reports', label: 'Reports', icon: BarChart3 },
    { path: '/admin', label: 'Admin', icon: Settings },
  ];

  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    // Special handling for admin section
    if (path === '/admin') {
      return (
        location.pathname === '/admin' ||
        location.pathname.startsWith('/admin/')
      );
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Top Bar */}
      <header className="fixed top-0 left-0 right-0 h-16 bg-white border-b border-border z-30 lg:pl-64">
        <div className="flex items-center justify-between h-full px-4 lg:px-6">
          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden p-2 hover:bg-gray-100 rounded-lg"
          >
            {isMobileMenuOpen ? (
              <X className="w-5 h-5 text-gray-700" />
            ) : (
              <Menu className="w-5 h-5 text-gray-700" />
            )}
          </button>

          {/* Search Bar */}
          <div className="flex-1 max-w-xl mx-auto hidden md:block">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search engagements, vendors, invoices..."
                className="w-full pl-10 pr-4 py-2 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
              />
            </div>
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center gap-3">
            <button className="p-2 hover:bg-gray-100 rounded-lg relative">
              <Bell className="w-5 h-5 text-gray-600" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
            <button className="flex items-center gap-2 p-2 hover:bg-gray-100 rounded-lg">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <UserIcon className="w-4 h-4 text-blue-600" />
              </div>
              <span className="text-sm font-medium hidden lg:block text-gray-700">
                Oldane Graham
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 z-40 h-screen w-64 bg-white border-r border-border transition-transform
          ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0
        `}
      >
        <div className="h-full flex flex-col overflow-y-auto">
          {/* Logo */}
          <div className="h-16 flex items-center px-6 border-b border-border">
            <h1 className="text-xl font-semibold text-primary">Intellibus</h1>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-4 space-y-1">
            {navItems.map((item, index) => {
              // Handle dividers
              if (item.type === 'divider') {
                if (item.label) {
                  // Section divider with label
                  return (
                    <div key={`divider-${index}`} className="pt-4 pb-2 px-3">
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        {item.label}
                      </p>
                    </div>
                  );
                } else {
                  // Simple divider line
                  return (
                    <div key={`divider-${index}`} className="py-2">
                      <div className="h-px bg-gray-200" />
                    </div>
                  );
                }
              }

              const Icon = item.icon;
              const active = isActive(item.path);

              // Primary Action Button (AI Document Upload)
              if (item.isPrimaryAction) {
                return (
                  <div key={item.path} className="mb-4">
                    <Link
                      to={item.path}
                      onClick={() => setIsMobileMenuOpen(false)}
                      title="Upload vendor documents and extract structured data instantly"
                      className={`
                        relative group flex items-center px-4 py-3 rounded-lg transition-all text-sm font-semibold shadow-sm
                        ${
                          active
                            ? 'bg-blue-700 text-white shadow-md'
                            : 'bg-primary text-white hover:bg-blue-700 hover:shadow-md'
                        }
                      `}
                    >
                      <Icon className="w-5 h-5 mr-3" />
                      <span className="flex-1">{item.label}</span>

                      {/* AI Badge */}
                      {item.badge && (
                        <span className="ml-2 px-2 py-0.5 text-[10px] font-bold rounded-full tracking-wide bg-blue-500 text-white">
                          {item.badge}
                        </span>
                      )}

                      {/* Focus ring for accessibility */}
                      <div className="absolute inset-0 rounded-lg opacity-0 group-focus-visible:opacity-100 transition-opacity ring-2 ring-blue-400 ring-offset-2 pointer-events-none"></div>
                    </Link>
                  </div>
                );
              }

              // Standard Navigation Items
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`
                    relative group flex items-center px-3 py-2.5 rounded-lg transition-all text-sm
                    ${
                      active
                        ? 'bg-blue-50 text-primary font-semibold'
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 font-medium'
                    }
                  `}
                >
                  {/* Left Active Indicator Bar */}
                  {active && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary rounded-r-full" />
                  )}

                  <Icon
                    className={`w-5 h-5 mr-3 ${active ? 'text-primary' : ''}`}
                  />
                  <span className="flex-1">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-border">
            <p className="text-xs text-gray-500">Vendor Management Platform</p>
            <p className="text-xs text-gray-400 mt-1">
              v2.0 Enterprise Edition
            </p>
          </div>
        </div>
      </aside>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-gray-900/35 backdrop-blur-sm z-30 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Main Content */}
      <main className="lg:ml-64 pt-16 min-h-screen">
        <div className="p-6 lg:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
