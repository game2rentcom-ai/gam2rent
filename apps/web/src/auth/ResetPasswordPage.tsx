import { useState } from "react";
import { Navigate } from "react-router-dom";
import { Button } from "../ui/Button";
import { Notice, PasswordField } from "../ui/Form";
import { backendConfigured } from "../lib/supabase";
import { AuthShell } from "./AuthShell";
import { useAuth } from "./context";

// Reached from the link in the reset email: Supabase signs the visitor in with a short-lived recovery
// session, and this page lets them choose a new password.
export function ResetPasswordPage() {
  const { status, updatePassword } = useAuth();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  if (!backendConfigured) return <Navigate to="/" replace />;
  if (status === "loading") return <div className="h-64 animate-pulse rounded-2xl bg-bg-surface" aria-busy="true" aria-label="Loading" />;

  if (status === "anonymous") {
    return (
      <AuthShell title="This link has expired" subtitle="Reset links only work once, for a short time.">
        <Button to="/forgot" full>Send me a new link</Button>
      </AuthShell>
    );
  }

  if (done) {
    return (
      <AuthShell title="Password updated">
        <Notice tone="success">Your password has been changed. You’re signed in.</Notice>
        <Button to="/account" full>Go to my account</Button>
      </AuthShell>
    );
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) return setError("Use at least 8 characters.");
    if (password !== confirm) return setError("The two passwords don’t match.");
    setBusy(true);
    setError("");
    const result = await updatePassword(password);
    setBusy(false);
    if (result.error) setError(result.error);
    else setDone(true);
  };

  return (
    <AuthShell title="Choose a new password">
      <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
        {error && <Notice tone="error">{error}</Notice>}
        <PasswordField label="New password" name="password" autoComplete="new-password" hint="At least 8 characters." value={password} onChange={(e) => setPassword(e.target.value)} />
        <PasswordField label="Repeat the password" name="confirm" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
        <Button type="submit" size="lg" full disabled={busy}>{busy ? "Saving…" : "Save password"}</Button>
      </form>
    </AuthShell>
  );
}
