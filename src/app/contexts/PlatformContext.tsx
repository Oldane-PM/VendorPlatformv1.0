import React, { createContext, useContext, useState, ReactNode } from 'react';

/**
 * PlatformContext - Unified Data Context for Enterprise Vendor Management Platform
 * 
 * This context manages all platform data including:
 * - Vendor relationships and profiles
 * - Engagements with full lifecycle tracking
 * - RFQs, Documents, Approvals, Invoices
 * - Activity logs and audit trails
 * 
 * Note: VendorContext has been deprecated and merged into PlatformContext
 * All components should use usePlatform() hook instead of useVendors()
 */

export type EngagementStatus = 'draft' | 'under-review' | 'approved' | 'rejected' | 'active' | 'completed';
export type InvoiceStatus = 'submitted' | 'approved' | 'scheduled' | 'paid' | 'outstanding' | 'overdue';
export type ApprovalStatus = 'pending' | 'approved' | 'rejected' | 'returned';

export interface RFQ {
  id: string;
  engagementId: string;
  vendorId: string;
  vendorName: string;
  lineItems: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }>;
  subtotal: number;
  taxes: number;
  total: number;
  aiRiskFlag?: string;
  decision: 'pending' | 'selected' | 'rejected';
  reason?: string;
  submittedDate: string;
}

export interface Document {
  id: string;
  name: string;
  type: string;
  size: number;
  uploadedDate: string;
  uploadedBy: string;
  extractedData?: Record<string, any>;
  aiSummary?: string;
  missingFields?: string[];
  riskFlags?: string[];
}

export interface ApprovalStep {
  id: string;
  approverName: string;
  approverRole: string;
  status: ApprovalStatus;
  timestamp?: string;
  comments?: string;
  escalated?: boolean;
}

export interface Invoice {
  id: string;
  engagementId: string;
  invoiceNumber: string;
  vendorName: string;
  amount: number;
  dueDate: string;
  status: InvoiceStatus;
  submittedDate: string;
  approvedDate?: string;
  paidDate?: string;
  agingDays?: number;
}

export interface ActivityLogEntry {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  details: string;
  statusChange?: string;
}

export interface Engagement {
  id: string;
  title: string;
  vendorId: string;
  vendorName: string;
  department: string;
  status: EngagementStatus;
  totalValue: number;
  createdDate: string;
  lastUpdated: string;
  assignedApprover: string;
  description: string;
  rfqs: RFQ[];
  documents: Document[];
  approvalSteps: ApprovalStep[];
  invoices: Invoice[];
  activityLog: ActivityLogEntry[];
}

export interface Vendor {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  category: string;
  status: 'active' | 'inactive' | 'suspended';
  rating: number;
  riskScore: number;
  totalEngagements: number;
  totalSpent: number;
  contactPerson: string;
  taxId: string;
  joinedDate: string;
  lastEngagementDate: string;
  performanceMetrics: {
    onTimeDelivery: number;
    paymentDisputes: number;
    complianceIncidents: number;
  };
  notes: string;
}

interface PlatformContextType {
  engagements: Engagement[];
  vendors: Vendor[];
  addEngagement: (engagement: Omit<Engagement, 'id' | 'activityLog'>) => void;
  updateEngagement: (id: string, engagement: Partial<Engagement>) => void;
  deleteEngagement: (id: string) => void;
  getEngagement: (id: string) => Engagement | undefined;
  addRFQToEngagement: (engagementId: string, rfq: Omit<RFQ, 'id'>) => void;
  addDocumentToEngagement: (engagementId: string, document: Omit<Document, 'id'>) => void;
  updateApprovalStep: (engagementId: string, stepId: string, update: Partial<ApprovalStep>) => void;
  addActivityLog: (engagementId: string, entry: Omit<ActivityLogEntry, 'id'>) => void;
  getVendor: (id: string) => Vendor | undefined;
}

const PlatformContext = createContext<PlatformContextType | undefined>(undefined);

const mockVendors: Vendor[] = [
  {
    id: 'v1',
    name: 'Acme Corporation',
    email: 'contact@acme.com',
    phone: '+1 (555) 123-4567',
    address: '123 Business St, New York, NY 10001',
    category: 'Manufacturing',
    status: 'active',
    rating: 4.8,
    riskScore: 15,
    totalEngagements: 24,
    totalSpent: 1284500,
    contactPerson: 'John Smith',
    taxId: 'TX-123456',
    joinedDate: '2023-01-15',
    lastEngagementDate: '2026-02-10',
    performanceMetrics: {
      onTimeDelivery: 95,
      paymentDisputes: 2,
      complianceIncidents: 0,
    },
    notes: 'Reliable supplier with consistent quality',
  },
  {
    id: 'v2',
    name: 'Global Tech Solutions',
    email: 'info@globaltech.com',
    phone: '+1 (555) 234-5678',
    address: '456 Tech Ave, San Francisco, CA 94105',
    category: 'Technology',
    status: 'active',
    rating: 4.6,
    riskScore: 22,
    totalEngagements: 18,
    totalSpent: 956300,
    contactPerson: 'Sarah Johnson',
    taxId: 'TX-234567',
    joinedDate: '2023-03-22',
    lastEngagementDate: '2026-02-12',
    performanceMetrics: {
      onTimeDelivery: 92,
      paymentDisputes: 1,
      complianceIncidents: 1,
    },
    notes: 'Excellent for hardware and software solutions',
  },
  {
    id: 'v3',
    name: 'Prime Logistics Ltd',
    email: 'support@primelogistics.com',
    phone: '+1 (555) 345-6789',
    address: '789 Shipping Rd, Chicago, IL 60601',
    category: 'Logistics',
    status: 'active',
    rating: 4.9,
    riskScore: 8,
    totalEngagements: 32,
    totalSpent: 2412800,
    contactPerson: 'Michael Chen',
    taxId: 'TX-345678',
    joinedDate: '2022-11-08',
    lastEngagementDate: '2026-02-14',
    performanceMetrics: {
      onTimeDelivery: 98,
      paymentDisputes: 0,
      complianceIncidents: 0,
    },
    notes: 'Fast and reliable shipping partner',
  },
];

const mockEngagements: Engagement[] = [
  {
    id: 'eng-001',
    title: 'Q1 2026 Manufacturing Equipment Purchase',
    vendorId: 'v1',
    vendorName: 'Acme Corporation',
    department: 'Manufacturing',
    status: 'under-review',
    totalValue: 185000,
    createdDate: '2026-01-15',
    lastUpdated: '2026-02-10',
    assignedApprover: 'Jennifer Martinez',
    description: 'Purchase of new manufacturing equipment for production line expansion',
    rfqs: [
      {
        id: 'rfq-001-1',
        engagementId: 'eng-001',
        vendorId: 'v1',
        vendorName: 'Acme Corporation',
        lineItems: [
          { description: 'CNC Machine Model X200', quantity: 2, unitPrice: 75000, total: 150000 },
          { description: 'Installation & Training', quantity: 1, unitPrice: 15000, total: 15000 },
        ],
        subtotal: 165000,
        taxes: 13200,
        total: 178200,
        aiRiskFlag: 'None',
        decision: 'pending',
        submittedDate: '2026-01-20',
      },
    ],
    documents: [
      {
        id: 'doc-001-1',
        name: 'Equipment Specifications.pdf',
        type: 'application/pdf',
        size: 2458000,
        uploadedDate: '2026-01-16',
        uploadedBy: 'David Park',
        aiSummary: 'Technical specifications for CNC machines including dimensions, power requirements, and capabilities.',
        missingFields: [],
        riskFlags: [],
      },
    ],
    approvalSteps: [
      {
        id: 'step-001-1',
        approverName: 'David Park',
        approverRole: 'Department Manager',
        status: 'approved',
        timestamp: '2026-01-18T10:30:00Z',
        comments: 'Equipment meets our production requirements',
      },
      {
        id: 'step-001-2',
        approverName: 'Jennifer Martinez',
        approverRole: 'Finance Director',
        status: 'pending',
      },
    ],
    invoices: [],
    activityLog: [
      {
        id: 'log-001-1',
        timestamp: '2026-01-15T09:00:00Z',
        user: 'David Park',
        action: 'Created engagement',
        details: 'Initiated new equipment purchase engagement',
      },
      {
        id: 'log-001-2',
        timestamp: '2026-01-20T14:30:00Z',
        user: 'David Park',
        action: 'Submitted for approval',
        details: 'Submitted engagement for departmental review',
        statusChange: 'draft → under-review',
      },
    ],
  },
  {
    id: 'eng-002',
    title: 'IT Infrastructure Upgrade - Cloud Migration',
    vendorId: 'v2',
    vendorName: 'Global Tech Solutions',
    department: 'IT',
    status: 'approved',
    totalValue: 320000,
    createdDate: '2025-12-10',
    lastUpdated: '2026-01-25',
    assignedApprover: 'Robert Chang',
    description: 'Cloud infrastructure migration and setup for enterprise applications',
    rfqs: [
      {
        id: 'rfq-002-1',
        engagementId: 'eng-002',
        vendorId: 'v2',
        vendorName: 'Global Tech Solutions',
        lineItems: [
          { description: 'Cloud Infrastructure Setup', quantity: 1, unitPrice: 150000, total: 150000 },
          { description: 'Migration Services', quantity: 1, unitPrice: 100000, total: 100000 },
          { description: '12-Month Support Package', quantity: 1, unitPrice: 50000, total: 50000 },
        ],
        subtotal: 300000,
        taxes: 24000,
        total: 324000,
        decision: 'selected',
        submittedDate: '2025-12-15',
      },
    ],
    documents: [],
    approvalSteps: [
      {
        id: 'step-002-1',
        approverName: 'Michael Torres',
        approverRole: 'IT Director',
        status: 'approved',
        timestamp: '2025-12-20T11:15:00Z',
        comments: 'Aligned with our digital transformation strategy',
      },
      {
        id: 'step-002-2',
        approverName: 'Robert Chang',
        approverRole: 'CTO',
        status: 'approved',
        timestamp: '2026-01-25T16:45:00Z',
        comments: 'Approved for implementation',
      },
    ],
    invoices: [
      {
        id: 'inv-002-1',
        engagementId: 'eng-002',
        invoiceNumber: 'INV-2026-001',
        vendorName: 'Global Tech Solutions',
        amount: 150000,
        dueDate: '2026-03-15',
        status: 'scheduled',
        submittedDate: '2026-02-01',
        approvedDate: '2026-02-05',
        agingDays: 0,
      },
    ],
    activityLog: [
      {
        id: 'log-002-1',
        timestamp: '2025-12-10T08:00:00Z',
        user: 'Michael Torres',
        action: 'Created engagement',
        details: 'Initiated cloud migration project',
      },
      {
        id: 'log-002-2',
        timestamp: '2026-01-25T16:45:00Z',
        user: 'Robert Chang',
        action: 'Approved engagement',
        details: 'Final approval granted',
        statusChange: 'under-review → approved',
      },
    ],
  },
  {
    id: 'eng-003',
    title: 'Logistics Services - Annual Contract Renewal',
    vendorId: 'v3',
    vendorName: 'Prime Logistics Ltd',
    department: 'Operations',
    status: 'active',
    totalValue: 480000,
    createdDate: '2025-11-20',
    lastUpdated: '2026-02-01',
    assignedApprover: 'Lisa Anderson',
    description: 'Annual logistics and shipping services contract renewal',
    rfqs: [],
    documents: [],
    approvalSteps: [
      {
        id: 'step-003-1',
        approverName: 'Lisa Anderson',
        approverRole: 'Operations Director',
        status: 'approved',
        timestamp: '2025-12-05T10:00:00Z',
        comments: 'Excellent track record, approved for renewal',
      },
    ],
    invoices: [
      {
        id: 'inv-003-1',
        engagementId: 'eng-003',
        invoiceNumber: 'INV-2026-002',
        vendorName: 'Prime Logistics Ltd',
        amount: 40000,
        dueDate: '2026-02-28',
        status: 'paid',
        submittedDate: '2026-01-15',
        approvedDate: '2026-01-20',
        paidDate: '2026-01-28',
        agingDays: 0,
      },
      {
        id: 'inv-003-2',
        engagementId: 'eng-003',
        invoiceNumber: 'INV-2026-003',
        vendorName: 'Prime Logistics Ltd',
        amount: 40000,
        dueDate: '2026-03-31',
        status: 'approved',
        submittedDate: '2026-02-12',
        approvedDate: '2026-02-14',
        agingDays: 0,
      },
    ],
    activityLog: [
      {
        id: 'log-003-1',
        timestamp: '2025-11-20T09:30:00Z',
        user: 'Lisa Anderson',
        action: 'Created engagement',
        details: 'Initiated annual contract renewal',
      },
      {
        id: 'log-003-2',
        timestamp: '2025-12-05T10:00:00Z',
        user: 'Lisa Anderson',
        action: 'Approved engagement',
        details: 'Contract renewal approved',
        statusChange: 'under-review → active',
      },
    ],
  },
];

export function PlatformProvider({ children }: { children: ReactNode }) {
  const [engagements, setEngagements] = useState<Engagement[]>(mockEngagements);
  const [vendors] = useState<Vendor[]>(mockVendors);

  const addEngagement = (engagement: Omit<Engagement, 'id' | 'activityLog'>) => {
    const newEngagement: Engagement = {
      ...engagement,
      id: `eng-${Date.now()}`,
      activityLog: [
        {
          id: `log-${Date.now()}`,
          timestamp: new Date().toISOString(),
          user: 'Current User',
          action: 'Created engagement',
          details: 'Initiated new engagement',
        },
      ],
    };
    setEngagements((prev) => [newEngagement, ...prev]);
  };

  const updateEngagement = (id: string, updatedEngagement: Partial<Engagement>) => {
    setEngagements((prev) =>
      prev.map((eng) =>
        eng.id === id ? { ...eng, ...updatedEngagement, lastUpdated: new Date().toISOString().split('T')[0] } : eng
      )
    );
  };

  const deleteEngagement = (id: string) => {
    setEngagements((prev) => prev.filter((eng) => eng.id !== id));
  };

  const getEngagement = (id: string) => {
    return engagements.find((eng) => eng.id === id);
  };

  const addRFQToEngagement = (engagementId: string, rfq: Omit<RFQ, 'id'>) => {
    setEngagements((prev) =>
      prev.map((eng) =>
        eng.id === engagementId
          ? {
              ...eng,
              rfqs: [...eng.rfqs, { ...rfq, id: `rfq-${Date.now()}` }],
            }
          : eng
      )
    );
  };

  const addDocumentToEngagement = (engagementId: string, document: Omit<Document, 'id'>) => {
    setEngagements((prev) =>
      prev.map((eng) =>
        eng.id === engagementId
          ? {
              ...eng,
              documents: [...eng.documents, { ...document, id: `doc-${Date.now()}` }],
            }
          : eng
      )
    );
  };

  const updateApprovalStep = (engagementId: string, stepId: string, update: Partial<ApprovalStep>) => {
    setEngagements((prev) =>
      prev.map((eng) =>
        eng.id === engagementId
          ? {
              ...eng,
              approvalSteps: eng.approvalSteps.map((step) =>
                step.id === stepId ? { ...step, ...update } : step
              ),
            }
          : eng
      )
    );
  };

  const addActivityLog = (engagementId: string, entry: Omit<ActivityLogEntry, 'id'>) => {
    setEngagements((prev) =>
      prev.map((eng) =>
        eng.id === engagementId
          ? {
              ...eng,
              activityLog: [...eng.activityLog, { ...entry, id: `log-${Date.now()}` }],
            }
          : eng
      )
    );
  };

  const getVendor = (id: string) => {
    return vendors.find((v) => v.id === id);
  };

  return (
    <PlatformContext.Provider
      value={{
        engagements,
        vendors,
        addEngagement,
        updateEngagement,
        deleteEngagement,
        getEngagement,
        addRFQToEngagement,
        addDocumentToEngagement,
        updateApprovalStep,
        addActivityLog,
        getVendor,
      }}
    >
      {children}
    </PlatformContext.Provider>
  );
}

export function usePlatform() {
  const context = useContext(PlatformContext);
  if (context === undefined) {
    throw new Error('usePlatform must be used within a PlatformProvider');
  }
  return context;
}