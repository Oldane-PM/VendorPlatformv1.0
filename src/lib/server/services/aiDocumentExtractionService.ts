/**
 * aiDocumentExtractionService — uses Gemini to extract structured data from uploaded documents.
 *
 * Accepts a base64-encoded file and returns structured vendor, line item,
 * payment, and contract data extracted via AI.
 */

import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// ─── Types ──────────────────────────────────────────────────────────────────

export interface ExtractedVendorInfo {
  vendorName: string;
  vendorId: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
}

export interface ExtractedLineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface ExtractedPaymentTerms {
  paymentTerms: string;
  deliveryDate: string;
  warranty: string;
  subtotal: number;
  tax: number;
  taxRate: string;
  totalAmount: number;
}

export interface ExtractedContractDetails {
  contractNumber: string;
  contractDate: string;
  validUntil: string;
  approvalRequired: string;
  department: string;
}

export interface ExtractedDocumentData {
  fileName: string;
  extractedAt: string;
  vendorInfo: ExtractedVendorInfo;
  lineItems: ExtractedLineItem[];
  paymentTerms: ExtractedPaymentTerms;
  contractDetails: ExtractedContractDetails;
}

// ─── Extraction ─────────────────────────────────────────────────────────────

export async function extractDocumentData(
  base64Data: string,
  mimeType: string,
  fileName: string
): Promise<ExtractedDocumentData> {
  const prompt = `You are an expert document data extraction system. Analyze the attached document and extract all relevant procurement/quotation data.

Return ONLY a valid JSON object with this exact structure (no markdown, no code fences, no explanation):
{
  "vendorInfo": {
    "vendorName": "",
    "vendorId": "",
    "contactPerson": "",
    "email": "",
    "phone": "",
    "address": ""
  },
  "lineItems": [
    {
      "description": "",
      "quantity": 0,
      "unitPrice": 0,
      "total": 0
    }
  ],
  "paymentTerms": {
    "paymentTerms": "",
    "deliveryDate": "",
    "warranty": "",
    "subtotal": 0,
    "tax": 0,
    "taxRate": "",
    "totalAmount": 0
  },
  "contractDetails": {
    "contractNumber": "",
    "contractDate": "",
    "validUntil": "",
    "approvalRequired": "",
    "department": ""
  }
}

Rules:
- Extract all vendor/supplier information found in the document.
- Extract every line item with description, quantity, unit price, and total.
- Extract payment terms, delivery dates, warranty info, and financial totals.
- Extract contract metadata if present.
- For monetary values, return plain numbers (no currency symbols).
- If a field is not found in the document, use an empty string for text or 0 for numbers.
- Return ONLY the JSON object, nothing else.`;

  const parts: any[] = [
    { text: prompt },
    {
      inlineData: {
        data: base64Data,
        mimeType,
      },
    },
  ];

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: [
      {
        role: 'user',
        parts,
      },
    ],
  });

  const rawText = response.text;
  if (!rawText) {
    throw new Error('AI extraction returned no response.');
  }

  // Clean up potential markdown fences
  let jsonStr = rawText.trim();
  if (jsonStr.startsWith('```')) {
    jsonStr = jsonStr.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
  }

  let parsed: any;
  try {
    parsed = JSON.parse(jsonStr);
  } catch {
    throw new Error('AI extraction returned invalid JSON. Raw: ' + jsonStr.substring(0, 200));
  }

  return {
    fileName,
    extractedAt: new Date().toISOString(),
    vendorInfo: {
      vendorName: parsed.vendorInfo?.vendorName ?? '',
      vendorId: parsed.vendorInfo?.vendorId ?? '',
      contactPerson: parsed.vendorInfo?.contactPerson ?? '',
      email: parsed.vendorInfo?.email ?? '',
      phone: parsed.vendorInfo?.phone ?? '',
      address: parsed.vendorInfo?.address ?? '',
    },
    lineItems: Array.isArray(parsed.lineItems)
      ? parsed.lineItems.map((item: any) => ({
          description: item.description ?? '',
          quantity: Number(item.quantity) || 0,
          unitPrice: Number(item.unitPrice) || 0,
          total: Number(item.total) || 0,
        }))
      : [],
    paymentTerms: {
      paymentTerms: parsed.paymentTerms?.paymentTerms ?? '',
      deliveryDate: parsed.paymentTerms?.deliveryDate ?? '',
      warranty: parsed.paymentTerms?.warranty ?? '',
      subtotal: Number(parsed.paymentTerms?.subtotal) || 0,
      tax: Number(parsed.paymentTerms?.tax) || 0,
      taxRate: parsed.paymentTerms?.taxRate ?? '',
      totalAmount: Number(parsed.paymentTerms?.totalAmount) || 0,
    },
    contractDetails: {
      contractNumber: parsed.contractDetails?.contractNumber ?? '',
      contractDate: parsed.contractDetails?.contractDate ?? '',
      validUntil: parsed.contractDetails?.validUntil ?? '',
      approvalRequired: parsed.contractDetails?.approvalRequired ?? '',
      department: parsed.contractDetails?.department ?? '',
    },
  };
}
