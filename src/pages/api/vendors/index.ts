/**
 * API Route — /api/vendors
 *
 * GET  → list vendors for the authenticated user's org
 * POST → create a new vendor
 *
 * No Supabase imports here — delegates to repos + auth helper.
 */
import type { NextApiRequest, NextApiResponse } from 'next';
import { getRequestContext } from '@/lib/auth/getRequestContext';
import * as vendorsRepo from '@/lib/supabase/repos/vendorsRepo';

async function resolveOrgId(req: NextApiRequest): Promise<string> {
  try {
    const ctx = await getRequestContext(req);
    return ctx.orgId;
  } catch {
    // In development, fall back to listing all vendors without org filter
    if (process.env.NODE_ENV !== 'production') {
      console.log('[/api/vendors] Auth failed in dev — using org bypass');
      return '__dev_bypass__';
    }
    throw new Error('Unauthorized');
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    if (req.method === 'GET') {
      const orgId = await resolveOrgId(req);

      const search = (req.query.search as string) || undefined;
      const status = (req.query.status as string) || undefined;

      // If dev bypass, list all vendors regardless of org
      let vendors;
      if (orgId === '__dev_bypass__') {
        vendors = await vendorsRepo.listAllVendorsDev({ search, status });
      } else {
        vendors = await vendorsRepo.listVendors(orgId, { search, status });
      }

      return res.status(200).json({ vendors });
    }

    if (req.method === 'POST') {
      const orgId = await resolveOrgId(req);
      const {
        vendor_name,
        vendor_code,
        tax_id,
        status: vendorStatus,
      } = req.body ?? {};

      if (
        !vendor_name ||
        typeof vendor_name !== 'string' ||
        !vendor_name.trim()
      ) {
        return res.status(400).json({ error: 'vendor_name is required' });
      }

      // For dev bypass, grab first org from DB
      let actualOrgId = orgId;
      if (orgId === '__dev_bypass__') {
        const firstOrg = await vendorsRepo.getFirstOrgId();
        if (!firstOrg) {
          return res
            .status(500)
            .json({ error: 'No organizations found in DB' });
        }
        actualOrgId = firstOrg;
      }

      const vendor = await vendorsRepo.createVendor({
        org_id: actualOrgId,
        vendor_name: vendor_name.trim(),
        vendor_code: vendor_code ?? undefined,
        tax_id: tax_id ?? undefined,
        status: vendorStatus ?? 'active',
      });

      return res.status(201).json({ vendor });
    }

    res.setHeader('Allow', ['GET', 'POST']);
    return res.status(405).end();
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : 'Internal server error';

    console.error('[/api/vendors] Error:', message);

    if (message === 'Unauthorized') {
      return res.status(401).json({ error: message });
    }
    if (message === 'No organization membership') {
      return res.status(403).json({ error: message });
    }

    return res.status(500).json({ error: message });
  }
}
