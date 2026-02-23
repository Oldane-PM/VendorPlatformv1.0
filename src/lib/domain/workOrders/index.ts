/**
 * Work Orders – domain types, validation, and helpers.
 */

// ─── Status Enum ────────────────────────────────────────────────────────────
export enum WorkOrderStatus {
  Draft = 'Draft',
  Open = 'Open',
  InProgress = 'In Progress',
  Completed = 'Completed',
  Awarded = 'Awarded',
}

// ─── Entity ─────────────────────────────────────────────────────────────────
export interface WorkOrder {
  id: string;
  work_order_number: string;
  engagement_id: string;
  title: string;
  description: string;
  status: WorkOrderStatus;
  created_at: string;
  created_by: string;
}

// ─── Create Input ───────────────────────────────────────────────────────────
export interface CreateWorkOrderInput {
  title: string;
  engagement_id: string;
  description: string;
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

  if (!input.description || input.description.trim().length === 0) {
    errors.push('Description is required.');
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
