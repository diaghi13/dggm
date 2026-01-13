# Gestione Tecnici per Servizi - Future Feature

## Requirement

Un servizio può essere gestito da più tecnici, e un tecnico può gestire più servizi.

**Relazione Many-to-Many**: `Service <-> Technician`

## Esempi Pratici

### Caso 1: Un Tecnico, Più Servizi
**Tecnico:** Mario Rossi (Fonico + Resp. Tecnico)

Servizi gestiti:
- Impianto Audio (20 ore)
- Regia Luci (15 ore)
- Coordinamento Tecnico (10 ore)

### Caso 2: Un Servizio, Più Tecnici
**Servizio:** Installazione Impianto Allarme (40 ore totali)

Tecnici assegnati:
- Giovanni Bianchi (Impiantista Senior) - 20 ore
- Luca Verdi (Impiantista Junior) - 20 ore

### Caso 3: Multi-servizio, Multi-tecnico
**Evento:** Concerto Live

**Servizi:**
1. Impianto Audio (60 ore)
   - Mario Rossi (Fonico) - 30 ore
   - Paolo Neri (Assistente Audio) - 30 ore

2. Impianto Luci (40 ore)
   - Sara Gialli (Light Designer) - 20 ore
   - Marco Blu (Operatore Luci) - 20 ore

3. Regia Video (30 ore)
   - Mario Rossi (anche Video) - 15 ore
   - Chiara Viola (Video Operator) - 15 ore

**Nota:** Mario Rossi lavora su 2 servizi diversi (Audio + Video)

---

## Database Schema (Future)

### Migration: `create_service_technicians_table.php`

```php
Schema::create('service_technicians', function (Blueprint $table) {
    $table->id();
    $table->foreignId('site_material_id')->constrained('site_materials')->cascadeOnDelete();
    $table->foreignId('user_id')->constrained('users')->cascadeOnDelete(); // Tecnico

    // Ore assegnate al tecnico per questo servizio
    $table->decimal('assigned_hours', 10, 2)->default(0);
    $table->decimal('worked_hours', 10, 2)->default(0);

    // Ruolo specifico del tecnico per questo servizio
    $table->string('role')->nullable(); // 'lead', 'assistant', 'specialist', etc.

    // Costo orario per questo tecnico su questo servizio
    $table->decimal('hourly_rate', 10, 2)->nullable();

    // Date operative
    $table->date('start_date')->nullable();
    $table->date('end_date')->nullable();

    $table->text('notes')->nullable();
    $table->timestamps();

    $table->unique(['site_material_id', 'user_id']); // Un tecnico non può essere assegnato 2 volte allo stesso servizio
    $table->index(['user_id', 'start_date']); // Per query su disponibilità tecnico
});
```

### Model: `ServiceTechnician`

```php
class ServiceTechnician extends Model
{
    protected $fillable = [
        'site_material_id',
        'user_id',
        'assigned_hours',
        'worked_hours',
        'role',
        'hourly_rate',
        'start_date',
        'end_date',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'assigned_hours' => 'decimal:2',
            'worked_hours' => 'decimal:2',
            'hourly_rate' => 'decimal:2',
            'start_date' => 'date',
            'end_date' => 'date',
        ];
    }

    // Relationships
    public function siteMaterial(): BelongsTo {
        return $this->belongsTo(SiteMaterial::class);
    }

    public function technician(): BelongsTo {
        return $this->belongsTo(User::class, 'user_id');
    }

    // Accessors
    public function getRemainingHoursAttribute(): float {
        return max(0, $this->assigned_hours - $this->worked_hours);
    }

    public function getProgressPercentageAttribute(): float {
        if ($this->assigned_hours == 0) return 0;
        return ($this->worked_hours / $this->assigned_hours) * 100;
    }

    public function getTotalCostAttribute(): float {
        return $this->worked_hours * ($this->hourly_rate ?? 0);
    }
}
```

### Update Model: `SiteMaterial`

```php
// In app/Models/SiteMaterial.php

public function technicians(): HasMany
{
    return $this->hasMany(ServiceTechnician::class);
}

public function getTotalAssignedHoursAttribute(): float
{
    return $this->technicians()->sum('assigned_hours');
}

public function getTotalWorkedHoursAttribute(): float
{
    return $this->technicians()->sum('worked_hours');
}

public function getTotalTechnicianCostAttribute(): float
{
    return $this->technicians->sum('total_cost');
}
```

### Update Model: `User`

```php
// In app/Models/User.php

public function serviceAssignments(): HasMany
{
    return $this->hasMany(ServiceTechnician::class, 'user_id');
}

// Servizi attivi per questo tecnico
public function activeServices(): HasMany
{
    return $this->serviceAssignments()
        ->whereHas('siteMaterial', function($q) {
            $q->whereIn('status', ['planned', 'in_use']);
        });
}

// Check se tecnico è disponibile in un periodo
public function isAvailableInPeriod(string $startDate, string $endDate): bool
{
    return !$this->serviceAssignments()
        ->where(function($q) use ($startDate, $endDate) {
            $q->whereBetween('start_date', [$startDate, $endDate])
              ->orWhereBetween('end_date', [$startDate, $endDate]);
        })
        ->exists();
}
```

---

## API Endpoints (Future)

### Gestione Assegnazioni Tecnici

```
GET    /api/v1/sites/{site}/services/{service}/technicians
POST   /api/v1/sites/{site}/services/{service}/technicians
PATCH  /api/v1/sites/{site}/services/{service}/technicians/{technician}
DELETE /api/v1/sites/{site}/services/{service}/technicians/{technician}

POST   /api/v1/sites/{site}/services/{service}/technicians/{technician}/log-hours
```

### Query Disponibilità Tecnici

```
GET    /api/v1/technicians/available?start_date=2026-01-15&end_date=2026-01-20&skills=audio,luci
GET    /api/v1/technicians/{id}/assignments?period=current
GET    /api/v1/technicians/{id}/workload?month=2026-01
```

---

## Frontend Components (Future)

### 1. `ServiceTechniciansSection`

**Location:** `/components/service-technicians-section.tsx`

**Features:**
- Lista tecnici assegnati al servizio
- Tabella con: Nome, Ruolo, Ore Assegnate, Ore Lavorate, Progress, Costo
- Button "Assegna Tecnico" → Dialog con:
  - Select tecnico (con filtro disponibilità)
  - Input ore assegnate
  - Select ruolo
  - Input costo orario
  - Date range
- Button "Registra Ore" per ogni tecnico
- Summary totale: Totale Ore, Totale Costo

### 2. `AssignTechnicianDialog`

**Features:**
- ComboboxSelect tecnici con lazy loading
- Badge "Disponibile" / "Occupato" based on availability check
- Warning se tecnico già assegnato ad altri servizi nello stesso periodo
- Form: ore, ruolo, costo, date

### 3. `LogTechnicianHoursDialog`

**Features:**
- Info tecnico e servizio
- Input ore lavorate (max = ore assegnate - ore già lavorate)
- Data lavoro
- Note
- Progress bar aggiornata

### 4. `TechnicianCalendarView`

**Features:**
- Vista calendario mensile per tecnico
- Colori diversi per servizi diversi
- Tooltip con dettagli servizio e cantiere
- Click per aprire dettaglio servizio

---

## Business Rules

### 1. Validazione Ore
- ✅ Ore lavorate ≤ Ore assegnate
- ✅ Warning se tecnico supera 40 ore/settimana (straordinario)
- ✅ Blocco se tecnico ha overlap temporale con altri servizi

### 2. Calcolo Costi
- Costo servizio = Somma (ore_lavorate × costo_orario_tecnico) per tutti i tecnici
- Se `hourly_rate` non specificato → usa `user.default_hourly_rate`

### 3. Disponibilità Tecnici
```php
// Check disponibilità
$technician->isAvailableInPeriod('2026-01-15', '2026-01-20');

// Get conflitti
$conflicts = $technician->serviceAssignments()
    ->whereBetween('start_date', [$startDate, $endDate])
    ->with('siteMaterial.site')
    ->get();
```

### 4. Status Automatici
- Se `worked_hours >= assigned_hours` per tutti i tecnici → servizio status = COMPLETED
- Se almeno un tecnico ha `worked_hours > 0` → servizio status = IN_USE

---

## UI/UX Best Practices

### Assegnazione Tecnici
1. **Filtri Smart:**
   - Mostra solo tecnici disponibili nel periodo selezionato
   - Badge con numero servizi attivi del tecnico
   - Ordina per disponibilità (meno carico prima)

2. **Warnings Visivi:**
   - 🟡 Tecnico con più di 3 servizi attivi
   - 🔴 Tecnico con overlap temporale
   - 🟢 Tecnico completamente disponibile

3. **Quick Actions:**
   - Button "Copia da preventivo" (se servizio viene da quote)
   - Button "Assegna team completo" (template predefiniti)

### Registrazione Ore
1. **Mobile-First:** Tecnici registrano ore da smartphone
2. **Bulk Entry:** Registra ore per più tecnici insieme
3. **Weekly View:** Vista settimanale per timesheet complessivo

---

## Example API Responses

### Get Service Technicians

```json
GET /api/v1/sites/10/services/25/technicians

{
  "success": true,
  "data": [
    {
      "id": 1,
      "technician": {
        "id": 5,
        "name": "Mario Rossi",
        "email": "mario@example.com",
        "skills": ["audio", "video", "regia"]
      },
      "role": "lead",
      "assigned_hours": 30,
      "worked_hours": 15,
      "remaining_hours": 15,
      "progress_percentage": 50,
      "hourly_rate": 35.00,
      "total_cost": 525.00,
      "start_date": "2026-01-15",
      "end_date": "2026-01-20"
    },
    {
      "id": 2,
      "technician": {
        "id": 8,
        "name": "Paolo Neri",
        "email": "paolo@example.com",
        "skills": ["audio"]
      },
      "role": "assistant",
      "assigned_hours": 30,
      "worked_hours": 10,
      "remaining_hours": 20,
      "progress_percentage": 33.3,
      "hourly_rate": 25.00,
      "total_cost": 250.00,
      "start_date": "2026-01-15",
      "end_date": "2026-01-20"
    }
  ],
  "summary": {
    "total_technicians": 2,
    "total_assigned_hours": 60,
    "total_worked_hours": 25,
    "total_cost": 775.00,
    "completion_percentage": 41.7
  }
}
```

### Assign Technician

```json
POST /api/v1/sites/10/services/25/technicians

Request:
{
  "user_id": 12,
  "assigned_hours": 20,
  "role": "specialist",
  "hourly_rate": 40.00,
  "start_date": "2026-01-16",
  "end_date": "2026-01-18",
  "notes": "Specialista per installazione avanzata"
}

Response:
{
  "success": true,
  "message": "Tecnico assegnato con successo",
  "data": { ... }
}
```

---

## Migration Path

Quando sarà il momento di implementare questa feature:

1. ✅ Creare migration `service_technicians`
2. ✅ Creare model `ServiceTechnician`
3. ✅ Update models `SiteMaterial` e `User` con relationships
4. ✅ Creare `ServiceTechnicianController`
5. ✅ Aggiungere routes API
6. ✅ Frontend: `ServiceTechniciansSection` component
7. ✅ Frontend: Dialogs per assegnazione e log ore
8. ✅ Testing: Unit tests per business logic
9. ✅ Testing: Feature tests per API endpoints

## Note Implementative

- **Per ora:** Tab "Servizi" mostra solo il servizio stesso con log ore manuale diretto
- **Futuro:** Tab "Servizi" avrà sottosezione "Tecnici Assegnati" espandibile per ogni servizio
- **Compatibilità:** La tabella `site_materials` è già pronta, basta aggiungere la relazione many-to-many

---

## Conclusione

Questa è una feature **FUTURE** da implementare quando necessario. Per ora il sistema funziona con log ore diretto sul servizio, senza assegnazione tecnici specifica.

La documentazione serve per:
- ✅ Non dimenticare il requirement
- ✅ Avere chiara la direzione di sviluppo
- ✅ Schema database già pianificato
- ✅ Business logic definita
