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

export interface TenantMonitoringAlert {
  type: string;
  severity: "warning" | "critical";
  message: string;
}

export interface TenantMonitoringItem {
  id: string;
  name: string;
  slug: string | null;
  created_at: string | null;
  bootstrap_status: string | null;
  db: {
    size_mb: number;
    table_count: number;
    db_name: string;
  };
  storage: {
    size_mb: number;
  };
  backup: {
    status: "healthy" | "warning" | "missing";
    last_backup_at: string | null;
    backup_count: number;
    total_size_mb: number;
  };
  subscription: {
    status: string;
    plan_name: string | null;
    billing_cycle: string | null;
    renews_at: string | null;
    ends_at: string | null;
    trial_ends_at: string | null;
  };
  health: "healthy" | "warning" | "critical";
  alerts: TenantMonitoringAlert[];
}

export interface TenantMonitoringData {
  summary: {
    total_tenants: number;
    active_tenants: number;
    total_db_size_mb: number;
    total_storage_size_mb: number;
    alerts_count: number;
    healthy_count: number;
  };
  system: {
    disk_total_gb: number;
    disk_free_gb: number;
    disk_used_gb: number;
    disk_used_percent: number;
  };
  tenants: TenantMonitoringItem[];
  backup_summary: {
    total_tenants: number;
    tenants_with_backup: number;
    tenants_missing: number;
    last_backup_at: string | null;
    total_size_mb: number;
  };
}

export interface TenantMonitoringResponse {
  success: boolean;
  data: TenantMonitoringData;
}

export interface ServiceBroadcast {
  id: number;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'announcement';
  target_roles: string[] | null;
  created_by_global_user_id: string | null;
  status: 'pending' | 'scheduled' | 'dispatched' | 'failed' | 'cancelled';
  scheduled_at: string | null;
  dispatched_at: string | null;
  tenant_count: number;
  user_count: number;
  created_at: string;
  updated_at: string;
}

export interface ServiceBroadcastsResponse {
  success: boolean;
  data: ServiceBroadcast[];
  meta: { current_page: number; last_page: number; per_page: number; total: number };
}

export interface CreateBroadcastPayload {
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'announcement';
  target_roles: string[] | null;
  scheduled_at?: string | null;  // ISO datetime string or null for immediate
}

export interface TenantErrorLogItem {
  id: string;
  type: "email" | "job" | "system";
  tenant_id: string | null;
  tenant_name: string;
  severity: "error" | "warning" | "critical";
  title: string;
  message: string;
  details: Record<string, unknown>;
  occurred_at: string;
}

export interface TenantErrorLogsData {
  items: TenantErrorLogItem[];
  total: number;
  types: {
    email: number;
    job: number;
    system: number;
  };
}

export interface TenantErrorLogsResponse {
  success: boolean;
  data: TenantErrorLogsData;
}

export interface LandlordSetting {
  key: string;
  value: string | null;
  description: string | null;
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

  // Monitoring
  getMonitoring: async (): Promise<TenantMonitoringResponse> => {
    const response = await apiClient.get("/landlord/monitoring", {
      headers: getGlobalAuthHeader(),
    });
    return response.data;
  },

  // Broadcasts
  getBroadcasts: async (page = 1): Promise<ServiceBroadcastsResponse> => {
    const response = await apiClient.get(`/landlord/broadcasts?page=${page}`, {
      headers: getGlobalAuthHeader(),
    });
    return response.data;
  },

  createBroadcast: async (data: CreateBroadcastPayload): Promise<{ success: boolean; data: ServiceBroadcast }> => {
    const response = await apiClient.post('/landlord/broadcasts', data, {
      headers: getGlobalAuthHeader(),
    });
    return response.data;
  },

  cancelBroadcast: async (id: number): Promise<{ success: boolean; message: string }> => {
    const response = await apiClient.patch(`/landlord/broadcasts/${id}/cancel`, undefined, {
      headers: getGlobalAuthHeader(),
    });
    return response.data;
  },

  // Error Logs
  getErrorLogs: async (params?: {
    tenant_id?: string;
    type?: "email" | "job" | "system";
    date_from?: string;
  }): Promise<TenantErrorLogsResponse> => {
    const query = new URLSearchParams();
    if (params?.tenant_id) query.set("tenant_id", params.tenant_id);
    if (params?.type) query.set("type", params.type);
    if (params?.date_from) query.set("date_from", params.date_from);
    const qs = query.toString();
    const response = await apiClient.get(
      `/landlord/error-logs${qs ? `?${qs}` : ""}`,
      { headers: getGlobalAuthHeader() }
    );
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

  // Landlord Settings
  getSettings: async (): Promise<{ success: boolean; data: LandlordSetting[] }> => {
    const response = await apiClient.get("/landlord/settings", {
      headers: getGlobalAuthHeader(),
    });
    return response.data;
  },

  updateSetting: async (key: string, value: string): Promise<{ success: boolean; data: LandlordSetting }> => {
    const response = await apiClient.put(`/landlord/settings/${encodeURIComponent(key)}`, { value }, {
      headers: getGlobalAuthHeader(),
    });
    return response.data;
  },
};
