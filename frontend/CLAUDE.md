# CLAUDE.md - Frontend Guidelines

**IMPORTANTE**: Questo file contiene le convenzioni specifiche del progetto DGGM.
Per le best practices ufficiali di Next.js 16, consulta sempre `NEXTJS_GUIDELINES.md`.

This file provides specific guidance for working with the Next.js frontend application.

## Frontend Overview

**Technology**: Next.js 16 with App Router, TypeScript, Tailwind CSS 4, shadcn/ui

**Architecture**: SPA (Single Page Application) consuming REST API from Laravel backend.

**LEGGI SEMPRE**: `NEXTJS_GUIDELINES.md` per le best practices ufficiali Next.js 16.

## Directory Structure

```
frontend/
├── app/                          # Next.js App Router
│   ├── (auth)/                  # Auth pages (Route groups)
│   │   └── login/
│   ├── dashboard/               # Dashboard pages (protected)
│   │   ├── page.tsx            # Dashboard home
│   │   ├── layout.tsx          # Dashboard layout
│   │   ├── customers/          # Customers
│   │   ├── suppliers/          # Suppliers
│   │   ├── sites/              # Construction sites
│   │   ├── quotes/             # Quotes
│   │   ├── materials/          # Materials
│   │   ├── warehouses/         # Warehouses
│   │   ├── inventory/          # Inventory
│   │   ├── stock-movements/    # Stock movements
│   │   ├── ddts/               # DDT (Delivery notes)
│   │   ├── users/              # User management
│   │   └── settings/           # Settings
│   ├── layout.tsx              # Root layout
│   ├── page.tsx                # Home page
│   ├── globals.css             # Global styles
│   └── providers.tsx           # React providers
│
├── components/
│   ├── ui/                     # shadcn/ui base components
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   ├── card.tsx
│   │   ├── dialog.tsx
│   │   ├── table.tsx
│   │   └── ...
│   ├── dashboard-layout.tsx    # Main dashboard layout
│   ├── page-header.tsx         # Reusable page header
│   ├── theme-toggle.tsx        # Dark mode toggle
│   ├── data-table-wrapper.tsx  # Table wrapper
│   ├── table-components.tsx    # Reusable table components
│   └── [feature]-form.tsx      # Feature-specific forms
│
├── lib/
│   ├── api/
│   │   ├── client.ts          # Axios instance
│   │   ├── customers.ts       # Customer API
│   │   ├── users.ts           # Users/Roles API
│   │   └── ...                # Other API modules
│   ├── hooks/
│   │   └── use-auth.ts        # Custom hooks
│   ├── types/
│   │   └── index.ts           # TypeScript types
│   ├── storage.ts             # localStorage wrapper
│   └── utils.ts               # Utility functions (cn, etc.)
│
├── stores/
│   └── auth-store.ts          # Zustand stores
│
├── public/                     # Static assets
│
├── .env.local                 # Environment variables
├── next.config.ts             # Next.js config
├── tailwind.config.ts         # Tailwind config
├── tsconfig.json              # TypeScript config
└── package.json
```

## Technology Stack

### Core
- **Next.js 14+**: App Router (no Pages Router)
- **TypeScript**: Strict mode enabled
- **React 18+**: Server & Client Components

### UI & Styling
- **Tailwind CSS 4**: Utility-first CSS
- **shadcn/ui**: Unstyled, accessible components
- **Radix UI**: Primitives per shadcn/ui
- **Lucide React**: Icon library
- **next-themes**: Dark mode management

### State Management
- **Zustand**: Global client state (auth, UI state)
- **TanStack Query (React Query)**: Server state, caching, mutations
- **localStorage**: Persistence (via wrapper `lib/storage.ts`)

### Forms & Validation
- **React Hook Form**: Form state management
- **Zod**: Schema validation
- **@hookform/resolvers**: RHF + Zod integration

### Data Fetching
- **Axios**: HTTP client
- **TanStack Query**: Query caching, optimistic updates

### Other
- **date-fns**: Date manipulation
- **sonner**: Toast notifications
- **@dnd-kit**: Drag & drop (quote items)

## Coding Standards

### TypeScript

**Always use strict types**:
```typescript
// ✅ Good
interface User {
  id: number;
  name: string;
  email: string;
  roles: string[];
}

// ❌ Avoid
const user: any = { ... }
```

**Use type inference when obvious**:
```typescript
// ✅ Good
const [isOpen, setIsOpen] = useState(false);  // boolean inferred

// ❌ Unnecessary
const [isOpen, setIsOpen] = useState<boolean>(false);
```

**Export types with interfaces**:
```typescript
// lib/types/index.ts
export interface Customer {
  id: number;
  name: string;
  email: string | null;
}
```

### Component Structure

**Use 'use client' only when needed**:
```typescript
// Client component (uses hooks, events)
'use client';

import { useState } from 'react';

export function MyComponent() {
  const [count, setCount] = useState(0);
  return <button onClick={() => setCount(count + 1)}>{count}</button>;
}
```

```typescript
// Server component (default, no 'use client')
import { Suspense } from 'react';

export default async function Page() {
  const data = await fetch('...');
  return <div>{data}</div>;
}
```

**Component naming**:
- File: `kebab-case.tsx` (es: `customer-form.tsx`)
- Component: `PascalCase` (es: `CustomerForm`)
- Props: `{ComponentName}Props` (es: `CustomerFormProps`)

### File Naming Conventions

- **Components**: `kebab-case.tsx` (customer-form.tsx)
- **Pages (App Router)**: `page.tsx`, `layout.tsx`, `loading.tsx`, `error.tsx`
- **API routes**: `route.ts`
- **Types**: `index.ts` o `types.ts`
- **Utils**: `kebab-case.ts` (api-client.ts)

### Import Order

```typescript
// 1. React & Next.js
import { useState } from 'react';
import { useRouter } from 'next/navigation';

// 2. External libraries
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';

// 3. Internal absolute imports
import { Button } from '@/components/ui/button';
import { customersApi } from '@/lib/api/customers';

// 4. Relative imports
import { CustomerForm } from './customer-form';

// 5. Types
import type { Customer } from '@/lib/types';
```

## UI Components & Patterns

### Dark Mode Support

**ALWAYS add dark mode classes**:
```typescript
// ✅ Good - Full dark mode support
<div className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">
  <button className="bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700">
    Click me
  </button>
</div>

// ❌ Bad - No dark mode
<div className="bg-white text-black">
  <button className="bg-blue-500">Click me</button>
</div>
```

**Color Palette** (use these):
- Background: `bg-white dark:bg-slate-900`
- Surface: `bg-slate-50 dark:bg-slate-800`
- Border: `border-slate-200 dark:border-slate-800`
- Text primary: `text-slate-900 dark:text-slate-100`
- Text secondary: `text-slate-600 dark:text-slate-400`
- Muted: `text-slate-500 dark:text-slate-500`

### Reusable Components Pattern

**Create reusable wrappers**:
```typescript
// components/data-table-wrapper.tsx
export function DataTableWrapper({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-md border border-slate-200 dark:border-slate-800">
      {children}
    </div>
  );
}

// components/table-components.tsx
export function DataTableRow({ children, ...props }: React.ComponentProps<'tr'>) {
  return (
    <TableRow 
      className="hover:bg-slate-50 dark:hover:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800"
      {...props}
    >
      {children}
    </TableRow>
  );
}
```

### Form Pattern (React Hook Form + Zod)

```typescript
// 1. Define schema
const customerSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email'),
  is_active: z.boolean(),
});

type CustomerFormData = z.infer<typeof customerSchema>;

// 2. Setup form
const form = useForm<CustomerFormData>({
  resolver: zodResolver(customerSchema),
  defaultValues: {
    name: '',
    email: '',
    is_active: true,
  },
});

// 3. Handle submit
const onSubmit = (data: CustomerFormData) => {
  mutation.mutate(data);
};
```

### API Pattern (TanStack Query)

```typescript
// Fetch data
const { data, isLoading, error } = useQuery({
  queryKey: ['customers', { search, page }],
  queryFn: () => customersApi.getAll({ search, page }),
});

// Mutation
const mutation = useMutation({
  mutationFn: customersApi.create,
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['customers'] });
    toast.success('Cliente creato');
  },
  onError: (error: any) => {
    toast.error(error.response?.data?.message || 'Errore');
  },
});
```

### Dialog/Modal Pattern

```typescript
const [isOpen, setIsOpen] = useState(false);
const [editing, setEditing] = useState<Customer | null>(null);

// Open for create
const handleCreate = () => {
  setEditing(null);
  setIsOpen(true);
};

// Open for edit
const handleEdit = (customer: Customer) => {
  setEditing(customer);
  setIsOpen(true);
};

<Dialog open={isOpen} onOpenChange={setIsOpen}>
  <DialogContent>
    <CustomerForm 
      customer={editing} 
      onSubmit={handleSubmit}
      onCancel={() => setIsOpen(false)}
    />
  </DialogContent>
</Dialog>
```

## State Management

### Zustand Store Pattern

```typescript
// stores/auth-store.ts
import { create } from 'zustand';

interface AuthState {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  login: async (email, password) => {
    const { data } = await authApi.login(email, password);
    set({ user: data.user, token: data.token });
  },
  logout: () => {
    set({ user: null, token: null });
  },
}));
```

### localStorage Wrapper

**Always use the wrapper** (`lib/storage.ts`):
```typescript
import { storage } from '@/lib/storage';

// Save
storage.set('sidebar_collapsed', true);

// Get with default
const collapsed = storage.get<boolean>('sidebar_collapsed', false);

// Remove
storage.remove('sidebar_collapsed');
```

## API Client Pattern

### Structure
```typescript
// lib/api/customers.ts
import { apiClient } from './client';

export const customersApi = {
  getAll: async (params?: { search?: string; page?: number }) => {
    const response = await apiClient.get('/customers', { params });
    return response.data;
  },

  getById: async (id: number) => {
    const response = await apiClient.get(`/customers/${id}`);
    return response.data.data;
  },

  create: async (data: CreateCustomerData) => {
    const response = await apiClient.post('/customers', data);
    return response.data.data;
  },

  update: async (id: number, data: UpdateCustomerData) => {
    const response = await apiClient.patch(`/customers/${id}`, data);
    return response.data.data;
  },

  delete: async (id: number) => {
    const response = await apiClient.delete(`/customers/${id}`);
    return response.data;
  },
};
```

### Error Handling
```typescript
// client.ts - Axios interceptor
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Redirect to login
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
```

## Routing (App Router)

### Page Structure
```typescript
// app/dashboard/customers/page.tsx
'use client';

export default function CustomersPage() {
  return (
    <div className="space-y-6">
      <PageHeader 
        title="Customers"
        description="Manage your customers"
        icon={Users}
      />
      {/* Content */}
    </div>
  );
}
```

### Dynamic Routes
```typescript
// app/dashboard/customers/[id]/page.tsx
'use client';

import { useParams } from 'next/navigation';

export default function CustomerDetailPage() {
  const params = useParams();
  const customerId = parseInt(params.id as string);
  
  const { data: customer } = useQuery({
    queryKey: ['customer', customerId],
    queryFn: () => customersApi.getById(customerId),
  });
  
  // ...
}
```

### Navigation
```typescript
// Use next/navigation
import { useRouter } from 'next/navigation';

const router = useRouter();

// Navigate
router.push('/dashboard/customers');
router.push(`/dashboard/customers/${id}`);

// Go back
router.back();
```

## Performance Best Practices

### Code Splitting
```typescript
// Lazy load heavy components
import dynamic from 'next/dynamic';

const HeavyChart = dynamic(() => import('./heavy-chart'), {
  loading: () => <div>Loading...</div>,
  ssr: false, // Client-only if needed
});
```

### React Query Optimization
```typescript
// Prefetch on hover
const queryClient = useQueryClient();

<button
  onMouseEnter={() => {
    queryClient.prefetchQuery({
      queryKey: ['customer', id],
      queryFn: () => customersApi.getById(id),
    });
  }}
>
  View Details
</button>
```

### Memoization
```typescript
// Expensive calculations
const total = useMemo(() => {
  return items.reduce((sum, item) => sum + item.price, 0);
}, [items]);

// Callbacks passed to children
const handleClick = useCallback(() => {
  console.log('clicked');
}, []);
```

## Accessibility (a11y)

### ARIA Labels
```typescript
<button aria-label="Chiudi dialog">
  <X className="h-4 w-4" />
</button>

<input 
  type="text" 
  aria-describedby="email-error"
  aria-invalid={!!errors.email}
/>
{errors.email && (
  <span id="email-error" role="alert">
    {errors.email.message}
  </span>
)}
```

### Keyboard Navigation
```typescript
// Table row clickable
<TableRow 
  onClick={() => router.push(`/customers/${id}`)}
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      router.push(`/customers/${id}`);
    }
  }}
  tabIndex={0}
  className="cursor-pointer"
>
```

## Testing (Optional but Recommended)

### Component Tests (Vitest + Testing Library)
```typescript
import { render, screen } from '@testing-library/react';
import { Button } from './button';

test('renders button with text', () => {
  render(<Button>Click me</Button>);
  expect(screen.getByText('Click me')).toBeInTheDocument();
});
```

### E2E Tests (Playwright)
```typescript
import { test, expect } from '@playwright/test';

test('user can login', async ({ page }) => {
  await page.goto('/login');
  await page.fill('[name="email"]', 'test@example.com');
  await page.fill('[name="password"]', 'password');
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL('/dashboard');
});
```

## Common Pitfalls & Solutions

### 1. Hydration Mismatch
```typescript
// ❌ Bad - Server/client mismatch
const [mounted, setMounted] = useState(false);
useEffect(() => setMounted(true), []);
if (!mounted) return null;

// ✅ Good - Use Suspense or client-only
'use client';  // Mark as client component
```

### 2. localStorage in Server Component
```typescript
// ❌ Bad - Server can't access localStorage
const value = localStorage.getItem('key');

// ✅ Good - Use client component + useEffect
'use client';
const [value, setValue] = useState<string | null>(null);
useEffect(() => {
  setValue(storage.get('key'));
}, []);
```

### 3. Missing Dark Mode Classes
```typescript
// ❌ Bad
<div className="bg-white text-black">

// ✅ Good
<div className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">
```

### 4. Any Type Usage
```typescript
// ❌ Bad
const handleSubmit = (data: any) => { ... }

// ✅ Good
interface FormData { name: string; email: string }
const handleSubmit = (data: FormData) => { ... }
```

## Environment Variables

### .env.local
```bash
# API
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1

# App
NEXT_PUBLIC_APP_NAME=DGGM ERP

# Feature Flags (optional)
NEXT_PUBLIC_ENABLE_FEATURE_X=true
```

**Note**: `NEXT_PUBLIC_` prefix for client-side access.

## Build & Deploy

### Development
```bash
npm run dev              # Start dev server (port 3000)
npm run dev -- -p 3001   # Custom port
```

### Production
```bash
npm run build           # Build for production
npm run start          # Start production server
```

### Linting
```bash
npm run lint           # ESLint check
npm run lint:fix       # Auto-fix issues
```

## Common Components Reference

### shadcn/ui Components Available
- Button, Input, Label, Textarea
- Card, CardHeader, CardTitle, CardContent
- Dialog, DialogContent, DialogHeader, DialogTitle
- Table, TableHeader, TableRow, TableCell
- Badge, Switch, Checkbox
- Select, Tabs, Avatar
- AlertDialog, DropdownMenu

### Custom Components
- `PageHeader` - Page title with icon
- `DataTableWrapper` - Styled table container
- `DataTableRow` - Table row with hover
- `StatusBadge` - Active/inactive badge
- `TypeBadge` - Type indicator badge
- `ThemeToggle` - Dark mode toggle
- `DashboardLayout` - Main layout with sidebar

## Tips for Claude

1. **Always add dark mode**: Every new component must have `dark:` classes
2. **Use existing components**: Check `components/ui/` before creating new ones
3. **Follow the pattern**: Look at similar files for consistent structure
4. **Type everything**: No `any`, use type or interface
5. **API errors**: Show `error.response?.data?.message` in toasts
6. **Loading states**: Use `isLoading` from React Query
7. **Invalidate queries**: After mutation, invalidate related queries
8. **localStorage wrapper**: Use `storage.ts`, not localStorage directly
9. **Accessibility**: Add `aria-label` and keyboard support
10. **Test mentally**: Think dark mode, mobile, API errors

---

**Last Updated**: January 2025
**Next.js Version**: 14+
**TypeScript**: Strict Mode

