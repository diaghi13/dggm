# API Warehouse System

Documentazione API per il sistema di gestione magazzino, inventario, DDT e materiali cantiere.

**Base URL**: `/api/v1`

---

## Supplier-Product Pricing

### POST /import/supplier-catalog

Importa catalogo fornitore con prezzi e condizioni (crea prodotto + relazione fornitore).

**Permesso**: `create products`

**Body**:
```json
{
  "supplier_id": 5,
  "rows": [
    {
      "code": "010",
      "name": "Interruttore Magnetotermico 16A",
      "purchase_price": 12.50,
      "unit": "pz",
      "brand": "BTicino",
      "category": "Elettrico",
      "description": "Interruttore magnetotermico 1P+N 16A curva C",
      "ean": "8014496006615",
      "etim_code": "EC001351",
      "supplier_product_code": "BTI-010",
      "supplier_ean": "8014496006615",
      "wholesale_price": 15.00,
      "retail_price": 20.00,
      "discount_family": "Elettrico",
      "manual_discount_1": 10.0,
      "manual_discount_2": 5.0,
      "manual_discount_3": 2.0,
      "package_quantity": 6,
      "minimum_order_quantity": 6,
      "maximum_order_quantity": 999999,
      "multiple_order_quantity": 6,
      "lead_time_days": 7,
      "payment_term": "30 giorni FM",
      "price_multiplier": 1.0,
      "currency": "EUR",
      "is_active": true
    }
  ]
}
```

**Fields**:
- `supplier_id` (int, required) - ID fornitore
- `rows` (array, required) - Array di prodotti da importare
- `rows.*.code` (string, required, max 255) - Codice prodotto
- `rows.*.name` (string, required, max 255) - Nome prodotto
- `rows.*.purchase_price` (decimal, required, min 0) - Prezzo di acquisto
- `rows.*.unit` (string, nullable, max 50) - Unità di misura (pz, kg, mt, ecc.)
- `rows.*.brand` (string, nullable) - Nome o codice marca
- `rows.*.category` (string, nullable) - Nome o codice categoria
- `rows.*.description` (string, nullable) - Descrizione dettagliata
- `rows.*.ean` (string, nullable, max 13) - Codice EAN prodotto
- `rows.*.etim_code` (string, nullable, max 20) - Codice ETIM classificazione europea
- `rows.*.barcode` (string, nullable, max 255) - Codice a barre
- `rows.*.supplier_product_code` (string, nullable, max 100) - Codice interno fornitore
- `rows.*.supplier_ean` (string, nullable, max 13) - EAN fornitore
- `rows.*.wholesale_price` (decimal, nullable, min 0) - Prezzo ingrosso
- `rows.*.retail_price` (decimal, nullable, min 0) - Prezzo pubblico consigliato
- `rows.*.discount_family` (string, nullable) - Nome famiglia sconti
- `rows.*.manual_discount_1` (decimal, nullable, 0-100) - Primo sconto cascata %
- `rows.*.manual_discount_2` (decimal, nullable, 0-100) - Secondo sconto cascata %
- `rows.*.manual_discount_3` (decimal, nullable, 0-100) - Terzo sconto cascata %
- `rows.*.package_quantity` (int, nullable, min 1) - Pezzi per cartone
- `rows.*.minimum_order_quantity` (int, nullable, min 1) - Quantità minima ordinabile
- `rows.*.maximum_order_quantity` (int, nullable, min 1) - Quantità massima ordinabile
- `rows.*.multiple_order_quantity` (int, nullable, min 1) - Multiplo ordinazione (es. 6 = ordina solo multipli di 6)
- `rows.*.lead_time_days` (int, nullable, min 0) - Tempo consegna in giorni
- `rows.*.payment_term` (string, nullable) - Termini pagamento (es. "30 giorni FM")
- `rows.*.price_multiplier` (decimal, nullable, min 0) - Moltiplicatore prezzo (default 1.0)
- `rows.*.currency` (string, nullable, max 3) - Valuta ISO (EUR, USD, ecc.)
- `rows.*.is_active` (bool, nullable) - Attivo per questo fornitore

**Response**: `200 OK`
```json
{
  "success": true,
  "message": "45 importati, 12 aggiornati, 3 saltati",
  "data": {
    "imported": 45,
    "updated": 12,
    "skipped": 3,
    "errors": [
      "Riga 15: Product code already exists",
      "Riga 32: Invalid supplier_id"
    ]
  }
}
```

**Errors**:
- `403` - Non autorizzato
- `422` - Validazione fallita

**Note**: Ogni riga crea/aggiorna un prodotto e una relazione `supplier_product` con prezzi specifici fornitore. Gli sconti a cascata vengono applicati in sequenza: `final_price = purchase_price * (1 - disc1/100) * (1 - disc2/100) * (1 - disc3/100) * price_multiplier`.

---

## Warehouses

### GET /warehouses

Elenco di tutti i magazzini con filtri.

**Permesso**: `view warehouses`

**Query Params**:
- `is_active` (bool, optional) - Filtra per stato attivo/inattivo
- `type` (string, optional) - Tipo magazzino (central, branch, mobile, site)
- `search` (string, optional) - Cerca per nome/indirizzo
- `per_page` (int, optional, default 20) - Elementi per pagina

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Magazzino Centrale Milano",
      "code": "MC-MI",
      "type": "central",
      "address": "Via Roma 123, Milano",
      "phone": "+39 02 1234567",
      "email": "magazzino.mi@dggm.it",
      "manager_id": 15,
      "is_active": true,
      "notes": "Magazzino principale operativo",
      "created_at": "2026-01-15T10:00:00Z"
    }
  ],
  "meta": {
    "current_page": 1,
    "total": 5,
    "per_page": 20
  }
}
```

**Warehouse Types**:
- `central` - Magazzino centrale
- `branch` - Filiale/succursale
- `mobile` - Magazzino mobile (furgone)
- `site` - Magazzino di cantiere

**Errors**:
- `403` - Non autorizzato

---

### POST /warehouses

Crea nuovo magazzino.

**Permesso**: `create warehouses`

**Body**:
```json
{
  "name": "Magazzino Roma Sud",
  "code": "MR-SUD",
  "type": "branch",
  "address": "Via Appia 456, Roma",
  "phone": "+39 06 7654321",
  "email": "roma.sud@dggm.it",
  "manager_id": 20,
  "is_active": true,
  "notes": "Nuovo magazzino zona sud Roma"
}
```

**Fields**:
- `name` (string, required, max 255) - Nome magazzino
- `code` (string, required, max 50, unique) - Codice identificativo
- `type` (enum, required) - `central` | `branch` | `mobile` | `site`
- `address` (string, nullable) - Indirizzo completo
- `phone` (string, nullable, max 50) - Telefono
- `email` (string, nullable, email) - Email di contatto
- `manager_id` (int, nullable, exists users.id) - Responsabile magazzino
- `is_active` (bool, default true) - Magazzino attivo
- `notes` (string, nullable) - Note

**Response**: `201 Created`
```json
{
  "success": true,
  "message": "Warehouse created successfully",
  "data": { /* Warehouse object */ }
}
```

**Errors**:
- `403` - Non autorizzato
- `422` - Validazione fallita (es. code duplicato)

---

### GET /warehouses/{id}

Dettaglio magazzino specifico.

**Permesso**: `view warehouse`

**Response**:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "Magazzino Centrale Milano",
    "code": "MC-MI",
    /* ...altri campi... */,
    "manager": {
      "id": 15,
      "name": "Mario Rossi",
      "email": "mario.rossi@dggm.it"
    }
  }
}
```

**Errors**:
- `403` - Non autorizzato
- `404` - Magazzino non trovato

---

### PUT /warehouses/{id}

Aggiorna magazzino esistente.

**Permesso**: `update warehouse`

**Body**: Come POST, ma tutti campi opzionali

**Response**:
```json
{
  "success": true,
  "message": "Warehouse updated successfully",
  "data": { /* Warehouse aggiornato */ }
}
```

**Errors**:
- `403` - Non autorizzato
- `404` - Magazzino non trovato
- `422` - Validazione fallita

---

### DELETE /warehouses/{id}

Elimina magazzino (soft delete).

**Permesso**: `delete warehouse`

**Response**: `200 OK`
```json
{
  "success": true,
  "message": "Warehouse deleted successfully"
}
```

**Errors**:
- `403` - Non autorizzato
- `404` - Magazzino non trovato
- `422` - Magazzino contiene inventario (deve essere vuoto)

---

### GET /warehouses/{id}/inventory

Inventario completo di un magazzino con filtri.

**Permesso**: `view warehouse`

**Query Params**:
- `low_stock` (bool, optional) - Solo prodotti sotto scorta minima
- `search` (string, optional) - Cerca prodotto per nome/codice
- `product_id` (int, optional) - Filtra per prodotto specifico

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": 101,
      "warehouse_id": 1,
      "product_id": 50,
      "quantity_available": 150,
      "quantity_reserved": 30,
      "quantity_in_transit": 20,
      "quantity_quarantine": 5,
      "minimum_stock": 50,
      "maximum_stock": 500,
      "average_cost": 12.50,
      "last_stock_date": "2026-02-03",
      "product": {
        "id": 50,
        "code": "010",
        "name": "Interruttore Magnetotermico 16A",
        "unit": "pz"
      }
    }
  ]
}
```

**Inventory States**:
- `quantity_available` - Disponibile per allocazione
- `quantity_reserved` - Riservato per ordini/cantieri
- `quantity_in_transit` - In transito (DDT emessi non ancora consegnati)
- `quantity_quarantine` - In quarantena (danneggiato/controllo qualità)

**Errors**:
- `403` - Non autorizzato
- `404` - Magazzino non trovato

---

## Inventory

### GET /inventory

Inventario globale con filtri avanzati.

**Permesso**: `view inventory`

**Query Params**:
- `warehouse_id` (int, optional) - Filtra per magazzino
- `product_id` (int, optional) - Filtra per prodotto
- `low_stock` (bool, optional) - Solo prodotti sotto scorta minima
- `search` (string, optional) - Cerca prodotto per nome/codice

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": 101,
      "warehouse_id": 1,
      "product_id": 50,
      "quantity_available": 150,
      "quantity_reserved": 30,
      "minimum_stock": 50,
      "warehouse": {
        "id": 1,
        "name": "Magazzino Centrale Milano"
      },
      "product": {
        "id": 50,
        "code": "010",
        "name": "Interruttore Magnetotermico 16A"
      }
    }
  ]
}
```

**Errors**:
- `403` - Non autorizzato

---

### GET /inventory/warehouse/{warehouseId}

Inventario per magazzino specifico.

**Permesso**: `view inventory`

**Response**: Come GET /inventory ma filtrato per magazzino

**Errors**:
- `403` - Non autorizzato
- `404` - Magazzino non trovato

---

### GET /inventory/material/{productId}

Inventario per prodotto specifico (tutte le giacenze in tutti i magazzini).

**Permesso**: `view inventory`

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": 101,
      "warehouse_id": 1,
      "quantity_available": 150,
      "warehouse": {
        "name": "Magazzino Milano"
      }
    },
    {
      "id": 102,
      "warehouse_id": 2,
      "quantity_available": 80,
      "warehouse": {
        "name": "Magazzino Roma"
      }
    }
  ]
}
```

**Errors**:
- `403` - Non autorizzato
- `404` - Prodotto non trovato

---

### GET /inventory/low-stock

Prodotti sotto scorta minima.

**Permesso**: `view inventory`

**Query Params**:
- `warehouse_id` (int, optional) - Filtra per magazzino

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": 101,
      "warehouse_id": 1,
      "product_id": 50,
      "quantity_available": 35,
      "minimum_stock": 50,
      "deficit": 15,
      "product": {
        "code": "010",
        "name": "Interruttore 16A"
      }
    }
  ]
}
```

**Errors**:
- `403` - Non autorizzato

---

### GET /inventory/valuation

Valorizzazione inventario totale.

**Permesso**: `view inventory`

**Query Params**:
- `warehouse_id` (int, optional) - Filtra per magazzino

**Response**:
```json
{
  "success": true,
  "data": {
    "total_value": 125450.75,
    "by_warehouse": [
      {
        "warehouse_id": 1,
        "warehouse_name": "Magazzino Milano",
        "total_value": 85300.50,
        "items_count": 523
      }
    ],
    "by_category": [
      {
        "category_name": "Elettrico",
        "total_value": 45200.00,
        "items_count": 320
      }
    ]
  }
}
```

**Errors**:
- `403` - Non autorizzato

---

### POST /inventory/adjust

Rettifica manuale inventario (correzione giacenza).

**Permesso**: `create inventory`

**Body**:
```json
{
  "product_id": 50,
  "warehouse_id": 1,
  "quantity": 10,
  "unit_cost": 12.50,
  "notes": "Correzione inventario dopo inventario fisico"
}
```

**Fields**:
- `product_id` (int, required, exists products.id)
- `warehouse_id` (int, required, exists warehouses.id)
- `quantity` (decimal, required) - Quantità da aggiungere (positivo) o rimuovere (negativo)
- `unit_cost` (decimal, nullable, min 0) - Costo unitario per valorizzazione
- `notes` (string, nullable, max 1000) - Motivo rettifica

**Response**:
```json
{
  "success": true,
  "message": "Stock adjusted successfully",
  "data": {
    "id": 501,
    "type": "adjustment",
    "quantity": 10,
    "product_id": 50,
    "warehouse_id": 1
  }
}
```

**Errors**:
- `403` - Non autorizzato
- `422` - Validazione fallita o giacenza negativa

**Note**: Crea automaticamente un movimento di tipo `ADJUSTMENT` per tracciabilità.

---

### POST /inventory/minimum-stock

Aggiorna scorta minima per prodotto/magazzino.

**Permesso**: `create inventory`

**Body**:
```json
{
  "product_id": 50,
  "warehouse_id": 1,
  "minimum_stock": 100
}
```

**Response**:
```json
{
  "success": true,
  "message": "Minimum stock updated successfully",
  "data": { /* Inventory aggiornato */ }
}
```

**Errors**:
- `403` - Non autorizzato
- `422` - Validazione fallita

---

## Stock Movements

### GET /stock-movements

Storico movimenti con filtri e paginazione.

**Permesso**: `view stock-movements`

**Query Params**:
- `product_id` (int, optional) - Filtra per prodotto
- `warehouse_id` (int, optional) - Filtra per magazzino
- `site_id` (int, optional) - Filtra per cantiere
- `type` (string, optional) - Tipo movimento (vedi enum sotto)
- `date_from` (date, optional) - Data inizio periodo
- `date_to` (date, optional) - Data fine periodo
- `search` (string, optional) - Cerca per reference/notes
- `per_page` (int, optional, default 20) - Elementi per pagina

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": 1501,
      "type": "intake",
      "product_id": 50,
      "from_warehouse_id": null,
      "to_warehouse_id": 1,
      "site_id": null,
      "quantity": 100,
      "unit_cost": 12.50,
      "reference_type": "ddt",
      "reference_id": 305,
      "reference_document": "DDT-2026-0305",
      "notes": "Carico da fornitore ACME",
      "user_id": 5,
      "movement_date": "2026-02-03T14:30:00Z",
      "product": {
        "code": "010",
        "name": "Interruttore 16A"
      }
    }
  ],
  "meta": {
    "current_page": 1,
    "last_page": 15,
    "per_page": 20,
    "total": 287
  }
}
```

**StockMovementType Enum**:
- `intake` - Carico merce da fornitore
- `output` - Scarico vendita a cliente
- `transfer` - Trasferimento tra magazzini
- `adjustment` - Rettifica inventario manuale
- `return` - Reso da cantiere/cliente
- `waste` - Scarto/perdita
- `rental_out` - Noleggio uscita
- `rental_return` - Noleggio rientro
- `site_allocation` - Assegnazione a cantiere
- `site_return` - Rientro da cantiere

**Errors**:
- `403` - Non autorizzato

---

### POST /stock-movements/intake

Carico merce in magazzino.

**Permesso**: `create stock-movements`

**Body**:
```json
{
  "product_id": 50,
  "warehouse_id": 1,
  "quantity": 100,
  "unit_cost": 12.50,
  "reference": "DDT-2026-0305",
  "notes": "Carico da fornitore ACME"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Stock intake recorded successfully",
  "data": { /* StockMovement object */ }
}
```

**Errors**:
- `403` - Non autorizzato
- `422` - Validazione fallita

**Note**: Aumenta automaticamente `quantity_available` in inventario.

---

## DDT (Documento Di Trasporto)

### GET /ddts

Elenco DDT con filtri e paginazione.

**Permesso**: `view ddts`

**Query Params**:
- `type` (string, optional) - Tipo DDT (vedi enum sotto)
- `status` (string, optional) - Stato DDT (vedi enum sotto)
- `warehouse_id` (int, optional) - Magazzino di partenza/arrivo
- `site_id` (int, optional) - Cantiere destinatario
- `supplier_id` (int, optional) - Fornitore
- `customer_id` (int, optional) - Cliente
- `search` (string, optional) - Cerca per numero/note
- `sort_by` (string, optional, default `ddt_date`) - Campo ordinamento
- `sort_order` (string, optional, default `desc`) - `asc` | `desc`
- `per_page` (int, optional, default 20) - Elementi per pagina

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": 305,
      "code": "DDT-2026-0305",
      "ddt_number": "001/2026",
      "type": "outgoing",
      "status": "delivered",
      "ddt_date": "2026-02-03",
      "from_warehouse_id": 1,
      "to_warehouse_id": null,
      "site_id": 25,
      "transport_type": "corriere",
      "carrier": "BRT",
      "tracking_number": "BRT123456789",
      "num_packages": 3,
      "weight_kg": 45.5,
      "notes": "Consegna materiale elettrico cantiere Roma",
      "confirmed_at": "2026-02-03T09:00:00Z",
      "delivered_at": "2026-02-04T15:30:00Z",
      "items": [
        {
          "id": 501,
          "product_id": 50,
          "quantity": 100,
          "unit_cost": 12.50,
          "description": "Interruttori 16A",
          "product": {
            "code": "010",
            "name": "Interruttore 16A"
          }
        }
      ]
    }
  ],
  "meta": {
    "current_page": 1,
    "total": 150
  }
}
```

**DdtType Enum**:
- `incoming` - DDT fornitore (carico da acquisto)
- `outgoing` - DDT nostro (scarico verso cantiere/cliente)
- `internal` - Trasferimento tra magazzini
- `rental_out` - Noleggio uscita
- `rental_return` - Noleggio rientro
- `return_from_customer` - Reso da cliente
- `return_to_supplier` - Reso a fornitore

**DdtStatus Enum**:
- `draft` - Bozza (modificabile)
- `issued` - Emesso (movimenti generati)
- `in_transit` - In transito
- `delivered` - Consegnato
- `cancelled` - Annullato (movimenti stornati)

**Errors**:
- `403` - Non autorizzato

---

### GET /ddts/next-number

Ottieni suggerimento numero DDT progressivo.

**Permesso**: `create ddts`

**Response**:
```json
{
  "success": true,
  "data": {
    "suggested_number": "DDT-2026-0142"
  }
}
```

**Errors**:
- `403` - Non autorizzato

**Note**: Formato `DDT-{anno}-{progressivo}` con progressivo a 4 cifre.

---

### POST /ddts

Crea nuovo DDT in stato `draft`.

**Permesso**: `create ddts`

**Body**:
```json
{
  "type": "outgoing",
  "ddt_number": "001/2026",
  "ddt_date": "2026-02-03",
  "from_warehouse_id": 1,
  "to_warehouse_id": null,
  "site_id": 25,
  "transport_type": "corriere",
  "carrier": "BRT",
  "tracking_number": "BRT123456789",
  "num_packages": 3,
  "weight_kg": 45.5,
  "notes": "Consegna materiale elettrico",
  "items": [
    {
      "product_id": 50,
      "quantity": 100,
      "unit_cost": 12.50,
      "description": "Interruttori 16A"
    }
  ]
}
```

**Fields**:
- `type` (enum, required) - Tipo DDT (vedi enum sopra)
- `ddt_number` (string, nullable, max 100) - Numero DDT esterno (lascia vuoto per auto-generato)
- `ddt_date` (date, required) - Data emissione DDT
- `from_warehouse_id` (int, nullable, exists warehouses.id) - Magazzino partenza
- `to_warehouse_id` (int, nullable, exists warehouses.id) - Magazzino destinazione (per `internal`)
- `supplier_id` (int, nullable, exists suppliers.id) - Fornitore (per `incoming`)
- `customer_id` (int, nullable, exists customers.id) - Cliente (per `outgoing` verso cliente)
- `site_id` (int, nullable, exists sites.id) - Cantiere destinazione
- `transport_type` (string, nullable) - Tipo trasporto (corriere, mezzo proprio, ritiro)
- `carrier` (string, nullable, max 255) - Vettore/corriere
- `tracking_number` (string, nullable, max 255) - Numero tracking spedizione
- `num_packages` (int, nullable, min 1) - Numero colli
- `weight_kg` (decimal, nullable, min 0) - Peso totale in kg
- `notes` (string, nullable) - Note aggiuntive
- `items` (array, required, min 1) - Righe DDT
- `items.*.product_id` (int, required, exists products.id)
- `items.*.quantity` (decimal, required, min 0.01)
- `items.*.unit_cost` (decimal, nullable, min 0) - Costo unitario
- `items.*.description` (string, nullable) - Descrizione riga

**Response**: `201 Created`
```json
{
  "success": true,
  "message": "DDT created successfully",
  "data": { /* DDT object */ }
}
```

**Errors**:
- `403` - Non autorizzato
- `422` - Validazione fallita

**Note**: DDT creato in stato `draft`. Nessun movimento inventario fino a conferma.

---

### GET /ddts/{id}

Dettaglio DDT completo con items.

**Permesso**: `view ddt`

**Response**:
```json
{
  "success": true,
  "data": {
    "id": 305,
    "code": "DDT-2026-0305",
    /* ...campi DDT... */,
    "items": [ /* ...array items... */ ],
    "fromWarehouse": { /* ...warehouse object... */ },
    "site": { /* ...site object... */ }
  }
}
```

**Errors**:
- `403` - Non autorizzato
- `404` - DDT non trovato

---

### PUT /ddts/{id}

Modifica DDT (solo se stato `draft`).

**Permesso**: `update ddt`

**Body**: Come POST, tutti campi opzionali

**Response**:
```json
{
  "success": true,
  "message": "DDT updated successfully",
  "data": { /* DDT aggiornato */ }
}
```

**Errors**:
- `403` - Non autorizzato
- `404` - DDT non trovato
- `422` - DDT non modificabile (status != draft)

---

### DELETE /ddts/{id}

Elimina DDT (solo se stato `draft`).

**Permesso**: `delete ddt`

**Response**:
```json
{
  "success": true,
  "message": "DDT deleted successfully"
}
```

**Errors**:
- `403` - Non autorizzato
- `404` - DDT non trovato
- `422` - DDT non eliminabile (status != draft)

---

### POST /ddts/{id}/confirm

Conferma DDT e genera movimenti inventario (`draft` → `issued`).

**Permesso**: `update ddt`

**Body**: Nessuno

**Response**:
```json
{
  "success": true,
  "message": "DDT confirmed and stock movements generated successfully",
  "data": { /* DDT confermato */ }
}
```

**Errors**:
- `403` - Non autorizzato
- `404` - DDT non trovato
- `422` - DDT già confermato o stock insufficiente

**Note - Comportamento Event-Driven**:
1. Cambia status a `issued`
2. Genera `StockMovement` per ogni item DDT
3. Per DDT `outgoing`: decrementa `quantity_available`, incrementa `quantity_in_transit`
4. Per DDT `incoming`: incrementa `quantity_in_transit`
5. Per DDT `internal`: decrementa da magazzino origine, incrementa `quantity_in_transit` destinazione
6. Trigger evento `DdtConfirmed` per notifiche/audit

---

### POST /ddts/{id}/deliver

Marca DDT come consegnato (`issued`/`in_transit` → `delivered`).

**Permesso**: `update ddt`

**Body**: Nessuno

**Response**:
```json
{
  "success": true,
  "message": "DDT marked as delivered successfully",
  "data": { /* DDT delivered */ }
}
```

**Errors**:
- `403` - Non autorizzato
- `404` - DDT non trovato
- `422` - DDT non può essere consegnato (status non valido)

**Note - Comportamento**:
1. Cambia status a `delivered`
2. Per DDT `outgoing`: decrementa `quantity_in_transit` (giacenza già decrementata in confirm)
3. Per DDT `incoming`: decrementa `quantity_in_transit`, incrementa `quantity_available`
4. Per DDT `internal`: decrementa `quantity_in_transit`, incrementa `quantity_available` magazzino destinazione
5. Trigger evento `DdtDelivered`

---

### POST /ddts/{id}/cancel

Annulla DDT e storna movimenti (`issued`/`in_transit` → `cancelled`).

**Permesso**: `update ddt`

**Body**:
```json
{
  "reason": "Ordine annullato dal cliente"
}
```

**Fields**:
- `reason` (string, required, max 500) - Motivo annullamento

**Response**:
```json
{
  "success": true,
  "message": "DDT cancelled successfully",
  "data": { /* DDT cancelled */ }
}
```

**Errors**:
- `403` - Non autorizzato
- `404` - DDT non trovato
- `422` - DDT non annullabile (già delivered)

**Note - Comportamento**:
1. Cambia status a `cancelled`
2. Crea movimenti di storno (opposti) per ogni movimento generato
3. Ripristina giacenze allo stato pre-conferma
4. Trigger evento `DdtCancelled`

---

## Material Requests

### GET /sites/{siteId}/material-requests

Richieste materiale per cantiere specifico.

**Permesso**: `view material-requests`

**Query Params**:
- `status` (string, optional) - Filtra per stato (pending, approved, rejected, delivered)
- `priority` (string, optional) - Filtra per priorità (low, normal, high, urgent)
- `worker_id` (int, optional) - Filtra per richiedente

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": 201,
      "site_id": 25,
      "material_id": 50,
      "requested_by_worker_id": 10,
      "quantity_requested": 50,
      "quantity_approved": 45,
      "quantity_delivered": 45,
      "priority": "high",
      "status": "delivered",
      "request_notes": "Urgente per installazione quadri elettrici",
      "response_notes": "Disponibili solo 45 pezzi al momento",
      "required_date": "2026-02-05",
      "requested_at": "2026-02-03T10:00:00Z",
      "approved_at": "2026-02-03T14:30:00Z",
      "delivered_at": "2026-02-04T09:00:00Z",
      "material": {
        "code": "010",
        "name": "Interruttore 16A"
      },
      "requestedByWorker": {
        "name": "Giuseppe Verdi"
      }
    }
  ]
}
```

**MaterialRequestStatus Enum**:
- `pending` - In attesa approvazione
- `approved` - Approvata
- `rejected` - Rifiutata
- `delivered` - Consegnata

**Priority Levels**:
- `low` - Bassa priorità
- `normal` - Priorità normale
- `high` - Alta priorità
- `urgent` - Urgente

**Errors**:
- `403` - Non autorizzato
- `404` - Cantiere non trovato

---

### GET /my-material-requests

Richieste materiale dell'utente autenticato (operaio).

**Permesso**: Autenticato

**Query Params**:
- `status` (string, optional) - Filtra per stato
- `site_id` (int, optional) - Filtra per cantiere

**Response**: Come GET /sites/{siteId}/material-requests

**Errors**:
- `401` - Non autenticato

---

### GET /sites/{siteId}/material-requests/pending-count

Conta richieste in attesa per cantiere.

**Permesso**: `view material-requests`

**Response**:
```json
{
  "success": true,
  "data": {
    "count": 7
  }
}
```

**Errors**:
- `403` - Non autorizzato

---

### GET /sites/{siteId}/material-requests/stats

Statistiche richieste materiale cantiere.

**Permesso**: `view material-requests`

**Response**:
```json
{
  "success": true,
  "data": {
    "total": 150,
    "pending": 7,
    "approved": 95,
    "rejected": 18,
    "delivered": 90,
    "avg_response_time_hours": 4.5
  }
}
```

**Errors**:
- `403` - Non autorizzato

---

### POST /material-requests

Crea nuova richiesta materiale (solo operai).

**Permesso**: `create material-requests`

**Body**:
```json
{
  "site_id": 25,
  "material_id": 50,
  "quantity_requested": 50,
  "priority": "high",
  "request_notes": "Urgente per installazione quadri elettrici",
  "required_date": "2026-02-05"
}
```

**Fields**:
- `site_id` (int, required, exists sites.id) - Cantiere
- `material_id` (int, required, exists products.id) - Prodotto richiesto
- `quantity_requested` (decimal, required, min 0.01) - Quantità
- `priority` (enum, default `normal`) - `low` | `normal` | `high` | `urgent`
- `request_notes` (string, nullable, max 1000) - Motivazione richiesta
- `required_date` (date, nullable) - Data necessità materiale

**Response**: `201 Created`
```json
{
  "success": true,
  "message": "Material request created successfully",
  "data": { /* MaterialRequest object */ }
}
```

**Errors**:
- `403` - Solo operai possono creare richieste
- `422` - Validazione fallita

---

### GET /material-requests/{id}

Dettaglio richiesta materiale.

**Permesso**: `view material-request`

**Response**:
```json
{
  "success": true,
  "data": { /* MaterialRequest complete object */ }
}
```

**Errors**:
- `403` - Non autorizzato
- `404` - Richiesta non trovata

---

### PATCH /material-requests/{id}

Modifica richiesta (solo se `pending`).

**Permesso**: `update material-request`

**Body**: Campi modificabili (quantity_requested, priority, notes, required_date)

**Response**:
```json
{
  "success": true,
  "message": "Material request updated successfully",
  "data": { /* MaterialRequest aggiornata */ }
}
```

**Errors**:
- `403` - Non autorizzato
- `404` - Richiesta non trovata
- `422` - Richiesta non modificabile (già approvata/rifiutata)

---

### POST /material-requests/{id}/approve

Approva richiesta materiale (`pending` → `approved`).

**Permesso**: `approve material-request`

**Body**:
```json
{
  "quantity_approved": 45,
  "response_notes": "Disponibili solo 45 pezzi al momento"
}
```

**Fields**:
- `quantity_approved` (decimal, required, min 0.01) - Quantità approvata (può essere ≤ richiesta)
- `response_notes` (string, nullable, max 1000) - Note risposta

**Response**:
```json
{
  "success": true,
  "message": "Material request approved successfully",
  "data": { /* MaterialRequest approved */ }
}
```

**Errors**:
- `403` - Non autorizzato
- `404` - Richiesta non trovata
- `422` - Richiesta non approvabile (status != pending)

**Note**: Trigger notifica al richiedente.

---

### POST /material-requests/{id}/reject

Rifiuta richiesta materiale (`pending` → `rejected`).

**Permesso**: `reject material-request`

**Body**:
```json
{
  "rejection_reason": "Materiale fuori produzione, sostituire con codice 011"
}
```

**Fields**:
- `rejection_reason` (string, required, max 500) - Motivo rifiuto

**Response**:
```json
{
  "success": true,
  "message": "Material request rejected successfully",
  "data": { /* MaterialRequest rejected */ }
}
```

**Errors**:
- `403` - Non autorizzato
- `404` - Richiesta non trovata
- `422` - Richiesta non rifiutabile (status != pending)

**Note**: Trigger notifica al richiedente.

---

### POST /material-requests/{id}/mark-delivered

Marca richiesta come consegnata (`approved` → `delivered`).

**Permesso**: `deliver material-request`

**Body**:
```json
{
  "quantity_delivered": 45
}
```

**Fields**:
- `quantity_delivered` (decimal, nullable) - Quantità effettivamente consegnata (default = quantity_approved)

**Response**:
```json
{
  "success": true,
  "message": "Material request marked as delivered successfully",
  "data": { /* MaterialRequest delivered */ }
}
```

**Errors**:
- `403` - Non autorizzato
- `404` - Richiesta non trovata
- `422` - Richiesta non consegnabile (status != approved)

**Note**: Trigger notifica al richiedente.

---

### DELETE /material-requests/{id}

Elimina richiesta (solo se `pending`).

**Permesso**: `delete material-request`

**Response**:
```json
{
  "success": true,
  "message": "Richiesta eliminata con successo"
}
```

**Errors**:
- `403` - Non autorizzato
- `404` - Richiesta non trovata
- `422` - Richiesta non eliminabile (già approvata)

---

## Site Materials

### GET /sites/{siteId}/materials

Materiali assegnati al cantiere.

**Permesso**: `view site`

**Query Params**:
- `product_type` (string, optional) - Filtra per tipo prodotto (physical, service, kit)

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": 301,
      "site_id": 25,
      "material_id": 50,
      "quote_item_id": 150,
      "is_extra": false,
      "planned_quantity": 100,
      "allocated_quantity": 0,
      "delivered_quantity": 95,
      "used_quantity": 95,
      "returned_quantity": 5,
      "planned_unit_cost": 12.50,
      "actual_unit_cost": 12.50,
      "status": "completed",
      "required_date": "2026-02-05",
      "delivery_date": "2026-02-04",
      "notes": "Materiale per quadri elettrici piano 1",
      "material": {
        "code": "010",
        "name": "Interruttore 16A",
        "unit": "pz"
      }
    }
  ]
}
```

**SiteMaterial Status**:
- `planned` - Pianificato (nessuna consegna)
- `reserved` - Riservato in magazzino
- `partial` - Parzialmente consegnato
- `delivered` - Consegnato (tutto)
- `in_use` - In uso
- `completed` - Completato (usato tutto)
- `returned` - Restituito

**Errors**:
- `403` - Non autorizzato
- `404` - Cantiere non trovato

---

### GET /sites/{siteId}/materials/extras

Solo materiali extra (non da preventivo).

**Permesso**: `view site`

**Response**:
```json
{
  "success": true,
  "data": [ /* ...array materiali extra... */ ],
  "summary": {
    "total_extras": 12,
    "total_extra_cost": 1850.50
  }
}
```

**Errors**:
- `403` - Non autorizzato
- `404` - Cantiere non trovato

**Note**: Materiali con `is_extra = true` (aggiunti manualmente, non previsti in preventivo).

---

### POST /sites/{siteId}/materials

Assegna materiale al cantiere.

**Permesso**: `update site`

**Body**:
```json
{
  "material_id": 50,
  "quote_item_id": 150,
  "is_extra": false,
  "extra_reason": null,
  "planned_quantity": 100,
  "planned_unit_cost": 12.50,
  "required_date": "2026-02-05",
  "notes": "Materiale per quadri elettrici piano 1"
}
```

**Fields**:
- `material_id` (int, required, exists products.id) - Prodotto
- `quote_item_id` (int, nullable, exists quote_items.id) - Riga preventivo collegata
- `is_extra` (bool, default false) - Materiale extra (se null quote_item_id, diventa automaticamente true)
- `extra_reason` (string, nullable, max 500) - Motivazione extra (obbligatorio se is_extra)
- `planned_quantity` (decimal, required, min 0.01) - Quantità pianificata
- `planned_unit_cost` (decimal, required, min 0) - Costo unitario preventivato
- `required_date` (date, nullable) - Data necessità
- `notes` (string, nullable, max 1000) - Note

**Response**: `201 Created`
```json
{
  "success": true,
  "message": "Material added to site successfully",
  "data": { /* SiteMaterial object */ }
}
```

**Errors**:
- `403` - Non autorizzato
- `404` - Cantiere non trovato
- `422` - Validazione fallita

---

### PATCH /sites/{siteId}/materials/{materialId}

Aggiorna materiale cantiere.

**Permesso**: `update site`

**Body**: Campi modificabili (planned_quantity, planned_unit_cost, actual_unit_cost, status, notes)

**Response**:
```json
{
  "success": true,
  "message": "Material updated successfully",
  "data": { /* SiteMaterial aggiornato */ }
}
```

**Errors**:
- `403` - Non autorizzato
- `404` - Cantiere o materiale non trovato

---

### POST /sites/{siteId}/materials/{materialId}/deliver

Consegna materiale a cantiere (scarica da magazzino).

**Permesso**: `update site`

**Body**:
```json
{
  "warehouse_id": 1,
  "quantity": 95,
  "delivery_date": "2026-02-04",
  "notes": "Consegnato con BRT tracking 123456"
}
```

**Fields**:
- `warehouse_id` (int, required, exists warehouses.id) - Magazzino origine
- `quantity` (decimal, required, min 0.01) - Quantità da consegnare
- `delivery_date` (date, nullable) - Data consegna (default oggi)
- `notes` (string, nullable, max 1000) - Note consegna

**Response**:
```json
{
  "success": true,
  "message": "Material delivered and discharged from warehouse successfully",
  "data": { /* SiteMaterial aggiornato */ }
}
```

**Errors**:
- `403` - Non autorizzato
- `404` - Cantiere o materiale non trovato
- `422` - Stock insufficiente o DDT in transito esistente

**Note - Workflow Semplificato**:
1. Verifica che non esista DDT in transito per questo materiale
2. Crea `StockMovement` tipo `site_allocation`
3. Decrementa `quantity_available` da magazzino
4. Incrementa `delivered_quantity` su `site_material`
5. Nel workflow semplificato: `delivered_quantity = used_quantity` (assunzione: tutto consegnato = tutto usato)
6. Aggiorna status automaticamente: `completed` se delivered >= planned

---

### POST /sites/{siteId}/materials/{materialId}/return

Rientro materiale avanzato da cantiere a magazzino.

**Permesso**: `update site`

**Body**:
```json
{
  "warehouse_id": 1,
  "quantity": 5,
  "notes": "Materiale avanzato, rientro in magazzino"
}
```

**Fields**:
- `warehouse_id` (int, required, exists warehouses.id) - Magazzino destinazione
- `quantity` (decimal, required, min 0.01) - Quantità restituita
- `notes` (string, nullable, max 1000) - Note rientro

**Response**:
```json
{
  "success": true,
  "message": "Material returned to warehouse successfully",
  "data": { /* SiteMaterial aggiornato */ }
}
```

**Errors**:
- `403` - Non autorizzato
- `404` - Cantiere o materiale non trovato
- `422` - Quantità eccede materiale consegnato

**Note - Comportamento**:
1. Crea `StockMovement` tipo `site_return`
2. Incrementa `quantity_available` in magazzino
3. Incrementa `returned_quantity` su `site_material`
4. Decrementa `used_quantity`: `used_quantity = delivered - returned`
5. Aggiorna status

---

### POST /sites/{siteId}/materials/{materialId}/transfer

Trasferimento materiale a altro cantiere (senza passare per magazzino).

**Permesso**: `update site`

**Body**:
```json
{
  "to_site_id": 30,
  "quantity": 10,
  "ddt_number": "DDT-INT-005",
  "notes": "Trasferito a cantiere Roma Nord"
}
```

**Fields**:
- `to_site_id` (int, required, exists sites.id) - Cantiere destinazione
- `quantity` (decimal, required, min 0.01) - Quantità da trasferire
- `ddt_number` (string, nullable, max 100) - Numero DDT trasferimento
- `notes` (string, nullable, max 1000) - Note trasferimento

**Response**:
```json
{
  "success": true,
  "message": "Material transferred to site 'Cantiere Roma Nord' successfully",
  "data": {
    "from": { /* SiteMaterial origine aggiornato */ },
    "to": { /* Nuovo SiteMaterial destinazione */ }
  }
}
```

**Errors**:
- `403` - Non autorizzato
- `404` - Cantiere o materiale non trovato
- `422` - Quantità eccede disponibile

**Note - Comportamento**:
1. Crea nuovo `SiteMaterial` nel cantiere destinazione (is_extra = true)
2. Incrementa `returned_quantity` su materiale origine (contabilizzato come rientro)
3. Status destinazione automaticamente `completed` (materiale già arrivato)
4. NON impatta magazzino (trasferimento diretto site-to-site)

---

### DELETE /sites/{siteId}/materials/{materialId}

Rimuove materiale da cantiere.

**Permesso**: `update site`

**Response**:
```json
{
  "success": true,
  "message": "Material removed from site successfully"
}
```

**Errors**:
- `403` - Non autorizzato
- `404` - Cantiere o materiale non trovato
- `422` - Materiale già consegnato (non eliminabile)

---

## Error Responses

Tutti gli endpoint possono restituire questi errori comuni:

### 401 Unauthorized
```json
{
  "success": false,
  "error": {
    "message": "Unauthenticated.",
    "code": "UNAUTHENTICATED"
  }
}
```

### 403 Forbidden
```json
{
  "success": false,
  "error": {
    "message": "This action is unauthorized.",
    "code": "FORBIDDEN"
  }
}
```

### 422 Unprocessable Entity (Validation)
```json
{
  "success": false,
  "error": {
    "message": "The given data was invalid.",
    "code": "VALIDATION_ERROR",
    "details": {
      "quantity": ["The quantity must be at least 0.01."],
      "warehouse_id": ["The selected warehouse id is invalid."]
    }
  }
}
```

### 404 Not Found
```json
{
  "success": false,
  "error": {
    "message": "Resource not found.",
    "code": "NOT_FOUND"
  }
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "error": {
    "message": "An error occurred on the server.",
    "code": "INTERNAL_ERROR"
  }
}
```

---

## Authentication

Tutti gli endpoint richiedono autenticazione tramite Laravel Sanctum.

**Header**:
```
Authorization: Bearer {token}
```

---

## Notes

### DDT Workflow (Event-Driven)

**Lifecycle**:
1. **Draft**: Bozza modificabile, nessun impatto inventario
2. **Confirm** (`POST /ddts/{id}/confirm`):
   - Genera `StockMovement` per ogni item
   - Per `outgoing`: decrementa `quantity_available`, incrementa `quantity_in_transit`
   - Per `incoming`: incrementa `quantity_in_transit`
   - Trigger evento `DdtConfirmed`
3. **Deliver** (`POST /ddts/{id}/deliver`):
   - Per `outgoing`: decrementa `quantity_in_transit` (giacenza già decrementata)
   - Per `incoming`: decrementa `quantity_in_transit`, incrementa `quantity_available`
   - Trigger evento `DdtDelivered`
4. **Cancel** (`POST /ddts/{id}/cancel`):
   - Crea movimenti di storno (opposti)
   - Ripristina giacenze pre-conferma
   - Trigger evento `DdtCancelled`

**Business Rules**:
- Solo DDT `draft` modificabili/eliminabili
- DDT `issued`/`in_transit` possono essere annullati (con storno movimenti)
- DDT `delivered` NON annullabili (creare reso separato)
- DDT `incoming` incrementa stock solo a delivery
- DDT `outgoing` decrementa stock già a conferma (con in_transit buffer)

### Stock Reservations

**Stati Giacenza**:
- `quantity_available` - Disponibile per allocazione/vendita
- `quantity_reserved` - Riservato per ordini/cantieri specifici (non ancora consegnato)
- `quantity_in_transit` - In viaggio (DDT emesso ma non consegnato)
- `quantity_quarantine` - In quarantena (controllo qualità, danneggiato)

**Formula**:
```
quantity_total = available + reserved + in_transit + quarantine
quantity_physical = available + reserved + quarantine
```

### Site Materials Workflow (Semplificato)

Nel workflow semplificato per cantieri:
- **Consegna materiale** = **Utilizzo materiale** (assunzione: tutto consegnato viene usato)
- `delivered_quantity = used_quantity` automaticamente
- Status `completed` quando `delivered_quantity >= planned_quantity`
- Rientri (`returned_quantity`) decrementano `used_quantity`: `used = delivered - returned`
- Trasferimenti site-to-site NON impattano magazzino (movimenti diretti)

**Advanced Mode (futuro)**: Tracking separato consegna/utilizzo per controllo dettagliato sprechi.

### Supplier-Product Pricing

**Sconti a Cascata**:
Gli sconti vengono applicati in sequenza (non sommati):
```
price = purchase_price
price = price * (1 - discount_1 / 100)
price = price * (1 - discount_2 / 100)
price = price * (1 - discount_3 / 100)
final_price = price * price_multiplier
```

**Esempio**:
- `purchase_price = 100.00`
- `manual_discount_1 = 10%` → 90.00
- `manual_discount_2 = 5%` → 85.50
- `manual_discount_3 = 2%` → 83.79
- `price_multiplier = 1.0` → **83.79 EUR**

**Discount Family vs Manual**:
- Se `manual_discount_X` valorizzato → usa manual
- Altrimenti → usa `discount_family.discount_X`
- Permette override per prodotti specifici mantenendo famiglia default

---

**Versione**: 1.0
**Ultima modifica**: Febbraio 2026
