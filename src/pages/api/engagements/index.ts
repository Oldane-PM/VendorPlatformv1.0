import type { NextApiRequest, NextApiResponse } from 'next';
import {
  listEngagements,
  createEngagement,
  updateEngagement,
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
    const { title, description, project_impact, status } = req.body ?? {};

    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return res.status(400).json({ data: null, error: 'Title is required.' });
    }

    const { data, error } = await createEngagement({
      title: title.trim(),
      description: description?.trim() ?? undefined,
      project_impact: project_impact ?? 'Medium',
      status: status ?? 'active',
    });

    if (error) {
      return res.status(500).json({ data: null, error });
    }

    return res.status(201).json({ data, error: null });
  }

  // ─── PATCH ──────────────────────────────────────────────────────────────
  if (req.method === 'PATCH') {
    const { id, title, description, project_impact, status } = req.body ?? {};

    if (!id || typeof id !== 'string') {
      return res
        .status(400)
        .json({ data: null, error: 'Engagement ID is required.' });
    }

    const { data, error } = await updateEngagement(id, {
      title: title?.trim(),
      description: description?.trim(),
      project_impact,
      status,
    });

    if (error) {
      return res.status(500).json({ data: null, error });
    }

    return res.status(200).json({ data, error: null });
  }

  // ─── Unsupported ────────────────────────────────────────────────────────
  res.setHeader('Allow', ['GET', 'POST', 'PATCH']);
  res.status(405).end();
}
