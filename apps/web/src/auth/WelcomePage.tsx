import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { PLATFORM_LABEL, type Platform } from "../data/catalogTypes";
import { formatPhone, normalizePhone } from "../lib/phone";
import { Button } from "../ui/Button";
import { Chip } from "../ui/Chip";
import { Notice, TextField } from "../ui/Form";
import { useAuth } from "./context";
import { GENRE_CHOICES } from "./genres";

// First-time setup, three short steps: who you are and how to reach you (needed for delivery), what
// you play on, and what you like. The last two are skippable and feed the "picked for you" suggestions.
const PLATFORMS = Object.keys(PLATFORM_LABEL) as Platform[];

export function WelcomePage() {
  const { status, profile, saveProfile } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [name, setName] = useState(profile?.fullName ?? "");
  const [phone, setPhone] = useState(profile?.phone ? formatPhone(profile.phone) : "");
  const [platforms, setPlatforms] = useState<string[]>(profile?.platforms ?? []);
  const [genres, setGenres] = useState<string[]>(profile?.genres ?? []);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  if (status === "loading") return <div className="h-64 animate-pulse rounded-2xl bg-bg-surface" aria-busy="true" aria-label="Loading" />;
  if (status === "anonymous") return <Navigate to="/login?next=/welcome" replace />;

  const toggle = (list: string[], setList: (v: string[]) => void, value: string) =>
    setList(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);

  const finish = async (skipTaste = false) => {
    setBusy(true);
    const result = await saveProfile({ onboardingDone: true, ...(skipTaste ? {} : { platforms, genres }) });
    setBusy(false);
    if (result.error) setError(result.error);
    else navigate("/", { replace: true });
  };

  const continueFromDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    const digits = normalizePhone(phone);
    if (!name.trim()) return setError("Tell us your name.");
    if (!digits) return setError("Enter a WhatsApp number we can reach you on, including the country code.");
    setBusy(true);
    setError("");
    const result = await saveProfile({ fullName: name, phone: digits });
    setBusy(false);
    if (result.error) return setError(result.error);
    setPhone(formatPhone(digits));
    setStep(2);
  };

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-6 py-6 sm:py-12">
      <div>
        <p className="text-xs font-bold uppercase tracking-wider text-brand-500">Step {step} of 3</p>
        <div className="mt-2 flex gap-1.5" aria-hidden="true">
          {[1, 2, 3].map((n) => <span key={n} className={`h-1.5 flex-1 rounded-full ${n <= step ? "bg-brand-500" : "bg-white/10"}`} />)}
        </div>
      </div>

      {error && <Notice tone="error">{error}</Notice>}

      {step === 1 && (
        <form onSubmit={continueFromDetails} className="flex flex-col gap-4" noValidate>
          <div>
            <h1 className="font-display text-3xl font-black text-text-primary">Let’s get you set up</h1>
            <p className="mt-2 text-sm text-text-muted">We use your WhatsApp number to reach you about your orders, so we need one that works.</p>
          </div>
          <TextField label="Your name" name="name" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} />
          <TextField label="WhatsApp number" name="phone" type="tel" inputMode="tel" autoComplete="tel" hint="With country code, e.g. +91 98765 43210. A 10-digit number is taken as India." value={phone} onChange={(e) => setPhone(e.target.value)} />
          <Button type="submit" size="lg" full disabled={busy}>{busy ? "Saving…" : "Continue"}</Button>
          <Button variant="ghost" full onClick={() => void finish(true)} disabled={busy}>Skip for now</Button>
        </form>
      )}

      {step === 2 && (
        <div className="flex flex-col gap-4">
          <div>
            <h1 className="font-display text-3xl font-black text-text-primary">What do you play on?</h1>
            <p className="mt-2 text-sm text-text-muted">Pick as many as you like — we’ll show games that fit.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {PLATFORMS.map((p) => <Chip key={p} selected={platforms.includes(p)} onClick={() => toggle(platforms, setPlatforms, p)}>{PLATFORM_LABEL[p]}</Chip>)}
          </div>
          <Button size="lg" full onClick={() => setStep(3)}>Continue</Button>
          <Button variant="ghost" full onClick={() => setStep(3)}>Skip</Button>
        </div>
      )}

      {step === 3 && (
        <div className="flex flex-col gap-4">
          <div>
            <h1 className="font-display text-3xl font-black text-text-primary">What do you like?</h1>
            <p className="mt-2 text-sm text-text-muted">Choose your favourite kinds of game.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {GENRE_CHOICES.map((g) => <Chip key={g} selected={genres.includes(g)} onClick={() => toggle(genres, setGenres, g)}>{g}</Chip>)}
          </div>
          <Button size="lg" full onClick={() => void finish()} disabled={busy}>{busy ? "Saving…" : "Finish"}</Button>
          <Button variant="ghost" full onClick={() => void finish(true)} disabled={busy}>Skip</Button>
        </div>
      )}
    </div>
  );
}
