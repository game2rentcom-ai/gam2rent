// Supabase's messages are written for developers; these are written for customers.
export function friendlyAuthError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("invalid login credentials")) return "That email and password don’t match. Try again, or reset your password.";
  if (m.includes("email not confirmed")) return "Please confirm your email first — we sent you a link.";
  if (m.includes("password should be at least")) return "Choose a password with at least 8 characters.";
  if (m.includes("rate limit") || m.includes("too many")) return "Too many attempts. Please wait a few minutes and try again.";
  if (m.includes("invalid format") || m.includes("validate email")) return "That doesn’t look like a valid email address.";
  if (m.includes("failed to fetch") || m.includes("network")) return "We couldn’t reach the server. Check your connection and try again.";
  return "Something went wrong. Please try again.";
}
