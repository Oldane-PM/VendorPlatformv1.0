import { SupabaseClient } from '@supabase/supabase-js';
import { processDocumentWithAI } from '@/lib/server/services/ocrService';
import { NormalizedDocumentExtraction } from './types';

export class DocumentExtractionServerRepo {
  constructor(private readonly adminDb: SupabaseClient) {}

  /**
   * Processes a document that has already been created and uploaded to storage.
   */
  async processAndExtractDocument(
    documentId: string,
    fileBuffer: Buffer,
    mimeType: string,
    documentTypeHint?: string
  ): Promise<void> {
    try {
      // 1. Mark as processing
      await this.adminDb
        .from('documents')
        .update({ processing_status: 'processing' })
        .eq('id', documentId);

      // 2. Call OCR Service
      const { rawResponse, normalized } = await processDocumentWithAI(
        fileBuffer,
        mimeType,
        documentTypeHint
      );

      // 3. Save raw extraction
      const { data: extraction, error: extractionErr } = await this.adminDb
        .from('document_extractions')
        .insert({
          document_id: documentId,
          raw_response: rawResponse,
          confidence_score:
            normalized.fields.reduce((acc, f) => acc + (f.confidence || 0), 0) /
            (normalized.fields.length || 1), // Simple average confidence
        })
        .select('id')
        .single();

      if (extractionErr) throw extractionErr;

      // 4. Save normalized fields
      if (normalized.fields.length > 0) {
        const fieldsToInsert = normalized.fields.map((f) => ({
          document_id: documentId,
          field_key: f.key,
          text_value: f.text || null,
          number_value: f.number || null,
          date_value: f.date || null,
          confidence: f.confidence || null,
        }));

        const { error: fieldsErr } = await this.adminDb
          .from('document_fields')
          .insert(fieldsToInsert);
        if (fieldsErr) throw fieldsErr;
      }

      // 5. Save line items
      if (normalized.lineItems.length > 0) {
        const lineItemsToInsert = normalized.lineItems.map((li) => ({
          document_id: documentId,
          line_index: li.lineIndex,
          description: li.description || null,
          quantity: li.quantity || null,
          unit_price: li.unitPrice || null,
          tax_amount: li.taxAmount || null,
          line_total: li.lineTotal || null,
          raw_json: li.rawJson || null,
        }));

        const { error: linesErr } = await this.adminDb
          .from('document_line_items')
          .insert(lineItemsToInsert);
        if (linesErr) throw linesErr;
      }

      // 6. Update document status
      const status = normalized.requiresReview
        ? 'review_required'
        : 'completed';
      const { error: finalDocErr } = await this.adminDb
        .from('documents')
        .update({ processing_status: status })
        .eq('id', documentId);

      if (finalDocErr) throw finalDocErr;
    } catch (error: any) {
      console.error(`Failed to process document ${documentId}:`, error);
      // Mark as failed and store error if possible
      await this.adminDb
        .from('documents')
        .update({ processing_status: 'failed' })
        .eq('id', documentId);

      // Optionally record error in extractions explicitly
      try {
        await this.adminDb.from('document_extractions').insert({
          document_id: documentId,
          raw_response: {},
          processing_error: error.message || 'Unknown error',
        });
      } catch (e) {} // best effort

      throw error;
    }
  }

  async getExtraction(documentId: string) {
    const [docRes, extRes, fieldsRes, linesRes] = await Promise.all([
      this.adminDb.from('documents').select('*').eq('id', documentId).single(),
      this.adminDb
        .from('document_extractions')
        .select('*')
        .eq('document_id', documentId)
        .single(),
      this.adminDb
        .from('document_fields')
        .select('*')
        .eq('document_id', documentId),
      this.adminDb
        .from('document_line_items')
        .select('*')
        .eq('document_id', documentId)
        .order('line_index', { ascending: true }),
    ]);

    if (docRes.error) throw docRes.error;

    return {
      document: docRes.data,
      extraction: extRes.error ? null : extRes.data,
      fields: fieldsRes.data || [],
      lineItems: linesRes.data || [],
    };
  }
}
