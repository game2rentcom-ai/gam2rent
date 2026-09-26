import { useState } from "react";
import { Link, Navigate, useSearchParams } from "react-router-dom";
import { Button } from "../ui/Button";
import { Notice, PasswordField, TextField } from "../ui/Form";
import { backendConfigured } from "../lib/supabase";
import { AuthShell } from "./AuthShell";
import { useAuth } from "./context";
import { safeNext } from "./next";

export function LoginPage() {
  const { status, profile, signIn } = useAuth();
  const [params] = useSearchParams();
  const next = safeNext(params.get("next"));
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  if (!backendConfigured) return <Navigate to="/" replace />;
  if (status === "signed-in") return <Navigate to={next ?? (profile && !profile.onboardingDone ? "/welcome" : "/account")} replace />;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    const result = await signIn(email, password);
    setBusy(false);
    // On success the signed-in redirect above takes over, so a first login lands on set-up and the rest on /account.
    if (result.error) setError(result.error);
  };

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Log in to see your orders, wishlist and account."
      footer={<>New here? <Link to={next ? `/signup?next=${encodeURIComponent(next)}` : "/signup"} className="link-tap font-semibold text-brand-400">Create an account</Link></>}
    >
      <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
        {error && <Notice tone="error">{error}</Notice>}
        <TextField label="Email" type="email" name="email" autoComplete="email" inputMode="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        <PasswordField label="Password" name="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
        <Button type="submit" size="lg" full disabled={busy || !email || !password}>{busy ? "Logging in…" : "Log in"}</Button>
        <Link to="/forgot" className="-my-1 flex min-h-11 items-center justify-center text-sm font-semibold text-text-muted hover:text-text-primary">Forgot your password?</Link>
      </form>
    </AuthShell>
  );
}
