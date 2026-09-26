import { Navigate, useLocation } from "react-router-dom";
import { Button } from "../ui/Button";
import { backendConfigured } from "../lib/supabase";
import { useAuth } from "./context";

function Waiting() {
  return <div className="h-64 animate-pulse rounded-2xl bg-bg-surface" aria-busy="true" aria-label="Loading" />;
}

/** Only for signed-in visitors; everyone else is sent to log in and brought back afterwards. */
export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { status } = useAuth();
  const location = useLocation();
  if (!backendConfigured) return <Navigate to="/" replace />;
  if (status === "loading") return <Waiting />;
  if (status === "anonymous") return <Navigate to={`/login?next=${encodeURIComponent(location.pathname + location.search)}`} replace />;
  return <>{children}</>;
}

/**
 * Only for admins. This screen check is a courtesy: what actually protects the data is the database,
 * which refuses every admin operation from anyone who isn't in public.admins.
 */
export function RequireAdmin({ children }: { children: React.ReactNode }) {
  const { status, isAdmin } = useAuth();
  const location = useLocation();
  if (!backendConfigured) return <Navigate to="/" replace />;
  if (status === "loading") return <Waiting />;
  if (status === "anonymous") return <Navigate to={`/login?next=${encodeURIComponent(location.pathname)}`} replace />;
  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center gap-3 py-20 text-center">
        <h1 className="font-display text-2xl font-black text-text-primary">Admins only</h1>
        <p className="max-w-sm text-sm text-text-muted">This area is for the store owner. If that’s you, ask for your account to be added as an admin.</p>
        <Button to="/">Back to the store</Button>
      </div>
    );
  }
  return <>{children}</>;
}
