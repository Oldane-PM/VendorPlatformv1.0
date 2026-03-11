import { betterAuth } from 'better-auth';
import { createAuthMiddleware, APIError } from 'better-auth/api';
import { createServerClient } from '@/lib/supabase/server';
import { supabaseAdapter } from '@/lib/auth/supabase-adapter';

// ---------------------------------------------------------------------------
// Shared helper: check if an email is authorized
// ---------------------------------------------------------------------------
const ALLOWED_DOMAIN = '@intellibus.com';

/**
 * Returns true when the email belongs to an authorised user:
 *  1. The email domain is @intellibus.com  → instant allow
 *  2. The email exists in the `authorized_users` table with status = 'active'
 */
async function isAuthorizedEmail(email: string): Promise<boolean> {
  // 1. Domain check
  if (email.toLowerCase().endsWith(ALLOWED_DOMAIN)) {
    return true;
  }

  // 2. Whitelist check via Supabase (service-role — bypasses RLS)
  try {
    const supabase = createServerClient();
    const { data, error } = await supabase
      .from('authorized_users')
      .select('id')
      .eq('email', email.toLowerCase())
      .eq('status', 'active')
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('[auth] authorized_users lookup failed:', error.message);
      return false;
    }

    return !!data;
  } catch (err) {
    console.error('[auth] authorized_users query error:', err);
    return false;
  }
}

// ---------------------------------------------------------------------------
// Better-Auth server instance
// ---------------------------------------------------------------------------
export const auth = betterAuth({
  database: supabaseAdapter(),

  advanced: {
    // Force Better-Auth to use a new cookie name ('vp') instead of 'better-auth'.
    // DO NOT REMOVE THIS: This completely bypasses the corrupted base64 cookie
    // stuck in the browser, permanently fixing the "Invalid Base64" 500 error.
    cookiePrefix: 'vp',
  },

  // -- Base path ----------------------------------------------------------------
  basePath: '/api/auth',

  // -- Social providers ---------------------------------------------------------
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
  },

  // -- Trusted origins ----------------------------------------------------------
  trustedOrigins: [process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'],

  // ---------------------------------------------------------------------------
  // HOOKS — Before middleware (catches email / password & social entry points)
  // ---------------------------------------------------------------------------
  hooks: {
    before: createAuthMiddleware(async (ctx) => {
      // Intercept email-based sign-up & sign-in
      const emailPaths = ['/sign-up/email', '/sign-in/email'];
      if (emailPaths.includes(ctx.path)) {
        const email: string | undefined = ctx.body?.email;
        if (email && !(await isAuthorizedEmail(email))) {
          throw new APIError('FORBIDDEN', {
            message:
              'Access is restricted to authorized Intellibus users only.',
          });
        }
      }
    }),
  },

  // ---------------------------------------------------------------------------
  // DATABASE HOOKS — definitive gate for ALL user creation (including OAuth)
  // ---------------------------------------------------------------------------
  databaseHooks: {
    user: {
      create: {
        before: async (user) => {
          const email: string | undefined = user.email;
          if (!email) {
            throw new APIError('FORBIDDEN', {
              message:
                'Access is restricted to authorized Intellibus users only.',
            });
          }

          const allowed = await isAuthorizedEmail(email);
          if (!allowed) {
            throw new APIError('FORBIDDEN', {
              message:
                'Access is restricted to authorized Intellibus users only.',
            });
          }

          // Allow user creation
          return { data: user };
        },
      },
    },
  },
});
