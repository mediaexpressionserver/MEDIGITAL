// src/lib/supabaseAdmin.ts
import { createClient, SupabaseClient } from "@supabase/supabase-js";

/**
 * Lazy, robust Supabase admin client.
 *
 * Exports:
 *  - getSupabaseAdmin(): SupabaseClient  -> call to get real client
 *  - supabaseAdmin (exported const)      -> a Proxy that forwards calls to the real client (backwards-compatible)
 *
 * Environment variables expected:
 *  - SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL
 *  - SUPABASE_SERVICE_ROLE_KEY
 *
 * If env vars are missing, the module logs a helpful message and throws at runtime when the client is first used.
 */

const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const serviceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SERVICE_ROLE ?? "";

let _client: SupabaseClient | null = null;

function createSupabaseClient(): SupabaseClient {
  if (_client) return _client;

  if (!url || !serviceKey) {
    // Helpful server-side error for logs so you can see what's missing on Vercel
    // eslint-disable-next-line no-console
    console.error(
      "[supabaseAdmin] Missing Supabase credentials. Required: SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL) and SUPABASE_SERVICE_ROLE_KEY.",
      {
        SUPABASE_URL: Boolean(process.env.SUPABASE_URL),
        NEXT_PUBLIC_SUPABASE_URL: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
        SUPABASE_SERVICE_ROLE_KEY: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
        SUPABASE_SERVICE_ROLE: Boolean(process.env.SUPABASE_SERVICE_ROLE),
      }
    );
    throw new Error(
      "supabaseAdmin: Missing environment variables. Set SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL) and SUPABASE_SERVICE_ROLE_KEY."
    );
  }

  _client = createClient(url, serviceKey, {
    auth: { persistSession: false },
    global: { fetch: globalThis.fetch.bind(globalThis) as any },
  });

  return _client;
}

/** Backwards-compatible accessor; safe to call anywhere. Throws if env missing. */
export function getSupabaseAdmin(): SupabaseClient {
  return createSupabaseClient();
}

/**
 * Proxy that forwards any property access / method call to the real supabase client.
 * This lets existing code that imports { supabaseAdmin } continue to call supabaseAdmin.from(...)
 */
const handler: ProxyHandler<any> = {
  get(_, prop) {
    const client = createSupabaseClient();
    // forward the property (function or value)
    // @ts-ignore
    const value = (client as any)[prop];
    // If it's a function, bind it to client so `this` works correctly
    if (typeof value === "function") return value.bind(client);
    return value;
  },
  set(_, prop, value) {
    const client = createSupabaseClient();
    // @ts-ignore
    (client as any)[prop] = value;
    return true;
  },
  has(_, prop) {
    const client = createSupabaseClient();
    return prop in (client as any);
  },
};

export const supabaseAdmin: SupabaseClient = new Proxy({}, handler) as unknown as SupabaseClient;