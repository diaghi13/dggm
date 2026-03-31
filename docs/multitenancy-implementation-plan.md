# Multi-Tenancy Implementation Plan — DGGM ERP

**Strategia:** stancl/tenancy v3, multi-DB, header `x-tenant` (UUID)
**Ultimo aggiornamento:** 2026-03-31
**Stato:** ✅ IMPLEMENTAZIONE COMPLETATA — 9/9 fasi, 47 test verdi

---

## Architettura Decisioni Chiave

- **stancl/tenancy v3** in modalità multi-DB
- **`x-tenant: <UUID>`** header per identificare il tenant (UUID autogenerato da stancl)
- **Global Identity** in Landlord DB: `global_users`, `tenant_memberships`
- **Token Sanctum** nel Landlord DB (cross-tenant, unico token per tutti i tenant)
- **Subscription** con bonifico bancario: tenant creato in `pending_payment`, attivazione manuale da admin
- **Branch (divisioni aziendali)** = Fase 2 separata, non implementare ora
- **Tests** su MySQL reale (non SQLite) — stancl richiede DB reale per multi-DB

## Struttura DB

### Landlord DB (centrale)
```
tenants                   ← stancl standard (id = UUID autogenerato)
global_users              ← identità cross-tenant (nome, email, CF, IBAN, ...)
tenant_memberships        ← chi appartiene a quale tenant e con quale ruolo
plans                     ← piani abbonamento (base, +warehouse, +personnel, +rental)
plan_features             ← feature keys per piano (warehouse, workers, rental, ...)
tenant_subscriptions      ← stato abbonamento (pending_payment|active|suspended)
personal_access_tokens    ← Sanctum landlord (token globale valido cross-tenant)
```

### Tenant DB (uno per Organization)
```
Tutte le 118 tabelle esistenti (da database/migrations/tenant/)
users              ← aggiunto: global_user_id (UUID nullable)
workers            ← aggiunto: global_user_id (UUID nullable)
```

## Auth Flow
```
POST /auth/login → valida GlobalUser (landlord) → token + lista tenant
Ogni request: stesso token + x-tenant header
Middleware chain: AddBearerTokenFromCookie → InitializeTenancyByRequestHeader → auth:sanctum → EnsureTenantMembership
```

## Subscription & Pagamento
```
Signup → scelta piano → tenant created (pending_payment) → email a SuperAdmin
SuperAdmin riceve bonifico → pannello centrale → "Attiva" → active → cliente notificato
```

---

## Fasi di Implementazione

### Fase 1 — Foundation: stancl/tenancy + MySQL Tests
**Prerequisiti:** nessuno

**Operazioni:**
1. `composer require stancl/tenancy`
2. `php artisan tenancy:install`
3. Sposta 118 migrations → `database/migrations/tenant/`
4. Configura `config/tenancy.php`: MySQLDatabaseManager, HeaderTenantResolver, migration path tenant
5. Configura `config/database.php`: connessioni `landlord` + `tenant`
6. Crea `app/Tenancy/HeaderTenantResolver.php`
7. Crea `app/Models/Tenant.php` (extends stancl Tenant)
8. Aggiorna `phpunit.xml`: MySQL (dggm_testing, suffix _test)
9. Crea `.env.testing`
10. Aggiorna `bootstrap/app.php`: `InitializeTenancyByRequestHeader` sull'API group
11. Crea `tests/Traits/CreatesTestTenant.php`
12. **Test:** crea tenant → DB creato → switch DB → isolamento verificato

**File principali:**
- `config/tenancy.php`
- `config/database.php`
- `bootstrap/app.php`
- `phpunit.xml` + `.env.testing`
- `app/Tenancy/HeaderTenantResolver.php`
- `app/Models/Tenant.php`
- `database/migrations/tenant/` (118 files spostati)
- `tests/Feature/Tenancy/TenancyBasicTest.php`
- `tests/Traits/CreatesTestTenant.php`

---

### Fase 2 — Landlord Schema: Global Identity + Piani
**Prerequisiti:** Fase 1

**Migrations landlord** (`database/migrations/`):
- `create_global_users_table`: id UUID, name, email, password, phone, tax_code, fiscal_code, address, city, province, postal_code, country, iban, timestamps, softDeletes
- `create_tenant_memberships_table`: id, global_user_id, tenant_id, role, status (active|invited|suspended), timestamps
- `create_plans_table`: id, name, slug, description, price (decimal nullable), is_active, timestamps
- `create_plan_features_table`: id, plan_id, feature_key, limits (JSON nullable), timestamps
- `create_tenant_subscriptions_table`: id, tenant_id, plan_id, status (pending_payment|active|suspended|cancelled), starts_at, ends_at, timestamps

**Migrations tenant** (in `database/migrations/tenant/`):
- `add_global_user_id_to_users_table`: global_user_id UUID nullable
- `add_global_user_id_to_workers_table`: global_user_id UUID nullable

**Models landlord** (tutti con `protected $connection = 'landlord'`):
- `App\Models\Landlord\GlobalUser`
- `App\Models\Landlord\TenantMembership`
- `App\Models\Landlord\Plan`
- `App\Models\Landlord\PlanFeature`
- `App\Models\Landlord\TenantSubscription`

**Seeder landlord** `database/seeders/PlanSeeder.php`:
- Plan `base`: features [customers, suppliers, quotes, projects]
- Plan `warehouse`: features [warehouse, ddt, stock_movements] (add-on)
- Plan `personnel`: features [workers, timesheets, labor_costs] (add-on)
- Plan `rental`: features [rental, price_lists, subrental] (add-on)

---

### Fase 3 — Global Auth: Login, Token, Membership
**Prerequisiti:** Fase 2

**Endpoints:**
- `POST /auth/login` → valida GlobalUser (landlord) → token + tenant list
- `GET /auth/me` → profilo GlobalUser
- `GET /auth/tenants` → lista tenant dell'utente
- `POST /auth/logout` → revoca token

**Middleware:**
- `App\Http\Middleware\EnsureTenantMembership`: verifica membership + subscription active (altrimenti 402)

**Configurazione Sanctum:** `personal_access_tokens` esclusa dai tenant DB (solo landlord)

**Ordine middleware in `bootstrap/app.php`:**
```
1. AddBearerTokenFromCookie
2. InitializeTenancyByRequestHeader
3. auth:sanctum
4. EnsureTenantMembership
```

**Test Pest:**
- Login valido → token + tenants
- x-tenant non membro → 403
- Subscription pending_payment → 402
- Token invalido → 401

---

### Fase 4 — Tenant Lifecycle: Creazione, Bootstrap, Inviti
**Prerequisiti:** Fase 3

**Endpoints:**
- `POST /auth/register`: crea GlobalUser + Tenant + TenantSubscription (pending_payment) + dispatch job
- `GET /auth/tenant-status/{tenant_id}`: polling stato creazione

**Job:** `App\Jobs\CreateTenantJob` (queued)
1. Crea DB tenant (stancl)
2. Esegui migrations tenant
3. Esegui TenantSeeder nel contesto tenant
4. Crea User nel tenant DB (da GlobalUser)
5. Assegna ruolo 'admin'
6. Notifica email

**TenantSeeder** (eseguito ad ogni nuovo tenant):
- RoleAndPermissionSeeder, SettingSeeder, RentalProfileSeeder, ProjectRoleSeeder
- WarrantyTypeSeeder, PaymentTermSeeder, DiscountFamilySeeder, ProductCategorySeeder

**Landlord Admin API** (prefix `/landlord`, solo SuperAdmin globale):
- `GET /landlord/tenants`
- `GET /landlord/tenants/{id}`
- `PATCH /landlord/tenants/{id}/activate` → status active + notifica cliente
- `PATCH /landlord/tenants/{id}/suspend`
- `DELETE /landlord/tenants/{id}`

**Invito Freelancer:**
- `POST /api/v1/workers/invite` → lookup GlobalUser per email → TenantMembership + workers record con defaults

**Test Pest:** signup flow, attivazione, invito freelancer

---

### Fase 5 — Feature Flags: Piani e Moduli
**Prerequisiti:** Fase 4 (parallelizzabile con Fase 6)

**Service:** `App\Services\FeatureService`
- `enabled(string $featureKey): bool` — cache 5min per tenant
- `check(string $featureKey): void` — throws 403

**Middleware:** `App\Http\Middleware\RequireFeature`
- Uso: `->middleware('feature:warehouse')`

**Route groups in `routes/api.php`:**
```php
Route::middleware('feature:warehouse')->group(...); // warehouses, inventory, ddts
Route::middleware('feature:workers')->group(...);   // workers, timesheets
Route::middleware('feature:rental')->group(...);    // rental-profiles, analytics
```

---

### Fase 6 — Worker Global Profile + Cross-Tenant Overview
**Prerequisiti:** Fase 4 (parallelizzabile con Fase 5)

**Controller landlord:** `App\Http\Controllers\Worker\WorkerOverviewController`
- `GET /my/overview` → aggrega da tutti i tenant DB del worker
- `GET /my/projects` → progetti cross-tenant
- `GET /my/schedule` → calendario aggregato
- `GET /my/profile` → GlobalUser
- `PATCH /my/profile` → aggiorna GlobalUser + sync tenant worker records

**Evento:** `GlobalUserUpdated` → `SyncWorkerProfileListener` (aggiorna workers nei tenant)

**Routes** senza x-tenant (landlord context):
```php
Route::middleware(['auth:sanctum'])->prefix('my')->group(...);
```

---

### Fase 7 — Landlord Admin UI (Frontend)
**Prerequisiti:** Fasi 4+5

**Route Next.js:** `/central/*`

**Pagine:**
- `/central/tenants` — lista con status badge, pulsante "Attiva" su pending_payment
- `/central/tenants/[id]` — dettaglio, azioni attiva/sospendi/elimina
- `/central/users` — global users + memberships

**API client:** `frontend/lib/api/landlord.ts`

---

### Fase 8 — Frontend Integration
**Prerequisiti:** Fasi 3+6+7

**Modifiche auth:**
- Login → tenant selection screen (se multi-tenant)
- Zustand store: globalUser, currentTenant, availableTenants, token
- Axios interceptor: aggiunge `x-tenant` header

**Nuovi componenti:**
- `TenantSelectionScreen`
- `TenantSwitcher` (top bar dropdown)
- `SubscriptionInactiveScreen` (su 402)

**Nuove pagine:**
- `/my/overview`, `/my/projects`, `/my/schedule` (worker global)

**Feature gates:**
- `useFeature(key)` hook → nasconde nav items se feature non attiva

---

### Fase 9 — Migrazione Dati Esistenti
**Prerequisiti:** Fase 4

**Comando:** `php artisan tenant:migrate-existing --tenant-name="..." --email="..."`
1. Crea GlobalUser dal primo User esistente
2. Crea Tenant + TenantSubscription (active)
3. Crea DB tenant + migrations
4. Copia tutti i dati
5. Report integrità

---

## Dipendenze e Parallelismo

```
1 → 2 → 3 → 4
              ├── 5 (parallelo)
              └── 6 (parallelo)
                    ↓
                    7
                    ↓
                    8
              └── 9 (indipendente dopo 4)
```

## Test MySQL Config

```xml
<!-- phpunit.xml -->
<env name="DB_CONNECTION" value="mysql"/>
<env name="DB_DATABASE" value="dggm_testing"/>
<env name="DB_HOST" value="127.0.0.1"/>
<env name="DB_PORT" value="3306"/>
<env name="TENANCY_DB_SUFFIX" value="_test"/>
```

Ogni test con tenant usa `tests/Traits/CreatesTestTenant.php`:
- setUp: `Tenant::create()` → crea DB reale
- tearDown: `$tenant->delete()` → elimina DB
