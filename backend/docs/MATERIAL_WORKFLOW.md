# Material Workflow - Site Materials Management

Questo documento descrive il sistema di gestione materiali sui cantieri con due modalità: **Semplificata** (default) e **Avanzata** (per tracking dettagliato futuro).

---

## Workflow Semplificato (DEFAULT)

### Filosofia
> "Il materiale che esce dal magazzino e va sul cantiere viene installato tutto. Se avanza qualcosa, si fa un conteggio finale e si rientra."

Questo approccio evita di far perdere tempo agli operai con conteggi manuali durante il lavoro. È pratico, veloce e adatto alla maggior parte dei cantieri.

### Flusso Operativo

```
[Acquisto] → [Carico Magazzino] → [Consegna Cantiere = Scarico] → [Rientro Avanzi (raro)]
                                          ↓
                                  delivered_quantity = used_quantity
                                  status = COMPLETED
```

### API Endpoints

#### 1. Consegna Materiale a Cantiere (con scarico automatico)

```http
POST /api/v1/sites/{site}/materials/{material}/deliver
```

**Request Body:**
```json
{
  "warehouse_id": 1,
  "quantity": 100,
  "delivery_date": "2026-01-10",
  "notes": "Consegna completa materiale per fase 1"
}
```

**Comportamento:**
- ✅ Scarico automatico dal magazzino (`InventoryService::deliverToSite`)
- ✅ `delivered_quantity` += quantity
- ✅ `used_quantity` += quantity (ASSUNZIONE: tutto viene utilizzato)
- ✅ `status` = `COMPLETED`
- ✅ Crea `StockMovement` di tipo `SITE_ALLOCATION`

**Response:**
```json
{
  "success": true,
  "message": "Material delivered and discharged from warehouse successfully",
  "data": { ... }
}
```

---

#### 2. Rientro Materiale da Cantiere (avanzi)

```http
POST /api/v1/sites/{site}/materials/{material}/return
```

**Request Body:**
```json
{
  "warehouse_id": 1,
  "quantity": 15,
  "notes": "Materiale avanzato dopo completamento lavori"
}
```

**Comportamento:**
- ✅ Carico in magazzino (`InventoryService::returnFromSite`)
- ✅ `returned_quantity` += quantity
- ✅ `used_quantity` = delivered_quantity - returned_quantity
- ✅ `status` = `RETURNED`
- ✅ Crea `StockMovement` di tipo `SITE_RETURN`

**Validazione:**
- ❌ Errore se `quantity` > (delivered_quantity - returned_quantity)

---

#### 3. Trasferimento Cantiere-a-Cantiere (con DDT)

```http
POST /api/v1/sites/{site}/materials/{material}/transfer
```

**Request Body:**
```json
{
  "to_site_id": 5,
  "quantity": 50,
  "ddt_number": "DDT-2026-001",
  "notes": "Trasferimento per urgenza cantiere B"
}
```

**Comportamento:**
- ✅ Crea nuovo `SiteMaterial` nel cantiere di destinazione
- ✅ Reduce `used_quantity` nel cantiere di origine
- ✅ **NON tocca il magazzino** (materiale rimane "OUT")
- ✅ Traccia il trasferimento con DDT number
- ✅ Status origine: `RETURNED` se quantity = 0, altrimenti rimane
- ✅ Status destinazione: `COMPLETED`

**Validazione:**
- ❌ Errore se `quantity` > (delivered_quantity - returned_quantity)
- ❌ Errore se utente non ha permesso su entrambi i cantieri

---

## Workflow Avanzato (FUTURO - per tracking dettagliato)

### Quando Usarlo
- Cantieri molto complessi con budget stringenti
- Necessità di tracciamento in tempo reale dei consumi
- Analisi costi per fase di lavoro
- Audit e conformità normativa

### Flusso Operativo

```
[Consegna] → [In Uso] → [Log Usage Giornaliero] → [Completato]
               ↓              ↓                        ↓
         status=DELIVERED  status=IN_USE      status=COMPLETED
         used_qty=0        used_qty incrementale  used_qty=planned
```

### API Endpoint (GIÀ IMPLEMENTATO, ma non usato di default)

```http
POST /api/v1/sites/{site}/materials/{material}/log-usage
```

**Request Body:**
```json
{
  "quantity_used": 25,
  "actual_unit_cost": 15.50,
  "notes": "Utilizzo giornaliero fase fondamenta"
}
```

**Comportamento:**
- ✅ `used_quantity` += quantity_used
- ✅ Status automatico: `IN_USE` → `COMPLETED` quando used >= planned
- ✅ Validazione: non può superare `planned_quantity`

> **Nota:** Questo metodo è mantenuto nel codice per future necessità, ma **non è consigliato** per cantieri standard dove il workflow semplificato è più efficiente.

---

## Gestione Noleggi

### Materiale a Noleggio (`is_rentable = true`)

Per materiali noleggiati (es. gru, ponteggi, generatori):

1. **Uscita Noleggio:**
```http
POST /api/v1/stock-movements/rental-out
```
```json
{
  "material_id": 10,
  "warehouse_id": 1,
  "quantity": 1,
  "site_id": 3,
  "notes": "Noleggio gru per cantiere Via Roma"
}
```

**Effetto:**
- ✅ `Material::quantity_out_on_rental` += quantity
- ✅ Materiale è **OUT** ma NON in giacenza magazzino
- ✅ `available_stock` ridotto

2. **Rientro Noleggio:**
```http
POST /api/v1/stock-movements/rental-return
```
```json
{
  "material_id": 10,
  "warehouse_id": 1,
  "quantity": 1,
  "site_id": 3,
  "notes": "Rientro gru da cantiere Via Roma"
}
```

**Effetto:**
- ✅ `Material::quantity_out_on_rental` -= quantity
- ✅ Materiale torna **AVAILABLE** in magazzino
- ✅ `available_stock` aumentato

---

## Stati dei Materiali (SiteMaterialStatus)

| Stato | Descrizione | Workflow |
|-------|-------------|----------|
| `PLANNED` | Pianificato da preventivo | Semplificato & Avanzato |
| `RESERVED` | Riservato da warehouse | Solo Avanzato |
| `DELIVERED` | Consegnato al cantiere | Solo Avanzato (workflow step) |
| `IN_USE` | In utilizzo progressivo | Solo Avanzato |
| `COMPLETED` | Completato/utilizzato | **Default nel Semplificato** |
| `RETURNED` | Restituito (parziale/totale) | Semplificato (avanzi) |

---

## Tipo Movimenti (StockMovementType)

| Tipo | Descrizione | Impatto Stock | Workflow |
|------|-------------|---------------|----------|
| `INTAKE` | Carico merce da fornitore | +giacenza | Entrambi |
| `OUTPUT` | Scarico vendita | -giacenza | Entrambi |
| `SITE_ALLOCATION` | Assegnazione a cantiere | -giacenza | **Semplificato** |
| `SITE_RETURN` | Rientro da cantiere | +giacenza | **Semplificato** |
| `RENTAL_OUT` | Noleggio - uscita | -giacenza, +out_rental | Noleggi |
| `RENTAL_RETURN` | Noleggio - rientro | +giacenza, -out_rental | Noleggi |
| `TRANSFER` | Trasferimento magazzini | 0 (sposta) | Entrambi |
| `ADJUSTMENT` | Rettifica inventario | ±giacenza | Entrambi |
| `WASTE` | Scarto/perdita | -giacenza | Entrambi |

---

## Esempi Pratici

### Scenario 1: Cantiere Standard (Semplificato)

**Situazione:** Cantiere edile, 100 sacchi cemento necessari.

1. **Acquisto:**
```http
POST /api/v1/stock-movements/intake
```
```json
{ "material_id": 5, "warehouse_id": 1, "quantity": 100, "unit_cost": 8.50, "supplier_id": 3 }
```

2. **Consegna Cantiere (= Scarico Automatico):**
```http
POST /api/v1/sites/10/materials/25/deliver
```
```json
{ "warehouse_id": 1, "quantity": 100 }
```
✅ Stock magazzino: -100
✅ Site material status: `COMPLETED`
✅ `used_quantity` = 100

3. **Rientro Avanzi (10 sacchi):**
```http
POST /api/v1/sites/10/materials/25/return
```
```json
{ "warehouse_id": 1, "quantity": 10 }
```
✅ Stock magazzino: +10
✅ Site material status: `RETURNED`
✅ `used_quantity` = 90

**Tempo speso dagli operai:** 0 minuti (nessun conteggio manuale)

---

### Scenario 2: Trasferimento Urgente Tra Cantieri

**Situazione:** Cantiere A ha 50 tubi in eccesso, Cantiere B li necessita urgentemente.

```http
POST /api/v1/sites/10/materials/30/transfer
```
```json
{
  "to_site_id": 15,
  "quantity": 50,
  "ddt_number": "DDT-2026-050",
  "notes": "Urgenza per installazione impianto"
}
```

**Effetto:**
- ✅ Cantiere A: `used_quantity` -50
- ✅ Cantiere B: Nuovo SiteMaterial con `used_quantity` 50, status `COMPLETED`
- ✅ Magazzino: **nessun impatto** (materiale rimane OUT)
- ✅ DDT tracciato nei notes

---

### Scenario 3: Noleggio Ponteggio

**Situazione:** Ponteggio noleggiato per 30 giorni.

1. **Uscita Noleggio:**
```http
POST /api/v1/stock-movements/rental-out
```
```json
{ "material_id": 20, "warehouse_id": 1, "quantity": 1, "site_id": 10 }
```
✅ `quantity_out_on_rental` = 1
✅ `available_stock` = 0 (anche se fisicamente esiste, è OUT)

2. **Rientro Noleggio:**
```http
POST /api/v1/stock-movements/rental-return
```
```json
{ "material_id": 20, "warehouse_id": 1, "quantity": 1, "site_id": 10 }
```
✅ `quantity_out_on_rental` = 0
✅ `available_stock` = 1 (disponibile per nuovo noleggio)

---

## Comparazione Workflow

| Aspetto | Semplificato | Avanzato |
|---------|--------------|----------|
| **Tempo speso operai** | ⚡ Minimo (0 conteggi) | 🐌 Alto (conteggi giornalieri) |
| **Accuratezza** | 🟡 Sufficiente (±5%) | 🟢 Massima (<1%) |
| **Complessità** | 🟢 Bassa | 🔴 Alta |
| **Use Case** | Cantieri standard | Cantieri critici, audit |
| **Delivery = Usage** | ✅ Automatico | ❌ Manuale |
| **Stock Discharge** | ✅ Immediato | ⏳ Progressivo |
| **Best for** | 90% dei casi | 10% casi speciali |

---

## Note Implementative

### Backend
- `SiteMaterialController::deliver()` - Workflow semplificato (automatic discharge)
- `SiteMaterialController::logUsage()` - Workflow avanzato (manuale, commentato)
- `InventoryService` - Gestisce tutti i movimenti stock
- Stati gestiti via `SiteMaterialStatus` enum

### Frontend (da creare)
UI semplificate:
- ✅ "Consegna Materiale" → button verde → scarico automatico
- ✅ "Rientro Avanzi" → button blu → ricarico magazzino
- ✅ "Trasferisci a Cantiere" → modal con select cantiere + DDT

**NON mostrare:**
- ❌ Log Usage button (solo se "advanced mode" abilitato in settings)
- ❌ In Use status (skip direttamente a COMPLETED)

### Configurazione Futura
Nel file `/backend/config/sites.php`:
```php
'material_tracking_mode' => env('MATERIAL_TRACKING_MODE', 'simplified'), // 'simplified' | 'advanced'
```

Permettere switch globale o per cantiere:
```php
if (config('sites.material_tracking_mode') === 'advanced') {
    // Show log-usage UI
}
```

---

## Conclusioni

Il **workflow semplificato** è la scelta consigliata per la maggior parte dei cantieri. È:
- ✅ Pratico per gli operai
- ✅ Sufficientemente accurato
- ✅ Veloce da gestire
- ✅ Riduce errori di input manuale

Il **workflow avanzato** è mantenuto nel codice per:
- Future necessità di tracking dettagliato
- Cantieri con requisiti di audit stringenti
- Analisi costi molto granulari

**Default:** Usa sempre il semplificato. Abilita l'avanzato solo se esplicitamente richiesto.
