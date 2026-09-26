// Only same-site paths are honoured after login, so a crafted link can't send someone elsewhere. Browsers treat
// a backslash like a slash (and ignore tabs/newlines inside a URL), so "/\evil.com" and "/\t/evil.com" would
// otherwise slip through as an off-site link.
const oddCharacter = (c: string) => c === "\\" || c.charCodeAt(0) < 32 || c.charCodeAt(0) === 127;

export const safeNext = (next: string | null): string | null =>
  next && next.startsWith("/") && !next.startsWith("//") && ![...next].some(oddCharacter) ? next : null;
