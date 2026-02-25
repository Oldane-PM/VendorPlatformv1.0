/**
 * Generate signed URLs for private Supabase storage objects.
 */

import { createServerClient } from '../supabase/server';

export async function getSignedUrl(
  bucket: string,
  path: string,
  expiresIn = 3600
): Promise<string> {
  const client = createServerClient();

  const { data, error } = await client.storage
    .from(bucket)
    .createSignedUrl(path, expiresIn);

  if (error || !data?.signedUrl) {
    console.error(
      '[getSignedUrl] Error:',
      error?.message ?? 'No signed URL returned'
    );
    return '';
  }

  return data.signedUrl;
}
