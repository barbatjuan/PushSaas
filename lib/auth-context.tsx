"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import type { Session, User } from "@supabase/supabase-js";

// Create a dedicated browser client for auth state
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  // Fail early in dev so it's obvious
  // eslint-disable-next-line no-console
  console.warn("Supabase env vars missing: NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY");
}

export const supabaseBrowser = createClient(supabaseUrl!, supabaseAnonKey!);

export type AuthContextValue = {
  user: User | null;
  session: Session | null;
  loading: boolean;
  // Auth actions
  signInWithEmailPassword: (email: string, password: string) => Promise<{ error: any } | void>;
  signUpWithEmailPassword: (email: string, password: string) => Promise<{ error: any } | void>;
  signInWithMagicLink: (email: string, redirectTo?: string) => Promise<{ error: any } | void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const init = async () => {
      setLoading(true);
      const {
        data: { session },
      } = await supabaseBrowser.auth.getSession();
      if (!isMounted) return;
      setSession(session ?? null);
      setUser(session?.user ?? null);
      setLoading(false);
    };

    init();

    const { data: sub } = supabaseBrowser.auth.onAuthStateChange((_event, newSession) => {
      if (!isMounted) return;
      setSession(newSession ?? null);
      setUser(newSession?.user ?? null);
    });

    return () => {
      isMounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    user,
    session,
    loading,
    async signInWithEmailPassword(email: string, password: string) {
      const { error } = await supabaseBrowser.auth.signInWithPassword({ email, password });
      if (error) return { error };
    },
    async signUpWithEmailPassword(email: string, password: string) {
      const { error } = await supabaseBrowser.auth.signUp({ email, password });
      if (error) return { error };
    },
    async signInWithMagicLink(email: string, redirectTo?: string) {
      const { error } = await supabaseBrowser.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: redirectTo,
        },
      });
      if (error) return { error };
    },
    async signOut() {
      await supabaseBrowser.auth.signOut();
    },
  }), [user, session, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
