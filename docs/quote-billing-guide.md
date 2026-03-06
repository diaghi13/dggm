# Guida al Sistema di Preventivazione DGGM ERP

**Versione**: 1.0
**Ultima modifica**: Febbraio 2026
**Modulo**: Preventivi

---

## Indice

1. [Tipi di Preventivo](#1-tipi-di-preventivo)
   - [Vendita](#11-vendita)
   - [Noleggio](#12-noleggio)
   - [Evento](#13-evento)
2. [Modalità di Fatturazione (billing_unit)](#2-modalità-di-fatturazione-billing_unit)
3. [Calcolo Giornaliero: Formula a Scaglioni (Tiered)](#3-calcolo-giornaliero-formula-a-scaglioni-tiered)
4. [Formula a Scalare (Degressive)](#4-formula-a-scalare-degressive)
5. [Giorni Evento (Periodo di Utilizzo)](#5-giorni-evento-periodo-di-utilizzo)
6. [Auto-derivazione della Modalità di Fatturazione](#6-auto-derivazione-della-modalità-di-fatturazione)
7. [Anteprima Formula (Preview)](#7-anteprima-formula-preview)
8. [Consigli e Buone Pratiche](#8-consigli-e-buone-pratiche)

---

## 1. Tipi di Preventivo

DGGM ERP supporta tre tipi di preventivo, ognuno con logiche di calcolo specifiche adatte al contesto d'uso. Il tipo si seleziona al momento della creazione del preventivo e determina come vengono calcolati i totali delle voci.

### 1.1 Vendita

Il tipo **Vendita** è il preventivo standard per la cessione di beni o servizi una tantum.

**Formula di calcolo:**

```
Totale voce = Quantità × Prezzo Unitario
```

**Caratteristiche:**
- La modalità di fatturazione è sempre **Unità** (non modificabile)
- Non sono presenti campi relativi a periodi o durate
- Il prezzo viene ricavato dal listino come `sale_price`

**Casi d'uso tipici:**
- Vendita di materiali, componenti, ricambi
- Servizi a tariffa fissa non ricorrenti
- Prestazioni professionali a corpo
- Forniture con consegna unica

---

### 1.2 Noleggio

Il tipo **Noleggio** è pensato per la locazione di attrezzature, veicoli, spazi o qualsiasi bene ceduto in uso temporaneo con restituzione.

**Formula di calcolo:**

```
Totale voce = Quantità × Prezzo × Durata (in base alla modalità scelta)
```

**Caratteristiche:**
- La modalità di fatturazione è **configurabile** (vedi sezione 2)
- Mostra il campo **"Giorni Evento" (Periodo Utilizzo)** nel form della voce
- Il prezzo viene ricavato automaticamente dal listino in base alla modalità selezionata:
  - Modalità **Giorno** → `rental_daily`
  - Modalità **Settimana** → `rental_weekly`
  - Modalità **Mese** → `rental_monthly`
  - Altre modalità → `sale_price`

**Casi d'uso tipici:**
- Noleggio attrezzatura da cantiere (gru, ponteggi, generatori)
- Noleggio veicoli e mezzi
- Locazione di spazi o strutture
- Servizi a canone (guardiania, manutenzione programmata)

---

### 1.3 Evento

Il tipo **Evento** è una variante del Noleggio, ottimizzata per contesti in cui la durata del noleggio coincide con le date di un evento specifico (allestimento, fiera, cerimonia, spettacolo).

**Formula di calcolo:**

Identica al Noleggio: `Quantità × Prezzo × Durata`

**Caratteristiche principali:**
- Il campo **"Giorni Evento"** viene **calcolato automaticamente** dalla differenza tra `data_inizio` e `data_fine` lavoro inserite nell'intestazione del preventivo
- Il valore auto-calcolato può essere **sovrascritto manualmente** per singole voci se necessario
- Le voci con il campo "N. Giorni" lasciato vuoto **ereditano** automaticamente il valore dei Giorni Evento del preventivo
- È presente il pulsante **"Reset (auto)"** per ripristinare il calcolo automatico dopo una modifica manuale

**Differenza rispetto al Noleggio:**
- Nel Noleggio, i giorni di utilizzo vengono inseriti manualmente voce per voce
- Nell'Evento, i giorni sono centralizzati nell'intestazione e propagati automaticamente a tutte le voci

**Casi d'uso tipici:**
- Allestimento e disallestimento fiere ed esposizioni
- Noleggio attrezzatura per eventi (palchi, luci, audio, arredi)
- Organizzazione di cerimonie (matrimoni, convegni, spettacoli)
- Servizi temporanei per cantieri a durata definita

---

## 2. Modalità di Fatturazione (billing_unit)

La modalità di fatturazione determina come viene calcolato il totale di ciascuna voce del preventivo. È disponibile solo per i tipi **Noleggio** ed **Evento**; per la **Vendita** è sempre **Unità**.

| Modalità | Formula | Quando usare |
|----------|---------|--------------|
| **Unità** | `qty × prezzo` | Vendita standard, materiali a consumo, forfait |
| **Ora** | `qty × prezzo × ore` | Tecnici a tariffa oraria, servizi orari |
| **Giorno** | `qty × prezzo × coeff(giorni)` | Noleggio attrezzature per giorni (tiered o scalare) |
| **Settimana** | `qty × prezzo × settimane` | Noleggio lungo periodo (blocchi settimanali) |
| **Mese** | `qty × prezzo × mesi` | Noleggio mensile (canoni fissi mensili) |
| **Costo Fisso** | `prezzo fisso` | Servizi forfettari, trasferte, lump sum |

### Dettaglio modalità

#### Unità
Calcolo lineare semplice. Il prezzo unitario viene moltiplicato per la quantità.

```
Esempio: 5 unità × €200 = €1.000
```

#### Ora
Utile per tecnici, operatori o servizi tariffati all'ora. La durata (ore) si inserisce nella voce.

```
Esempio: 2 tecnici × €45/ora × 8 ore = €720
```

#### Giorno
Modalità principale per il noleggio. Supporta due metodi di calcolo:
- **A scaglioni (tiered)** — default, vedi sezione 3
- **A scalare (degressive)** — alternativo, vedi sezione 4

```
Esempio (tiered): 1 generatore × €100/gg × tiered(7gg) = €264.58
```

#### Settimana
Il numero di settimane si inserisce nella voce. Il prezzo settimanale viene moltiplicato linearmente.

```
Esempio: 1 ponteggio × €350/sett × 3 settimane = €1.050
```

#### Mese
Il numero di mesi si inserisce nella voce. Il prezzo mensile viene moltiplicato linearmente.

```
Esempio: 1 ufficio mobile × €800/mese × 6 mesi = €4.800
```

#### Costo Fisso
Il prezzo inserito è il totale della voce, indipendentemente dalla quantità o dalla durata. Utile per servizi a forfait o voci a corpo.

```
Esempio: Trasferta tecnici → €500 fisso
```

---

## 3. Calcolo Giornaliero: Formula a Scaglioni (Tiered)

La formula a scaglioni è il metodo di calcolo **predefinito** per la modalità di fatturazione **Giorno**. Riflette la logica del listino prezzi, dove il prezzo giornaliero, settimanale e mensile sono tra loro collegati da una progressione matematica basata sulla radice quadrata.

### Logica del listino prezzi

Il catalogo prodotti memorizza tre prezzi di noleggio correlati:

```
rental_weekly  = rental_daily  × √7   ≈ rental_daily  × 2.6458
rental_monthly = rental_daily  × √30  ≈ rental_daily  × 5.4772
```

Questo significa che noleggiare per una settimana intera costa come ~2.65 giorni, e un mese intero come ~5.48 giorni — premiando il cliente con uno sconto crescente al crescere della durata.

### Formula a scaglioni

Il coefficiente moltiplicatore viene calcolato decomponendo i giorni totali in mesi, settimane e giorni rimanenti:

```
Totale giorni → mesi (blocchi da 30gg) + settimane (blocchi da 7gg) + giorni rimanenti

Coefficiente = (mesi × √30) + (settimane × √7) + giorni_rimanenti
             = (mesi × 5.4772) + (settimane × 2.6458) + giorni_rimanenti
```

**Totale voce:**
```
Totale = Quantità × Prezzo_giornaliero × Coefficiente
```

### Esempi con coefficienti

| Durata | Scomposizione | Coefficiente | Risparmio vs lineare |
|--------|--------------|-------------|----------------------|
| 1 giorno | 0m + 0s + 1gg | **1.000** | 0% |
| 3 giorni | 0m + 0s + 3gg | **3.000** | 0% |
| 7 giorni | 0m + 1s + 0gg | **2.646** | 62% |
| 14 giorni | 0m + 2s + 0gg | **5.292** | 62% |
| 30 giorni | 1m + 0s + 0gg | **5.477** | 82% |
| 50 giorni | 1m + 2s + 6gg | **16.769** | 66% |
| 60 giorni | 2m + 0s + 0gg | **10.954** | 82% |
| 90 giorni | 3m + 0s + 0gg | **16.431** | 82% |

> **Calcolo 50 giorni spiegato:**
> 50 ÷ 30 = 1 mese, resto 20 giorni
> 20 ÷ 7 = 2 settimane, resto 6 giorni
> Coefficiente = 1×√30 + 2×√7 + 6 = 5.477 + 5.292 + 6 = **16.769**

### Esempio pratico completo

**Prodotto**: Generatore diesel — Prezzo listino: €100/giorno

| Durata | Formula | Totale | Prezzo lineare | Risparmio |
|--------|---------|--------|---------------|-----------|
| 1 giorno | 1 × €100 × 1 | **€100.00** | €100 | — |
| 7 giorni | 1 × €100 × √7 | **€264.58** | €700 | €435.42 (62%) |
| 30 giorni | 1 × €100 × √30 | **€547.72** | €3.000 | €2.452.28 (82%) |
| 50 giorni | 1 × €100 × 16.769 | **€1.676.90** | €5.000 | €3.323.10 (66%) |
| 90 giorni | 1 × €100 × 16.431 | **€1.643.17** | €9.000 | €7.356.83 (82%) |

> Nota: i periodi superiori a 30 giorni che contengono un numero intero di mesi (30, 60, 90 gg) beneficiano del massimo risparmio (82%). Le durate miste (es. 50 gg) hanno uno sconto leggermente inferiore perché i giorni rimanenti si contano linearmente.

### Coerenza con il listino

Quando si usa la modalità **Giorno** con la formula tiered e si inserisce un numero di giorni pari a esattamente 7 o 30, il risultato è **identico** a quello che si otterrebbe selezionando rispettivamente la modalità **Settimana** o **Mese** con 1 unità al prezzo di listino:

```
Giorno × tiered(7gg)   = Prezzo_giornaliero × √7 = rental_weekly  ✓
Giorno × tiered(30gg)  = Prezzo_giornaliero × √30 = rental_monthly ✓
```

---

## 4. Formula a Scalare (Degressive)

La formula a scalare è un metodo alternativo alla formula a scaglioni, disponibile selezionando la casella **"Prezzo a scalare"** nella voce del preventivo. È un metodo legacy, più semplice ma meno preciso della formula tiered.

### Logica

Invece di scomporre i giorni in mesi e settimane, la formula a scalare applica la radice quadrata sull'intera durata, suddividendo la durata in blocchi di 30 giorni:

```
Per ogni blocco da 30 giorni: coefficiente += √(giorni nel blocco)
```

### Esempio

**50 giorni** con formula a scalare:
```
Blocco 1: giorni 1-30  → √30 = 5.477
Blocco 2: giorni 31-50 → √20 = 4.472
                         ─────────────
Coefficiente totale   = 9.949
```

**Confronto con la formula tiered per 50 giorni:**
- Scalare: coefficiente **9.949** → Totale €100 × 9.949 = **€994.87**
- Tiered:  coefficiente **16.769** → Totale €100 × 16.769 = **€1.676.90**

> La formula a scalare produce prezzi più bassi rispetto alla formula tiered per durate superiori a un mese, perché √(giorni) cresce più lentamente della scomposizione mesi+settimane+giorni. Usare questa formula solo se il listino prezzi aziendale è strutturato di conseguenza.

### Quando usare la formula a scalare

- Compatibilità con listini storici o contratti esistenti basati su questa logica
- Accordi commerciali specifici dove il cliente si aspetta questo calcolo
- Preventivi interni dove la semplicità del calcolo è prioritaria rispetto alla coerenza col listino

---

## 5. Giorni Evento (Periodo di Utilizzo)

Il campo **"Giorni Evento"** (o "Periodo Utilizzo") è visibile nel form del preventivo esclusivamente per i tipi **Noleggio** ed **Evento**.

### Funzionamento

#### Per i preventivi di tipo Evento

Il valore dei Giorni Evento è **centralizzato** nell'intestazione del preventivo e calcolato automaticamente:

```
Giorni Evento = data_fine_lavoro - data_inizio_lavoro (in giorni, inclusi)
```

**Esempio:** Evento dal 10 al 17 marzo → 7 Giorni Evento (calcolati automaticamente)

Le singole voci con il campo "N. Giorni" lasciato **vuoto** ereditano automaticamente questo valore. È possibile specificare un numero di giorni diverso per singole voci (ad esempio, una voce noleggiata solo per metà dell'evento).

**Reset al valore automatico:**
- Dopo aver sovrascritto manualmente i giorni di una voce, è possibile tornare al valore auto-calcolato premendo il pulsante **"Reset (auto)"** accanto al campo.

#### Per i preventivi di tipo Noleggio

I Giorni Evento del preventivo vengono comunque calcolati dalle date se presenti, ma ogni voce gestisce il proprio numero di giorni indipendentemente.

### Comportamento per singola voce

| Situazione | Comportamento |
|-----------|--------------|
| Campo "N. Giorni" vuoto (Evento) | Eredita i Giorni Evento del preventivo |
| Campo "N. Giorni" valorizzato | Usa il valore inserito manualmente |
| Pulsante "Reset (auto)" premuto | Ripristina il valore auto-calcolato |
| Date di lavoro non inserite | Il campo rimane modificabile manualmente |

### Flusso consigliato per un preventivo Evento

1. Inserire **Data inizio** e **Data fine** lavoro nell'intestazione del preventivo
2. Il sistema calcola automaticamente i **Giorni Evento**
3. Aggiungere le voci: la maggior parte erediterà automaticamente i giorni
4. Per voci con durata diversa (es. allestimento anticipato), inserire manualmente i giorni della singola voce
5. Verificare l'anteprima formula (riquadro blu) per ogni voce

---

## 6. Auto-derivazione della Modalità di Fatturazione

Quando si seleziona un prodotto dal catalogo in un preventivo di tipo **Noleggio** o **Evento**, il sistema deriva automaticamente la modalità di fatturazione e il prezzo più appropriati.

### Regole di derivazione automatica

| Condizione | Modalità derivata | Prezzo usato |
|-----------|-----------------|--------------|
| Tipo preventivo = Vendita | Unità (fisso) | `sale_price` |
| Tipo = Noleggio/Evento e `product.unit = 'h'` | **Ora** | `sale_price` |
| Tipo = Noleggio/Evento e `product.unit ≠ 'h'` | **Giorno** | `rental_daily` |

Quando la modalità viene impostata su:
- **Giorno** → il prezzo viene popolato con `rental_daily`
- **Settimana** → il prezzo viene popolato con `rental_weekly`
- **Mese** → il prezzo viene popolato con `rental_monthly`
- **Ora** / **Unità** / **Costo Fisso** → il prezzo viene popolato con `sale_price`

### Override manuale

L'utente può sempre:
- Cambiare la modalità di fatturazione dopo la selezione del prodotto
- Modificare manualmente il prezzo indipendentemente dal listino
- Scegliere un prezzo diverso da quello suggerito (es. prezzo concordato con il cliente)

> Quando si cambia manualmente la modalità di fatturazione, il prezzo viene **aggiornato automaticamente** dal catalogo per riflettere il nuovo tipo (es. passando da Giorno a Settimana, il prezzo diventa `rental_weekly`). Se si vuole mantenere un prezzo personalizzato, modificarlo **dopo** aver selezionato la modalità.

---

## 7. Anteprima Formula (Preview)

Il **riquadro blu di anteprima** in fondo al dialog di inserimento/modifica voce mostra in tempo reale:

1. **La formula applicata** — descrizione testuale del calcolo
2. **Subtotale** — totale prima di sconti
3. **Sconto** — importo dello sconto applicato
4. **Imponibile** — base imponibile (subtotale - sconto)
5. **IVA** — importo IVA calcolato
6. **Totale con IVA** — importo finale

### Esempi di formula visualizzata

#### Modalità Unità
```
2 × €50.00 = €100.00
```

#### Modalità Ora
```
2 × €45.00/ora × 8 ore = €720.00
```

#### Modalità Giorno — Formula tiered
```
1 × €100.00/gg × tiered(7gg)=2.646 = €264.58
```

#### Modalità Giorno — Formula scalare
```
1 × €100.00/gg × √7 gg = €264.58
```

#### Modalità Settimana
```
1 × €350.00/sett × 3 sett = €1.050.00
```

#### Modalità Mese
```
1 × €800.00/mese × 6 mesi = €4.800.00
```

#### Costo Fisso
```
Costo fisso: €500.00
```

> L'anteprima si aggiorna automaticamente ad ogni modifica dei campi (quantità, prezzo, giorni, modalità, sconto, IVA). Controllare sempre l'anteprima prima di salvare la voce per verificare che il calcolo corrisponda alle aspettative.

---

## 8. Consigli e Buone Pratiche

### Organizzazione del preventivo

- **Coerenza nelle modalità**: usare la stessa modalità di fatturazione per voci simili all'interno della stessa sezione/categoria del preventivo. Mescolare modalità diverse (es. Giorno e Settimana) può rendere il preventivo difficile da leggere per il cliente.

- **Sezioni e categorie**: raggruppare le voci per categoria (es. "Attrezzatura", "Manodopera", "Trasporti") usando le sezioni del preventivo. Ogni sezione può avere il proprio subtotale.

- **Note alle voci**: aggiungere note descrittive alle voci quando la modalità di calcolo potrebbe non essere immediatamente chiara al cliente.

### Per i preventivi Evento

1. Inserire sempre **prima** le date di inizio e fine evento nell'intestazione del preventivo
2. Verificare che i **Giorni Evento** calcolati automaticamente siano corretti
3. Aggiungere le voci: quelle che coprono l'intera durata dell'evento non richiedono di specificare i giorni (li ereditano automaticamente)
4. Per attrezzatura consegnata con anticipo o ritirata in ritardo, specificare manualmente i giorni nella singola voce

### Gestione del listino prezzi

- Il catalogo prodotti deve contenere **tutti e tre i prezzi di noleggio** (`rental_daily`, `rental_weekly`, `rental_monthly`) per ogni articolo noleggiabile
- I tre prezzi devono essere coerenti tra loro seguendo la proporzione: `weekly ≈ daily × 2.646` e `monthly ≈ daily × 5.477`
- Usare la modalità di fatturazione corrispondente al prezzo che si vuole applicare:
  - Noleggio al giorno → **Giorno** + `rental_daily`
  - Noleggio a settimana → **Settimana** + `rental_weekly`
  - Noleggio a mese → **Mese** + `rental_monthly`

### Verifica prima dell'invio

- Controllare l'**anteprima formula** (riquadro blu) per ogni voce critica prima di inviare il preventivo
- Verificare che i **totali di sezione** e il **totale generale** siano corretti
- Per i preventivi Evento, controllare che i giorni ereditati automaticamente siano quelli attesi
- Verificare sconto e IVA applicati ad ogni voce

### Scelta della formula per il Noleggio giornaliero

| Situazione | Formula consigliata |
|-----------|---------------------|
| Listino aziendale con prezzi daily/weekly/monthly correlati da √ | **Tiered** (default) |
| Listino storico con logica di sconto propria | **Scalare** |
| Accordo commerciale a prezzo fisso per tutto il periodo | **Costo Fisso** |
| Noleggio inferiore a 7 giorni | Entrambe equivalenti (solo giorni lineari) |

---

## Riferimenti Tecnici

### Formule matematiche complete

**Formula Tiered (Giorno):**
```
giorni_totali = G
mesi = floor(G / 30)
resto_dopo_mesi = G mod 30
settimane = floor(resto_dopo_mesi / 7)
giorni_rim = resto_dopo_mesi mod 7

coefficiente = mesi × √30 + settimane × √7 + giorni_rim
             = mesi × 5.47723 + settimane × 2.64575 + giorni_rim

Totale = qty × prezzo_giornaliero × coefficiente
```

**Formula Scalare (Giorno):**
```
giorni_totali = G
coefficiente = 0
while G > 0:
    blocco = min(G, 30)
    coefficiente += √blocco
    G -= blocco

Totale = qty × prezzo_giornaliero × coefficiente
```

**Costanti utili:**
```
√7  = 2.6457513...  (≈ 2.646)
√30 = 5.4772255...  (≈ 5.477)
```

### Equivalenze listino ↔ formula tiered

```
1 unità × rental_daily  × tiered(1gg)  = rental_daily  × 1
1 unità × rental_daily  × tiered(7gg)  = rental_weekly  (se weekly = daily × √7)
1 unità × rental_daily  × tiered(30gg) = rental_monthly (se monthly = daily × √30)
```

---

*Documentazione generata per DGGM ERP - Sistema di gestione aziendale per imprese edili*
*Per assistenza tecnica contattare l'amministratore di sistema.*
