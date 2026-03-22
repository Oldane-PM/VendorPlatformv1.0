/**
 * getRequestContext — resolve the authenticated user + org from a request.
 *
 * Used by API routes to obtain { userId, orgId } without exposing
 * Supabase internals to the route handler.
 *
 * Auth order:
 * 1. Better Auth session cookie (Google / app login via /api/auth)
 * 2. Supabase JWT Bearer token (legacy / service clients)
 * 3. x-user-id header (dev tooling)
 */
import type { NextApiRequest } from 'next';
import { fromNodeHeaders } from 'better-auth/node';
import { auth } from '@/lib/auth';
import { createServerClient } from '@/lib/supabase/server';

export interface RequestContext {
  userId: string;
  orgId: string;
}

async function resolveOrgForUser(
  supabase: ReturnType<typeof createServerClient>,
  userId: string
): Promise<string> {
  const { data: membership, error: memErr } = await supabase
    .from('org_members')
    .select('org_id')
    .eq('user_id', userId)
    .limit(1)
    .maybeSingle();

  if (memErr || !membership) {
    console.error(
      '[getRequestContext] org_members lookup failed:',
      memErr?.message
    );
    throw new Error('No organization membership');
  }

  return membership.org_id as string;
}

export async function getRequestContext(
  req: NextApiRequest
): Promise<RequestContext> {
  const supabase = createServerClient();

  let userId: string | undefined;

  // --- 1) Better Auth (session cookie — primary for this app) ------------
  try {
    const headers = fromNodeHeaders(req.headers);
    const session = await auth.api.getSession({ headers });
    if (session?.user?.id) {
      userId = session.user.id;
    }
  } catch (err) {
    console.error('[getRequestContext] Better Auth getSession failed:', err);
  }

  // --- 2) Supabase Bearer JWT (legacy) -----------------------------------
  if (!userId) {
    const authHeader = req.headers.authorization ?? '';
    const token = authHeader.startsWith('Bearer ')
      ? authHeader.slice(7)
      : undefined;

    if (token) {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser(token);
      if (error || !user) throw new Error('Unauthorized');
      userId = user.id;
    }
  }

  // --- 3) Dev header -------------------------------------------------------
  if (!userId) {
    const devUserId = req.headers['x-user-id'] as string | undefined;
    if (devUserId) {
      userId = devUserId;
    }
  }

  if (userId) {
    const orgId = await resolveOrgForUser(supabase, userId);
    return { userId, orgId };
  }

  // --- 3. Dev-mode fallback: auto-resolve first org ----------------
  if (process.env.NODE_ENV !== 'production') {
    console.log('[getRequestContext] No auth — trying dev bypass...');

    // Try organizations table
    const { data: org, error: orgErr } = await supabase
      .from('organizations')
      .select('id')
      .limit(1)
      .maybeSingle();

    console.log('[getRequestContext] organizations query:', {
      org,
      error: orgErr?.message,
    });

    if (org) {
      console.log('[getRequestContext] DEV bypass — org:', org.id);
      return {
        userId: '00000000-0000-0000-0000-000000000000',
        orgId: org.id as string,
      };
    }

    // Fallback: grab org_id from the vendors table
    const { data: vendorRow, error: vErr } = await supabase
      .from('vendors')
      .select('org_id')
      .limit(1)
      .maybeSingle();

    console.log('[getRequestContext] vendors fallback:', {
      vendorRow,
      error: vErr?.message,
    });

    if (vendorRow) {
      console.log(
        '[getRequestContext] DEV bypass — vendor org_id:',
        vendorRow.org_id
      );
      return {
        userId: '00000000-0000-0000-0000-000000000000',
        orgId: vendorRow.org_id as string,
      };
    }

    console.error('[getRequestContext] No org found anywhere');
  }

  throw new Error('Unauthorized');
}
