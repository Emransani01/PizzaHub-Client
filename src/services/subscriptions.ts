import { apiFetch } from "@/lib/api";
import type { CheckoutStatus, SubscriptionStatus } from "@/types";

export function getSubscriptionStatus(): Promise<SubscriptionStatus> {
  return apiFetch<SubscriptionStatus>("/subscriptions/status");
}

export function createCheckoutSession(): Promise<{ url: string; sessionId: string }> {
  return apiFetch<{ url: string; sessionId: string }>("/subscriptions/checkout", {
    method: "POST",
  });
}

export function getCheckoutStatus(sessionId: string): Promise<CheckoutStatus> {
  return apiFetch<CheckoutStatus>(`/subscriptions/checkout/${sessionId}`);
}
