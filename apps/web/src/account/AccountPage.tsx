import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../auth/context";
import { GENRE_CHOICES } from "../auth/genres";
import { PLATFORM_LABEL, type Platform } from "../data/catalogTypes";
import { formatPhone, normalizePhone } from "../lib/phone";
import { ReferralCard } from "./ReferralCard";
import { useShop } from "../shop/context";
import { Button } from "../ui/Button";
import { Chip } from "../ui/Chip";
import { Notice, TextField } from "../ui/Form";
import { IconChevron } from "../ui/icons";

const PLATFORMS = Object.keys(PLATFORM_LABEL) as Platform[];

// The signed-in customer's home: their details, what they like, and (for an owner) the way into the
// admin panel. Orders, wishlist and support join here as those features arrive.
export function AccountPage() {
  const { user, profile, isAdmin, saveProfile, signOut } = useAuth();
  const shop = useShop();
  const [name, setName] = useState(profile?.fullName ?? "");
  const [phone, setPhone] = useState(profile?.phone ? formatPhone(profile.phone) : "");
  const [platforms, setPlatforms] = useState<string[]>(profile?.platforms ?? []);
  const [genres, setGenres] = useState<string[]>(profile?.genres ?? []);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ tone: "success" | "error"; text: string } | null>(null);

  const toggle = (list: string[], setList: (v: string[]) => void, value: string) =>
    setList(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    const digits = phone.trim() ? normalizePhone(phone) : "";
    if (digits === null) return setMessage({ tone: "error", text: "That doesn’t look like a valid WhatsApp number. Include the country code." });
    setBusy(true);
    const result = await saveProfile({ fullName: name, phone: digits, platforms, genres });
    setBusy(false);
    if (result.error) setMessage({ tone: "error", text: result.error });
    else {
      if (digits) setPhone(formatPhone(digits));
      setMessage({ tone: "success", text: "Saved." });
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 py-2 sm:py-6">
      <header>
        <h1 className="font-display text-3xl font-bold text-text-primary">My account</h1>
        <p className="mt-1 text-sm text-text-muted">{user?.email}</p>
      </header>

      {isAdmin && (
        <Link to="/admin" className="panel panel-link flex min-h-14 items-center justify-between border-brand-400/40 px-4 font-semibold text-text-primary">
          Open the admin panel
          <IconChevron className="h-5 w-5 text-accent-300" />
        </Link>
      )}

      {(shop.ordering || shop.ready) && (
        <nav aria-label="My shopping" className="panel flex flex-col overflow-hidden">
          {shop.ordering && (
            <>
              <Link to="/account/orders" className="flex min-h-14 items-center justify-between border-b border-border-subtle px-4 font-semibold text-text-primary hover:bg-white/5">
                My orders
                <IconChevron className="h-5 w-5 text-accent-300" />
              </Link>
              <Link to="/account/support" className="flex min-h-14 items-center justify-between border-b border-border-subtle px-4 font-semibold text-text-primary hover:bg-white/5">
                Help & support
                <IconChevron className="h-5 w-5 text-accent-300" />
              </Link>
            </>
          )}
          {shop.ready && (
            <Link to="/account/wishlist" className="flex min-h-14 items-center justify-between px-4 font-semibold text-text-primary hover:bg-white/5">
              My wishlist{shop.wishlist.length > 0 ? ` (${shop.wishlist.length})` : ""}
              <IconChevron className="h-5 w-5 text-accent-300" />
            </Link>
          )}
        </nav>
      )}

      {shop.ordering && <ReferralCard />}

      <form onSubmit={save} className="panel flex flex-col gap-6 p-5" noValidate>
        {message && <Notice tone={message.tone}>{message.text}</Notice>}
        <TextField label="Your name" name="name" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} />
        <TextField label="WhatsApp number" name="phone" type="tel" inputMode="tel" autoComplete="tel" hint="We use this to reach you about your orders." value={phone} onChange={(e) => setPhone(e.target.value)} />
        <fieldset>
          <legend className="mb-2 text-sm font-semibold text-text-primary">I play on</legend>
          <div className="flex flex-wrap gap-2">
            {PLATFORMS.map((p) => <Chip key={p} selected={platforms.includes(p)} onClick={() => toggle(platforms, setPlatforms, p)}>{PLATFORM_LABEL[p]}</Chip>)}
          </div>
        </fieldset>
        <fieldset>
          <legend className="mb-2 text-sm font-semibold text-text-primary">I like</legend>
          <div className="flex flex-wrap gap-2">
            {GENRE_CHOICES.map((g) => <Chip key={g} selected={genres.includes(g)} onClick={() => toggle(genres, setGenres, g)}>{g}</Chip>)}
          </div>
        </fieldset>
        <Button type="submit" size="lg" disabled={busy}>{busy ? "Saving…" : "Save changes"}</Button>
      </form>

      <Button variant="secondary" full onClick={() => void signOut()}>Log out</Button>
    </div>
  );
}
