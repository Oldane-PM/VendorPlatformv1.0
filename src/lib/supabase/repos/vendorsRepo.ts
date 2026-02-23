/**
 * vendorsRepo — all Supabase queries for the vendors table.
 *
 * This is the ONLY file that touches the DB for vendors.
 */
import { createServerClient } from '../server';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface VendorRow {
  id: string;
  org_id: string;
  vendor_name: string;
  vendor_code: string | null;
  tax_id: string | null;
  status: string;
  created_at: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  category: string | null;
  rating: number;
  risk_score: number;
  total_engagements: number;
  total_spent: number;
  contact_person: string | null;
  joined_date: string | null;
  last_engagement_date: string | null;
  notes: string | null;
}

export interface ListVendorsOptions {
  search?: string;
  status?: string;
}

export interface CreateVendorInput {
  org_id: string;
  vendor_name: string;
  vendor_code?: string;
  tax_id?: string;
  status?: string;
}

/* ------------------------------------------------------------------ */
/*  Queries                                                            */
/* ------------------------------------------------------------------ */

/**
 * List vendors for an organisation.
 * Supports optional search (vendor_name OR vendor_code) and status filter.
 */
export async function listVendors(
  orgId: string,
  options: ListVendorsOptions = {}
): Promise<VendorRow[]> {
  const supabase = createServerClient();

  let query = supabase
    .from('vendors')
    .select('*')
    .eq('org_id', orgId)
    .order('created_at', { ascending: false });

  if (options.status && options.status !== 'all') {
    query = query.eq('status', options.status);
  }

  if (options.search) {
    const term = `%${options.search}%`;
    query = query.or(`vendor_name.ilike.${term},vendor_code.ilike.${term}`);
  }

  const { data, error } = await query;

  if (error) {
    console.error('[vendorsRepo.listVendors]', error);
    throw new Error(error.message);
  }

  return (data ?? []) as VendorRow[];
}

/**
 * Insert a new vendor and return the inserted row.
 */
export async function createVendor(
  input: CreateVendorInput
): Promise<VendorRow> {
  const supabase = createServerClient();

  const { data, error } = await supabase
    .from('vendors')
    .insert({
      org_id: input.org_id,
      vendor_name: input.vendor_name,
      vendor_code: input.vendor_code ?? null,
      tax_id: input.tax_id ?? null,
      status: input.status ?? 'active',
    })
    .select('*')
    .single();

  if (error) {
    console.error('[vendorsRepo.createVendor]', error);
    throw new Error(error.message);
  }

  return data as VendorRow;
}

/**
 * Fetch a single vendor by ID.
 */
export async function getVendorById(
  vendorId: string
): Promise<VendorRow | null> {
  const supabase = createServerClient();

  const { data, error } = await supabase
    .from('vendors')
    .select('*')
    .eq('id', vendorId)
    .maybeSingle();

  if (error) {
    console.error('[vendorsRepo.getVendorById]', error);
    throw new Error(error.message);
  }

  return data as VendorRow | null;
}

/**
 * DEV ONLY — list all vendors without org_id filter.
 */
export async function listAllVendorsDev(
  options: ListVendorsOptions = {}
): Promise<VendorRow[]> {
  const supabase = createServerClient();

  let query = supabase
    .from('vendors')
    .select('*')
    .order('created_at', { ascending: false });

  if (options.status && options.status !== 'all') {
    query = query.eq('status', options.status);
  }

  if (options.search) {
    const term = `%${options.search}%`;
    query = query.or(`vendor_name.ilike.${term},vendor_code.ilike.${term}`);
  }

  const { data, error } = await query;

  if (error) {
    console.error('[vendorsRepo.listAllVendorsDev]', error);
    throw new Error(error.message);
  }

  return (data ?? []) as VendorRow[];
}

/**
 * DEV ONLY — return the first org ID from the organizations table,
 * or from the vendors table as a fallback.
 */
export async function getFirstOrgId(): Promise<string | null> {
  const supabase = createServerClient();

  // Try organizations table
  const { data: org } = await supabase
    .from('organizations')
    .select('id')
    .limit(1)
    .maybeSingle();

  if (org) return org.id as string;

  // Fallback: get org_id from vendors
  const { data: vendor } = await supabase
    .from('vendors')
    .select('org_id')
    .limit(1)
    .maybeSingle();

  return vendor ? (vendor.org_id as string) : null;
}
