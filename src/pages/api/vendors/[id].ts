/**
 * API Route — /api/vendors/[id]
 *
 * GET → fetch a single vendor by ID
 */
import type { NextApiRequest, NextApiResponse } from 'next';
import * as vendorsRepo from '@/lib/supabase/repos/vendorsRepo';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { id } = req.query;

  if (typeof id !== 'string') {
    return res.status(400).json({ error: 'Missing vendor id' });
  }

  try {
    if (req.method === 'GET') {
      const vendor = await vendorsRepo.getVendorById(id);

      if (!vendor) {
        return res.status(404).json({ error: 'Vendor not found' });
      }

      return res.status(200).json({ vendor });
    }

    res.setHeader('Allow', ['GET']);
    return res.status(405).end();
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : 'Internal server error';
    console.error(`[/api/vendors/${id}]`, message);
    return res.status(500).json({ error: message });
  }
}
