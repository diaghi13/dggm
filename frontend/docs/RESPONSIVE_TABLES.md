# Tabelle Responsive - Guida

## Ottimizzazioni Mobile Implementate

Le tabelle `DataTable` ora sono completamente ottimizzate per mobile con le seguenti funzionalità:

### 1. Padding e Font Ridotti su Mobile

- **Desktop**: padding normale (pl-6/pr-6), testo sm
- **Mobile**: padding ridotto (pl-3/pr-3), testo xs
- Le righe hanno anche `py-2` su mobile vs `py-3` su desktop

### 2. Scroll Hint

Su mobile (< 1024px) viene mostrato un messaggio "← Scorri per vedere tutte le colonne →" sopra la tabella per indicare all'utente che può scrollare orizzontalmente.

### 3. Paginazione Responsive

- **Desktop**: testo completo ("Precedente", "Successiva", "Mostrando X a Y di Z")
- **Mobile**: testo abbreviato ("Prec", "Succ", "X - Y / Z")
- Layout cambia da row a column su schermi piccoli
- Bottoni paginazione occupano tutta la larghezza su mobile

### 4. Bottoni Controlli Compatti

- "Reset" e "Colonne" mostrano solo icone su mobile (< sm)
- Testo visibile solo su desktop

### 5. Colonne Nascoste Automaticamente su Mobile

Nuova prop `mobileHiddenColumns` per nascondere automaticamente colonne specifiche su mobile.

## Utilizzo Base

```tsx
<DataTable
  columns={columns}
  data={data}
  storageKey="my-table"
  isLoading={isLoading}
/>
```

## Utilizzo con Colonne Nascoste su Mobile

```tsx
<DataTable
  columns={columns}
  data={data}
  storageKey="my-table"
  mobileHiddenColumns={["description", "created_at", "updated_at"]}
  isLoading={isLoading}
/>
```

### Esempio Completo - Tabella Prodotti

```tsx
import { DataTable } from "@/components/shared/data-table/data-table";
import { productsColumns } from "@/components/products/products-columns";

export default function ProductsPage() {
  const { data, isLoading } = useProducts();

  return (
    <DataTable
      columns={productsColumns}
      data={data || []}
      storageKey="products-table"
      // Nascondi colonne secondarie su mobile
      mobileHiddenColumns={[
        "description", // Descrizione troppo lunga
        "supplier", // Info secondaria
        "updated_at", // Timestamp non essenziale
        "unit", // Visibile nel dettaglio
      ]}
      isLoading={isLoading}
      onRowClick={(row) => router.push(`/products/${row.id}`)}
    />
  );
}
```

## Best Practices

### Quali Colonne Nascondere su Mobile?

**Nascondi:**

- ✅ Colonne con testi lunghi (descrizioni, note)
- ✅ Date di creazione/aggiornamento
- ✅ Informazioni secondarie (fornitori, categorie se già visibili altrove)
- ✅ Colonne numeriche secondarie (se ce ne sono tante)

**Mantieni Visibili:**

- ❌ ID o codici (identificativi principali)
- ❌ Nome/Titolo (campo principale)
- ❌ Stato (info critica)
- ❌ Azioni (bottoni di edit/delete)
- ❌ Prezzi o quantità (se tabella di vendita/magazzino)

### Esempio di Colonne da Nascondere per Tipo di Tabella

#### Tabella Clienti

```tsx
mobileHiddenColumns={['address', 'phone', 'email', 'created_at']}
// Mantieni: name, company_name, status, actions
```

#### Tabella Preventivi

```tsx
mobileHiddenColumns={['description', 'customer_contact', 'created_at', 'updated_at']}
// Mantieni: code, customer_name, total, status, actions
```

#### Tabella Prodotti

```tsx
mobileHiddenColumns={['description', 'supplier', 'category', 'unit', 'updated_at']}
// Mantieni: code, name, price, stock, actions
```

#### Tabella Movimenti Magazzino

```tsx
mobileHiddenColumns={['notes', 'supplier', 'created_by', 'created_at']}
// Mantieni: type, product, warehouse, quantity, actions
```

#### Tabella DDT

```tsx
mobileHiddenColumns={['notes', 'from_warehouse', 'to_warehouse', 'created_at']}
// Mantieni: code, site, status, date, actions
```

## Personalizzazione Dimensioni Colonne

Le colonne mantengono le dimensioni definite nel file delle colonne:

```tsx
export const productsColumns: ColumnDef<Product>[] = [
  {
    accessorKey: "code",
    header: "Codice",
    size: 120, // Larghezza in px
  },
  {
    accessorKey: "name",
    header: "Nome",
    size: 250, // Più largo per contenuto principale
  },
  {
    accessorKey: "description",
    header: "Descrizione",
    size: 300,
    // Sarà nascosto su mobile se specificato in mobileHiddenColumns
  },
];
```

## Comportamento Responsive Automatico

### < 640px (sm)

- Testo bottoni nascosto (solo icone)
- Layout paginazione verticale
- Padding minimo celle

### < 1024px (lg)

- Colonne specificate in `mobileHiddenColumns` vengono nascoste
- Scroll hint visibile
- Padding ridotto
- Font size ridotto
- Paginazione compatta

### ≥ 1024px (lg+)

- Tutte le colonne visibili (eccetto quelle nascoste manualmente dall'utente)
- Layout standard
- Padding normale
- Font size normale

## Note Tecniche

- Le preferenze di visibilità colonne salvate dall'utente vengono rispettate anche su mobile
- Il cambio viewport (resize) applica/rimuove automaticamente le colonne mobile nascoste
- Lo scroll orizzontale è sempre disponibile per accedere a colonne extra
- Il resize manuale delle colonne funziona su desktop ma è disabilitato su mobile per UX
