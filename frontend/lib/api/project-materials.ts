import { apiClient } from "./client";

export const projectMaterialsApi = {
  getAll: async (
    projectId: number,
    params?: { product_type?: "physical" | "service" | "kit" },
  ) => {
    const response = await apiClient.get(`/projects/${projectId}/materials`, {
      params,
    });
    return response.data.data;
  },

  getExtras: async (projectId: number) => {
    const response = await apiClient.get(`/projects/${projectId}/materials/extras`);
    return response.data;
  },

  create: async (
    projectId: number,
    data: {
      product_id: number;
      planned_quantity: number;
      planned_unit_cost: number;
      quote_item_id?: number | null;
      is_extra?: boolean;
      extra_reason?: string | null;
      required_date?: string;
      notes?: string;
    },
  ) => {
    const response = await apiClient.post(`/projects/${projectId}/materials`, data);
    return response.data.data;
  },

  update: async (projectId: number, materialId: number, data: any) => {
    const response = await apiClient.patch(
      `/projects/${projectId}/materials/${materialId}`,
      data,
    );
    return response.data.data;
  },

  delete: async (projectId: number, materialId: number) => {
    const response = await apiClient.delete(
      `/projects/${projectId}/materials/${materialId}`,
    );
    return response.data;
  },

  logUsage: async (
    projectId: number,
    materialId: number,
    data: {
      quantity_used: number;
      actual_unit_cost?: number;
      notes?: string;
    },
  ) => {
    const response = await apiClient.post(
      `/projects/${projectId}/materials/${materialId}/log-usage`,
      data,
    );
    return response.data.data;
  },

  reserve: async (
    projectId: number,
    materialId: number,
    data: {
      warehouse_id: number;
      quantity: number;
    },
  ) => {
    const response = await apiClient.post(
      `/projects/${projectId}/materials/${materialId}/reserve`,
      data,
    );
    return response.data.data;
  },

  deliver: async (
    projectId: number,
    materialId: number,
    data: {
      warehouse_id: number;
      quantity: number;
      delivery_date?: string;
      notes?: string;
    },
  ) => {
    const response = await apiClient.post(
      `/projects/${projectId}/materials/${materialId}/deliver`,
      data,
    );
    return response.data.data;
  },

  returnMaterial: async (
    projectId: number,
    materialId: number,
    data: {
      warehouse_id: number;
      quantity: number;
      notes?: string;
    },
  ) => {
    const response = await apiClient.post(
      `/projects/${projectId}/materials/${materialId}/return`,
      data,
    );
    return response.data.data;
  },

  transferToProject: async (
    projectId: number,
    materialId: number,
    data: {
      to_project_id: number;
      quantity: number;
      ddt_number?: string;
      notes?: string;
    },
  ) => {
    const response = await apiClient.post(
      `/projects/${projectId}/materials/${materialId}/transfer`,
      data,
    );
    return response.data.data;
  },
};
