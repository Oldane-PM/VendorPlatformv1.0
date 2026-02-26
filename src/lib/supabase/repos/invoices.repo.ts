/**
 * invoices.repo — Supabase queries for invoices + invoice_files.
 */
import { createServerClient } from '../server';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface InvoiceRow {
  id: string;
  vendor_id: string;
  engagement_id: string;
  invoice_number: string | null;
  status: string;
  total_amount: number | null;
  due_date: string | null;
  created_at: string;
  created_by: string | null;
  // joined fields
  vendor_name?: string;
  engagement_title?: string;
}

export interface InvoiceFileRow {
  id: string;
  invoice_id: string;
  storage_path: string;
  file_name: string;
  mime_type: string;
  uploaded_at: string;
}

export interface InvoiceDetail extends InvoiceRow {
  files: InvoiceFileRow[];
}

export interface CreateInvoiceFromUploadInput {
  vendorId: string;
  engagementId: string;
  invoiceNumber?: string;
}

export interface AttachInvoiceFileInput {
  invoiceId: string;
  storage_path: string;
  file_name: string;
  mime_type: string;
}

/* ------------------------------------------------------------------ */
/*  Queries                                                            */
/* ------------------------------------------------------------------ */

/**
 * List all invoices with vendor name and engagement title.
 */
export async function listInvoices(): Promise<InvoiceRow[]> {
  const supabase = createServerClient();

  const { data, error } = await supabase
    .from('invoices')
    .select(
      `
      *,
      vendors:vendor_id ( vendor_name ),
      engagements:engagement_id ( title )
    `
    )
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[invoices.repo.listInvoices]', error);
    throw new Error(error.message);
  }

  // Flatten joined fields
  return (data ?? []).map((row: any) => ({
    ...row,
    vendor_name: row.vendors?.vendor_name ?? null,
    engagement_title: row.engagements?.title ?? null,
    vendors: undefined,
    engagements: undefined,
  })) as InvoiceRow[];
}

/**
 * Get a single invoice by ID, including its files.
 */
export async function getInvoiceById(
  invoiceId: string
): Promise<InvoiceDetail | null> {
  const supabase = createServerClient();

  // Fetch invoice + joins
  const { data: invoice, error: invErr } = await supabase
    .from('invoices')
    .select(
      `
      *,
      vendors:vendor_id ( vendor_name ),
      engagements:engagement_id ( title )
    `
    )
    .eq('id', invoiceId)
    .maybeSingle();

  if (invErr) {
    console.error('[invoices.repo.getInvoiceById]', invErr);
    throw new Error(invErr.message);
  }

  if (!invoice) return null;

  // Fetch files
  const { data: files, error: filesErr } = await supabase
    .from('invoice_files')
    .select('*')
    .eq('invoice_id', invoiceId)
    .order('uploaded_at', { ascending: false });

  if (filesErr) {
    console.error('[invoices.repo.getInvoiceById] files', filesErr);
    throw new Error(filesErr.message);
  }

  const row = invoice as any;

  return {
    ...row,
    vendor_name: row.vendors?.vendor_name ?? null,
    engagement_title: row.engagements?.title ?? null,
    vendors: undefined,
    engagements: undefined,
    files: (files ?? []) as InvoiceFileRow[],
  } as InvoiceDetail;
}

/**
 * Create an invoice record when a vendor uploads.
 */
export async function createInvoiceFromVendorUpload(
  input: CreateInvoiceFromUploadInput
): Promise<InvoiceRow> {
  const supabase = createServerClient();

  const { data, error } = await supabase
    .from('invoices')
    .insert({
      vendor_id: input.vendorId,
      engagement_id: input.engagementId,
      invoice_number: input.invoiceNumber ?? null,
      status: 'Submitted',
      total_amount: null,
      due_date: null,
      created_by: null,
    })
    .select('*')
    .single();

  if (error) {
    console.error('[invoices.repo.createInvoiceFromVendorUpload]', error);
    throw new Error(error.message);
  }

  return data as InvoiceRow;
}

/**
 * Attach a file record to an invoice.
 */
export async function attachInvoiceFile(
  input: AttachInvoiceFileInput
): Promise<InvoiceFileRow> {
  const supabase = createServerClient();

  const { data, error } = await supabase
    .from('invoice_files')
    .insert({
      invoice_id: input.invoiceId,
      storage_path: input.storage_path,
      file_name: input.file_name,
      mime_type: input.mime_type,
    })
    .select('*')
    .single();

  if (error) {
    console.error('[invoices.repo.attachInvoiceFile]', error);
    throw new Error(error.message);
  }

  return data as InvoiceFileRow;
}
