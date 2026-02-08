import { apiClient } from "./client";
import type {
  PriceList,
  PriceListFormData,
  PriceListWithItems,
  PriceListItem,
  ApiResponse,
  PaginatedResponse,
} from "@/lib/types";

export interface PriceListsParams {
  page?: number;
  per_page?: number;
  search?: string;
  is_active?: boolean;
  applies_to?: "sale" | "rental" | "both";
  category_id?: number;
  sort_by?: string;
  sort_order?: "asc" | "desc";
}

export interface PriceListItemsParams {
  page?: number;
  per_page?: number;
  search?: string;
  is_active?: boolean;
  is_manual_price?: boolean;
  product_type?: "article" | "service" | "composite";
  sort_by?: string;
  sort_order?: "asc" | "desc";
}

export const priceListsApi = {
  // Price Lists CRUD
  getAll: async (
    params?: PriceListsParams,
  ): Promise<PaginatedResponse<PriceList>> => {
    const response = await apiClient.get<PaginatedResponse<PriceList>>(
      "/price-lists",
      { params },
    );
    return response.data;
  },

  getById: async (id: number): Promise<PriceListWithItems> => {
    const response = await apiClient.get<ApiResponse<PriceListWithItems>>(
      `/price-lists/${id}`,
    );
    return response.data.data;
  },

  create: async (data: PriceListFormData): Promise<PriceList> => {
    const response = await apiClient.post<ApiResponse<PriceList>>(
      "/price-lists",
      data,
    );
    return response.data.data;
  },

  update: async (
    id: number,
    data: Partial<PriceListFormData>,
  ): Promise<PriceList> => {
    const response = await apiClient.put<ApiResponse<PriceList>>(
      `/price-lists/${id}`,
      data,
    );
    return response.data.data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/price-lists/${id}`);
  },

  regenerate: async (id: number): Promise<PriceList> => {
    const response = await apiClient.post<ApiResponse<PriceList>>(
      `/price-lists/${id}/regenerate`,
    );
    return response.data.data;
  },

  // Price List Items CRUD
  getItems: async (
    priceListId: number,
    params?: PriceListItemsParams,
  ): Promise<PaginatedResponse<App.Data.PriceListItemData>> => {
    const response = await apiClient.get<
      PaginatedResponse<App.Data.PriceListItemData>
    >(`/price-lists/${priceListId}/items`, { params });
    return response.data;
  },

  updateItem: async (
    priceListId: number,
    itemId: number,
    data: {
      sale_price?: number | null;
      is_manual_price?: boolean | null;
      rental_daily?: number | null;
      rental_weekly?: number | null;
      rental_monthly?: number | null;
      is_manual_rental?: boolean | null;
      is_active?: boolean;
      notes?: string | null;
    },
  ): Promise<PriceListItem> => {
    const response = await apiClient.put<ApiResponse<PriceListItem>>(
      `/price-lists/${priceListId}/items/${itemId}`,
      data,
    );
    return response.data.data;
  },

  deleteItem: async (priceListId: number, itemId: number): Promise<void> => {
    await apiClient.delete(`/price-lists/${priceListId}/items/${itemId}`);
  },

  addItem: async (
    priceListId: number,
    data: {
      product_id: number;
      sale_price?: number | null;
      is_manual_price?: boolean | null;
      rental_daily?: number | null;
      rental_weekly?: number | null;
      rental_monthly?: number | null;
      is_manual_rental?: boolean | null;
      is_active?: boolean;
      notes?: string | null;
    },
  ): Promise<PriceListItem> => {
    const response = await apiClient.post<ApiResponse<PriceListItem>>(
      `/price-lists/${priceListId}/items`,
      data,
    );
    return response.data.data;
  },

  recalculateItem: async (
    priceListId: number,
    itemId: number,
  ): Promise<PriceListItem> => {
    const response = await apiClient.post<ApiResponse<PriceListItem>>(
      `/price-lists/${priceListId}/items/${itemId}/recalculate`,
    );
    return response.data.data;
  },

  // Product Pricing
  getProductPricing: async (productId: number, priceListId?: number) => {
    const response = await apiClient.get(`/products/${productId}/pricing`, {
      params: priceListId ? { price_list_id: priceListId } : undefined,
    });
    return response.data.data;
  },

  bulkUpdatePrices: async (data: {
    filters?: {
      brand_id?: number;
      category_id?: number;
    };
    adjustment: {
      type: "percentage" | "fixed";
      value: number;
    };
  }) => {
    const response = await apiClient.post("/products/bulk-update-prices", data);
    return response.data.data;
  },

  previewPriceAdjustment: async (data: {
    filters?: {
      brand_id?: number;
      category_id?: number;
    };
    adjustment_type: "percentage" | "fixed";
    adjustment_value: number;
  }) => {
    const response = await apiClient.post(
      "/products/preview-price-adjustment",
      data,
    );
    return response.data.data;
  },
};
