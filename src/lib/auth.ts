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
// Better-Auth server instance — public URL / trusted origins
// ---------------------------------------------------------------------------
/**
 * Normalize to origin only (scheme + host + port).
 * `new URL(...).origin` drops paths, so BETTER_AUTH_URL may be set with or without `/api/auth`;
 * Better Auth still appends basePath `/api/auth` internally — do not put `/api/auth` in env on purpose.
 */
function normalizeOrigin(raw: string | undefined): string | null {
  if (!raw?.trim()) return null;
  try {
    return new URL(raw.trim()).origin;
  } catch {
    return null;
  }
}

/**
 * Single canonical base URL for OAuth redirects and cookie scope.
 * On Railway, set BETTER_AUTH_URL or NEXT_PUBLIC_APP_URL, or rely on RAILWAY_PUBLIC_DOMAIN.
 * If none match the browser origin, Better Auth returns 401 on /api/auth/* (origin check).
 */
function resolvePublicBaseUrl(): string {
  const candidates = [
    process.env.BETTER_AUTH_URL,
    process.env.NEXT_PUBLIC_APP_URL,
    process.env.RAILWAY_PUBLIC_DOMAIN
      ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`
      : undefined,
  ];
  for (const c of candidates) {
    const o = normalizeOrigin(c);
    if (o) return o;
  }
  return 'http://localhost:3000';
}

function collectTrustedOrigins(base: string): string[] {
  const set = new Set<string>();
  const add = (raw?: string) => {
    const o = normalizeOrigin(raw);
    if (o) set.add(o);
  };
  add(process.env.BETTER_AUTH_URL);
  add(process.env.NEXT_PUBLIC_APP_URL);
  add(base);
  if (process.env.RAILWAY_PUBLIC_DOMAIN) {
    add(`https://${process.env.RAILWAY_PUBLIC_DOMAIN}`);
  }
  if (process.env.BETTER_AUTH_TRUSTED_ORIGINS) {
    for (const part of process.env.BETTER_AUTH_TRUSTED_ORIGINS.split(',')) {
      add(part.trim());
    }
  }
  if (set.size === 0) set.add('http://localhost:3000');
  return [...set];
}

const publicBaseUrl = resolvePublicBaseUrl();
const trustedOriginList = collectTrustedOrigins(publicBaseUrl);

if (
  process.env.NODE_ENV === 'production' &&
  publicBaseUrl.includes('localhost')
) {
  console.warn(
    '[auth] Production is using localhost as base URL. Set BETTER_AUTH_URL, NEXT_PUBLIC_APP_URL, or deploy on Railway with RAILWAY_PUBLIC_DOMAIN — otherwise /api/auth may return 401.'
  );
}

export const auth = betterAuth({
  database: supabaseAdapter(),

  // Canonical URL for OAuth callbacks / redirects (must match browser origin in production)
  baseURL: publicBaseUrl,

  advanced: {
    // Force Better-Auth to use a new cookie name ('vp') instead of 'better-auth'.
    // DO NOT REMOVE THIS: This completely bypasses the corrupted base64 cookie
    // stuck in the browser, permanently fixing the "Invalid Base64" 500 error.
    cookiePrefix: 'vp',
    // Railway / reverse proxies send x-forwarded-host, x-forwarded-proto
    trustedProxyHeaders: true,
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

  // -- Trusted origins (must include the URL users open in the browser) ----------
  trustedOrigins: trustedOriginList,

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
