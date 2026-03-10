export type NormalizedDocumentExtraction = {
  documentKind: 'invoice' | 'contract' | 'work_order' | 'other_vendor_document';
  fields: Array<{
    key: string;
    text?: string | null;
    number?: number | null;
    date?: string | null;
    confidence?: number | null;
  }>;
  lineItems: Array<{
    lineIndex: number;
    description?: string | null;
    quantity?: number | null;
    unitPrice?: number | null;
    taxAmount?: number | null;
    lineTotal?: number | null;
    rawJson?: unknown;
  }>;
  requiresReview: boolean;
};
