import { cn } from './ui/utils';

type StatusType =
  | 'draft'
  | 'under-review'
  | 'approved'
  | 'rejected'
  | 'pending'
  | 'paid'
  | 'outstanding'
  | 'overdue'
  | 'active'
  | 'inactive'
  | 'suspended'
  | 'open'
  | 'closed'
  | 'completed'
  | 'returned'
  | 'selected';

interface StatusBadgeProps {
  status: StatusType;
  className?: string;
}

const statusConfig: Record<
  StatusType,
  { bg: string; text: string; label: string }
> = {
  draft: { bg: 'bg-slate-100', text: 'text-slate-700', label: 'Draft' },
  'under-review': { bg: 'bg-amber-100', text: 'text-amber-700', label: 'Under Review' },
  approved: { bg: 'bg-green-100', text: 'text-green-700', label: 'Approved' },
  rejected: { bg: 'bg-red-100', text: 'text-red-700', label: 'Rejected' },
  pending: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Pending' },
  paid: { bg: 'bg-green-100', text: 'text-green-700', label: 'Paid' },
  outstanding: { bg: 'bg-orange-100', text: 'text-orange-700', label: 'Outstanding' },
  overdue: { bg: 'bg-red-100', text: 'text-red-700', label: 'Overdue' },
  active: { bg: 'bg-green-100', text: 'text-green-700', label: 'Active' },
  inactive: { bg: 'bg-gray-100', text: 'text-gray-700', label: 'Inactive' },
  suspended: { bg: 'bg-red-100', text: 'text-red-700', label: 'Suspended' },
  open: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Open' },
  closed: { bg: 'bg-gray-100', text: 'text-gray-700', label: 'Closed' },
  completed: { bg: 'bg-green-100', text: 'text-green-700', label: 'Completed' },
  returned: { bg: 'bg-purple-100', text: 'text-purple-700', label: 'Returned' },
  selected: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Selected' },
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status] || statusConfig.draft;

  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
        config.bg,
        config.text,
        className
      )}
    >
      {config.label}
    </span>
  );
}