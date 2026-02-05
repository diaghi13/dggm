# Card View per Tabelle Mobile - Guida Completa

## Panoramica

Abbiamo implementato un sistema responsive avanzato per le tabelle che su mobile offre:

- **Vista Card** (default): Ogni riga diventa una card collassabile/espandibile
- **Vista Tabella**: Scroll orizzontale ottimizzato con colonne nascoste
- **Toggle UI**: Bottoni per passare tra le due viste

## Come Funziona

### Vista Card

Su schermi < 1024px, le righe della tabella vengono trasformate in **card espandibili**:

- **Header della Card**: Mostra i campi più importanti (configurabili)
- **Dettagli Collassabili**: Altri campi nascosti, espandibili con click
- **Azioni**: Sempre visibili nell'header della card
- **Design**: Gradient con il colore primario dell'utente

### Toggle Vista

Un selettore a due stati permette di scegliere:

- **Cards** (icona griglia) - Default su mobile
- **Tabella** (icona tabella) - Scroll orizzontale

## Utilizzo Base

```tsx
import { DataTable } from "@/components/shared/data-table/data-table";

<DataTable
  columns={columns}
  data={data}
  storageKey="my-table"
  // Abilita card view su mobile (default: true)
  mobileCardView={true}
  // Specifica quali colonne evidenziare in cima alla card
  mobileCardHighlightedColumns={["code", "name", "status"]}
  isLoading={isLoading}
/>;
```

## Props della Card View

| Prop                           | Tipo       | Default | Descrizione                                         |
| ------------------------------ | ---------- | ------- | --------------------------------------------------- |
| `mobileCardView`               | `boolean`  | `true`  | Abilita la vista card su mobile                     |
| `mobileCardHighlightedColumns` | `string[]` | `[]`    | ID delle colonne da mostrare nell'header della card |
| `mobileHiddenColumns`          | `string[]` | `[]`    | Colonne da nascondere in vista tabella mobile       |

## Esempi Pratici

### Tabella Clienti

```tsx
<DataTable
  columns={customersColumns}
  data={customers}
  storageKey="customers-table"
  mobileCardView={true}
  // Header card: Nome azienda e stato
  mobileCardHighlightedColumns={["company_name", "status"]}
  // Nascondi in vista tabella: indirizzo, telefono, date
  mobileHiddenColumns={["address", "phone", "email", "created_at"]}
  onRowClick={(customer) => router.push(`/customers/${customer.id}`)}
/>
```

**Risultato Mobile:**

```
┌────────────────────────────────┐
│ NOME AZIENDA                   │
│ Acme Corporation               │
│                                │
│ STATO                          │
│ 🟢 Attivo                      │
│                                │
│ [Edit] [Delete]  [▼ Dettagli] │
└────────────────────────────────┘
```

### Tabella Prodotti

```tsx
<DataTable
  columns={productsColumns}
  data={products}
  storageKey="products-table"
  mobileCardView={true}
  // Header card: Codice, nome e prezzo
  mobileCardHighlightedColumns={["code", "name", "price"]}
  mobileHiddenColumns={["description", "supplier", "category", "unit"]}
/>
```

**Risultato Mobile:**

```
┌────────────────────────────────┐
│ CODICE                         │
│ PRD-001                        │
│                                │
│ NOME                           │
│ Cemento Portland               │
│                                │
│ PREZZO                         │
│ € 45,00                        │
│                                │
│ [Modifica]         [▼ Dettagli]│
└────────────────────────────────┘
```

### Tabella Preventivi

```tsx
<DataTable
  columns={quotesColumns}
  data={quotes}
  storageKey="quotes-table"
  mobileCardView={true}
  // Header: Codice preventivo, cliente e totale
  mobileCardHighlightedColumns={["code", "customer_name", "total"]}
  mobileHiddenColumns={["description", "created_at", "updated_at", "notes"]}
/>
```

### Tabella DDT

```tsx
<DataTable
  columns={ddtsColumns}
  data={ddts}
  storageKey="ddts-table"
  mobileCardView={true}
  // Header: Codice DDT, cantiere e stato
  mobileCardHighlightedColumns={["code", "site_name", "status"]}
  mobileHiddenColumns={[
    "notes",
    "from_warehouse",
    "to_warehouse",
    "created_at",
  ]}
/>
```

## Best Practices

### Scegliere le Colonne Highlighted

**Includi nell'header della card:**

- ✅ Identificatore principale (codice, nome)
- ✅ Info critica (stato, totale)
- ✅ 2-3 campi massimo (non sovraffollare)
- ✅ Dati brevi e leggibili

**NON includere:**

- ❌ Descrizioni lunghe
- ❌ Più di 3-4 campi
- ❌ Dati tecnici poco importanti
- ❌ Timestamp (meglio nei dettagli)

### Pattern per Tipo di Tabella

#### Anagrafiche (Clienti, Fornitori, Collaboratori)

```tsx
mobileCardHighlightedColumns={['name', 'company', 'status']}
```

#### Documenti (Preventivi, DDT, Fatture)

```tsx
mobileCardHighlightedColumns={['code', 'client', 'total', 'status']}
```

#### Prodotti/Articoli

```tsx
mobileCardHighlightedColumns={['code', 'name', 'price']}
```

#### Movimenti/Transazioni

```tsx
mobileCardHighlightedColumns={['date', 'type', 'amount']}
```

## Card View vs Table View

### Quando usare Card View (default)

- ✅ Molte colonne (>6)
- ✅ Colonne con contenuto lungo
- ✅ Utenti mobile-first
- ✅ Dati con gerarchia chiara (principale + dettagli)

### Quando preferire Table View

- ✅ Poche colonne (≤4)
- ✅ Confronto rapido tra righe
- ✅ Dati numerici da scansionare velocemente
- ✅ Sorting/filtering intensivo

## Disabilitare Card View

Se preferisci solo la vista tabella anche su mobile:

```tsx
<DataTable
  columns={columns}
  data={data}
  storageKey="my-table"
  mobileCardView={false} // Disabilita card view
  mobileHiddenColumns={["col1", "col2"]} // Nascondi colonne invece
/>
```

## Personalizzazione Design

### Colore Primario

La card usa automaticamente il `primaryColor` dall'utente per:

- Gradient sfondo header
- Badge stato attivo
- Testo link

### Stili Card

Il componente usa classi Tailwind standard:

- `Card` da shadcn/ui
- Border/padding responsivi
- Dark mode automatico

## Accessibilità

- ✅ Click area ampia su tutta la card
- ✅ Bottoni azioni con label chiare
- ✅ Expand/collapse con indicatori visivi
- ✅ Focus states su tutti gli elementi interattivi
- ✅ Screen reader friendly (mantiene struttura semantica)

## Performance

- ✅ Rendering ottimizzato (no re-render inutili)
- ✅ Lazy expansion (dettagli caricati solo quando espansi)
- ✅ Virtual scrolling ready (per liste molto lunghe)
- ✅ Paginazione funziona uguale in entrambe le viste

## Risoluzione Problemi

### Le card non appaiono su mobile

- Verifica `mobileCardView={true}` (o ometti, è il default)
- Controlla che lo schermo sia < 1024px
- Verifica che `isMobile` state si aggiorni al resize

### Campi non visibili nell'header

- Controlla che `accessorKey` nelle colonne corrisponda ai nomi in `mobileCardHighlightedColumns`
- Verifica che le colonne esistano effettivamente

### Azioni non funzionano nelle card

- Le colonne `actions` sono riconosciute automaticamente se hanno `id: "actions"`
- Gli eventi click devono usare `stopPropagation()` per evitare conflitti con click sulla card

### Toggle non appare

- Il toggle appare solo su mobile (< 1024px) quando `mobileCardView={true}`
- Su desktop non c'è toggle, sempre vista tabella

## Roadmap Future

Potenziali miglioramenti:

- [ ] Swipe-to-delete sulle card
- [ ] Ordinamento drag-and-drop
- [ ] Filtri contestuali per card
- [ ] Vista compatta con card più piccole
- [ ] Animazioni transizione tra viste
- [ ] Export/print ottimizzato per card view
