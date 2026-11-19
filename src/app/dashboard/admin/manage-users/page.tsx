"use client";

import { useCallback, useEffect, useState } from "react";
import { Ban, Loader2, RotateCcw, Search, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/page-header";
import { ROLE_LABELS } from "@/constants";
import { errorMessage } from "@/lib/api";
import { cn, formatDate } from "@/lib/utils";
import { listUsers, setUserBlocked } from "@/services/users";
import type { AdminUser, Paginated, UserRole } from "@/types";

type RoleFilter = UserRole | "all";

type SubscriptionState =
  | "active"
  | "expired"
  | "not-started"
  | "not-applicable";

const SUBSCRIPTION_STATE_LABELS: Record<SubscriptionState, string> = {
  active: "Active",
  expired: "Expired",
  "not-started": "Not started",
  "not-applicable": "Not applicable",
};

const SUBSCRIPTION_STATE_CLASSES: Record<SubscriptionState, string> = {
  active: "bg-emerald-100 text-emerald-800",
  expired: "bg-brand-red/10 text-brand-red",
  "not-started": "bg-brand-brown/10 text-brand-brown/60",
  "not-applicable": "bg-brand-brown/5 text-brand-brown/40",
};

function subscriptionState(user: AdminUser): SubscriptionState {
  if (user.role !== "vendor") return "not-applicable";
  if (user.subscriptionPlan !== "premium") return "not-started";
  if (!user.subscriptionExpiresAt) return "active";

  return new Date(user.subscriptionExpiresAt).getTime() > Date.now()
    ? "active"
    : "expired";
}

function subscriptionDetail(user: AdminUser, state: SubscriptionState): string | null {
  if (state === "not-applicable" || !user.subscriptionExpiresAt) {
    return state === "active" ? "No expiry date" : null;
  }

  return state === "expired"
    ? `Expired ${formatDate(user.subscriptionExpiresAt)}`
    : `Expires ${formatDate(user.subscriptionExpiresAt)}`;
}

function SubscriptionInfo({ user }: { user: AdminUser }) {
  const state = subscriptionState(user);
  const detail = subscriptionDetail(user, state);

  return (
    <div className="space-y-1">
      <p className="text-xs font-bold text-brand-brown">
        {user.role !== "vendor"
          ? "Not applicable"
          : user.subscriptionPlan === "premium"
            ? "Premium"
            : "Free"}
      </p>
      <span
        className={cn(
          "inline-block rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide",
          SUBSCRIPTION_STATE_CLASSES[state],
        )}
      >
        {SUBSCRIPTION_STATE_LABELS[state]}
      </span>
      {detail ? <p className="text-[11px] text-brand-brown/45">{detail}</p> : null}
    </div>
  );
}

export default function ManageUsersPage() {
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [role, setRole] = useState<RoleFilter>("all");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<Paginated<AdminUser> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebounced(search.trim());
      setPage(1);
    }, 350);
    return () => window.clearTimeout(timer);
  }, [search]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await listUsers({
        search: debounced || undefined,
        role: role === "all" ? undefined : role,
        page,
        limit: 20,
      });
      setData(result);
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      setLoading(false);
    }
  }, [debounced, page, role]);

  useEffect(() => {
    void load();
  }, [load]);

  async function toggleBlocked(user: AdminUser) {
    setBusyId(user.id);
    try {
      const updated = await setUserBlocked(user.id, !user.isBlocked);
      setData((current) =>
        current
          ? {
              ...current,
              items: current.items.map((entry) =>
                entry.id === updated.id ? updated : entry,
              ),
            }
          : current,
      );
      toast.success(
        updated.isBlocked
          ? `${updated.name} has been blocked.`
          : `${updated.name} can use PizzaHub again.`,
      );
    } catch (cause) {
      toast.error(errorMessage(cause));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Manage users"
        description="Review accounts and read-only Stripe subscription status. Block abusive accounts and restore them later. Administrator accounts cannot be blocked."
      />

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative w-full lg:max-w-sm">
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-brand-brown/40"
          />
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by name or email…"
            aria-label="Search users"
            className="h-11 w-full rounded-full border border-brand-brown/15 bg-white pl-10 pr-4 text-sm text-brand-brown outline-none focus:border-brand-red focus:ring-4 focus:ring-brand-red/10"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {(["all", "customer", "vendor", "admin"] as RoleFilter[]).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => {
                setRole(option);
                setPage(1);
              }}
              aria-pressed={role === option}
              className={cn(
                "rounded-full border px-4 py-1.5 text-sm font-semibold transition-colors",
                role === option
                  ? "border-brand-red bg-brand-red text-white"
                  : "border-brand-brown/15 bg-white text-brand-brown/70 hover:border-brand-red hover:text-brand-red",
              )}
            >
              {option === "all" ? "Everyone" : ROLE_LABELS[option]}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center gap-3 rounded-2xl border border-brand-brown/10 bg-white px-5 py-8 text-sm font-semibold text-brand-brown/60">
          <Loader2 aria-hidden="true" className="size-4 animate-spin" />
          Loading accounts…
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-brand-red/30 bg-white px-5 py-8">
          <p className="text-sm font-semibold text-brand-red">{error}</p>
        </div>
      ) : !data || data.items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-brand-brown/20 bg-white px-5 py-12 text-center text-sm text-brand-brown/55">
          No accounts match those filters.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-brand-brown/10 bg-white">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead>
              <tr className="border-b border-brand-brown/10 text-[11px] uppercase tracking-wide text-brand-brown/40">
                <th className="px-4 py-3 font-bold">Account</th>
                <th className="px-4 py-3 font-bold">Role</th>
                <th className="px-4 py-3 font-bold">Subscription</th>
                <th className="px-4 py-3 font-bold">Joined</th>
                <th className="px-4 py-3 font-bold">Status</th>
                <th className="px-4 py-3 text-right font-bold">Action</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((user) => (
                <tr
                  key={user.id}
                  className="border-b border-brand-brown/5 last:border-0"
                >
                  <td className="px-4 py-3">
                    <p className="font-bold text-brand-brown">{user.name}</p>
                    <p className="text-xs text-brand-brown/50">{user.email}</p>
                    {user.businessName ? (
                      <p className="text-xs text-brand-brown/40">
                        {user.businessName}
                      </p>
                    ) : null}
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-brand-brown/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-brand-brown/60">
                      {ROLE_LABELS[user.role]}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <SubscriptionInfo user={user} />
                  </td>
                  <td className="px-4 py-3 text-xs text-brand-brown/55">
                    {formatDate(user.createdAt)}
                  </td>
                  <td className="px-4 py-3">
                    {user.isBlocked ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-brand-red/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-brand-red">
                        <Ban aria-hidden="true" className="size-3" />
                        Blocked
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-800">
                        <ShieldCheck aria-hidden="true" className="size-3" />
                        Active
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {user.role === "admin" ? (
                      <span className="text-xs text-brand-brown/35">
                        Protected
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => void toggleBlocked(user)}
                        disabled={busyId === user.id}
                        className={cn(
                          "inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-wide transition-colors disabled:opacity-50",
                          user.isBlocked
                            ? "bg-emerald-600 text-white hover:bg-emerald-700"
                            : "border border-brand-red/30 text-brand-red hover:bg-brand-red hover:text-white",
                        )}
                      >
                        {busyId === user.id ? (
                          <Loader2 aria-hidden="true" className="size-3 animate-spin" />
                        ) : user.isBlocked ? (
                          <RotateCcw aria-hidden="true" className="size-3" />
                        ) : (
                          <Ban aria-hidden="true" className="size-3" />
                        )}
                        {user.isBlocked ? "Unblock" : "Block"}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {data && data.totalPages > 1 ? (
        <div className="flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => setPage((value) => Math.max(1, value - 1))}
            disabled={page <= 1}
            className="rounded-full border border-brand-brown/20 bg-white px-4 py-2 text-sm font-semibold text-brand-brown disabled:opacity-40"
          >
            Previous
          </button>
          <span className="text-sm font-semibold text-brand-brown/60">
            {data.page} / {data.totalPages}
          </span>
          <button
            type="button"
            onClick={() => setPage((value) => Math.min(data.totalPages, value + 1))}
            disabled={page >= data.totalPages}
            className="rounded-full border border-brand-brown/20 bg-white px-4 py-2 text-sm font-semibold text-brand-brown disabled:opacity-40"
          >
            Next
          </button>
        </div>
      ) : null}
    </div>
  );
}
