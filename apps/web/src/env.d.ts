/// <reference types="vite/client" />

// Typed build-time environment. Every value is optional on purpose: the site must degrade to an
// honest, safe state (no listings, disabled contact links) when a variable is missing, never crash
// and never fall back to fake data. See config.ts and data/DataProvider.tsx.
interface ImportMetaEnv {
  /** Supabase project URL, e.g. https://abcd1234.supabase.co */
  readonly VITE_SUPABASE_URL?: string;
  /** Supabase *anon* (public) key. Safe in the browser only because row-level security is on. */
  readonly VITE_SUPABASE_ANON_KEY?: string;
  /** Business contact number: country code + number, no "+" or spaces, e.g. 919876543210. */
  readonly VITE_WHATSAPP_NUMBER?: string;
  /** "true" forces illustrative demo data on; "false" forces it off (even in local dev). */
  readonly VITE_DEMO_DATA?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
