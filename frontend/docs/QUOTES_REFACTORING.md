# Refactoring Sistema Preventivi - Riepilogo Modifiche

## Data: 10 Febbraio 2026

## Panoramica

È stato completato un refactoring completo del sistema di gestione dei preventivi (quotes) per allinearlo con le nuove API del backend e migliorare l'esperienza utente.

## Modifiche Principali

### 1. Aggiornamento Tipi TypeScript (`lib/types/index.ts`)

- ✅ Aggiornati i tipi `Quote`, `QuoteItem` e `QuoteFormData` in base a `generated.d.ts`
- ✅ Aggiunti tutti i nuovi campi dal backend:
  - `price_list_id`, `payment_term_id`, `warranty_type_id`, `template_id`
  - `deposit_percentage`, `deposit_amount`
  - `work_start_description`, `work_start_date`, `work_duration_description`, `work_end_date`
  - `show_vat`, `vat_included_in_prices`, `include_terms_and_conditions`
  - `vat_rate`, `vat_amount`, `total_with_vat` per gli items
  - `hide_unit_price`, `include_image` per gli items
  - Relazioni: `product`, `priceListItem`, `parent`, `children`

### 2. API Client (`lib/api/quotes.ts`)

- ✅ Aggiunti nuovi endpoint:
  - `approve(id)` - Approva preventivo
  - `reject(id)` - Rifiuta preventivo
  - `send(id)` - Invia preventivo al cliente
  - `convertToSite(id)` - Converti preventivo in cantiere
  - `savePdf(id)` - Genera e salva PDF
- ✅ Aggiornati parametri di ricerca:
  - `project_manager_id`
  - `from_date`, `to_date`

### 3. Hook `use-unsaved-changes` (`hooks/use-unsaved-changes.ts`)

- ✅ Nuovo hook per gestire le modifiche non salvate
- ✅ Previene chiusura browser/tab con modifiche pendenti
- ✅ Mostra conferma prima della navigazione
- ✅ Funzioni:
  - `confirmNavigation()` - Conferma se l'utente può navigare
  - `navigateWithConfirm(path)` - Naviga con conferma automatica

### 4. Pagina Creazione `/quotes/new` (NUOVA)

- ✅ Nuova pagina dedicata per la creazione completa dei preventivi
- ✅ Form strutturato in 5 tab:
  1. **Generale**: Informazioni base, cliente, indirizzo, date
  2. **Voci**: Builder per gestire le voci del preventivo
  3. **Dati Finanziari**: Listino prezzi, sconti, IVA, acconto, note
  4. **Lavori**: Date e descrizioni dei lavori
  5. **Impostazioni**: Flag di visualizzazione per PDF
- ✅ Guard per modifiche non salvate
- ✅ Validazione campi obbligatori (titolo, cliente)
- ✅ Redirect automatico alla pagina di dettaglio dopo creazione

### 5. Pagina Dettaglio `/quotes/[id]` (REFACTORED)

- ✅ Completamente riscritta con nuova struttura
- ✅ Due modalità:
  - **Visualizzazione**: Tab con dettagli e anteprima PDF
  - **Modifica**: Form completo con tutti i campi (come /new)
- ✅ Guard per modifiche non salvate in modalità modifica
- ✅ Pulsanti azione basati sullo stato:
  - `draft` → Invia
  - `sent` → Approva/Rifiuta
  - `approved` → Converti in Cantiere (se non già convertito)
- ✅ Badge per stato e cantiere collegato
- ✅ Conferma prima di lasciare pagina con modifiche

### 6. Pagina Lista `/quotes` (UPDATED)

- ✅ Rimossi dialog modali per creazione/modifica
- ✅ Pulsante "Nuovo Preventivo" naviga a `/quotes/new`
- ✅ Click su riga naviga a `/quotes/[id]`
- ✅ Mantenuto solo il dialog di eliminazione
- ✅ Rimossi stati e mutation non utilizzati

### 7. Workflow Preventivi

Il nuovo sistema supporta il seguente workflow:

```
draft → sent → approved → converted
             ↓
           rejected
             ↓
           expired
```

#### Azioni disponibili per stato:

- **draft**: Modifica, Invia, Elimina
- **sent**: Modifica, Approva, Rifiuta, PDF
- **approved**: Modifica, Converti in Cantiere, PDF
- **rejected**: Visualizza, PDF
- **expired**: Visualizza, PDF
- **converted**: Visualizza, PDF, Link al Cantiere

## API Endpoints Utilizzati

### Gestione Base

- `GET /api/v1/quotes` - Lista preventivi con filtri
- `GET /api/v1/quotes/{id}` - Dettaglio preventivo
- `POST /api/v1/quotes` - Crea preventivo
- `PUT /api/v1/quotes/{id}` - Aggiorna preventivo
- `DELETE /api/v1/quotes/{id}` - Elimina preventivo

### Cambio Stato

- `PATCH /api/v1/quotes/{id}/status` - Cambio stato generico
- `POST /api/v1/quotes/{id}/approve` - Approva
- `POST /api/v1/quotes/{id}/reject` - Rifiuta
- `POST /api/v1/quotes/{id}/send` - Invia

### Funzionalità Avanzate

- `POST /api/v1/quotes/{id}/convert-to-site` - Converti in cantiere
- `POST /api/v1/quotes/{id}/save-pdf` - Genera e salva PDF
- `GET /api/v1/quotes/{id}/pdf/download` - Scarica PDF
- `GET /api/v1/quotes/{id}/pdf/preview` - Anteprima PDF

### Media

- `POST /api/v1/media/quotes/{id}` - Upload allegati
- `GET /api/v1/media/{id}/download` - Scarica allegato
- `DELETE /api/v1/media/{id}` - Elimina allegato

## File Modificati

```
lib/types/index.ts                                    - Tipi aggiornati
lib/api/quotes.ts                                     - API client completo
hooks/use-unsaved-changes.ts                          - Nuovo hook (NUOVO)
app/(dashboard)/quotes/new/page.tsx                   - Pagina creazione (NUOVO)
app/(dashboard)/quotes/[id]/page.tsx                  - Pagina dettaglio (REFACTORED)
app/(dashboard)/quotes/page.tsx                       - Pagina lista (UPDATED)
app/(dashboard)/quotes/[id]/page.old.tsx              - Backup vecchia versione
```

## Features Implementate

### 1. Guard Modifiche Non Salvate

- ✅ Alert browser al tentativo di chiusura
- ✅ Conferma prima della navigazione
- ✅ Messaggi personalizzati per contesto
- ✅ Funziona sia in creazione che in modifica

### 2. Form Completo Preventivi

- ✅ Tutti i campi del backend disponibili
- ✅ Struttura a tab per organizzazione
- ✅ Validazione lato client
- ✅ Stati coerenti con backend

### 3. Gestione Workflow

- ✅ Transizioni di stato controllate
- ✅ Azioni disponibili in base allo stato
- ✅ Integrazione con cantieri
- ✅ Generazione e gestione PDF

### 4. UX Migliorata

- ✅ Pagina dedicata per creazione (non più modal)
- ✅ Form esteso con tutte le opzioni
- ✅ Navigazione fluida tra liste e dettagli
- ✅ Feedback visivo per ogni azione
- ✅ Loading states appropriati

## Compatibilità

- ✅ **TypeScript**: Tutti i tipi aggiornati e validati
- ✅ **React Query**: Cache invalidation corretta
- ✅ **Next.js 15**: App Router utilizzato
- ✅ **UI Components**: Shadcn/ui components
- ✅ **Backend API**: Allineato con Laravel 12

## Note per Sviluppi Futuri

### Da Implementare

1. **QuoteItemsBuilder**: Verificare che supporti tutti i nuovi campi degli item
2. **Template Preventivi**: Implementare selezione e applicazione template
3. **Payment Terms**: Creare API e UI per gestione termini di pagamento
4. **Warranty Types**: Creare API e UI per gestione tipi di garanzia
5. **Email**: Implementare invio email quando status → sent

### Ottimizzazioni Possibili

1. **Caching**: Implementare cache più aggressiva per price lists
2. **Validazione**: Aggiungere validazione backend-side più dettagliata
3. **PDF**: Migliorare preview con lazy loading
4. **Mobile**: Ottimizzare layout per dispositivi mobili

## Testing

### Test Manuali da Eseguire

- [ ] Creazione nuovo preventivo con tutti i campi
- [ ] Modifica preventivo esistente
- [ ] Guard modifiche non salvate (refresh, back, navigazione)
- [ ] Cambio stato: draft → sent → approved
- [ ] Conversione preventivo approvato in cantiere
- [ ] Download e preview PDF
- [ ] Eliminazione preventivo
- [ ] Filtri e ricerca nella lista
- [ ] Paginazione

### Casi Edge da Verificare

- [ ] Preventivo senza items
- [ ] Preventivo con sconti a 0
- [ ] Preventivo con IVA custom
- [ ] Navigazione con modifiche non salvate
- [ ] Errori di rete durante salvataggio

## Conclusioni

Il sistema preventivi è stato completamente refactorato per:

1. ✅ Supportare tutte le funzionalità del backend
2. ✅ Migliorare significativamente l'UX
3. ✅ Prevenire perdita di dati
4. ✅ Gestire workflow completo
5. ✅ Preparare per funzionalità future

Il sistema è ora pronto per essere testato e deployato in staging.
