# DGGM ERP - Guidelines Index

**Purpose**: Official map of all project guidelines and documentation
**For**: AI agents (Claude Code, ralph-loop) and human developers
**Last Updated**: January 2026
**Project Scope**: ERP for service companies (construction, electrical, plumbing, automation, events, rental, cooperatives)

---

## 📋 Quick Reference

| File | Priority | Scope | Purpose |
|------|----------|-------|---------|
| **PROMPT.md** | 🔴 CRITICAL | Project | System prompt, objectives, completion criteria |
| **TODO.md** | 🔴 CRITICAL | Project | Persistent task state and implementation tracking |
| **AI_ARCHITECTURE_RULES.md** | 🔴 CRITICAL | Backend | Architectural rules (MUST READ before coding) |
| **FINAL_ARCHITECTURE.md** | 🟠 HIGH | Backend | Final architectural decisions |
| **CLAUDE.md** (root) | 🟠 HIGH | Project | Project overview and conventions |

---

## 🗂️ Complete Guidelines Inventory

### 1. PROJECT LEVEL (Root `/`)

#### Primary Documents
- **`CLAUDE.md`** 🟠 HIGH
  - Project overview and tech stack
  - Module descriptions
  - User roles
  - Development workflow
  - Key design decisions
  - **Read**: When starting work on the project

- **`PROMPT.md`** 🔴 CRITICAL
  - AI system prompt
  - Project objectives
  - Operational rules
  - Completion criteria
  - **Read**: At the start of every AI session

- **`TODO.md`** 🔴 CRITICAL
  - Implementation status
  - Task tracking
  - What's done vs what's missing
  - **Update**: Continuously during development

- **`GUIDELINES_INDEX.md`** 🟡 MEDIUM (this file)
  - Map of all guidelines
  - Quick navigation
  - **Read**: When navigating documentation

---

### 2. BACKEND LEVEL (`/backend/`)

#### Architecture & Rules
- **`AI_ARCHITECTURE_RULES.md`** 🔴 CRITICAL
  - **MUST READ** before writing any backend code
  - Controller patterns (thin HTTP layer)
  - Actions patterns (write operations in app/Actions/{Module}/)
  - Query Classes patterns (complex reads in app/Queries/{Module}/)
  - Services patterns (calculations/utilities ONLY - NO database)
  - Value Objects + Services pattern
  - Spatie Data (input validation + output Resource - NO separate FormRequest/Resource)
  - TypeScript generation from Spatie Data
  - Events & Listeners (dispatched from Actions when needed)
  - Decision trees for AI
  - **Read**: Before EVERY backend coding task

- **`FINAL_ARCHITECTURE.md`** 🟠 HIGH
  - Final architectural pattern (overview)
  - Pattern evolution history
  - Benefits and rationale
  - **Read**: To understand "why" behind architecture

- **`VALUE_OBJECTS_AND_SERVICES.md`** 🟠 HIGH
  - Value Objects (lightweight)
  - Services (business logic)
  - Pattern split rationale
  - Examples: Coordinates, Money, GeolocationService, PriceCalculatorService
  - **Read**: When creating Value Objects or Services

- **`WAREHOUSE_REFACTORING.md`** 🟡 MEDIUM
  - Warehouse module refactoring details
  - Pattern application example
  - **Read**: As reference for other modules

- **`WAREHOUSE_QUICK_START.md`** 🔴 CRITICAL - **READ FIRST** ⭐
  - **QUICK START GUIDE** (2 pages)
  - What to do NOW (30 min reading + 30 min first task)
  - 10-phase ultra-fast summary
  - 3 critical listeners explained
  - 5-day schedule at a glance
  - Progress tracker
  - **Read FIRST**: Before everything else, 5 min reading

- **`WAREHOUSE_ANALISI_FINALE.md`** 🔴 CRITICAL - **READ SECOND**
  - **ANALISI COMPLETA IN ITALIANO** (540 lines)
  - Detailed event-driven architecture explanation
  - 3 critical listeners with complete code
  - Day-by-day 5-day schedule
  - Guided first task (30 min)
  - Pre-start checklist
  - **Read SECOND**: Full understanding before starting

- **`WAREHOUSE_IMPLEMENTATION_ROADMAP.md`** 🔴 CRITICAL
  - **EXECUTIVE ROADMAP** for Warehouse implementation
  - Confirmed decisions (Strategy B, DDT rules, Event-driven, Query Classes)
  - 10-phase plan with time estimates
  - 5-day implementation schedule
  - Critical paths and success metrics
  - DO/DON'T lists
  - **Read**: For high-level plan and daily schedule

- **`WAREHOUSE_MODULE_REFACTOR_CHECKLIST.md`** 🔴 CRITICAL
  - **COMPLETE CHECKLIST** for Warehouse/Inventory/DDT module (2713 lines)
  - Material → Product migration status
  - 10 implementation phases with detailed code examples
  - Events + Listeners architecture
  - Query Classes pattern
  - Architecture compliance verification
  - Estimated 32-44 hours to complete
  - **Read**: For detailed implementation guide with code examples

- **`CLAUDE.md`** 🟠 HIGH
  - Laravel-specific guidelines
  - Laravel Boost integration
  - Development commands
  - Testing strategy
  - **Read**: When working on Laravel code

- **`DGGM_GUIDELINES.md`** 🟠 HIGH
  - Project-specific Laravel conventions
  - Service Layer pattern
  - Authorization pattern
  - API response format
  - **Read**: For DGGM-specific patterns

#### Spatie Data DTOs
- **`SPATIE_DATA_BEST_PRACTICES.md`** 🟡 MEDIUM
  - Spatie LaravelData best practices
  - DTO patterns
  - Validation attributes
  - **Read**: When creating DTOs

- **`SPATIE_DATA_VALIDATION_GUIDE.md`** 🟡 MEDIUM
  - Validation rules
  - Custom validation
  - Error handling
  - **Read**: For complex validation scenarios

- **`SPATIE_DATA_REAL_WORLD_LESSONS.md`** 🟡 MEDIUM
  - Real-world examples
  - Common pitfalls
  - Solutions
  - **Read**: When troubleshooting DTO issues

#### Status & Development
- **`IMPLEMENTATION_STATUS.md`** 🟡 MEDIUM
  - Workers/Contractors module status
  - Migration checklist
  - **Read**: For module-specific implementation status

- **`README.md`** 🟢 LOW
  - General Laravel project README
  - Setup instructions
  - **Read**: For initial project setup

- **`README_DEVELOPMENT.md`** 🟢 LOW (if exists)
  - Development workflow
  - **Read**: For development process

---

### 3. BACKEND DOMAIN LEVEL (`/backend/app/Domains/`)

#### Warehouse Domain
- **`app/Domains/Warehouse/README_DDD.md`**
  - DDD pattern explanation
  - Warehouse domain structure
  - **Read**: When implementing DDD in other domains

- **`app/Domains/Warehouse/ARCHITECTURE_FLOW.md`**
  - Detailed architecture diagrams
  - Request/response flow
  - Event system flow
  - **Read**: To understand event-driven architecture

- **`app/Domains/Warehouse/IMPLEMENTATION_SUMMARY.md`**
  - Implementation checklist
  - What was implemented
  - **Read**: As reference for implementation completeness

- **`app/Domains/Warehouse/Events/README.md`** (if exists)
  - Events documentation
  - **Read**: When working with events

#### Value Objects
- **`app/ValueObjects/README.md`** (if exists)
  - Value Objects documentation
  - Usage patterns
  - **Read**: When using or creating Value Objects

---

### 4. FRONTEND LEVEL (`/frontend/`)

#### Primary Guidelines
- **`CLAUDE.md`** 🔴 CRITICAL
  - Next.js-specific conventions
  - Component structure
  - State management (Zustand + TanStack Query)
  - Forms (React Hook Form + Zod)
  - API patterns
  - Dark mode requirements
  - **Read**: Before ANY frontend coding task

- **`docs/NEXTJS_GUIDELINES.md`** 🔴 CRITICAL
  - **MUST READ** for Next.js 16 best practices
  - Breaking changes in Next.js 16
  - Async Request APIs (`params`, `searchParams`, `cookies`, `headers`)
  - `'use cache'` directive
  - Server vs Client Components
  - Data fetching patterns
  - Performance optimization
  - TypeScript patterns
  - Metadata & SEO
  - Common pitfalls
  - **Read**: Before EVERY Next.js coding task

#### Migration & Status
- **`MIGRATION_MATERIALS_TO_PRODUCTS.md`** (if exists) 🟡 MEDIUM
  - Renaming migration from Materials to Products
  - **Read**: For context on Product/Material terminology

---

### 5. POSTMAN & API TESTING (`/`)

- **`POSTMAN_QUICK_START.md`** 🟡 MEDIUM
  - Postman setup
  - Quick testing guide
  - **Read**: For API testing

- **`POSTMAN_TUTORIAL.md`** 🟡 MEDIUM
  - Detailed Postman usage
  - **Read**: For comprehensive API testing

- **`POSTMAN_TESTING.md`** 🟡 MEDIUM
  - Test scenarios
  - **Read**: For testing strategies

- **`POSTMAN_AUTH_GUIDE.md`** 🟡 MEDIUM
  - Authentication in Postman
  - **Read**: For auth testing

- **`POSTMAN_QUICK_FIX.md`** 🟢 LOW
  - Common issues and fixes
  - **Read**: When troubleshooting

- **`SOLUZIONE_401_POSTMAN.md`** 🟢 LOW
  - 401 error solutions
  - **Read**: When encountering auth errors

- **`FIX_POSTMAN_401.md`** 🟢 LOW
  - Alternative 401 fixes
  - **Read**: For auth troubleshooting

---

### 6. ANALYSIS & PLANNING (`/`)

- **`ANALISI_PRODUCT_POLICY.md`** 🟢 LOW
  - ProductPolicy analysis
  - **Read**: For policy implementation reference

- **`ANALISI_SCRIPT_POSTMAN.md`** 🟢 LOW
  - Postman script analysis
  - **Read**: For scripting reference

- **`VERIFICA_SCRIPT_POSTMAN.md`** 🟢 LOW
  - Script verification
  - **Read**: For quality assurance

---

## 🎯 Priority System

### 🔴 CRITICAL - Must Read Before Coding
Files that contain architectural rules, patterns, and system prompts that MUST be followed:
- `PROMPT.md` (root)
- `TODO.md` (root)
- `AI_ARCHITECTURE_RULES.md` (backend)
- `NEXTJS_GUIDELINES.md` (frontend)
- `CLAUDE.md` (frontend)

### 🟠 HIGH - Read Before Module Work
Files with project conventions and important context:
- `CLAUDE.md` (root & backend)
- `FINAL_ARCHITECTURE.md` (backend)
- `DGGM_GUIDELINES.md` (backend)
- `VALUE_OBJECTS_AND_SERVICES.md` (backend)

### 🟡 MEDIUM - Reference When Needed
Specialized guides and module-specific documentation:
- `SPATIE_DATA_*.md` (backend)
- `WAREHOUSE_REFACTORING.md` (backend)
- `IMPLEMENTATION_STATUS.md` (backend)
- `POSTMAN_*.md` (root)

### 🟢 LOW - Optional/Troubleshooting
Setup guides and troubleshooting references:
- `README.md` files
- Fix and solution documents
- Analysis documents

---

## 🤖 AI Agent Usage Instructions

### For Claude Code / ralph-loop

**On Every Session Start:**
```
1. Read PROMPT.md (system prompt)
2. Read TODO.md (current state)
3. Read GUIDELINES_INDEX.md (this file for navigation)
```

**Before Backend Coding:**
```
1. Read AI_ARCHITECTURE_RULES.md (MANDATORY)
2. Identify module (e.g., Product, Site, Quote)
3. Check TODO.md for module status
4. VERIFY code actually exists (don't trust TODO blindly)
5. Follow patterns:
   - Actions in app/Actions/{Module}/ (CreateAction, UpdateAction, DeleteAction)
   - Query Classes in app/Queries/{Module}/ for complex reads
   - Services in app/Services/ ONLY for calculations/utilities (NO database)
   - Spatie Data for input validation AND output (no separate FormRequest/Resource)
   - Events dispatched from Actions (when needed for logs/notifications)
```

**Before Frontend Coding:**
```
1. Read NEXTJS_GUIDELINES.md (MANDATORY - Next.js 16 changes)
2. Read frontend/CLAUDE.md (MANDATORY - project conventions)
3. Check TODO.md for module status
4. Follow Server vs Client Component rules
5. Ensure dark mode support (dark: classes)
```

**After Completing Tasks:**
```
1. Verify implementation (code actually exists, not just marked in TODO)
2. Update TODO.md with ✅ completion status
3. Run code formatting:
   - Backend: ./vendor/bin/pint
   - Backend: php artisan typescript:transform (generate TS types from Spatie Data)
   - Frontend: npm run lint:fix
4. Verify dark mode support (frontend)
5. Do NOT create documentation unless explicitly requested
   - Update TODO.md only
   - Do NOT create README files
   - Do NOT create CHANGELOG files
```

---

## 📚 Documentation Hierarchy

```
PROMPT.md (System Prompt - Start Here)
    ↓
TODO.md (Current State - What to Do)
    ↓
GUIDELINES_INDEX.md (Navigation - This File)
    ↓
    ├─→ Backend Work
    │     ↓
    │   AI_ARCHITECTURE_RULES.md (Mandatory Read)
    │     ↓
    │   FINAL_ARCHITECTURE.md (Context)
    │     ↓
    │   VALUE_OBJECTS_AND_SERVICES.md (Patterns)
    │     ↓
    │   SPATIE_DATA_*.md (DTOs Reference)
    │
    └─→ Frontend Work
          ↓
        NEXTJS_GUIDELINES.md (Mandatory Read - Next.js 16)
          ↓
        frontend/CLAUDE.md (Mandatory Read - Project)
          ↓
        Start Coding
```

---

## 🔄 Workflow for New Modules

### Backend Module Creation
```
1. Read AI_ARCHITECTURE_RULES.md
2. Create migration (php artisan make:migration)
3. Create Model with relationships
4. Create Spatie Data DTO in app/Data/ (for BOTH input validation AND output)
5. Create Actions in app/Actions/{Module}/ (Create, Update, Delete)
   - Use DB::transaction()
   - Dispatch Events after persist (when needed)
6. Create Query Classes in app/Queries/{Module}/ (for complex reads only)
7. Create Service in app/Services/ (ONLY for calculations/utilities - NO database)
8. Create Controller (thin HTTP layer)
   - Inject Actions in constructor
   - Use DTO::from($request) for validation
   - Return DTO::from($result) for output
9. Create Policy (authorization)
10. Create Events & Listeners (when needed for logs/notifications/side effects)
11. Register routes in routes/api.php
12. Run ./vendor/bin/pint
13. Run php artisan typescript:transform
14. Verify implementation (check files exist)
15. Update TODO.md with ✅ status
16. Do NOT create documentation files
```

### Frontend Module Creation
```
1. Read NEXTJS_GUIDELINES.md (Next.js 16 rules)
2. Read frontend/CLAUDE.md (project conventions)
3. Create types in lib/types/index.ts
4. Create API client in lib/api/{module}.ts
5. Create pages:
   - app/(dashboard)/{module}/page.tsx (list view)
   - app/(dashboard)/{module}/[id]/page.tsx (detail)
   - app/(dashboard)/{module}/new/page.tsx (create)
6. Create components:
   - components/{module}-form.tsx
   - components/{module}-columns.tsx
7. Add dark mode classes (dark:bg-*, dark:text-*)
8. Use Server Components by default
9. Use 'use client' only when needed
10. Ensure TypeScript strict (no any)
11. Run npm run lint:fix
12. Update TODO.md
```

---

## 🆘 Quick Help

### "Where do I find...?"
- **Architecture rules**: `backend/AI_ARCHITECTURE_RULES.md`
- **Next.js 16 breaking changes**: `frontend/docs/NEXTJS_GUIDELINES.md`
- **Project conventions**: `CLAUDE.md` (root, backend, frontend)
- **Current tasks**: `TODO.md`
- **Implementation status**: `TODO.md`, `backend/IMPLEMENTATION_STATUS.md`
- **Value Objects pattern**: `backend/VALUE_OBJECTS_AND_SERVICES.md`
- **DTO validation**: `backend/SPATIE_DATA_*.md`

### "Which file should I read for...?"
- **Backend coding**: `AI_ARCHITECTURE_RULES.md` → `FINAL_ARCHITECTURE.md`
- **Frontend coding**: `NEXTJS_GUIDELINES.md` → `frontend/CLAUDE.md`
- **DTOs**: `SPATIE_DATA_BEST_PRACTICES.md`
- **Testing API**: `POSTMAN_QUICK_START.md`
- **Architectural decisions**: `FINAL_ARCHITECTURE.md`

### "I don't know what to work on"
1. Read `TODO.md`
2. Find tasks with status `🚧 In Progress` or `❌ Missing`
3. Read relevant guidelines from this index
4. Start coding following patterns

---

## 📝 Maintenance

### When to Update This File
- New guideline document added
- Document priority changes
- New workflow patterns established
- Document location changes

### Document Owners
- **Technical Guidelines**: Development Team
- **AI Instructions**: AI Integration Lead
- **Project Conventions**: Project Architect

---

**Version**: 1.0.0
**Created**: January 2026
**For**: DGGM ERP Project
**Optimized For**: Claude Code, ralph-loop, Human Developers