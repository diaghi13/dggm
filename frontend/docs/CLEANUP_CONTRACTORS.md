# Pulizia Legacy Contractor - 14 Gennaio 2026

## Problema Risolto
Durante la build del frontend erano presenti riferimenti a un'implementazione legacy di "Contractor" che causava errori di tipo e confusione nel codebase.

## Analisi
L'applicazione aveva due implementazioni parallele per gestire i fornitori di personale:
1. **Contractor** (legacy - non più utilizzato)
2. **Supplier** con `supplier_type: 'personnel'` (attuale)

### Evidenze che Contractor era legacy:
- Le pagine `/dashboard/contractors/*` facevano solo redirect a `/dashboard/suppliers/*`
- L'API `contractorsApi` non veniva mai importata in nessun file
- Il componente `ContractorForm` non veniva mai utilizzato
- Le colonne `createContractorsColumns` non venivano mai richiamate
- I tipi `Contractor` e `ContractorFormData` erano stati aggiunti durante il fix ma non erano necessari

## File Rimossi
```
✓ /lib/api/contractors.ts - API legacy non utilizzata
✓ /components/contractor-form.tsx - Form non utilizzato (448 righe)
✓ /components/contractors-columns.tsx - Colonne tabella non utilizzate (167 righe)
✓ Tipi Contractor, ContractorType, ContractorFormData da /lib/types/index.ts
```

## File Mantenuti
```
✓ /app/dashboard/contractors/page.tsx - Mantiene redirect a suppliers
✓ /app/dashboard/contractors/[id]/page.tsx - Mantiene redirect a suppliers
✓ ContractorRate in /lib/types/index.ts - Usato da suppliersApi
```

## Implementazione Attuale
L'applicazione usa **Supplier** con tre tipi:
- `supplier_type: 'materials'` - Fornitori di materiali
- `supplier_type: 'personnel'` - Fornitori di personale (ex-contractors)
- `supplier_type: 'both'` - Fornitori misti

## Risultato
✅ Build completata con successo senza errori
✅ Codice più pulito e manutenibile
✅ Eliminata confusione tra Contractor e Supplier
✅ Ridotte ~700 righe di codice inutilizzato

## Note Tecniche
Il tipo `ContractorRate` è stato mantenuto perché:
- È utilizzato dall'API suppliers per gestire le tariffe
- È referenziato nell'interfaccia `Supplier`
- Rappresenta un concetto generico di tariffa applicabile a vari contesti

