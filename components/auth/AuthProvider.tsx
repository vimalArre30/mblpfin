"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type AuthContextValue = {
  /** Current Supabase user, or null when signed out. */
  user: User | null;
  /** True while the initial client-side hydration is settling. */
  loading: boolean;
};

const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
});

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

/**
 * Property-wide auth identity layer.
 *
 * The root layout (`app/layout.tsx`) reads the Supabase session on the server
 * via cookies and passes the resulting `User` (or null) here as `initialUser`.
 * On mount, this provider subscribes to `onAuthStateChange` so that subsequent
 * sign-ins, sign-outs, and token refreshes propagate to every consumer
 * (Navbar, UserMenu, etc.) without a full page reload.
 *
 * This is the single source of truth for "is the user signed in" across all
 * routes — marketing pages, /writing, /pro, /pricing, and /tracker. Before
 * this layer existed, only /tracker pages knew about auth; the marketing site
 * rendered as if everyone was anonymous.
 */
export function AuthProvider({
  initialUser,
  children,
}: {
  initialUser: User | null;
  children: ReactNode;
}) {
  const [user, setUser] = useState<User | null>(initialUser);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Read the current user from anywhere in the client component tree.
 *
 * Returns `{ user, loading }`. `user` is null when signed out. `loading` is
 * true only during the brief window between server-rendered HTML and the
 * first onAuthStateChange callback firing — most consumers can ignore it.
 */
export function useUser() {
  return useContext(AuthContext);
}
