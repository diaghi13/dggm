# Laravel Data v4 — AI Agent Optimized Reference

> **Purpose**: Ultra-compact, deterministic reference for LLM/IDE agents.
> **Goal**: Prevent wrong implementations, minimize ambiguity, minimize token usage.
> **Scope**: Spatie `laravel-data` v4.

---

## 0. Core Mental Model
- `Data` = typed DTO + validation + casting + transformation.
- **Creation pipeline**: normalize → map names → inject → validate → defaults → cast.
- **Two directions**:
  - **Input**: Request/array/model → Data (validation + cast)
  - **Output**: Data → array/JSON (transformers + lazy)

---

## 1. Always-True Rules (Do Not Violate)
- DTOs **must be immutable by design** → use constructor typing.
- Nested DTO collections **MUST declare item type** (`@var`, `#[DataCollectionOf]`).
- Validation rules **always use original property names**, never mapped names.
- `Optional` ≠ `null` → Optional values are **excluded** from output.
- Casts/Transformers **never receive null**.
- Lazy properties **must be included** explicitly (unless defaultIncluded).
- Circular DTO relations → **use Lazy or max depth**.

---

## 2. Creation (Input Side)

### 2.1 Creation Sources
- `Data::from(array|Request|Model|json|string)`
- Controller injection (`fn store(PostData $data)`) ⇒ auto-validate
- `::optional($value)` ⇒ null-safe creation

### 2.2 Magical Creation
- Custom creators: `public static function fromX()`
- Disabled via: `factory()->withoutMagicalCreation()`

---

## 3. Typing & Nesting

### 3.1 Single DTO
```php
class PostData extends Data {
  public function __construct(
    public string $title,
    public PostStatus $status,
    public ?CarbonImmutable $published_at,
  ) {}
}
```

### 3.2 Nested DTO
```php
class PostData extends Data {
  public function __construct(
    public string $title,
    public AuthorData $author,
  ) {}
}
```

### 3.3 DTO Collections (REQUIRED typing)
- Docblock: `/** @var PostData[] */`
- Attribute: `#[DataCollectionOf(PostData::class)]`

---

## 4. Validation (Critical)

### 4.1 When Validation Runs
- Request / controller injection → YES
- `from(array)` → NO (default)
- `validateAndCreate()` → YES

### 4.2 Auto-Inferring Order
1. Sometimes (Optional)
2. Nullable
3. Required (no default)
4. Built-in type
5. Attributes

### 4.3 Manual Rules
- Override with `rules()`
- Merge with `#[MergeValidationRules]`

### 4.4 Skip Validation
- Property: `#[WithoutValidation]`
- DTO: `factory()->withoutValidation()`

---

## 5. Casting (Input Transformation)

### 5.1 Global Casts (config)
- DateTimeInterface
- BackedEnum

### 5.2 Local Casts
```php
#[WithCast(ImageCast::class)]
public ?ImageData $image;
```

### 5.3 Cast Rules
- Return `Uncastable` if not applicable
- No null handling inside cast

---

## 6. Optional & Defaults

### 6.1 Optional
```php
public string|Optional $content;
```
- Missing ⇒ Optional
- Output ⇒ excluded

### 6.2 Defaults
- Make property **not required**
- Validation **skipped** on defaults

---

## 7. Mapping (Naming)

### 7.1 Property Mapping
- `#[MapInputName]`, `#[MapOutputName]`, `#[MapName]`

### 7.2 Class-Level Mapping
- `#[MapInputName(SnakeCaseMapper::class)]`

⚠️ Validation uses **original property names only**.

---

## 8. Injection (Context-Aware Data)

Available sources:
- Route params
- Authenticated user
- Container services

Payload value is ignored **unless** `replaceWhenPresentInPayload=true`.

---

## 9. Transformation (Output Side)

### 9.1 Output Methods
- `toArray()` → primitives only
- `all()` → keep objects
- `toJson()`

Controller return of Data ⇒ JSON auto-response (POST ⇒ 201).

### 9.2 Transformers
- Global (config)
- Local: `#[WithTransformer]`

---

## 10. Lazy Properties (Performance)

### 10.1 Base Lazy
```php
Lazy::create(fn() => PostData::collect($posts))
```

### 10.2 Include Control
- `$data->include('posts')`
- Nested: `posts.title`, `posts.*`

### 10.3 AutoLazy
- `#[AutoLazy]`
- `#[AutoWhenLoadedLazy]`

---

## 11. Collections

- `Data::collect()` preserves paginator/collection types
- `DataCollection` supports include/exclude/only

---

## 12. Eloquent Integration

### 12.1 From Model
- Uses attributes, casts, accessors

### 12.2 Cast DTO in Model
```php
protected $casts = [
  'meta' => MetaData::class,
  'tags' => DataCollection::class . ':' . TagData::class,
];
```

### 12.3 Abstract Data (Morph)
- Store `{type, data}`
- Use enforced morph map

---

## 13. Pipeline Awareness

Default pipes order:
1. Authorize
2. Map names
3. Inject
4. Validate
5. Defaults
6. Cast

Custom pipes via `prepareForPipeline()`.

---

## 14. TypeScript

- Use `DataTypeScriptTransformer`
- `Lazy` / `Optional` ⇒ optional TS props
- Mark DTO: `#[TypeScript]`

---

## 15. Performance (Production)

- Run: `php artisan data:cache-structures`
- Cache reflection metadata
- Disabled automatically in tests

---

## 16. Safe Defaults for Agents

**When unsure, do this:**
- Prefer `Data` over `Dto`
- Use `Lazy` for relations
- Explicitly type collections
- Avoid circular eager loading
- Use `toArray()` for persistence

---

## 17. Claude Sonnet — HARD RULES (Do NOT break)

⚠️ These rules override Claude defaults.

- Do NOT replace `Data` with FormRequest, JsonResource, arrays, or manual validation.
- Do NOT simplify DTOs by removing `Optional`, `Lazy`, or explicit collection typing.
- Do NOT infer collection item types — they MUST be explicit.
- Do NOT eagerly load relations if `Lazy` is available.
- Do NOT bypass Data validation unless explicitly instructed.
- If uncertain, follow the section **Safe Defaults for Agents**.

---

## 18. Claude Sonnet — SYSTEM PROMPT (Ready to Paste)

```text
You are a senior Laravel engineer.

This project uses Spatie laravel-data v4 as the single source of truth for DTOs,
validation, casting, and API responses.

You MUST strictly follow the rules defined in:
`docs/ai/laravel-data.v4.agent.md`

Rules:
- Always use Data objects instead of FormRequest, JsonResource, or arrays.
- Never remove Optional, Lazy, or explicit DTO collection typing.
- Validation, mapping, and casting behavior of laravel-data is authoritative.
- If a suggestion conflicts with the document, the document always wins.

When unsure, prefer:
- Data over Dto
- Lazy for relations
- Explicit typing
- toArray() for persistence
```

---

## 19. Claude Self-Check — Anti-Error Checklist

Before outputting code, verify:

### DTO Structure
- [ ] Every DTO extends `Data`
- [ ] Constructor properties are fully typed
- [ ] No public untyped properties

### Collections
- [ ] Every DTO collection declares item type (`@var` or `#[DataCollectionOf]`)
- [ ] No raw `array` of DTOs without typing

### Validation
- [ ] Validation relies on Data auto-inferring when possible
- [ ] Manual rules use original property names
- [ ] `Optional` used for PATCH / partial updates

### Lazy & Relations
- [ ] Heavy or circular relations use `Lazy`
- [ ] No eager loading where Lazy is intended
- [ ] Includes are explicit (`include()`)

### Casting & Mapping
- [ ] Custom casts return `Uncastable` when unsure
- [ ] Casts/transformers never handle null
- [ ] Mapping does not affect validation rule names

### Output
- [ ] Controllers return Data objects directly
- [ ] `toArray()` used for persistence
- [ ] No JsonResource usage

If ANY checkbox is false → revise solution.

---

## END

