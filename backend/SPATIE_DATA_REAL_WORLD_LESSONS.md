# Spatie Laravel Data v4 - Lezioni dal Mondo Reale

Questo documento raccoglie **tutte le lezioni pratiche e operative** apprese durante l'implementazione di Spatie Data v4 nel progetto DGGM ERP, con focus su `ProductData`, `ProductService`, e `ProductController`.

## 📚 Indice

1. [Errori Comuni e Come Evitarli](#errori-comuni-e-come-evitarli)
2. [Validazione: Type Hints vs Attributes](#validazione-type-hints-vs-attributes)
3. [Computed Properties: Cosa Funziona Davvero](#computed-properties-cosa-funziona-davvero)
4. [Model Accessors vs DTO Logic](#model-accessors-vs-dto-logic)
5. [Controller Injection Pattern](#controller-injection-pattern)
6. [Service Layer Best Practices](#service-layer-best-practices)
7. [Problemi con Eager Loading](#problemi-con-eager-loading)
8. [Migration da Material a Product](#migration-da-material-a-product)
9. [JSON Serialization](#json-serialization)
10. [Testing Gotchas](#testing-gotchas)

---

## Errori Comuni e Come Evitarli

### ❌ ERRORE 1: Usare `#[Required]` su Type Hints Non-Nullable

```php
// ❌ SBAGLIATO - Ridondante!
#[Required]  // ← NON serve!
public string $name;

// ✅ CORRETTO - Il type hint string è già "required"
public string $name;
```

**Regola d'oro:**
- `string $name` → Campo **required** (non può essere null)
- `?string $name` → Campo **nullable** (può essere null)
- `string|Optional $name` → Campo può mancare completamente
- `#[Required]` serve SOLO per array e campi dinamici

**Esempio pratico da ProductData:**

```php
// ✅ CORRETTO
public function __construct(
    #[Max(255), Unique('products', 'code')]
    public string $code,  // ← NON ha #[Required]!

    #[Max(255)]
    public string $name,  // ← NON ha #[Required]!

    #[Max(1000)]
    public ?string $description,  // ← Nullable con ?

    public int|Optional $id,  // ← Può mancare (auto-increment)
) {}
```

---

### ❌ ERRORE 2: Applicare `#[Computed]` su Metodi

```php
// ❌ SBAGLIATO - #[Computed] NON funziona sui metodi!
#[Computed]
public function calculatedSalePrice(): float
{
    return $this->purchase_price * 1.2;
}
```

**Errore:** `Attribute cannot be applied to a method because it does not contain the 'Attribute::TARGET_METHOD' flag`

**Motivo:** L'attributo `#[Computed]` è definito con `Attribute::TARGET_PROPERTY`, quindi può essere applicato SOLO a proprietà.

```php
// ✅ CORRETTO - Due approcci

// Approccio 1: Computed property con valore di default
#[Computed]
public float $calculated_sale_price = 0;

// Approccio 2: Metodo helper SENZA #[Computed]
public function calculatedSalePrice(): float
{
    if ($this->markup_percentage > 0) {
        return round($this->purchase_price * (1 + ($this->markup_percentage / 100)), 2);
    }
    return $this->sale_price;
}
```

---

### ❌ ERRORE 3: Usare `string|Optional|null`

```php
// ❌ SBAGLIATO - Troppo complesso!
public string|Optional|null $description;

// ✅ CORRETTO - Semplice nullable
public ?string $description;
```

**Quando usare `Optional`:**
- `int|Optional $id` → Campo può mancare (es. su create, ID è auto-generated)
- `SupplierData|Optional $supplier` → Relationship lazy può non essere caricata
- **NON usare** `Optional` per semplici campi nullable → usa `?string`

---

### ❌ ERRORE 4: Collection vs collect()

```php
// ❌ SBAGLIATO - collection() non esiste in v4!
$data = ProductData::collection($products->items());

// ✅ CORRETTO - Usa collect()
$data = ProductData::collect($products->items());
```

**Nota:** In Spatie Data v4, il metodo si chiama `collect()`, non `collection()`.

---

### ❌ ERRORE 5: Operatore Condizionale Sbagliato

```php
// ❌ SBAGLIATO - Precedenza operatori errata!
if (! $product->product_type === ProductType::COMPOSITE) {
    // Questo viene interpretato come: if ((! $product->product_type) === ProductType::COMPOSITE)
}

// ✅ CORRETTO
if ($product->product_type !== ProductType::COMPOSITE) {
    throw new \Exception('Product is not a composite');
}
```

**Regola:** Mai usare `! $x ===`, sempre `$x !==`

---

## Validazione: Type Hints vs Attributes

### Principio Fondamentale

**Type hints sono la prima linea di validazione.** Gli attributes aggiungono validazione specifica.

```php
public function __construct(
    // Type hint: richiede che sia string E non-null
    // Attribute: aggiunge validazione max length e unique
    #[Max(255), Unique('products', 'code')]
    public string $code,

    // Type hint: può essere null
    // Attribute: se presente, deve essere email valida
    #[Email]
    public ?string $email,

    // Type hint: deve essere float
    // Attribute: se presente, deve essere >= 0 e <= 100
    #[Min(0), Max(100)]
    public float $markup_percentage,

    // Type hint: deve esistere nella tabella
    #[Exists('suppliers', 'id')]
    public ?int $default_supplier_id,
) {}
```

### Quando NON usare Attributes

```php
// ❌ NON serve - il type hint già lo gestisce
#[Required]
public string $name;

// ❌ NON serve - bool è sempre true/false
#[Required]
public bool $is_active;

// ✅ Serve - aggiunge validazione oltre al type
#[Min(0)]
public float $price;
```

---

## Computed Properties: Cosa Funziona Davvero

### Pattern Consigliato: Model Accessors + DTO Property

**Nel Model (Product.php):**

```php
use Illuminate\Database\Eloquent\Casts\Attribute;

protected function calculatedSalePrice(): Attribute
{
    return Attribute::make(
        get: function () {
            if ($this->markup_percentage > 0) {
                return round($this->purchase_price * (1 + ($this->markup_percentage / 100)), 2);
            }
            return $this->sale_price;
        }
    );
}

protected function totalStock(): Attribute
{
    return Attribute::make(
        get: fn () => (float) $this->inventory()->sum('quantity_available')
    );
}

protected function compositeTotalCost(): Attribute
{
    return Attribute::make(
        get: function () {
            if ($this->product_type !== ProductType::COMPOSITE) {
                return 0;
            }
            return (float) $this->components()->with('componentProduct')
                ->get()
                ->sum(fn ($component) => $component->quantity * $component->componentProduct->purchase_price);
        }
    );
}
```

**Nel DTO (ProductData.php):**

```php
public function __construct(
    // ... altri campi

    // Computed properties che leggono dagli accessors del Model
    #[Computed]
    public float $calculated_sale_price = 0,

    #[Computed]
    public float $composite_total_cost = 0,

    #[Computed]
    public float $total_stock = 0,

    #[Computed]
    public float $available_stock = 0,
) {}
```

**Spatie Data popola automaticamente le computed properties dagli accessors del Model!**

### Quando Usare Helper Methods nel DTO

```php
// Helper methods SENZA #[Computed] per logica di business
public function canHaveComponents(): bool
{
    return $this->product_type === ProductType::COMPOSITE;
}

public function isInventoriable(): bool
{
    return $this->product_type === ProductType::ARTICLE;
}

public function typeLabel(): string
{
    return $this->product_type->label();
}
```

**Regola:**
- **Model Accessors** → Per valori calcolati che derivano da DB/relationships
- **DTO Helper Methods** → Per logica di business e controlli di stato

---

## Model Accessors vs DTO Logic

### ✅ Cosa va nel Model (Product.php)

```php
// Business logic che richiede DB queries
protected function totalStock(): Attribute
{
    return Attribute::make(
        get: fn () => (float) $this->inventory()->sum('quantity_available')
    );
}

// Calcoli complessi su relationships
protected function compositeTotalCost(): Attribute
{
    return Attribute::make(
        get: function () {
            return (float) $this->components()->with('componentProduct')
                ->get()
                ->sum(fn ($component) => $component->quantity * $component->componentProduct->purchase_price);
        }
    );
}

// Formule di business
protected function calculatedSalePrice(): Attribute
{
    return Attribute::make(
        get: function () {
            if ($this->markup_percentage > 0) {
                return round($this->purchase_price * (1 + ($this->markup_percentage / 100)), 2);
            }
            return $this->sale_price;
        }
    );
}
```

### ✅ Cosa va nel DTO (ProductData.php)

```php
// Computed properties che leggono dal Model
#[Computed]
public float $calculated_sale_price = 0;

#[Computed]
public float $total_stock = 0;

// Helper methods per logica semplice
public function canHaveComponents(): bool
{
    return $this->product_type === ProductType::COMPOSITE;
}

public function isInventoriable(): bool
{
    return $this->product_type === ProductType::ARTICLE;
}

// Metodi di convenienza
public function typeLabel(): string
{
    return $this->product_type->label();
}
```

**Principio:** La logica complessa sta nel Model, il DTO è solo un contenitore tipizzato.

---

## Controller Injection Pattern

### Pattern Raccomandato: Controller Injection

```php
/**
 * Store a newly created product
 *
 * Validazione automatica tramite ProductData injection
 */
public function store(ProductData $data): JsonResponse
{
    $this->authorize('create', Product::class);

    // $data è GIÀ VALIDATO automaticamente!
    $product = $this->productService->create($data);

    return response()->json([
        'success' => true,
        'message' => 'Product created successfully',
        'data' => $product,  // ← NO ->toArray() needed!
    ], 201);
}

public function update(Product $product, ProductData $data): JsonResponse
{
    $this->authorize('update', $product);

    // $data è GIÀ VALIDATO automaticamente!
    $updated = $this->productService->update($product, $data);

    return response()->json([
        'success' => true,
        'message' => 'Product updated successfully',
        'data' => $updated,
    ]);
}
```

**Vantaggi:**
- ✅ Validazione automatica (Laravel risolve il DTO e valida)
- ✅ Codice pulito (no try/catch, no `->validate()`)
- ✅ Type-safe (IDE sa che `$data` è `ProductData`)

### Pattern Alternativo: Manual Validation

```php
public function store(Request $request): JsonResponse
{
    $this->authorize('create', Product::class);

    // Validazione manuale
    try {
        $data = ProductData::validate($request->all());
    } catch (ValidationException $e) {
        return response()->json([
            'success' => false,
            'errors' => $e->errors(),
        ], 422);
    }

    $product = $this->productService->create($data);

    return response()->json([
        'success' => true,
        'data' => $product,
    ], 201);
}
```

**Quando usarlo:** Se serve gestione custom degli errori di validazione.

### Index con Paginazione

```php
public function index(Request $request): JsonResponse
{
    $this->authorize('viewAny', Product::class);

    $filters = $request->only([
        'is_active',
        'category',
        'product_type',
        'search',
        'semantic_search',
    ]);

    $perPage = min($request->input('per_page', 20), 100);

    $products = $this->productService->getAll($filters, $perPage);

    // ✅ Usa collect() per convertire i risultati paginati
    return response()->json([
        'success' => true,
        'data' => ProductData::collect($products->items()),
        'meta' => [
            'current_page' => $products->currentPage(),
            'last_page' => $products->lastPage(),
            'per_page' => $products->perPage(),
            'total' => $products->total(),
        ],
    ]);
}
```

---

## Service Layer Best Practices

### Accettare DTO o Array

```php
/**
 * Create a new product (accepts array or DTO, returns DTO)
 */
public function create(array|ProductData $data): ProductData
{
    // Convert to fillable array (exclude computed properties)
    $dataArray = $data instanceof ProductData ? $this->toFillableArray($data) : $data;

    return DB::transaction(function () use ($dataArray) {
        // Extract components if present (for composite products)
        $components = $dataArray['components'] ?? [];
        unset($dataArray['components']);

        // Create product
        $product = Product::query()->create($dataArray);

        // If it's a composite and has components, attach them
        if ($product->product_type === ProductType::COMPOSITE && ! empty($components)) {
            foreach ($components as $component) {
                $product->components()->create([
                    'component_product_id' => $component['component_product_id'],
                    'quantity' => $component['quantity'],
                    'notes' => $component['notes'] ?? null,
                ]);
            }
        }

        return ProductData::from($product->fresh());
    });
}
```

### ⚠️ IMPORTANTE: Metodo `toFillableArray()`

**Problema:** `$data->toArray()` include computed properties che NON esistono nel database!

```php
// ❌ SBAGLIATO - Causa errori SQL!
$product = Product::create($data->toArray());
// SQL Error: Unknown column 'calculated_sale_price'
```

**Soluzione:** Strip computed properties prima di salvare nel DB

```php
/**
 * Convert ProductData to fillable array (exclude computed properties)
 */
private function toFillableArray(ProductData $data): array
{
    $array = $data->toArray();

    // Remove computed properties that don't exist in DB
    unset(
        $array['calculated_sale_price'],
        $array['composite_total_cost'],
        $array['total_stock'],
        $array['available_stock']
    );

    return $array;
}
```

### Sempre Ritornare DTO

```php
/**
 * Get a single product with all relationships (returns DTO)
 */
public function getById(int $id): ProductData
{
    $product = Product::with([
        'defaultSupplier',
        'inventory.warehouse',
        'components.componentProduct',
        'usedInComposites.kitProduct',
    ])->findOrFail($id);

    return ProductData::from($product);
}
```

**Regola:** Services ritornano SEMPRE DTO, mai Model direttamente.

---

## Problemi con Eager Loading

### ❌ ERRORE: Eager Loading con Lazy Properties

```php
// ❌ SBAGLIATO - Causa type error!
$product = $this->productService->create($data);
return ProductData::from($product->fresh(['components.componentProduct']));
```

**Errore:**
```
Argument #33 ($components) must be of type Spatie\LaravelData\Lazy|array,
Illuminate\Database\Eloquent\Collection given
```

**Motivo:** Quando eager-loadi una relationship, Laravel ritorna una `Collection`, ma il DTO si aspetta `Lazy|array`.

```php
// ✅ CORRETTO - NON eager load relationships lazy
return ProductData::from($product->fresh());
```

**Regola:** Le lazy properties gestiscono il loading automaticamente, NON fare eager load nel `->fresh()`.

### Quando Eager Load è Necessario

```php
// ✅ CORRETTO - Eager load PRIMA di convertire a DTO
$product = Product::with([
    'defaultSupplier',
    'inventory.warehouse',
    'components.componentProduct',
])->findOrFail($id);

$productData = ProductData::from($product);

// Ora puoi includere le lazy properties
$productData = $productData->include('components', 'defaultSupplier');
```

**Regola:** Eager load sul Model prima del `from()`, NON dopo nel `->fresh()`.

---

## Migration da Material a Product

### Lezioni dalla Rinomina

Durante il refactoring da `material` a `product`, abbiamo imparato:

#### 1. Rinominare Tabelle

```php
// Migration: rename_materials_to_products.php
public function up(): void
{
    // Only rename if materials exists and products doesn't
    if (Schema::hasTable('materials') && ! Schema::hasTable('products')) {
        Schema::rename('materials', 'products');
    }
}
```

#### 2. Rinominare Tabelle Junction

```php
// Migration: rename_material_components_to_product_components.php
public function up(): void
{
    if (! Schema::hasTable('material_components')) {
        return;
    }

    // Rename table
    Schema::rename('material_components', 'product_components');

    $driver = DB::getDriverName();

    if ($driver === 'sqlite') {
        // SQLite: Ricrea tabella con nuovi nomi
        $existingData = DB::table('product_components')->get();

        Schema::dropIfExists('product_components');

        Schema::create('product_components', function (Blueprint $table) {
            $table->id();
            $table->foreignId('kit_product_id')->constrained('products')->cascadeOnDelete();
            $table->foreignId('component_product_id')->constrained('products')->cascadeOnDelete();
            // ...
        });

        // Restore data con nuovi nomi colonne
        foreach ($existingData as $row) {
            DB::table('product_components')->insert([
                'kit_product_id' => $row->kit_material_id,
                'component_product_id' => $row->component_material_id,
                // ...
            ]);
        }
    } else {
        // MySQL/PostgreSQL: Usa ALTER TABLE
        DB::statement('ALTER TABLE product_components RENAME COLUMN kit_material_id TO kit_product_id');
        // ...
    }
}
```

#### 3. Aggiornare Model Relationships

```php
// BEFORE
public function components(): HasMany
{
    return $this->hasMany(ProductComponent::class, 'kit_material_id');
}

// AFTER
public function components(): HasMany
{
    return $this->hasMany(ProductComponent::class, 'kit_product_id');
}
```

#### 4. Aggiornare $fillable

```php
// ProductComponent.php - BEFORE
protected $fillable = [
    'kit_material_id',
    'component_material_id',
    'quantity',
    'notes',
];

// AFTER
protected $fillable = [
    'kit_product_id',
    'component_product_id',
    'quantity',
    'notes',
];
```

**Lezione:** Quando rinomini, devi aggiornare:
1. Nome tabella
2. Foreign key columns
3. Model relationships
4. $fillable arrays
5. Service create/update logic
6. Controller validation rules

---

## JSON Serialization

### Laravel Gestisce Automaticamente la Conversione

```php
// ✅ NON serve chiamare ->toArray() esplicitamente!
return response()->json([
    'success' => true,
    'data' => $productDto,  // ← Laravel chiama toArray() automaticamente
]);
```

**Motivo:** Spatie Data implementa `JsonSerializable`, quindi Laravel converte automaticamente.

### Quando Chiamare ->toArray()

```php
// ✅ Quando usi collect() su paginated results
return response()->json([
    'data' => ProductData::collect($products->items()),
    // Laravel NON chiama toArray() su DataCollection automaticamente
]);

// ✅ Quando combini con altre operazioni
$dataArray = $productDto->toArray();
unset($dataArray['sensitive_field']);
return response()->json($dataArray);
```

**Regola:** Nella maggior parte dei casi, lascia che Laravel gestisca la serializzazione.

---

## Testing Gotchas

### 1. Migrations e SQLite In-Memory

```php
// ❌ Problema: SQLite in test non ha tutte le migrations eseguite
// Se la migration ha guard come "Only run if table exists", fallirà

// ✅ Soluzione: Usa guard nei migrations
public function up(): void
{
    if (! Schema::hasTable('materials')) {
        return;  // Skip se la tabella non esiste (test fresh)
    }

    Schema::rename('materials', 'products');
}
```

### 2. Factory Mancanti

```php
// ❌ Errore nei test
ProductComponent::factory()->create();
// Error: Call to undefined method factory()

// ✅ Soluzione: Crea factory
php artisan make:factory ProductComponentFactory
```

### 3. Test per Computed Properties

```php
// ❌ SBAGLIATO - Computed property è una property, non un metodo
$productData->calculated_sale_price()

// ✅ CORRETTO - Accedi come property
$productData->calculated_sale_price
```

### 4. Test per Lazy Properties

```php
// ✅ CORRETTO - Testa che NON sia caricato di default
$productData = ProductData::from($product);
expect($productData->toArray())->not->toHaveKey('components');

// ✅ CORRETTO - Testa che sia caricato quando incluso
$product = Product::with('components')->find($id);
$productData = ProductData::from($product)->include('components');
expect($productData->toArray())->toHaveKey('components');
```

---

## Checklist Finale: Implementazione DTO Completa

Quando implementi un nuovo DTO, verifica:

### DTO Class (ProductData.php)
- [ ] Estende `Spatie\LaravelData\Data`
- [ ] Constructor property promotion
- [ ] PHPDoc completo
- [ ] Type hints corretti (`string` non `#[Required] string`)
- [ ] Nullable con `?type` (non `string|Optional|null`)
- [ ] Attributes di validazione (`#[Max]`, `#[Unique]`, `#[Exists]`)
- [ ] Computed properties con default value (`#[Computed] public float $total = 0`)
- [ ] Lazy properties per relationships
- [ ] Helper methods per business logic
- [ ] Custom validation messages con `messages()` method

### Model (Product.php)
- [ ] `WithData` trait aggiunto
- [ ] `protected string $dataClass = ProductData::class`
- [ ] Accessors per computed properties (Laravel 11 `Attribute::make()`)
- [ ] Relationships definite correttamente
- [ ] `$fillable` aggiornato con nomi colonne corretti
- [ ] `$casts` per enum e tipi speciali

### Service (ProductService.php)
- [ ] Metodi accettano `array|ProductData`
- [ ] Metodi ritornano DTO
- [ ] `toFillableArray()` per strip computed properties
- [ ] Eager load relationships prima del `from()`
- [ ] NON eager load nel `->fresh()`
- [ ] Transaction per create/update complex operations

### Controller (ProductController.php)
- [ ] Controller injection per validation automatica
- [ ] Authorization con `$this->authorize()`
- [ ] NO `->toArray()` quando ritorna JSON (Laravel gestisce)
- [ ] Usa `ProductData::collect()` per collections
- [ ] Meta data per pagination

### Migrations
- [ ] Foreign keys con nomi consistenti
- [ ] Indexes su colonne usate in WHERE/JOIN
- [ ] Guard per test environment (`if (! Schema::hasTable())`)
- [ ] Gestione SQLite vs MySQL/PostgreSQL

### Tests
- [ ] Factory per il model
- [ ] Test validazione
- [ ] Test computed properties (accesso come property)
- [ ] Test lazy properties (NOT included di default)
- [ ] Test helper methods
- [ ] Test create/update via service

---

## Riassunto: Le 10 Regole d'Oro

1. **Type hints sono validazione** - `string` è required, `?string` è nullable
2. **#[Computed] solo su properties** - Non funziona sui metodi
3. **Model Accessors per business logic** - DTO per data transfer
4. **collect() non collection()** - In v4 usa `collect()`
5. **toFillableArray() prima di create()** - Strip computed properties
6. **NO eager load nel fresh()** - Lazy properties gestiscono il loading
7. **Controller injection per validazione** - Laravel valida automaticamente
8. **Service ritorna DTO** - Mai Model direttamente
9. **Laravel serializza automaticamente** - NO `->toArray()` esplicito
10. **Migration guard per test** - `if (! Schema::hasTable())`

---

**Last Updated:** 20 Gennaio 2025
**Autore:** Team DGGM (dopo implementation completa di ProductData)
**Status:** ✅ Validato in produzione
