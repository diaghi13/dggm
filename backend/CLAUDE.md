# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**DGGM ERP** - Sistema gestionale completo per aziende edili e gestione cantieri.

L'applicazione copre l'intero ciclo di vita di un progetto edile: dalla richiesta di preventivo, alla gestione del cantiere, timbrature con geolocalizzazione, consuntivi, fino alla fatturazione finale.

### Architettura
- **Backend**: API-first con Laravel (API REST per frontend separato)
- **Frontend**: Next.js 14+ standalone application (repository separato)
- **Deployment**: Single-tenant (un'installazione per azienda)

### Moduli Principali
1. **Foundation**: Autenticazione, utenti, ruoli e permessi
2. **Anagrafica**: Clienti, fornitori, dipendenti
3. **Magazzino**: Articoli, movimenti, inventario, ordini fornitori
4. **Cantieri** (CORE): Gestione completa cantieri dalla creazione alla chiusura
5. **Preventivi**: Sistema di preventivazione con voci gerarchiche
6. **Timbrature**: Sistema GPS-based per timbrature multi-cantiere giornaliere
7. **Logistica**: Mezzi aziendali, DDT, tracking materiali
8. **SAL**: Stato avanzamento lavori con approvazione cliente
9. **Consuntivi**: Analisi preventivo vs consuntivo con calcolo margini
10. **Fatturazione**: Fatture attive/passive, fattura elettronica (SDI)
11. **Contabilità**: Scadenziario, cash flow, reportistica

## Technology Stack

### Backend (questo repository)
- **Framework**: Laravel 12 (PHP 8.2+)
- **Authentication**: Laravel Sanctum (API tokens)
- **Authorization**: Spatie Laravel Permission (ruoli e permessi)
- **Database**: MySQL 8.0+ / PostgreSQL 14+
- **Cache**: Redis (sessioni, cache applicativa)
- **Queue**: Laravel Horizon (background jobs)
- **Testing**: Pest (PHPUnit wrapper)
- **Code Quality**: Laravel Pint (PHP CS Fixer)
- **Logging**: Laravel Pail

### Frontend (repository separato - da creare)
- **Framework**: Next.js 14+ (App Router, TypeScript)
- **UI**: Tailwind CSS 4 + shadcn/ui
- **State**: Zustand + React Query (TanStack Query)
- **Forms**: React Hook Form + Zod validation
- **Tables**: TanStack Table
- **Charts**: Recharts
- **Maps**: Leaflet con react-leaflet (per GPS tracking)

## Development Commands

### Initial Setup
```bash
composer setup
```
This runs the full setup: installs dependencies, copies `.env`, generates app key, runs migrations, installs npm packages, and builds assets.

### Development Server
```bash
composer dev
```
Starts all development services concurrently:
- PHP development server (port 8000)
- Queue worker (with 1 retry)
- Laravel Pail for real-time logs
- Vite dev server for hot module replacement

Alternatively, start services individually:
```bash
php artisan serve              # Development server only
npm run dev                    # Vite dev server only
php artisan queue:listen       # Queue worker only
php artisan pail               # Real-time logs only
```

### Testing
```bash
composer test                  # Run all tests
php artisan test               # Direct artisan command
php artisan test --filter=TestName  # Run specific test
```

Tests use Pest framework. Test suites are in `tests/Feature` and `tests/Unit`. Testing uses in-memory SQLite database (configured in `phpunit.xml`).

### Code Quality
```bash
./vendor/bin/pint              # Auto-fix code style issues
./vendor/bin/pint --test       # Check style without fixing
```

### Database
```bash
php artisan migrate            # Run migrations
php artisan migrate:fresh      # Drop all tables and re-run migrations
php artisan migrate:rollback   # Rollback last migration batch
php artisan db:seed            # Run database seeders
```

### Asset Building
```bash
npm run build                  # Production build
npm run dev                    # Development with HMR
```

## Architecture Overview

### Best Practices & Design Patterns

**IMPORTANT ARCHITECTURAL DECISIONS:**

1. **Service Layer Pattern** (MANDATORY)
   - Controllers MUST be thin - only handle HTTP concerns
   - ALL business logic goes in Service classes (`app/Services/`)
   - Controllers inject Services via constructor dependency injection
   - Example:
   ```php
   // ✅ CORRECT
   class CustomerController extends Controller
   {
       public function __construct(
           private readonly CustomerService $customerService
       ) {}

       public function index(Request $request) {
           $this->authorize('viewAny', Customer::class);
           $customers = $this->customerService->getAll($filters);
           return CustomerResource::collection($customers);
       }
   }

   // ❌ WRONG - business logic in controller
   public function index() {
       $customers = Customer::where('is_active', true)->get();
       return response()->json($customers);
   }
   ```

2. **Authorization Pattern**
   - Use `$this->authorize()` method in controllers (NOT `authorizeResource()`)
   - Policy classes in `app/Policies/` for all authorization logic
   - FormRequests handle permission checks for create/update operations
   - Example:
   ```php
   // In Controller
   $this->authorize('view', $customer);
   $this->authorize('viewAny', Customer::class);

   // In FormRequest
   public function authorize(): bool {
       return $this->user()->can('customers.create');
   }
   ```

3. **Modular Architecture** (Optional - Future)
   - `nwidart/laravel-modules` package installed for future modularization
   - Current structure: Service layer + standard Laravel folders
   - Future: Modules for each business domain (Customers, Sites, Quotes, etc.)

4. **API Response Format** (Standardized)
   ```json
   {
     "success": true,
     "message": "Operation successful",
     "data": { ... },
     "meta": { "current_page": 1, "total": 100 }
   }
   ```

5. **Frontend Route Structure** (NO /dashboard prefix)
   - Protected routes: `/`, `/customers`, `/sites`, `/quotes`, etc.
   - Public routes: `/login`
   - Use Next.js route groups: `app/(protected)/` for authenticated pages
   - DashboardLayout wraps all protected routes via layout.tsx

6. **UI Components** (Reusable)
   - Create reusable components in `frontend/components/ui/`
   - Use shadcn/ui as base, extend with custom components
   - Avoid duplicating Tailwind classes - extract to components
   - Example: `<DataTable>`, `<PageHeader>`, `<StatusBadge>`, etc.

### Laravel 12 Specifics
This project uses Laravel 12, which includes:
- Modern routing with slim route files in `routes/`
- Service providers in `app/Providers/`
- Eloquent models in `app/Models/`
- HTTP controllers in `app/Http/Controllers/`

### Frontend Integration
- **Vite Configuration**: `vite.config.js` handles asset compilation
- **Entry Points**: `resources/css/app.css` and `resources/js/app.js`
- **Tailwind CSS 4**: Configured via `@tailwindcss/vite` plugin
- **Blade Templates**: Located in `resources/views/`
- **Hot Reload**: Vite ignores `storage/framework/views/**` to prevent unnecessary rebuilds

### Autoloading
PSR-4 autoloading is configured for:
- `App\*` → `app/`
- `Database\Factories\*` → `database/factories/`
- `Database\Seeders\*` → `database/seeders/`
- `Tests\*` → `tests/`

### Composer Scripts
The project includes custom composer scripts:
- `composer setup` - Full project setup
- `composer dev` - Start all development services
- `composer test` - Run test suite

These scripts handle common development workflows and should be used instead of running individual commands.

## Key Files

- `routes/web.php` - Web routes
- `routes/console.php` - Artisan console commands
- `config/` - All configuration files
- `database/migrations/` - Database schema migrations
- `.env` - Environment configuration (not in version control)
- `.env.example` - Environment template

## Development Workflow

1. The concurrent dev script runs 4 processes simultaneously - if one fails, all others are killed (`--kill-others` flag)
2. Queue jobs are configured to retry once (`--tries=1`)
3. Configuration is cleared before running tests to ensure clean state
4. Laravel Boost is used for performance optimization (updates on composer update)

## Backend Architecture Patterns

### API Structure
```
api/v1/
├── auth/              # Authentication (login, logout, refresh)
├── users/             # User management
├── customers/         # Customer registry
├── suppliers/         # Supplier registry
├── sites/             # Construction sites management
├── quotes/            # Quote/estimate system
├── time-trackings/    # Time tracking with GPS
├── warehouse/         # Warehouse management
├── invoices/          # Invoicing
└── ...
```

### Code Organization
- **Models**: `app/Models/` - Eloquent models with relationships
- **Controllers**: `app/Http/Controllers/Api/V1/` - API controllers (thin, delegate to Services)
- **Services**: `app/Services/` - Business logic (e.g., `SiteService`, `QuoteService`)
- **Repositories**: `app/Repositories/` - Data access layer (optional, for complex queries)
- **Requests**: `app/Http/Requests/` - Form validation for API
- **Resources**: `app/Http/Resources/` - API response transformers (standardized JSON)
- **Policies**: `app/Policies/` - Authorization logic (who can do what)
- **Jobs**: `app/Jobs/` - Background tasks (email, PDF generation, export)
- **Events/Listeners**: `app/Events/` - Domain events for async operations

### API Response Format (Standard JSON:API)
```json
{
  "success": true,
  "data": { ... },
  "message": "Operazione completata",
  "meta": {
    "current_page": 1,
    "total": 100
  }
}
```

### Ruoli Predefiniti
- **SuperAdmin**: Accesso completo al sistema
- **Admin**: Gestione completa azienda (no configurazione sistema)
- **ProjectManager**: Gestione cantieri, preventivi, SAL
- **Caposquadra**: Visualizzazione cantieri assegnati, gestione squadra
- **Operaio**: Timbrature, visualizzazione cantieri assegnati (solo lettura)
- **Contabile**: Fatturazione, contabilità, reportistica finanziaria
- **Magazziniere**: Gestione magazzino, DDT, ordini fornitori
- **Cliente**: Visualizzazione preventivi e SAL (portale clienti - futuro)

### Database Conventions
- **Naming**: snake_case for tables and columns (English names: `sites`, `customers`, `created_at`)
- **Primary Key**: `id` (BIGINT UNSIGNED AUTO_INCREMENT)
- **Foreign Keys**: `{table_singular}_id` (e.g., `customer_id`, `site_id`, `user_id`)
- **Timestamps**: `created_at`, `updated_at` (automatic with `$table->timestamps()`)
- **Soft Deletes**: `deleted_at` where needed (customers, sites, quotes)
- **Status/Enum**: use ENUM or VARCHAR columns with validation (e.g., `status: ['draft', 'sent', 'approved']`)

### Security Best Practices
- Tutti gli endpoint API richiedono autenticazione tramite Sanctum (tranne login/register)
- Usare Policy per ogni risorsa (es. `CantierePolicy::view()`, `::create()`, `::update()`)
- Validare SEMPRE input con FormRequest
- Sanitizzare output con API Resources
- Rate limiting su API (60 req/min per utente autenticato)
- Logging di azioni critiche (creazione/modifica/eliminazione dati sensibili)

### Testing Strategy
- **Unit Tests**: Logica business nei Services (calcoli margini, validazioni complesse)
- **Feature Tests**: API endpoints (autenticazione, CRUD operations, permessi)
- **Pest Syntax**: Preferire syntax Pest moderna
- Test coverage minimo: 70% su Services e Controllers critici

### Performance Optimization
- **Eager Loading**: Sempre usare `with()` per evitare N+1 queries
- **Caching**:
  - Liste statiche (ruoli, permessi, categorie) → cache 1h
  - Anagrafica clienti/fornitori → cache 15min
  - Dashboard stats → cache 5min
- **Queue Jobs**: Email, PDF generation, export Excel → sempre in background
- **Database Indexes**: Su colonne usate in WHERE, JOIN, ORDER BY frequenti
- **Pagination**: Default 20 items, max 100 per request

### Key Business Rules

#### Timbrature Multi-Cantiere
- Un operaio può timbrare su più cantieri nella stessa giornata
- Ogni coppia entrata/uscita è associata a un cantiere specifico
- GPS obbligatorio: coordinate devono essere entro 50-100m dal cantiere
- Se fuori range → flag "richiede_verifica" e notifica al manager
- Calcolo ore automatico per cantiere: `ore_lavorate = uscita - entrata`
- Straordinario se totale giornaliero > 8h o settimanale > 40h
- Report presenze aggregabili per: dipendente, cantiere, periodo

#### Site Workflow
1. Customer requests quote → PM creates Quote
2. Quote approved → automatically converts to Site
3. Site inherits: materials, estimated hours, amounts from quote
4. During work: tracking actual hours, materials used, extras
5. At completion: automatic cost analysis (estimated vs actual)
6. Generate progress billing → progressive invoicing
7. Site closure → margin analysis and archiving

#### Quote → Site (Conversion)
- Imports all data: customer, address, amount, materials, hours
- Creates "materials to order" list from quote
- PM can modify/integrate after conversion
- Any "extras" (customer variants) tracked separately
- Final cost analysis compares quote baseline with actual expenses

## Development Roadmap

### Fase 1: Foundation (In corso)
- [x] Setup progetto Laravel
- [ ] Laravel Sanctum (API authentication)
- [ ] Spatie Permission (ruoli e permessi)
- [ ] Seeders ruoli base
- [ ] API base authentication (login, logout, me)
- [ ] Middleware e policy base

### Fase 2: Anagrafica
- [ ] CRUD Clienti
- [ ] CRUD Fornitori
- [ ] CRUD Dipendenti (con ruoli)
- [ ] Categorie (clienti, fornitori, materiali)

### Fase 3: Magazzino
- [ ] Articoli e servizi
- [ ] Movimenti (carico/scarico)
- [ ] Ordini fornitori
- [ ] Inventario

### Fase 4: Cantieri Core
- [ ] Preventivi (con builder voci gerarchiche)
- [ ] Cantieri (anagrafica e gestione)
- [ ] Conversione Preventivo → Cantiere
- [ ] Assegnazione team e mezzi

### Fase 5: Timbrature
- [ ] Sistema timbratura con validazione GPS
- [ ] Report presenze
- [ ] Gestione permessi/ferie

### Fase 6+: Moduli avanzati
- SAL, Consuntivi, Fatturazione, Logistica, Contabilità

## Notes
- Next.js frontend will be a separate repository consuming these APIs
- Focus on well-documented APIs (OpenAPI/Swagger)
- Always think "mobile-first" for time tracking and workers
- **All code in English**: models (Site, Quote, Customer), controllers, services, database tables, columns, API endpoints, everything

===

<laravel-boost-guidelines>
=== foundation rules ===

# Laravel Boost Guidelines

The Laravel Boost guidelines are specifically curated by Laravel maintainers for this application. These guidelines should be followed closely to enhance the user's satisfaction building Laravel applications.

## Foundational Context
This application is a Laravel application and its main Laravel ecosystems package & versions are below. You are an expert with them all. Ensure you abide by these specific packages & versions.

- php - 8.3.27
- laravel/framework (LARAVEL) - v12
- laravel/prompts (PROMPTS) - v0
- laravel/sanctum (SANCTUM) - v4
- laravel/mcp (MCP) - v0
- laravel/pint (PINT) - v1
- laravel/sail (SAIL) - v1
- pestphp/pest (PEST) - v4
- phpunit/phpunit (PHPUNIT) - v12

## Conventions
- You must follow all existing code conventions used in this application. When creating or editing a file, check sibling files for the correct structure, approach, naming.
- Use descriptive names for variables and methods. For example, `isRegisteredForDiscounts`, not `discount()`.
- Check for existing components to reuse before writing a new one.

## Verification Scripts
- Do not create verification scripts or tinker when tests cover that functionality and prove it works. Unit and feature tests are more important.

## Application Structure & Architecture
- Stick to existing directory structure - don't create new base folders without approval.
- Do not change the application's dependencies without approval.

## Frontend Bundling
- If the user doesn't see a frontend change reflected in the UI, it could mean they need to run `npm run build`, `npm run dev`, or `composer run dev`. Ask them.

## Replies
- Be concise in your explanations - focus on what's important rather than explaining obvious details.

## Documentation Files
- You must only create documentation files if explicitly requested by the user.


=== boost rules ===

## Laravel Boost
- Laravel Boost is an MCP server that comes with powerful tools designed specifically for this application. Use them.

## Artisan
- Use the `list-artisan-commands` tool when you need to call an Artisan command to double check the available parameters.

## URLs
- Whenever you share a project URL with the user you should use the `get-absolute-url` tool to ensure you're using the correct scheme, domain / IP, and port.

## Tinker / Debugging
- You should use the `tinker` tool when you need to execute PHP to debug code or query Eloquent models directly.
- Use the `database-query` tool when you only need to read from the database.

## Reading Browser Logs With the `browser-logs` Tool
- You can read browser logs, errors, and exceptions using the `browser-logs` tool from Boost.
- Only recent browser logs will be useful - ignore old logs.

## Searching Documentation (Critically Important)
- Boost comes with a powerful `search-docs` tool you should use before any other approaches. This tool automatically passes a list of installed packages and their versions to the remote Boost API, so it returns only version-specific documentation specific for the user's circumstance. You should pass an array of packages to filter on if you know you need docs for particular packages.
- The 'search-docs' tool is perfect for all Laravel related packages, including Laravel, Inertia, Livewire, Filament, Tailwind, Pest, Nova, Nightwatch, etc.
- You must use this tool to search for Laravel-ecosystem documentation before falling back to other approaches.
- Search the documentation before making code changes to ensure we are taking the correct approach.
- Use multiple, broad, simple, topic based queries to start. For example: `['rate limiting', 'routing rate limiting', 'routing']`.
- Do not add package names to queries - package information is already shared. For example, use `test resource table`, not `filament 4 test resource table`.

### Available Search Syntax
- You can and should pass multiple queries at once. The most relevant results will be returned first.

1. Simple Word Searches with auto-stemming - query=authentication - finds 'authenticate' and 'auth'
2. Multiple Words (AND Logic) - query=rate limit - finds knowledge containing both "rate" AND "limit"
3. Quoted Phrases (Exact Position) - query="infinite scroll" - Words must be adjacent and in that order
4. Mixed Queries - query=middleware "rate limit" - "middleware" AND exact phrase "rate limit"
5. Multiple Queries - queries=["authentication", "middleware"] - ANY of these terms


=== php rules ===

## PHP

- Always use curly braces for control structures, even if it has one line.

### Constructors
- Use PHP 8 constructor property promotion in `__construct()`.
    - <code-snippet>public function __construct(public GitHub $github) { }</code-snippet>
- Do not allow empty `__construct()` methods with zero parameters.

### Type Declarations
- Always use explicit return type declarations for methods and functions.
- Use appropriate PHP type hints for method parameters.

<code-snippet name="Explicit Return Types and Method Params" lang="php">
protected function isAccessible(User $user, ?string $path = null): bool
{
    ...
}
</code-snippet>

## Comments
- Prefer PHPDoc blocks over comments. Never use comments within the code itself unless there is something _very_ complex going on.

## PHPDoc Blocks
- Add useful array shape type definitions for arrays when appropriate.

## Enums
- Typically, keys in an Enum should be TitleCase. For example: `FavoritePerson`, `BestLake`, `Monthly`.


=== tests rules ===

## Test Enforcement

- Every change must be programmatically tested. Write a new test or update an existing test, then run the affected tests to make sure they pass.
- Run the minimum number of tests needed to ensure code quality and speed. Use `php artisan test` with a specific filename or filter.


=== laravel/core rules ===

## Do Things the Laravel Way

- Use `php artisan make:` commands to create new files (i.e. migrations, controllers, models, etc.). You can list available Artisan commands using the `list-artisan-commands` tool.
- If you're creating a generic PHP class, use `php artisan make:class`.
- Pass `--no-interaction` to all Artisan commands to ensure they work without user input. You should also pass the correct `--options` to ensure correct behavior.

### Database
- Always use proper Eloquent relationship methods with return type hints. Prefer relationship methods over raw queries or manual joins.
- Use Eloquent models and relationships before suggesting raw database queries
- Avoid `DB::`; prefer `Model::query()`. Generate code that leverages Laravel's ORM capabilities rather than bypassing them.
- Generate code that prevents N+1 query problems by using eager loading.
- Use Laravel's query builder for very complex database operations.

### Model Creation
- When creating new models, create useful factories and seeders for them too. Ask the user if they need any other things, using `list-artisan-commands` to check the available options to `php artisan make:model`.

### APIs & Eloquent Resources
- For APIs, default to using Eloquent API Resources and API versioning unless existing API routes do not, then you should follow existing application convention.

### Controllers & Validation
- Always create Form Request classes for validation rather than inline validation in controllers. Include both validation rules and custom error messages.
- Check sibling Form Requests to see if the application uses array or string based validation rules.

### Queues
- Use queued jobs for time-consuming operations with the `ShouldQueue` interface.

### Authentication & Authorization
- Use Laravel's built-in authentication and authorization features (gates, policies, Sanctum, etc.).

### URL Generation
- When generating links to other pages, prefer named routes and the `route()` function.

### Configuration
- Use environment variables only in configuration files - never use the `env()` function directly outside of config files. Always use `config('app.name')`, not `env('APP_NAME')`.

### Testing
- When creating models for tests, use the factories for the models. Check if the factory has custom states that can be used before manually setting up the model.
- Faker: Use methods such as `$this->faker->word()` or `fake()->randomDigit()`. Follow existing conventions whether to use `$this->faker` or `fake()`.
- When creating tests, make use of `php artisan make:test [options] {name}` to create a feature test, and pass `--unit` to create a unit test. Most tests should be feature tests.

### Vite Error
- If you receive an "Illuminate\Foundation\ViteException: Unable to locate file in Vite manifest" error, you can run `npm run build` or ask the user to run `npm run dev` or `composer run dev`.


=== laravel/v12 rules ===

## Laravel 12

- Use the `search-docs` tool to get version specific documentation.
- Since Laravel 11, Laravel has a new streamlined file structure which this project uses.

### Laravel 12 Structure
- No middleware files in `app/Http/Middleware/`.
- `bootstrap/app.php` is the file to register middleware, exceptions, and routing files.
- `bootstrap/providers.php` contains application specific service providers.
- **No app\Console\Kernel.php** - use `bootstrap/app.php` or `routes/console.php` for console configuration.
- **Commands auto-register** - files in `app/Console/Commands/` are automatically available and do not require manual registration.

### Database
- When modifying a column, the migration must include all of the attributes that were previously defined on the column. Otherwise, they will be dropped and lost.
- Laravel 11 allows limiting eagerly loaded records natively, without external packages: `$query->latest()->limit(10);`.

### Models
- Casts can and likely should be set in a `casts()` method on a model rather than the `$casts` property. Follow existing conventions from other models.


=== pint/core rules ===

## Laravel Pint Code Formatter

- You must run `vendor/bin/pint --dirty` before finalizing changes to ensure your code matches the project's expected style.
- Do not run `vendor/bin/pint --test`, simply run `vendor/bin/pint` to fix any formatting issues.


=== pest/core rules ===

## Pest
### Testing
- If you need to verify a feature is working, write or update a Unit / Feature test.

### Pest Tests
- All tests must be written using Pest. Use `php artisan make:test --pest {name}`.
- You must not remove any tests or test files from the tests directory without approval. These are not temporary or helper files - these are core to the application.
- Tests should test all of the happy paths, failure paths, and weird paths.
- Tests live in the `tests/Feature` and `tests/Unit` directories.
- Pest tests look and behave like this:
<code-snippet name="Basic Pest Test Example" lang="php">
it('is true', function () {
    expect(true)->toBeTrue();
});
</code-snippet>

### Running Tests
- Run the minimal number of tests using an appropriate filter before finalizing code edits.
- To run all tests: `php artisan test`.
- To run all tests in a file: `php artisan test tests/Feature/ExampleTest.php`.
- To filter on a particular test name: `php artisan test --filter=testName` (recommended after making a change to a related file).
- When the tests relating to your changes are passing, ask the user if they would like to run the entire test suite to ensure everything is still passing.

### Pest Assertions
- When asserting status codes on a response, use the specific method like `assertForbidden` and `assertNotFound` instead of using `assertStatus(403)` or similar, e.g.:
<code-snippet name="Pest Example Asserting postJson Response" lang="php">
it('returns all', function () {
    $response = $this->postJson('/api/docs', []);

    $response->assertSuccessful();
});
</code-snippet>

### Mocking
- Mocking can be very helpful when appropriate.
- When mocking, you can use the `Pest\Laravel\mock` Pest function, but always import it via `use function Pest\Laravel\mock;` before using it. Alternatively, you can use `$this->mock()` if existing tests do.
- You can also create partial mocks using the same import or self method.

### Datasets
- Use datasets in Pest to simplify tests which have a lot of duplicated data. This is often the case when testing validation rules, so consider going with this solution when writing tests for validation rules.

<code-snippet name="Pest Dataset Example" lang="php">
it('has emails', function (string $email) {
    expect($email)->not->toBeEmpty();
})->with([
    'james' => 'james@laravel.com',
    'taylor' => 'taylor@laravel.com',
]);
</code-snippet>


=== pest/v4 rules ===

## Pest 4

- Pest v4 is a huge upgrade to Pest and offers: browser testing, smoke testing, visual regression testing, test sharding, and faster type coverage.
- Browser testing is incredibly powerful and useful for this project.
- Browser tests should live in `tests/Browser/`.
- Use the `search-docs` tool for detailed guidance on utilizing these features.

### Browser Testing
- You can use Laravel features like `Event::fake()`, `assertAuthenticated()`, and model factories within Pest v4 browser tests, as well as `RefreshDatabase` (when needed) to ensure a clean state for each test.
- Interact with the page (click, type, scroll, select, submit, drag-and-drop, touch gestures, etc.) when appropriate to complete the test.
- If requested, test on multiple browsers (Chrome, Firefox, Safari).
- If requested, test on different devices and viewports (like iPhone 14 Pro, tablets, or custom breakpoints).
- Switch color schemes (light/dark mode) when appropriate.
- Take screenshots or pause tests for debugging when appropriate.

### Example Tests

<code-snippet name="Pest Browser Test Example" lang="php">
it('may reset the password', function () {
    Notification::fake();

    $this->actingAs(User::factory()->create());

    $page = visit('/sign-in'); // Visit on a real browser...

    $page->assertSee('Sign In')
        ->assertNoJavascriptErrors() // or ->assertNoConsoleLogs()
        ->click('Forgot Password?')
        ->fill('email', 'nuno@laravel.com')
        ->click('Send Reset Link')
        ->assertSee('We have emailed your password reset link!')

    Notification::assertSent(ResetPassword::class);
});
</code-snippet>

<code-snippet name="Pest Smoke Testing Example" lang="php">
$pages = visit(['/', '/about', '/contact']);

$pages->assertNoJavascriptErrors()->assertNoConsoleLogs();
</code-snippet>
</laravel-boost-guidelines>
