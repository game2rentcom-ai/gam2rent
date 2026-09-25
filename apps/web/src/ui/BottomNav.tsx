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

const item = "relative flex min-h-14 flex-1 flex-col items-center justify-center gap-0.5 text-xs font-medium transition-colors";

export function BottomNav({ onSearch, chatHref, extra = [] }: Props) {
  const linkClass = ({ isActive }: { isActive: boolean }) => `${item} ${isActive ? "text-brand-500" : "text-text-muted active:text-text-primary"}`;
  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-50 flex border-t border-white/10 bg-bg-base/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl md:hidden"
    >
      <NavLink to="/" end className={linkClass}><IconHome />Home</NavLink>
      <NavLink to="/browse" className={linkClass}><IconGrid />Browse</NavLink>
      <button type="button" onClick={onSearch} className={`${item} text-text-muted active:text-text-primary`}><IconSearch />Search</button>
      {extra.map((e) => (
        <NavLink key={e.to} to={e.to} className={linkClass}>
          <span className="relative">
            {e.icon}
            {e.badge ? <span className="absolute -right-2 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-500 px-1 text-[11px] font-bold leading-none text-white">{e.badge}</span> : null}
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
