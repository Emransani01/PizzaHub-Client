"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";
import { clearAccessToken, errorMessage, fetchToken } from "@/lib/api";
import {
  addFavorite,
  listFavorites,
  removeFavorite,
} from "@/services/favorites";
import type { UserProfile } from "@/types";

/** Non-destructive auth failures that protected routes need to distinguish. */
export interface AuthError {
  kind: "forbidden" | "unavailable";
  message: string;
}

interface AuthContextValue {
  user: UserProfile | null;
  loading: boolean;
  refreshing: boolean;
  authError: AuthError | null;
  favoriteIds: string[];
  /** Existing retry entry point; the auth-error panel calls this directly. */
  refresh: () => Promise<UserProfile | null>;
  setUser: (user: UserProfile | null) => void;
  signOut: () => Promise<void>;
  signingOut: boolean;
  /**
   * Incremented only after Better Auth confirms a successful sign-out. The cart
   * provider uses this to distinguish a real sign-out from a transient auth
   * failure, which must never destroy the stored cart.
   */
  signOutEpoch: number;
  toggleFavorite: (itemId: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const REFRESH_INTERVAL_MS = 10 * 60 * 1000;
const SIGN_OUT_ERROR_MESSAGE =
  "We couldn't sign you out. Check your connection and try again.";

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [signOutEpoch, setSignOutEpoch] = useState(0);
  const signOutPromise = useRef<Promise<void> | null>(null);
  const [authError, setAuthError] = useState<AuthError | null>(null);
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const refresh = useCallback(async () => {
    if (mounted.current) setRefreshing(true);

    try {
      const result = await fetchToken();
      if (!mounted.current) {
        return result.kind === "authenticated" ? result.session.user : null;
      }

      switch (result.kind) {
        case "authenticated":
          setUser(result.session.user);
          setAuthError(null);
          setLoading(false);
          return result.session.user;
        case "unauthenticated":
          // A genuine 401 is the only case that clears a valid session.
          setUser(null);
          setAuthError(null);
          setLoading(false);
          return null;
        case "forbidden":
          setUser(null);
          setAuthError({ kind: "forbidden", message: result.message });
          setLoading(false);
          return null;
        case "unavailable":
          // Keep both the user and the in-memory token untouched.
          setAuthError({ kind: "unavailable", message: result.message });
          setLoading(false);
          return null;
      }
    } finally {
      if (mounted.current) setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void refresh();

    // The JWT is short-lived, so keep the in-memory copy warm while the tab
    // stays open instead of waiting for a 401 on the next request.
    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") void refresh();
    }, REFRESH_INTERVAL_MS);

    const onVisible = () => {
      if (document.visibilityState === "visible") void refresh();
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [refresh]);

  useEffect(() => {
    if (!user || user.role !== "customer") {
      setFavoriteIds([]);
      return;
    }

    let cancelled = false;
    listFavorites()
      .then((result) => {
        if (!cancelled) setFavoriteIds(result.items.map((item) => item.id));
      })
      .catch(() => {
        if (!cancelled) setFavoriteIds([]);
      });

    return () => {
      cancelled = true;
    };
  }, [user]);

  const signOut = useCallback(() => {
    // Concurrent clicks share one request instead of issuing duplicate
    // Better Auth sign-out calls.
    if (signOutPromise.current) return signOutPromise.current;

    const operation = (async () => {
      if (mounted.current) setSigningOut(true);

      try {
        // Better Auth resolves with `{ data, error }`; it does not necessarily
        // throw when the request fails, so success must be confirmed explicitly.
        const result = await authClient.signOut();

        if (result?.error || !result?.data?.success) {
          const message =
            typeof result?.error?.message === "string" &&
            result.error.message.trim().length > 0
              ? result.error.message
              : SIGN_OUT_ERROR_MESSAGE;
          toast.error(message);
          return;
        }

        // Only a confirmed success may destroy local session state.
        clearAccessToken();
        if (mounted.current) {
          setUser(null);
          setFavoriteIds([]);
          setSignOutEpoch((value) => value + 1);
        }
        toast.success("You have been signed out.");
        router.push("/");
        router.refresh();
      } catch {
        toast.error(SIGN_OUT_ERROR_MESSAGE);
      } finally {
        if (mounted.current) setSigningOut(false);
      }
    })();

    signOutPromise.current = operation;
    void operation.finally(() => {
      signOutPromise.current = null;
    });

    return operation;
  }, [router]);

  const toggleFavorite = useCallback(
    async (itemId: string) => {
      if (!user) {
        toast.error("Sign in to save favourites.");
        return;
      }
      if (user.role !== "customer") {
        toast.error("Only customer accounts can save favourites.");
        return;
      }

      const isSaved = favoriteIds.includes(itemId);
      setFavoriteIds((current) =>
        isSaved
          ? current.filter((id) => id !== itemId)
          : [...current, itemId],
      );

      try {
        const result = isSaved
          ? await removeFavorite(itemId)
          : await addFavorite(itemId);
        setFavoriteIds(result.favorites);
        toast.success(
          isSaved ? "Removed from favourites." : "Saved to favourites.",
        );
      } catch (error) {
        setFavoriteIds((current) =>
          isSaved ? [...current, itemId] : current.filter((id) => id !== itemId),
        );
        toast.error(errorMessage(error));
      }
    },
    [favoriteIds, user],
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      refreshing,
      authError,
      favoriteIds,
      refresh,
      setUser,
      signOut,
      signingOut,
      signOutEpoch,
      toggleFavorite,
    }),
    [
      user,
      loading,
      refreshing,
      authError,
      favoriteIds,
      refresh,
      signOut,
      signingOut,
      signOutEpoch,
      toggleFavorite,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside <AuthProvider>.");
  }
  return context;
}

export function roleHome(role: UserProfile["role"]): string {
  if (role === "admin") return "/dashboard/admin";
  if (role === "vendor") return "/dashboard/vendor";
  return "/dashboard/customer";
}
