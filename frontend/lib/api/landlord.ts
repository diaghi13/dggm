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

export interface LandlordTenantsParams {
  status?: string;
  page?: number;
  per_page?: number;
}

export interface LandlordTenantsResponse {
  success: boolean;
  data: App.Data.Landlord.TenantData[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number;
    to: number;
  };
}

export interface LandlordTenantResponse {
  success: boolean;
  data: App.Data.Landlord.TenantData;
}

export interface LandlordActionResponse {
  success: boolean;
  message: string;
}

export interface LandlordGlobalUsersResponse {
  success: boolean;
  data: App.Data.Landlord.GlobalUserData[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number;
    to: number;
  };
}

export interface LandlordPlansResponse {
  success: boolean;
  data: App.Data.Landlord.PlanData[];
}

export interface TenantMembershipWithTenant {
  id: number;
  tenant_id: string;
  tenant_name: string;
  role: string;
  status: string;
  created_at: string;
}

export interface GlobalUserMembershipsResponse {
  success: boolean;
  data: TenantMembershipWithTenant[];
}

export interface AddMembershipPayload {
  tenant_id: string;
  role?: string;
}

export interface AdminPlanFeature {
  id: number;
  plan_id: number;
  feature_key: string;
  price: number | null;
  price_yearly: number | null;
  limits: Record<string, unknown> | null;
}

export interface AdminPlan {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  price: number | null;
  price_yearly: number | null;
  is_active: boolean;
  sort_order: number;
  tenant_count: number;
  features: AdminPlanFeature[];
}

export interface CreateTenantPayload {
  global_user_id: string;
  company_name: string;
  plan_id: number;
  billing_cycle?: "monthly" | "yearly";
}

export interface PlanFormPayload {
  name: string;
  slug: string;
  description?: string;
  price?: number | null;
  price_yearly?: number | null;
  is_active: boolean;
  sort_order: number;
  features: Array<{ feature_key: string; price?: number | null; price_yearly?: number | null }>;
}

export interface TenantInvitationPreview {
  tenant_name: string;
  email: string;
  role: string;
  expires_at: string | null;
  is_new_user: boolean;
}

export interface SendTenantInvitationPayload {
  email: string;
  role: string;
}

export const landlordApi = {
  // Tenants
  getTenants: async (params?: LandlordTenantsParams): Promise<LandlordTenantsResponse> => {
    const searchParams = new URLSearchParams();
    if (params?.status) searchParams.append("status", params.status);
    if (params?.page) searchParams.append("page", String(params.page));
    if (params?.per_page) searchParams.append("per_page", String(params.per_page));
    const query = searchParams.toString();
    const response = await apiClient.get(`/landlord/tenants${query ? `?${query}` : ""}`, {
      headers: getGlobalAuthHeader(),
    });
    return response.data;
  },

  getTenant: async (id: string): Promise<LandlordTenantResponse> => {
    const response = await apiClient.get(`/landlord/tenants/${id}`, {
      headers: getGlobalAuthHeader(),
    });
    return response.data;
  },

  activateTenant: async (id: string): Promise<LandlordActionResponse> => {
    const response = await apiClient.patch(`/landlord/tenants/${id}/activate`, undefined, {
      headers: getGlobalAuthHeader(),
    });
    return response.data;
  },

  suspendTenant: async (id: string): Promise<LandlordActionResponse> => {
    const response = await apiClient.patch(`/landlord/tenants/${id}/suspend`, undefined, {
      headers: getGlobalAuthHeader(),
    });
    return response.data;
  },

  deleteTenant: async (id: string): Promise<LandlordActionResponse> => {
    const response = await apiClient.delete(`/landlord/tenants/${id}`, {
      headers: getGlobalAuthHeader(),
    });
    return response.data;
  },

  createTenant: async (data: CreateTenantPayload): Promise<LandlordTenantResponse> => {
    const response = await apiClient.post("/landlord/tenants", data, {
      headers: getGlobalAuthHeader(),
    });
    return response.data;
  },

  // Global Users
  getGlobalUsers: async (params?: { page?: number; per_page?: number; search?: string }): Promise<LandlordGlobalUsersResponse> => {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.append("page", String(params.page));
    if (params?.per_page) searchParams.append("per_page", String(params.per_page));
    if (params?.search) searchParams.append("search", params.search);
    const query = searchParams.toString();
    const response = await apiClient.get(`/landlord/users${query ? `?${query}` : ""}`, {
      headers: getGlobalAuthHeader(),
    });
    return response.data;
  },

  getGlobalUser: async (id: string): Promise<{ success: boolean; data: App.Data.Landlord.GlobalUserData & { tenants_count?: number } }> => {
    const response = await apiClient.get(`/landlord/users/${id}`, {
      headers: getGlobalAuthHeader(),
    });
    return response.data;
  },

  updateGlobalUser: async (id: string, data: { name: string; is_landlord_admin?: boolean }): Promise<{ success: boolean; data: App.Data.Landlord.GlobalUserData }> => {
    const response = await apiClient.put(`/landlord/users/${id}`, data, {
      headers: getGlobalAuthHeader(),
    });
    return response.data;
  },

  toggleAdmin: async (userId: string): Promise<{ success: boolean; data: App.Data.Landlord.GlobalUserData }> => {
    const response = await apiClient.post(`/landlord/users/${userId}/toggle-admin`, undefined, {
      headers: getGlobalAuthHeader(),
    });
    return response.data;
  },

  getUserMemberships: async (userId: string): Promise<GlobalUserMembershipsResponse> => {
    const response = await apiClient.get(`/landlord/users/${userId}/memberships`, {
      headers: getGlobalAuthHeader(),
    });
    return response.data;
  },

  addUserMembership: async (userId: string, data: AddMembershipPayload): Promise<{ success: boolean; data: TenantMembershipWithTenant }> => {
    const response = await apiClient.post(`/landlord/users/${userId}/memberships`, data, {
      headers: getGlobalAuthHeader(),
    });
    return response.data;
  },

  removeUserMembership: async (userId: string, membershipId: number): Promise<void> => {
    await apiClient.delete(`/landlord/users/${userId}/memberships/${membershipId}`, {
      headers: getGlobalAuthHeader(),
    });
  },

  // Plans (public list)
  getPlans: async (): Promise<LandlordPlansResponse> => {
    const response = await apiClient.get("/plans", {
      headers: getGlobalAuthHeader(),
    });
    return response.data;
  },

  // Plans admin management
  getAdminPlans: async (): Promise<AdminPlan[]> => {
    const response = await apiClient.get("/landlord/plans", {
      headers: getGlobalAuthHeader(),
    });
    return response.data.data;
  },

  createPlan: async (data: PlanFormPayload): Promise<AdminPlan> => {
    const response = await apiClient.post("/landlord/plans", data, {
      headers: getGlobalAuthHeader(),
    });
    return response.data.data;
  },

  updatePlan: async (id: number, data: PlanFormPayload): Promise<AdminPlan> => {
    const response = await apiClient.put(`/landlord/plans/${id}`, data, {
      headers: getGlobalAuthHeader(),
    });
    return response.data.data;
  },

  deletePlan: async (id: number): Promise<void> => {
    await apiClient.delete(`/landlord/plans/${id}`, {
      headers: getGlobalAuthHeader(),
    });
  },

  // Tenant Invitations — public endpoints (no auth)
  previewTenantInvitation: async (
    token: string
  ): Promise<{ success: boolean; data: TenantInvitationPreview }> => {
    const response = await apiClient.get(`/tenant-invitations/preview/${token}`);
    return response.data;
  },

  acceptTenantInvitation: async (
    token: string,
    password?: string,
    name?: string
  ): Promise<{
    success: boolean;
    message: string;
    data: { global_user_id: string; email: string };
  }> => {
    const response = await apiClient.post("/tenant-invitations/accept", {
      token,
      ...(password !== undefined ? { password } : {}),
      ...(name !== undefined ? { name } : {}),
    });
    return response.data;
  },

  // Send cross-tenant invitation — auth:sanctum (standard apiClient, tenant context)
  sendTenantInvitation: async (
    data: SendTenantInvitationPayload
  ): Promise<{
    success: boolean;
    message: string;
    data: { id: number; email: string; role: string };
  }> => {
    const response = await apiClient.post("/tenant-invitations", data);
    return response.data;
  },
};
