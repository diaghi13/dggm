# DGGM ERP - Laravel Backend Guidelines

**IMPORTANTE**: Questo file contiene le convenzioni specifiche del progetto DGGM.
Laravel Boost sovrascrive `CLAUDE.md`, quindi usa questo file per linee guida custom.

---

## Convenzioni Specifiche DGGM

### 1. Service Layer Pattern (OBBLIGATORIO)

**Controllers devono essere THIN** - Solo gestione HTTP, nessuna business logic.

```php
// ✅ CORRETTO
class CustomerController extends Controller
{
    public function __construct(
        private readonly CustomerService $customerService
    ) {}

    public function index(Request $request): AnonymousResourceCollection
    {
        $this->authorize('viewAny', Customer::class);

        $filters = $request->only(['search', 'is_active']);
        $customers = $this->customerService->getAll($filters);

        return CustomerResource::collection($customers);
    }
}

// ❌ SBAGLIATO - Business logic nel controller
public function index()
{
    $customers = Customer::where('is_active', true)
        ->with('addresses')
        ->orderBy('name')
        ->get();

    return response()->json($customers);
}
```

### 2. Authorization Pattern

**Usa `$this->authorize()` in controllers**:
```php
// In Controller
$this->authorize('view', $customer);
$this->authorize('viewAny', Customer::class);

// FormRequest gestisce permessi per create/update
public function authorize(): bool
{
    return $this->user()->can('customers.create');
}
```

### 3. API Response Format (Standardizzato)

```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... },
  "meta": {
    "current_page": 1,
    "total": 100
  }
}
```

### 4. Database Naming Conventions

**English, snake_case**:
- Tables: `customers`, `construction_sites`, `time_entries`
- Columns: `created_at`, `user_id`, `is_active`
- Foreign keys: `{table_singular}_id` (es: `customer_id`, `site_id`)

### 5. Ruoli Predefiniti

- **SuperAdmin**: Accesso completo
- **Admin**: Gestione completa azienda
- **ProjectManager**: Cantieri, preventivi, SAL
- **Foreman**: Cantieri assegnati, gestione squadra
- **Worker**: Timbrature, visualizzazione cantieri (read-only)
- **Accountant**: Fatturazione, contabilità, reportistica
- **WarehouseManager**: Magazzino, DDT, ordini fornitori
- **Customer**: Visualizzazione preventivi/SAL (portale clienti)

### 6. Code Organization

```
app/
├── Models/              # Eloquent models
├── Http/
│   ├── Controllers/Api/V1/  # API controllers (THIN)
│   ├── Requests/           # Form validation + authorization
│   └── Resources/          # API response transformers
├── Services/           # Business logic (CORE)
├── Policies/           # Authorization logic
└── Jobs/              # Background tasks
```

### 7. Security Best Practices

- Tutti gli endpoint richiedono autenticazione Sanctum (tranne login/register)
- Policy per ogni risorsa
- SEMPRE validare input con FormRequest
- Sanitizzare output con API Resources
- Rate limiting: 60 req/min
- Logging azioni critiche

### 8. Performance

- **Eager Loading**: `with()` per evitare N+1
- **Caching**:
  - Liste statiche: 1h
  - Anagrafica: 15min
  - Dashboard stats: 5min
- **Queue Jobs**: Email, PDF, export
- **Database Indexes**: Colonne in WHERE, JOIN, ORDER BY

### 9. Timbrature Multi-Cantiere (Business Rule)

- Un operaio può timbrare su più cantieri nella stessa giornata
- Ogni entrata/uscita associata a cantiere specifico
- GPS obbligatorio: coordinate entro 50-100m dal cantiere
- Se fuori range: flag `richiede_verifica` + notifica manager
- Calcolo ore: `ore_lavorate = uscita - entrata`
- Straordinario: totale giornaliero > 8h o settimanale > 40h

---

**Last Updated**: Gennaio 2025
**Laravel Version**: 12
**PHP Version**: 8.2+
