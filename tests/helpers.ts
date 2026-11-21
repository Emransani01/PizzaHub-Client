import type { UserProfile } from "@/types";

export const testUser: UserProfile = {
  id: "user-1",
  name: "Test Customer",
  email: "test@example.com",
  image: null,
  role: "customer",
  businessName: null,
  isBlocked: false,
  roleOnboarded: true,
  subscriptionPlan: "free",
  subscriptionExpiresAt: null,
  createdAt: null,
  favoritesCount: 0,
};

/** Minimal fetch Response stand-in that works in jsdom without global Response. */
export function jsonResponse(status: number, body: unknown): Response {
  return {
    status,
    ok: status >= 200 && status < 300,
    headers: {
      get: (name: string) =>
        name.toLowerCase() === "content-type" ? "application/json" : null,
    },
    json: async () => body,
    text: async () => JSON.stringify(body),
  } as unknown as Response;
}
