import { DocumentProcessorServiceClient } from '@google-cloud/documentai';
import { NormalizedDocumentExtraction } from '@/lib/domain/documents/types';

const client = new DocumentProcessorServiceClient();

export async function processDocumentWithAI(
  fileBuffer: Buffer,
  mimeType: string,
  documentTypeHint?: string
): Promise<{ rawResponse: any; normalized: NormalizedDocumentExtraction }> {
  const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID;
  const location = process.env.GOOGLE_CLOUD_LOCATION || 'us';
  const processorId = process.env.GOOGLE_DOCUMENT_AI_PROCESSOR_ID;

  if (!projectId || !processorId) {
    throw new Error(
      'Google Cloud Document AI credentials/variables are missing.'
    );
  }

  const name = `projects/${projectId}/locations/${location}/processors/${processorId}`;

  const request = {
    name,
    rawDocument: {
      content: fileBuffer.toString('base64'),
      mimeType,
    },
  };

  const [result] = await client.processDocument(request);
  const document = result.document;

  if (!document) {
    throw new Error('No document returned from Document AI');
  }

  const normalized = normalizeDocumentExtraction(document, documentTypeHint);

  return { rawResponse: result, normalized };
}

function normalizeDocumentExtraction(
  document: any,
  documentTypeHint?: string
): NormalizedDocumentExtraction {
  let documentKind: NormalizedDocumentExtraction['documentKind'] =
    'other_vendor_document';

  // Basic heuristic or hint-based kind assignment
  if (documentTypeHint === 'invoice' || hasEntity(document, 'invoice_number')) {
    documentKind = 'invoice';
  } else if (
    documentTypeHint === 'contract' ||
    hasEntity(document, 'contract_title') ||
    hasEntity(document, 'contract_value')
  ) {
    documentKind = 'contract';
  } else if (
    documentTypeHint === 'work_order' ||
    hasEntity(document, 'work_order_number')
  ) {
    documentKind = 'work_order';
  }

  const fields: NormalizedDocumentExtraction['fields'] = [];
  const lineItems: NormalizedDocumentExtraction['lineItems'] = [];

  const entities = document.entities || [];

  let lineItemIndex = 0;

  for (const entity of entities) {
    const type = entity.type || '';

    // Handle line items
    if (type === 'line_item') {
      const properties = entity.properties || [];
      const lineItem: any = { lineIndex: lineItemIndex++, rawJson: entity };

      for (const prop of properties) {
        if (prop.type === 'line_item/description')
          lineItem.description = prop.mentionText;
        if (prop.type === 'line_item/quantity')
          lineItem.quantity = parseFloat(prop.mentionText || '0');
        if (prop.type === 'line_item/unit_price')
          lineItem.unitPrice = parseFloat(
            prop.mentionText?.replace(/[^0-9.-]+/g, '') || '0'
          );
        if (prop.type === 'line_item/amount')
          lineItem.lineTotal = parseFloat(
            prop.mentionText?.replace(/[^0-9.-]+/g, '') || '0'
          );
      }
      lineItems.push(lineItem);
      continue;
    }

    // Handle generic fields
    let text = entity.mentionText;
    let number = null;
    let date = null;

    // Simple heuristcs for parsing numbers/dates if the type implies it
    if (
      type.includes('amount') ||
      type.includes('total') ||
      type.includes('value')
    ) {
      const parsed = parseFloat(text?.replace(/[^0-9.-]+/g, '') || '');
      if (!isNaN(parsed)) number = parsed;
    }
    if (type.includes('date')) {
      date = text; // Just storing the raw text for the date field
    }

    fields.push({
      key: type,
      text: text || null,
      number,
      date,
      confidence: entity.confidence || null,
    });
  }

  let requiresReview = false;

  // Confidence / Review Logic based on requirements
  if (documentKind === 'invoice') {
    const hasVendor = fields.some((f) => f.key.includes('vendor_name'));
    const hasTotal = fields.some(
      (f) => f.key.includes('total_amount') || f.key === 'total'
    );
    if (!hasVendor || !hasTotal || lineItems.length === 0) {
      requiresReview = true;
    }
  } else if (documentKind === 'work_order') {
    const hasTotal = fields.some((f) => f.key.includes('total_amount'));
    if (!hasTotal) requiresReview = true;
  } else if (documentKind === 'other_vendor_document') {
    requiresReview = true; // Typically default layout requires a quick review
  }

  return {
    documentKind,
    fields,
    lineItems,
    requiresReview,
  };
}

function hasEntity(document: any, typeName: string): boolean {
  return (document.entities || []).some((e: any) => e.type === typeName);
}
