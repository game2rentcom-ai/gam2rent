import { useEffect, useState } from "react";
import { Link, Navigate, useSearchParams } from "react-router-dom";
import { Button } from "../ui/Button";
import { CheckboxField, Notice, PasswordField, TextField } from "../ui/Form";
import { rememberReferral } from "../lib/referral";
import { backendConfigured } from "../lib/supabase";
import { AuthShell } from "./AuthShell";
import { useAuth } from "./context";
import { safeNext } from "./next";

export function SignupPage() {
  const { status, signUp } = useAuth();
  const [params] = useSearchParams();
  const next = safeNext(params.get("next"));
  const referral = params.get("ref");
  useEffect(() => rememberReferral(referral), [referral]);
  const [form, setForm] = useState({ fullName: "", email: "", password: "" });
  const [agreed, setAgreed] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState("");
  const [busy, setBusy] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);

  if (!backendConfigured) return <Navigate to="/" replace />;
  if (status === "signed-in") return <Navigate to="/welcome" replace />;

  if (sentTo) {
    return (
      <AuthShell title="Check your inbox" subtitle={`We sent a confirmation link to ${sentTo}.`}>
        <Notice tone="success">Open the email and tap the link to finish creating your account. It can take a minute; check spam if you don’t see it.</Notice>
        <Button to="/login" variant="secondary" full>Back to log in</Button>
      </AuthShell>
    );
  }

  const validate = () => {
    const found: Record<string, string> = {};
    if (!form.fullName.trim()) found.fullName = "Tell us your name.";
    if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) found.email = "Enter a valid email address.";
    if (form.password.length < 8) found.password = "Use at least 8 characters.";
    if (!agreed) found.agreed = "Please agree to continue.";
    return found;
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const found = validate();
    setErrors(found);
    if (Object.keys(found).length > 0) return;
    setBusy(true);
    setFormError("");
    const result = await signUp(form);
    setBusy(false);
    if (result.error) setFormError(result.error);
    else if (result.needsConfirmation) setSentTo(form.email.trim());
  };

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, [key]: e.target.value }));

  return (
    <AuthShell
      title="Create your account"
      subtitle="Track orders, save games to your wishlist and check out faster."
      footer={<>Already have an account? <Link to={next ? `/login?next=${encodeURIComponent(next)}` : "/login"} className="link-tap font-semibold text-brand-400">Log in</Link></>}
    >
      <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
        {formError && <Notice tone="error">{formError}</Notice>}
        <TextField label="Your name" name="name" autoComplete="name" value={form.fullName} onChange={set("fullName")} error={errors.fullName} />
        <TextField label="Email" type="email" name="email" autoComplete="email" inputMode="email" value={form.email} onChange={set("email")} error={errors.email} />
        <PasswordField label="Password" name="password" autoComplete="new-password" hint="At least 8 characters." value={form.password} onChange={set("password")} error={errors.password} />
        <div>
          <CheckboxField
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            label={<>I agree to the <Link to="/policies/terms" className="link-tap font-semibold text-brand-400">Terms</Link> and <Link to="/policies/privacy" className="link-tap font-semibold text-brand-400">Privacy Policy</Link>.</>}
          />
          {errors.agreed && <p role="alert" className="text-xs font-medium text-red-300">{errors.agreed}</p>}
        </div>
        <Button type="submit" size="lg" full disabled={busy}>{busy ? "Creating account…" : "Create account"}</Button>
      </form>
    </AuthShell>
  );
}
