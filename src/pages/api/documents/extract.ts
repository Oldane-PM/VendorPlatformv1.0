import type { NextApiRequest, NextApiResponse } from 'next';
import { createServerClient } from '@/lib/supabase/server';
import { DocumentExtractionServerRepo } from '@/lib/domain/documents/documentExtractionServerRepo';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end();
  }

  const { documentId, documentTypeHint } = req.body;

  if (!documentId) {
    return res.status(400).json({ error: 'Missing documentId' });
  }

  try {
    const adminDb = createServerClient();

    // 1. Fetch document metadata
    const { data: doc, error: docErr } = await adminDb
      .from('documents')
      .select('*')
      .eq('id', documentId)
      .single();

    if (docErr || !doc) {
      return res.status(404).json({ error: 'Document not found' });
    }

    // 2. Download file from storage
    const { data: fileData, error: downloadErr } = await adminDb.storage
      .from(doc.storage_bucket)
      .download(doc.storage_path);

    if (downloadErr || !fileData) {
      return res
        .status(500)
        .json({ error: 'Failed to download document from storage' });
    }

    const fileBuffer = Buffer.from(await fileData.arrayBuffer());
    const mimeType = fileData.type || 'application/pdf';

    // 3. Process extraction
    const extractionRepo = new DocumentExtractionServerRepo(adminDb);

    // Asynchronous processing (you can choose to await this if you prefer a synchronous API response)
    // We will await it here for the manual extract endpoint so the client knows it finished
    await extractionRepo.processAndExtractDocument(
      documentId,
      fileBuffer,
      mimeType,
      documentTypeHint
    );

    return res.status(200).json({ success: true, documentId });
  } catch (error: any) {
    console.error('Extraction trigger error:', error);
    return res.status(500).json({ error: error.message || 'Server error' });
  }
}
