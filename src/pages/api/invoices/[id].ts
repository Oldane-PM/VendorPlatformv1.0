/**
 * API Route — /api/invoices/[id]
 *
 * GET → invoice detail + files with signed URLs
 */
import type { NextApiRequest, NextApiResponse } from 'next';
import * as invoicesRepo from '@/lib/supabase/repos/invoices.repo';
import { getSignedUrl } from '@/lib/uploads/signedUrl';

const SIGNED_URL_EXPIRY = 3600; // 1 hour

// Files from Work Order uploads go to 'vendor-uploads',
// Files from direct invoice uploads go to 'vendor-invoices'.
function getBucketForFile(storagePath: string): string {
  if (storagePath.startsWith('org/')) {
    return 'vendor-uploads'; // Work Order upload path pattern
  }
  return 'vendor-invoices';
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const { id } = req.query;

    if (req.method === 'GET') {
      if (!id || typeof id !== 'string') {
        return res.status(400).json({ error: 'Missing invoice id' });
      }

      const invoice = await invoicesRepo.getInvoiceById(id);

      if (!invoice) {
        return res.status(404).json({ error: 'Invoice not found' });
      }

      // Generate signed URLs for each file
      const filesWithUrls = await Promise.all(
        invoice.files.map(async (file) => {
          const bucket = getBucketForFile(file.storage_path);
          const signedUrl = await getSignedUrl(
            bucket,
            file.storage_path,
            SIGNED_URL_EXPIRY
          );
          return { ...file, signedUrl };
        })
      );

      return res.status(200).json({
        data: {
          ...invoice,
          files: filesWithUrls,
        },
      });
    }

    res.setHeader('Allow', ['GET']);
    return res.status(405).end();
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : 'Internal server error';
    console.error('[/api/invoices/[id]]', message);
    return res.status(500).json({ error: message });
  }
}
