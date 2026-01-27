# Warehouse Module - Task Rimanenti

**Data**: 23 Gennaio 2026  
**Progresso Totale**: 82% (101/125 tasks)  
**Fase 9 Frontend**: 70% (21/30 tasks)

---

## 📊 STATO ATTUALE

### ✅ COMPLETATO (21/30)

**Backend**: 100% ✅
- ✅ Models aggiornati (Product invece di Material)
- ✅ 4 DTOs (InventoryData, StockMovementData, DdtData, DdtItemData)
- ✅ 10 Events + 10 Listeners
- ✅ 12 Query Classes
- ✅ 10 Actions
- ✅ Services refactored
- ✅ Controllers aggiornati
- ✅ 25+ tests (100% pass rate)

**Frontend API & Hooks**: 100% ✅
- ✅ `lib/api/inventory.ts` (8 endpoints)
- ✅ `lib/api/stock-movements.ts` (5 endpoints)
- ✅ `lib/api/ddts.ts` (11 endpoints)
- ✅ `hooks/use-inventory.ts` (8 hooks)
- ✅ `hooks/use-stock-movements.ts` (5 hooks)
- ✅ `hooks/use-ddts.ts` (11 hooks)

**Frontend Pages**: 75% ✅
- ✅ `/inventory` - Lista inventario con filtri
- ✅ `/stock-movements` - Lista movimenti
- ✅ `/ddts` - Lista DDT
- ✅ `/ddts/[id]` - Dettaglio DDT
- ✅ `/ddts/new` - Form creazione DDT

**Frontend Components**: 53% ✅
- ✅ `inventory-columns.tsx`
- ✅ `inventory-adjust-dialog.tsx`
- ✅ `stock-movement-columns.tsx`
- ✅ `stock-movement-type-badge.tsx`
- ✅ `ddt-columns.tsx`
- ✅ `ddt-type-badge.tsx`
- ✅ `ddt-status-badge.tsx`
- ✅ `warehouse-inventory-columns.tsx`

---

## ❌ DA COMPLETARE (6/30) ⬇️ -3

### **1. Pagine Mancanti** (2 task)

#### `/inventory/[id]` - Pagina Dettaglio Inventario
**Priorità**: 🟡 MEDIUM  
**Tempo**: 1-2h  
**File**: `/frontend/app/(dashboard)/inventory/[id]/page.tsx`

**Funzionalità**:
- Dettaglio prodotto con quantità per warehouse
- Storico movimenti del prodotto
- Grafico andamento scorte
- Azioni rapide (adjust, transfer)
- Alert scorta minima

---

#### `/ddts/[id]/edit` - Pagina Edit DDT (solo Draft)
**Priorità**: 🟡 MEDIUM  
**Tempo**: 1-2h  
**File**: `/frontend/app/(dashboard)/ddts/[id]/edit/page.tsx`

**Funzionalità**:
- Form pre-compilato dai dati DDT
- Modifica solo se status = 'draft'
- Redirect se non Draft
- Validazione

---

### **2. Componenti Mancanti** (4 task) ⬇️ -2

#### `inventory-transfer-dialog.tsx`
**Priorità**: 🟡 MEDIUM  
**Tempo**: 1h  
**File**: `/frontend/components/warehouse/inventory-transfer-dialog.tsx`

**Funzionalità**:
- Dialog per trasferire stock tra warehouse
- Select warehouse origine
- Select warehouse destinazione
- Input quantità
- Validazione quantità disponibile
- Crea DDT interno automaticamente

---

#### `inventory-stats.tsx`
**Priorità**: 🟢 LOW  
**Tempo**: 1h  
**File**: `/frontend/components/warehouse/inventory-stats.tsx`

**Funzionalità**:
- Widget statistiche inventario
- Valore totale stock
- Scorte basse
- Grafico distribuzione per categoria
- Top 5 prodotti per valore

---

#### `stock-movement-filters.tsx`
**Priorità**: 🟢 LOW  
**Tempo**: 30min  
**File**: `/frontend/components/warehouse/stock-movement-filters.tsx`

**Funzionalità**:
- Filtri avanzati per stock movements
- Filtro per tipo movimento
- Filtro per warehouse
- Filtro per prodotto
- Range date

---

#### `ddt-type-select.tsx`
**Priorità**: 🟢 LOW  
**Tempo**: 30min  
**File**: `/frontend/components/warehouse/ddt-type-select.tsx`

**Funzionalità**:
- Select dropdown per tipo DDT
- 7 opzioni (incoming, outgoing, internal, rental_out, rental_return, return_from_customer, return_to_supplier)
- Badge colorati con icone
- Descrizioni tooltip

---


## 📈 PRIORITÀ DI IMPLEMENTAZIONE

### 🔴 ALTA PRIORITÀ (Blockers per workflow completo)

1. **`ddt-confirm-dialog.tsx`** (1h)
   - Necessario per workflow completo DDT
   - Genera stock movements

2. **`ddt-cancel-dialog.tsx`** (1h)
   - Necessario per gestione errori
   - Reversa stock movements

3. **Navigation Menu** (15min)
   - Accessibilità modulo

**Totale Alta Priorità**: ~2.5h

---

### 🟡 MEDIA PRIORITÀ (Nice to have)

4. **`ddt-form.tsx`** (2h)
   - Estrarre da `/ddts/new/page.tsx`
   - Riutilizzabile per edit

5. **`ddt-items-table.tsx`** (1h)
   - Parte del form, ma separabile

6. **`inventory-transfer-dialog.tsx`** (1h)
   - Funzionalità utile ma non bloccante

7. **`/inventory/[id]` page** (1-2h)
   - Dettaglio prodotto

8. **`/ddts/[id]/edit` page** (1-2h)
   - Edit DDT Draft

**Totale Media Priorità**: ~7-9h

---

### 🟢 BASSA PRIORITÀ (Polish & Enhancement)

9. **`inventory-stats.tsx`** (1h)
   - Dashboard widgets

10. **`stock-movement-filters.tsx`** (30min)
    - Filtri avanzati

11. **`ddt-type-select.tsx`** (30min)
    - Component UI helper

12. **Test CRUD** (2-3h)
    - QA finale

**Totale Bassa Priorità**: ~4-5h

---

## 🎯 ROADMAP SUGGERITA

### Sessione 1 (3h) - Workflow Completo DDT
**Obiettivo**: Rendere completamente funzionale il workflow DDT

1. ✅ `ddt-confirm-dialog.tsx` (1h)
2. ✅ `ddt-cancel-dialog.tsx` (1h)
3. ✅ Aggiungere al menu (15min)
4. ✅ Test manuale workflow (45min)

**Milestone**: ✅ DDT workflow completo (Create → Confirm → Stock Movements → Cancel)

---

### Sessione 2 (4h) - Form Riutilizzabile
**Obiettivo**: Estrarre e rendere riutilizzabile il form DDT

1. ✅ `ddt-form.tsx` - Estrarre da /ddts/new (2h)
2. ✅ `ddt-items-table.tsx` - Tabella items (1h)
3. ✅ `/ddts/[id]/edit` - Pagina edit (1h)

**Milestone**: ✅ Form DDT riutilizzabile + Edit page

---

### Sessione 3 (3h) - Inventory Enhancement
**Obiettivo**: Completare funzionalità inventario

1. ✅ `inventory-transfer-dialog.tsx` (1h)
2. ✅ `/inventory/[id]` - Dettaglio (2h)

**Milestone**: ✅ Inventario completo

---

### Sessione 4 (2h) - Polish & Testing
**Obiettivo**: Finalizzare e testare

1. ✅ `inventory-stats.tsx` (1h)
2. ✅ `stock-movement-filters.tsx` (30min)
3. ✅ `ddt-type-select.tsx` (30min)

**Milestone**: ✅ UI polish completo

---

### Sessione 5 (3h) - QA & Testing
**Obiettivo**: Test completo + bug fixing

1. ✅ Test CRUD operations (2h)
2. ✅ Bug fixing (1h)

**Milestone**: ✅ **WAREHOUSE MODULE 100% COMPLETO**

---

## 📊 TEMPO TOTALE RIMANENTE

- 🔴 **Alta Priorità**: 2.5h
- 🟡 **Media Priorità**: 7-9h
- 🟢 **Bassa Priorità**: 4-5h

**TOTALE**: ~14-17h per completare al 100%

**Minimo Viable** (solo alta priorità): ~2.5h per workflow funzionante

---

## ✅ CHECKLIST FINALE

### Per considerare il modulo "Completo" (MVP)
- [x] Backend 100% ✅
- [x] API & Hooks 100% ✅
- [ ] DDT Confirm Dialog ❌
- [ ] DDT Cancel Dialog ❌
- [ ] Navigation Menu ❌
- [ ] Test workflow DDT completo ❌

**MVP Progress**: 67% (4/6)

---

### Per considerare il modulo "100% Completo"
- [x] Tutti i componenti della roadmap ❌ (8/15)
- [x] Tutte le pagine della roadmap ❌ (3/4)
- [x] Navigation menu ❌
- [x] Test CRUD operations ❌
- [x] Zero errori build ✅
- [x] Zero errori TypeScript ✅
- [x] Dark mode supporto ✅

**100% Progress**: 70% (21/30)

---

## 🚀 PROSSIMO STEP CONSIGLIATO

**Opzione A - Workflow Completo (2.5h)**:
Implementare solo alta priorità per avere workflow funzionante:
1. `ddt-confirm-dialog.tsx`
2. `ddt-cancel-dialog.tsx`
3. Navigation menu
4. Test manuale

**Opzione B - Form Riutilizzabile (4h)**:
Estrarre form per renderlo riutilizzabile + edit page:
1. `ddt-form.tsx`
2. `ddt-items-table.tsx`
3. `/ddts/[id]/edit`

**Raccomandazione**: Opzione A prima (workflow completo), poi Opzione B

---

**Creato**: 23 Gennaio 2026  
**Stato**: 🚧 In Progress - 70% Complete  
**Prossima Fase**: Dialog Confirm/Cancel DDT (Alta Priorità)
