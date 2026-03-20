import { SupabaseClient } from '@supabase/supabase-js';
import type { NormalizedDocumentExtraction } from './types';

/**
 * Server-side repository for document extraction data.
 * Uses a Supabase service-role client to bypass RLS.
 */
export class DocumentExtractionServerRepo {
  constructor(private readonly db: SupabaseClient) {}

  /**
   * Fetch the full extraction payload for a document:
   * document metadata, extraction record, fields, and line items.
   */
  async getExtraction(documentId: string) {
    // 1. The document itself
    const { data: document, error: docErr } = await this.db
      .from('documents')
      .select('*')
      .eq('id', documentId)
      .single();

    if (docErr) throw docErr;

    // 2. Extraction record
    const { data: extraction, error: extErr } = await this.db
      .from('document_extractions')
      .select('*')
      .eq('document_id', documentId)
      .maybeSingle();

    if (extErr) throw extErr;

    // 3. Fields
    const { data: fields, error: fieldsErr } = await this.db
      .from('document_fields')
      .select('*')
      .eq('document_id', documentId)
      .order('field_key');

    if (fieldsErr) throw fieldsErr;

    // 4. Line items
    const { data: lineItems, error: liErr } = await this.db
      .from('document_line_items')
      .select('*')
      .eq('document_id', documentId)
      .order('line_index');

    if (liErr) throw liErr;

    // Build normalized shape
    const normalized: NormalizedDocumentExtraction = {
      documentKind: (extraction?.raw_response as any)?.documentKind ?? 'other_vendor_document',
      fields: (fields ?? []).map((f: any) => ({
        key: f.field_key,
        text: f.text_value,
        number: f.number_value != null ? Number(f.number_value) : null,
        date: f.date_value,
        confidence: f.confidence != null ? Number(f.confidence) : null,
      })),
      lineItems: (lineItems ?? []).map((li: any) => ({
        lineIndex: li.line_index,
        description: li.description,
        quantity: li.quantity != null ? Number(li.quantity) : null,
        unitPrice: li.unit_price != null ? Number(li.unit_price) : null,
        taxAmount: li.tax_amount != null ? Number(li.tax_amount) : null,
        lineTotal: li.line_total != null ? Number(li.line_total) : null,
        rawJson: li.raw_json,
      })),
      requiresReview: extraction?.confidence_score != null
        ? extraction.confidence_score < 0.8
        : true,
    };

    return {
      document,
      extraction,
      normalized,
    };
  }
}
