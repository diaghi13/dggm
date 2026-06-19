---
name: spatie-laravel-data
description: >
  Guida completa per usare il package spatie/laravel-data v4 in Laravel senza errori.
  Usa questa skill OGNI VOLTA che l'utente menziona laravel-data, Data objects, DTO,
  spatie/laravel-data, Data::from(), DataCollection, Lazy, Optional, cast, transformer,
  validazione con Data, o qualsiasi pattern legato a questo package.
  Copre creazione, validazione, trasformazione, lazy loading, mapping, Eloquent casting,
  computed properties, factories e anti-pattern da evitare.
---

# Spatie Laravel Data v4 — Skill Completa

## Indice rapido
1. [Struttura base di un Data object](#1-struttura-base)
2. [Creazione: from(), optional(), factory()](#2-creazione)
3. [Nesting e Collections](#3-nesting-e-collections)
4. [Casts](#4-casts)
5. [Optional properties (PATCH/update parziali)](#5-optional-properties)
6. [Mapping dei nomi (snake_case ↔ camelCase)](#6-mapping-nomi)
7. [Default e Computed values](#7-default-e-computed)
8. [Validazione](#8-validazione)
9. [Lazy properties (inclusione condizionale)](#9-lazy-properties)
10. [Trasformazione in output (toArray, toJson, resource)](#10-trasformazione-output)
11. [Eloquent Casting](#11-eloquent-casting)
12. [Performance (structure caching)](#12-performance)
13. [Anti-pattern e errori comuni](#13-anti-pattern-e-errori)
14. [Cheat-sheet decisionale](#14-cheat-sheet)

---

## 1. Struttura base

```php
use Spatie\LaravelData\Data;

class SongData extends Data
{
    public function __construct(
        public string $title,
        public string $artist,
    ) {}
}
```

- Estendi sempre `Data` (feature complete) o `Dto` (solo creazione/validazione, senza toArray/resource/lazy)
- Usa constructor promotion (`public string $title`) — è il pattern raccomandato
- La classe può usare anche proprietà pubbliche senza costruttore (ugualmente valido)
- Genera con: `php artisan make:data SongData` → finisce in `app/Data/`

---

## 2. Creazione

### Metodi di creazione disponibili

```php
// Da array
SongData::from(['title' => 'Song', 'artist' => 'Artist']);

// Da modello Eloquent (legge automaticamente le proprietà)
SongData::from(Song::findOrFail($id));

// Da JSON string
SongData::from('{"title":"Song","artist":"Artist"}');

// Da request (+ validazione automatica)
SongData::from($request);

// Null-safe: ritorna null se il valore è null
SongData::optional(null); // → null
SongData::optional($someValue); // → SongData o null

// Con validazione esplicita (anche fuori dalla request)
SongData::validateAndCreate(['title' => 'Song', 'artist' => 'Artist']);

// Solo validazione, senza creare l'oggetto
SongData::validate(['title' => 'Song']); // lancia ValidationException se fallisce
```

### Magical creation methods

Aggiungi metodi `from*` statici per customizzare la creazione da tipi specifici:

```php
class SongData extends Data
{
    public function __construct(
        public string $title,
        public string $artist,
    ) {}

    // Chiamato automaticamente da SongData::from(Song $model)
    public static function fromModel(Song $song): self
    {
        return new self("{$song->title} ({$song->year})", $song->artist);
    }

    // Callable con SongData::from('title|artist')
    public static function fromString(string $string): self
    {
        [$title, $artist] = explode('|', $string);
        return new self($title, $artist);
    }
}
```

**Regole per magical methods:**
- Devono essere `public static`
- Devono iniziare con `from` (ma non chiamarsi esattamente `from`)
- Possono accettare più argomenti: `fromMultiple(string $title, string $artist)`
- Possono ricevere un `CreationContext $context` come parametro aggiuntivo

### Factory (controllo avanzato sulla creazione)

```php
// Validazione sempre attiva
SongData::factory()->alwaysValidate()->from($data);

// Senza validazione
SongData::factory()->withoutValidation()->from($data);

// Senza magical methods
SongData::factory()->withoutMagicalCreation()->from($data);

// Senza mapping dei nomi
SongData::factory()->withoutPropertyNameMapping()->from($data);

// Optional → null invece di Optional::class
SongData::factory()->withoutOptionalValues()->from($data);

// Cast aggiuntivo solo per questa creazione
SongData::factory()->withCast('string', UpperCaseCast::class)->from($data);

// Collect con factory
SongData::factory()->collect(Song::all());
```

---

## 3. Nesting e Collections

### Nesting semplice

```php
class AlbumData extends Data
{
    public function __construct(
        public string $title,
        public ArtistData $artist, // nesting diretto
    ) {}
}

// Creazione da array annidato
AlbumData::from([
    'title' => 'Greatest Hits',
    'artist' => ['name' => 'Rick Astley', 'age' => 22],
]);
```

### Collections di Data objects

**⚠️ IMPORTANTE: devi sempre specificare il tipo degli elementi con un docblock o attributo.**

```php
class AlbumData extends Data
{
    public function __construct(
        public string $title,
        /** @var SongData[] */
        public array $songs,
    ) {}
}

// Alternativa con generics (preferita, compatibile PHPStan/IDE)
class AlbumData extends Data
{
    public function __construct(
        public string $title,
        /** @var array<int, SongData> */
        public array $songs,
    ) {}
}

// Con Laravel Collection
class AlbumData extends Data
{
    public function __construct(
        public string $title,
        /** @var Collection<int, SongData> */
        public Collection $songs,
    ) {}
}

// Attributo esplicito (vecchio stile, ancora supportato)
class AlbumData extends Data
{
    public function __construct(
        public string $title,
        #[DataCollectionOf(SongData::class)]
        public array $songs,
    ) {}
}
```

### Collect helper

```php
// Ritorna lo stesso tipo passato in input
SongData::collect(Song::all());           // → Eloquent Collection di SongData
SongData::collect(Song::paginate());      // → LengthAwarePaginator di SongData
SongData::collect(Song::cursorPaginate()); // → CursorPaginator di SongData

// Forzare un tipo specifico
SongData::collect($songs, DataCollection::class); // → DataCollection
SongData::collect($songs, Collection::class);      // → Laravel Collection
```

**Usa `DataCollection` invece di array/Collection quando hai bisogno di `include()` sui nested items:**

```php
// Solo con DataCollection puoi fare:
SongData::collect(Song::all(), DataCollection::class)->include('artist');
```

---

## 4. Casts

I cast trasformano tipi semplici (string, array) in tipi complessi (DateTime, Enum, ecc.).

### Cast globali (config/data.php)

Già configurati di default:
```php
'casts' => [
    DateTimeInterface::class => Spatie\LaravelData\Casts\DateTimeInterfaceCast::class,
    BackedEnum::class        => Spatie\LaravelData\Casts\EnumCast::class,
],
```

→ `DateTime`, `Carbon`, `CarbonImmutable`, `DateTimeImmutable` e `BackedEnum` vengono castati automaticamente.

### Cast locali (per singola proprietà)

```php
use Spatie\LaravelData\Attributes\WithCast;
use Spatie\LaravelData\Casts\DateTimeInterfaceCast;

class SongData extends Data
{
    public function __construct(
        public string $title,
        #[WithCast(DateTimeInterfaceCast::class, format: 'd-m-Y')]
        public DateTime $releasedAt,
        #[WithCast(EnumCast::class, type: Format::class)]
        public Format $format,
    ) {}
}
```

### Casting di array di tipi non-Data

Abilita nel config (sarà default in v5):

```php
'features' => [
    'cast_and_transform_iterables' => true,
],
```

Poi:
```php
class ReleaseData extends Data
{
    /** @var array<int, DateTime> */
    public array $releaseDates;
}
// I cast globali vengono applicati a ogni elemento dell'array
```

### Custom cast

```php
use Spatie\LaravelData\Casts\Cast;
use Spatie\LaravelData\Casts\Uncastable;

class MoneyCast implements Cast
{
    public function cast(DataProperty $property, mixed $value, array $properties, CreationContext $context): Money|Uncastable
    {
        if (is_int($value)) {
            return new Money($value, 'EUR');
        }
        return Uncastable::create(); // prova altri cast
    }
}
```

---

## 5. Optional properties

Usare quando una proprietà può NON essere presente nel payload (es. PATCH parziali).

**⚠️ `Optional` ≠ `null`**: `null` significa "la proprietà c'è ma è null". `Optional` significa "la proprietà è assente".

```php
use Spatie\LaravelData\Optional;

class UpdateSongData extends Data
{
    public function __construct(
        public string|Optional $title,       // può non essere nel payload
        public string|Optional|null $artist, // può essere assente O null
    ) {}
}

// Se 'artist' non c'è nel payload → $data->artist è Optional::class
// Se 'artist' è null nel payload   → $data->artist è null
UpdateSongData::from(['title' => 'New Title']);
```

**Controllare se una proprietà è Optional:**
```php
use Spatie\LaravelData\Optional;

if ($data->artist instanceof Optional) {
    // la proprietà non era nel payload
}
```

**Convertire Optional → null (factory):**
```php
UpdateSongData::factory()->withoutOptionalValues()->from($request->all());
// Ora i campi assenti saranno null invece di Optional
```

**⚠️ Attenzione:** se usi `withoutOptionalValues()` su una proprietà `Optional|string` (non nullable), accedere alla proprietà assente causa `Typed property must not be accessed before initialization`. Aggiungi sempre `null` nel tipo o un default.

---

## 6. Mapping nomi

### Singola proprietà

```php
use Spatie\LaravelData\Attributes\MapInputName;
use Spatie\LaravelData\Attributes\MapOutputName;
use Spatie\LaravelData\Attributes\MapName;

class ContractData extends Data
{
    public function __construct(
        public string $name,
        #[MapInputName('record_company')]  // solo per input (from())
        public string $recordCompany,

        #[MapOutputName('release_year')]   // solo per output (toArray())
        public int $releaseYear,

        #[MapName('full_title')]           // per input E output
        public string $fullTitle,
    ) {}
}
```

### Tutta la classe con SnakeCaseMapper

```php
use Spatie\LaravelData\Attributes\MapInputName;
use Spatie\LaravelData\Mappers\SnakeCaseMapper;

#[MapInputName(SnakeCaseMapper::class)]
class ArtistData extends Data
{
    public function __construct(
        public int $id,
        public string $fullName,    // letto da 'full_name'
        public string $stageName,   // letto da 'stage_name'
    ) {}
}
```

### Mapping nested con dot notation

```php
class SongData extends Data
{
    public function __construct(
        #[MapInputName('title.name')]     // legge $input['title']['name']
        public string $title,
        #[MapInputName('artists.0.name')] // legge $input['artists'][0]['name']
        public string $artist,
    ) {}
}
```

### Default globale nel config

```php
// config/data.php
'name_mapping_strategy' => [
    'input' => SnakeCaseMapper::class,
    'output' => null,
],
```

---

## 7. Default e Computed values

### Default values

```php
class SongData extends Data
{
    public function __construct(
        public string $title,
        public string $artist = 'Unknown',   // default semplice
        public int $plays = 0,
    ) {}
}
```

### Computed values

Proprietà calcolate da altre proprietà, non accettano valori dall'esterno:

```php
use Spatie\LaravelData\Attributes\Computed;

class UserData extends Data
{
    #[Computed]
    public string $fullName;

    public function __construct(
        public string $firstName,
        public string $lastName,
    ) {
        $this->fullName = "{$this->firstName} {$this->lastName}";
    }
}
```

**Regole Computed:**
- Deve essere una proprietà separata (NON nel constructor parameter)
- Non può ricevere valori dal payload → lancia `CannotSetComputedValue`
- Per silenziare l'eccezione: `ignore_exception_when_trying_to_set_computed_property_value = true` nel config

---

## 8. Validazione

### Quando avviene la validazione

| Scenario | Validazione automatica |
|---|---|
| `SongData::from($request)` | ✅ Sì |
| Iniezione in controller `(SongData $data)` | ✅ Sì |
| `SongData::from(['...'])` (array) | ❌ No |
| `SongData::validateAndCreate([...])` | ✅ Sì (esplicita) |
| `SongData::validate([...])` | ✅ Solo validazione, no creazione |

**Per validare sempre:**
```php
// config/data.php
'validation_strategy' => \Spatie\LaravelData\Support\Creation\ValidationStrategy::Always->value,
```

### Auto-inferring delle regole

Il package inferisce automaticamente le regole dai tipi PHP:

```php
class ArtistData extends Data
{
    public function __construct(
        public string $name,        // → ['required', 'string']
        public int $age,            // → ['required', 'integer']
        public ?string $genre,      // → ['nullable', 'string']
        public ?int $followers = 0, // → [] (ha default, non obbligatorio)
    ) {}
}
```

### Attributi di validazione

```php
use Spatie\LaravelData\Attributes\Validation\{Max, Min, Email, Unique, Exists, Rule};

class UserData extends Data
{
    public function __construct(
        #[Min(3), Max(50)]
        public string $name,

        #[Email, Unique('users', 'email')]
        public string $email,

        #[Rule('required|string|starts_with:+')]
        public string $phone,

        // Ignora l'utente corrente (update)
        #[Unique('users', ignore: new RouteParameterReference('user'))]
        public int $id,
    ) {}
}
```

### Regole manuali

```php
class SongData extends Data
{
    public function __construct(
        public string $title,
        public string $artist,
    ) {}

    public static function rules(): array
    {
        return [
            'title' => ['required', 'string', 'max:255'],
        ];
    }
}
```

### Autorizzazione

```php
class SongData extends Data
{
    public static function authorize(): bool
    {
        return Auth::user()->can('create-songs');
    }
}
```

### Validazione nested

```php
class AlbumData extends Data
{
    /**
     * @param array<int, SongData> $songs
     */
    public function __construct(
        public string $title,
        public array $songs,
    ) {}
}
// Le regole di SongData vengono applicate come songs.*.title, songs.*.artist ecc.
```

### Recuperare le regole generate

```php
AlbumData::getValidationRules($payload); // passa sempre il payload per risultati accurati
```

---

## 9. Lazy properties

Le lazy properties sono incluse nell'output **solo quando richiesto esplicitamente**, per evitare di inviare dati inutili.

### Pattern base

```php
use Spatie\LaravelData\Lazy;

class AlbumData extends Data
{
    public function __construct(
        public string $title,
        /** @var Lazy|Collection<int, SongData> */
        public Lazy|Collection $songs,
    ) {}

    public static function fromModel(Album $album): self
    {
        return new self(
            $album->title,
            Lazy::create(fn() => SongData::collect($album->songs)),
        );
    }
}

// Default: 'songs' non è nell'output
AlbumData::from(Album::first())->toArray(); // ['title' => '...']

// Include manuale
AlbumData::from(Album::first())->include('songs')->toArray();
AlbumData::from(Album::first())->include('songs.title', 'songs.artist')->toArray();
AlbumData::from(Album::first())->include('songs.*')->toArray(); // tutto
AlbumData::from(Album::first())->include('songs.{title,artist}')->toArray(); // sintassi breve
```

### AutoLazy (evita il boilerplate)

```php
#[AutoLazy]
class AlbumData extends Data
{
    public function __construct(
        public string $title,
        public Lazy|Collection $songs, // wrappato automaticamente in Lazy
    ) {}
}
// Non serve più il fromModel manuale!
```

### AutoWhenLoadedLazy (lazy se la relazione è caricata)

```php
class UserData extends Data
{
    public function __construct(
        public string $name,
        #[AutoWhenLoadedLazy]
        public Lazy|SongData $favoriteSong, // incluso solo se la relazione è loaded
    ) {}
}

// Incluso
UserData::from(User::with('favoriteSong')->first());

// Non incluso
UserData::from(User::first());
```

### Tipi di Lazy

```php
// Base: includi esplicitamente con ->include()
Lazy::create(fn() => ...);

// Condizionale: incluso solo se la condizione è vera (non override-abile)
Lazy::when(fn() => $this->isAdmin, fn() => ...);

// Relazione Eloquent: incluso solo se la relazione è caricata
Lazy::whenLoaded('songs', $album, fn() => SongData::collect($album->songs));

// Default incluso (può essere escluso con ->exclude())
Lazy::create(fn() => ...)->defaultIncluded();
```

### Includere da query string

```php
class UserData extends Data
{
    public static function allowedRequestIncludes(): ?array
    {
        return ['favorite_song']; // permetti ?include=favorite_song
        // return null; // permetti tutto
        // return [];   // non permettere nulla (default)
    }
}
// GET /my-account?include=favorite_song
```

### only() e except() vs include()/exclude()

```php
// only/except: rimuovono completamente le proprietà (non riportabili con include)
AlbumData::from($album)->only('title');         // solo title
AlbumData::from($album)->except('songs');        // tutto tranne songs

// include/exclude: gestiscono solo lazy properties
AlbumData::from($album)->include('songs');
AlbumData::from($album)->exclude('songs');

// Condizionali
->includeWhen('songs', fn(AlbumData $d) => $d->title !== 'empty');
->onlyWhen('songs', auth()->user()->isAdmin());
```

---

## 10. Trasformazione output

### toArray() e toJson()

```php
$data->toArray();
$data->toJson();
json_encode($data); // stesso risultato di toJson()
```

### Come resource in controller

```php
class SongController
{
    // Ritorna automaticamente come JSON response
    public function show(Song $song): SongData
    {
        return SongData::from($song);
    }

    // Con include lazy
    public function index(): DataCollection
    {
        return SongData::collect(Song::all(), DataCollection::class)
            ->include('artist');
    }
}
```

**POST → 201 Created automatico, tutti gli altri → 200 OK.**

### Appending proprietà extra

```php
class SongData extends Data
{
    public function __construct(
        public string $title,
        public string $artist,
    ) {}

    public function with(): array
    {
        return [
            'links' => ['self' => route('songs.show', $this->id)],
        ];
    }
}
```

### Wrapping

```php
// Su singolo data object
SongData::from($song)->wrap('data')->toArray();
// ['data' => ['title' => '...', 'artist' => '...']]

// Globale nel config
'wrap' => 'data',
```

### Mapping output nomi

```php
#[MapName(SnakeCaseMapper::class)]
class ArtistData extends Data
{
    public function __construct(
        public string $fullName, // → 'full_name' in output
    ) {}
}
```

### Transformers

I transformer convertono tipi complessi in semplici nell'output:

```php
// config/data.php
'transformers' => [
    DateTimeInterface::class => \Spatie\LaravelData\Transformers\DateTimeInterfaceTransformer::class,
    BackedEnum::class        => \Spatie\LaravelData\Transformers\EnumTransformer::class,
    \Illuminate\Contracts\Support\Arrayable::class => \Spatie\LaravelData\Transformers\ArrayableTransformer::class,
],
```

Custom transformer:
```php
use Spatie\LaravelData\Transformers\Transformer;

class MoneyTransformer implements Transformer
{
    public function transform(DataProperty $property, mixed $value, TransformationContext $context): mixed
    {
        return $value->getAmount(); // es. Money → int
    }
}
```

---

## 11. Eloquent Casting

### Data object come colonna JSON

```php
class Song extends Model
{
    protected $casts = [
        'artist_info' => ArtistData::class,
    ];
}

// Scrittura
Song::create(['artist_info' => new ArtistData('Rick', 22)]);
Song::create(['artist_info' => ['name' => 'Rick', 'age' => 22]]);

// Lettura
$song->artist_info; // → ArtistData object
```

### Collection come colonna JSON

```php
class Artist extends Model
{
    protected $casts = [
        'songs' => DataCollection::class . ':' . SongData::class,
    ];
}
```

### Default per null

```php
protected $casts = [
    'artist_info' => ArtistData::class . ':default', // non torna null se il campo è null
    'songs' => DataCollection::class . ':' . SongData::class . ',default', // ritorna DataCollection vuota invece di null
];
```

### Crittografia

```php
protected $casts = [
    'secret_data' => DataCollection::class . ':' . SecretData::class . ',encrypted',
];
```

### Abstract data con morph map (IMPORTANTE per refactoring sicuro)

```php
// In AppServiceProvider::boot()
use Spatie\LaravelData\Support\DataConfig;

app(DataConfig::class)->enforceMorphMap([
    'cd_config'    => CdRecordConfig::class,
    'vinyl_config' => VinylRecordConfig::class,
]);
```

**Usa sempre il morph map se usi abstract data objects come casts — evita di salvare il FQCN nel DB.**

---

## 12. Performance

### Structure caching (produzione)

Aggiungi al deploy pipeline:
```bash
php artisan data:cache-structures
```

Sempre dopo aver creato o modificato Data objects.

Config:
```php
'structure_caching' => [
    'enabled' => true,
    'directories' => [app_path('Data')],
    'cache' => [
        'store' => 'redis', // meglio redis in produzione
        'prefix' => 'laravel-data',
        'duration' => null, // null = forever (consigliato)
    ],
],
```

Cancellare la cache manualmente: `php artisan data:clear-cached-structures`

Il caching è disabilitato automaticamente in test.

---

## 13. Anti-pattern e errori comuni

### ❌ Non usare `@var` senza tipo specifico in collections

```php
// SBAGLIATO - il package non sa il tipo degli elementi
public array $songs;

// CORRETTO
/** @var SongData[] */
public array $songs;
```

### ❌ Non aspettarsi validazione fuori dalla request

```php
// Questo NON valida:
SongData::from(['title' => 'Song']); // manca 'artist', nessun errore!

// Per validare:
SongData::validateAndCreate(['title' => 'Song']); // lancia ValidationException
```

### ❌ Non confondere Optional e null

```php
// SBAGLIATO per PATCH - se usi null, non sai se l'utente ha passato null o non ha passato nulla
public ?string $artist;

// CORRETTO per PATCH
public string|Optional|null $artist; // null = passato null, Optional = non presente
```

### ❌ Non accedere a proprietà Optional|string senza nullable

```php
class SongData extends Data
{
    public function __construct(
        public Optional|string $artist, // no null, no default!
    ) {}
}
$data = SongData::factory()->withoutOptionalValues()->from([]);
$data->artist; // ❌ PHP Error: must not be accessed before initialization

// Fix: aggiungere null o default
public Optional|string|null $artist;
public Optional|string $artist = 'Unknown';
```

### ❌ Non usare il FQCN come morph per abstract data

```php
// PERICOLOSO: se rinomini la classe si rompe il DB
protected $casts = ['config' => RecordConfig::class];
// Senza morph map → salva '\\App\\Data\\CdRecordConfig' nel JSON

// SICURO: usa enforceMorphMap() in AppServiceProvider
```

### ❌ Non dimenticare `data:cache-structures` in deploy

Senza caching le strutture vengono rifletted ogni richiesta → lento in produzione.

### ❌ Non usare `Lazy` senza `DataCollection` per gli include nested

```php
// include('songs') funziona solo se songs è una DataCollection, non array/Collection
return SongData::collect(Song::all(), DataCollection::class)->include('songs');
// Con array o Collection normale, include() non ha effetto
```

### ❌ Non definire `Computed` nel costruttore

```php
// SBAGLIATO - computed nel constructor parameter
class UserData extends Data
{
    public function __construct(
        #[Computed]
        public string $fullName, // ❌ non funziona qui
        public string $firstName,
    ) {}
}

// CORRETTO - computed come proprietà separata
class UserData extends Data
{
    #[Computed]
    public string $fullName;

    public function __construct(
        public string $firstName,
        public string $lastName,
    ) {
        $this->fullName = "{$this->firstName} {$this->lastName}";
    }
}
```

---

## 14. Cheat-sheet decisionale

| Situazione | Soluzione |
|---|---|
| Data object semplice senza resource/lazy | `Dto` invece di `Data` |
| Proprietà può non essere nel payload | `string\|Optional` |
| Proprietà può essere null | `?string` |
| Proprietà assente o null | `string\|Optional\|null` |
| Cast di DateTime personalizzato | `#[WithCast(DateTimeInterfaceCast::class, format: 'Y-m-d')]` |
| Enum cast | Automatico con BackedEnum (globale nel config) |
| Validare fuori dalla request | `validateAndCreate()` |
| PATCH endpoint | `Optional` per le proprietà modificabili |
| Relazioni opzionali nell'output API | `Lazy::create()` o `#[AutoLazy]` |
| Relazioni caricate solo se loaded | `#[AutoWhenLoadedLazy]` |
| snake_case input → camelCase PHP | `#[MapInputName(SnakeCaseMapper::class)]` su classe |
| Proprietà calcolata da altre | `#[Computed]` su proprietà separata |
| Data object in colonna Eloquent | `$casts = ['field' => MyData::class]` |
| Collection in colonna Eloquent | `$casts = ['field' => DataCollection::class.':'.MyData::class]` |
| Abstract data in Eloquent | + `enforceMorphMap()` in AppServiceProvider |
| Performance in produzione | `php artisan data:cache-structures` nel deploy |
