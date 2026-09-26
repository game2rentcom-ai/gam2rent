import { NavLink } from "react-router-dom";
import { IconChat, IconGrid, IconHome, IconSearch } from "./icons";

// Phone navigation, fixed to the bottom where a thumb reaches. Every item is at least 56 px tall.
// The floating chat button that used to sit over page content is now just one of these items.
interface Props {
  onSearch: () => void;
  chatHref: string | undefined;
  /** extra items (wishlist, account, cart) are appended here as those features arrive */
  extra?: { to: string; label: string; icon: React.ReactNode; badge?: number }[];
}

// The item you are on gets a neon bar on the bar's top edge.
const item = "relative flex min-h-14 flex-1 flex-col items-center justify-center gap-0.5 text-xs font-semibold transition-colors";
const lit = "text-accent-300 before:absolute before:inset-x-5 before:top-0 before:h-0.5 before:rounded-b before:bg-accent-400 before:shadow-glow-cyan";

export function BottomNav({ onSearch, chatHref, extra = [] }: Props) {
  const linkClass = ({ isActive }: { isActive: boolean }) => `${item} ${isActive ? lit : "text-text-muted active:text-text-primary"}`;
  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-50 flex border-t border-border-strong bg-bg-base/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl md:hidden"
    >
      <NavLink to="/" end className={linkClass}><IconHome />Home</NavLink>
      <NavLink to="/browse" className={linkClass}><IconGrid />Browse</NavLink>
      <button type="button" onClick={onSearch} className={`${item} text-text-muted active:text-text-primary`}><IconSearch />Search</button>
      {extra.map((e) => (
        <NavLink key={e.to} to={e.to} className={linkClass}>
          <span className="relative">
            {e.icon}
            {e.badge ? <span className="absolute -right-2 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent-400 px-1 text-xs font-bold leading-none text-black">{e.badge}</span> : null}
          </span>
          {e.label}
        </NavLink>
      ))}
      {chatHref ? (
        <a href={chatHref} target="_blank" rel="noopener noreferrer" className={`${item} text-trust-600`}><IconChat />Chat</a>
      ) : null}
    </nav>
  );
}
