/**
 * Upload files to storage (e.g. Supabase Storage).
 */

export async function uploadToStorage(
  file: File,
  bucket: string,
  path: string
): Promise<{ url: string; key: string }> {
  throw new Error('Not implemented');
}
