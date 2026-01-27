# Migration Guide: Materials → Products (Frontend)

Guida completa per migrare il frontend da `materials` a `products` dopo il refactoring backend con Spatie Data v4.

## 📋 Indice

1. [Panoramica Cambiamenti](#panoramica-cambiamenti)
2. [API Endpoints](#api-endpoints)
3. [Nomi Campi](#nomi-campi)
4. [Aggiornamento Step-by-Step](#aggiornamento-step-by-step)
5. [Breaking Changes](#breaking-changes)
6. [Backward Compatibility](#backward-compatibility)

---

## Panoramica Cambiamenti

### Backend Changes (Già Completati)

✅ Tabella `materials` → `products`
✅ Tabella `material_components` → `product_components`
✅ Foreign keys `*_material_id` → `*_product_id`
✅ Enum `MaterialType` → `ProductType`
✅ API endpoint `/api/v1/materials` → `/api/v1/products`
✅ DTOs con Spatie Data v4 (ProductData, ProductComponentData)

### Frontend Changes (Da Fare)

- [ ] API client `materials.ts` → `products.ts` ✅ (creato)
- [ ] Import statements da `materialsApi` → `productsApi`
- [ ] Folder `materials/` → `products/`
- [ ] Component names `Material*` → `Product*`
- [ ] Variable names `material` → `product`
- [ ] Field names `component_material_id` → `component_product_id`

---

## API Endpoints

### Mapping Completo

| OLD Endpoint | NEW Endpoint | Descrizione |
|---|---|---|
| `GET /materials` | `GET /products` | Lista prodotti |
| `GET /materials/{id}` | `GET /products/{id}` | Dettaglio prodotto |
| `POST /materials` | `POST /products` | Crea prodotto |
| `PATCH /materials/{id}` | `PATCH /products/{id}` | Aggiorna prodotto |
| `DELETE /materials/{id}` | `DELETE /products/{id}` | Elimina prodotto |
| `GET /materials-needing-reorder` | `GET /products-needing-reorder` | Prodotti da riordinare |
| `GET /materials/{id}/kit-breakdown` | `GET /products/{id}/composite-breakdown` | Breakdown componenti |
| `POST /materials/{id}/calculate-price` | `POST /products/{id}/calculate-price` | Calcola prezzo |
| `POST /materials/{id}/components` | `POST /products/{id}/components` | Aggiungi componente |
| `PATCH /materials/{id}/components/{cid}` | `PATCH /products/{id}/components/{cid}` | Aggiorna componente |
| `DELETE /materials/{id}/components/{cid}` | `DELETE /products/{id}/components/{cid}` | Rimuovi componente |
| `GET /materials/{id}/dependencies` | `GET /products/{id}/dependencies` | Lista dipendenze |
| `POST /materials/{id}/dependencies/calculate` | `POST /products/{id}/dependencies/calculate` | Calcola dipendenze |
| `POST /materials/{id}/dependencies` | `POST /products/{id}/dependencies` | Aggiungi dipendenza |
| `PATCH /materials/{id}/dependencies/{did}` | `PATCH /products/{id}/dependencies/{did}` | Aggiorna dipendenza |
| `DELETE /materials/{id}/dependencies/{did}` | `DELETE /products/{id}/dependencies/{did}` | Rimuovi dipendenza |
| `GET /material-categories` | `GET /products/categories` | Lista categorie |
| `GET /material-dependency-types` | `GET /products/dependency-types` | Tipi dipendenze |

---

## Nomi Campi

### Query Parameters

| OLD | NEW | Note |
|---|---|---|
| `kits=true` | `composites=true` | Filtra prodotti compositi |
| N/A | `product_type=article\|service\|composite` | Nuovo filtro per tipo |

**✅ NON cambiano:**
- `is_active`
- `category`
- `rentable`
- `low_stock`
- `search`
- `semantic_search`
- `sort_field`
- `sort_direction`
- `per_page`

### Request Body Fields

| OLD | NEW | Note |
|---|---|---|
| `component_material_id` | `component_product_id` | ID componente |
| `dependency_material_id` | `dependency_product_id` | ID dipendenza |
| N/A | `product_type: 'article'\|'service'\|'composite'` | Nuovo enum |
| `is_kit` | **RIMOSSO** | Usa `product_type === 'composite'` |

**✅ NON cambiano tutti gli altri campi:**
- `code`, `name`, `description`, `category`
- `unit`, `standard_cost`, `purchase_price`
- `markup_percentage`, `sale_price`
- `rental_price_daily`, `rental_price_weekly`, `rental_price_monthly`
- `barcode`, `qr_code`, `default_supplier_id`
- `reorder_level`, `reorder_quantity`, `lead_time_days`
- `location`, `notes`, `is_rentable`, `is_active`
- `is_package`, `package_weight`, `package_volume`, `package_dimensions`

### Response Fields (ProductData)

**Nuovi campi computed:**
- `calculated_sale_price` (calcolato automaticamente da markup)
- `composite_total_cost` (costo totale componenti)
- `total_stock` (stock totale)
- `available_stock` (stock disponibile - riservato - noleggiato)

**Campo rimosso:**
- `is_kit` → Controlla `product_type === 'composite'`

---

## Aggiornamento Step-by-Step

### Step 1: Aggiornare API Client (✅ Completato)

Creato nuovo file `lib/api/products.ts` con:
- Tutti gli endpoint aggiornati a `/products`
- Parametri aggiornati (`component_product_id`, `composites`, ecc.)
- Export `materialsApi = productsApi` per backward compatibility

### Step 2: Aggiornare Import nelle Pagine

```typescript
// BEFORE
import { materialsApi } from '@/lib/api/materials';

// AFTER
import { productsApi } from '@/lib/api/products';
```

**File da aggiornare:**
- `app/(dashboard)/materials/**/*.tsx`
- Altri file che usano `materialsApi`

### Step 3: Aggiornare Query Keys

```typescript
// BEFORE
const { data } = useQuery({
  queryKey: ['materials', { search, page }],
  queryFn: () => materialsApi.getAll({ search, page }),
});

// AFTER
const { data } = useQuery({
  queryKey: ['products', { search, page }],
  queryFn: () => productsApi.getAll({ search, page }),
});
```

**Importante:** Cambiare tutte le query keys da `materials` a `products` per evitare cache stale.

### Step 4: Aggiornare Mutations

```typescript
// BEFORE
const mutation = useMutation({
  mutationFn: materialsApi.create,
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['materials'] });
  },
});

// AFTER
const mutation = useMutation({
  mutationFn: productsApi.create,
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['products'] });
  },
});
```

### Step 5: Aggiornare Form Data

```typescript
// BEFORE (componente)
const schema = z.object({
  component_material_id: z.number(),
  quantity: z.number(),
});

// AFTER
const schema = z.object({
  component_product_id: z.number(),
  quantity: z.number(),
});
```

```typescript
// BEFORE (parametro query)
const { data } = useQuery({
  queryKey: ['materials', { kits: true }],
  queryFn: () => materialsApi.getAll({ kits: true }),
});

// AFTER
const { data } = useQuery({
  queryKey: ['products', { composites: true }],
  queryFn: () => productsApi.getAll({ composites: true }),
});
```

### Step 6: Rinominare Folder e Files (Opzionale ma Consigliato)

```bash
# Rinomina folder
mv app/(dashboard)/materials app/(dashboard)/products

# Aggiorna route references
# OLD: /dashboard/materials
# NEW: /dashboard/products
```

**File da rinominare:**
- `material-form.tsx` → `product-form.tsx`
- `material-autocomplete.tsx` → `product-autocomplete.tsx`
- `material-kit-components.tsx` → `product-composite-components.tsx`
- `materials-columns.tsx` → `products-columns.tsx`
- Ecc.

### Step 7: Aggiornare Variable Names

```typescript
// BEFORE
const [material, setMaterial] = useState<Material | null>(null);
const materialId = parseInt(params.id);

// AFTER
const [product, setProduct] = useState<Product | null>(null);
const productId = parseInt(params.id);
```

### Step 8: Aggiornare TypeScript Types

```typescript
// lib/types/index.ts

// BEFORE
export interface Material {
  id: number;
  code: string;
  name: string;
  is_kit: boolean;
  // ...
}

// AFTER
export interface Product {
  id: number;
  code: string;
  name: string;
  product_type: 'article' | 'service' | 'composite';
  calculated_sale_price: number;  // NEW
  composite_total_cost: number;   // NEW
  total_stock: number;            // NEW
  available_stock: number;        // NEW
  // ...
}

// Enum
export type ProductType = 'article' | 'service' | 'composite';
```

---

## Breaking Changes

### 1. `is_kit` → `product_type`

```typescript
// ❌ BEFORE
if (material.is_kit) {
  // Show components
}

// ✅ AFTER
if (product.product_type === 'composite') {
  // Show components
}
```

### 2. `kit-breakdown` → `composite-breakdown`

```typescript
// ❌ BEFORE
const breakdown = await materialsApi.getKitBreakdown(id);

// ✅ AFTER
const breakdown = await productsApi.getCompositeBreakdown(id);
```

### 3. `component_material_id` → `component_product_id`

```typescript
// ❌ BEFORE
await materialsApi.addComponent(materialId, {
  component_material_id: 123,
  quantity: 5,
});

// ✅ AFTER
await productsApi.addComponent(productId, {
  component_product_id: 123,
  quantity: 5,
});
```

### 4. Query Parameter `kits` → `composites`

```typescript
// ❌ BEFORE
const { data } = useQuery({
  queryFn: () => materialsApi.getAll({ kits: true }),
});

// ✅ AFTER
const { data } = useQuery({
  queryFn: () => productsApi.getAll({ composites: true }),
});
```

### 5. Nuovi Computed Fields

```typescript
// ✅ NEW - Disponibili automaticamente
product.calculated_sale_price  // Prezzo calcolato da markup
product.composite_total_cost   // Costo totale componenti
product.total_stock           // Stock totale
product.available_stock       // Stock disponibile
```

---

## Backward Compatibility

### Temporary Alias (Per Graduale Migration)

Il nuovo file `products.ts` include:

```typescript
// Keep old materialsApi for backward compatibility (deprecated)
export const materialsApi = productsApi;
```

Questo permette di:
1. Aggiornare gradualmente i file
2. Non rompere il codice esistente immediatamente
3. Deprecare `materialsApi` nel tempo

### Migration Graduale

**Fase 1:** ✅ Backend aggiornato (già fatto)
**Fase 2:** ✅ API client creato (già fatto)
**Fase 3:** Aggiornare import uno alla volta
**Fase 4:** Rinominare folder/files
**Fase 5:** Rimuovere `materialsApi` alias

---

## Checklist Completa

### Backend (✅ Completato)
- [x] Migration tabelle
- [x] Model relationships aggiornate
- [x] Service layer aggiornato
- [x] Controller aggiornato
- [x] Routes aggiornate
- [x] Tests passanti

### Frontend (Da Fare)
- [x] Nuovo API client `products.ts` creato
- [ ] Aggiornare import `materialsApi` → `productsApi`
- [ ] Aggiornare query keys `materials` → `products`
- [ ] Aggiornare mutations
- [ ] Aggiornare form schemas
- [ ] Aggiornare field names (`component_material_id` → `component_product_id`)
- [ ] Aggiornare parametri query (`kits` → `composites`)
- [ ] Aggiornare TypeScript types
- [ ] Rinominare folder `materials/` → `products/`
- [ ] Rinominare components `Material*` → `Product*`
- [ ] Aggiornare variable names
- [ ] Testare tutte le funzionalità

### Testing (Dopo Migration)
- [ ] Lista prodotti carica correttamente
- [ ] Dettaglio prodotto funziona
- [ ] Create/Update funzionano
- [ ] Componenti compositi funzionano
- [ ] Dipendenze funzionano
- [ ] Filtri funzionano (composites, search, ecc.)
- [ ] Paginazione funziona
- [ ] Dark mode funziona

---

## Quick Reference

### Import Change

```typescript
import { materialsApi } from '@/lib/api/materials';  // ❌ OLD
import { productsApi } from '@/lib/api/products';     // ✅ NEW
```

### Query Key Change

```typescript
queryKey: ['materials', id]    // ❌ OLD
queryKey: ['products', id]     // ✅ NEW
```

### Field Name Changes

```typescript
component_material_id          // ❌ OLD
component_product_id           // ✅ NEW

dependency_material_id         // ❌ OLD
dependency_product_id          // ✅ NEW

kits: true                     // ❌ OLD
composites: true               // ✅ NEW

is_kit                         // ❌ OLD
product_type === 'composite'   // ✅ NEW
```

### Endpoint Changes

```typescript
/materials                     // ❌ OLD
/products                      // ✅ NEW

/materials/{id}/kit-breakdown           // ❌ OLD
/products/{id}/composite-breakdown      // ✅ NEW
```

---

**Status:** 🚀 Backend completato, Frontend in progress
**Last Updated:** 20 Gennaio 2025
**Autore:** Team DGGM
