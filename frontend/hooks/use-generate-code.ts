import { useQuery } from '@tanstack/react-query'
import { generateCode, type EntityType, type GenerateCodeParams } from '@/lib/api/codes'

/**
 * Hook to generate progressive code for entity
 *
 * @example
 * // In a form component
 * function QuoteForm() {
 *   const { data: generatedCode, isLoading } = useGenerateCode('quote')
 *
 *   // Use generatedCode as default value for code input
 *   const defaultCode = generatedCode?.code || ''
 *
 *   return (
 *     <input
 *       name="code"
 *       defaultValue={defaultCode}
 *       disabled={isLoading}
 *     />
 *   )
 * }
 *
 * @example
 * // With custom year
 * const { data } = useGenerateCode('quote', { year: 2025 })
 *
 * @example
 * // Disabled until user clicks "Generate"
 * const [shouldGenerate, setShouldGenerate] = useState(false)
 * const { data } = useGenerateCode('quote', undefined, { enabled: shouldGenerate })
 */
export function useGenerateCode(
  entity: EntityType,
  params?: GenerateCodeParams,
  options?: {
    enabled?: boolean
    refetchOnMount?: boolean
  }
) {
  return useQuery({
    queryKey: ['codes', 'generate', entity, params],
    queryFn: () => generateCode(entity, params),
    enabled: options?.enabled ?? true,
    refetchOnMount: options?.refetchOnMount ?? false,
    refetchOnWindowFocus: false,
    staleTime: 0, // Always fresh to get the latest code
  })
}

/**
 * Hook to generate quote code
 */
export function useGenerateQuoteCode(
  params?: GenerateCodeParams,
  options?: { enabled?: boolean }
) {
  const query = useGenerateCode('quote', params, options)
  return {
    ...query,
    code: query.data?.code,
  }
}

/**
 * Hook to generate product code
 */
export function useGenerateProductCode(
  params?: GenerateCodeParams,
  options?: { enabled?: boolean }
) {
  const query = useGenerateCode('product', params, options)
  return {
    ...query,
    code: query.data?.code,
  }
}

/**
 * Hook to generate supplier code
 */
export function useGenerateSupplierCode(
  params?: GenerateCodeParams,
  options?: { enabled?: boolean }
) {
  const query = useGenerateCode('supplier', params, options)
  return {
    ...query,
    code: query.data?.code,
  }
}
