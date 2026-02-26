/**
 * API Route — /api/invoices
 *
 * GET  → list invoices from DB (with vendor name + engagement title)
 */
import type { NextApiRequest, NextApiResponse } from 'next';
import * as invoicesRepo from '@/lib/supabase/repos/invoices.repo';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    if (req.method === 'GET') {
      const invoices = await invoicesRepo.listInvoices();
      return res.status(200).json({ data: invoices });
    }

    res.setHeader('Allow', ['GET']);
    return res.status(405).end();
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : 'Internal server error';
    console.error('[/api/invoices]', message);
    return res.status(500).json({ error: message });
  }
}
