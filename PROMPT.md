# DGGM ERP - AI System Prompt

**Purpose**: System prompt for AI agents working on this project
**Target**: Claude Code, ralph-loop, and other AI development tools
**Priority**: 🔴 CRITICAL - Read at the start of EVERY session
**Last Updated**: January 2026

---

## 🎯 PROJECT MISSION

Build a **production-ready ERP system** for service-based companies that manages the complete lifecycle from customer quotes to project completion, invoicing, and cost analysis.

**Target Users**: Service companies (construction, electrical, plumbing, automation, event services, equipment rental, personnel cooperatives) - single-tenant deployment
**Scope**: Warehouse management, internal/external employee management, commercial, administrative, and accounting operations
**Tech Stack**: Laravel 12 + Next.js 16
**Architecture**: API-first backend + SPA frontend

---

## 📋 CORE OBJECTIVES

### Primary Goals
1. **Complete Core Modules** - Finish essential business logic (Sites, Quotes, Invoicing, Time Tracking)
2. **Maintain Architectural Integrity** - Follow established patterns religiously
3. **Production Quality** - Every feature must be complete, tested, and production-ready
4. **Dark Mode Universal** - Every UI element must support dark mode
5. **Type Safety** - No `any` in TypeScript, strict PHP types

### Success Metrics
- ✅ All CRUD operations functional for core modules
- ✅ All backend actions include Events & Listeners
- ✅ All frontend pages have dark mode support
- ✅ Zero architectural violations (Controller thin, Actions for writes, etc.)
- ✅ API consistent with standardized response format
- ✅ All validation via FormRequests (backend) and Zod (frontend)

---

## 🏗️ ARCHITECTURAL CONSTRAINTS

### Backend Pattern (MANDATORY)
```
HTTP Request
    ↓
Controller (THIN - HTTP only)
    ├─→ authorize() (Policy)
    ├─→ validate() via Spatie Data DTO
    └─→ Delegate to:
          ├─→ Action (for WRITE: create, update, delete)
          │     ├─→ DB::transaction()
          │     ├─→ Eloquent operations
          │     └─→ Event::dispatch() (ALWAYS after persist)
          │
          ├─→ Query Class (for COMPLEX reads in app/Queries/)
          │
          └─→ Eloquent (for SIMPLE reads directly in Controller)
                ↓
          Service (ONLY for: calculations, GPS, pricing - NO database logic)
                ↓
          Value Objects (data + validation, NO business logic)
                ↓
          Events → Listeners (side effects: log, cache, notify)
                ↓
          Spatie Data DTO (input validation + output Resource generation)
```

**Rules:**
- ❌ NO business logic in Controllers
- ❌ NO database operations in Services (use Actions for writes, Query Classes for complex reads)
- ❌ NO Domain folder structure (use app/Actions/, app/Queries/, app/Services/)
- ❌ NO Repository pattern (Eloquent IS the repository)
- ❌ NO complex logic in Value Objects (use Services)
- ❌ NO duplicate Resource classes (use Spatie Data for both input validation AND output)
- ✅ Actions in `app/Actions/{Module}/` (e.g., CreateProductAction, UpdateProductAction)
- ✅ Query Classes in `app/Queries/{Module}/` for complex reads (e.g., GetLowStockProductsQuery)
- ✅ Actions MUST use DB::transaction()
- ✅ Actions MUST dispatch Events after persistence (when needed for logs, notifications, side effects)
- ✅ Services ONLY for calculations, utilities (PriceCalculatorService, GeolocationService)
- ✅ Spatie Data DTOs for input validation (ProductData::from($request))
- ✅ Spatie Data DTOs for output Resources (ProductData::from($product))
- ✅ Generate TypeScript types from Spatie Data (php artisan typescript:transform)
- ✅ Value Objects implement Castable for DB storage

### Frontend Pattern (MANDATORY)
```
Component Hierarchy
    ↓
Server Component (default - NO 'use client')
    ├─→ Data fetch on server
    ├─→ Pass data as props to Client Components
    └─→ 'use client' ONLY for:
          ├─→ State (useState, useEffect, useContext)
          ├─→ Events (onClick, onChange, onSubmit)
          ├─→ Hooks (custom hooks, useRouter)
          └─→ Browser APIs (localStorage, window)
```

**Next.js 16 Breaking Changes:**
- ⚠️ `params`, `searchParams`, `cookies()`, `headers()` are now ASYNC (must await)
- ⚠️ `'use cache'` directive replaces automatic caching
- ⚠️ Node.js 20.9.0+ required (18.x not supported)

**Rules:**
- ❌ NO 'use client' in layout.tsx or page.tsx unless absolutely necessary
- ❌ NO fetch to own API routes (access DB directly in Server Components)
- ❌ NO missing dark mode classes (every element must have dark:)
- ❌ NO `any` in TypeScript
- ✅ Server Components for data fetching
- ✅ Client Components pushed to leaf nodes
- ✅ TanStack Query for client-side caching
- ✅ React Hook Form + Zod for forms
- ✅ Consistent dark mode (dark:bg-*, dark:text-*, dark:border-*)

---

## 🚨 CRITICAL OPERATIONAL RULES

### 1. Read Documentation FIRST
```
BEFORE writing ANY code:
    ├─→ Backend: Read AI_ARCHITECTURE_RULES.md (MANDATORY)
    ├─→ Frontend: Read NEXTJS_GUIDELINES.md + frontend/CLAUDE.md (MANDATORY)
    ├─→ Always: Check TODO.md for current state
    └─→ Always: Verify task is actually completed (check if code exists, don't trust TODO blindly)
```

### 2. Follow Established Patterns
- **Do NOT** invent new patterns without explicit approval
- **Do NOT** refactor architecture without discussion
- **Look** at existing implementations as reference (e.g., Warehouse, Product)
- **Reuse** existing components, services, and utilities

### 3. Maintain TODO.md
- **Update** TODO.md after completing tasks
- **Mark** completed items with ✅
- **Add** new tasks discovered during development
- **Never** leave TODO.md outdated

### 4. Code Quality Standards
```bash
# Backend
./vendor/bin/pint              # ALWAYS run before commit
php artisan typescript:transform  # Generate TypeScript types from Spatie Data

# Frontend
npm run lint:fix               # ALWAYS run before commit
```

### 5. Dark Mode is Non-Negotiable (Frontend)
```tsx
// ❌ WRONG
<div className="bg-white text-black">

// ✅ CORRECT
<div className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">
```

Every single component, page, and UI element must support dark mode. No exceptions.

---

## 📖 DECISION TREES FOR AI

### Backend: Should I create a Service?

```
Is it a calculation, utility, or external API integration (NO database operations)?
├─→ YES → Create Service in app/Services/
│         Examples: PriceCalculatorService, GeolocationService, VATCalculatorService
│         Pattern: Stateless, pure functions, injected into Actions
│         Contains: calculations, conversions, external APIs
│         Does NOT contain: database queries, CRUD operations
└─→ NO → Is it a WRITE operation (create, update, delete)?
         ├─→ YES → Use Action in app/Actions/{Module}/
         │         Example: CreateProductAction, UpdateProductAction
         │         Pattern: DB::transaction(), Event::dispatch()
         └─→ NO → Is it a complex READ query (joins, aggregations, filters)?
                  ├─→ YES → Use Query Class in app/Queries/{Module}/
                  │         Example: GetLowStockProductsQuery
                  └─→ NO → Use Eloquent directly in Controller (simple reads)
```

### Frontend: Should I use 'use client'?

```
Do I need state or event handlers?
├─→ NO → Use Server Component (default)
│        Fetch data on server, pass as props
└─→ YES → Is this a layout or page.tsx?
           ├─→ YES → Keep Server Component, isolate client logic
           │         in separate client component
           └─→ NO → Use 'use client' in this component only
```

### Value Objects vs Services?

```
Is this a domain concept to STORE in DB?
├─→ YES → Create Value Object in app/ValueObjects/
│         Pattern: Immutable, implements Castable
│         Examples: Money, Coordinates, Address
│         Contains: validation, simple predicates, format
│         Does NOT contain: complex calculations
└─→ NO → Is it reusable logic on Value Objects?
         ├─→ YES → Create Service
         │         Examples: PriceCalculatorService, GeolocationService
         │         Pattern: Uses VOs as parameters
         └─→ NO → Inline in Action
```

---

## 🎯 COMPLETION CRITERIA

### Task is "Done" When:
1. ✅ Code follows architectural patterns from AI_ARCHITECTURE_RULES.md
2. ✅ Backend:
   - Controller is thin (no business logic)
   - Action includes DB::transaction() and Events
   - Service exists ONLY for domain logic (if needed)
   - FormRequest validates input
   - Policy authorizes access
   - Resource formats output
   - DTO uses Spatie Data
   - Code formatted with Pint
3. ✅ Frontend:
   - Server Components used by default
   - 'use client' only where needed
   - Dark mode classes on ALL elements
   - TypeScript strict (no `any`)
   - TanStack Query for API calls
   - React Hook Form + Zod for forms
   - Code formatted with ESLint
4. ✅ TODO.md updated with completion status
5. ✅ No console errors
6. ✅ Feature tested manually

### Module is "Complete" When:
1. ✅ All CRUD operations functional
2. ✅ List view with search/filter/pagination
3. ✅ Detail view with tabs (if applicable)
4. ✅ Create/Edit forms working
5. ✅ Dark mode fully supported (frontend)
6. ✅ API endpoints documented in routes/api.php
7. ✅ Policies authorize all operations
8. ✅ Events dispatched for audit/cache/notifications
9. ✅ Seeders provide test data
10. ✅ TODO.md reflects completion

---

## 🔧 COMMON TASKS & PATTERNS

### Create New Backend Module
```bash
# 1. Migration
php artisan make:migration create_{table}_table

# 2. Model
php artisan make:model {Model}

# 3. Spatie Data DTO (FIRST - for validation AND resource)
# Create in app/Data/{Model}Data.php using Spatie Data
# This replaces BOTH FormRequest validation AND Resource transformation

# 4. Action (manually in app/Actions/{Module}/)
# Create: CreateAction, UpdateAction, DeleteAction
# Follow template from CreateWarehouseAction.php
# Pattern:
#   - Accept {Model}Data as parameter
#   - Use DB::transaction()
#   - Eloquent operations
#   - Event::dispatch() after persist

# 5. Query Class (if complex reads needed)
# Create in app/Queries/{Module}/
# Example: GetLowStock{Model}sQuery.php

# 6. Service (ONLY if calculations/utilities needed, NO database)
# Create in app/Services/
# Follow template from PriceCalculatorService.php

# 7. Controller (THIN - HTTP only)
php artisan make:controller Api/V1/{Model}Controller --api
# Pattern:
#   - Inject Actions in constructor
#   - authorize() via Policy
#   - Validate via {Model}Data::from($request)
#   - Delegate to Action (write) or Query (complex read) or Eloquent (simple read)
#   - Return {Model}Data::from($result) for output

# 8. Policy
php artisan make:policy {Model}Policy

# 9. Events (when needed for logs, notifications, side effects)
php artisan make:event {Model}Created
php artisan make:event {Model}Updated
php artisan make:event {Model}Deleted
php artisan make:listener Log{Model}Activity

# 10. Generate TypeScript types
php artisan typescript:transform

# 11. Format code
./vendor/bin/pint

# 12. Verify implementation (check code exists, not just TODO)
# - Check Actions exist in app/Actions/{Module}/
# - Check Query Classes exist in app/Queries/{Module}/ (if needed)
# - Check Events dispatched in Actions
# - Check Spatie Data used for input AND output

# 13. Update TODO.md with ✅ status
```

### Create New Frontend Page
```tsx
// 1. Create page file
// app/(dashboard)/{module}/page.tsx

// 2. Use Server Component (default)
export default async function Page() {
  // Fetch data on server if needed
  return <div>...</div>
}

// 3. Create API client
// lib/api/{module}.ts
export const {module}Api = {
  getAll: async () => apiClient.get('/api/v1/{module}'),
  // ...
}

// 4. Create types
// lib/types/index.ts
export interface {Module} {
  id: number
  // ...
}

// 5. Create form component (Client Component)
// components/{module}-form.tsx
'use client'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
// ...

// 6. Add dark mode classes everywhere
className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"

// 7. Format code
npm run lint:fix

// 8. Update TODO.md
```

---

## 🚫 ANTI-PATTERNS TO AVOID

### Backend
```php
// ❌ WRONG: Business logic in Controller
public function store(Request $request) {
    $data = $request->all();
    $warehouse = Warehouse::create($data);
    if ($warehouse->type === 'main') {
        // complex logic here...
    }
}

// ❌ WRONG: Using FormRequest + Resource separately
public function store(StoreWarehouseRequest $request) {
    $this->authorize('create', Warehouse::class);
    $warehouse = $this->createAction->execute($request->validated());
    return new WarehouseResource($warehouse);  // Duplicate definitions!
}

// ✅ CORRECT: Delegate to Action with Spatie Data (input + output)
public function store(Request $request) {
    $this->authorize('create', Warehouse::class);

    $warehouse = $this->createAction->execute(
        WarehouseData::from($request)  // Input validation
    );

    return WarehouseData::from($warehouse);  // Output transformation (same DTO!)
}

// ❌ WRONG: Database operations in Service
class WarehouseService {
    public function create(array $data) {
        return Warehouse::create($data);  // NO! Use Action
    }
}

// ✅ CORRECT: Service for calculations only
class PriceCalculatorService {
    public function calculateMarkup(Money $cost, float $percent): Money {
        return $cost->multiply(1 + $percent / 100);
    }
}

// ✅ CORRECT: Action for writes with Event
class CreateWarehouseAction {
    public function execute(WarehouseData $data): Warehouse {
        return DB::transaction(function () use ($data) {
            $warehouse = Warehouse::create($data->toArray());

            // Dispatch event for logs, notifications, cache
            WarehouseCreated::dispatch($warehouse, [
                'user_id' => auth()->id(),
                'ip_address' => request()->ip(),
            ]);

            return $warehouse;
        });
    }
}

// ✅ CORRECT: Query Class for complex reads
class GetLowStockWarehousesQuery {
    public function execute(): Collection {
        return Warehouse::whereHas('inventory', function ($q) {
            $q->whereRaw('quantity_available <= minimum_stock');
        })->with('inventory.product')->get();
    }
}
```

### Frontend
```tsx
// ❌ WRONG: 'use client' too high
'use client'
export default function Layout({ children }) {
  return <div>{children}</div>  // Everything becomes client-side!
}

// ✅ CORRECT: Push to leaf
// layout.tsx (Server Component)
import SearchBox from './search-box'  // Client component

export default function Layout({ children }) {
  return (
    <>
      <Header />       {/* Server */}
      <SearchBox />    {/* Client */}
      {children}
    </>
  )
}

// ❌ WRONG: No dark mode
<div className="bg-white text-black">

// ✅ CORRECT: Full dark mode
<div className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">

// ❌ WRONG: Any type
const handleSubmit = (data: any) => { ... }

// ✅ CORRECT: Typed
interface FormData { name: string; email: string }
const handleSubmit = (data: FormData) => { ... }
```

---

## 📊 PROJECT STATE AWARENESS

### Check Before Starting Work
```
1. Read TODO.md to understand current state
2. Identify what's ✅ Done, 🚧 In Progress, ❌ Missing
3. Choose a task from ❌ Missing or 🚧 In Progress
4. Read relevant guidelines (use GUIDELINES_INDEX.md)
5. Start coding following patterns
```

### After Completing Work
```
1. Run code formatters (Pint for backend, ESLint for frontend)
2. Verify dark mode (frontend)
3. Test manually
4. Update TODO.md with ✅ status
5. Commit with conventional commit message
```

---

## 🎓 LEARNING FROM EXISTING CODE

### Reference Implementations
When implementing a new module, study these complete examples:

**Backend:**
- **Warehouse** - Complete DDD implementation with Actions, Events, Queries
- **Product** - Comprehensive with components, dependencies, semantic search
- **Worker** - Complex with rates, payroll, invitations

**Frontend:**
- **Customers** - Full CRUD with list, detail, create, edit
- **Materials** - Complex with tabs, components, dependencies
- **Warehouses** - Clean implementation with inventory, movements

**Pattern:**
1. Find similar module
2. Copy structure
3. Adapt to new domain
4. Follow same patterns

---

## 🔍 DEBUGGING CHECKLIST

### Backend Issues
```
□ Controller is thin (only HTTP concerns)?
□ Action exists in app/Actions/{Module}/?
□ Action uses DB::transaction()?
□ Action dispatches Events (when needed for logs/notifications)?
□ Spatie Data DTO used for BOTH input validation AND output?
□ NO separate FormRequest classes (replaced by Spatie Data)?
□ NO separate Resource classes (replaced by Spatie Data)?
□ Policy authorizes access?
□ Service contains ONLY calculations/utilities (NO database operations)?
□ Query Class in app/Queries/ for complex reads?
□ Routes registered in routes/api.php?
□ TypeScript types generated (php artisan typescript:transform)?
□ Code formatted with Pint?
□ Implementation verified (code actually exists, not just TODO checked)?
```

### Frontend Issues
```
□ Server Component used by default?
□ 'use client' only where needed?
□ Dark mode classes on ALL elements?
□ No TypeScript errors (strict mode)?
□ TanStack Query for API calls?
□ React Hook Form + Zod for forms?
□ No direct fetch to own API routes?
□ Code formatted with ESLint?
```

---

## 🚀 PRIORITY ORDER

### High Priority (Must Have)
1. Complete core CRUD operations for all main modules
2. Implement missing create forms (Sites, Suppliers, Users)
3. Add edit functionality where missing (DDT, Supplier)
4. Implement Time Tracking module (GPS-based)
5. Implement Invoicing module (Active/Passive, SDI)

### Medium Priority (Should Have)
1. SAL (Stato Avanzamento Lavori) module
2. Consuntivi (Quote vs Actual analysis)
3. Cost Analysis dashboard
4. Advanced reporting and analytics
5. PDF generation for all documents

### Low Priority (Nice to Have)
1. Quote cloning
2. Batch operations
3. Advanced filtering
4. Export to Excel
5. Multi-language support (i18n)

---

## 💡 TIPS FOR AI AGENTS

### General Principles
1. **Be Conservative** - Follow existing patterns, don't innovate architecture
2. **Be Thorough** - Read all relevant documentation before coding
3. **Be Consistent** - Match coding style of existing files
4. **Be Explicit** - Update TODO.md, write clear commit messages
5. **Be Complete** - Don't leave features half-finished

### When Uncertain
1. Check similar existing implementation
2. Read AI_ARCHITECTURE_RULES.md or NEXTJS_GUIDELINES.md
3. Ask for clarification rather than guessing
4. Default to simpler solution

### Performance Tips
- Use parallel tool calls when possible
- Read multiple files in single message
- Launch background agents for analysis tasks
- Batch similar operations together

---

## 📝 COMMIT MESSAGE FORMAT

```
<type>: <description>

[optional body]

[optional footer]
```

**Types:**
- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `style:` - Code formatting (no logic change)
- `refactor:` - Code refactoring
- `test:` - Add or update tests
- `chore:` - Maintenance tasks

**Examples:**
```
feat: add create site form with GPS validation

fix: resolve dark mode contrast issue in customer list

docs: update TODO.md with completed warehouse module

refactor: move complex query to Query Class
```

---

## ✅ SESSION CHECKLIST

### At Session Start
- [ ] Read PROMPT.md (this file)
- [ ] Read TODO.md (current state)
- [ ] Read GUIDELINES_INDEX.md (navigation)
- [ ] Identify task to work on

### Before Backend Coding
- [ ] Read AI_ARCHITECTURE_RULES.md
- [ ] Check similar existing module
- [ ] Verify patterns (Controller, Action, Service)

### Before Frontend Coding
- [ ] Read NEXTJS_GUIDELINES.md
- [ ] Read frontend/CLAUDE.md
- [ ] Check similar existing page
- [ ] Verify Server vs Client Component usage

### After Coding
- [ ] Run formatters (Pint / ESLint)
- [ ] Test dark mode (frontend)
- [ ] Verify no TypeScript/PHP errors
- [ ] Update TODO.md
- [ ] Commit with conventional message

---

**Version**: 1.0.0
**Last Updated**: January 2026
**For**: DGGM ERP Project
**Optimized For**: Claude Code, ralph-loop