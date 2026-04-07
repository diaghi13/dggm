import { apiClient } from "./client";

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

export type RenewalRequestStatus = "pending" | "approved" | "rejected";
export type RenewalRequestType = "renewal" | "addon" | "renewal_addon";

export interface RenewalRequestAddon {
  feature_key: string;
  label: string;
  price: number | null;
  price_prorated: number | null;
}

export interface RenewalRequest {
  id: number;
  tenant_id: string;
  tenant_name: string;
  type: RenewalRequestType;
  plan_name: string | null;
  target_plan_name: string | null;
  addons: RenewalRequestAddon[];
  prorated_amount: number | null;
  status: RenewalRequestStatus;
  notes: string | null;
  admin_notes: string | null;
  created_at: string;
  processed_at: string | null;
}

export interface RenewalRequestsParams {
  status?: RenewalRequestStatus | "all";
  page?: number;
  per_page?: number;
}

export interface RenewalRequestsResponse {
  success: boolean;
  data: RenewalRequest[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number;
    to: number;
  };
}

export interface RenewalRequestResponse {
  success: boolean;
  data: RenewalRequest;
}

export interface PendingCountResponse {
  success: boolean;
  data: {
    count: number;
  };
}

export interface ApproveRenewalPayload {
  admin_notes?: string;
}

export interface RejectRenewalPayload {
  admin_notes?: string;
}

export interface ActionResponse {
  success: boolean;
  message: string;
  data?: RenewalRequest;
}

// ─── API ──────────────────────────────────────────────────────────────────────

export const landlordRenewalApi = {
  getAll: async (params?: RenewalRequestsParams): Promise<RenewalRequestsResponse> => {
    const searchParams = new URLSearchParams();
    if (params?.status && params.status !== "all") {
      searchParams.append("status", params.status);
    }
    if (params?.page) searchParams.append("page", String(params.page));
    if (params?.per_page) searchParams.append("per_page", String(params.per_page));
    const query = searchParams.toString();
    const response = await apiClient.get(
      `/landlord/renewal-requests${query ? `?${query}` : ""}`,
      { headers: getGlobalAuthHeader() }
    );
    return response.data;
  },

  getPendingCount: async (): Promise<PendingCountResponse> => {
    const response = await apiClient.get("/landlord/renewal-requests/pending-count", {
      headers: getGlobalAuthHeader(),
    });
    return response.data;
  },

  getById: async (id: number): Promise<RenewalRequestResponse> => {
    const response = await apiClient.get(`/landlord/renewal-requests/${id}`, {
      headers: getGlobalAuthHeader(),
    });
    return response.data;
  },

  approve: async (id: number, data?: ApproveRenewalPayload): Promise<ActionResponse> => {
    const response = await apiClient.post(
      `/landlord/renewal-requests/${id}/approve`,
      data ?? {},
      { headers: getGlobalAuthHeader() }
    );
    return response.data;
  },

  reject: async (id: number, data?: RejectRenewalPayload): Promise<ActionResponse> => {
    const response = await apiClient.post(
      `/landlord/renewal-requests/${id}/reject`,
      data ?? {},
      { headers: getGlobalAuthHeader() }
    );
    return response.data;
  },
};
