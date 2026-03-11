/**
 * Custom better-auth adapter backed by the existing Supabase JS client.
 *
 * Uses `createAdapterFactory` (same pattern as the official memoryAdapter)
 * so better-auth recognises it as a valid database adapter.
 *
 * Tables are prefixed with `ba_` (ba_user, ba_session, ba_account, ba_verification).
 */
import { createAdapterFactory } from '@better-auth/core/db/adapter';
import { createServerClient } from '@/lib/supabase/server';

// ── Model → table mapping ──────────────────────────────────────────────
const TABLE: Record<string, string> = {
  user: 'ba_user',
  session: 'ba_session',
  account: 'ba_account',
  verification: 'ba_verification',
};

function tableName(model: string) {
  return TABLE[model] ?? model;
}

// ── camelCase ↔ snake_case helpers ──────────────────────────────────────
function toSnake(s: string) {
  return s.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`);
}

function toCamel(s: string) {
  return s.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase());
}

function keysToSnake(obj: Record<string, any>): Record<string, any> {
  const out: Record<string, any> = {};
  for (const [k, v] of Object.entries(obj)) out[toSnake(k)] = sanitizeValue(v);
  return out;
}

/** Convert Date objects to ISO strings so Postgres doesn't choke on JS tz format */
function sanitizeValue(v: any): any {
  if (v instanceof Date) return v.toISOString();
  return v;
}

function keysToCamel(obj: Record<string, any>): Record<string, any> {
  const out: Record<string, any> = {};
  for (const [k, v] of Object.entries(obj)) out[toCamel(k)] = v;
  return out;
}

// ── Supabase filter operators ───────────────────────────────────────────
interface Where {
  field: string;
  value: any;
  operator?: string;
  connector?: 'AND' | 'OR';
}

function applyWhere(query: any, conditions: Where[]) {
  for (const w of conditions) {
    const col = toSnake(w.field);
    const val = sanitizeValue(w.value);
    switch (w.operator ?? 'eq') {
      case 'eq':
        query = query.eq(col, val);
        break;
      case 'ne':
        query = query.neq(col, val);
        break;
      case 'lt':
        query = query.lt(col, val);
        break;
      case 'lte':
        query = query.lte(col, val);
        break;
      case 'gt':
        query = query.gt(col, val);
        break;
      case 'gte':
        query = query.gte(col, val);
        break;
      case 'in':
        query = query.in(col, val);
        break;
      case 'contains':
        query = query.ilike(col, `%${val}%`);
        break;
      case 'starts_with':
        query = query.ilike(col, `${val}%`);
        break;
      case 'ends_with':
        query = query.ilike(col, `%${val}`);
        break;
      default:
        query = query.eq(col, val);
    }
  }
  return query;
}

// ── Adapter factory (follows the same pattern as memoryAdapter) ─────────
export const supabaseAdapter = () => {
  let lazyOptions: any = null;
  const adapterCreator: any = createAdapterFactory({
    config: {
      adapterId: 'supabase',
      adapterName: 'Supabase Adapter',
      usePlural: false,
      debugLogs: false,
      supportsArrays: false,
      transaction: async (cb: (adapter: any) => any): Promise<any> => {
        // Supabase JS client doesn't support transactions directly;
        // just run the callback with the same adapter.
        return cb(adapterCreator(lazyOptions));
      },
    },
    adapter: (): any => {
      const sb = createServerClient();

      return {
        create: async ({ model, data }: { model: string; data: Record<string, any> }) => {
          const { data: row, error } = await sb
            .from(tableName(model))
            .insert(keysToSnake(data))
            .select()
            .single();
          if (error) throw error;
          return keysToCamel(row);
        },

        findOne: async ({
          model,
          where,
        }: {
          model: string;
          where: Where[];
          select?: string[];
        }) => {
          let q = sb.from(tableName(model)).select('*');
          q = applyWhere(q, where);
          const { data: row, error } = await q.limit(1).maybeSingle();
          if (error) throw error;
          return row ? keysToCamel(row) : null;
        },

        findMany: async ({
          model,
          where,
          limit,
          offset,
          sortBy,
        }: {
          model: string;
          where?: Where[];
          limit?: number;
          offset?: number;
          sortBy?: { field: string; direction: 'asc' | 'desc' };
        }) => {
          let q = sb.from(tableName(model)).select('*');
          if (where) q = applyWhere(q, where);
          if (sortBy)
            q = q.order(toSnake(sortBy.field), {
              ascending: sortBy.direction === 'asc',
            });
          if (offset != null)
            q = q.range(offset, offset + (limit ?? 100) - 1);
          else if (limit != null) q = q.limit(limit);
          const { data: rows, error } = await q;
          if (error) throw error;
          return (rows ?? []).map(keysToCamel);
        },

        count: async ({
          model,
          where,
        }: {
          model: string;
          where?: Where[];
        }) => {
          let q = sb.from(tableName(model)).select('*', { count: 'exact', head: true });
          if (where) q = applyWhere(q, where);
          const { count, error } = await q;
          if (error) throw error;
          return count ?? 0;
        },

        update: async ({
          model,
          where,
          update: patch,
        }: {
          model: string;
          where: Where[];
          update: Record<string, any>;
        }) => {
          let q = sb.from(tableName(model)).update(keysToSnake(patch));
          q = applyWhere(q, where);
          const { data: row, error } = await q.select().single();
          if (error) throw error;
          return keysToCamel(row);
        },

        updateMany: async ({
          model,
          where,
          update: patch,
        }: {
          model: string;
          where: Where[];
          update: Record<string, any>;
        }) => {
          let q = sb.from(tableName(model)).update(keysToSnake(patch));
          q = applyWhere(q, where);
          const { data: rows, error } = await q.select();
          if (error) throw error;
          return rows?.[0] ? keysToCamel(rows[0]) : null;
        },

        delete: async ({ model, where }: { model: string; where: Where[] }) => {
          let q = sb.from(tableName(model)).delete();
          q = applyWhere(q, where);
          const { error } = await q;
          if (error) throw error;
        },

        deleteMany: async ({ model, where }: { model: string; where: Where[] }) => {
          let q = sb.from(tableName(model)).delete();
          q = applyWhere(q, where);
          const { data, error } = await q.select();
          if (error) throw error;
          return data?.length ?? 0;
        },
      };
    },
  });

  return (options: any) => {
    lazyOptions = options;
    return adapterCreator(options);
  };
};

