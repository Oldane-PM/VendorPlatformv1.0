import type { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    return res.status(200).json({ data: [] });
  }
  if (req.method === 'POST') {
    return res.status(201).json({ id: 'new' });
  }
  res.setHeader('Allow', ['GET', 'POST']);
  res.status(405).end();
}
