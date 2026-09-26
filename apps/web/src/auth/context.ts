import type { SupabaseClient } from "@supabase/supabase-js";
import { createContext, useContext } from "react";

export interface Profile {
  id: string;
  fullName: string;
  phone: string;
  onboardingDone: boolean;
  platforms: string[];
  genres: string[];
}

export type AuthStatus = "loading" | "anonymous" | "signed-in";
export interface AuthResult { error?: string }

export interface Auth {
  status: AuthStatus;
  user: { id: string; email: string } | null;
  profile: Profile | null;
  /** From the database (public.admins). The panel hides itself for others, but the DATABASE is what enforces it. */
  isAdmin: boolean;
  signIn(email: string, password: string): Promise<AuthResult>;
  signUp(input: { email: string; password: string; fullName: string }): Promise<AuthResult & { needsConfirmation?: boolean }>;
  signOut(): Promise<void>;
  requestPasswordReset(email: string): Promise<AuthResult>;
  updatePassword(password: string): Promise<AuthResult>;
  saveProfile(changes: Partial<Omit<Profile, "id">>): Promise<AuthResult>;
  /** The Supabase client, for features that talk to the API (admin, cart, orders). */
  client(): Promise<SupabaseClient>;
}

export const AuthContext = createContext<Auth | null>(null);

export function useAuth(): Auth {
  const auth = useContext(AuthContext);
  if (!auth) throw new Error("useAuth must be used inside <AuthProvider>");
  return auth;
}
