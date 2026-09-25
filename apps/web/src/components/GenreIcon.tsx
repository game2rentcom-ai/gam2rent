// Keyword-matched genre icon — hand-drawn SVGs, not fetched external assets, so there's no
// licensing/availability risk and no dependency on a third-party asset CDN staying up. Genres in
// the catalog are free text (e.g. "Open-World Action", "Survival Horror", "Sports (Football)"),
// so this matches on keyword rather than an exact enum — a reasonable approximation, not a
// precise taxonomy.
export function GenreIcon({ genre, className }: { genre: string; className: string }) {
  const g = genre.toLowerCase();

  if (g.includes("horror")) return <IconWrap className={className}><path d="M10 2c-3 0-5 2.5-5 5.5 0 1.6.6 2.7 1.3 3.8.5.8.9 1.5.9 2.7v1.5a.5.5 0 00.5.5h.6v-1.2a.5.5 0 011 0V16h1v-1.2a.5.5 0 011 0V16h.6a.5.5 0 00.5-.5V14c0-1.2.4-1.9.9-2.7.7-1.1 1.3-2.2 1.3-3.8C15 4.5 13 2 10 2zM7.8 8a1 1 0 110-2 1 1 0 010 2zm4.4 0a1 1 0 110-2 1 1 0 010 2z" /></IconWrap>;
  if (g.includes("sport") || g.includes("football") || g.includes("cricket") || g.includes("basketball") || g.includes("wrestling") || g.includes("mma") || g.includes("ufc"))
    return <IconWrap className={className}><path d="M10 2a8 8 0 100 16 8 8 0 000-16zm0 1.6c1.2 0 2.4.4 3.3 1.1l-1.6 1.6-1.7-.5-.5-1.7 1.6-1.6c-.4-.1-.7-.1-1.1-.1v1.2zm-3.3 1.1L8.3 6.3l-.5 1.7-1.7.5-1.6-1.6a6.4 6.4 0 011.6-1.2zM3.6 10c0-.4 0-.7.1-1.1l1.6 1.6-.5 1.7-1.7.5A6.4 6.4 0 013.6 10zm3.1 4.7l1.6-1.6 1.7.5.5 1.7-1.6 1.6c-.8-.3-1.5-.7-2.2-1.2v-1zm6.6 1.2l-1.6-1.6.5-1.7 1.7-.5 1.6 1.6a6.4 6.4 0 01-2.2 1.2v1zm3.1-4.7l-1.6-1.6.5-1.7 1.7-.5c.1.4.1.7.1 1.1s0 .7-.1 1.1z" /></IconWrap>;
  if (g.includes("rpg") || g.includes("adventure"))
    return <IconWrap className={className}><path d="M6 2l1.5 3L11 6.5 8 8l-1 3-1-3-3-1.5L6.5 5 6 2zm8 6l1 2 2 1-2 1-1 2-1-2-2-1 2-1 1-2zM8 12l.8 1.7L10.5 14.5l-1.7.8L8 17l-.8-1.7L5.5 14.5l1.7-.8L8 12z" /></IconWrap>;
  if (g.includes("racing"))
    return <IconWrap className={className}><path fillRule="evenodd" d="M3 3h2v2H3V3zm4 0h2v2H7V3zm4 0h2v2h-2V3zm4 0h2v2h-2V3zM3 7h2v2H3V7zm8 0h2v2h-2V7zM3 11h2v2H3v-2zm4 0h2v2H7v-2zm4 0h2v2h-2v-2zm4 0h2v2h-2v-2zM9 15a1 1 0 100 2 1 1 0 000-2z" clipRule="evenodd" /></IconWrap>;
  if (g.includes("fighting"))
    return <IconWrap className={className}><path d="M3 9.5l3-1 1.5 1.5L6 11.5l-3-1v-1zm2 3l2-1 5 5-1 1-1-1-1 1-1-1 1-1-4-3zm7-9l1.5-1L15 4l-1.5 1.5L12 4l.5-.5zm-.5 4l4-2 1 1-4 2-1-1zm-1 2l5-2 1 2-5 1.5-1-1.5z" /></IconWrap>;
  if (g.includes("shooter") || g.includes("fps") || g.includes("battle royale"))
    return <IconWrap className={className}><path fillRule="evenodd" d="M10 2a1 1 0 011 1v1.06a6.01 6.01 0 015.94 5.94H18a1 1 0 110 2h-1.06A6.01 6.01 0 0111 17.94V19a1 1 0 11-2 0v-1.06A6.01 6.01 0 013.06 12H2a1 1 0 110-2h1.06A6.01 6.01 0 019 4.06V3a1 1 0 011-1zm0 4a4 4 0 100 8 4 4 0 000-8zm0 2.5a1.5 1.5 0 110 3 1.5 1.5 0 010-3z" clipRule="evenodd" /></IconWrap>;
  if (g.includes("strategy") || g.includes("moba"))
    return <IconWrap className={className}><path d="M10 2l2 3-2 1-2-1 2-3zm-5 5l2 1v3l-2 1-2-1V8l2-1zm10 0l2 1v3l-2 1-2-1V8l2-1zm-5 4l2 1v3l-2 2-2-2v-3l2-1z" /></IconWrap>;
  if (g.includes("simulation") || g.includes("sandbox"))
    return <IconWrap className={className}><path fillRule="evenodd" d="M3 5a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2h-3l1 2H7l1-2H5a2 2 0 01-2-2V5zm2 0v8h10V5H5z" clipRule="evenodd" /></IconWrap>;
  if (g.includes("survival"))
    return <IconWrap className={className}><path d="M10 2l7 3v5c0 4.4-3 7.9-7 9-4-1.1-7-4.6-7-9V5l7-3zm0 3L6 6.6V10c0 3 1.8 5.4 4 6.3 2.2-.9 4-3.3 4-6.3V6.6L10 5z" /></IconWrap>;

  // Default — a generic controller glyph for anything unmatched.
  return (
    <IconWrap className={className}>
      <path d="M6 8a3 3 0 116 0h.5a2 2 0 010 4H12v2a1 1 0 11-2 0v-2H8v2a1 1 0 11-2 0v-2h-.5a2 2 0 010-4H6zm1.5-1a1.5 1.5 0 003 0 1.5 1.5 0 00-3 0z" />
    </IconWrap>
  );
}

function IconWrap({ children, className }: { children: React.ReactNode; className: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className={className}>
      {children}
    </svg>
  );
}
