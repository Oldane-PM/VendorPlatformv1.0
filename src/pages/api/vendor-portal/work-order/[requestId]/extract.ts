import { NextApiRequest, NextApiResponse } from 'next';
import { validateToken } from '@/lib/supabase/repos/workOrderQuotePortalRepo';
import { createServerClient } from '@/lib/supabase/server';
import { extractDocumentData } from '@/lib/server/services/aiDocumentExtractionService';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '15mb',
    },
  },
};

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    return handlePost(req, res);
  }
  res.setHeader('Allow', ['POST']);
  res.status(405).json({ error: `Method ${req.method} Not Allowed` });
}

async function handlePost(req: NextApiRequest, res: NextApiResponse) {
  const { requestId, t } = req.query;

  if (!requestId || typeof requestId !== 'string') {
    return res.status(400).json({ error: 'Missing request ID' });
  }
  if (!t || typeof t !== 'string') {
    return res.status(401).json({ error: 'Missing token' });
  }

  try {
    // Validate token
    await validateToken(requestId, t);

    const { submissionId, uploadFileId } = req.body;

    if (!submissionId || !uploadFileId) {
      return res.status(400).json({ error: 'Missing submissionId or uploadFileId' });
    }

    // Find the file record
    const supabase = createServerClient();
    const { data: fileRow, error: fileErr } = await (supabase as any)
      .from('work_order_vendor_submission_files')
      .select('*')
      .eq('id', uploadFileId)
      .eq('submission_id', submissionId)
      .single();

    if (fileErr || !fileRow) {
      return res.status(404).json({ error: 'File not found' });
    }

    // Download the file from storage
    const { data: fileBlob, error: downloadErr } = await supabase
      .storage
      .from(fileRow.storage_bucket)
      .download(fileRow.storage_path);

    if (downloadErr || !fileBlob) {
      return res.status(500).json({ error: 'Failed to download file for extraction' });
    }

    const arrayBuffer = await fileBlob.arrayBuffer();
    const base64Data = Buffer.from(arrayBuffer).toString('base64');

    // Run AI extraction
    const result = await extractDocumentData(
      base64Data,
      fileRow.mime_type,
      fileRow.file_name
    );

    return res.status(200).json(result);
  } catch (error: any) {
    console.error('[portal-extract] Error:', error);
    return res.status(500).json({ error: error.message || 'Extraction failed' });
  }
}
