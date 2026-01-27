import { apiClient } from './client';
import type { ProductFormData } from '@/lib/types';

export const productsApi = {
  getAll: async (params?: {
    is_active?: boolean;
    category?: string;
    product_type?: string;
    rentable?: boolean;
    composites?: boolean;
    low_stock?: boolean;
    search?: string;
    barcode?: string;
    semantic_search?: string;
    sort_field?: string;
    sort_direction?: string;
    per_page?: number;
  }) => {
    const response = await apiClient.get('/products', { params });
    return response.data;
  },

  getById: async (id: number) => {
    const response = await apiClient.get(`/products/${id}`);
    return response.data.data;
  },

  create: async (data: ProductFormData) => {
    const response = await apiClient.post('/products', data);
    return response.data.data;
  },

  update: async (id: number, data: Partial<ProductFormData>) => {
    const response = await apiClient.patch(`/products/${id}`, data);
    return response.data.data;
  },

  delete: async (id: number) => {
    const response = await apiClient.delete(`/products/${id}`);
    return response.data;
  },

  getNeedingReorder: async () => {
    const response = await apiClient.get('/products-needing-reorder');
    return response.data.data;
  },

  getCompositeBreakdown: async (id: number) => {
    const response = await apiClient.get(`/products/${id}/composite-breakdown`);
    return response.data.data;
  },

  calculatePrice: async (id: number) => {
    const response = await apiClient.post(`/products/${id}/calculate-price`);
    return response.data.data;
  },

  // Product Relations (unified system)
  getRelations: async (productId: number) => {
    const response = await apiClient.get(`/products/${productId}/relations`);
    return response.data.data;
  },

  addRelation: async (
    productId: number,
    data: {
      related_product_id: number;
      relation_type_id: number;
      quantity_type: string;
      quantity_value: string;
      is_visible_in_quote?: boolean;
      is_visible_in_material_list?: boolean;
      is_required_for_stock?: boolean;
      is_optional?: boolean;
      min_quantity_trigger?: number;
      max_quantity_trigger?: number;
      sort_order?: number;
      notes?: string;
    }
  ) => {
    const response = await apiClient.post(`/products/${productId}/relations`, data);
    return response.data.data;
  },

  updateRelation: async (
    productId: number,
    relationId: number,
    data: {
      relation_type_id?: number;
      quantity_type?: string;
      quantity_value?: string;
      is_visible_in_quote?: boolean;
      is_visible_in_material_list?: boolean;
      is_required_for_stock?: boolean;
      is_optional?: boolean;
      min_quantity_trigger?: number;
      max_quantity_trigger?: number;
      sort_order?: number;
      notes?: string;
    }
  ) => {
    const response = await apiClient.patch(
      `/products/${productId}/relations/${relationId}`,
      data
    );
    return response.data.data;
  },

  deleteRelation: async (productId: number, relationId: number) => {
    const response = await apiClient.delete(`/products/${productId}/relations/${relationId}`);
    return response.data;
  },

  calculateRelations: async (productId: number, quantity: number) => {
    const response = await apiClient.post(`/products/${productId}/relations/calculate`, {
      quantity,
    });
    return response.data.data;
  },

  // Categories
  getCategories: async () => {
    const response = await apiClient.get('/product-categories');
    return response.data.data;
  },

  createCategory: async (data: { name: string; code: string; description?: string; icon?: string; color?: string; sort_order?: number }) => {
    const response = await apiClient.post('/product-categories', data);
    return response.data.data;
  },

  updateCategory: async (id: number, data: { name?: string; code?: string; description?: string; icon?: string; color?: string; sort_order?: number; is_active?: boolean }) => {
    const response = await apiClient.patch(`/product-categories/${id}`, data);
    return response.data.data;
  },

  deleteCategory: async (id: number) => {
    const response = await apiClient.delete(`/product-categories/${id}`);
    return response.data;
  },

  // Relation Types
  getRelationTypes: async () => {
    const response = await apiClient.get('/product-relation-types');
    return response.data.data;
  },

  createRelationType: async (data: { name: string; code: string; description?: string; icon?: string; color?: string; sort_order?: number }) => {
    const response = await apiClient.post('/product-relation-types', data);
    return response.data.data;
  },

  updateRelationType: async (id: number, data: { name?: string; code?: string; description?: string; icon?: string; color?: string; sort_order?: number; is_active?: boolean }) => {
    const response = await apiClient.patch(`/product-relation-types/${id}`, data);
    return response.data.data;
  },

  deleteRelationType: async (id: number) => {
    const response = await apiClient.delete(`/product-relation-types/${id}`);
    return response.data;
  },
};

