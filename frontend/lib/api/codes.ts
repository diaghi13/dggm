import { apiClient } from './client'

/**
 * Code Generation API
 *
 * Generates progressive codes for various entities
 */

export type EntityType =
  | 'quote'
  | 'product'
  | 'supplier'
  | 'worker'
  | 'contractor'
  | 'ddt'
  | 'movement'
  | 'site'

export interface GenerateCodeParams {
  year?: number
  date?: string // Format: Ymd (e.g., "20260211")
}

export interface GenerateCodeResponse {
  entity: EntityType
  code: string
  context: {
    year?: number
    date?: string
  }
}

/**
 * Generate next available code for entity
 *
 * @example
 * // Generate next quote code
 * const { code } = await generateCode('quote')
 * console.log(code) // "PREV-2026-0004"
 *
 * @example
 * // Generate quote code for specific year
 * const { code } = await generateCode('quote', { year: 2025 })
 * console.log(code) // "PREV-2025-0123"
 */
export async function generateCode(
  entity: EntityType,
  params?: GenerateCodeParams
): Promise<GenerateCodeResponse> {
  const response = await apiClient.get<{ data: GenerateCodeResponse }>(
    `/codes/generate/${entity}`,
    { params }
  )

  return response.data.data
}

/**
 * Generate code for quote
 */
export async function generateQuoteCode(params?: GenerateCodeParams): Promise<string> {
  const { code } = await generateCode('quote', params)
  return code
}

/**
 * Generate code for product
 */
export async function generateProductCode(params?: GenerateCodeParams): Promise<string> {
  const { code } = await generateCode('product', params)
  return code
}

/**
 * Generate code for supplier
 */
export async function generateSupplierCode(params?: GenerateCodeParams): Promise<string> {
  const { code } = await generateCode('supplier', params)
  return code
}

/**
 * Generate code for worker
 */
export async function generateWorkerCode(params?: GenerateCodeParams): Promise<string> {
  const { code } = await generateCode('worker', params)
  return code
}

/**
 * Generate code for contractor
 */
export async function generateContractorCode(params?: GenerateCodeParams): Promise<string> {
  const { code } = await generateCode('contractor', params)
  return code
}

/**
 * Generate code for DDT
 */
export async function generateDdtCode(params?: GenerateCodeParams): Promise<string> {
  const { code } = await generateCode('ddt', params)
  return code
}

/**
 * Generate code for movement
 */
export async function generateMovementCode(params?: GenerateCodeParams): Promise<string> {
  const { code } = await generateCode('movement', params)
  return code
}

/**
 * Generate code for site
 */
export async function generateSiteCode(params?: GenerateCodeParams): Promise<string> {
  const { code } = await generateCode('site', params)
  return code
}
