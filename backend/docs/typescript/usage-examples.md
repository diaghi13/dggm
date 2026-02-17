# TypeScript Types - Usage Examples

Complete examples for using generated TypeScript types in the frontend.

---

## Table of Contents

1. [Basic Imports](#basic-imports)
2. [API Client Integration](#api-client-integration)
3. [React Query Hooks](#react-query-hooks)
4. [Form Validation with Zod](#form-validation-with-zod)
5. [Component Props](#component-props)
6. [State Management](#state-management)
7. [Real-World Examples](#real-world-examples)

---

## Basic Imports

### Import Generated Types

```typescript
// Single type import
import type { QuoteData } from '@/lib/types/generated'

// Multiple types
import type {
  QuoteData,
  QuoteItemData,
  QuoteItemType,
  CustomerData,
  ProductData,
  WarrantyTypeData,
  PaymentTermData,
} from '@/lib/types/generated'

// Namespace access (alternative)
const quote: App.Data.QuoteData = {
  title: 'New Quote',
  customer_id: 1,
  // ...
}
```

### Import API Helper Types

```typescript
import type {
  ApiResponse,
  PaginatedResponse,
  QuoteFilters,
} from '@/lib/types/api'
```

---

## API Client Integration

### Quote API Client

**File**: `frontend/lib/api/quotes.ts`

```typescript
import { apiClient } from '@/lib/api/client'
import type { QuoteData } from '@/lib/types/generated'
import type {
  ApiResponse,
  PaginatedResponse,
  QuoteFilters,
} from '@/lib/types/api'

export const quotesApi = {
  /**
   * Get all quotes (paginated)
   */
  getAll: async (
    filters?: QuoteFilters
  ): Promise<PaginatedResponse<QuoteData>> => {
    const response = await apiClient.get('/api/v1/quotes', {
      params: filters,
    })
    return response.data
  },

  /**
   * Get single quote by ID
   */
  getById: async (id: number): Promise<ApiResponse<QuoteData>> => {
    const response = await apiClient.get(`/api/v1/quotes/${id}`)
    return response.data
  },

  /**
   * Create new quote
   */
  create: async (
    data: Partial<QuoteData>
  ): Promise<ApiResponse<QuoteData>> => {
    const response = await apiClient.post('/api/v1/quotes', data)
    return response.data
  },

  /**
   * Update existing quote
   */
  update: async (
    id: number,
    data: Partial<QuoteData>
  ): Promise<ApiResponse<QuoteData>> => {
    const response = await apiClient.put(`/api/v1/quotes/${id}`, data)
    return response.data
  },

  /**
   * Delete quote
   */
  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/api/v1/quotes/${id}`)
  },

  /**
   * Update quote status
   */
  updateStatus: async (
    id: number,
    status: string
  ): Promise<ApiResponse<QuoteData>> => {
    const response = await apiClient.patch(`/api/v1/quotes/${id}/status`, {
      status,
    })
    return response.data
  },

  /**
   * Generate PDF for quote
   */
  generatePdf: async (id: number): Promise<ApiResponse<{ pdf_url: string }>> => {
    const response = await apiClient.post(`/api/v1/quotes/${id}/pdf`)
    return response.data
  },
}
```

### Product API Client

**File**: `frontend/lib/api/products.ts`

```typescript
import { apiClient } from '@/lib/api/client'
import type { ProductData } from '@/lib/types/generated'
import type {
  ApiResponse,
  PaginatedResponse,
  ProductFilters,
} from '@/lib/types/api'

export const productsApi = {
  getAll: async (
    filters?: ProductFilters
  ): Promise<PaginatedResponse<ProductData>> => {
    const response = await apiClient.get('/api/v1/products', {
      params: filters,
    })
    return response.data
  },

  search: async (query: string): Promise<ApiResponse<ProductData[]>> => {
    const response = await apiClient.get('/api/v1/products/search', {
      params: { q: query },
    })
    return response.data
  },

  getById: async (id: number): Promise<ApiResponse<ProductData>> => {
    const response = await apiClient.get(`/api/v1/products/${id}`)
    return response.data
  },
}
```

---

## React Query Hooks

### Quote Hooks

**File**: `frontend/lib/hooks/use-quotes.ts`

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { quotesApi } from '@/lib/api/quotes'
import type { QuoteData } from '@/lib/types/generated'
import type { QuoteFilters } from '@/lib/types/api'
import { toast } from 'sonner'

/**
 * Get all quotes (paginated)
 */
export function useQuotes(filters?: QuoteFilters) {
  return useQuery({
    queryKey: ['quotes', filters],
    queryFn: () => quotesApi.getAll(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

/**
 * Get single quote
 */
export function useQuote(id: number | undefined) {
  return useQuery({
    queryKey: ['quotes', id],
    queryFn: () => quotesApi.getById(id!),
    enabled: !!id,
  })
}

/**
 * Create quote mutation
 */
export function useCreateQuote() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: Partial<QuoteData>) => quotesApi.create(data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['quotes'] })
      toast.success(response.message || 'Quote created successfully')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create quote')
    },
  })
}

/**
 * Update quote mutation
 */
export function useUpdateQuote() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<QuoteData> }) =>
      quotesApi.update(id, data),
    onSuccess: (response, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['quotes'] })
      queryClient.invalidateQueries({ queryKey: ['quotes', id] })
      toast.success(response.message || 'Quote updated successfully')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update quote')
    },
  })
}

/**
 * Delete quote mutation
 */
export function useDeleteQuote() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => quotesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotes'] })
      toast.success('Quote deleted successfully')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete quote')
    },
  })
}

/**
 * Update quote status
 */
export function useUpdateQuoteStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      quotesApi.updateStatus(id, status),
    onSuccess: (response, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['quotes'] })
      queryClient.invalidateQueries({ queryKey: ['quotes', id] })
      toast.success(response.message || 'Status updated successfully')
    },
  })
}
```

### Product Hooks

**File**: `frontend/lib/hooks/use-products.ts`

```typescript
import { useQuery } from '@tanstack/react-query'
import { productsApi } from '@/lib/api/products'
import type { ProductFilters } from '@/lib/types/api'

export function useProducts(filters?: ProductFilters) {
  return useQuery({
    queryKey: ['products', filters],
    queryFn: () => productsApi.getAll(filters),
    staleTime: 10 * 60 * 1000, // 10 minutes (products change less often)
  })
}

export function useProduct(id: number | undefined) {
  return useQuery({
    queryKey: ['products', id],
    queryFn: () => productsApi.getById(id!),
    enabled: !!id,
  })
}

export function useProductSearch(query: string) {
  return useQuery({
    queryKey: ['products', 'search', query],
    queryFn: () => productsApi.search(query),
    enabled: query.length >= 2, // Only search if query is 2+ chars
    staleTime: 5 * 60 * 1000,
  })
}
```

---

## Form Validation with Zod

### Quote Form Schema

**File**: `frontend/lib/validations/quote.ts`

```typescript
import { z } from 'zod'
import type { QuoteItemType } from '@/lib/types/generated'

/**
 * Quote item validation schema
 */
export const quoteItemSchema = z.object({
  id: z.number().optional(),
  quote_id: z.number(),
  parent_id: z.number().nullable().optional(),
  product_id: z.number().nullable().optional(),
  type: z.enum(['section', 'item', 'labor', 'material'] satisfies QuoteItemType[]),
  description: z.string().min(1, 'Description is required'),
  code: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  sort_order: z.number().default(0),
  unit: z.string().nullable().optional(),
  quantity: z.number().nullable().optional(),
  unit_price: z.number().nullable().optional(),
  discount_percentage: z.number().min(0).max(100).default(0),
  vat_rate: z.number().nullable().optional(),
  hide_unit_price: z.boolean().default(false),
  include_image: z.boolean().default(false),
})

/**
 * Quote validation schema
 */
export const quoteSchema = z.object({
  // Required fields
  title: z.string().min(1, 'Title is required'),
  customer_id: z.number({
    required_error: 'Customer is required',
  }),

  // Optional identifiers
  project_manager_id: z.number().nullable().optional(),
  price_list_id: z.number().nullable().optional(),
  payment_term_id: z.number().nullable().optional(),
  warranty_type_id: z.number().nullable().optional(),
  site_id: z.number().nullable().optional(),

  // Text fields
  description: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  terms_and_conditions: z.string().nullable().optional(),

  // Dates
  issue_date: z.string().nullable().optional(),
  expiry_date: z.string().nullable().optional(),

  // Address
  address: z.string().nullable().optional(),
  city: z.string().nullable().optional(),
  province: z.string().nullable().optional(),
  postal_code: z.string().nullable().optional(),

  // Amounts
  discount_percentage: z.number().min(0).max(100).default(0),
  tax_percentage: z.number().min(0).max(100).default(22),
  deposit_percentage: z.number().min(0).max(100).nullable().optional(),

  // Work timeline
  work_start_description: z.string().nullable().optional(),
  work_start_date: z.string().nullable().optional(),
  work_duration_description: z.string().nullable().optional(),
  work_end_date: z.string().nullable().optional(),

  // Display flags
  show_tax: z.boolean().default(true),
  tax_included: z.boolean().default(false),
  show_unit_prices: z.boolean().default(true),
  show_product_codes: z.boolean().default(true),
  show_vat: z.boolean().default(true),
  vat_included_in_prices: z.boolean().default(false),
  include_terms_and_conditions: z.boolean().default(true),

  // Items
  items: z.array(quoteItemSchema).optional(),
})

/**
 * Infer TypeScript type from schema
 */
export type QuoteFormInput = z.infer<typeof quoteSchema>
export type QuoteItemFormInput = z.infer<typeof quoteItemSchema>
```

### Form Component with Validation

**File**: `frontend/components/quote-form.tsx`

```typescript
'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { quoteSchema, type QuoteFormInput } from '@/lib/validations/quote'
import { useCreateQuote, useUpdateQuote } from '@/lib/hooks/use-quotes'
import type { QuoteData } from '@/lib/types/generated'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

interface QuoteFormProps {
  quote?: QuoteData
  onSuccess?: () => void
}

export function QuoteForm({ quote, onSuccess }: QuoteFormProps) {
  const isEditing = !!quote?.id

  const form = useForm<QuoteFormInput>({
    resolver: zodResolver(quoteSchema),
    defaultValues: quote || {
      title: '',
      customer_id: 0,
      discount_percentage: 0,
      tax_percentage: 22,
      show_tax: true,
      show_unit_prices: true,
      show_product_codes: true,
      show_vat: true,
    },
  })

  const createMutation = useCreateQuote()
  const updateMutation = useUpdateQuote()

  const onSubmit = async (data: QuoteFormInput) => {
    try {
      if (isEditing) {
        await updateMutation.mutateAsync({
          id: quote.id!,
          data,
        })
      } else {
        await createMutation.mutateAsync(data)
      }

      onSuccess?.()
    } catch (error) {
      console.error('Form submission error:', error)
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <div>
        <label htmlFor="title">Title</label>
        <Input
          id="title"
          {...form.register('title')}
          className={form.formState.errors.title ? 'border-red-500' : ''}
        />
        {form.formState.errors.title && (
          <p className="text-sm text-red-500">
            {form.formState.errors.title.message}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="description">Description</label>
        <Textarea
          id="description"
          {...form.register('description')}
          rows={4}
        />
      </div>

      {/* More fields... */}

      <div className="flex gap-2">
        <Button
          type="submit"
          disabled={createMutation.isPending || updateMutation.isPending}
        >
          {isEditing ? 'Update' : 'Create'} Quote
        </Button>
      </div>
    </form>
  )
}
```

---

## Component Props

### Typed Component Props

```typescript
import type { QuoteData, QuoteItemData } from '@/lib/types/generated'

/**
 * Quote card props
 */
interface QuoteCardProps {
  quote: QuoteData
  onEdit?: (quote: QuoteData) => void
  onDelete?: (id: number) => void
  onStatusChange?: (id: number, status: string) => void
}

export function QuoteCard({
  quote,
  onEdit,
  onDelete,
  onStatusChange,
}: QuoteCardProps) {
  return (
    <div className="rounded-lg border p-4">
      <h3>{quote.title}</h3>
      <p>{quote.customer?.company_name}</p>
      <p>Total: €{quote.total_amount.toFixed(2)}</p>
      {/* ... */}
    </div>
  )
}

/**
 * Quote item row props
 */
interface QuoteItemRowProps {
  item: QuoteItemData
  depth?: number
  onEdit?: (item: QuoteItemData) => void
  onDelete?: (id: number) => void
}

export function QuoteItemRow({
  item,
  depth = 0,
  onEdit,
  onDelete,
}: QuoteItemRowProps) {
  const isSection = item.type === 'section'

  return (
    <tr style={{ paddingLeft: `${depth * 20}px` }}>
      <td>{item.description}</td>
      <td>{item.quantity}</td>
      <td>{item.unit_price ? `€${item.unit_price.toFixed(2)}` : '-'}</td>
      <td>€{item.total.toFixed(2)}</td>
      {/* ... */}
    </tr>
  )
}
```

---

## State Management

### Zustand Store with Types

**File**: `frontend/lib/store/quote-store.ts`

```typescript
import { create } from 'zustand'
import type { QuoteData, QuoteItemData } from '@/lib/types/generated'

interface QuoteStore {
  currentQuote: QuoteData | null
  selectedItems: number[]
  isEditing: boolean

  setCurrentQuote: (quote: QuoteData | null) => void
  setSelectedItems: (ids: number[]) => void
  toggleItemSelection: (id: number) => void
  setIsEditing: (editing: boolean) => void
  clearSelection: () => void
}

export const useQuoteStore = create<QuoteStore>((set) => ({
  currentQuote: null,
  selectedItems: [],
  isEditing: false,

  setCurrentQuote: (quote) => set({ currentQuote: quote }),

  setSelectedItems: (ids) => set({ selectedItems: ids }),

  toggleItemSelection: (id) =>
    set((state) => ({
      selectedItems: state.selectedItems.includes(id)
        ? state.selectedItems.filter((itemId) => itemId !== id)
        : [...state.selectedItems, id],
    })),

  setIsEditing: (editing) => set({ isEditing: editing }),

  clearSelection: () => set({ selectedItems: [] }),
}))
```

---

## Real-World Examples

### Quote List Page

**File**: `frontend/app/(dashboard)/quotes/page.tsx`

```typescript
import { useQuotes } from '@/lib/hooks/use-quotes'
import { QuoteCard } from '@/components/quotes/quote-card'
import type { QuoteFilters } from '@/lib/types/api'

export default function QuotesPage() {
  const [filters, setFilters] = useState<QuoteFilters>({
    page: 1,
    per_page: 20,
  })

  const { data, isLoading, error } = useQuotes(filters)

  if (isLoading) return <div>Loading...</div>
  if (error) return <div>Error loading quotes</div>
  if (!data?.data) return <div>No quotes found</div>

  return (
    <div className="space-y-4">
      <h1>Quotes</h1>

      <div className="grid gap-4">
        {data.data.map((quote) => (
          <QuoteCard key={quote.id} quote={quote} />
        ))}
      </div>

      {/* Pagination */}
      <div className="flex justify-between">
        <p>
          Showing {data.meta.from} to {data.meta.to} of {data.meta.total}
        </p>
        {/* Pagination controls */}
      </div>
    </div>
  )
}
```

### Product Search Autocomplete

**File**: `frontend/components/product-autocomplete.tsx`

```typescript
'use client'

import { useState, useCallback } from 'react'
import { useProductSearch } from '@/lib/hooks/use-products'
import type { ProductData } from '@/lib/types/generated'
import { debounce } from 'lodash'

interface ProductAutocompleteProps {
  onSelect: (product: ProductData) => void
}

export function ProductAutocomplete({ onSelect }: ProductAutocompleteProps) {
  const [query, setQuery] = useState('')
  const { data, isLoading } = useProductSearch(query)

  const debouncedSetQuery = useCallback(
    debounce((value: string) => setQuery(value), 300),
    []
  )

  return (
    <div className="relative">
      <input
        type="text"
        placeholder="Search products..."
        onChange={(e) => debouncedSetQuery(e.target.value)}
        className="w-full rounded border p-2"
      />

      {isLoading && <div>Searching...</div>}

      {data?.data && data.data.length > 0 && (
        <div className="absolute z-10 mt-1 w-full rounded border bg-white shadow-lg dark:bg-slate-900">
          {data.data.map((product) => (
            <button
              key={product.id}
              onClick={() => onSelect(product)}
              className="w-full p-2 text-left hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <div className="font-medium">{product.name}</div>
              <div className="text-sm text-slate-600 dark:text-slate-400">
                {product.code} - €{product.sale_price?.toFixed(2)}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
```

---

## Summary

**Key Points:**
1. Import types from `@/lib/types/generated`
2. Use API helper types from `@/lib/types/api`
3. Validate with Zod schemas derived from generated types
4. Type React Query hooks with generated types
5. Type component props with generated types
6. Use type guards for runtime checks

**Benefits:**
- Full IntelliSense/autocomplete
- Compile-time type checking
- Refactoring safety
- Self-documenting code
- Catch errors before runtime

---

**Last Updated**: February 2026
