# Quote Items Components

Componenti refactorizzati per la gestione delle voci di preventivo con supporto per drag & drop, sezioni annidate e subtotali parziali.

## Struttura

```
quote-items/
├── types.ts                    # Interfacce TypeScript
├── utils.ts                    # Funzioni utility
├── use-drag-and-drop.ts        # Custom hook per il drag & drop
├── sortable-item.tsx           # Componente per singolo item trascinabile
├── item-form-dialog.tsx        # Dialog per creare/modificare item
├── index.tsx                   # Componente principale QuoteItemsBuilder
└── quote-items-builder.tsx     # Barrel export
```

## Componenti

### `QuoteItemsBuilder`
Il componente principale che orchestra tutti i sotto-componenti.

**Props:**
- `items: QuoteItem[]` - Array di voci del preventivo
- `onChange: (items: QuoteItem[]) => void` - Callback chiamato quando gli items cambiano
- `showUnitPrices?: boolean` - Se mostrare i prezzi unitari (default: true)

### `SortableItem`
Componente per la visualizzazione e gestione di un singolo item (voce o sezione).

**Features:**
- Drag & drop per riordinamento
- Supporto per sezioni annidate
- Visualizzazione subtotale parziale per sezioni
- Badge per indicatori (tipo, prezzo nascosto, subtotale)

### `ItemFormDialog`
Dialog per la creazione e modifica di voci/sezioni.

**Features:**
- Autocomplete per materiali dal catalogo
- Selezione sezione parent
- Calcolo automatico totali
- Validazione campi

## Hooks

### `useDragAndDrop`
Custom hook che gestisce tutta la logica del drag & drop.

**Casi gestiti:**
1. Riordino sezioni
2. Inserimento voce in sezione espansa
3. Riordino elementi con stesso parent
4. Estrazione voce da sezione
5. Spostamento tra parent diversi

## Utils

### Funzioni disponibili:
- `flattenItems` - Appiattisce array anidato
- `findItem` - Trova item per ID
- `removeItem` - Rimuove item dalla struttura
- `calculateTotals` - Calcola subtotale, sconto e totale
- `calculateItemTotal` - Calcola totale ricorsivo
- `calculateSectionTotal` - Calcola subtotale di sezione

## Utilizzo

```tsx
import { QuoteItemsBuilder } from '@/components/quote-items/quote-items-builder';

function MyComponent() {
  const [items, setItems] = useState<QuoteItem[]>([]);

  return (
    <QuoteItemsBuilder
      items={items}
      onChange={setItems}
      showUnitPrices={true}
    />
  );
}
```

## Backward Compatibility

Il vecchio import continua a funzionare:

```tsx
import { QuoteItemsBuilder } from '@/components/quote-items-builder';
```

Questo file re-esporta automaticamente dal nuovo percorso.

## Features

- ✅ Drag & drop fluido con feedback visivo
- ✅ Sezioni espandibili/collassabili
- ✅ Subtotali parziali per sezioni
- ✅ Nesting infinito (sezioni dentro sezioni)
- ✅ Autocomplete materiali da catalogo
- ✅ Calcolo automatico totali
- ✅ Sconti percentuali
- ✅ Prezzi nascosti
- ✅ Dark mode support
- ✅ Responsive design
- ✅ TypeScript strict mode

## Refactoring Benefits

Prima: 1 file monolitico da 1000+ righe
Dopo: 7 file modulari e manutenibili

- **Separazione delle responsabilità**: Ogni file ha uno scopo specifico
- **Riusabilità**: I componenti possono essere riutilizzati
- **Testabilità**: Più facile scrivere unit test
- **Manutenibilità**: Più facile trovare e modificare codice
- **Leggibilità**: File più piccoli e focalizzati

