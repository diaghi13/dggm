# IMPLEMENTATION STATUS - Modulo Collaboratori

**Data inizio**: 13 Gennaio 2026
**Piano di riferimento**: `/Users/davidedonghi/.claude/plans/optimized-crunching-breeze.md`

## Stato Implementazione

### ✅ COMPLETATO

#### Fase 1a: Enums (7/7) - COMPLETATO
- [x] `app/Enums/WorkerType.php` - Employee, Freelancer, ContractorCompany
- [x] `app/Enums/ContractType.php` - Permanent, FixedTerm, Seasonal, ProjectBased, Internship
- [x] `app/Enums/RateType.php` - Hourly, Daily, Weekly, Monthly, FixedProject
- [x] `app/Enums/RateContext.php` - InternalCost, CustomerBilling, Payroll
- [x] `app/Enums/PayrollFrequency.php` - Monthly, Biweekly, Weekly
- [x] `app/Enums/ContractorType.php` - Cooperative, Subcontractor, TemporaryAgency
- [x] `app/Enums/LaborCostType.php` - InternalLabor, Subcontractor, Contractor

**Pattern**: Tutti seguono standard esistente con metodi `label()`, `icon()`, `color()`, helper methods

#### Fase 1b: Migrations (2/7) - IN CORSO
- [x] `database/migrations/2026_01_13_135302_create_contractors_table.php`
  - Tabella completa con: code, company_name, vat_number, contractor_type
  - Contatti, dati bancari, termini commerciali
  - JSON specializations, soft deletes, 4 indexes

- [x] `database/migrations/2026_01_13_135337_create_workers_table.php`
  - Tabella completa con: code, user_id (nullable), worker_type, contract_type
  - Anagrafica completa, relazione contractor_company_id
  - Dati contrattuali, qualifiche, JSON specializations/certifications
  - Safety training, soft deletes, 8 indexes

### 🚧 IN CORSO

#### Migrations Rimanenti (5/7)
- [ ] `create_worker_rates_table.php` - Tariffe con storico
- [ ] `create_worker_payroll_data_table.php` - Dati buste paga (1:1 worker)
- [ ] `create_contractor_rates_table.php` - Tariffe cooperative
- [ ] `create_site_workers_table.php` - Assegnazione cantieri (many-to-many)
- [ ] `create_site_labor_costs_table.php` - Tracking costi manodopera

### 📋 TODO

#### Fase 2: Models (0/6)
- [ ] `app/Models/Worker.php`
- [ ] `app/Models/Contractor.php`
- [ ] `app/Models/WorkerRate.php`
- [ ] `app/Models/WorkerPayrollData.php`
- [ ] `app/Models/ContractorRate.php`
- [ ] `app/Models/SiteLaborCost.php`

#### Fase 3: Services (0/4)
- [ ] `app/Services/WorkerService.php`
- [ ] `app/Services/RateCalculationService.php`
- [ ] `app/Services/CostAllocationService.php`
- [ ] `app/Services/ContractorService.php`

#### Fase 4: API Layer (0/20+)
- [ ] Controllers (7 files)
- [ ] FormRequests (7 files)
- [ ] Resources (4 files)
- [ ] Policies (3 files)

#### Fase 5: Integration
- [ ] Update `app/Models/Site.php` con relationships
- [ ] Update `database/seeders/RoleAndPermissionSeeder.php`
- [ ] Routes registration in `routes/api.php`

#### Fase 6: Testing & Seeds
- [ ] Seeders (ContractorSeeder, WorkerSeeder)
- [ ] Feature tests (5 files)
- [ ] Run migrations + seeders

## Template Migrations Rimanenti

### worker_rates
```bash
php artisan make:migration create_worker_rates_table
```

```php
// Campi principali:
- worker_id FK → workers (cascadeOnDelete)
- rate_type (enum): hourly, daily, weekly, monthly, fixed_project
- context (enum): internal_cost, customer_billing, payroll
- rate_amount DECIMAL(10,2)
- overtime_multiplier, holiday_multiplier DECIMAL(4,2)
- valid_from DATE, valid_to DATE (nullable)
- UNIQUE (worker_id, context, rate_type, valid_from)
```

### worker_payroll_data
```bash
php artisan make:migration create_worker_payroll_data_table
```

```php
// Relazione 1:1 con workers
- worker_id FK UNIQUE → workers (cascadeOnDelete)
- gross_monthly_salary, net_monthly_salary DECIMAL(10,2)
- contract_level, ccnl_type VARCHAR
- payroll_frequency (enum): monthly, biweekly, weekly
- inps_percentage, inail_percentage, irpef_percentage DECIMAL(5,2)
- meal_voucher_amount, transport_allowance DECIMAL(8,2)
- iban, bank_name VARCHAR
```

### contractor_rates
```bash
php artisan make:migration create_contractor_rates_table
```

```php
// Tariffe a livello cooperativa
- contractor_id FK → contractors (cascadeOnDelete)
- service_type VARCHAR ("operaio generico", "muratore specializzato")
- rate_type (enum), rate_amount DECIMAL(10,2)
- minimum_hours, minimum_amount DECIMAL
- valid_from, valid_to DATE
- UNIQUE (contractor_id, service_type, valid_from)
```

### site_workers
```bash
php artisan make:migration create_site_workers_table
```

```php
// Pivot table assegnazione worker → cantiere
- site_id FK → sites (cascadeOnDelete)
- worker_id FK → workers (cascadeOnDelete)
- site_role VARCHAR (Caposquadra, Operaio)
- assigned_from DATE, assigned_to DATE (nullable)
- hourly_rate_override DECIMAL (tariffa custom cantiere)
- estimated_hours DECIMAL, is_active BOOLEAN
- UNIQUE (site_id, worker_id, assigned_from)
```

### site_labor_costs
```bash
php artisan make:migration create_site_labor_costs_table
```

```php
// Tracking costi manodopera per consuntivi
- site_id FK → sites (cascadeOnDelete)
- cost_type (enum): internal_labor, subcontractor, contractor
- worker_id FK → workers (nullable, nullOnDelete)
- contractor_id FK → contractors (nullable, nullOnDelete)
- time_entry_id FK (futuro, nullable)
- work_date DATE, hours_worked, quantity DECIMAL
- unit_rate, total_cost DECIMAL(10,2)
- is_overtime, is_holiday BOOLEAN
- invoice_number, invoice_date, is_invoiced
- Indexes: (site_id, work_date), (worker_id, work_date), (contractor_id, is_invoiced)
```

## Comandi Rapidi

```bash
# Creare migrations rimanenti
php artisan make:migration create_worker_rates_table
php artisan make:migration create_worker_payroll_data_table
php artisan make:migration create_contractor_rates_table
php artisan make:migration create_site_workers_table
php artisan make:migration create_site_labor_costs_table

# Eseguire migrations
php artisan migrate

# Rollback se necessario
php artisan migrate:rollback --step=7

# Code formatting
./vendor/bin/pint

# Testing
php artisan test --filter=Worker
```

## Note Implementative

### Relazioni Worker ↔ User
- **Design**: Separati ma collegati 1:1 opzionale
- **Rationale**: Non tutti worker hanno accesso sistema (operai semplici)
- **FK**: `user_id` nullable con `nullOnDelete`
- **Futuro**: PM/WarehouseManager potrebbero diventare Worker

### Storicizzazione Tariffe
- **Pattern**: Nuova row per ogni cambio tariffa (no update)
- **Query validità**: `WHERE valid_from <= :date AND (valid_to IS NULL OR valid_to >= :date)`
- **Performance**: Index su `(worker_id, context, rate_type, valid_from)`

### Cooperativa Ibrida
- **Contractor**: Entity company per fatturazione
- **Worker**: FK `contractor_company_id` per tracciamento ore
- **SiteLaborCost**: Supporta entrambi (worker_id + contractor_id)

### JSON Fields
- **specializations**: `["carpentry", "electrical", "plumbing"]`
- **certifications**: `[{"name": "Ponteggi", "expires": "2026-12-31"}]`
- **Indexes**: MySQL/PostgreSQL supportano JSON path indexes se necessario

## Prossimi Passi Immediati

1. **Completare migrations rimanenti** (5 files)
2. **Eseguire**: `php artisan migrate`
3. **Creare Models** (6 files) con relationships complete
4. **Update RoleAndPermissionSeeder** con 12 nuovi permissions:
   - workers.view/create/edit/delete/view-rates/manage-rates/view-payroll/manage-payroll
   - contractors.view/create/edit/delete
   - labor-costs.view/create/edit/delete/approve

## Riferimenti

- **Piano completo**: `/Users/davidedonghi/.claude/plans/optimized-crunching-breeze.md`
- **Enums esistenti** (per pattern): `app/Enums/DdtType.php`, `app/Enums/MaterialType.php`
- **Models esistenti** (per pattern): `app/Models/Site.php`, `app/Models/Customer.php`
- **Services esistenti** (per pattern): `app/Services/DdtService.php`, `app/Services/SiteService.php`
- **CLAUDE.md progetto**: `/Users/davidedonghi/Apps/dggm/CLAUDE.md`

## Checklist Rapida

Prima di considerare il modulo completo:

- [ ] 7 Enums creati e seguono pattern esistente ✅
- [ ] 7 Migrations eseguite senza errori
- [ ] 6 Models con relationships corrette
- [ ] 4 Services con business logic
- [ ] 7 Controllers thin
- [ ] 7 FormRequests con validazioni type-specific
- [ ] 4 Resources con permission filtering
- [ ] 3 Policies
- [ ] 20+ Routes registrate
- [ ] Site model esteso con workers/laborCosts
- [ ] Permissions seedati e assegnati a ruoli
- [ ] Seeders funzionanti (2-3 contractors, 5-7 workers)
- [ ] Pint eseguito (`./vendor/bin/pint`)
- [ ] Test coverage base (5 feature tests)
- [ ] API testata manualmente (Postman/Insomnia)

---

**Ultimo aggiornamento**: 13 Gennaio 2026 13:54
**Implementato da**: Claude Sonnet 4.5
**Sessione**: optimized-crunching-breeze
