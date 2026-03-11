import type { NextApiRequest, NextApiResponse } from 'next';
import { createServerClient } from '@/lib/supabase/server';
import { DocumentExtractionServerRepo } from '@/lib/domain/documents/documentExtractionServerRepo';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).end();
  }

  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Missing or invalid document ID' });
  }

  try {
    const adminDb = createServerClient();
    const extractionRepo = new DocumentExtractionServerRepo(adminDb);

    const data = await extractionRepo.getExtraction(id);

    return res.status(200).json(data);
  } catch (error: any) {
    if (error.code === 'PGRST116') {
      return res.status(404).json({ error: 'Document not found' });
    }
    console.error('Error fetching document extraction:', error);
    return res.status(500).json({ error: error.message || 'Server error' });
  }
}
