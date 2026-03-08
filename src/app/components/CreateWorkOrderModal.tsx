import { useState, useEffect, useRef } from 'react';
import {
  Loader2,
  CalendarIcon,
  ChevronDown,
  Search,
  Check,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from './ui/dialog';

interface Engagement {
  id: string;
  engagement_number: number;
  title: string;
  status: string;
}

interface CreateWorkOrderModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
}

export function CreateWorkOrderModal({
  open,
  onOpenChange,
  onCreated,
}: CreateWorkOrderModalProps) {
  const [nextWoNumber, setNextWoNumber] = useState('');
  const [engagements, setEngagements] = useState<Engagement[]>([]);
  const [engagementId, setEngagementId] = useState('');
  const [title, setTitle] = useState('');
  const [submissionDeadline, setSubmissionDeadline] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Custom Dropdown State
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch next WO number and engagements when modal opens
  useEffect(() => {
    if (!open) return;

    // Fetch next WO number
    fetch('/api/work-orders/next-number')
      .then((res) => res.json())
      .then((data) => setNextWoNumber(data.nextNumber ?? 'WO-0001'))
      .catch(() => setNextWoNumber('WO-0001'));

    // Fetch engagements for dropdown
    fetch('/api/engagements')
      .then((res) => res.json())
      .then((data) => setEngagements(data.data ?? []))
      .catch(() => setEngagements([]));
  }, [open]);

  const resetForm = () => {
    setEngagementId('');
    setTitle('');
    setSubmissionDeadline('');
    setNotes('');
    setError(null);
  };

  const handleClose = () => {
    if (!isSubmitting) {
      resetForm();
      onOpenChange(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const res = await fetch('/api/work-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          engagement_id: engagementId,
          submission_deadline: submissionDeadline || null,
          notes: notes.trim() || null,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        const msg =
          body.errors?.join(', ') ||
          body.error ||
          'Failed to create work order.';
        setError(msg);
        return;
      }

      resetForm();
      onOpenChange(false);
      onCreated();
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isValid =
    title.trim().length > 0 &&
    engagementId.length > 0 &&
    submissionDeadline.length > 0;

  const filteredEngagements = engagements.filter((eng: Engagement) => {
    const searchLower = searchQuery.toLowerCase();
    const idString =
      `ENG-${String(eng.engagement_number).padStart(4, '0')}`.toLowerCase();
    const titleLower = eng.title.toLowerCase();
    return idString.includes(searchLower) || titleLower.includes(searchLower);
  });

  const selectedEngagement = engagements.find((e) => e.id === engagementId);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Create New Work Order</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 mt-2">
          {/* Work Order ID — auto-generated, read-only */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Work Order ID
            </label>
            <input
              type="text"
              value={nextWoNumber}
              readOnly
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm bg-gray-50 text-gray-600 cursor-not-allowed"
            />
            <p className="text-xs text-blue-600 mt-1">
              Auto-generated incremental ID
            </p>
          </div>

          {/* Select Engagement */}
          <div className="relative" ref={dropdownRef}>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Select Engagement <span className="text-red-500">*</span>
            </label>
            <div
              className={`relative w-full ${isSubmitting ? 'opacity-50 pointer-events-none' : ''}`}
            >
              <button
                type="button"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center justify-between w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm bg-white text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-left"
              >
                <span
                  className={`block truncate ${!selectedEngagement ? 'text-gray-500' : ''}`}
                >
                  {selectedEngagement
                    ? `ENG-${String(selectedEngagement.engagement_number).padStart(4, '0')} — ${selectedEngagement.title}`
                    : 'Select an engagement...'}
                </span>
                <ChevronDown className="w-4 h-4 text-gray-400 ml-2 flex-shrink-0" />
              </button>

              {isDropdownOpen && (
                <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg py-1">
                  <div className="px-2 pb-2 pt-1 border-b border-gray-100">
                    <div className="relative">
                      <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search engagements..."
                        value={searchQuery}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setSearchQuery(e.target.value)
                        }
                        className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:border-primary"
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                  </div>
                  <div className="max-h-60 overflow-y-auto overflow-x-hidden pt-1">
                    {filteredEngagements.map((eng) => (
                      <button
                        key={eng.id}
                        type="button"
                        onClick={() => {
                          setEngagementId(eng.id);
                          setIsDropdownOpen(false);
                          setSearchQuery('');
                        }}
                        className={`w-full text-left px-3 py-2.5 text-sm hover:bg-gray-50 flex items-center justify-between ${
                          engagementId === eng.id
                            ? 'bg-blue-50/50 text-blue-700 font-medium'
                            : 'text-gray-700'
                        }`}
                      >
                        <span className="truncate pr-4">
                          <span className="font-mono text-xs mr-2 text-gray-500">
                            ENG-{String(eng.engagement_number).padStart(4, '0')}
                          </span>
                          {eng.title}
                        </span>
                        {engagementId === eng.id && (
                          <Check className="w-4 h-4 text-blue-600 flex-shrink-0" />
                        )}
                      </button>
                    ))}
                    {filteredEngagements.length === 0 && (
                      <div className="px-4 py-3 text-sm text-gray-500 text-center">
                        No engagements found
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            <p className="text-xs text-blue-600 mt-1">
              Only open engagements are shown
            </p>
          </div>

          {/* Work Order Title */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Work Order Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter work order title"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              disabled={isSubmitting}
            />
          </div>

          {/* Submission Deadline */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Submission Deadline <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="date"
                value={submissionDeadline}
                onChange={(e) => setSubmissionDeadline(e.target.value)}
                placeholder="dd/mm/yyyy"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                disabled={isSubmitting}
              />
            </div>
          </div>

          {/* Notes / Scope Clarification */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Notes / Scope Clarification
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add additional notes or scope clarification..."
              rows={4}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
              disabled={isSubmitting}
            />
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Footer */}
          <DialogFooter className="pt-2">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="px-5 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!isValid || isSubmitting}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-semibold shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {isSubmitting ? 'Creating…' : 'Create Work Order'}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
