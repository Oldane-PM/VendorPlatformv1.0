/**
 * Supabase server client (for API routes / server components).
 *
 * Uses the service-role key so API routes have full access to the database.
 */
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export function createServerClient() {
  return createClient(supabaseUrl, supabaseServiceRoleKey);
}
