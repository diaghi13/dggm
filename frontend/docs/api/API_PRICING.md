# API Pricing System

Documentazione API per il sistema di gestione listini prezzi e pricing prodotti.

**Base URL**: `/api/v1`

---

## Price Lists

### GET /price-lists

Ottieni tutti i listini prezzi attivi.

**Permesso**: `view price-lists`

**Query Params**:
- Nessuno (ritorna tutti i listini attivi)

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Listino Base 2026",
      "code": "BASE_2026",
      "description": "Listino standard per vendite",
      "calculation_mode": "automatic",
      "adjustment_type": "percentage",
      "adjustment_value": 15.0,
      "applies_to": "sale",
      "category_id": null,
      "department_filter": null,
      "valid_from": "2026-01-01",
      "valid_to": null,
      "is_active": true,
      "is_default": true,
      "priority": 0
    }
  ]
}
```

**Errors**:
- `403` - Utente non autorizzato

---

### POST /price-lists

Crea un nuovo listino prezzi.

**Permesso**: `create price-lists`

**Body** (required):
```json
{
  "name": "Listino Noleggi",
  "code": "RENTAL_2026",
  "description": "Listino dedicato ai noleggi",
  "calculation_mode": "automatic",
  "adjustment_type": "percentage",
  "adjustment_value": 10.0,
  "applies_to": "rental",
  "category_id": null,
  "is_active": true,
  "is_default": false,
  "priority": 10
}
```

**Fields**:
- `name` (string, max 100, required) - Nome del listino
- `code` (string, max 50, required, unique) - Codice identificativo
- `description` (string, nullable) - Descrizione
- `calculation_mode` (enum, required) - `automatic` | `manual`
- `adjustment_type` (enum, required) - `percentage` | `fixed` | `none`
- `adjustment_value` (float, nullable) - Valore dell'aggiustamento
- `applies_to` (enum, required) - `sale` | `rental` | `both`
- `category_id` (int, nullable) - ID categoria prodotti (null = tutti)
- `department_filter` (string, max 50, nullable) - Filtro per reparto
- `valid_from` (date, nullable) - Data inizio validità
- `valid_to` (date, nullable) - Data fine validità (deve essere >= valid_from)
- `is_active` (bool, default true)
- `is_default` (bool, default false)
- `priority` (int, min 0, nullable) - Priorità applicazione

**Optional**:
- `generate_items` (bool, default true) - Genera automaticamente i price list items

**Response**: `201 Created`
```json
{
  "success": true,
  "data": { /* PriceList object */ },
  "message": "Price list created successfully"
}
```

**Errors**:
- `403` - Non autorizzato
- `422` - Validazione fallita (es. code duplicato, valid_to < valid_from)

---

### GET /price-lists/{id}

Dettaglio di un listino con tutti i suoi items.

**Permesso**: `view price-list`

**Response**:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "Listino Base 2026",
    "code": "BASE_2026",
    /* ... altri campi ... */
    "items": [
      {
        "id": 101,
        "product_id": 50,
        "price": 125.50,
        "cost": 100.00,
        "markup_percent": 25.5,
        "product": {
          "id": 50,
          "name": "Trapano Bosch Professional",
          "code": "TRAP001"
        }
      }
    ],
    "category": {
      "id": 5,
      "name": "Edilizia"
    }
  }
}
```

**Errors**:
- `403` - Non autorizzato
- `404` - Listino non trovato

---

### PUT /price-lists/{id}

Aggiorna un listino esistente (solo metadati, non gli items).

**Permesso**: `update price-list`

**Body**: Come POST, ma tutti i campi sono opzionali (aggiorna solo quelli forniti)

**Response**:
```json
{
  "success": true,
  "data": { /* PriceList aggiornato */ },
  "message": "Price list updated successfully"
}
```

**Errors**:
- `403` - Non autorizzato
- `404` - Listino non trovato
- `422` - Validazione fallita

---

### DELETE /price-lists/{id}

Elimina un listino (soft delete).

**Permesso**: `delete price-list`

**Response**: `200 OK`
```json
{
  "success": true,
  "message": "Price list deleted successfully"
}
```

**Errors**:
- `403` - Non autorizzato
- `404` - Listino non trovato

---

### POST /price-lists/{id}/regenerate

Rigenera tutti gli items del listino (cancella e ricrea).

**Permesso**: `update price-list`

**Body**: Nessuno

**Response**:
```json
{
  "success": true,
  "data": { /* PriceList con items rigenerati */ },
  "message": "Price list regenerated successfully"
}
```

**Errors**:
- `403` - Non autorizzato
- `404` - Listino non trovato

---

## Product Pricing

### GET /products/{id}/pricing

Dettaglio pricing di un prodotto con tutte le informazioni di calcolo.

**Permesso**: `view product`

**Query Params**:
- `price_list_id` (int, optional) - ID listino specifico per calcolare effective price

**Response**:
```json
{
  "success": true,
  "data": {
    "product": {
      "id": 50,
      "name": "Trapano Bosch Professional",
      "code": "TRAP001",
      "cost": 100.00,
      "price": 130.00,
      /* ... altri campi prodotto ... */
      "priceListItems": [
        {
          "id": 101,
          "price_list_id": 1,
          "price": 125.50,
          "priceList": {
            "id": 1,
            "name": "Listino Base 2026"
          }
        }
      ]
    },
    "effective_price": 125.50
  }
}
```

**effective_price**: Prezzo finale calcolato in base al listino fornito (o prezzo base se nessun listino).

**Errors**:
- `403` - Non autorizzato
- `404` - Prodotto non trovato

---

### POST /products/bulk-update-prices

Aggiorna prezzi in massa con filtri e regole di aggiustamento.

**Permesso**: `update products`

**Body**:
```json
{
  "filters": {
    "brand_id": 5,
    "category_id": 10
  },
  "adjustment": {
    "type": "percentage",
    "value": 10.0
  }
}
```

**filters** (object, optional):
- `brand_id` (int) - Filtra per brand
- `category_id` (int) - Filtra per categoria

**adjustment** (object, required):
- `type` (string) - `percentage` | `fixed`
- `value` (float) - Valore aggiustamento (es. 10 = +10% o +10€)

**Response**:
```json
{
  "success": true,
  "data": {
    "updated_count": 45
  },
  "message": "45 products updated successfully"
}
```

**Errors**:
- `403` - Non autorizzato
- `422` - Validazione fallita

---

### POST /products/preview-price-adjustment

Anteprima aggiustamento prezzi (senza salvare).

**Permesso**: `view products`

**Body**:
```json
{
  "filters": {
    "brand_id": 5,
    "category_id": 10
  },
  "adjustment_type": "percentage",
  "adjustment_value": 10.0
}
```

**Fields**:
- `filters` (object, optional) - Come bulk-update
- `adjustment_type` (string, required) - `percentage` | `fixed`
- `adjustment_value` (float, required) - Valore aggiustamento

**Response**:
```json
{
  "success": true,
  "data": {
    "affected_count": 45,
    "samples": [
      {
        "product_id": 50,
        "product_name": "Trapano Bosch",
        "current_price": 100.00,
        "new_price": 110.00,
        "change": 10.00,
        "change_percent": 10.0
      }
    ],
    "summary": {
      "min_change": 5.00,
      "max_change": 50.00,
      "avg_change": 15.75
    }
  }
}
```

**Errors**:
- `403` - Non autorizzato
- `422` - Validazione fallita

---

## Product Unit Types

### GET /unit-types

Lista tutte le unità di misura disponibili.

**Permesso**: Nessuno (endpoint pubblico per utenti autenticati)

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "code": "pz",
      "name": "Pezzo",
      "plural_name": "Pezzi",
      "symbol": "pz",
      "category": "quantity",
      "is_active": true,
      "sort_order": 0
    },
    {
      "id": 2,
      "code": "kg",
      "name": "Chilogrammo",
      "plural_name": "Chilogrammi",
      "symbol": "kg",
      "category": "weight",
      "is_active": true,
      "sort_order": 1
    }
  ]
}
```

**Ordinamento**: Per `category` ASC, poi `sort_order` ASC.

---

### GET /unit-types/category/{category}

Filtra unità di misura per categoria.

**Permesso**: Nessuno (endpoint pubblico per utenti autenticati)

**Path Params**:
- `category` (string) - `quantity` | `weight` | `length` | `area` | `volume` | `time`

**Response**: Come GET /unit-types ma filtrato per categoria.

**Errors**:
- `404` - Categoria non valida o nessuna unità trovata

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
      "code": ["The code has already been taken."],
      "adjustment_value": ["The adjustment value must be a number."]
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

### Calculation Modes
- **automatic**: Items generati automaticamente in base a prodotti e regole del listino
- **manual**: Items inseriti manualmente (non implementato in questa versione)

### Adjustment Types
- **percentage**: Aggiustamento percentuale (es. +15% su cost)
- **fixed**: Aggiustamento fisso in valore assoluto
- **none**: Nessun aggiustamento (prezzo = cost)

### Applies To
- **sale**: Listino per vendite
- **rental**: Listino per noleggi
- **both**: Valido sia per vendite che noleggi

### Priority
Quando più listini sono attivi e applicabili, viene scelto quello con `priority` più bassa (0 = massima priorità).

---

**Versione**: 1.0
**Ultima modifica**: Febbraio 2026
