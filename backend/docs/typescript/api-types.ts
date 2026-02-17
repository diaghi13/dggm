/**
 * API Response Helper Types
 *
 * These types wrap the generated Spatie Data types for API responses.
 * Import these alongside the generated types for full type safety.
 *
 * Usage:
 *   import type { QuoteData } from '@/lib/types/generated'
 *   import type { ApiResponse, PaginatedResponse } from '@/lib/types/api'
 *
 *   type QuoteListResponse = PaginatedResponse<QuoteData>
 *   type QuoteSingleResponse = ApiResponse<QuoteData>
 */

/**
 * Standard API response wrapper
 */
export interface ApiResponse<T> {
  success: boolean
  data: T
  message?: string
  meta?: {
    timestamp?: string
    [key: string]: any
  }
}

/**
 * Paginated API response
 */
export interface PaginatedResponse<T> {
  success: boolean
  data: T[]
  meta: PaginationMeta
  links: PaginationLinks
}

/**
 * Pagination metadata
 */
export interface PaginationMeta {
  current_page: number
  per_page: number
  total: number
  last_page: number
  from?: number
  to?: number
  path?: string
}

/**
 * Pagination links
 */
export interface PaginationLinks {
  first: string
  last: string
  prev: string | null
  next: string | null
}

/**
 * Error response structure
 */
export interface ApiErrorResponse {
  success: false
  message: string
  errors?: Record<string, string[]>
  error?: {
    code?: string
    details?: any
  }
}

/**
 * Standard API filters (query params)
 */
export interface ApiFilters {
  page?: number
  per_page?: number
  sort?: string
  order?: 'asc' | 'desc'
  search?: string
  [key: string]: any
}

/**
 * Quote-specific filters
 */
export interface QuoteFilters extends ApiFilters {
  status?: string
  customer_id?: number
  project_manager_id?: number
  date_from?: string
  date_to?: string
  min_amount?: number
  max_amount?: number
}

/**
 * Product-specific filters
 */
export interface ProductFilters extends ApiFilters {
  category_id?: number
  brand_id?: number
  is_active?: boolean
  product_type?: 'article' | 'service' | 'composite'
  in_stock?: boolean
}

/**
 * Customer-specific filters
 */
export interface CustomerFilters extends ApiFilters {
  type?: 'individual' | 'company'
  is_active?: boolean
  city?: string
  province?: string
}

/**
 * Warehouse-specific filters
 */
export interface WarehouseFilters extends ApiFilters {
  type?: 'central' | 'site_storage' | 'mobile_truck'
  is_active?: boolean
  manager_id?: number
}

/**
 * Stock movement filters
 */
export interface StockMovementFilters extends ApiFilters {
  product_id?: number
  warehouse_id?: number
  type?: string
  date_from?: string
  date_to?: string
}

/**
 * DDT (transport document) filters
 */
export interface DdtFilters extends ApiFilters {
  type?: string
  status?: string
  supplier_id?: number
  customer_id?: number
  site_id?: number
  warehouse_id?: number
  date_from?: string
  date_to?: string
}

/**
 * Generic list response (for simple arrays)
 */
export interface ListResponse<T> {
  success: boolean
  data: T[]
  message?: string
}

/**
 * Bulk operation response
 */
export interface BulkOperationResponse {
  success: boolean
  message: string
  processed: number
  failed: number
  errors?: Array<{
    id: number | string
    error: string
  }>
}

/**
 * File upload response
 */
export interface FileUploadResponse {
  success: boolean
  data: {
    id?: number
    filename: string
    url: string
    size: number
    mime_type: string
  }
  message?: string
}

/**
 * Export/Download response
 */
export interface ExportResponse {
  success: boolean
  data: {
    filename: string
    url: string
    expires_at?: string
  }
  message?: string
}

/**
 * Validation error details
 */
export interface ValidationError {
  field: string
  messages: string[]
}

/**
 * Form submission state
 */
export type FormState<T = any> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'error'; error: string; errors?: Record<string, string[]> }

// ============================================================================
// QUOTE SYSTEM - Specific Response Types
// ============================================================================

/**
 * Quote calculation response (for price calculations)
 */
export interface QuoteCalculationResponse {
  success: boolean
  data: {
    subtotal: number
    discount_percentage: number
    discount_amount: number
    tax_percentage: number
    tax_amount: number
    total_amount: number
    deposit_percentage: number | null
    deposit_amount: number | null
  }
}

/**
 * Quote item calculation
 */
export interface QuoteItemCalculationResponse {
  success: boolean
  data: {
    subtotal: number
    discount_amount: number
    total: number
    vat_amount: number
    total_with_vat: number
  }
}

/**
 * Quote status update response
 */
export interface QuoteStatusUpdateResponse {
  success: boolean
  data: {
    id: number
    status: string
    sent_date?: string | null
    approved_date?: string | null
  }
  message: string
}

/**
 * Quote PDF generation response
 */
export interface QuotePdfResponse {
  success: boolean
  data: {
    pdf_url: string
    filename: string
    expires_at: string
  }
  message?: string
}

// ============================================================================
// WAREHOUSE SYSTEM - Specific Response Types
// ============================================================================

/**
 * Inventory summary response
 */
export interface InventorySummaryResponse {
  success: boolean
  data: {
    total_value: number
    total_products: number
    low_stock_count: number
    out_of_stock_count: number
  }
}

/**
 * Stock availability check
 */
export interface StockAvailabilityResponse {
  success: boolean
  data: {
    product_id: number
    warehouse_id: number
    available: boolean
    quantity_available: number
    quantity_reserved: number
    quantity_free: number
  }
}

// ============================================================================
// PRODUCT SYSTEM - Specific Response Types
// ============================================================================

/**
 * Product price calculation
 */
export interface ProductPriceCalculationResponse {
  success: boolean
  data: {
    standard_cost: number
    sale_price: number
    markup_percentage: number
    composite_total_cost?: number
  }
}

/**
 * Product search/autocomplete response
 */
export interface ProductSearchResponse {
  success: boolean
  data: Array<{
    id: number
    code: string
    name: string
    description: string | null
    sale_price: number
    unit: string | null
    available_stock: number
  }>
}

// ============================================================================
// Type Guards
// ============================================================================

/**
 * Check if response is successful
 */
export function isSuccessResponse<T>(
  response: ApiResponse<T> | ApiErrorResponse
): response is ApiResponse<T> {
  return response.success === true
}

/**
 * Check if response is error
 */
export function isErrorResponse(
  response: ApiResponse<any> | ApiErrorResponse
): response is ApiErrorResponse {
  return response.success === false
}

/**
 * Check if response is paginated
 */
export function isPaginatedResponse<T>(
  response: ApiResponse<T> | PaginatedResponse<T>
): response is PaginatedResponse<T> {
  return 'meta' in response && 'current_page' in response.meta
}

// ============================================================================
// Utility Types
// ============================================================================

/**
 * Extract data type from API response
 */
export type ExtractData<T> = T extends ApiResponse<infer U>
  ? U
  : T extends PaginatedResponse<infer U>
  ? U[]
  : never

/**
 * Make all properties optional recursively
 */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P]
}

/**
 * Make specific properties required
 */
export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>

/**
 * Make specific properties optional
 */
export type OptionalFields<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>

/**
 * Timestamp fields
 */
export interface Timestamps {
  created_at?: string
  updated_at?: string
  deleted_at?: string | null
}

/**
 * Soft delete mixin
 */
export interface SoftDeletes {
  deleted_at: string | null
}
