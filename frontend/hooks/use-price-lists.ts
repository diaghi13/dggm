import { useQuery } from '@tanstack/react-query'
import { priceListsApi } from '@/lib/api/price-lists'

/**
 * Hook to get default price list
 *
 * @example
 * // In a product form
 * function ProductForm() {
 *   const { data: defaultPriceList, isLoading } = useDefaultPriceList()
 *
 *   // Use default price list ID
 *   const priceListId = defaultPriceList?.id
 *
 *   return (
 *     <div>
 *       {isLoading ? 'Loading...' : `Price List: ${defaultPriceList?.name}`}
 *     </div>
 *   )
 * }
 *
 * @example
 * // Conditional loading
 * const { data, isLoading } = useDefaultPriceList({ enabled: shouldLoad })
 */
export function useDefaultPriceList(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ['price-lists', 'default'],
    queryFn: () => priceListsApi.getDefault(),
    enabled: options?.enabled ?? true,
    staleTime: 5 * 60 * 1000, // 5 minutes (default price list rarely changes)
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  })
}
