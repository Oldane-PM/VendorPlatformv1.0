import { useState, useEffect } from 'react';
import { Loader2, CalendarIcon } from 'lucide-react';
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
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Select Engagement <span className="text-red-500">*</span>
            </label>
            <select
              value={engagementId}
              onChange={(e) => setEngagementId(e.target.value)}
              disabled={isSubmitting}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent appearance-none bg-white"
            >
              <option value="">Select an engagement...</option>
              {engagements.map((eng) => (
                <option key={eng.id} value={eng.id}>
                  ENG-{String(eng.engagement_number).padStart(4, '0')} —{' '}
                  {eng.title}
                </option>
              ))}
            </select>
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
