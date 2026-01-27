# 📦 Warehouse Module - Quick Start Guide

**Status**: ✅ Analisi Completa - Pronto per Implementazione  
**Tempo Stimato**: 32-44 ore (5 giorni)  
**Prossimo Step**: Fase 1 - Fix Models (30 min)  

---

## 🎯 COSA FARE ADESSO

### 1. LEGGI (30 minuti)
In ordine:
1. ✅ **Questo documento** (5 min) - Overview veloce
2. ✅ **WAREHOUSE_ANALISI_FINALE.md** (15 min) - Analisi completa in italiano
3. ✅ **AI_ARCHITECTURE_RULES.md** (10 min) - Regole architetturali OBBLIGATORIE

### 2. INIZIA FASE 1 (30 minuti)
```bash
cd /Users/davidedonghi/Apps/dggm/backend

# 1. Apri StockMovement.php
code app/Models/StockMovement.php

# 2. Cambia:
#    'material_id' → 'product_id' in fillable
#    material() → product() relationship
#    Material::class → Product::class

# 3. Ripeti per DdtItem.php
code app/Models/DdtItem.php

# 4. Test
php artisan tinker
>>> StockMovement::with('product')->first();
```

---

## 📋 10 FASI (Riepilogo Ultra-Veloce)

| # | Fase | Tempo | Deliverable |
|---|------|-------|-------------|
| 1 | Fix Models | 2-3h | 4 models con Product |
| 2 | DTOs | 3-4h | 4 DTOs + TS types |
| 3 | Events & Listeners | 5-6h | 10 events + 10 listeners 🔥 |
| 4 | Query Classes | 3-4h | 12 Query Classes |
| 5 | Actions | 6-8h | 10 Actions |
| 6 | Services | 2-3h | Services puliti |
| 7 | Controllers | 3-4h | 3 Controllers aggiornati |
| 8 | Backend Tests | 4-6h | 25+ tests passing |
| 9 | Frontend | 8-12h | 8 pages + 15 components |
| 10 | Frontend Tests | 2-3h | 15+ tests passing |

**Totale**: 32-44h

---

## 🔥 3 LISTENER CRITICI

### 1. GenerateStockMovementsListener (400 LOC)
**Ascolta**: `DdtConfirmed`  
**Fa**: Crea movimenti stock (intake, output, transfer, rental, return)  
**Importanza**: ⭐⭐⭐⭐⭐ (business logic principale)

### 2. ReverseStockMovementsListener (200 LOC)
**Ascolta**: `DdtCancelled`  
**Fa**: Storna tutti i movimenti del DDT  
**Importanza**: ⭐⭐⭐⭐⭐ (deve ripristinare perfettamente)

### 3. UpdateSiteMaterialsListener (100 LOC)
**Ascolta**: `DdtDelivered`  
**Fa**: Aggiorna site_materials per DDT outgoing  
**Importanza**: ⭐⭐⭐⭐ (sincronizza inventory cantiere)

---

## 🗓️ SCHEDULE 5 GIORNI

### Giorno 1 (8h) - Backend Foundation
- **AM**: Fase 1 + 2 (Models + DTOs)
- **PM**: Fase 3 Start (Events)

### Giorno 2 (8h) - Backend Core
- **AM**: Fase 3 Finish (Listeners) ← **PIÙ IMPORTANTE**
- **PM**: Fase 4 (Query Classes)

### Giorno 3 (8h) - Backend Actions
- **AM**: Fase 5 Start (Actions)
- **PM**: Fase 5 Finish (DDT Actions)

### Giorno 4 (8h) - Backend Complete + Tests
- **AM**: Fase 6 + 7 (Services + Controllers)
- **PM**: Fase 8 (Backend Testing)

### Giorno 5 (8h) - Frontend
- **AM**: Fase 9 (Pages + Components)
- **PM**: Fase 9 Finish + Fase 10 (Frontend Tests)

---

## ✅ DECISIONI CONFERMATE

1. **Strategia**: Backend → Testing → Frontend ✅
2. **DDT Edit**: Solo Draft modificabile ✅
3. **Event-Driven**: Tutti moduli comunicano via Eventi ✅
4. **Query Classes**: Per tutte le letture complesse ✅
5. **10 Eventi**: Per audit trail completo ✅

---

## ⚠️ REGOLE IMPORTANTI

### ❌ NON FARE:
- FormRequest (usa Spatie Data DTOs)
- Resource classes (usa Spatie Data DTOs)
- DB operations nei Services
- Chiamare Actions da Actions
- Chiamare Listeners da Actions (dispatcha Events)
- Usare Material model

### ✅ FARE:
- Spatie Data per input + output
- Actions per write operations
- Query Classes per read complesse
- Events + Listeners per comunicazione
- DB::transaction() in tutte le Actions
- Dispatchare Eventi da Actions
- Usare Product model ovunque

---

## 📚 DOCUMENTI CREATI

1. **WAREHOUSE_ANALISI_FINALE.md** (LEGGI PRIMA) 🇮🇹
   - Analisi completa in italiano
   - Spiegazione listener critici
   - Primo task guidato

2. **WAREHOUSE_IMPLEMENTATION_ROADMAP.md** 🗺️
   - Piano esecutivo
   - Schedule dettagliato
   - Success metrics

3. **WAREHOUSE_MODULE_REFACTOR_CHECKLIST.md** 📋
   - Task dettagliati con codice
   - 120+ task da completare
   - Pattern ed esempi

4. **TODO.md** (aggiornato) ✅
   - Status modulo Warehouse
   - Link a documenti

---

## 🚀 INIZIA ORA

```bash
cd /Users/davidedonghi/Apps/dggm

# 1. Leggi documenti (30 min)
open WAREHOUSE_ANALISI_FINALE.md
open backend/AI_ARCHITECTURE_RULES.md

# 2. Crea branch
git checkout -b feature/warehouse-event-driven-refactor

# 3. Inizia Fase 1
cd backend
code app/Models/StockMovement.php

# Fix: material_id → product_id
# Test: php artisan tinker
```

---

## 📊 PROGRESSO

### Overall: 0% ❌

| Fase | Status | Files | Tests |
|------|--------|-------|-------|
| 1. Models | ❌ | 0/4 | - |
| 2. DTOs | ❌ | 0/4 | - |
| 3. Events & Listeners | ❌ | 0/20 | - |
| 4. Query Classes | ❌ | 0/12 | - |
| 5. Actions | ❌ | 0/10 | - |
| 6. Services | ❌ | 0/2 | - |
| 7. Controllers | ❌ | 0/3 | - |
| 8. Backend Tests | ❌ | 0/25+ | 0/25+ |
| 9. Frontend | ❌ | 0/30+ | - |
| 10. Frontend Tests | ❌ | 0/15+ | 0/15+ |

---

## 🎉 RISULTATO FINALE

Dopo 5 giorni avrai:

✅ **Backend**:
- Architettura event-driven
- 4 DTOs + TS types
- 10 Events + 10 Listeners
- 12 Query Classes
- 10 Actions
- Services puliti
- Controllers moderni
- 25+ tests passing

✅ **Frontend**:
- 8 pages funzionanti
- 15 components
- 3 API clients
- Dark mode
- 15+ tests passing

✅ **Qualità**:
- 100% architecture compliance
- 100% type safety
- 80%+ code coverage
- Zero errors
- Performance ottimizzata

---

**Created**: 23 Gennaio 2026  
**Next**: Leggi WAREHOUSE_ANALISI_FINALE.md (15 min) → Inizia Fase 1 (30 min)  
**GO!** 🚀
