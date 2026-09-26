// WhatsApp numbers are stored as digits with the country code and no "+", e.g. 919876543210 — the
// form wa.me links and the database expect. People type them every way; this turns what they typed
// into that form, or says it can't.

/** Digits only. A bare 10-digit number is taken as Indian (+91) since that is where most customers are. */
export function normalizePhone(input: string): string | null {
  let digits = input.replace(/\D/g, "").replace(/^00/, "");
  if (digits.length === 11 && digits.startsWith("0")) digits = digits.slice(1); // 09876543210
  if (digits.length === 10) digits = `91${digits}`;
  return /^\d{8,15}$/.test(digits) ? digits : null;
}

/** 919876543210 -> "+91 98765 43210" (Indian numbers), otherwise "+<digits>". */
export function formatPhone(digits: string): string {
  if (/^91\d{10}$/.test(digits)) return `+91 ${digits.slice(2, 7)} ${digits.slice(7)}`;
  return digits ? `+${digits}` : "";
}
