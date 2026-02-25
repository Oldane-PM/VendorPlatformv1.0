/**
 * Work Orders – domain types, validation, and helpers.
 */

// ─── Status Enum ────────────────────────────────────────────────────────────
export enum WorkOrderStatus {
  Draft = 'draft',
  Open = 'open',
  InProgress = 'in_progress',
  Completed = 'completed',
  Awarded = 'awarded',
}

// ─── Entity ─────────────────────────────────────────────────────────────────
export interface WorkOrder {
  id: string;
  work_order_number: string;
  engagement_id: string;
  title: string;
  description: string | null;
  submission_deadline: string | null;
  notes: string | null;
  status: WorkOrderStatus;
  created_at: string;
  created_by: string;
}

// ─── Create Input ───────────────────────────────────────────────────────────
export interface CreateWorkOrderInput {
  title: string;
  engagement_id: string;
  submission_deadline: string;
  notes?: string;
}

// ─── Validation ─────────────────────────────────────────────────────────────
export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export function validateWorkOrderInput(
  input: Partial<CreateWorkOrderInput>
): ValidationResult {
  const errors: string[] = [];

  if (!input.title || input.title.trim().length === 0) {
    errors.push('Title is required.');
  }

  if (!input.engagement_id || input.engagement_id.trim().length === 0) {
    errors.push('Engagement ID is required.');
  }

  if (
    !input.submission_deadline ||
    input.submission_deadline.trim().length === 0
  ) {
    errors.push('Submission deadline is required.');
  }

  return { valid: errors.length === 0, errors };
}

// ─── Work Order Number Generator ────────────────────────────────────────────
/**
 * Generates a sequential work order number in the format WO-XXXX.
 * @param currentCount – the number of existing work orders in the database.
 */
export function generateWorkOrderNumber(currentCount: number): string {
  const next = currentCount + 1;
  return `WO-${String(next).padStart(4, '0')}`;
}
