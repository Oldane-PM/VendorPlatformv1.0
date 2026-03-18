import { GoogleGenAI } from '@google/genai';
import { createServerClient } from '@/lib/supabase/server';
import { getSubmissionWithFiles } from '@/lib/supabase/repos/workOrderQuotePortalRepo';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function generateVendorSummary(submissionId: string): Promise<string> {
  // 1. Fetch submission and files from the correct table (work_order_vendor_submissions)
  const submission = await getSubmissionWithFiles(submissionId);

  // 2. Download files from Supabase Storage
  const supabase = createServerClient();
  const fileParts: Array<{ mimeType: string; data: string }> = [];

  for (const file of submission.files) {
    // Only process PDFs and text-like files to save tokens and avoid errors
    if (!file.mime_type.includes('pdf') && !file.mime_type.includes('text') && !file.mime_type.includes('word')) {
      continue;
    }

    const { data: fileBlob, error: downloadError } = await supabase
      .storage
      .from('vendor_uploads')
      .download(file.storage_path);

    if (downloadError || !fileBlob) {
      console.error(`Failed to download file ${file.file_name}:`, downloadError);
      continue;
    }

    const arrayBuffer = await fileBlob.arrayBuffer();
    const base64Data = Buffer.from(arrayBuffer).toString('base64');

    fileParts.push({
      mimeType: file.mime_type,
      data: base64Data,
    });
  }

  const prompt = `You are a procurement analyst. Summarize this vendor submission in exactly 2-3 short sentences. Be concise and factual.

Vendor: ${submission.vendor_name}
Quote: $${submission.total_amount ?? 'N/A'}

Mention: key strengths, pricing position, expertise, and any risks or gaps. Keep it brief.`;

  const parts: any[] = [{ text: prompt }];
  
  for (const part of fileParts) {
    parts.push({
      inlineData: {
        data: part.data,
        mimeType: part.mimeType,
      }
    });
  }

  // 4. Call Gemini API
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: [
      {
        role: 'user',
        parts,
      }
    ],
  });

  const summaryText = response.text;
  if (!summaryText) {
    throw new Error('Failed to generate summary from Gemini API');
  }

  return summaryText.trim();
}
