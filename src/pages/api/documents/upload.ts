import type { NextApiRequest, NextApiResponse } from 'next';
import formidable from 'formidable';
import fs from 'fs';
import { createServerClient } from '@/lib/supabase/server';
import { DocumentExtractionServerRepo } from '@/lib/domain/documents/documentExtractionServerRepo';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end();
  }

  const form = formidable({ multiples: true });

  try {
    const [fields, files] = await form.parse(req);
    const uploadedFiles = Array.isArray(files.file)
      ? files.file
      : files.file
        ? [files.file]
        : [];

    if (uploadedFiles.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    const adminDb = createServerClient();
    const extractionRepo = new DocumentExtractionServerRepo(adminDb);
    const createdDocuments: any[] = [];

    for (const file of uploadedFiles) {
      const fileBuffer = fs.readFileSync(file.filepath);
      const mimeType = file.mimetype || 'application/octet-stream';
      const fileName = file.originalFilename || 'upload';

      // 1. Upload to storage
      const storagePath = `ocr/${Date.now()}-${fileName}`;
      const { error: storageErr } = await adminDb.storage
        .from('vendor_uploads')
        .upload(storagePath, fileBuffer, {
          contentType: mimeType,
          upsert: true,
        });

      if (storageErr) {
        throw storageErr;
      }

      // 2. Create document record
      // NOTE: For this generic AI test page, we'll supply a default dev org_id
      // to bypass the NOT NULL constraint on `documents.org_id`
      const fallbackOrgId = '00000000-0000-0000-0000-000000000001';

      const { data: doc, error: docErr } = await adminDb
        .from('documents')
        .insert({
          org_id: fallbackOrgId,
          file_name: fileName,
          storage_bucket: 'vendor_uploads',
          storage_path: storagePath,
          processing_status: 'queued',
        })
        .select('id')
        .single();

      if (docErr) {
        throw docErr;
      }

      createdDocuments.push({ id: doc.id, fileName });

      // 3. Trigger extraction asynchronously to avoid blocking the response for too long
      // Fire and forget
      extractionRepo
        .processAndExtractDocument(
          doc.id,
          fileBuffer,
          mimeType,
          fields.documentTypeHint?.[0]
        )
        .catch((err) => {
          console.error('Async extraction failed:', err);
        });
    }

    return res.status(200).json({ documents: createdDocuments });
  } catch (error: any) {
    console.error('Upload error:', error);
    return res.status(500).json({ error: error.message || 'Server error' });
  }
}
