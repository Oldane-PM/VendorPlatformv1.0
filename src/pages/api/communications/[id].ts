import type { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;
  if (req.method === 'GET') return res.status(200).json({ id });
  res.setHeader('Allow', ['GET']);
  res.status(405).end();
}
