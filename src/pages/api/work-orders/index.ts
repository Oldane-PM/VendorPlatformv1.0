import type { NextApiRequest, NextApiResponse } from 'next';
import {
  getWorkOrders,
  createWorkOrder,
} from '../../../lib/supabase/repos/workOrders.repo';
import {
  validateWorkOrderInput,
  WorkOrderStatus,
} from '../../../lib/domain/workOrders';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // ─── GET ────────────────────────────────────────────────────────────────
  if (req.method === 'GET') {
    const { data, error } = await getWorkOrders();

    if (error) {
      return res.status(500).json({ error });
    }

    return res.status(200).json({ data });
  }

  // ─── POST ───────────────────────────────────────────────────────────────
  if (req.method === 'POST') {
    const { title, engagement_id, submission_deadline, notes } = req.body ?? {};

    // Validate input
    const validation = validateWorkOrderInput({
      title,
      engagement_id,
      submission_deadline,
    });

    if (!validation.valid) {
      return res.status(400).json({ errors: validation.errors });
    }

    // Create the work order
    const { data, error } = await createWorkOrder({
      org_id: '00000000-0000-0000-0000-000000000001',
      engagement_id,
      title,
      description: notes || null,
      submission_deadline: submission_deadline || null,
      notes: notes || null,
      status: WorkOrderStatus.Draft,
    });

    if (error) {
      return res.status(500).json({ error });
    }

    return res.status(201).json({ data });
  }

  // ─── Unsupported ────────────────────────────────────────────────────────
  res.setHeader('Allow', ['GET', 'POST']);
  res.status(405).end();
}
