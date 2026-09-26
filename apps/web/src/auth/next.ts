// Only same-site paths are honoured after login, so a crafted link can't send someone elsewhere.
export const safeNext = (next: string | null): string | null => (next && next.startsWith("/") && !next.startsWith("//") ? next : null);
