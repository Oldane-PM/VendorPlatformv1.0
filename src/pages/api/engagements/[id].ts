import type { NextApiRequest, NextApiResponse } from 'next';
import { getEngagementById } from '../../../lib/supabase/repos/engagements.repo';

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const id = req.query.id as string;

  if (!id || typeof id !== 'string') {
    return res
      .status(400)
      .json({ data: null, error: 'Engagement ID is required.' });
  }

  if (!UUID_RE.test(id)) {
    return res
      .status(400)
      .json({
        data: null,
        error: `Invalid engagement ID format: "${id}". Expected a UUID.`,
      });
  }

  // ─── GET ────────────────────────────────────────────────────────────────
  if (req.method === 'GET') {
    const { data, error } = await getEngagementById(id);

    if (error) {
      return res.status(500).json({ data: null, error });
    }

    if (!data) {
      return res
        .status(404)
        .json({ data: null, error: 'Engagement not found.' });
    }

    return res.status(200).json({ data, error: null });
  }

  // ─── Unsupported ────────────────────────────────────────────────────────
  res.setHeader('Allow', ['GET']);
  res.status(405).end();
}
