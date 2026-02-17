import { useQuery } from '@tanstack/react-query'
import { financialResourcesApi } from '@/lib/api/financial-resources'

/**
 * Hook to get active financial resources
 *
 * @example
 * // In quote/invoice forms
 * function QuoteForm() {
 *   const { data: financialResources } = useActiveFinancialResources()
 *
 *   return (
 *     <div>
 *       <h3>Pagamento su:</h3>
 *       <select>
 *         {financialResources?.map(fr => (
 *           <option key={fr.id} value={fr.id}>
 *             {fr.name} - {fr.type}
 *           </option>
 *         ))}
 *       </select>
 *     </div>
 *   )
 * }
 */
export function useActiveFinancialResources() {
  return useQuery({
    queryKey: ['financial-resources', 'active'],
    queryFn: () => financialResourcesApi.getActive(),
    staleTime: 10 * 60 * 1000, // 10 minutes
  })
}

/**
 * Hook to get default financial resources (one per type)
 */
export function useDefaultFinancialResources() {
  return useQuery({
    queryKey: ['financial-resources', 'defaults'],
    queryFn: () => financialResourcesApi.getDefaults(),
    staleTime: 10 * 60 * 1000, // 10 minutes
  })
}

/**
 * Hook to get all financial resources
 */
export function useFinancialResources(params?: {
  type?: 'bank_account' | 'cash' | 'card'
  is_active?: boolean
}) {
  return useQuery({
    queryKey: ['financial-resources', params],
    queryFn: () => financialResourcesApi.getAll(params),
  })
}
