import type { NextApiRequest, NextApiResponse } from 'next';
import { createServerClient } from '../../../lib/supabase/server';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).end();
  }

  const { path } = req.query;

  if (!path || typeof path !== 'string') {
    return res.status(400).json({ error: 'Missing defined path' });
  }

  try {
    const supabase = createServerClient();

    const { data, error } = await supabase.storage
      .from('vendor_uploads')
      .createSignedUrl(path, 60 * 5); // 5 minutes validity

    if (error || !data?.signedUrl) {
      console.error('[download api] Error generating signed URL', error);
      return res
        .status(500)
        .json({ error: 'Failed to generate download link' });
    }

    // Redirect user to actual signed URL to initiate standard browser download
    return res.redirect(307, data.signedUrl);
  } catch (error: any) {
    console.error('[download api] exception', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
