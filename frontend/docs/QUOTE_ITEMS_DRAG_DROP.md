# Quote Items Builder - Drag & Drop

## Come funziona il Drag & Drop gerarchico

Il componente `QuoteItemsBuilder` supporta il drag & drop gerarchico tra **Sezioni** e **Voci**.

### Funzionalità Implementate

#### 1. **Trascinare una Voce dentro una Sezione** ✅
- Trascina una voce sopra una sezione (elemento con icona cartella blu)
- La voce diventa automaticamente un figlio della sezione
- La sezione si espande automaticamente per mostrare il nuovo elemento

#### 2. **Trascinare una Voce fuori da una Sezione** ✅
- Trascina una voce da dentro una sezione sopra un'altra voce al livello root
- La voce viene estratta dalla sezione e posizionata allo stesso livello dell'elemento target
- Se trascini sopra un'altra sezione, la voce viene spostata in quella sezione

#### 3. **Riordinare Voci dentro una Sezione** ✅
- All'interno di una sezione espansa, trascina le voci per riordinarle
- Le voci mantengono il loro parent (la sezione)

#### 4. **Riordinare Sezioni** ✅
- Trascina una sezione sopra un'altra sezione per riordinarle
- Le sezioni non possono essere inserite dentro altre sezioni

#### 5. **Riordinare Voci al Root Level** ✅
- Trascina voci al livello principale per riordinarle
- Le voci mantengono `parent_id: null`

### Visual Feedback

- **Sezione target**: Quando trascini una voce sopra una sezione, il bordo diventa blu e lo sfondo cambia
- **Opacità durante drag**: L'elemento trascinato diventa semi-trasparente (50%)
- **Hover**: Gli elementi mostrano un bordo blu al passaggio del mouse

### Struttura Dati

```typescript
interface QuoteItem {
  id: number;
  parent_id: number | null;  // null = root level, number = dentro una sezione
  type: 'section' | 'item';
  children?: QuoteItem[];     // Solo per le sezioni
  // ... altri campi
}
```

### Regole di Business

1. **Sezioni non possono contenere altre sezioni**
   - Solo le voci possono essere figlie di sezioni
   
2. **Le voci possono essere sia al root level che dentro sezioni**
   - `parent_id: null` → root level
   - `parent_id: <section_id>` → dentro una sezione

3. **Il drag mantiene la coerenza dei dati**
   - Quando sposti una voce, il `parent_id` viene aggiornato automaticamente
   - Le sezioni espanse mostrano automaticamente i nuovi elementi

### Come Testare

1. **Test Base**: Crea una sezione e alcune voci
2. **Test Drag into Section**: Trascina una voce sopra la sezione → la voce dovrebbe apparire dentro
3. **Test Drag out of Section**: Espandi la sezione, trascina una voce fuori → la voce torna al root level
4. **Test Reorder**: Trascina elementi per riordinarli sia al root level che dentro le sezioni
5. **Test Multiple Sections**: Crea più sezioni e sposta voci tra di esse

### Problemi Noti / TODO

- [ ] Aggiungere un DragOverlay per mostrare una preview dell'elemento durante il drag
- [ ] Aggiungere animazioni più fluide
- [ ] Supportare il drag di multiple voci contemporaneamente
- [ ] Aggiungere un bottone per "estrarre tutte le voci" da una sezione

### Algoritmo di Drag & Drop

Il componente usa `@dnd-kit` con le seguenti strategie:

1. **`pointerWithin`**: Collision detection che usa la posizione del puntatore
2. **`verticalListSortingStrategy`**: Strategia di sorting verticale per liste
3. **Flattening**: Gli item vengono appiattiti per il drag, ma mantenuti gerarchici nello stato

Il flusso è:
```
onDragStart → traccia activeId
    ↓
onDragOver → traccia overId (per visual feedback)
    ↓
onDragEnd → calcola e applica le modifiche
    ↓
    ├→ Se section over section: riordina sezioni
    ├→ Se item over section: aggiungi item alla sezione
    ├→ Se item over item (stesso parent): riordina
    └→ Se item over item (diverso parent): sposta item
```

