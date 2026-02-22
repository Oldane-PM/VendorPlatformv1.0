import type { NextApiRequest, NextApiResponse } from 'next';

export const config = { api: { bodyParser: false } };

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end();
  }
  res.status(501).json({ error: 'Upload not implemented' });
}
