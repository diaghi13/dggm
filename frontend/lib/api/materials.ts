import { apiClient } from './client';

export const materialsApi = {
  getAll: async (params?: {
    is_active?: boolean;
    category?: string;
    product_type?: string;
    rentable?: boolean;
    kits?: boolean;
    low_stock?: boolean;
    search?: string;
    semantic_search?: string;
    sort_field?: string;
    sort_direction?: string;
    per_page?: number;
  }) => {
    const response = await apiClient.get('/materials', { params });
    return response.data;
  },

  getById: async (id: number) => {
    const response = await apiClient.get(`/materials/${id}`);
    return response.data.data;
  },

  create: async (data: any) => {
    const response = await apiClient.post('/materials', data);
    return response.data.data;
  },

  update: async (id: number, data: any) => {
    const response = await apiClient.patch(`/materials/${id}`, data);
    return response.data.data;
  },

  delete: async (id: number) => {
    const response = await apiClient.delete(`/materials/${id}`);
    return response.data;
  },


  getNeedingReorder: async () => {
    const response = await apiClient.get('/materials-needing-reorder');
    return response.data.data;
  },

  getKitBreakdown: async (id: number) => {
    const response = await apiClient.get(`/materials/${id}/kit-breakdown`);
    return response.data.data;
  },

  calculatePrice: async (id: number) => {
    const response = await apiClient.post(`/materials/${id}/calculate-price`);
    return response.data.data;
  },

  // Kit Components
  addComponent: async (
    materialId: number,
    data: { component_material_id: number; quantity: number; notes?: string }
  ) => {
    const response = await apiClient.post(`/materials/${materialId}/components`, data);
    return response.data.data;
  },

  updateComponent: async (
    materialId: number,
    componentId: number,
    data: { quantity: number; notes?: string }
  ) => {
    const response = await apiClient.patch(
      `/materials/${materialId}/components/${componentId}`,
      data
    );
    return response.data.data;
  },

  deleteComponent: async (materialId: number, componentId: number) => {
    const response = await apiClient.delete(`/materials/${materialId}/components/${componentId}`);
    return response.data;
  },

  // Dependencies
  getDependencies: async (materialId: number) => {
    const response = await apiClient.get(`/materials/${materialId}/dependencies`);
    return response.data.data;
  },

  calculateDependencies: async (materialId: number, quantity: number) => {
    const response = await apiClient.post(`/materials/${materialId}/dependencies/calculate`, {
      quantity,
    });
    return response.data.data;
  },

  addDependency: async (
    materialId: number,
    data: {
      dependency_material_id: number;
      dependency_type: string;
      quantity_type: string;
      quantity_value: string;
      is_visible_in_quote?: boolean;
      is_required_for_stock?: boolean;
      is_optional?: boolean;
      min_quantity_trigger?: number;
      max_quantity_trigger?: number;
      notes?: string;
    }
  ) => {
    const response = await apiClient.post(`/materials/${materialId}/dependencies`, data);
    return response.data.data;
  },

  updateDependency: async (
    materialId: number,
    dependencyId: number,
    data: {
      dependency_type?: string;
      quantity_type?: string;
      quantity_value?: string;
      is_visible_in_quote?: boolean;
      is_required_for_stock?: boolean;
      is_optional?: boolean;
      min_quantity_trigger?: number;
      max_quantity_trigger?: number;
      notes?: string;
    }
  ) => {
    const response = await apiClient.patch(
      `/materials/${materialId}/dependencies/${dependencyId}`,
      data
    );
    return response.data.data;
  },

  deleteDependency: async (materialId: number, dependencyId: number) => {
    const response = await apiClient.delete(
      `/materials/${materialId}/dependencies/${dependencyId}`
    );
    return response.data;
  },

  // Categories
  getCategories: async () => {
    const response = await apiClient.get('/material-categories');
    return response.data.data;
  },

  createCategory: async (data: { name: string; code: string; description?: string; sort_order?: number }) => {
    const response = await apiClient.post('/material-categories', data);
    return response.data.data;
  },

  updateCategory: async (id: number, data: { name?: string; code?: string; description?: string; sort_order?: number; is_active?: boolean }) => {
    const response = await apiClient.patch(`/material-categories/${id}`, data);
    return response.data.data;
  },

  deleteCategory: async (id: number) => {
    const response = await apiClient.delete(`/material-categories/${id}`);
    return response.data;
  },

  // Dependency Types
  getDependencyTypes: async () => {
    const response = await apiClient.get('/material-dependency-types');
    return response.data.data;
  },

  createDependencyType: async (data: { name: string; code: string; description?: string; sort_order?: number }) => {
    const response = await apiClient.post('/material-dependency-types', data);
    return response.data.data;
  },

  updateDependencyType: async (id: number, data: { name?: string; code?: string; description?: string; sort_order?: number; is_active?: boolean }) => {
    const response = await apiClient.patch(`/material-dependency-types/${id}`, data);
    return response.data.data;
  },

  deleteDependencyType: async (id: number) => {
    const response = await apiClient.delete(`/material-dependency-types/${id}`);
    return response.data;
  },
};
