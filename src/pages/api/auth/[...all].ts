import type { NextApiRequest, NextApiResponse } from 'next';
import { toNodeHandler } from 'better-auth/node';
import { auth } from '@/lib/auth';

// Better-Auth needs the raw body — disable Next.js body parsing
export const config = {
  api: { bodyParser: false },
};

const handler = toNodeHandler(auth);

export default async function authHandler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // toNodeHandler returns a Node.js-compatible handler
  return handler(req, res);
}
