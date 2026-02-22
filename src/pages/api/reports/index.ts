import type { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') return res.status(200).json({ data: [] });
  res.setHeader('Allow', ['GET']);
  res.status(405).end();
}
