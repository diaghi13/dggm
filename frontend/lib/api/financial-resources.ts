import { apiClient } from './client'
import type { ApiResponse } from '@/lib/types'

/**
 * Financial Resources API Client
 *
 * Uses auto-generated types from backend:
 * - App.Data.FinancialResourceData
 * - App.Enums.FinancialResourceType
 */

// Re-export generated types for convenience
export type FinancialResource = App.Data.FinancialResourceData
export type FinancialResourceType = App.Enums.FinancialResourceType

// Form data (subset for create/update)
export interface FinancialResourceFormData {
  type: FinancialResourceType
  name: string
  description?: string
  details?: Record<string, unknown>
  is_active?: boolean
  is_default?: boolean
  sort_order?: number
  notes?: string
}

export interface FinancialResourcesParams {
  type?: FinancialResourceType
  is_active?: boolean
  only_default?: boolean
  include_inactive?: boolean
}

export const financialResourcesApi = {
  /**
   * Get all financial resources
   */
  getAll: async (
    params?: FinancialResourcesParams
  ): Promise<FinancialResource[]> => {
    const response = await apiClient.get<
      ApiResponse<FinancialResource[]>
    >('/financial-resources', { params })
    return response.data.data
  },

  /**
   * Get active financial resources (for quotes/invoices)
   */
  getActive: async (): Promise<FinancialResource[]> => {
    const response = await apiClient.get<
      ApiResponse<FinancialResource[]>
    >('/financial-resources/active')
    return response.data.data
  },

  /**
   * Get default financial resources (one per type)
   */
  getDefaults: async (): Promise<FinancialResource[]> => {
    const response = await apiClient.get<
      ApiResponse<FinancialResource[]>
    >('/financial-resources/defaults')
    return response.data.data
  },

  /**
   * Get single financial resource
   */
  getById: async (id: number): Promise<FinancialResource> => {
    const response = await apiClient.get<ApiResponse<FinancialResource>>(
      `/financial-resources/${id}`
    )
    return response.data.data
  },

  /**
   * Create financial resource
   */
  create: async (
    data: FinancialResourceFormData
  ): Promise<FinancialResource> => {
    const response = await apiClient.post<ApiResponse<FinancialResource>>(
      '/financial-resources',
      data
    )
    return response.data.data
  },

  /**
   * Update financial resource
   */
  update: async (
    id: number,
    data: Partial<FinancialResourceFormData>
  ): Promise<FinancialResource> => {
    const response = await apiClient.put<ApiResponse<FinancialResource>>(
      `/financial-resources/${id}`,
      data
    )
    return response.data.data
  },

  /**
   * Delete financial resource
   */
  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/financial-resources/${id}`)
  },
}
