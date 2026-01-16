# CLAUDE.md - DGGM ERP Project

This file provides guidance to Claude when working with this monorepo project.

## Project Overview

**DGGM ERP** - Complete management system for construction companies and site management.

Enterprise ERP system for complete construction company management: from quote requests, to site management, GPS time tracking, warehouse, to invoicing.

### Architecture

Monorepo with API-first backend and separate SPA frontend:

```
/Apps/dggm/
├── backend/
│   ├── CLAUDE.md              → Auto-generato Laravel Boost (sovrascritto)
│   └── DGGM_GUIDELINES.md     → Custom DGGM (PERSISTENTE)
├── frontend/
│   ├── NEXTJS_GUIDELINES.md   → Best practices Next.js 16 (PRIORITÀ)
│   └── CLAUDE.md              → Convenzioni progetto DGGM
└── CLAUDE.md                  → This file (general overview)
```

**IMPORTANTE**: Leggi SEMPRE i file guidelines appropriati prima di modificare codice.

### Tech Stack Summary

**Backend:**
- Laravel 11+ (PHP 8.2+)
- MySQL 8.0+ / PostgreSQL 14+
- Laravel Sanctum (API authentication)
- Spatie Laravel Permission (roles & permissions)
- Redis (cache & queues)

**Frontend:**
- Next.js 16 (App Router, TypeScript)
- Tailwind CSS 4 + shadcn/ui
- Zustand + TanStack Query
- React Hook Form + Zod
- Dark mode (next-themes)

### Deployment

**Single-tenant**: One installation per client company (no multi-tenant SaaS).

## Key Modules

1. **Foundation**: Auth, users, roles, permissions
2. **Registry**: Customers, suppliers, employees
3. **Warehouse**: Materials, inventory, DDT, movements
4. **Construction Sites**: Complete site lifecycle management
5. **Quotes**: Hierarchical quote system
6. **Time Tracking**: GPS-based time tracking
7. **Logistics**: Company vehicles, material tracking
8. **SAL**: Work progress status
9. **Consuntivi**: Quote vs actual analysis
10. **Invoicing**: Active/passive invoices, SDI

## User Roles (Predefined)

- **SuperAdmin**: Full system access
- **Admin**: Complete company management
- **ProjectManager**: Sites, quotes, SAL management
- **Foreman**: Assigned sites, team management
- **Worker**: Time tracking, view assigned sites (read-only)
- **Accountant**: Invoicing, accounting, reporting
- **Warehouse Manager**: Warehouse, DDT, supplier orders
- **Customer**: View quotes and SAL (customer portal - future)

## Development Workflow

### Backend Development
```bash
cd backend
composer setup          # Initial setup
composer dev           # Start all dev services
composer test          # Run tests
./vendor/bin/pint      # Fix code style
```

See `backend/CLAUDE.md` for detailed Laravel guidelines.

### Frontend Development
```bash
cd frontend
npm install            # Install dependencies
npm run dev           # Start dev server (port 3000)
npm run build         # Production build
npm run lint          # Lint check
```

See `frontend/CLAUDE.md` for detailed Next.js guidelines.

## API Communication

**Base URL**: `http://localhost:8000/api/v1`

**Authentication**: Bearer token (Sanctum)
```typescript
headers: {
  'Authorization': `Bearer ${token}`,
  'Content-Type': 'application/json'
}
```

**Response Format** (standardized):
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation completed",
  "meta": {
    "current_page": 1,
    "total": 100
  }
}
```

## Code Conventions

### Naming Conventions

**Database** (snake_case):
- Tables: `customers`, `construction_sites`, `time_entries`
- Columns: `created_at`, `user_id`, `is_active`
- Foreign keys: `{table_singular}_id`

**Backend PHP** (PSR-12):
- Classes: `PascalCase` (SiteService, QuoteController)
- Methods: `camelCase` (createSite, calculateTotal)
- Variables: `camelCase` (totalAmount, userName)

**Frontend TypeScript**:
- Components: `PascalCase` (DashboardLayout, UserForm)
- Files: `kebab-case` (dashboard-layout.tsx, user-form.tsx)
- Functions: `camelCase` (handleSubmit, fetchUsers)
- Types/Interfaces: `PascalCase` (User, QuoteFormData)

### File Organization

**Backend**:
```
app/
├── Models/              # Eloquent models
├── Http/
│   ├── Controllers/Api/V1/  # API controllers (thin)
│   ├── Requests/           # Form validation
│   └── Resources/          # API response transformers
├── Services/           # Business logic
├── Policies/           # Authorization
└── Jobs/              # Background tasks
```

**Frontend**:
```
app/
├── dashboard/         # Dashboard pages (App Router)
├── (auth)/           # Auth pages (Route groups)
└── api/              # API routes (if needed)

components/
├── ui/               # shadcn/ui base components
└── *.tsx             # Feature components

lib/
├── api/              # API client functions
├── hooks/            # Custom React hooks
├── types/            # TypeScript types
└── utils.ts          # Utility functions
```

## Security Best Practices

1. **Authentication**: All API endpoints require authentication (except login/register)
2. **Authorization**: Use Policies for every resource
3. **Validation**: ALWAYS validate input (FormRequest backend, Zod frontend)
4. **Sanitization**: API Resources for output, prevent XSS
5. **Rate Limiting**: 60 req/min per authenticated user
6. **CORS**: Configured for frontend origin
7. **HTTPS**: Required in production
8. **Secrets**: `.env` never committed, use `.env.example`

## Testing Strategy

**Backend** (Pest):
- Feature tests: API endpoints
- Unit tests: Services, business logic
- Minimum coverage: 70% on Services/Controllers critical paths

**Frontend**:
- Component tests (optional with Vitest)
- E2E tests (optional with Playwright)
- Focus: form validation, critical user flows

## Performance Optimization

**Backend**:
- Eager loading relationships (`with()`)
- Query caching (Redis)
- Queue for heavy tasks
- Database indexing

**Frontend**:
- React Query for API caching
- Code splitting (automatic with App Router)
- Image optimization (next/image)
- Lazy loading heavy components

## Common Commands

### Database
```bash
# Backend
php artisan migrate
php artisan db:seed
php artisan migrate:fresh --seed  # Complete reset
```

### Cache
```bash
# Backend
php artisan cache:clear
php artisan config:clear
php artisan route:clear
```

### Frontend Build
```bash
npm run build          # Production build
npm run start         # Start production server
npm run lint          # Lint check
```

## Environment Variables

### Backend (.env)
```
APP_URL=http://localhost:8000
DB_CONNECTION=mysql
DB_DATABASE=dggm_erp
REDIS_HOST=127.0.0.1
SANCTUM_STATEFUL_DOMAINS=localhost:3000
```

### Frontend (.env.local)
```
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
NEXT_PUBLIC_APP_NAME=DGGM ERP
```

## Key Design Decisions

1. **API-First**: Backend is pure API, frontend consumes API
2. **Sanctum over JWT**: Stateless tokens with Laravel Sanctum
3. **App Router**: Next.js App Router (no Pages Router)
4. **TypeScript Strict**: Maximum type safety
5. **Dark Mode**: Native support with localStorage persistence
6. **Component Library**: shadcn/ui for UI consistency
7. **State Management**: Zustand (global) + React Query (server)
8. **Form Handling**: React Hook Form + Zod validation
9. **Tables**: TanStack Table for performance
10. **Single Tenant**: Separate deploy for each client

## Documentation

- **Backend Details**: `backend/CLAUDE.md`
- **Frontend Details**: `frontend/CLAUDE.md`
- **API Documentation**: `backend/docs/api.md` (if exists)

## Git Workflow

```bash
# Feature branch
git checkout -b feature/feature-name

# Commit
git add .
git commit -m "feat: feature description"

# Push
git push origin feature/feature-name
```

**Commit Message Convention** (Conventional Commits):
- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation
- `style:` - Code formatting
- `refactor:` - Refactoring
- `test:` - Add tests
- `chore:` - Maintenance

## Support & Resources

- Laravel Docs: https://laravel.com/docs
- Next.js Docs: https://nextjs.org/docs
- shadcn/ui: https://ui.shadcn.com
- Tailwind CSS: https://tailwindcss.com/docs

## Notes for Claude

- **Read context first**: Read `backend/CLAUDE.md` or `frontend/CLAUDE.md` when working in that folder
- **Follow conventions**: Respect existing naming and structure
- **Test everything**: Every change must be tested
- **Be concise**: Explain what's important, avoid obvious details
- **Ask when unclear**: If approval needed for dependencies/architecture, ask first
- **Use existing tools**: Check existing components/utilities before creating new ones
- **Dark mode always**: Every UI component must support dark mode
- **Type safety**: TypeScript strict, no `any` without reason
- **Accessibility**: Consider a11y (ARIA labels, keyboard navigation)

---

**Last Updated**: January 2025
**Maintainer**: Davide Donghi
**Version**: 1.0.0

