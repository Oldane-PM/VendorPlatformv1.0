import type { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;
  if (req.method === 'GET') return res.status(200).json({ id });
  if (req.method === 'PATCH' || req.method === 'POST') return res.status(200).json({ id });
  res.setHeader('Allow', ['GET', 'PATCH', 'POST']);
  res.status(405).end();
}
