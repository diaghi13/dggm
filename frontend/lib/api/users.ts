import { apiClient } from './client';

export interface User {
  id: number;
  name: string;
  email: string;
  email_verified_at: string | null;
  roles: string[];
  permissions: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateUserData {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
  roles?: string[];
  is_active?: boolean;
}

export interface UpdateUserData {
  name?: string;
  email?: string;
  password?: string;
  password_confirmation?: string;
  roles?: string[];
  is_active?: boolean;
}

export const usersApi = {
  getAll: async (params?: { search?: string; role?: string; is_active?: boolean; per_page?: number }) => {
    const response = await apiClient.get('/users', { params });
    return response.data;
  },

  getById: async (id: number) => {
    const response = await apiClient.get(`/users/${id}`);
    return response.data.data;
  },

  create: async (data: CreateUserData) => {
    const response = await apiClient.post('/users', data);
    return response.data.data;
  },

  update: async (id: number, data: UpdateUserData) => {
    const response = await apiClient.patch(`/users/${id}`, data);
    return response.data.data;
  },

  delete: async (id: number) => {
    const response = await apiClient.delete(`/users/${id}`);
    return response.data;
  },

  getRoles: async () => {
    const response = await apiClient.get('/users/roles');
    return response.data.data;
  },

  getPermissions: async () => {
    const response = await apiClient.get('/users/permissions');
    return response.data.data;
  },

  assignRole: async (userId: number, role: string) => {
    const response = await apiClient.post(`/users/${userId}/roles`, { role });
    return response.data;
  },

  removeRole: async (userId: number, role: string) => {
    const response = await apiClient.delete(`/users/${userId}/roles/${role}`);
    return response.data;
  },
};

export interface Role {
  id: number;
  name: string;
  display_name: string;
  description?: string;
  permissions: string[];
  users_count?: number;
  created_at: string;
  updated_at: string;
}

export interface Permission {
  id: number;
  name: string;
  display_name: string;
  description?: string;
  group?: string;
}

export const rolesApi = {
  getAll: async () => {
    const response = await apiClient.get('/roles');
    return response.data.data;
  },

  getById: async (id: number) => {
    const response = await apiClient.get(`/roles/${id}`);
    return response.data.data;
  },

  create: async (data: { name: string; display_name: string; description?: string; permissions?: string[] }) => {
    const response = await apiClient.post('/roles', data);
    return response.data.data;
  },

  update: async (id: number, data: { display_name?: string; description?: string; permissions?: string[] }) => {
    const response = await apiClient.patch(`/roles/${id}`, data);
    return response.data.data;
  },

  delete: async (id: number) => {
    const response = await apiClient.delete(`/roles/${id}`);
    return response.data;
  },

  syncPermissions: async (roleId: number, permissions: string[]) => {
    const response = await apiClient.post(`/roles/${roleId}/permissions/sync`, { permissions });
    return response.data;
  },

  getPermissions: async (roleId: number) => {
    const response = await apiClient.get(`/roles/${roleId}/permissions`);
    return response.data.data;
  },
};

export const permissionsApi = {
  getAll: async () => {
    const response = await apiClient.get('/permissions');
    return response.data.data;
  },

  getGrouped: async () => {
    const response = await apiClient.get('/permissions/grouped');
    return response.data.data;
  },
};

export const companySettingsApi = {
  get: async () => {
    const response = await apiClient.get('/settings/company');
    return response.data.data;
  },

  update: async (data: {
    company_name?: string;
    vat_number?: string;
    tax_code?: string;
    address?: string;
    city?: string;
    province?: string;
    postal_code?: string;
    country?: string;
    phone?: string;
    email?: string;
    website?: string;
    logo?: string;
  }) => {
    const response = await apiClient.patch('/settings/company', data);
    return response.data.data;
  },
};

