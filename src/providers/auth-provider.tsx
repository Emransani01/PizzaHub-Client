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
import {
  beginAuthSessionChange,
  completeAuthSessionChange,
  errorMessage,
  fetchToken,
  getAuthEpoch,
  isStaleTokenResult,
  type TokenRefreshResult,
} from "@/lib/api";
import {
  addFavorite,
  listFavorites,
  removeFavorite,
} from "@/services/favorites";
import type { UserProfile } from "@/types";

/** Non-destructive auth failures that protected routes need to distinguish. */
export interface AuthError {
  kind: "forbidden" | "unavailable" | "sessionExpired";
  message: string;
}

/**
 * Explicit session state so the UI never treats a temporary verification
 * failure as a genuine sign-out.
 */
export type SessionState =
  | "loading"
  | "authenticated"
  | "signedOut"
  | "unavailable";

interface AuthContextValue {
  user: UserProfile | null;
  sessionState: SessionState;
  loading: boolean;
  refreshing: boolean;
  authError: AuthError | null;
  favoriteIds: string[];
  /** Existing retry entry point; the auth-error panel calls this directly. */
  refresh: () => Promise<UserProfile | null>;
  /** Full classified result, used by recovery flows that need to retry safely. */
  refreshSession: () => Promise<TokenRefreshResult>;
  /**
   * Called before Better Auth establishes a new session. Waits for any older
   * stale-cookie cleanup so its cookie-expiring response cannot land after the
   * new cookie is set.
   */
  beginSessionChange: () => Promise<void>;
  /** Called after a new session is confirmed, or after a confirmed sign-out. */
  completeSessionChange: () => void;
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
const SESSION_EXPIRED_MESSAGE =
  "Your session has expired. Please sign in again.";
const STALE_CLEANUP_FAILED_MESSAGE =
  "We couldn't clear the old session automatically. Reload the page if sign-in sends you back here.";

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [sessionState, setSessionState] = useState<SessionState>("loading");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [signOutEpoch, setSignOutEpoch] = useState(0);
  const signOutPromise = useRef<Promise<void> | null>(null);
  const [authError, setAuthError] = useState<AuthError | null>(null);
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const mounted = useRef(true);
  /**
   * A sign-out invalidates every refresh that started before it. Without this,
   * an in-flight token exchange could restore the user after logout.
   */
  const sessionGeneration = useRef(0);
  /**
   * One cleanup per auth epoch. Concurrent stale 401s share the same Better
   * Auth sign-out instead of racing multiple cookie-expiring responses.
   */
  const staleCleanup = useRef<{
    epoch: number;
    promise: Promise<void>;
  } | null>(null);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  /** Best-effort removal of a stale HttpOnly session cookie after a 401. */
  const clearStaleSessionCookie = useCallback(async (epoch: number) => {
    // Never sign out on behalf of a result from a replaced session.
    if (epoch !== getAuthEpoch()) return;

    const pending = staleCleanup.current;
    if (pending?.epoch === epoch) return pending.promise;

    const operation = (async () => {
      const reportFailure = (detail?: string) => {
        if (!mounted.current || epoch !== getAuthEpoch()) return;
        const message = detail ?? STALE_CLEANUP_FAILED_MESSAGE;
        setAuthError({
          kind: "sessionExpired",
          message: `${SESSION_EXPIRED_MESSAGE} ${message}`,
        });
        toast.error(STALE_CLEANUP_FAILED_MESSAGE);
      };

      try {
        // Better Auth resolves with `{ data, error }`; it may not throw.
        const result = await authClient.signOut();
        if (result?.error || !result?.data?.success) {
          const detail =
            typeof result?.error?.message === "string" &&
            result.error.message.trim().length > 0
              ? `${STALE_CLEANUP_FAILED_MESSAGE} (${result.error.message})`
              : STALE_CLEANUP_FAILED_MESSAGE;
          reportFailure(detail);
        }
      } catch {
        reportFailure();
      }
    })();

    staleCleanup.current = { epoch, promise: operation };
    void operation.finally(() => {
      if (staleCleanup.current?.promise === operation) {
        staleCleanup.current = null;
      }
    });

    return operation;
  }, []);

  const beginSessionChange = useCallback(async () => {
    // Capture first: an old cleanup's response carries a Set-Cookie that must
    // finish before a newly issued session cookie can be stored by the browser.
    const pendingCleanup = staleCleanup.current?.promise;
    sessionGeneration.current += 1;
    beginAuthSessionChange();
    if (pendingCleanup) await pendingCleanup;
  }, []);

  const completeSessionChange = useCallback(() => {
    sessionGeneration.current += 1;
    completeAuthSessionChange();
    if (mounted.current) setRefreshing(false);
  }, []);

  const refreshSession = useCallback(async (): Promise<TokenRefreshResult> => {
    const generation = sessionGeneration.current;
    if (mounted.current) setRefreshing(true);

    try {
      const result = await fetchToken();

      // A confirmed sign-out, a session change or an unmount invalidates this
      // result entirely. In particular, an old stale 401 must never reach the
      // cookie-clearing branch after a newer login.
      if (
        !mounted.current ||
        generation !== sessionGeneration.current ||
        isStaleTokenResult(result)
      ) {
        return { kind: "unauthenticated", message: "Session changed." };
      }

      switch (result.kind) {
        case "authenticated":
          setUser(result.session.user);
          setSessionState("authenticated");
          setAuthError(null);
          setLoading(false);
          break;
        case "unauthenticated":
          // A genuine 401 is the only case that clears a valid session.
          setUser(null);
          setFavoriteIds([]);
          setSessionState("signedOut");
          setAuthError(
            result.sessionExpired
              ? { kind: "sessionExpired", message: SESSION_EXPIRED_MESSAGE }
              : null,
          );
          setLoading(false);
          if (result.sessionExpired) {
            // Use the result's own epoch, not the current one: a session change
            // between validation and cleanup must invalidate this cleanup too.
            void clearStaleSessionCookie(result.epoch ?? getAuthEpoch());
          }
          break;
        case "forbidden":
          setUser(null);
          setFavoriteIds([]);
          setSessionState("signedOut");
          setAuthError({ kind: "forbidden", message: result.message });
          setLoading(false);
          break;
        case "unavailable":
          // Keep both the user and the in-memory token untouched. The explicit
          // state lets consumers show retry instead of a Sign In prompt.
          setSessionState("unavailable");
          setAuthError({ kind: "unavailable", message: result.message });
          setLoading(false);
          break;
      }

      return result;
    } finally {
      if (
        mounted.current &&
        generation === sessionGeneration.current
      ) {
        setRefreshing(false);
      }
    }
  }, [clearStaleSessionCookie]);

  const refresh = useCallback(async () => {
    const result = await refreshSession();
    return result.kind === "authenticated" ? result.session.user : null;
  }, [refreshSession]);

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

  const updateUser = useCallback((next: UserProfile | null) => {
    setUser(next);
    setSessionState(next ? "authenticated" : "signedOut");
    if (!next) setAuthError(null);
  }, []);

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

        // Only a confirmed success may destroy local session state. The epoch
        // bump also prevents an older refresh from restoring the JWT.
        completeSessionChange();
        if (mounted.current) {
          setUser(null);
          setFavoriteIds([]);
          setSessionState("signedOut");
          setAuthError(null);
          setRefreshing(false);
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
  }, [completeSessionChange, router]);

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
      sessionState,
      loading,
      refreshing,
      authError,
      favoriteIds,
      refresh,
      refreshSession,
      beginSessionChange,
      completeSessionChange,
      setUser: updateUser,
      signOut,
      signingOut,
      signOutEpoch,
      toggleFavorite,
    }),
    [
      user,
      sessionState,
      loading,
      refreshing,
      authError,
      favoriteIds,
      refresh,
      refreshSession,
      beginSessionChange,
      completeSessionChange,
      updateUser,
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
