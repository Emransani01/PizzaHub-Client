import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  useAuth: vi.fn(),
  replace: vi.fn(),
  refresh: vi.fn(),
  pathname: "/dashboard/customer",
}));

vi.mock("@/providers/auth-provider", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/providers/auth-provider")>();
  return { ...actual, useAuth: mocks.useAuth };
});

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mocks.replace, push: vi.fn(), refresh: vi.fn() }),
  usePathname: () => mocks.pathname,
}));

vi.mock("@/components/dashboard/dashboard-header", () => ({
  DashboardHeader: () => null,
}));

vi.mock("@/components/dashboard/dashboard-sidebar", () => ({
  DashboardSidebar: () => null,
}));

import DashboardLayout from "@/app/dashboard/layout";
import { PrivateRoute } from "@/components/shared/private-route";
import { testUser } from "./helpers";

function setAuth(overrides: Record<string, unknown> = {}) {
  mocks.useAuth.mockReturnValue({
    user: null,
    loading: false,
    refreshing: false,
    authError: null,
    favoriteIds: [],
    refresh: mocks.refresh,
    setUser: vi.fn(),
    signOut: vi.fn(),
    toggleFavorite: vi.fn(),
    ...overrides,
  });
}

describe("PrivateRoute auth error handling", () => {
  beforeEach(() => {
    mocks.replace.mockClear();
    mocks.refresh.mockClear();
    mocks.pathname = "/dashboard/customer";
  });

  it("shows a retry state instead of redirecting when auth is unavailable", () => {
    setAuth({
      authError: { kind: "unavailable", message: "Check your connection." },
    });

    render(
      <PrivateRoute>
        <div>Protected content</div>
      </PrivateRoute>,
    );

    expect(screen.getByRole("alert")).toBeDefined();
    expect(screen.queryByText("Protected content")).toBeNull();
    expect(mocks.replace).not.toHaveBeenCalled();

    const retry = screen.getByRole("button", { name: /retry/i });
    fireEvent.click(retry);
    expect(mocks.refresh).toHaveBeenCalledTimes(1);
  });

  it("keeps the existing sign-in redirect for a genuine signed-out state", async () => {
    setAuth();

    render(
      <PrivateRoute>
        <div>Protected content</div>
      </PrivateRoute>,
    );

    await waitFor(() =>
      expect(mocks.replace).toHaveBeenCalledWith(
        expect.stringContaining("/sign-in?next="),
      ),
    );
  });

  it("keeps dashboard access when a valid user has a transient auth error", () => {
    setAuth({
      user: testUser,
      authError: { kind: "unavailable", message: "Check your connection." },
    });

    render(
      <PrivateRoute>
        <div>Protected content</div>
      </PrivateRoute>,
    );

    expect(screen.getByText("Protected content")).toBeDefined();
    expect(mocks.replace).not.toHaveBeenCalled();
  });
});

describe("DashboardLayout auth error handling", () => {
  beforeEach(() => {
    mocks.replace.mockClear();
    mocks.refresh.mockClear();
    mocks.pathname = "/dashboard/customer";
  });

  it("shows the shared retry state when auth is unavailable and there is no user", () => {
    setAuth({
      authError: { kind: "unavailable", message: "Check your connection." },
    });

    render(
      <DashboardLayout>
        <div>Dashboard content</div>
      </DashboardLayout>,
    );

    expect(screen.getByRole("alert")).toBeDefined();
    expect(screen.queryByText("Dashboard content")).toBeNull();
    expect(mocks.replace).not.toHaveBeenCalled();
  });

  it("preserves the role redirect when a signed-in user is on the wrong dashboard", async () => {
    mocks.pathname = "/dashboard/admin";
    setAuth({ user: testUser });

    render(
      <DashboardLayout>
        <div>Dashboard content</div>
      </DashboardLayout>,
    );

    await waitFor(() =>
      expect(mocks.replace).toHaveBeenCalledWith("/dashboard/customer"),
    );
  });
});
