import type { NextApiRequest, NextApiResponse } from 'next';
import {
  listEngagements,
  createEngagement,
} from '../../../lib/supabase/repos/engagements.repo';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // ─── GET ────────────────────────────────────────────────────────────────
  if (req.method === 'GET') {
    const { data, error } = await listEngagements();

    if (error) {
      return res.status(500).json({ data: null, error });
    }

    return res.status(200).json({ data, error: null });
  }

  // ─── POST ───────────────────────────────────────────────────────────────
  if (req.method === 'POST') {
    const { title, description, department, budget, status } = req.body ?? {};

    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return res.status(400).json({ data: null, error: 'Title is required.' });
    }

    const { data, error } = await createEngagement({
      title: title.trim(),
      description: description?.trim() ?? undefined,
      department: department?.trim() ?? undefined,
      budget: budget != null ? Number(budget) : undefined,
      status: status ?? 'Draft',
    });

    if (error) {
      return res.status(500).json({ data: null, error });
    }

    return res.status(201).json({ data, error: null });
  }

  // ─── Unsupported ────────────────────────────────────────────────────────
  res.setHeader('Allow', ['GET', 'POST']);
  res.status(405).end();
}
