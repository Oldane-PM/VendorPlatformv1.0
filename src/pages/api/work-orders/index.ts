import type { NextApiRequest, NextApiResponse } from 'next';
import {
  getWorkOrders,
  createWorkOrder,
  getWorkOrderCount,
} from '../../../lib/supabase/repos/workOrders.repo';
import {
  validateWorkOrderInput,
  generateWorkOrderNumber,
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
    const { title, engagement_id, description } = req.body ?? {};

    // Validate input
    const validation = validateWorkOrderInput({
      title,
      engagement_id,
      description,
    });

    if (!validation.valid) {
      return res.status(400).json({ errors: validation.errors });
    }

    // Generate work order number
    const { count, error: countError } = await getWorkOrderCount();

    if (countError) {
      return res.status(500).json({ error: countError });
    }

    const workOrderNumber = generateWorkOrderNumber(count);

    // Create the work order
    const { data, error } = await createWorkOrder({
      work_order_number: workOrderNumber,
      engagement_id,
      title,
      description,
      status: WorkOrderStatus.Draft,
      created_by: '00000000-0000-0000-0000-000000000000', // placeholder – replace with auth user id
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
