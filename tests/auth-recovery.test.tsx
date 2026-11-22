import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TokenRefreshResult } from "@/lib/api";
import { testUser } from "./helpers";

const mocks = vi.hoisted(() => ({
  useAuth: vi.fn(),
  hardNavigate: vi.fn(),
  searchParams: "",
  refresh: vi.fn(),
  refreshSession: vi.fn(),
  beginSessionChange: vi.fn(),
  completeSessionChange: vi.fn(),
  signInEmail: vi.fn(),
  signUpEmail: vi.fn(),
  signInSocial: vi.fn(),
  getPublicConfig: vi.fn(),
  completeRole: vi.fn(),
  updateMyProfile: vi.fn(),
  uploadProfileImage: vi.fn(),
  toastSuccess: vi.fn(),
  toastError: vi.fn(),
}));

vi.mock("@/providers/auth-provider", () => ({
  useAuth: mocks.useAuth,
  roleHome: (role: string) => `/dashboard/${role}`,
}));

vi.mock("@/lib/navigation", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/navigation")>();
  return { ...actual, hardNavigate: mocks.hardNavigate };
});

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(mocks.searchParams),
}));

vi.mock("@/lib/auth-client", () => ({
  authClient: {
    signIn: { email: mocks.signInEmail, social: mocks.signInSocial },
    signUp: { email: mocks.signUpEmail },
  },
}));

vi.mock("@/services/config", () => ({ getPublicConfig: mocks.getPublicConfig }));

vi.mock("@/services/users", () => ({
  completeRole: mocks.completeRole,
  updateMyProfile: mocks.updateMyProfile,
}));

vi.mock("@/services/uploads", () => ({
  uploadProfileImage: mocks.uploadProfileImage,
}));

vi.mock("sonner", () => ({
  toast: { success: mocks.toastSuccess, error: mocks.toastError },
}));

vi.mock("next/image", () => ({
  default: ({ alt }: { alt: string }) => <span role="img" aria-label={alt} />,
}));

import { ChooseRoleForm } from "@/components/forms/choose-role-form";
import { SignInForm } from "@/components/forms/sign-in-form";
import { SignUpForm } from "@/components/forms/sign-up-form";

const vendor = {
  ...testUser,
  id: "vendor-1",
  name: "Test Vendor",
  role: "vendor" as const,
  businessName: "Test Kitchen",
};

function authenticated(user = testUser): TokenRefreshResult {
  return {
    kind: "authenticated",
    session: { token: "jwt", expiresIn: "15m", user },
  };
}

function unavailable(): TokenRefreshResult {
  return {
    kind: "unavailable",
    message: "We couldn't verify your session. Check your connection and try again.",
  };
}

function setAuth(overrides: Record<string, unknown> = {}) {
  mocks.useAuth.mockReturnValue({
    user: null,
    sessionState: "signedOut",
    loading: false,
    refreshing: false,
    authError: null,
    favoriteIds: [],
    refresh: mocks.refresh,
    refreshSession: mocks.refreshSession,
    beginSessionChange: mocks.beginSessionChange,
    completeSessionChange: mocks.completeSessionChange,
    setUser: vi.fn(),
    signOut: vi.fn(),
    signingOut: false,
    signOutEpoch: 0,
    toggleFavorite: vi.fn(),
    ...overrides,
  });
}

function fillCommonSignUpFields() {
  fireEvent.change(screen.getByLabelText("Full name"), {
    target: { value: "New Customer" },
  });
  fireEvent.change(screen.getByLabelText("Email"), {
    target: { value: "new@example.com" },
  });
  fireEvent.change(screen.getByLabelText("Password"), {
    target: { value: "Password1" },
  });
}

describe("post-login navigation", () => {
  beforeEach(() => {
    mocks.searchParams = "";
    mocks.hardNavigate.mockReset();
    mocks.refreshSession.mockReset();
    mocks.beginSessionChange.mockReset();
    mocks.completeSessionChange.mockReset();
    mocks.signInEmail.mockReset();
    mocks.signUpEmail.mockReset();
    mocks.getPublicConfig.mockReset();
    mocks.completeRole.mockReset();
    mocks.updateMyProfile.mockReset();
    mocks.refresh.mockReset();
    mocks.getPublicConfig.mockResolvedValue({
      googleEnabled: false,
      imgbbEnabled: false,
    });
    mocks.signInEmail.mockResolvedValue({ data: {}, error: null });
    mocks.signUpEmail.mockResolvedValue({ data: {}, error: null });
    mocks.completeRole.mockResolvedValue(undefined);
    mocks.updateMyProfile.mockResolvedValue(vendor);
    setAuth();
  });

  it("sends a verified customer to the validated next path", async () => {
    mocks.searchParams = "?next=/dashboard/customer/my-orders";
    mocks.refreshSession.mockResolvedValue(authenticated());

    render(<SignInForm />);
    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "customer@example.com" },
    });
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "Password1" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Sign in" }));

    await waitFor(() =>
      expect(mocks.hardNavigate).toHaveBeenCalledWith(
        "/dashboard/customer/my-orders",
      ),
    );
  });

  it("sends a verified vendor to the vendor dashboard", async () => {
    mocks.refreshSession.mockResolvedValue(authenticated(vendor));

    render(<SignInForm />);
    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "vendor@example.com" },
    });
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "Password1" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Sign in" }));

    await waitFor(() =>
      expect(mocks.hardNavigate).toHaveBeenCalledWith("/dashboard/vendor"),
    );
  });

  it("does not navigate when session verification is temporarily unavailable", async () => {
    mocks.refreshSession.mockResolvedValue(unavailable());

    render(<SignInForm />);
    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "customer@example.com" },
    });
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "Password1" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Sign in" }));

    await waitFor(() =>
      expect(screen.getByRole("alert").textContent).toContain(
        "couldn't confirm the session",
      ),
    );
    expect(mocks.hardNavigate).not.toHaveBeenCalled();
  });

  it("shows session-expired messaging from the sign-in link", async () => {
    mocks.searchParams = "?reason=session-expired";

    render(<SignInForm />);

    await waitFor(() =>
      expect(screen.getByRole("alert").textContent).toContain(
        "Your session has expired",
      ),
    );
  });
});

describe("sign-up recovery", () => {
  beforeEach(() => {
    mocks.hardNavigate.mockReset();
    mocks.refreshSession.mockReset();
    mocks.beginSessionChange.mockReset();
    mocks.completeSessionChange.mockReset();
    mocks.signUpEmail.mockReset();
    mocks.getPublicConfig.mockReset();
    mocks.completeRole.mockReset();
    mocks.updateMyProfile.mockReset();
    mocks.getPublicConfig.mockResolvedValue({
      googleEnabled: false,
      imgbbEnabled: false,
    });
    mocks.signUpEmail.mockResolvedValue({ data: {}, error: null });
    mocks.completeRole.mockResolvedValue(undefined);
    mocks.updateMyProfile.mockResolvedValue(vendor);
    setAuth();
  });

  it("offers a retry instead of redirecting to sign-in when verification is unavailable", async () => {
    mocks.refreshSession
      .mockResolvedValueOnce(unavailable())
      .mockResolvedValueOnce(authenticated());

    render(<SignUpForm />);
    fillCommonSignUpFields();
    fireEvent.click(screen.getByRole("button", { name: "Create account" }));

    await waitFor(() =>
      expect(screen.getByRole("alert").textContent).toContain(
        "Retry the session check",
      ),
    );
    expect(mocks.hardNavigate).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Retry session check" }));

    await waitFor(() =>
      expect(mocks.hardNavigate).toHaveBeenCalledWith("/dashboard/customer"),
    );
  });

  it("navigates a verified vendor to the vendor dashboard", async () => {
    mocks.refreshSession.mockResolvedValue(authenticated(vendor));

    render(<SignUpForm />);
    fireEvent.click(screen.getByRole("button", { name: /Vendor/ }));
    fireEvent.change(screen.getByLabelText("Business name"), {
      target: { value: "Test Kitchen" },
    });
    fillCommonSignUpFields();
    fireEvent.click(screen.getByRole("button", { name: "Create account" }));

    await waitFor(() =>
      expect(mocks.hardNavigate).toHaveBeenCalledWith("/dashboard/vendor"),
    );
    expect(mocks.completeRole).toHaveBeenCalledWith("vendor");
  });
});

describe("choose-role recovery", () => {
  beforeEach(() => {
    mocks.hardNavigate.mockReset();
    mocks.refreshSession.mockReset();
    mocks.beginSessionChange.mockReset();
    mocks.completeSessionChange.mockReset();
    mocks.refresh.mockReset();
    mocks.completeRole.mockReset();
    mocks.updateMyProfile.mockReset();
    mocks.completeRole.mockResolvedValue(vendor);
    mocks.updateMyProfile.mockResolvedValue(vendor);
  });

  it("shows a retry state instead of redirecting when the session check is unavailable", async () => {
    setAuth({
      authError: { kind: "unavailable", message: "Connection lost." },
    });

    render(<ChooseRoleForm />);

    expect(screen.getByText("Session check unavailable")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Retry" }));
    expect(mocks.refresh).toHaveBeenCalledTimes(1);
    expect(mocks.hardNavigate).not.toHaveBeenCalled();
  });

  it("sends a verified vendor to the vendor dashboard after role selection", async () => {
    setAuth({ user: { ...testUser, roleOnboarded: false } });
    mocks.refreshSession.mockResolvedValue(authenticated(vendor));

    render(<ChooseRoleForm />);
    fireEvent.click(screen.getByRole("button", { name: /Vendor/ }));
    fireEvent.change(screen.getByLabelText("Business name"), {
      target: { value: "Test Kitchen" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: "Continue to my dashboard" }),
    );

    await waitFor(() =>
      expect(mocks.hardNavigate).toHaveBeenCalledWith("/dashboard/vendor"),
    );
    expect(mocks.completeRole).toHaveBeenCalledWith("vendor");
  });

  it("retries only the session check after the role was saved", async () => {
    setAuth({ user: { ...testUser, roleOnboarded: false } });
    mocks.refreshSession
      .mockResolvedValueOnce(unavailable())
      .mockResolvedValueOnce(unavailable())
      .mockResolvedValueOnce(authenticated(vendor));

    render(<ChooseRoleForm />);
    fireEvent.click(screen.getByRole("button", { name: /Vendor/ }));
    fireEvent.change(screen.getByLabelText("Business name"), {
      target: { value: "Test Kitchen" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: "Continue to my dashboard" }),
    );

    await waitFor(() =>
      expect(screen.getByRole("alert").textContent).toContain(
        "Retry the session check",
      ),
    );
    expect(
      screen.queryByRole("button", { name: "Continue to my dashboard" }),
    ).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Retry session check" }));

    await waitFor(() => expect(mocks.refreshSession).toHaveBeenCalledTimes(2));
    expect(
      screen.getByRole("button", { name: "Retry session check" }),
    ).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Retry session check" }));

    await waitFor(() =>
      expect(mocks.hardNavigate).toHaveBeenCalledWith("/dashboard/vendor"),
    );
    expect(mocks.completeRole).toHaveBeenCalledTimes(1);
    expect(mocks.refreshSession).toHaveBeenCalledTimes(3);
  });
});
