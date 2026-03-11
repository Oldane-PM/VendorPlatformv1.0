import { createAuthClient } from 'better-auth/client';

export const authClient = createAuthClient({
  baseURL:
    process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
});

// Re-export for convenience
export const signIn = authClient.signIn;
export const signUp = authClient.signUp;
export const signOut = authClient.signOut;
