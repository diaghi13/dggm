# DGGM ERP - AI System Prompt

**Purpose**: Core operational rules for AI agents
**Priority**: 🔴 CRITICAL - Read at session start
**Last Updated**: February 2026

---

## 🎯 PROJECT MISSION

Build **production-ready ERP** for service companies managing complete lifecycle: quotes → projects → invoicing → cost analysis.

**Target**: Construction, electrical, plumbing, automation, events, rental, cooperatives
**Tech**: Laravel 12 + Next.js 16 + API-first
**Deploy**: Single-tenant (one installation per company)

---

## 🚨 CRITICAL OPERATIONAL RULES

### 1. Read Documentation FIRST

```
BEFORE ANY code:
├─→ Backend: Read ARCHITECTURE.md (MANDATORY)
├─→ Frontend: Read frontend/NEXTJS_GUIDELINES.md + frontend/CLAUDE.md (MANDATORY)
├─→ Check: TODO.md for current state
└─→ Verify: Code actually exists (don't trust TODO blindly)
```

### 2. Follow Established Patterns

- **Do NOT** invent new patterns
- **Do NOT** refactor architecture without approval
- **Look** at existing implementations (Warehouse, Product modules)
- **Reuse** existing components/services

### 3. Code Quality (ALWAYS)

```bash
# Backend
./vendor/bin/pint                  # Format code
php artisan typescript:transform   # Generate TS types from Spatie Data

# Frontend
npm run lint:fix                   # Format + fix
```

### 4. Dark Mode (Frontend Non-Negotiable)

```tsx
// ❌ WRONG
<div className="bg-white text-black">

// ✅ CORRECT
<div className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">
```

Every UI element must support dark mode. Zero exceptions.

---

## 📖 DECISION TREES

### Backend: Should I create X?

```
CALCULATION or FORMATTING (NO database)?
├─→ YES → Service (app/Services/)
└─→ NO → WRITE operation (create/update/delete)?
         ├─→ YES → Action (app/Actions/{Domain}/)
         └─→ NO → COMPLEX read (JOINs, subqueries)?
                  ├─→ YES → Query Class (app/Queries/{Domain}/)
                  └─→ NO → Eloquent in Controller
```

### Frontend: Should I use 'use client'?

```
Need state or event handlers?
├─→ NO → Server Component (default)
└─→ YES → Is this layout/page.tsx?
           ├─→ YES → Keep Server Component, isolate client logic
           └─→ NO → 'use client' in this component only
```

---

## ✅ COMPLETION CRITERIA

### Task is "Done" when:

**Backend:**
1. ✅ Controller thin (no business logic)
2. ✅ Action with `DB::transaction()` + Events
3. ✅ Spatie Data for validation + output
4. ✅ Policy authorizes
5. ✅ Code formatted (`pint`)
6. ✅ TS types generated (`typescript:transform`)

**Frontend:**
1. ✅ Server Components by default
2. ✅ 'use client' only where needed
3. ✅ Dark mode on ALL elements
4. ✅ TypeScript strict (no `any`)
5. ✅ TanStack Query for API
6. ✅ React Hook Form + Zod
7. ✅ Code formatted (`lint:fix`)

**Both:**
1. ✅ TODO.md updated
2. ✅ No console errors
3. ✅ Feature tested manually

---

## 🔧 COMMON TASKS

### Create Backend Module

```bash
# 1. Migration
php artisan make:migration create_{table}_table

# 2. Model
php artisan make:model {Model}

# 3. Spatie Data (app/Data/)
# Validation + Output (replaces FormRequest + Resource)

# 4. Action (app/Actions/{Domain}/)
# CreateAction, UpdateAction, DeleteAction
# Pattern: DB::transaction() + Event dispatch

# 5. Query Class (if complex reads)
# app/Queries/{Domain}/Get{X}Query.php

# 6. Service (ONLY if calculations needed, NO database)
# app/Services/

# 7. Controller (thin)
php artisan make:controller Api/V1/{Model}Controller --api
# Inject Actions, authorize(), delegate

# 8. Policy
php artisan make:policy {Model}Policy

# 9. Events (if needed for logs/notifications)
php artisan make:event {Model}Created
php artisan make:listener Log{Model}Activity

# 10. Format + Generate TS
./vendor/bin/pint
php artisan typescript:transform

# 11. Update TODO.md
```

### Create Frontend Page

```tsx
// 1. Create page (Server Component by default)
// app/(dashboard)/{module}/page.tsx

export default async function Page() {
  // Fetch on server if needed
  return <div>...</div>
}

// 2. API client (lib/api/{module}.ts)
export const {module}Api = {
  getAll: async () => apiClient.get('/api/v1/{module}'),
}

// 3. Types (lib/types/index.ts)
export interface {Module} {
  id: number
  // ...
}

// 4. Form component (Client Component)
// components/{module}-form.tsx
'use client'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

// 5. Dark mode everywhere
className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"

// 6. Format
npm run lint:fix

// 7. Update TODO.md
```

---

## 🚫 ANTI-PATTERNS (Absolutely Forbidden)

### Backend

```php
// ❌ Business logic in Controller
public function store(Request $request) {
    $data = $request->all();
    if ($data['type'] === 'special') {
        // NO! Move to Action
    }
}

// ❌ Database in Service
class ProductService {
    public function create(array $data) {
        return Product::create($data);  // NO! Use Action
    }
}

// ❌ Separate FormRequest + Resource (when Spatie Data sufficient)
public function store(StoreProductRequest $request) {
    $product = $this->action->execute($request->validated());
    return new ProductResource($product);  // Duplicate!
}

// ✅ CORRECT: Spatie Data for BOTH
public function store(Request $request) {
    $product = app(CreateProductAction::class)->execute(
        ProductData::from($request)  // Input validation
    );
    return ProductData::from($product);  // Output (same DTO!)
}
```

### Frontend

```tsx
// ❌ 'use client' too high
'use client'
export default function Layout({ children }) {
  return <div>{children}</div>  // Everything client-side!
}

// ✅ Push to leaf
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

// ❌ No dark mode
<div className="bg-white text-black">

// ✅ Full dark mode
<div className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">
```

---

## 🎓 LEARNING FROM CODE

**Reference Implementations:**

| Module | Status | Learn From |
|--------|--------|------------|
| **Warehouse** | Complete | DDD, Actions, Events, Queries |
| **Product** | Complete | Components, relations, semantic search |
| **Worker** | Complete | Rates, invitations, complex forms |
| **Customers** | Complete | Full CRUD, search, filter |
| **Materials** | Complete | Tabs, inventory, movements |

**Pattern**: Find similar → Copy structure → Adapt → Follow same patterns

---

## 🔍 DEBUGGING CHECKLIST

### Backend Issues

```
□ Controller thin (only HTTP)?
□ Action in app/Actions/{Domain}/?
□ Action uses DB::transaction()?
□ Action dispatches Events?
□ Spatie Data for input + output?
□ NO separate FormRequest/Resource?
□ Policy authorizes?
□ Service ONLY calculations (NO database)?
□ Query Class for complex reads?
□ Routes registered?
□ TS types generated?
□ Code formatted (pint)?
□ Code actually exists (not just TODO)?
```

### Frontend Issues

```
□ Server Component by default?
□ 'use client' only where needed?
□ Dark mode on ALL elements?
□ No TypeScript errors (strict)?
□ TanStack Query for API?
□ React Hook Form + Zod?
□ Code formatted (lint:fix)?
```

---

## 📊 PROJECT STATE AWARENESS

### Before Starting Work

```
1. Read TODO.md (current state)
2. Identify ✅ Done, 🚧 In Progress, ❌ Missing
3. Choose task
4. Read relevant guidelines (ARCHITECTURE.md or frontend guidelines)
5. Start coding following patterns
```

### After Completing Work

```
1. Run formatters
2. Verify dark mode (frontend)
3. Test manually
4. Update TODO.md
5. Commit (conventional message)
```

---

## 💡 TIPS FOR AI AGENTS

### General

1. **Be Conservative** - Follow existing patterns
2. **Be Thorough** - Read docs before coding
3. **Be Consistent** - Match existing style
4. **Be Explicit** - Update TODO.md
5. **Be Complete** - Don't leave half-finished features

### When Uncertain

1. Check similar existing implementation
2. Read ARCHITECTURE.md or NEXTJS_GUIDELINES.md
3. Ask for clarification
4. Default to simpler solution

### Performance

- Parallel tool calls when possible
- Read multiple files in single message
- Background agents for analysis
- Batch similar operations

---

## 📝 COMMIT FORMAT

```
<type>: <description>

[optional body]
```

**Types**: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

**Examples**:
- `feat: add create site form with GPS validation`
- `fix: resolve dark mode contrast in customer list`
- `docs: update TODO.md with completed warehouse`

---

## ✅ SESSION CHECKLIST

### Start
- [ ] Read PROMPT.md (this file)
- [ ] Read TODO.md
- [ ] Identify task

### Before Backend
- [ ] Read ARCHITECTURE.md
- [ ] Check similar module
- [ ] Verify patterns

### Before Frontend
- [ ] Read NEXTJS_GUIDELINES.md
- [ ] Read frontend/CLAUDE.md
- [ ] Check similar page

### After Coding
- [ ] Run formatters
- [ ] Test dark mode (frontend)
- [ ] No errors
- [ ] Update TODO.md
- [ ] Commit

---

**Version**: 2.0 (Compressed)
**Last Updated**: February 2026
**For**: Claude Code, ralph-loop