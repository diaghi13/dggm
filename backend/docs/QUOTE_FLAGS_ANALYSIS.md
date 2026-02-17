# Analisi Flag Preventivi - Best Practice IVA

## 📊 Ricerca Best Practice Italia

### Fonti
- [Calcolo IVA e Scorporo](https://www.calcolareiva.com/)
- [IVA in preventivi e contratti](https://www.laleggepertutti.it/341171_iva-non-indicata-nel-contratto-o-nel-preventivo-e-inclusa)
- [Quando includere IVA](https://flextax.it/commercialisti-online/quando-emetto-un-preventivo-o-fattura-liva-devo-comprenderla-nel-prezzo/)
- [Scorporo IVA](https://focus.namirial.com/it/scorporo-iva/)

### Regole Italia (Codice Civile)
1. **IVA è SEMPRE inclusa** nei prezzi, salvo diversa indicazione esplicita
2. **Indicazione obbligatoria**: Bisogna specificare chiaramente se IVA è inclusa o esclusa
3. **Fatture B2B**: Prezzo netto (IVA esclusa) + aliquota IVA + importo IVA + totale IVA inclusa
4. **Preventivi B2C**: Spesso prezzi IVA inclusa, ma deve essere chiaro

### Formule Scorporo IVA
- **Imponibile da lordo (22%)**: `Imponibile = (Prezzo IVA inclusa × 100) ÷ 122`
- **IVA da imponibile**: `IVA = Imponibile - Prezzo IVA inclusa`
- **Lordo da netto**: `Lordo = Netto × 1.22`

---

## 🎯 Flag Attuali Sistema

| Flag | Default | Scopo |
|------|---------|-------|
| `show_product_codes` | true | Mostra codici prodotto in tabella |
| `show_unit_prices` | true | Mostra prezzi unitari degli items |
| `show_vat` | true | Mostra colonna IVA% in tabella |
| `show_tax` | true | Mostra sezione IVA nei totali |
| `tax_included` | false | Prezzi sono IVA inclusa (per calcoli interni) |
| `vat_included_in_prices` | false | Prezzi visualizzati includono IVA (display) |
| `include_terms_and_conditions` | true | Include T&C nel PDF |

---

## ❌ Problemi Identificati

### 1. **Duplicazione Semantica**
- `tax_included` vs `vat_included_in_prices`: **NON è chiara la differenza**
- Entrambi sembrano fare la stessa cosa → **confusione**

### 2. **Manca Flag per Totale Sezioni**
- Le sezioni attualmente mostrano SEMPRE il totale
- **Serve**: `show_section_totals` (boolean)

### 3. **Logica IVA Non Completa**
- **Manca scorporo IVA** quando `vat_included_in_prices = true`
- Se i prezzi sono IVA inclusa, bisogna:
  1. Scorporare l'IVA dal prezzo lordo
  2. Calcolare imponibile
  3. Mostrare correttamente nei totali

### 4. **Incoerenza Visualizzazione**
- Se `show_vat = false` → colonna IVA dovrebbe sparire dalla tabella
- Se `show_tax = false` → sezione IVA nei totali dovrebbe sparire
- **Non sempre implementato correttamente**

---

## ✅ Cosa Sistemare

### 1. **Unificare Flag IVA Inclusa/Esclusa**
**Soluzione**: Mantenere solo `vat_included_in_prices` e rimuovere `tax_included`

**Semantica chiara**:
- `vat_included_in_prices = true` → Prezzi sono IVA inclusa (1220€ = 1000€ + 220€ IVA)
- `vat_included_in_prices = false` → Prezzi sono netti, IVA da aggiungere (1000€ + IVA 22%)

### 2. **Aggiungere Flag Totale Sezioni**
**Migration**:
```php
$table->boolean('show_section_totals')->default(true);
```

### 3. **Implementare Scorporo IVA**
Quando `vat_included_in_prices = true`:

**Nel QuoteItem Model** (metodo `calculateTotals()`):
```php
if ($quote->vat_included_in_prices) {
    // Prezzi sono lordi, scorporo IVA
    $vatRate = $this->vat_rate ?? 22;
    $divisor = 100 + $vatRate; // es. 122 per IVA 22%

    $this->subtotal = ($this->unit_price * $this->quantity); // Lordo
    $this->total = $this->subtotal - $this->discount_amount; // Lordo scontato

    // Scorporo IVA
    $imponibile = ($this->total * 100) / $divisor;
    $this->vat_amount = $this->total - $imponibile;
    $this->total_with_vat = $this->total; // È già lordo
} else {
    // Prezzi sono netti, aggiungo IVA
    $this->subtotal = ($this->unit_price * $this->quantity); // Netto
    $this->total = $this->subtotal - $this->discount_amount; // Netto scontato

    // Calcolo IVA
    $vatRate = $this->vat_rate ?? 22;
    $this->vat_amount = ($this->total * $vatRate) / 100;
    $this->total_with_vat = $this->total + $this->vat_amount;
}
```

### 4. **Fix Template PDF**
**Logica Visualizzazione**:
```blade
@if($quote->vat_included_in_prices)
    {{-- Prezzi sono IVA inclusa --}}
    <div>Prezzo unitario (IVA incl.): {{ $item->unit_price }} €</div>
    <div>Imponibile: {{ $item->total }} €</div>
    <div>IVA ({{ $item->vat_rate }}%): {{ $item->vat_amount }} €</div>
    <div>Totale: {{ $item->total_with_vat }} €</div>
@else
    {{-- Prezzi sono netti --}}
    <div>Prezzo unitario: {{ $item->unit_price }} €</div>
    <div>Subtotale: {{ $item->total }} €</div>
    @if($quote->show_vat)
        <div>IVA ({{ $item->vat_rate }}%): {{ $item->vat_amount }} €</div>
        <div>Totale IVA incl.: {{ $item->total_with_vat }} €</div>
    @endif
@endif
```

**Nascondi colonna IVA se `show_vat = false`**:
```blade
@if($quote->show_vat)
    <th>IVA%</th>
@endif
```

**Nascondi totale sezione se `show_section_totals = false`**:
```blade
@if($quote->show_section_totals)
    <td class="text-right font-bold">{{ $section->total }} €</td>
@else
    <td></td>
@endif
```

### 5. **Frontend Form**
Aggiungere campo:
```tsx
<FormField
  name="show_section_totals"
  label="Mostra totali sezioni"
  description="Visualizza il totale di ogni sezione nel preventivo"
/>
```

---

## 📋 Checklist Implementazione

- [ ] Migration: Aggiungere `show_section_totals` (boolean, default true)
- [ ] Migration: Deprecare/rimuovere `tax_included` (se non usato)
- [ ] QuoteData: Aggiungere campo `show_section_totals`
- [ ] QuoteItem Model: Implementare scorporo IVA in `calculateTotals()`
- [ ] Template PDF: Aggiungere logica `vat_included_in_prices`
- [ ] Template PDF: Nascondere colonna IVA se `show_vat = false`
- [ ] Template PDF: Nascondere totale sezione se `show_section_totals = false`
- [ ] Frontend: Form field per `show_section_totals`
- [ ] Frontend: Help text per spiegare differenza IVA inclusa/esclusa
- [ ] Test: Preventivo con IVA inclusa (scorporo)
- [ ] Test: Preventivo con IVA esclusa (aggiunta)
- [ ] Test: Nascondere colonna IVA
- [ ] Test: Nascondere totali sezioni

---

## 🎯 Casi d'Uso

### Caso 1: B2B - Prezzi Netti + IVA
```
vat_included_in_prices = false
show_vat = true
show_unit_prices = true
show_product_codes = true
show_section_totals = true

Risultato PDF:
| Cod | Desc | Q.tà | Prezzo | IVA% | Totale |
| --- | ---- | ---- | ------ | ---- | ------ |
| SEZIONE 1                           | 1000€ |
| P01 | Item | 1    | 1000€  | 22%  | 1000€ |

Totali:
Imponibile: 1000€
IVA 22%: 220€
TOTALE: 1220€
```

### Caso 2: B2C - Prezzi IVA Inclusa
```
vat_included_in_prices = true
show_vat = false
show_unit_prices = true
show_product_codes = false
show_section_totals = true

Risultato PDF:
| Desc | Q.tà | Prezzo | Totale |
| ---- | ---- | ------ | ------ |
| SEZIONE 1                | 1220€ |
| Item | 1    | 1220€  | 1220€ |

Totali:
Imponibile: 1000€
IVA 22%: 220€
TOTALE: 1220€
```

### Caso 3: Preventivo Semplificato (no prezzi)
```
vat_included_in_prices = false
show_vat = false
show_unit_prices = false
show_product_codes = false
show_section_totals = false

Risultato PDF:
| Descrizione |
| ----------- |
| SEZIONE 1   |
| Item 1      |
| Item 2      |

Totali:
TOTALE: 1220€
```

---

**Conclusione**: Sistema è quasi completo, serve solo:
1. Implementare scorporo IVA
2. Aggiungere flag `show_section_totals`
3. Applicare logica nascondere colonne in PDF
4. Deprecare/unificare flag ridondanti
