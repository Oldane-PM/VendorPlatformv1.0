/**
 * getRequestContext — resolve the authenticated user + org from a request.
 *
 * Used by API routes to obtain { userId, orgId } without exposing
 * Supabase internals to the route handler.
 */
import type { NextApiRequest } from 'next';
import { createServerClient } from '@/lib/supabase/server';

export interface RequestContext {
  userId: string;
  orgId: string;
}

export async function getRequestContext(
  req: NextApiRequest
): Promise<RequestContext> {
  const supabase = createServerClient();

  // --- 1. Resolve user from Authorization header or cookie ---------
  const authHeader = req.headers.authorization ?? '';
  const token = authHeader.startsWith('Bearer ')
    ? authHeader.slice(7)
    : undefined;

  let userId: string | undefined;

  if (token) {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token);
    if (error || !user) throw new Error('Unauthorized');
    userId = user.id;
  } else {
    const devUserId = req.headers['x-user-id'] as string | undefined;
    if (devUserId) {
      userId = devUserId;
    }
  }

  // --- 2. Resolve org membership -----------------------------------
  if (userId) {
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

    return { userId, orgId: membership.org_id as string };
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
      return { userId: 'dev-user', orgId: org.id as string };
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
      return { userId: 'dev-user', orgId: vendorRow.org_id as string };
    }

    console.error('[getRequestContext] No org found anywhere');
  }

  throw new Error('Unauthorized');
}
