import { apiClient } from "./client";

// ─── Auth ─────────────────────────────────────────────────────────────────────

function getGlobalAuthHeader(): Record<string, string> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem("auth-storage");
    if (!raw) return {};
    const parsed = JSON.parse(raw) as { state?: { globalToken?: string } };
    const token = parsed?.state?.globalToken;
    if (token) return { Authorization: `Bearer ${token}` };
  } catch {
    /* ignore */
  }
  return {};
}

// ─── Types ────────────────────────────────────────────────────────────────────

export type SubscriptionStatus =
  | "active"
  | "trial"
  | "pending_payment"
  | "suspended"
  | "expired"
  | "cancelled";

export type BillingCycle = "monthly" | "yearly";

export type RequestType =
  | "renewal"
  | "addon"
  | "upgrade"
  | "downgrade"
  | "cancellation";

export type RequestStatus = "pending" | "approved" | "rejected" | "cancelled";

export interface SubscriptionAddon {
  id: number;
  feature_key: string;
  name: string;
  price_monthly: number | null;
  price_yearly: number | null;
  is_active: boolean;
  /** true = included in plan, false = separately purchased */
  is_included: boolean;
}

export interface SubscriptionStatusData {
  /** Current subscription status */
  status: SubscriptionStatus;
  plan_id: number | null;
  plan_name: string | null;
  billing_cycle: BillingCycle | null;
  /** ISO date string */
  renews_at: string | null;
  /** ISO date string — when trial ends */
  trial_ends_at: string | null;
  /** ISO date string — when subscription expires */
  ends_at: string | null;
  /** Days remaining until renewal/expiry */
  days_remaining: number | null;
  /** Whether the backend considers this worth showing a warning */
  show_renewal_warning: boolean;
  /** Active addons */
  addons: SubscriptionAddon[];
  /** Pending renewal request, if any */
  pending_renewal?: {
    id: number;
    type: RequestType;
    status: RequestStatus;
    created_at: string;
    notes: string | null;
    amount: number | null;
  } | null;
  /** Pending plan change request, if any */
  pending_plan_change?: {
    id: number;
    type: "upgrade" | "downgrade";
    status: RequestStatus;
    created_at: string;
    notes: string | null;
    target_plan_id: number | null;
  } | null;
}

export interface AvailableAddon {
  id: number;
  feature_key: string;
  name: string;
  description: string | null;
  price_monthly: number | null;
  price_yearly: number | null;
  /** Prorated amount if added mid-cycle */
  prorated_amount: number | null;
  /** Days remaining in current billing cycle */
  prorated_days_remaining: number | null;
}

export interface SubscriptionRequest {
  id: number;
  type: RequestType;
  status: RequestStatus;
  notes: string | null;
  amount: number | null;
  created_at: string;
  updated_at: string;
}

export interface RenewPayload {
  notes?: string;
}

export interface AddonPayload {
  addons: string[];
  notes?: string;
}

export interface ChangePlanPayload {
  plan_id: number;
  notes?: string;
}

// ─── Plan types (public endpoint, no auth required) ───────────────────────────

export interface PlanFeatureSummary {
  feature_key: string;
  price: number | null;
  price_yearly: number | null;
}

export interface PlanSummary {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  price: number | null;
  price_yearly: number | null;
  sort_order: number;
  features: PlanFeatureSummary[];
}

// ─── API ──────────────────────────────────────────────────────────────────────

export const tenantSubscriptionApi = {
  /** GET /api/v1/tenant/subscription — current subscription status + warnings */
  getStatus: async (): Promise<SubscriptionStatusData> => {
    const { data } = await apiClient.get<{ success: boolean; data: SubscriptionStatusData }>(
      "/tenant/subscription",
      { headers: getGlobalAuthHeader() }
    );
    return data.data;
  },

  /** POST /api/v1/tenant/subscription/renew — request manual renewal */
  requestRenewal: async (payload: RenewPayload = {}): Promise<{ message: string }> => {
    const { data } = await apiClient.post<{ success: boolean; message: string }>(
      "/tenant/subscription/renew",
      payload,
      { headers: getGlobalAuthHeader() }
    );
    return { message: data.message };
  },

  /** POST /api/v1/tenant/subscription/addons — request to add an addon */
  requestAddon: async (payload: AddonPayload): Promise<{ message: string }> => {
    const { data } = await apiClient.post<{ success: boolean; message: string }>(
      "/tenant/subscription/addons",
      payload,
      { headers: getGlobalAuthHeader() }
    );
    return { message: data.message };
  },

  /** GET /api/v1/tenant/subscription/requests — history of subscription requests */
  getRequests: async (): Promise<SubscriptionRequest[]> => {
    const { data } = await apiClient.get<{ success: boolean; data: SubscriptionRequest[] }>(
      "/tenant/subscription/requests",
      { headers: getGlobalAuthHeader() }
    );
    return data.data;
  },

  /** GET /api/v1/tenant/subscription/available-addons — addons available to add */
  getAvailableAddons: async (): Promise<AvailableAddon[]> => {
    const { data } = await apiClient.get<{ success: boolean; data: AvailableAddon[] }>(
      "/tenant/subscription/available-addons",
      { headers: getGlobalAuthHeader() }
    );
    return data.data;
  },

  /** POST /api/v1/tenant/subscription/change-plan — request a plan upgrade or downgrade */
  changePlan: async (payload: ChangePlanPayload): Promise<{ message: string }> => {
    const { data } = await apiClient.post<{ success: boolean; message: string }>(
      "/tenant/subscription/change-plan",
      payload,
      { headers: getGlobalAuthHeader() }
    );
    return { message: data.message };
  },
};

// ─── Plans API (public, no auth required) ────────────────────────────────────

export const plansApi = {
  /** GET /api/v1/plans — all available plans with features */
  getAll: async (): Promise<PlanSummary[]> => {
    const { data } = await apiClient.get<{ success: boolean; data: PlanSummary[] }>("/plans");
    return data.data;
  },
};
