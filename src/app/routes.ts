import { createBrowserRouter } from 'react-router';
import { Layout } from './components/Layout';
import { GlobalDashboard } from './pages/GlobalDashboard';
import { EngagementsPage } from './pages/EngagementsPage';
import { EngagementList } from './pages/EngagementList';
import { EngagementDetail } from './pages/EngagementDetail';
import { VendorEngagementDetail } from './pages/VendorEngagementDetail';
import { WorkOrdersPage } from './pages/WorkOrdersPage';
import { WorkOrderDetailPage } from './pages/RFQDetailPage';
import { Vendors } from './pages/Vendors';
import { VendorProfile } from './pages/VendorProfile';
import { AddVendor } from './pages/AddVendor';
import { EditVendor } from './pages/EditVendor';
import { InvoicesPage } from './pages/InvoicesPage';
import { InvoiceDetailPage } from './pages/InvoiceDetailPage';
import { AdminPage } from './pages/OtherPages';
import { MonthlyReportsPage } from './pages/MonthlyReportsPage';
import { UsersPage } from './pages/UsersPage';
import { OCRExtraction } from './pages/OCRExtraction';
import { BankAccountPage } from './pages/BankAccountPage';
import { PaymentProcessingPage } from './pages/PaymentProcessingPage';
import { AccountReconciliationPage } from './pages/AccountReconciliationPage';
import { NotFound } from './pages/NotFound';

// Routes configuration - Updated to use PlatformContext only
export const router = createBrowserRouter([
  {
    path: '/',
    Component: Layout,
    children: [
      { index: true, Component: GlobalDashboard },
      { path: 'ai-ocr', Component: OCRExtraction },
      { path: 'sourcing', Component: EngagementsPage },
      { path: 'sourcing/:id', Component: EngagementDetail },
      { path: 'engagements', Component: EngagementList },
      { path: 'engagements/:id', Component: VendorEngagementDetail },
      { path: 'work-orders', Component: WorkOrdersPage },
      { path: 'work-orders/:id', Component: WorkOrderDetailPage },
      { path: 'invoices', Component: InvoicesPage },
      { path: 'invoices/:id', Component: InvoiceDetailPage },
      { path: 'vendors', Component: Vendors },
      { path: 'vendors/add', Component: AddVendor },
      { path: 'vendors/:id', Component: VendorProfile },
      { path: 'vendors/:id/edit', Component: EditVendor },
      { path: 'bank-account', Component: BankAccountPage },
      { path: 'payment-processing', Component: PaymentProcessingPage },
      { path: 'account-reconciliation', Component: AccountReconciliationPage },
      { path: 'users', Component: UsersPage },
      { path: 'reports', Component: MonthlyReportsPage },
      { path: 'admin', Component: AdminPage },
      { path: '*', Component: NotFound },
    ],
  },
]);