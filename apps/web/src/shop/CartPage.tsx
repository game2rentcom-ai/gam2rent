import type { SupabaseClient } from "@supabase/supabase-js";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/context";
import { PLATFORM_LABEL, type Platform } from "../data/catalogTypes";
import { useStore } from "../data/store";
import { ok, useLoad } from "../lib/api";
import { Button } from "../ui/Button";
import { Notice, TextField } from "../ui/Form";
import { etaLabel, formatPrice } from "../ui/format";
import { GameCover } from "../ui/GameCover";
import { useShop } from "./context";
import { payForCart, paymentProblem } from "./checkout";

// The cart. Every price on this page comes back from the database (quote_cart) — the browser only
// says which games are in the cart and which coupon code was typed.
interface QuoteItem { game_id: string; unit_price: number; plan_label: string | null; eta_minutes: number | null }
interface Quote {
  items: QuoteItem[]; subtotal: number; discount: number; total: number; problems: string[];
  coupon: { code: string; valid: boolean; message?: string; discount?: number; description?: string } | null;
}

async function loadQuote(client: SupabaseClient, coupon: string) {
  return (await ok(client.rpc("quote_cart", { p_coupon: coupon || null }))) as Quote;
}

export function CartPage() {
  const { client, profile } = useAuth();
  const { findGame, contactLink, setting } = useStore();
  const shop = useShop();
  const navigate = useNavigate();
  const [applied, setApplied] = useState("");
  const [draft, setDraft] = useState("");
  const [paying, setPaying] = useState(false);
  const [message, setMessage] = useState<{ tone: "info" | "error"; text: string; code?: string } | null>(null);
  const quote = useLoad(loadQuote, applied);

  if (!shop.ordering) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center gap-3 py-16 text-center">
        <h1 className="font-display text-2xl font-bold text-text-primary">Ordering opens soon</h1>
        <p className="text-sm text-text-muted">For now, pick a game and message us — we’ll confirm the price and send it over.</p>
        <Button to="/browse">Browse games</Button>
      </div>
    );
  }
  if (shop.ready === null || quote.loading) return <div className="h-64 animate-pulse rounded-2xl bg-bg-surface" aria-busy="true" aria-label="Loading your cart" />;

  const data = quote.data;
  const priced = new Map((data?.items ?? []).map((i) => [i.game_id, i]));
  const lines = shop.cart;
  const blocked = (data?.problems.length ?? 0) > 0;
  const couponNote = data?.coupon;

  const remove = async (gameId: string) => {
    setMessage(null);
    const result = await shop.removeFromCart(gameId);
    if (result.error) setMessage({ tone: "error", text: result.error });
    else quote.reload();
  };

  const pay = async () => {
    if (!data) return;
    setPaying(true);
    setMessage(null);
    try {
      const result = await payForCart(await client(), {
        coupon: couponNote?.valid ? couponNote.code : "",
        name: profile?.fullName ?? "",
        phone: profile?.phone ?? "",
        business: setting("business_name") ?? "GameBuy",
      });
      if (result.status === "paid") {
        shop.refresh();
        navigate(`/account/orders/${result.orderId}`);
      } else {
        setMessage({ tone: "info", text: "Payment cancelled — nothing was charged. Your cart is saved." });
      }
    } catch (e) {
      const problem = paymentProblem(e);
      setMessage({ tone: "error", text: problem.text, code: problem.code });
    } finally {
      setPaying(false);
    }
  };

  const whatsapp = contactLink(
    `Hi! I'd like to order: ${lines.map((l) => findGame(l.gameId)?.title ?? l.gameId).join(", ")}${data ? ` (total ${formatPrice(data.total)})` : ""}.`,
  );
  const slowest = Math.max(0, ...(data?.items ?? []).map((i) => i.eta_minutes ?? 0));

  if (lines.length === 0) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center gap-3 py-16 text-center">
        <h1 className="font-display text-2xl font-bold text-text-primary">Your cart is empty</h1>
        <p className="text-sm text-text-muted">Find a game you like and add it here.</p>
        <Button to="/browse">Browse games</Button>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-5 py-2 sm:py-6">
      <h1 className="font-display text-3xl font-bold text-text-primary">Your cart</h1>

      <ul className="flex flex-col gap-3">
        {lines.map((line) => {
          const game = findGame(line.gameId);
          const item = priced.get(line.gameId);
          const title = game?.title ?? line.gameId;
          return (
            <li key={line.gameId} className="panel flex gap-3 p-3">
              {game && <Link to={`/games/${game.id}`} aria-label={title} className="w-16 shrink-0"><GameCover game={game} className="frame w-full [--cut:8px]" /></Link>}
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <p className="truncate font-display text-sm font-bold text-text-primary">{title}</p>
                {item ? (
                  <>
                    <p className="text-xs text-text-muted">
                      {line.kind === "rent" ? `Rent · ${item.plan_label} · ${PLATFORM_LABEL[line.platform as Platform] ?? ""}` : "Buy"}
                    </p>
                    <p><span className="price-tag cut cut-tag text-base">{formatPrice(item.unit_price)}</span></p>
                  </>
                ) : (
                  <p role="alert" className="text-xs font-medium text-red-300">{title} is no longer available. Remove it to continue.</p>
                )}
                <button type="button" onClick={() => void remove(line.gameId)} aria-label={`Remove ${title}`} className="-mb-1 -ml-2 flex min-h-11 items-center self-start rounded-lg px-2 text-sm font-semibold text-text-muted hover:text-text-primary">Remove</button>
              </div>
            </li>
          );
        })}
      </ul>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          setApplied(draft.trim().toUpperCase());
        }}
        className="flex items-end gap-2"
      >
        <div className="min-w-0 flex-1"><TextField label="Coupon code" name="coupon" autoCapitalize="characters" autoComplete="off" value={draft} onChange={(e) => setDraft(e.target.value)} /></div>
        <Button type="submit" variant="secondary" disabled={!draft.trim()}>Apply</Button>
      </form>
      {couponNote && !couponNote.valid && <Notice tone="error">{couponNote.message}</Notice>}
      {couponNote?.valid && (
        <Notice tone="success">
          Code {couponNote.code} applied — you save {formatPrice(couponNote.discount ?? 0)}.{" "}
          <button type="button" onClick={() => { setApplied(""); setDraft(""); }} className="inline-flex min-h-11 items-center font-semibold underline">Remove code</button>
        </Notice>
      )}

      {data && (
        <dl className="panel hud flex flex-col gap-2 p-4 text-sm">
          <div className="flex justify-between"><dt className="text-text-muted">Subtotal</dt><dd className="text-text-primary">{formatPrice(data.subtotal)}</dd></div>
          {data.discount > 0 && <div className="flex justify-between"><dt className="text-text-muted">Discount</dt><dd className="font-semibold text-trust-600">− {formatPrice(data.discount)}</dd></div>}
          <div className="flex items-center justify-between border-t border-dashed border-border-strong pt-3 text-base font-bold"><dt className="text-text-primary">Total</dt><dd className="font-display text-2xl font-bold text-text-primary [text-shadow:0_0_22px_rgb(123_63_245/0.7)]">{formatPrice(data.total)}</dd></div>
        </dl>
      )}

      {slowest > 0 && <p className="text-sm text-text-muted">Delivery usually takes {etaLabel(slowest)} after payment. Your login details appear on your order page once delivered{profile?.phone ? `, and we’ll contact you on WhatsApp (+${profile.phone}) if we need anything` : ""}.</p>}

      {!profile?.phone && (
        <Notice tone="error">
          Add your WhatsApp number so we can deliver your game. <Link to="/account" className="link-tap font-semibold underline">Open my account</Link>
        </Notice>
      )}
      {message && (
        <Notice tone={message.tone}>
          {message.text}{" "}
          {message.code === "phone_required" && <Link to="/account" className="link-tap font-semibold underline">Open my account</Link>}
          {message.code === "payments_not_configured" && whatsapp && <a href={whatsapp} target="_blank" rel="noopener noreferrer" className="link-tap font-semibold underline">Order on WhatsApp</a>}
        </Notice>
      )}

      <Button size="lg" full onClick={() => void pay()} disabled={paying || !data || blocked || !profile?.phone}>
        {paying ? "Opening payment…" : blocked ? "Remove unavailable games to continue" : data?.total === 0 ? "Place order" : `Pay ${formatPrice(data?.total ?? 0)}`}
      </Button>
      {whatsapp && <Button href={whatsapp} variant="ghost" full>Prefer to order on WhatsApp?</Button>}
    </div>
  );
}
