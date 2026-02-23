'use client';

import Link from 'next/link';
import { useRouter } from 'next/router';
import {
  LayoutDashboard,
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
  Clipboard,
  FileCheck,
  Handshake,
  Building2,
  Landmark,
  CreditCard,
  ReceiptText,
  Sparkles,
  type LucideIcon,
} from 'lucide-react';
import { useState, type ReactNode } from 'react';

interface BaseNavItem {
  id: string;
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

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems: NavItem[] = [
    {
      id: 'nav-ai-ocr',
      path: '/ai-ocr',
      label: 'AI Document Upload',
      icon: Sparkles,
      badge: 'AI',
      isPrimaryAction: true,
    },
    {
      id: 'nav-dashboard',
      path: '/',
      label: 'Dashboard',
      icon: LayoutDashboard,
    },
    { type: 'divider', label: 'Planning' },
    {
      id: 'nav-engagements',
      path: '/engagements',
      label: 'Engagements',
      icon: Clipboard,
    },
    {
      id: 'nav-work-orders',
      path: '/work-orders',
      label: 'Work Orders',
      icon: FileCheck,
    },
    { type: 'divider', label: 'Execution' },
    {
      id: 'nav-vendor-engagements',
      path: '/engagements',
      label: 'Vendor Engagements',
      icon: Handshake,
    },
    { id: 'nav-invoices', path: '/invoices', label: 'Invoices', icon: Receipt },
    { type: 'divider', label: 'Directory' },
    { id: 'nav-vendors', path: '/vendors', label: 'Vendors', icon: Building2 },
    { type: 'divider', label: 'Financial' },
    {
      id: 'nav-bank-account',
      path: '/bank-account',
      label: 'Bank Account',
      icon: Landmark,
    },
    {
      id: 'nav-payment-processing',
      path: '/payment-processing',
      label: 'Payment Processing',
      icon: CreditCard,
    },
    {
      id: 'nav-account-reconciliation',
      path: '/account-reconciliation',
      label: 'Account Reconciliation',
      icon: ReceiptText,
    },
    { type: 'divider' },
    { id: 'nav-users', path: '/admin/users', label: 'Users', icon: Users },
    { id: 'nav-reports', path: '/reports', label: 'Reports', icon: BarChart3 },
    { id: 'nav-admin', path: '/admin', label: 'Admin', icon: Settings },
  ];

  const isActive = (path: string) => {
    if (path === '/') return router.pathname === '/';
    if (path === '/admin')
      return (
        router.pathname === '/admin' || router.pathname.startsWith('/admin')
      );
    return router.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="fixed top-0 left-0 right-0 h-16 bg-white border-b border-border z-30 lg:pl-64">
        <div className="flex items-center justify-between h-full px-4 lg:px-6">
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
          <div className="flex items-center gap-3">
            <button className="p-2 hover:bg-gray-100 rounded-lg relative">
              <Bell className="w-5 h-5 text-gray-600" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
            </button>
            <button className="flex items-center gap-2 p-2 hover:bg-gray-100 rounded-lg">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <UserIcon className="w-4 h-4 text-blue-600" />
              </div>
              <span className="text-sm font-medium hidden lg:block text-gray-700">
                User
              </span>
            </button>
          </div>
        </div>
      </header>

      <aside
        className={`
          fixed top-0 left-0 z-40 h-screen w-64 bg-white border-r border-border transition-transform
          ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0
        `}
      >
        <div className="h-full flex flex-col overflow-y-auto">
          <div className="h-16 flex items-center px-6 border-b border-border">
            <Link href="/" className="text-xl font-semibold text-primary">
              Intellibus
            </Link>
          </div>
          <nav className="flex-1 px-3 py-4 space-y-1">
            {navItems.map((item, index) => {
              if ('type' in item && item.type === 'divider') {
                if (item.label) {
                  return (
                    <div key={`divider-${index}`} className="pt-4 pb-2 px-3">
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        {item.label}
                      </p>
                    </div>
                  );
                }
                return (
                  <div key={`divider-${index}`} className="py-2">
                    <div className="h-px bg-gray-200" />
                  </div>
                );
              }

              const navItem = item as BaseNavItem;
              const Icon = navItem.icon;
              const active = isActive(navItem.path);

              if (navItem.isPrimaryAction) {
                return (
                  <div key={navItem.id} className="mb-4">
                    <Link
                      href={navItem.path}
                      onClick={() => setIsMobileMenuOpen(false)}
                      title="Upload vendor documents and extract structured data instantly"
                      className={`
                        relative group flex items-center px-4 py-3 rounded-lg transition-all text-sm font-semibold shadow-sm
                        ${active ? 'bg-blue-700 text-white shadow-md' : 'bg-primary text-white hover:bg-blue-700 hover:shadow-md'}
                      `}
                    >
                      <Icon className="w-5 h-5 mr-3" />
                      <span className="flex-1">{navItem.label}</span>
                      {navItem.badge && (
                        <span className="ml-2 px-2 py-0.5 text-[10px] font-bold rounded-full tracking-wide bg-blue-500 text-white">
                          {navItem.badge}
                        </span>
                      )}
                      <div className="absolute inset-0 rounded-lg opacity-0 group-focus-visible:opacity-100 transition-opacity ring-2 ring-blue-400 ring-offset-2 pointer-events-none" />
                    </Link>
                  </div>
                );
              }

              return (
                <Link
                  key={navItem.id}
                  href={navItem.path}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`
                    relative group flex items-center px-3 py-2.5 rounded-lg transition-all text-sm
                    ${active ? 'bg-blue-50 text-primary font-semibold' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 font-medium'}
                  `}
                >
                  {active && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary rounded-r-full" />
                  )}
                  <Icon
                    className={`w-5 h-5 mr-3 ${active ? 'text-primary' : ''}`}
                  />
                  <span className="flex-1">{navItem.label}</span>
                </Link>
              );
            })}
          </nav>
          <div className="px-6 py-4 border-t border-border">
            <p className="text-xs text-gray-500">Vendor Management Platform</p>
            <p className="text-xs text-gray-400 mt-1">
              v2.0 Enterprise Edition
            </p>
          </div>
        </div>
      </aside>

      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-gray-900/35 backdrop-blur-sm z-30 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      <main className="lg:ml-64 pt-16 min-h-screen">
        <div className="p-6 lg:p-8">{children}</div>
      </main>
    </div>
  );
}
