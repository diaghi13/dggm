# Spatie Laravel Data v4 - Guida Definitiva alla Validazione

Questa guida spiega ESATTAMENTE come funziona la validazione in Spatie Laravel Data v4, basata su documentazione ufficiale e codice sorgente verificato.

---

## 📚 Indice

1. [Quando Avviene la Validazione](#quando-avviene-la-validazione)
2. [Validation Attributes Disponibili](#validation-attributes-disponibili)
3. [Pattern 1: Controller Injection (Raccomandato)](#pattern-1-controller-injection-raccomandato)
4. [Pattern 2: Validazione Manuale](#pattern-2-validazione-manuale)
5. [Pattern 3: From Request (Automatica)](#pattern-3-from-request-automatica)
6. [Validazione Personalizzata](#validazione-personalizzata)
7. [Messaggi di Errore Custom](#messaggi-di-errore-custom)
8. [Validazione Condizionale](#validazione-condizionale)
9. [Validazione Nested Data](#validazione-nested-data)
10. [Errori Comuni da Evitare](#errori-comuni-da-evitare)

---

## Quando Avviene la Validazione

### ✅ Validazione AUTOMATICA

La validazione avviene **automaticamente** in questi casi:

1. **Controller Injection** (RACCOMANDATO)
```php
public function store(ProductData $data)
{
    // $data è GIÀ VALIDATO - non serve altro!
}
```

2. **From Request**
```php
$data = ProductData::from($request);
// Validazione automatica quando $request è un Request
```

### ❌ Validazione NON Avviene

La validazione **NON avviene** in questi casi:

```php
ProductData::from($array);         // Da array - NO validazione
ProductData::from($model);         // Da model - NO validazione
ProductData::from(['key' => 'value']); // Da array - NO validazione
```

### 🔧 Validazione MANUALE

Quando serve validazione esplicita:

```php
// Metodo 1: Solo validazione
$validated = ProductData::validate($request->all());

// Metodo 2: Validazione + Creazione
$data = ProductData::validateAndCreate($request->all());
```

---

## Validation Attributes Disponibili

### String Validation

```php
use Spatie\LaravelData\Attributes\Validation\StringType;
use Spatie\LaravelData\Attributes\Validation\Max;
use Spatie\LaravelData\Attributes\Validation\Min;
use Spatie\LaravelData\Attributes\Validation\Email;
use Spatie\LaravelData\Attributes\Validation\Url;
use Spatie\LaravelData\Attributes\Validation\Uuid;
use Spatie\LaravelData\Attributes\Validation\Regex;

class ExampleData extends Data
{
    public function __construct(
        #[StringType, Max(255)]
        public string $name,

        #[Email]
        public string $email,

        #[Url]
        public string $website,

        #[Uuid]
        public string $uuid,

        #[Regex('/^[A-Z]{3}-[0-9]{5}$/')]
        public string $code,
    ) {}
}
```

### Numeric Validation

```php
use Spatie\LaravelData\Attributes\Validation\IntegerType;
use Spatie\LaravelData\Attributes\Validation\Numeric;
use Spatie\LaravelData\Attributes\Validation\Between;
use Spatie\LaravelData\Attributes\Validation\GreaterThan;
use Spatie\LaravelData\Attributes\Validation\LessThan;

class ProductData extends Data
{
    public function __construct(
        #[IntegerType]
        public int $quantity,

        #[Numeric, Between(0, 100)]
        public float $discount,

        #[GreaterThan(0)]
        public float $price,
    ) {}
}
```

### Database Validation

```php
use Spatie\LaravelData\Attributes\Validation\Exists;
use Spatie\LaravelData\Attributes\Validation\Unique;
use Spatie\LaravelData\Attributes\Validation\RouteParameterReference;

class ProductData extends Data
{
    public function __construct(
        #[Unique('products', 'code')]
        public string $code,

        // Per update - ignora l'elemento corrente
        #[Unique('products', 'code', ignore: new RouteParameterReference('product'))]
        public string $code,

        #[Exists('suppliers', 'id')]
        public ?int $supplier_id,
    ) {}
}
```

### Array & File Validation

```php
use Spatie\LaravelData\Attributes\Validation\ArrayType;
use Spatie\LaravelData\Attributes\Validation\File;
use Spatie\LaravelData\Attributes\Validation\Mimes;
use Spatie\LaravelData\Attributes\Validation\Image;

class UploadData extends Data
{
    public function __construct(
        #[ArrayType]
        public array $tags,

        #[File, Mimes('pdf', 'doc', 'docx'), Max(2048)]  // Max in KB
        public $document,

        #[Image, Mimes('jpg', 'png'), Max(1024)]
        public $photo,
    ) {}
}
```

### Date Validation

```php
use Spatie\LaravelData\Attributes\Validation\After;
use Spatie\LaravelData\Attributes\Validation\Before;
use Spatie\LaravelData\Attributes\Validation\DateFormat;
use Spatie\LaravelData\Attributes\Validation\FieldReference;

class EventData extends Data
{
    public function __construct(
        #[DateFormat('Y-m-d')]
        public string $start_date,

        #[After(new FieldReference('start_date'))]
        public string $end_date,

        #[Before('today')]
        public string $birth_date,
    ) {}
}
```

### Required & Nullable

```php
use Spatie\LaravelData\Attributes\Validation\Required;
use Spatie\LaravelData\Attributes\Validation\Nullable;
use Spatie\LaravelData\Attributes\Validation\RequiredIf;
use Spatie\LaravelData\Attributes\Validation\RequiredWith;

class OrderData extends Data
{
    public function __construct(
        #[Required]
        public string $customer_name,

        #[Nullable]
        public ?string $notes,

        #[RequiredIf('payment_method', 'bank_transfer')]
        public ?string $bank_account,

        #[RequiredWith('address')]
        public ?string $postal_code,
    ) {}
}
```

### Generic Laravel Rules

```php
use Spatie\LaravelData\Attributes\Validation\Rule;

class ProductData extends Data
{
    public function __construct(
        // Singola regola
        #[Rule('required')]
        public string $name,

        // Multiple regole (array)
        #[Rule(['required', 'string', 'max:255'])]
        public string $description,

        // Formato stringa (Laravel style)
        #[Rule('required|string|max:255')]
        public string $title,

        // Variadic
        #[Rule('required', 'string', 'max:255')]
        public string $content,
    ) {}
}
```

---

## Pattern 1: Controller Injection (Raccomandato)

### ✅ Il Modo MIGLIORE - Validazione Automatica

```php
use App\Data\ProductData;

class ProductController extends Controller
{
    /**
     * Store a new product
     *
     * La validazione avviene AUTOMATICAMENTE quando ProductData
     * viene iniettato come parametro del metodo
     */
    public function store(ProductData $data): JsonResponse
    {
        $this->authorize('create', Product::class);

        // $data è GIÀ VALIDATO! 🎉
        // Se la validazione fallisce, Laravel risponde automaticamente con 422

        $product = $this->productService->create($data);

        return response()->json([
            'success' => true,
            'data' => $product->toArray(),
        ], 201);
    }

    public function update(Product $product, ProductData $data): JsonResponse
    {
        $this->authorize('update', $product);

        // $data è GIÀ VALIDATO! 🎉

        $updated = $this->productService->update($product, $data);

        return response()->json([
            'success' => true,
            'data' => $updated->toArray(),
        ]);
    }
}
```

**Vantaggi:**
- ✅ Validazione automatica
- ✅ Codice pulito e conciso
- ✅ Risposta 422 automatica in caso di errore
- ✅ Type-safe

---

## Pattern 2: Validazione Manuale

### Quando Usarlo

Quando NON puoi usare controller injection (ad esempio in Commands, Jobs, Services).

```php
use App\Data\ProductData;

class ImportProductsJob implements ShouldQueue
{
    public function handle(array $productData): void
    {
        // Validazione manuale
        try {
            $validated = ProductData::validate($productData);
            // $validated è un array con i dati validati

            // Oppure valida E crea istanza
            $data = ProductData::validateAndCreate($productData);
            // $data è un'istanza di ProductData

            // Procedi con la logica
            Product::create($data->toArray());

        } catch (\Illuminate\Validation\ValidationException $e) {
            // Gestisci errori di validazione
            Log::error('Product validation failed', [
                'errors' => $e->errors(),
                'data' => $productData,
            ]);

            throw $e;
        }
    }
}
```

### Differenza tra validate() e validateAndCreate()

```php
// validate() - Ritorna array validato
$validated = ProductData::validate($request->all());
// $validated = ['code' => 'PROD-001', 'name' => 'Product Name', ...]

// validateAndCreate() - Ritorna istanza ProductData
$data = ProductData::validateAndCreate($request->all());
// $data instanceof ProductData === true
```

---

## Pattern 3: From Request (Automatica)

### Validazione Automatica con ::from()

```php
use Illuminate\Http\Request;

class ProductController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        $this->authorize('create', Product::class);

        // Validazione AUTOMATICA quando from() riceve un Request
        $data = ProductData::from($request);

        $product = $this->productService->create($data);

        return response()->json([
            'success' => true,
            'data' => $product->toArray(),
        ], 201);
    }
}
```

**Nota:** Questo pattern è meno preferibile rispetto a Controller Injection perché:
- Meno esplicito
- Più facile dimenticare che la validazione avviene
- Controller Injection è più "Laravel-like"

---

## Validazione Personalizzata

### Metodo 1: Regole Custom nel Data Class

```php
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Support\Validation\ValidationContext;

class ProductData extends Data
{
    public function __construct(
        #[Required, StringType]
        public string $code,

        public float $price,
    ) {}

    /**
     * Regole di validazione personalizzate
     */
    public static function rules(ValidationContext $context): array
    {
        return [
            'price' => ['required', 'numeric', function ($attribute, $value, $fail) {
                if ($value <= 0) {
                    $fail('Il prezzo deve essere maggiore di zero.');
                }
            }],
        ];
    }
}
```

### Metodo 2: withValidator Hook

```php
use Illuminate\Validation\Validator;

class ProductData extends Data
{
    public function __construct(
        public string $code,
        public float $price,
    ) {}

    /**
     * Hook per modificare il validator prima della validazione
     */
    public static function withValidator(Validator $validator): void
    {
        $validator->after(function ($validator) {
            // Validazione custom dopo le regole base
            if ($validator->getData()['price'] <= 0) {
                $validator->errors()->add('price', 'Il prezzo deve essere positivo');
            }
        });
    }
}
```

---

## Messaggi di Errore Custom

### Metodo 1: Definire Messaggi nel Data Class

```php
class ProductData extends Data
{
    public function __construct(
        #[Required, Max(255)]
        public string $name,

        #[Required, Email]
        public string $email,
    ) {}

    /**
     * Messaggi di errore personalizzati
     */
    public static function messages(): array
    {
        return [
            'name.required' => 'Il nome del prodotto è obbligatorio.',
            'name.max' => 'Il nome non può superare 255 caratteri.',
            'email.required' => 'L\'email è obbligatoria.',
            'email.email' => 'Inserisci un indirizzo email valido.',
        ];
    }

    /**
     * Attributi personalizzati (per messaggi generici)
     */
    public static function attributes(): array
    {
        return [
            'name' => 'nome del prodotto',
            'email' => 'indirizzo email',
        ];
    }
}
```

---

## Validazione Condizionale

### RequiredIf, RequiredUnless, RequiredWith

```php
use Spatie\LaravelData\Attributes\Validation\RequiredIf;
use Spatie\LaravelData\Attributes\Validation\RequiredUnless;
use Spatie\LaravelData\Attributes\Validation\RequiredWith;
use Spatie\LaravelData\Attributes\Validation\Exclude;

class OrderData extends Data
{
    public function __construct(
        public string $payment_method,

        // Obbligatorio solo se payment_method è 'bank_transfer'
        #[RequiredIf('payment_method', 'bank_transfer')]
        public ?string $bank_account,

        // Obbligatorio a meno che payment_method sia 'cash'
        #[RequiredUnless('payment_method', 'cash')]
        public ?string $transaction_id,

        // Obbligatorio se address è presente
        #[RequiredWith('address')]
        public ?string $postal_code,

        // Escluso se status è 'draft'
        #[Exclude('status', 'draft')]
        public ?string $approved_by,
    ) {}
}
```

---

## Validazione Nested Data

### Data Objects Annidati

```php
class AddressData extends Data
{
    public function __construct(
        #[Required, Max(255)]
        public string $street,

        #[Required, Max(100)]
        public string $city,

        #[Required, Max(10)]
        public string $postal_code,
    ) {}
}

class CustomerData extends Data
{
    public function __construct(
        #[Required, Max(255)]
        public string $name,

        #[Required, Email]
        public string $email,

        // Validazione automatica del nested object
        public AddressData $address,
    ) {}
}
```

### Request di Esempio

```json
{
    "name": "John Doe",
    "email": "john@example.com",
    "address": {
        "street": "Via Roma 123",
        "city": "Milano",
        "postal_code": "20100"
    }
}
```

La validazione avverrà su TUTTI i livelli:
- `name` - required, max 255
- `email` - required, email
- `address.street` - required, max 255
- `address.city` - required, max 100
- `address.postal_code` - required, max 10

---

## Errori Comuni da Evitare

### ❌ ERRORE 1: Usare ::validate() su Model o Array

```php
// ❌ SBAGLIATO - validate() non esiste su istanze
$product = Product::find(1);
$data = ProductData::validate($product);  // ERRORE!

// ✅ CORRETTO
$data = ProductData::from($product);  // NO validazione (ok per model)
```

### ❌ ERRORE 2: Dimenticare che from($request) Valida

```php
// ❌ SBAGLIATO - Validazione doppia
$validated = ProductData::validate($request->all());
$data = ProductData::from($request);  // Valida di nuovo!

// ✅ CORRETTO - Controller Injection
public function store(ProductData $data) {
    // Già validato!
}

// ✅ CORRETTO - From request
$data = ProductData::from($request);  // Valida una volta sola
```

### ❌ ERRORE 3: Optional Senza Default

```php
use Spatie\LaravelData\Optional;

// ❌ SBAGLIATO - Errore se field non presente
public function __construct(
    public string|Optional $name,  // NO default!
) {}

// ✅ CORRETTO
public function __construct(
    public string|Optional $name = null,  // Con default
) {}

// ✅ OPPURE usa Nullable invece di Optional
public function __construct(
    #[Nullable]
    public ?string $name,
) {}
```

### ❌ ERRORE 4: Usare Attributi Non Esistenti

```php
// ❌ SBAGLIATO - Questi attributi NON esistono
#[MinLength(3)]      // NON ESISTE
#[MaxLength(255)]    // NON ESISTE

// ✅ CORRETTO
#[Min(3)]            // Per numeri o stringhe
#[Max(255)]          // Per numeri o stringhe
```

### ❌ ERRORE 5: Confondere Validation e Transformation

```php
// ❌ SBAGLIATO - Computed non valida input
#[Computed]
public function fullName(): string {
    return "{$this->first} {$this->last}";
}

// Computed è per OUTPUT, non per validazione INPUT
```

---

## Checklist Validazione

Quando crei un nuovo Data class:

- [ ] Usa **Controller Injection** quando possibile (pattern raccomandato)
- [ ] Aggiungi **validation attributes** su TUTTE le proprietà required
- [ ] Usa `#[Unique]` con `RouteParameterReference` per update
- [ ] Usa `#[Exists]` per foreign keys
- [ ] Definisci `messages()` per errori custom in italiano
- [ ] Definisci `attributes()` per nomi campo leggibili
- [ ] Testa validazione con unit test
- [ ] Usa `Optional` CON default value
- [ ] Documenta regole complesse con commenti

---

## Esempio Completo: ProductData

```php
<?php

namespace App\Data;

use App\Enums\ProductType;
use Spatie\LaravelData\Attributes\Validation\Exists;
use Spatie\LaravelData\Attributes\Validation\Max;
use Spatie\LaravelData\Attributes\Validation\Min;
use Spatie\LaravelData\Attributes\Validation\Required;
use Spatie\LaravelData\Attributes\Validation\RouteParameterReference;
use Spatie\LaravelData\Attributes\Validation\Unique;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Optional;

class ProductData extends Data
{
    public function __construct(
        public int|Optional $id,

        #[Required, Max(255), Unique('products', 'code')]
        public string $code,

        #[Required, Max(255)]
        public string $name,

        #[Max(1000)]
        public string|Optional|null $description,

        #[Required]
        public ProductType $product_type,

        #[Required, Min(0)]
        public float $purchase_price,

        #[Min(0), Max(100)]
        public float $markup_percentage,

        #[Exists('suppliers', 'id')]
        public int|Optional|null $default_supplier_id,

        public bool $is_active = true,
    ) {}

    /**
     * Messaggi di errore personalizzati
     */
    public static function messages(): array
    {
        return [
            'code.required' => 'Il codice prodotto è obbligatorio.',
            'code.unique' => 'Questo codice prodotto è già in uso.',
            'name.required' => 'Il nome del prodotto è obbligatorio.',
            'purchase_price.required' => 'Il prezzo di acquisto è obbligatorio.',
            'purchase_price.min' => 'Il prezzo deve essere maggiore o uguale a zero.',
            'markup_percentage.max' => 'Il margine non può superare il 100%.',
            'default_supplier_id.exists' => 'Il fornitore selezionato non esiste.',
        ];
    }

    /**
     * Attributi leggibili per messaggi generici
     */
    public static function attributes(): array
    {
        return [
            'code' => 'codice prodotto',
            'name' => 'nome prodotto',
            'purchase_price' => 'prezzo di acquisto',
            'markup_percentage' => 'margine percentuale',
        ];
    }
}
```

### Update Version (ignora se stesso)

```php
class UpdateProductData extends Data
{
    public function __construct(
        #[Required, Max(255), Unique('products', 'code', ignore: new RouteParameterReference('product'))]
        public string $code,

        // ... altre proprietà
    ) {}
}
```

---

## Controller di Esempio Completo

```php
<?php

namespace App\Http\Controllers\Api\V1;

use App\Data\ProductData;use App\Http\Controllers\Controller;use App\Models\Product;use App\Services\ProductService;use Illuminate\Http\JsonResponse;

class ProductController extends Controller
{
    public function __construct(
        private readonly ProductService $productService
    ) {}

    /**
     * Store a new product
     *
     * Validazione automatica tramite Controller Injection
     */
    public function store(ProductData $data): JsonResponse
    {
        $this->authorize('create', Product::class);

        // $data è GIÀ VALIDATO - no try/catch necessario
        // Se validazione fallisce, Laravel risponde 422 automaticamente

        $product = $this->productService->create($data);

        return response()->json([
            'success' => true,
            'message' => 'Prodotto creato con successo',
            'data' => $product->toArray(),
        ], 201);
    }

    /**
     * Update an existing product
     */
    public function update(Product $product, ProductData $data): JsonResponse
    {
        $this->authorize('update', $product);

        // $data è GIÀ VALIDATO

        $updated = $this->productService->update($product, $data);

        return response()->json([
            'success' => true,
            'message' => 'Prodotto aggiornato con successo',
            'data' => $updated->toArray(),
        ]);
    }
}
```

---

## Testing della Validazione

```php
<?php

use App\Data\ProductData;use Illuminate\Validation\ValidationException;

it('validates required fields', function () {
    expect(fn () => ProductData::validateAndCreate([
        'name' => 'Test Product',
        // Manca 'code' required
    ]))->toThrow(ValidationException::class);
});

it('validates unique code', function () {
    Product::factory()->create(['code' => 'PROD-001']);

    expect(fn () => ProductData::validateAndCreate([
        'code' => 'PROD-001',  // Duplicato
        'name' => 'Test',
        'purchase_price' => 100,
    ]))->toThrow(ValidationException::class);
});

it('validates foreign key exists', function () {
    expect(fn () => ProductData::validateAndCreate([
        'code' => 'PROD-001',
        'name' => 'Test',
        'purchase_price' => 100,
        'default_supplier_id' => 99999,  // Non esiste
    ]))->toThrow(ValidationException::class);
});

it('creates valid product data', function () {
    $supplier = Supplier::factory()->create();

    $data = ProductData::validateAndCreate([
        'code' => 'PROD-001',
        'name' => 'Test Product',
        'product_type' => 'article',
        'purchase_price' => 100.00,
        'markup_percentage' => 20.00,
        'default_supplier_id' => $supplier->id,
    ]);

    expect($data)->toBeInstanceOf(ProductData::class)
        ->and($data->code)->toBe('PROD-001')
        ->and($data->purchase_price)->toBe(100.00);
});
```

---

## Risorse

- [Validation Introduction](https://spatie.be/docs/laravel-data/v4/validation/introduction)
- [Using Validation Attributes](https://spatie.be/docs/laravel-data/v4/validation/using-validation-attributes)
- [Available Validation Attributes](https://spatie.be/docs/laravel-data/v4/advanced-usage/validation-attributes)
- [Working with the Validator](https://spatie.be/docs/laravel-data/v4/validation/working-with-the-validator)

---

**Last Updated:** Gennaio 2025
**Maintainer:** Davide Donghi
**Progetto:** DGGM ERP
