import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  fetchToken: vi.fn(),
  replace: vi.fn(),
  routerPush: vi.fn(),
  routerRefresh: vi.fn(),
  toastSuccess: vi.fn(),
  toastError: vi.fn(),
  signOut: vi.fn(),
  listFavorites: vi.fn(),
}));

vi.mock("@/lib/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api")>();
  return { ...actual, fetchToken: mocks.fetchToken };
});

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    replace: mocks.replace,
    push: mocks.routerPush,
    refresh: mocks.routerRefresh,
  }),
}));

vi.mock("sonner", () => ({
  toast: { success: mocks.toastSuccess, error: mocks.toastError },
}));

vi.mock("@/services/favorites", () => ({
  listFavorites: mocks.listFavorites,
  addFavorite: vi.fn(),
  removeFavorite: vi.fn(),
}));

vi.mock("@/lib/auth-client", () => ({
  authClient: {
    signOut: mocks.signOut,
    signIn: { email: vi.fn(), social: vi.fn() },
  },
}));

import {
  clearAccessToken,
  getAccessToken,
  setAccessToken,
  type TokenRefreshResult,
} from "@/lib/api";
import { AuthProvider, useAuth } from "@/providers/auth-provider";
import { testUser } from "./helpers";

const authenticated: TokenRefreshResult = {
  kind: "authenticated",
  session: { token: "jwt", expiresIn: "15m", user: testUser },
};

function Probe() {
  const {
    user,
    sessionState,
    authError,
    refreshing,
    signingOut,
    favoriteIds,
    refresh,
    signOut,
  } = useAuth();
  return (
    <div>
      <span data-testid="user">{user?.id ?? "none"}</span>
      <span data-testid="session-state">{sessionState}</span>
      <span data-testid="error">
        {authError ? `${authError.kind}:${authError.message}` : "none"}
      </span>
      <span data-testid="refreshing">{String(refreshing)}</span>
      <span data-testid="signing-out">{String(signingOut)}</span>
      <span data-testid="favorites">{favoriteIds.join(",")}</span>
      <button type="button" onClick={() => void refresh()}>
        Refresh
      </button>
      <button type="button" onClick={() => void signOut()}>
        Sign out
      </button>
    </div>
  );
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((res) => {
    resolve = res;
  });
  return { promise, resolve };
}

describe("AuthProvider.refresh classification", () => {
  beforeEach(() => {
    mocks.fetchToken.mockReset();
    mocks.signOut.mockReset();
    mocks.listFavorites.mockReset();
    mocks.listFavorites.mockResolvedValue({ items: [] });
    mocks.replace.mockClear();
  });

  it("keeps an existing user when refresh is unavailable (500)", async () => {
    mocks.fetchToken
      .mockResolvedValueOnce(authenticated)
      .mockResolvedValueOnce({
        kind: "unavailable",
        message: "Check your connection and try again.",
      });

    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    );
    await waitFor(() =>
      expect(screen.getByTestId("user").textContent).toBe(testUser.id),
    );

    fireEvent.click(screen.getByRole("button", { name: "Refresh" }));

    await waitFor(() =>
      expect(screen.getByTestId("error").textContent).toBe(
        "unavailable:Check your connection and try again.",
      ),
    );
    expect(screen.getByTestId("user").textContent).toBe(testUser.id);
    expect(screen.getByTestId("session-state").textContent).toBe("unavailable");
  });

  it("keeps an existing user when refresh hits a network failure", async () => {
    mocks.fetchToken
      .mockResolvedValueOnce(authenticated)
      .mockResolvedValueOnce({
        kind: "unavailable",
        message: "We couldn't verify your session.",
      });

    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    );
    await waitFor(() =>
      expect(screen.getByTestId("user").textContent).toBe(testUser.id),
    );

    fireEvent.click(screen.getByRole("button", { name: "Refresh" }));

    await waitFor(() =>
      expect(screen.getByTestId("error").textContent).toContain("unavailable:"),
    );
    expect(screen.getByTestId("user").textContent).toBe(testUser.id);
  });

  it("clears an existing user on a genuine 401", async () => {
    mocks.fetchToken
      .mockResolvedValueOnce(authenticated)
      .mockResolvedValueOnce({
        kind: "unauthenticated",
        message: "Sign in to continue.",
      });

    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    );
    await waitFor(() =>
      expect(screen.getByTestId("user").textContent).toBe(testUser.id),
    );

    fireEvent.click(screen.getByRole("button", { name: "Refresh" }));

    await waitFor(() =>
      expect(screen.getByTestId("user").textContent).toBe("none"),
    );
    expect(screen.getByTestId("error").textContent).toBe("none");
    expect(screen.getByTestId("session-state").textContent).toBe("signedOut");
    expect(mocks.signOut).not.toHaveBeenCalled();
  });

  it("clears a stale session and removes the unusable cookie on an expired 401", async () => {
    mocks.fetchToken
      .mockResolvedValueOnce(authenticated)
      .mockResolvedValueOnce({
        kind: "unauthenticated",
        message: "Your session has expired. Please sign in again.",
        sessionExpired: true,
      });
    mocks.signOut.mockResolvedValue({ data: { success: true }, error: null });

    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    );
    await waitFor(() =>
      expect(screen.getByTestId("user").textContent).toBe(testUser.id),
    );

    fireEvent.click(screen.getByRole("button", { name: "Refresh" }));

    await waitFor(() =>
      expect(screen.getByTestId("error").textContent).toBe(
        "sessionExpired:Your session has expired. Please sign in again.",
      ),
    );
    expect(screen.getByTestId("user").textContent).toBe("none");
    expect(screen.getByTestId("session-state").textContent).toBe("signedOut");
    expect(mocks.signOut).toHaveBeenCalledTimes(1);
  });

  it("deduplicates concurrent stale 401 cleanups for the same session", async () => {
    const stale = (): TokenRefreshResult => ({
      kind: "unauthenticated",
      message: "Your session has expired. Please sign in again.",
      sessionExpired: true,
    });
    const cleanup = deferred<{ data: { success: boolean }; error: null }>();
    mocks.fetchToken
      .mockResolvedValueOnce(authenticated)
      .mockResolvedValueOnce(stale())
      .mockResolvedValueOnce(stale());
    mocks.signOut.mockReturnValue(cleanup.promise);

    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    );
    await waitFor(() =>
      expect(screen.getByTestId("user").textContent).toBe(testUser.id),
    );

    fireEvent.click(screen.getByRole("button", { name: "Refresh" }));
    fireEvent.click(screen.getByRole("button", { name: "Refresh" }));

    await waitFor(() => expect(mocks.signOut).toHaveBeenCalledTimes(1));
    cleanup.resolve({ data: { success: true }, error: null });
    await waitFor(() =>
      expect(screen.getByTestId("error").textContent).toContain(
        "sessionExpired:Your session has expired",
      ),
    );
    expect(mocks.signOut).toHaveBeenCalledTimes(1);
  });

  it("shows recovery guidance when stale cleanup resolves an error", async () => {
    mocks.fetchToken
      .mockResolvedValueOnce(authenticated)
      .mockResolvedValueOnce({
        kind: "unauthenticated",
        message: "Your session has expired. Please sign in again.",
        sessionExpired: true,
      });
    mocks.signOut.mockResolvedValue({
      data: null,
      error: { message: "Sign-out service is unavailable." },
    });

    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    );
    await waitFor(() =>
      expect(screen.getByTestId("user").textContent).toBe(testUser.id),
    );

    fireEvent.click(screen.getByRole("button", { name: "Refresh" }));

    await waitFor(() =>
      expect(screen.getByTestId("error").textContent).toContain(
        "couldn't clear the old session automatically",
      ),
    );
    expect(screen.getByTestId("error").textContent).toContain(
      "Sign-out service is unavailable.",
    );
    expect(screen.getByTestId("user").textContent).toBe("none");
  });

  it("shows recovery guidance when stale cleanup throws", async () => {
    mocks.fetchToken
      .mockResolvedValueOnce(authenticated)
      .mockResolvedValueOnce({
        kind: "unauthenticated",
        message: "Your session has expired. Please sign in again.",
        sessionExpired: true,
      });
    mocks.signOut.mockRejectedValue(new TypeError("Failed to fetch"));

    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    );
    await waitFor(() =>
      expect(screen.getByTestId("user").textContent).toBe(testUser.id),
    );

    fireEvent.click(screen.getByRole("button", { name: "Refresh" }));

    await waitFor(() =>
      expect(screen.getByTestId("error").textContent).toContain(
        "couldn't clear the old session automatically",
      ),
    );
    expect(mocks.toastError).toHaveBeenCalledWith(
      "We couldn't clear the old session automatically. Reload the page if sign-in sends you back here.",
    );
  });

  it("clears an existing user and preserves the blocked message on 403", async () => {
    mocks.fetchToken
      .mockResolvedValueOnce(authenticated)
      .mockResolvedValueOnce({
        kind: "forbidden",
        message: "This account has been blocked by an administrator.",
      });

    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    );
    await waitFor(() =>
      expect(screen.getByTestId("user").textContent).toBe(testUser.id),
    );

    fireEvent.click(screen.getByRole("button", { name: "Refresh" }));

    await waitFor(() =>
      expect(screen.getByTestId("error").textContent).toBe(
        "forbidden:This account has been blocked by an administrator.",
      ),
    );
    expect(screen.getByTestId("user").textContent).toBe("none");
  });

  it("recovers through the existing refresh retry action", async () => {
    mocks.fetchToken
      .mockResolvedValueOnce({
        kind: "unavailable",
        message: "Check your connection and try again.",
      })
      .mockResolvedValueOnce(authenticated);

    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    );
    await waitFor(() =>
      expect(screen.getByTestId("error").textContent).toContain("unavailable:"),
    );
    expect(screen.getByTestId("user").textContent).toBe("none");

    fireEvent.click(screen.getByRole("button", { name: "Refresh" }));

    await waitFor(() =>
      expect(screen.getByTestId("user").textContent).toBe(testUser.id),
    );
    expect(screen.getByTestId("error").textContent).toBe("none");
  });
});

describe("AuthProvider.signOut", () => {
  beforeEach(() => {
    mocks.fetchToken.mockReset();
    mocks.fetchToken.mockResolvedValueOnce(authenticated);
    mocks.signOut.mockReset();
    mocks.listFavorites.mockReset();
    mocks.listFavorites.mockResolvedValue({ items: [{ id: "fav-1" }] });
    mocks.toastSuccess.mockClear();
    mocks.toastError.mockClear();
    mocks.routerPush.mockClear();
    mocks.routerRefresh.mockClear();
    setAccessToken("jwt-token");
  });

  afterEach(() => {
    clearAccessToken();
  });

  async function renderSignedIn() {
    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    );
    await waitFor(() =>
      expect(screen.getByTestId("user").textContent).toBe(testUser.id),
    );
    await waitFor(() =>
      expect(screen.getByTestId("favorites").textContent).toBe("fav-1"),
    );
  }

  function expectSessionPreserved() {
    expect(screen.getByTestId("user").textContent).toBe(testUser.id);
    expect(screen.getByTestId("favorites").textContent).toBe("fav-1");
    expect(getAccessToken()).toBe("jwt-token");
    expect(mocks.toastSuccess).not.toHaveBeenCalled();
    expect(mocks.routerPush).not.toHaveBeenCalled();
    expect(mocks.routerRefresh).not.toHaveBeenCalled();
  }

  it("clears the local session, toasts success and redirects after confirmed success", async () => {
    mocks.signOut.mockResolvedValue({
      data: { success: true },
      error: null,
    });

    await renderSignedIn();
    fireEvent.click(screen.getByRole("button", { name: "Sign out" }));

    await waitFor(() =>
      expect(screen.getByTestId("user").textContent).toBe("none"),
    );
    expect(screen.getByTestId("favorites").textContent).toBe("");
    expect(getAccessToken()).toBeNull();
    expect(mocks.toastSuccess).toHaveBeenCalledWith("You have been signed out.");
    expect(mocks.toastError).not.toHaveBeenCalled();
    expect(mocks.routerPush).toHaveBeenCalledWith("/");
    expect(mocks.routerRefresh).toHaveBeenCalledTimes(1);
  });

  it("preserves the session when Better Auth returns an error object", async () => {
    mocks.signOut.mockResolvedValue({
      data: null,
      error: {
        status: 503,
        statusText: "Service Unavailable",
        message: "Sign-out service is unavailable.",
      },
    });

    await renderSignedIn();
    fireEvent.click(screen.getByRole("button", { name: "Sign out" }));

    await waitFor(() =>
      expect(mocks.toastError).toHaveBeenCalledWith(
        "Sign-out service is unavailable.",
      ),
    );
    expectSessionPreserved();
  });

  it("preserves the session when the logout request throws a network error", async () => {
    mocks.signOut.mockRejectedValue(new TypeError("Failed to fetch"));

    await renderSignedIn();
    fireEvent.click(screen.getByRole("button", { name: "Sign out" }));

    await waitFor(() =>
      expect(mocks.toastError).toHaveBeenCalledWith(
        "We couldn't sign you out. Check your connection and try again.",
      ),
    );
    expectSessionPreserved();
  });

  it("does not redirect when a resolved response reports unsuccessful logout", async () => {
    mocks.signOut.mockResolvedValue({
      data: { success: false },
      error: null,
    });

    await renderSignedIn();
    fireEvent.click(screen.getByRole("button", { name: "Sign out" }));

    await waitFor(() => expect(mocks.toastError).toHaveBeenCalledTimes(1));
    expectSessionPreserved();
  });

  it("deduplicates concurrent logout attempts while one request is in flight", async () => {
    const pending = deferred<{ data: { success: boolean }; error: null }>();
    mocks.signOut.mockReturnValue(pending.promise);

    await renderSignedIn();
    const button = screen.getByRole("button", { name: "Sign out" });
    fireEvent.click(button);
    fireEvent.click(button);

    expect(mocks.signOut).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId("signing-out").textContent).toBe("true");

    pending.resolve({ data: { success: true }, error: null });

    await waitFor(() =>
      expect(screen.getByTestId("user").textContent).toBe("none"),
    );
    expect(screen.getByTestId("signing-out").textContent).toBe("false");
    expect(getAccessToken()).toBeNull();
    expect(mocks.routerPush).toHaveBeenCalledWith("/");
  });

  it("does not let an in-flight refresh restore the user after sign-out", async () => {
    const pendingRefresh = deferred<TokenRefreshResult>();
    mocks.fetchToken.mockReturnValueOnce(pendingRefresh.promise);
    mocks.signOut.mockResolvedValue({ data: { success: true }, error: null });

    await renderSignedIn();
    fireEvent.click(screen.getByRole("button", { name: "Refresh" }));
    await waitFor(() =>
      expect(screen.getByTestId("refreshing").textContent).toBe("true"),
    );

    fireEvent.click(screen.getByRole("button", { name: "Sign out" }));
    await waitFor(() =>
      expect(screen.getByTestId("user").textContent).toBe("none"),
    );

    pendingRefresh.resolve(authenticated);

    await waitFor(() =>
      expect(screen.getByTestId("refreshing").textContent).toBe("false"),
    );
    expect(screen.getByTestId("user").textContent).toBe("none");
    expect(screen.getByTestId("session-state").textContent).toBe("signedOut");
    expect(getAccessToken()).toBeNull();
  });
});
