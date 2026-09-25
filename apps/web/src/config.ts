// The business contact number comes from the owner, never from code: either the admin panel's
// "contact number" setting (site_settings.contact_whatsapp, loaded with the store data) or the
// VITE_WHATSAPP_NUMBER environment variable as the fallback. Country code + number, no "+" or
// spaces, e.g. 919876543210.
//
// Safety behaviour, deliberately strict:
//  - Local dev with no number set uses an intentionally INVALID number, so testing a Buy button can
//    never message a real person by accident.
//  - A production build with no number set produces no link at all (contact buttons render inert)
//    and logs an error — it never falls back to a placeholder that could belong to a stranger.
const fromEnv = import.meta.env.VITE_WHATSAPP_NUMBER?.replace(/\D/g, "") || undefined;
const DEV_FALLBACK_INVALID_NUMBER = "0000000000";

let fromSettings: string | undefined;

/** True when a real contact number is available (a live binding: it changes when settings load). */
export let contactConfigured = Boolean(fromEnv);

/** Called by the data provider with the owner's "contact number" setting once it has loaded. */
export function setContactNumber(value: string | undefined) {
  fromSettings = value?.replace(/\D/g, "") || undefined;
  contactConfigured = Boolean(fromSettings || fromEnv);
}

if (!fromEnv && import.meta.env.PROD) {
  console.error("VITE_WHATSAPP_NUMBER is not set — contact links stay disabled unless the owner sets a contact number in Settings.");
}

export function whatsAppLink(message: string): string | undefined {
  const number = fromSettings || fromEnv || (import.meta.env.DEV ? DEV_FALLBACK_INVALID_NUMBER : undefined);
  if (!number) return undefined;
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}
