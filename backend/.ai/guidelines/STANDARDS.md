# DGGM ERP - Standards & Best Practices

**Source**: Extracted from `.clauderc` + Project conventions
**Last Updated**: February 2026

---

## 📐 Naming Conventions

### PHP (PSR-12)

| Element | Convention | Example |
|---------|------------|---------|
| Classes | PascalCase | `CustomerService`, `ProductController` |
| Methods | camelCase | `createCustomer()`, `calculateTotal()` |
| Variables | camelCase | `$totalAmount`, `$userName` |
| Constants | SCREAMING_SNAKE_CASE | `VAT_RATE_STANDARD`, `MAX_UPLOAD_SIZE` |

### Database

| Element | Convention | Example |
|---------|------------|---------|
| Tables | snake_case (plural) | `customers`, `construction_sites`, `time_entries` |
| Columns | snake_case | `created_at`, `user_id`, `is_active` |
| Foreign Keys | `{table_singular}_id` | `customer_id`, `site_id`, `product_id` |
| Pivot Tables | Alphabetical order | `customer_site` (NOT `site_customer`) |

### TypeScript

| Element | Convention | Example |
|---------|------------|---------|
| Interfaces | PascalCase | `User`, `Customer`, `Product` |
| Types | PascalCase | `UserRole`, `ProductType` |
| Components | PascalCase | `CustomerForm`, `DataTable` |
| Hooks | camelCase + `use` prefix | `useAuth`, `useCustomers` |
| Functions | camelCase | `handleSubmit`, `fetchCustomers` |
| Constants | SCREAMING_SNAKE_CASE | `API_BASE_URL`, `MAX_FILE_SIZE` |

---

## 🎨 UI/UX Standards (From .clauderc)

### Design System

**Colors:**
```css
Primary:    #1890ff  /* Blue corporate */
Success:    #52c41a  /* Green */
Warning:    #faad14  /* Orange */
Error:      #f5222d  /* Red */
Dark:       #262626  /* Neutral dark */
Light:      #f0f0f0  /* Neutral light */
```

**Typography:**
```
Font Family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif

Sizes:
  h1: 32px
  h2: 24px
  h3: 20px
  body: 14px
  small: 12px
```

**Spacing:**
```
Unit: 8px
Scale: 4px, 8px, 12px, 16px, 24px, 32px, 48px, 64px
```

### Component Guidelines

**Buttons:**
- **Primary** - Main actions (Save, Confirm)
- **Secondary** - Secondary actions
- **Danger** - Destructive actions (Delete)
- Always show loading state with spinner
- Disabled state visually clear

**Forms:**
- Labels always visible (NO placeholder as label)
- Inline validation after first submit attempt
- Clear, actionable error messages
- Required fields marked with asterisk (*)
- Help text under input when needed

**Tables:**
- Sticky header on scroll
- Pagination with info ("Showing 1-15 of 150")
- Column sorting (click header)
- Filters above table
- Actions column for row operations
- Empty state when no data

**Notifications:**
- Toast for action feedback (success, error, info)
- Position: top-right
- Auto-dismiss after 3-5 seconds
- Manual close option

### Responsive Breakpoints

```
Mobile:  < 768px
Tablet:  768px - 1024px
Desktop: > 1024px
```

**Behavior:**
- Mobile-first approach
- Collapsible sidebar on mobile
- Horizontal scroll tables on mobile
- Single column forms on mobile

---

## 🔒 Security Standards

### Authentication
- Laravel Sanctum for token-based auth
- Token in header: `Authorization: Bearer {token}`
- Token expiration configurable
- Refresh token mechanism

### Authorization
- Spatie Laravel Permission for roles/permissions
- Gates and Policies for granular checks
- Middleware to protect routes

### Best Practices
- ✅ HTTPS mandatory in production
- ✅ Input validation (client AND server)
- ✅ Rate limiting on API (throttle middleware)
- ✅ CORS configured correctly
- ✅ Input sanitization (prevent XSS)
- ✅ Prepared statements (Eloquent does this)
- ✅ Password hashing with bcrypt (Laravel default)
- ✅ Encrypt sensitive data in DB
- ✅ Log access and critical actions
- ✅ Automated database backups

---

## ⚡ Performance Standards

### Backend

**Database:**
- Eager loading for N+1 problem: `->with(['relation'])`
- Query scoping for common filters
- Database indexing on searched columns
- Pagination for long lists
- Chunk for large datasets

**Caching:**
- Redis for config, static lists
- Cache invalidation on updates
- TTL based on data volatility

**Queue:**
- Queue for heavy tasks (email, PDF, import/export)
- Laravel Horizon for monitoring

**Optimization:**
- `composer dump-autoload -o` for production

### Frontend

**React Optimization:**
- Code splitting with `React.lazy()`
- Memoization: `useMemo`, `useCallback`, `React.memo`
- Virtual scrolling for very long lists
- Debounce on search/autocomplete inputs

**Data Fetching:**
- React Query for automatic server state caching
- Stale-while-revalidate strategy

**Assets:**
- Image optimization (format, size)
- Bundle analysis to reduce size
- Lazy load heavy components

---

## 🧪 Testing Standards

### Backend (Pest/PHPUnit)

**Coverage Target**: 70%+

**Test Types:**
- **Unit tests** - Service classes, utilities
- **Feature tests** - API endpoints
- **Database tests** - Use `RefreshDatabase` trait
- **Factories** - Test data (User, Customer, etc.)

**Command**: `php artisan test`

### Frontend (Vitest)

**Test Types:**
- **Component tests** - UI components
- **Integration tests** - Complete features
- **Hook tests** - Custom hooks
- **API mocks** - Mock Service Worker (MSW)

**Command**: `npm run test`

---

## 📦 Git Standards (From .clauderc)

### Branch Strategy (GitFlow)

| Branch | Purpose |
|--------|---------|
| `main` | Production (always deployable) |
| `develop` | Development integration |
| `feature/*` | New features (`feature/sites-module`) |
| `bugfix/*` | Bug fixes (`bugfix/gps-validation`) |
| `hotfix/*` | Urgent production fixes |

### Commit Convention

**Format**: `type(scope): subject`

**Types:**
- `feat` - New feature
- `fix` - Bug fix
- `refactor` - Code refactoring
- `style` - Formatting (no logic change)
- `test` - Add/modify tests
- `docs` - Documentation
- `chore` - Maintenance (build, config)

**Examples:**
```
feat(sites): add cost analysis dashboard
fix(time-tracking): resolve GPS validation issue
refactor(api): improve response format consistency
```

### Pull Requests

- Clear description of problem and solution
- Screenshots for UI changes
- Automated tests must pass
- Code review required before merge
- Merge to `develop`, not directly to `main`

---

## 📚 Documentation Standards

### Code Comments

**Principles:**
- Comment the **WHY**, not the **WHAT**
- DocBlocks for public functions (params, return, throws)
- Avoid obvious comments (`// increment i; i++;`)
- Use `TODO:` for pending tasks with ticket reference

**Example:**
```php
/**
 * Calculate final price with markup, discount, and VAT.
 *
 * @param Money $baseCost Base product cost
 * @param array $options Calculation options (markup, discount, vat)
 * @return Money Final calculated price
 */
public function calculateFinalPrice(Money $baseCost, array $options): Money
{
    // ...
}
```

### API Documentation

**Tool**: OpenAPI/Swagger (L5-Swagger for Laravel)

**Requirements:**
- All endpoints documented
- Request/Response examples
- Authentication requirements
- Possible error responses

---

## 🚀 Deployment Standards

### Environments

| Environment | Purpose |
|-------------|---------|
| `development` | Local machine |
| `staging` | Pre-production testing |
| `production` | Live environment |

### Pre-Deploy Checklist

- [ ] Tests pass
- [ ] Code review completed
- [ ] Database migrations tested
- [ ] Environment variables configured
- [ ] Production database backup

### Post-Deploy Checklist

- [ ] Smoke test critical features
- [ ] Monitor logs for errors
- [ ] Performance monitoring

### Recommended Tools

- Laravel Forge / Envoyer
- GitHub Actions for CI/CD
- Docker for containerization

---

## 🎯 Quality Standards

### Code Review Checklist

- [ ] Clean and readable code?
- [ ] Descriptive variable/function names?
- [ ] Logic easily understandable?
- [ ] Tests present and passing?
- [ ] Performance considered?
- [ ] Security vulnerabilities checked?
- [ ] Documentation adequate?
- [ ] Consistent with codebase?

### Definition of Done

- [ ] Code written and tested
- [ ] Automated tests pass
- [ ] Code review approved
- [ ] Documentation updated
- [ ] Deployed to staging and verified
- [ ] Product owner/client validated (if needed)

---

## 💡 Project Principles

### Always

- ✅ **Security first**
- ✅ **User experience matters**
- ✅ **Readable code > Clever code**
- ✅ **Test critical logic**
- ✅ **Performance matters**

### Avoid

- ❌ **Over-engineering** (KISS principle)
- ❌ **Premature optimization**
- ❌ **Code duplication** (DRY principle)
- ❌ **Too custom solutions** (use reliable packages)
- ❌ **Direct commits to main/develop**

---

**Remember**: Clean code, clear communication, continuous improvement.

**Sources**: `.clauderc` + ARCHITECTURE.md + DGGM_GUIDELINES.md