# TypeScript Types Generation Guide

## Overview

This project uses `spatie/laravel-typescript-transformer` to automatically generate TypeScript types from Laravel Spatie Data DTOs and Enums.

**Auto-generated types location:**
- Backend reference: `backend/resources/types/generated.d.ts`
- **Frontend integration**: `frontend/lib/types/generated.d.ts` (MAIN OUTPUT)

## Quick Start

### Generate Types

```bash
cd /Users/davidedonghi/Apps/dggm/backend
php artisan typescript:transform
```

**Output:**
```
+---------------------------------------+---------------------------------------+
| PHP class                             | TypeScript entity                     |
+---------------------------------------+---------------------------------------+
| App\Enums\QuoteItemType               | App.Enums.QuoteItemType              |
| App\Data\QuoteData                    | App.Data.QuoteData                   |
| App\Data\QuoteItemData                | App.Data.QuoteItemData               |
| ... (58 types total)                  |                                       |
+---------------------------------------+---------------------------------------+
```

### Configuration

**File**: `config/typescript-transformer.php`

```php
'output_file' => __DIR__.'/../../frontend/lib/types/generated.d.ts',
```

**Key settings:**
- Types written directly to frontend `lib/types/`
- Enums transformed to TypeScript string union types (not native enums)
- Nullable properties become `T | null` (not optional `?`)

## Usage in Frontend

### Import Generated Types

```typescript
// Import specific types
import type {
  QuoteData,
  QuoteItemData,
  QuoteItemType,
  WarrantyTypeData,
  PaymentTermData
} from '@/lib/types/generated'

// Or use with namespace
const quote: App.Data.QuoteData = {
  title: 'New Quote',
  customer_id: 1,
  // ...
}
```

### API Response Types

Create wrapper types for API responses:

```typescript
// lib/types/api.ts
import type { QuoteData, QuoteItemData } from './generated'

export interface ApiResponse<T> {
  success: boolean
  data: T
  message?: string
}

export interface PaginatedResponse<T> {
  success: boolean
  data: T[]
  meta: {
    current_page: number
    per_page: number
    total: number
    last_page: number
  }
  links: {
    first: string
    last: string
    prev: string | null
    next: string | null
  }
}

// Usage
export type QuoteListResponse = PaginatedResponse<QuoteData>
export type QuoteSingleResponse = ApiResponse<QuoteData>
```

### Form Validation (Zod)

Convert generated types to Zod schemas for form validation:

```typescript
// lib/validations/quote.ts
import { z } from 'zod'
import type { QuoteItemType } from '@/lib/types/generated'

export const quoteItemSchema = z.object({
  quote_id: z.number(),
  type: z.enum(['section', 'item', 'labor', 'material'] satisfies QuoteItemType[]),
  description: z.string().min(1, 'Description is required'),
  quantity: z.number().nullable(),
  unit_price: z.number().nullable(),
  unit: z.string().nullable(),
  discount_percentage: z.number().default(0),
  vat_rate: z.number().nullable(),
  include_image: z.boolean().default(false),
  notes: z.string().nullable(),
})

export const quoteSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  customer_id: z.number(),
  project_manager_id: z.number().nullable(),
  description: z.string().nullable(),
  price_list_id: z.number().nullable(),
  payment_term_id: z.number().nullable(),
  warranty_type_id: z.number().nullable(),
  issue_date: z.string().nullable(),
  expiry_date: z.string().nullable(),
  discount_percentage: z.number().default(0),
  deposit_percentage: z.number().nullable(),
  notes: z.string().nullable(),
  items: z.array(quoteItemSchema).optional(),
})

export type QuoteFormInput = z.infer<typeof quoteSchema>
```

### API Client with Types

```typescript
// lib/api/quotes.ts
import type { QuoteData, QuoteItemData } from '@/lib/types/generated'
import type { PaginatedResponse, ApiResponse } from '@/lib/types/api'

export const quotesApi = {
  getAll: async (params?: QuoteFilters): Promise<PaginatedResponse<QuoteData>> => {
    const response = await apiClient.get('/api/v1/quotes', { params })
    return response.data
  },

  getById: async (id: number): Promise<ApiResponse<QuoteData>> => {
    const response = await apiClient.get(`/api/v1/quotes/${id}`)
    return response.data
  },

  create: async (data: Partial<QuoteData>): Promise<ApiResponse<QuoteData>> => {
    const response = await apiClient.post('/api/v1/quotes', data)
    return response.data
  },

  update: async (id: number, data: Partial<QuoteData>): Promise<ApiResponse<QuoteData>> => {
    const response = await apiClient.put(`/api/v1/quotes/${id}`, data)
    return response.data
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/api/v1/quotes/${id}`)
  },
}
```

### React Query Hooks

```typescript
// lib/hooks/use-quotes.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { quotesApi } from '@/lib/api/quotes'
import type { QuoteData } from '@/lib/types/generated'

export function useQuotes(filters?: QuoteFilters) {
  return useQuery({
    queryKey: ['quotes', filters],
    queryFn: () => quotesApi.getAll(filters),
  })
}

export function useQuote(id: number) {
  return useQuery({
    queryKey: ['quotes', id],
    queryFn: () => quotesApi.getById(id),
    enabled: !!id,
  })
}

export function useCreateQuote() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: quotesApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotes'] })
    },
  })
}

export function useUpdateQuote() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<QuoteData> }) =>
      quotesApi.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['quotes'] })
      queryClient.invalidateQueries({ queryKey: ['quotes', id] })
    },
  })
}
```

## Available Types

### Quote System (28 types)

**Data DTOs** (exported as `App.Data.*`):
- `QuoteData` - Main quote entity
- `QuoteItemData` - Quote line items (sections, items, labor, materials)
- `WarrantyTypeData` - Warranty configurations
- `PaymentTermData` - Payment terms
- `CustomerData` - Customer information
- `ProductData` - Product details
- `PriceListData` - Price lists
- `PriceListItemData` - Price list items
- `UserData` - User/employee data
- `SiteData` - Construction site data

**Enums** (exported as `App.Enums.*`):
- `QuoteItemType` - `'section' | 'item' | 'labor' | 'material'`
- `ProductType` - `'article' | 'service' | 'composite'`
- `StockMovementType` - Movement types
- `DdtType` - Document types
- `DdtStatus` - Document statuses
- `WarehouseType` - Warehouse types
- `SupplierType` - `'materials' | 'personnel' | 'both'`

### Warehouse System (15 types)

- `WarehouseData`
- `InventoryData`
- `StockMovementData`
- `DdtData` - Transport documents
- `DdtItemData`

### Product System (10 types)

- `ProductData`
- `ProductCategoryData`
- `ProductBrandData`
- `ProductRelationData`
- `ProductMediaData`
- `ProductComponentData`
- `SupplierProductData`

### Full Type List (58 total)

Run `php artisan typescript:transform` to see all available types.

## Type Safety Best Practices

### 1. Use Type Inference

```typescript
// ✅ Good - Type inferred from API
const { data: quote } = useQuote(1)
if (quote?.data) {
  // quote.data is typed as QuoteData
  console.log(quote.data.title)
}

// ❌ Avoid - Manual typing when unnecessary
const quote: QuoteData = await quotesApi.getById(1)
```

### 2. Narrow Enum Types

```typescript
import type { QuoteItemType } from '@/lib/types/generated'

function getItemIcon(type: QuoteItemType) {
  switch (type) {
    case 'section':
      return <FolderIcon />
    case 'item':
      return <PackageIcon />
    case 'labor':
      return <UsersIcon />
    case 'material':
      return <BoxIcon />
    // TypeScript ensures all cases covered
  }
}
```

### 3. Partial for Updates

```typescript
// Full type for create
const createQuote = (data: QuoteData) => { ... }

// Partial for update (only changed fields)
const updateQuote = (id: number, data: Partial<QuoteData>) => { ... }
```

### 4. Pick/Omit for Forms

```typescript
// Only fields needed for form
type QuoteFormData = Pick<QuoteData,
  'title' | 'customer_id' | 'description' | 'issue_date' | 'expiry_date'
>

// Exclude computed fields
type QuoteInput = Omit<QuoteData,
  'id' | 'code' | 'created_at' | 'updated_at' | 'subtotal' | 'total_amount'
>
```

## Workflow

### 1. Backend Changes

When you add/modify Spatie Data or Enums:

```bash
# After changes to app/Data/ or app/Enums/
php artisan typescript:transform
```

### 2. Frontend Integration

```bash
# Switch to frontend
cd ../frontend

# Types are already in lib/types/generated.d.ts
# TypeScript will automatically recognize them

# Run type check
npm run type-check

# Start dev server
npm run dev
```

### 3. Commit Both

```bash
git add backend/resources/types/generated.d.ts
git add frontend/lib/types/generated.d.ts
git commit -m "chore: regenerate TypeScript types"
```

## Troubleshooting

### Types Not Found

```typescript
// ❌ Error: Cannot find name 'App'
const quote: App.Data.QuoteData = {}

// ✅ Solution: Import from generated.d.ts
import type { QuoteData } from '@/lib/types/generated'
const quote: QuoteData = {}
```

### Outdated Types

```bash
# Backend changed but frontend types stale
cd backend
php artisan typescript:transform

# Restart frontend dev server
cd ../frontend
npm run dev
```

### Nullable vs Optional

Generated types use `T | null` for nullable fields:

```typescript
// Generated type
type QuoteData = {
  description: string | null  // Can be string or null
  items?: QuoteItemData[]     // Optional (may not exist)
}

// Usage
const quote: QuoteData = {
  description: null,  // ✅ Valid
  // items not provided ✅ Valid
}
```

### Date Handling

All dates are typed as `string` (ISO 8601):

```typescript
import type { QuoteData } from '@/lib/types/generated'
import { parseISO, format } from 'date-fns'

const quote: QuoteData = {
  issue_date: '2026-02-10',
  // ...
}

// Display formatted
const formatted = quote.issue_date
  ? format(parseISO(quote.issue_date), 'dd/MM/yyyy')
  : 'N/A'
```

## Configuration Reference

**Backend**: `config/typescript-transformer.php`

```php
return [
    // Scan app/ directory for Data classes and Enums
    'auto_discover_types' => [
        app_path(),
    ],

    // Collectors (auto-discover annotated classes)
    'collectors' => [
        Spatie\LaravelData\Support\TypeScriptTransformer\DataTypeScriptCollector::class,
        Spatie\TypeScriptTransformer\Collectors\DefaultCollector::class,
        Spatie\TypeScriptTransformer\Collectors\EnumCollector::class,
    ],

    // Type replacements (Carbon -> string)
    'default_type_replacements' => [
        DateTime::class => 'string',
        Carbon\Carbon::class => 'string',
    ],

    // Output file (writes to frontend)
    'output_file' => __DIR__.'/../../frontend/lib/types/generated.d.ts',

    // Format: TypeScript type definitions (not modules)
    'writer' => Spatie\TypeScriptTransformer\Writers\TypeDefinitionWriter::class,

    // Enums as union types (not native TS enums)
    'transform_to_native_enums' => false,

    // Nullable as `T | null` (not optional `?`)
    'transform_null_to_optional' => false,
];
```

## CI/CD Integration

Add to GitHub Actions workflow:

```yaml
# .github/workflows/test.yml
- name: Generate TypeScript types
  run: |
    cd backend
    php artisan typescript:transform

- name: Check for type changes
  run: |
    if ! git diff --quiet frontend/lib/types/generated.d.ts; then
      echo "⚠️ TypeScript types out of sync!"
      echo "Run: php artisan typescript:transform"
      exit 1
    fi
```

## Examples

See complete examples in:
- **Backend DTOs**: `app/Data/QuoteData.php`
- **Frontend API**: `frontend/lib/api/quotes.ts`
- **Frontend Hooks**: `frontend/lib/hooks/use-quotes.ts`
- **Frontend Forms**: `frontend/components/quote-form.tsx`

## Resources

- [Spatie Laravel TypeScript Transformer](https://github.com/spatie/laravel-typescript-transformer)
- [Spatie Laravel Data](https://spatie.be/docs/laravel-data)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)

---

**Last Updated**: February 2026
**Generated Types**: 58 (28 Data, 30 Enums)
**Output**: `frontend/lib/types/generated.d.ts`
