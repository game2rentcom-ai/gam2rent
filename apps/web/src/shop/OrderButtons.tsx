import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth, type AuthResult } from "../auth/context";
import { Button } from "../ui/Button";
import { IconCheck } from "../ui/icons";
import { useShop, type CartLine } from "./context";

// The Buy / Rent actions when online ordering is on: "Buy now" puts the game in the cart and goes
// straight to it; "Add to cart" keeps browsing. Signed-out visitors are sent to log in and brought back.
interface Props {
  line: CartLine;
  label: string;
  /** phone bar: only the main action; panel: both */
  compact?: boolean;
}

export function OrderButtons({ line, label, compact = false }: Props) {
  const { status } = useAuth();
  const shop = useShop();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState("");
  // A returning customer's saved login is still being restored for a moment after the page opens; a tap
  // in that moment would look like a signed-out tap and send them to log in.
  const restoring = status === "loading";
  const inCart = shop.cart.some((c) => c.gameId === line.gameId && c.kind === line.kind && c.planId === line.planId && c.platform === line.platform);

  const add = async (thenGoToCart: boolean) => {
    if (status !== "signed-in") return navigate(`/login?next=${encodeURIComponent(pathname)}`);
    setBusy(true);
    setProblem("");
    const result: AuthResult = inCart ? {} : await shop.addToCart(line);
    setBusy(false);
    if (result.error) setProblem(result.error);
    else if (thenGoToCart) navigate("/cart");
  };

  return (
    <div className="flex flex-col gap-2">
      <Button size="lg" full onClick={() => void add(true)} disabled={busy || restoring}>{label}</Button>
      {!compact && (inCart
        ? <Link to="/cart" className="flex min-h-11 items-center justify-center gap-2 rounded-xl text-sm font-semibold text-trust-600 hover:underline"><IconCheck className="h-5 w-5" />In your cart · View cart</Link>
        : <Button variant="secondary" full onClick={() => void add(false)} disabled={busy || restoring}>Add to cart</Button>)}
      {problem && <p role="alert" className="text-xs font-medium text-red-300">{problem}</p>}
    </div>
  );
}
