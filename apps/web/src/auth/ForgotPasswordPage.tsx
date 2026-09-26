import { useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { Button } from "../ui/Button";
import { Notice, TextField } from "../ui/Form";
import { backendConfigured } from "../lib/supabase";
import { AuthShell } from "./AuthShell";
import { useAuth } from "./context";

export function ForgotPasswordPage() {
  const { requestPasswordReset } = useAuth();
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  if (!backendConfigured) return <Navigate to="/" replace />;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    const result = await requestPasswordReset(email);
    setBusy(false);
    if (result.error) setError(result.error);
    else setSent(true);
  };

  return (
    <AuthShell title="Reset your password" subtitle="Enter your email and we’ll send you a link to choose a new password." footer={<Link to="/login" className="link-tap font-semibold text-brand-500">Back to log in</Link>}>
      {sent ? (
        <Notice tone="success">If there’s an account for {email.trim()}, a reset link is on its way. Check your inbox (and spam).</Notice>
      ) : (
        <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
          {error && <Notice tone="error">{error}</Notice>}
          <TextField label="Email" type="email" name="email" autoComplete="email" inputMode="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          <Button type="submit" size="lg" full disabled={busy || !email}>{busy ? "Sending…" : "Send reset link"}</Button>
        </form>
      )}
    </AuthShell>
  );
}
