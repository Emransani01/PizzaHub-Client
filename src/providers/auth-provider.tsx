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
  clearAccessToken,
  errorMessage,
  fetchToken,
  type TokenResponse,
} from "@/lib/api";
import {
  addFavorite,
  listFavorites,
  removeFavorite,
} from "@/services/favorites";
import type { UserProfile } from "@/types";

interface AuthContextValue {
  user: UserProfile | null;
  loading: boolean;
  favoriteIds: string[];
  refresh: () => Promise<UserProfile | null>;
  setUser: (user: UserProfile | null) => void;
  signOut: () => Promise<void>;
  toggleFavorite: (itemId: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const REFRESH_INTERVAL_MS = 10 * 60 * 1000;

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const applySession = useCallback((session: TokenResponse | null) => {
    if (!mounted.current) return;
    setUser(session?.user ?? null);
    setLoading(false);
  }, []);

  const refresh = useCallback(async () => {
    const session = await fetchToken();
    applySession(session);
    return session?.user ?? null;
  }, [applySession]);

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

  const signOut = useCallback(async () => {
    await authClient.signOut().catch(() => undefined);
    clearAccessToken();
    setUser(null);
    setFavoriteIds([]);
    toast.success("You have been signed out.");
    router.push("/");
    router.refresh();
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
      favoriteIds,
      refresh,
      setUser,
      signOut,
      toggleFavorite,
    }),
    [user, loading, favoriteIds, refresh, signOut, toggleFavorite],
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
