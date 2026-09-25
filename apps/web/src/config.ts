// The business contact number comes from the environment (VITE_WHATSAPP_NUMBER), never from code:
// country code + number, no "+" or spaces, e.g. 919876543210.
//
// Safety behaviour, deliberately strict:
//  - Local dev with no number set uses an intentionally INVALID number, so testing a Buy button can
//    never message a real person by accident.
//  - A production build with no number set produces no link at all (contact buttons render inert)
//    and logs an error — it never falls back to a placeholder that could belong to a stranger.
const configured = import.meta.env.VITE_WHATSAPP_NUMBER?.replace(/\D/g, "");
const DEV_FALLBACK_INVALID_NUMBER = "0000000000";

export const contactConfigured = Boolean(configured);

if (!contactConfigured && import.meta.env.PROD) {
  console.error("VITE_WHATSAPP_NUMBER is not set — contact and buy links are disabled.");
}

export function whatsAppLink(message: string): string | undefined {
  const number = configured || (import.meta.env.DEV ? DEV_FALLBACK_INVALID_NUMBER : undefined);
  if (!number) return undefined;
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}
