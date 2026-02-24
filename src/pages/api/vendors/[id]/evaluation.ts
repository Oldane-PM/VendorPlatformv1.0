/**
 * API Route — /api/vendors/[id]/evaluation
 *
 * GET → fetch the vendor's evaluation
 * PUT → upsert the vendor's evaluation
 */
import type { NextApiRequest, NextApiResponse } from 'next';
import { getRequestContext } from '@/lib/auth/getRequestContext';
import * as vendorEvaluationsRepo from '@/lib/supabase/repos/vendorEvaluationsRepo';
import * as vendorsRepo from '@/lib/supabase/repos/vendorsRepo';

async function resolveContext(req: NextApiRequest) {
  try {
    const ctx = await getRequestContext(req);
    return { orgId: ctx.orgId, userId: ctx.userId ?? null };
  } catch {
    if (process.env.NODE_ENV !== 'production') {
      console.log(
        '[/api/vendors/[id]/evaluation] Auth failed in dev — using org bypass'
      );
      const firstOrg = await vendorsRepo.getFirstOrgId();
      return { orgId: firstOrg ?? '__dev_bypass__', userId: null };
    }
    throw new Error('Unauthorized');
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { id } = req.query;

  if (typeof id !== 'string') {
    return res.status(400).json({ error: 'Missing vendor id' });
  }

  try {
    const { orgId, userId } = await resolveContext(req);

    if (req.method === 'GET') {
      let evaluation;
      if (orgId === '__dev_bypass__') {
        evaluation = await vendorEvaluationsRepo.getByVendorDev(id);
      } else {
        evaluation = await vendorEvaluationsRepo.getByVendor(orgId, id);
      }
      return res.status(200).json({ evaluation });
    }

    if (req.method === 'PUT') {
      const {
        delivery_timeliness,
        quality_of_work,
        budget_adherence,
        communication_responsiveness,
        compliance_documentation,
        grading_mode,
        notes,
      } = req.body ?? {};

      // Validate required fields
      const stars = [
        delivery_timeliness,
        quality_of_work,
        budget_adherence,
        communication_responsiveness,
        compliance_documentation,
      ];

      for (const s of stars) {
        if (
          s === undefined ||
          s === null ||
          !Number.isInteger(s) ||
          s < 1 ||
          s > 5
        ) {
          return res.status(400).json({
            error:
              'All star ratings are required and must be integers between 1 and 5',
          });
        }
      }

      // Resolve actual org_id for upsert
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

      const evaluation = await vendorEvaluationsRepo.upsert(
        actualOrgId,
        id,
        userId,
        {
          delivery_timeliness,
          quality_of_work,
          budget_adherence,
          communication_responsiveness,
          compliance_documentation,
          grading_mode,
          notes,
        }
      );

      return res.status(200).json({ evaluation });
    }

    res.setHeader('Allow', ['GET', 'PUT']);
    return res.status(405).end();
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : 'Internal server error';
    console.error(`[/api/vendors/${id}/evaluation]`, message);

    if (message === 'Unauthorized') {
      return res.status(401).json({ error: message });
    }

    return res.status(500).json({ error: message });
  }
}
