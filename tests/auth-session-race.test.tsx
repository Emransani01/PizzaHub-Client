import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { jsonResponse, testUser } from "./helpers";

const mocks = vi.hoisted(() => ({
  signOut: vi.fn(),
  signInEmail: vi.fn(),
  signInSocial: vi.fn(),
  signUpEmail: vi.fn(),
  getPublicConfig: vi.fn(),
  hardNavigate: vi.fn(),
  routerPush: vi.fn(),
  routerRefresh: vi.fn(),
  toastSuccess: vi.fn(),
  toastError: vi.fn(),
  listFavorites: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mocks.routerPush,
    replace: vi.fn(),
    refresh: mocks.routerRefresh,
  }),
  useSearchParams: () => new URLSearchParams(),
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
    signIn: { email: mocks.signInEmail, social: mocks.signInSocial },
    signUp: { email: mocks.signUpEmail },
  },
}));

vi.mock("@/services/config", () => ({ getPublicConfig: mocks.getPublicConfig }));

vi.mock("@/lib/navigation", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/navigation")>();
  return { ...actual, hardNavigate: mocks.hardNavigate };
});

import { SignInForm } from "@/components/forms/sign-in-form";
import { completeAuthSessionChange, getAccessToken } from "@/lib/api";
import { AuthProvider, useAuth } from "@/providers/auth-provider";

const tokenBody = {
  token: "new-token",
  expiresIn: "15m",
  user: testUser,
};

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((res) => {
    resolve = res;
  });
  return { promise, resolve };
}

function stubFetch(handler: (call: number, init?: RequestInit) => Promise<Response>) {
  let calls = 0;
  const mock = vi.fn((_input: string | URL | Request, init?: RequestInit) => {
    calls += 1;
    return handler(calls, init);
  });
  vi.stubGlobal("fetch", mock);
  return mock;
}

function SignOutProbe() {
  const { user, refresh, signOut } = useAuth();
  return (
    <div>
      <span data-testid="user">{user?.id ?? "none"}</span>
      <button type="button" onClick={() => void refresh()}>
        Refresh
      </button>
      <button type="button" onClick={() => void signOut()}>
        Sign out
      </button>
    </div>
  );
}

async function flush() {
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
  });
}

describe("auth session race integration", () => {
  beforeEach(() => {
    completeAuthSessionChange();
    mocks.signOut.mockReset();
    mocks.signInEmail.mockReset();
    mocks.getPublicConfig.mockReset();
    mocks.hardNavigate.mockReset();
    mocks.routerPush.mockReset();
    mocks.routerRefresh.mockReset();
    mocks.toastSuccess.mockReset();
    mocks.toastError.mockReset();
    mocks.listFavorites.mockReset();
    mocks.listFavorites.mockResolvedValue({ items: [] });
    mocks.getPublicConfig.mockResolvedValue({
      googleEnabled: false,
      imgbbEnabled: false,
    });
    mocks.signInEmail.mockResolvedValue({ data: {}, error: null });
    mocks.signOut.mockResolvedValue({ data: { success: true }, error: null });
  });

  afterEach(() => {
    completeAuthSessionChange();
    vi.unstubAllGlobals();
  });

  it("keeps a newly issued session valid when an older pre-login 401 resolves", async () => {
    const oldRefresh = deferred<Response>();
    const fetchMock = stubFetch(async (call) =>
      call === 1 ? oldRefresh.promise : jsonResponse(200, tokenBody),
    );

    render(
      <AuthProvider>
        <SignInForm />
      </AuthProvider>,
    );
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));

    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "customer@example.com" },
    });
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "Password1" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Sign in" }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    await waitFor(() =>
      expect(mocks.hardNavigate).toHaveBeenCalledWith("/"),
    );
    expect(getAccessToken()).toBe("new-token");

    await act(async () => {
      oldRefresh.resolve(
        jsonResponse(401, {
          message: "Your session has expired. Please sign in again.",
          code: "SESSION_EXPIRED",
        }),
      );
      await oldRefresh.promise;
    });
    await flush();

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(getAccessToken()).toBe("new-token");
    expect(mocks.signOut).not.toHaveBeenCalled();
  });

  it("does not let a real late 200 restore the JWT after sign-out", async () => {
    const pendingRefresh = deferred<Response>();
    const fetchMock = stubFetch(async () => pendingRefresh.promise);

    render(
      <AuthProvider>
        <SignOutProbe />
      </AuthProvider>,
    );
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));

    fireEvent.click(screen.getByRole("button", { name: "Sign out" }));
    await waitFor(() =>
      expect(screen.getByTestId("user").textContent).toBe("none"),
    );
    expect(getAccessToken()).toBeNull();

    await act(async () => {
      pendingRefresh.resolve(jsonResponse(200, tokenBody));
      await pendingRefresh.promise;
    });
    await flush();

    expect(getAccessToken()).toBeNull();
    expect(screen.getByTestId("user").textContent).toBe("none");
  });

  it("shares a valid concurrent refresh without invalidating either caller", async () => {
    const fetchMock = stubFetch(async () => jsonResponse(200, tokenBody));

    render(
      <AuthProvider>
        <SignOutProbe />
      </AuthProvider>,
    );
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    await waitFor(() =>
      expect(screen.getByTestId("user").textContent).toBe(testUser.id),
    );

    fireEvent.click(screen.getByRole("button", { name: "Refresh" }));
    fireEvent.click(screen.getByRole("button", { name: "Refresh" }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    expect(getAccessToken()).toBe("new-token");
    expect(screen.getByTestId("user").textContent).toBe(testUser.id);
    expect(mocks.signOut).not.toHaveBeenCalled();
  });
});
