/**
 * Server environment validation
 * Load and validate required env vars for the backend server.
 */

function getEnv(key: string): string {
  const value = process.env[key];
  if (!value) throw new Error(`Missing env: ${key}`);
  return value;
}

export const serverEnv = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  // Add server-only env vars as needed
};
