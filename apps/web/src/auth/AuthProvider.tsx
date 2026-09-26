import type { Session, SupabaseClient } from "@supabase/supabase-js";
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { arrivedFromEmailLink, backendConfigured, getClient, hasStoredSession } from "../lib/supabase";
import { AuthContext, type Auth, type AuthResult, type Profile } from "./context";
import { friendlyAuthError } from "./errors";

// Who is signed in, their profile, and whether they are an admin. The Supabase client is loaded only
// when there is something to do with it (a saved login, an email link, or someone signing in).

type State = Pick<Auth, "status" | "user" | "profile" | "isAdmin" | "degraded">;
const ANONYMOUS: State = { status: "anonymous", user: null, profile: null, isAdmin: false, degraded: false };
const RETRY_AFTER_MS = 4000;
const MAX_RETRIES = 5;

const toProfile = (row: Record<string, unknown> | null): Profile | null =>
  row
    ? {
        id: String(row.id),
        fullName: typeof row.full_name === "string" ? row.full_name : "",
        phone: typeof row.phone === "string" ? row.phone : "",
        onboardingDone: row.onboarding_done === true,
        platforms: Array.isArray(row.platforms) ? (row.platforms as string[]) : [],
        genres: Array.isArray(row.genres) ? (row.genres as string[]) : [],
      }
    : null;

const wantsClientAtStartup = () => backendConfigured && (hasStoredSession() || arrivedFromEmailLink());

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<State>(() => (wantsClientAtStartup() ? { ...ANONYMOUS, status: "loading" } : ANONYMOUS));
  const attached = useRef<Promise<SupabaseClient> | null>(null);

  const apply = useCallback(async (client: SupabaseClient, session: Session | null) => {
    if (!session) {
      setState(ANONYMOUS);
      return;
    }
    const [profile, admin] = await Promise.all([
      client.from("profiles").select("*").eq("id", session.user.id).maybeSingle(),
      client.rpc("is_admin"),
    ]);
    // A lookup that failed is not an answer: without this an admin would be told "Admins only" and a returning
    // customer treated as new because of one dropped request.
    setState({
      status: "signed-in",
      user: { id: session.user.id, email: session.user.email ?? "" },
      profile: toProfile(profile.data as Record<string, unknown> | null),
      isAdmin: admin.data === true,
      degraded: Boolean(profile.error || admin.error),
    });
  }, []);

  // Loads the client once, reads any saved session, and keeps state in step with sign-ins elsewhere
  // (another tab, an expired session). The listener defers its work: awaiting Supabase calls inside
  // the callback itself can deadlock the client.
  const attach = useCallback(() => {
    attached.current ??= (async () => {
      const client = await getClient();
      client.auth.onAuthStateChange((event, session) => {
        if (event !== "INITIAL_SESSION") setTimeout(() => void apply(client, session), 0);
      });
      const { data } = await client.auth.getSession();
      await apply(client, data.session);
      return client;
    })();
    return attached.current;
  }, [apply]);

  useEffect(() => {
    if (wantsClientAtStartup()) attach().catch(() => setState(ANONYMOUS));
  }, [attach]);

  const refresh = useCallback(async () => {
    const client = await attach();
    const { data } = await client.auth.getSession();
    await apply(client, data.session);
  }, [attach, apply]);

  // While the lookup keeps failing, try again every few seconds (a handful of times), then wait for the visitor's tap.
  const retries = useRef(0);
  useEffect(() => {
    if (!state.degraded) {
      retries.current = 0;
      return;
    }
    if (retries.current >= MAX_RETRIES) return;
    const timer = setTimeout(() => {
      retries.current += 1;
      void refresh().catch(() => undefined);
    }, RETRY_AFTER_MS);
    return () => clearTimeout(timer);
  }, [state, refresh]);

  const value = useMemo<Auth>(
    () => ({
      ...state,
      client: attach,
      refresh: async () => {
        retries.current = 0;
        await refresh();
      },

      async signIn(email, password) {
        try {
          const client = await attach();
          const { data, error } = await client.auth.signInWithPassword({ email: email.trim(), password });
          if (error) return { error: friendlyAuthError(error.message) };
          await apply(client, data.session);
          return {};
        } catch (e) {
          return { error: friendlyAuthError(e instanceof Error ? e.message : "") };
        }
      },

      async signUp({ email, password, fullName }) {
        try {
          const client = await attach();
          const { data, error } = await client.auth.signUp({
            email: email.trim(),
            password,
            options: { data: { full_name: fullName.trim() }, emailRedirectTo: `${window.location.origin}/welcome` },
          });
          if (error) return { error: friendlyAuthError(error.message) };
          if (data.session) {
            await apply(client, data.session);
            return { needsConfirmation: false };
          }
          return { needsConfirmation: true };
        } catch (e) {
          return { error: friendlyAuthError(e instanceof Error ? e.message : "") };
        }
      },

      async signOut() {
        const client = await attach();
        await client.auth.signOut();
        setState(ANONYMOUS);
      },

      async requestPasswordReset(email): Promise<AuthResult> {
        try {
          const client = await attach();
          const { error } = await client.auth.resetPasswordForEmail(email.trim(), { redirectTo: `${window.location.origin}/reset` });
          return error ? { error: friendlyAuthError(error.message) } : {};
        } catch (e) {
          return { error: friendlyAuthError(e instanceof Error ? e.message : "") };
        }
      },

      async updatePassword(password): Promise<AuthResult> {
        try {
          const client = await attach();
          const { error } = await client.auth.updateUser({ password });
          return error ? { error: friendlyAuthError(error.message) } : {};
        } catch (e) {
          return { error: friendlyAuthError(e instanceof Error ? e.message : "") };
        }
      },

      async saveProfile(changes): Promise<AuthResult> {
        if (!state.user) return { error: "Please sign in first." };
        const client = await attach();
        const base: Record<string, unknown> = {};
        if (changes.fullName !== undefined) base.full_name = changes.fullName.trim() || null;
        if (changes.phone !== undefined) base.phone = changes.phone || null;
        if (changes.onboardingDone !== undefined) base.onboarding_done = changes.onboardingDone;
        const taste: Record<string, unknown> = {};
        if (changes.platforms !== undefined) taste.platforms = changes.platforms;
        if (changes.genres !== undefined) taste.genres = changes.genres;

        let { error } = await client.from("profiles").update({ ...base, ...taste }).eq("id", state.user.id);
        // A database that predates the taste columns still saves the rest.
        if (error && Object.keys(taste).length > 0 && Object.keys(base).length > 0) ({ error } = await client.from("profiles").update(base).eq("id", state.user.id));
        if (error) return { error: error.message.includes("violates check") ? "That doesn’t look like a valid phone number." : "We couldn’t save that. Please try again." };
        setState((s) => (s.profile ? { ...s, profile: { ...s.profile, ...changes } } : s));
        return {};
      },
    }),
    [state, attach, apply, refresh],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
