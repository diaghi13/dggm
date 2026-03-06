# DGGM Rental Pricing Engine — Specifica Tecnica Definitiva

**Versione**: 2.0
**Data**: Febbraio 2026
**Autore**: Piano tecnico DGGM ERP — sessione di analisi architetturale
**Stato**: DEFINITIVO — da usare come riferimento per l'implementazione

---

## Indice

1. [Executive Summary](#1-executive-summary)
2. [Stato del Documento — Decisioni Architetturali](#2-stato-del-documento--decisioni-architetturali)
3. [Il Problema Risolto — Formula Cliff](#3-il-problema-risolto--formula-cliff)
4. [Formula Definitiva GYMME](#4-formula-definitiva-gymme)
5. [Periodi Standard Auto-Calcolati](#5-periodi-standard-auto-calcolati)
6. [Sistema Commercial Index](#6-sistema-commercial-index)
7. [Fallback Prezzi e Stima da Preventivo](#7-fallback-prezzi-e-stima-da-preventivo)
8. [Sub-rental Intelligente](#8-sub-rental-intelligente)
9. [Rental Profiles Multi-Settore](#9-rental-profiles-multi-settore)
10. [Settings Completi](#10-settings-completi)
11. [Schema DB — Modifiche Necessarie](#11-schema-db--modifiche-necessarie)
12. [Roadmap 5 Fasi](#12-roadmap-5-fasi)
13. [Campi e Funzionalità Rimosse](#13-campi-e-funzionalità-rimosse)
14. [Note Implementative](#14-note-implementative)

---

## 1. Executive Summary

Il motore di pricing del noleggio DGGM soffre di un bug critico nella formula di calcolo: al superamento di soglie settimanali e mensili si genera un **calo del prezzo** (il "cliff"), rendendo i preventivi incoerenti e imbarazzanti con i clienti.

Questo documento è la specifica tecnica definitiva per trasformare il motore da una formula approssimativa e buggata a un **sistema professionale, configurabile e multi-settore**, con supporto per sub-rental intelligente, profili di noleggio per categoria, e integrazione nativa con il sistema listini già esistente.

### Obiettivi per Fase

- **Fase 1 (URGENTE)**: Eliminare il cliff sostituendo `calculateTieredCoefficient()` con la formula GYMME a curva continua. Rimuovere `is_degressive` da quote_items.
- **Fase 2**: Periodi standard pre-calcolati (`rental_hourly`, `rental_half_day`, `rental_seasonal`), Rental Profiles per categoria, fallback da preventivo con flag stima.
- **Fase 3**: Commercial Index globale integrato nel sistema Price Lists, sub-rental con selezione fornitore e score.
- **Fase 4**: Dashboard KPI con break-even tracker, buy-vs-rent analysis, asset ROI.
- **Fase 5**: UI configurazione Rental Profiles, tariffari automatici per categoria.

### Valori Target della Formula

| Periodo | Moltiplicatore target | Range accettabile |
|---------|----------------------|-------------------|
| 7 giorni (settimana) | 3.52× | 3.2–4.0× |
| 30 giorni (mensile) | 7.60× | 7.0–8.5× |
| 90 giorni (stagionale) | 14–15× | 13–16× (floor) |

---

## 2. Stato del Documento — Decisioni Architetturali

Le seguenti decisioni sono state prese durante la sessione di analisi e sono **definitivamente adottate**:

| Decisione | Stato | Note |
|-----------|-------|------|
| Rimozione `is_degressive` da `quote_items` | **DEFINITIVO** | Mai in produzione — migration DROP COLUMN |
| Formula GYMME con `decay_factor` | **DEFINITIVO** | Sostituisce `duration^exponent` semplice |
| `rental_hourly` e `rental_half_day` su `price_list_items` | **DEFINITIVO** | Nuovi campi DB |
| `rental_seasonal` (90gg) su `price_list_items` | **DEFINITIVO** | Nuovo campo DB |
| Rental Profiles a livello categoria (non prodotto) | **DEFINITIVO** | Override per prodotto = futuro |
| `product_subrental_suppliers` separata da `supplier_product` | **DEFINITIVO** | Tabella dedicata con `reliability_score` |
| Sub-rental: due modalità `block` / `flexible_with_alert` | **DEFINITIVO** | Configurabile via setting |
| `adjustment_type` = `'multiplier'` per commercial index | **DEFINITIVO** | Aggiunta al enum esistente |
| Fallback stimato: `estimated_base_day` + `rental_price_estimated` | **DEFINITIVO** | Badge warning in UI |
| `rental.daily_rate_percent` mantenuto come ultimo fallback | **DEFINITIVO** | Non rimuovere |
| `rental.weekly_multiplier` e `rental.monthly_multiplier` deprecati | **DEFINITIVO** | Mantenere in DB, non usare nel codice nuovo |

---

## 3. Il Problema Risolto — Formula Cliff

### 3.1 Il Bug

La formula attuale `calculateTieredCoefficient()` scompone la durata in mesi, settimane e giorni residui:

```
coefficient = months × √30 + weeks × √7 + remaining_days
```

Questo crea salti discontinui ogni volta che si attraversa la soglia settimanale o mensile.

**Esempio con prezzo giornaliero €10.37:**

| Durata | Coefficiente | Prezzo Totale | Prezzo/Giorno |
|--------|-------------|---------------|---------------|
| 6 giorni | 6.00 | €62.24 | €10.37 |
| **7 giorni** | **2.65 (cliff!)** | **€27.45** | **€3.92** |
| 8 giorni | 3.65 | €37.82 | €4.73 |
| 13 giorni | 8.65 | €89.65 | €6.90 |
| **14 giorni** | **5.29 (cliff!)** | **€54.90** | **€3.92** |

Il cliente che affitta 7 giorni paga meno di chi affitta 6 giorni. Questo è un errore commerciale grave.

### 3.2 Causa Tecnica

Il bug è concettualmente identico alla "flat tax cliff" in economia: al 7° giorno si passa da "6 giorni a tariffa piena" a "1 settimana a tariffa scontata", azzerando i giorni precedenti anziché applicare lo sconto solo alla parte eccedente.

### 3.3 Cosa Viene Rimosso

Il campo `is_degressive` e la logica `calculateDegressiveCoefficient()` non sono mai stati in produzione. Vengono eliminati completamente nella Fase 1 (vedere sezione 13).

---

## 4. Formula Definitiva GYMME

### 4.1 La Formula

La formula a curva continua GYMME sostituisce completamente `calculateTieredCoefficient()` e `calculateDegressiveCoefficient()`:

```
DurationMultiplier = (Duration^exponent_curve × decay_factor(Duration)) + duration_offset

decay_factor(d) = 1 - (ln(d) / ln(max_duration_reference)) × decay_strength
```

**Caso speciale**: se `d == 1` → Multiplier = 1.0

**Cap stagionale**: per `d > max_period_cap_days` (default 90) → Multiplier = max(Multiplier(90), formula(d))
Il moltiplicatore non scende mai sotto il valore calcolato al 90° giorno.

### 4.2 Parametri e Valori di Partenza

> **Nota critica**: i parametri esatti devono essere calibrati in fase di implementazione. I valori seguenti sono punti di partenza; le conversazioni di analisi hanno evidenziato una inconsistenza matematica nei parametri iniziali proposti da ChatGPT. La calibrazione deve avvenire con uno script di test che verifichi i valori target (7gg=3.52×, 30gg=7.60×, 90gg≈14-15×).

| Parametro | Default (da calibrare) | Descrizione |
|-----------|----------------------|-------------|
| `exponent_curve` | 0.84 | Esponente della curva potenza |
| `duration_offset` | 0.02 | Offset additivo per correzioni di scala |
| `decay_strength` | 0.12 | Forza del decadimento logaritmico |
| `max_duration_reference` | 30 | Riferimento per normalizzare il decadimento |
| `max_period_cap_days` | 90 | Soglia stagionale (floor del moltiplicatore) |

### 4.3 Proprietà Garantite

1. **Monotonicità**: per ogni `d1 < d2`, vale `Mult(d1) < Mult(d2)` fino a `max_period_cap_days`. Il cliff è matematicamente impossibile.
2. **Caso base esatto**: `Mult(1) = 1.0` — il moltiplicatore per 1 giorno è esattamente 1.
3. **Floor stagionale**: `Mult(d > 90) >= Mult(90)` — i noleggi lunghi non scendono mai sotto il prezzo stagionale.
4. **Configurabilità per profilo**: ogni categoria può avere una curva diversa tramite i Rental Profiles.

### 4.4 Valori Attesi (post-calibrazione)

| Giorni | Moltiplicatore target | Nota |
|--------|-----------------------|------|
| 1 | 1.00 (esatto) | Caso speciale |
| 3 | ~1.80–2.00 | Breve durata |
| 7 | ~3.52 | Settimana |
| 14 | ~5.20–5.50 | Due settimane |
| 30 | ~7.60 | Mensile |
| 60 | ~11–12 | Due mesi |
| 90 | ~14–15 | Stagionale (cap) |
| 120 | >= Mult(90) | Floor stagionale |

### 4.5 Implementazione PHP

```php
// app/Services/RentalEngineService.php

public function calculateDurationMultiplier(
    float $duration,
    float $exponentCurve,
    float $durationOffset,
    float $decayStrength,
    float $maxDurationReference,
    float $maxPeriodCapDays
): float {
    if ($duration <= 0) {
        return 0.0;
    }

    if ($duration == 1) {
        return 1.0;
    }

    $capMultiplier = $this->calculateRawMultiplier(
        $maxPeriodCapDays,
        $exponentCurve,
        $durationOffset,
        $decayStrength,
        $maxDurationReference,
    );

    $raw = $this->calculateRawMultiplier(
        $duration,
        $exponentCurve,
        $durationOffset,
        $decayStrength,
        $maxDurationReference,
    );

    if ($duration > $maxPeriodCapDays) {
        return max($capMultiplier, $raw);
    }

    return $raw;
}

private function calculateRawMultiplier(
    float $duration,
    float $exponentCurve,
    float $durationOffset,
    float $decayStrength,
    float $maxDurationReference,
): float {
    $decayFactor = 1.0 - (log($duration) / log($maxDurationReference)) * $decayStrength;
    return pow($duration, $exponentCurve) * $decayFactor + $durationOffset;
}
```

### 4.6 Implementazione TypeScript (Frontend)

```typescript
// frontend/lib/utils/rental-engine.ts

export function calculateDurationMultiplier(
    duration: number,
    params: {
        exponentCurve: number
        durationOffset: number
        decayStrength: number
        maxDurationReference: number
        maxPeriodCapDays: number
    }
): number {
    if (duration <= 0) return 0
    if (duration === 1) return 1.0

    const calculateRaw = (d: number): number => {
        const decayFactor = 1 - (Math.log(d) / Math.log(params.maxDurationReference)) * params.decayStrength
        return Math.pow(d, params.exponentCurve) * decayFactor + params.durationOffset
    }

    const capMultiplier = calculateRaw(params.maxPeriodCapDays)
    const raw = calculateRaw(duration)

    if (duration > params.maxPeriodCapDays) {
        return Math.max(capMultiplier, raw)
    }

    return raw
}
```

---

## 5. Periodi Standard Auto-Calcolati

### 5.1 Tabella dei Periodi

Tutti i periodi standard vengono pre-calcolati e salvati su `price_list_items` per performance. Il calcolo avviene automaticamente quando cambia il `BaseDay` o i parametri del profilo.

| Periodo | Formula | Campo DB |
|---------|---------|----------|
| Orario | `BaseDay ÷ 8 × 1.2` | `rental_hourly` (NUOVO) |
| Mezza giornata | `BaseDay × 0.7` | `rental_half_day` (NUOVO) |
| 1 giorno | `BaseDay` | `rental_daily` (esiste) |
| Settimana (7 gg) | `BaseDay × Mult(7)` | `rental_weekly` (esiste) |
| Mensile (30 gg) | `BaseDay × Mult(30)` | `rental_monthly` (esiste) |
| Stagionale (90 gg) | `BaseDay × Mult(90)` | `rental_seasonal` (NUOVO) |

**Rationale per orario**: il coefficiente 1.2 (invece di 1.0) compensa l'overhead operativo dei noleggi brevi (consegna, ritiro, ispezione) che incidono proporzionalmente di più su durate ridotte.

**Rationale per mezza giornata**: lo sconto 0.7 (30%) rispetto al giornaliero riflette lo standard di mercato AV per i noleggi di 4-6 ore.

### 5.2 Ricalcolo Automatico

Il ricalcolo dei periodi standard si attiva in questi eventi:
- Modifica di `manufacturer_cost_price` su un prodotto
- Modifica dei parametri del Rental Profile della categoria
- Modifica dei settings globali `rental.*`
- Manuale da UI (pulsante "Ricalcola prezzi noleggio")

Il ricalcolo viene eseguito via job in coda (`RecalculateRentalPricesJob`) per non bloccare la request.

---

## 6. Sistema Commercial Index

### 6.1 Integrazione con Price Lists Esistenti

Il sistema Price Lists esistente (`price_lists`, `price_list_items`) rimane invariato nel DB e nella logica. Il Rental Engine aggiunge un layer superiore tramite `pricing.commercial_index_global` e l'estensione dell'enum `adjustment_type`.

**Modifica all'enum `adjustment_type`**: aggiungere il valore `'multiplier'` ai valori esistenti (`'percentage'`, `'fixed'`). Questo permette di esprimere il commercial index come moltiplicatore diretto (es. 1.08) anziché percentuale.

In UI, l'utente inserisce sempre una **percentuale** (+8%, -5%) che il sistema converte internamente in moltiplicatore (1.08, 0.95). Il `fixed amount` rimane disponibile.

### 6.2 Struttura del Commercial Factor

```
CommercialFactor =
    commercial_index_global      (setting pricing.commercial_index_global)
    × price_list[categoria]      (adjustment → moltiplicatore)
    × price_list[cliente]        (adjustment → moltiplicatore)
    × price_list_item[prodotto]  (override diretto, esiste già)
```

### 6.3 Formula Completa del Prezzo

```
BaseDay = (manufacturer_cost_price / break_even_days) × (1 + margin_percentage / 100)

DurationMultiplier = GYMME(duration, profilo_categoria)

ScarcityFactor = rental.scarcity_multiplier    se availability_ratio < rental.scarcity_threshold
                 1.00                           altrimenti

PremiumFactor = rental.premium_multiplier      se product.is_premium = TRUE
                1.00                           altrimenti

CommercialFactor = pricing.commercial_index_global
                   × commercial_index_categoria
                   × commercial_index_cliente
                   × commercial_index_prodotto

─────────────────────────────────────────────────────────────

FinalDailyPrice = BaseDay × ScarcityFactor × PremiumFactor × CommercialFactor
TotalItemPrice  = qty × FinalDailyPrice × DurationMultiplier
```

### 6.4 Esempio Numerico Completo

**Prodotto**: Mixer audio, prezzo acquisto €15.000
**Rental Profile** (AV/Service): `break_even_days=40`, `margin=20%`
**Durata**: 8 giorni
**Cliente**: listino categoria -10%
**Prodotto premium**: sì
**ScarcityFactor**: 1.00 (disponibile)
**commercial_index_global**: 1.00

```
BaseDay = (€15.000 / 40) × 1.20 = €375 × 1.20 = €450/giorno

DurationMultiplier = GYMME(8) ≈ 4.15  [valore post-calibrazione]

ScarcityFactor = 1.00
PremiumFactor  = 1.15

CommercialFactor = 1.00 × 0.90 × 1.00 × 1.00 = 0.90

FinalDailyPrice = €450 × 1.00 × 1.15 × 0.90 = €465.75/giorno

TotalItemPrice = 1 pz × €465.75 × 4.15 ≈ €1.932,86
```

---

## 7. Fallback Prezzi e Stima da Preventivo

### 7.1 Tre Percorsi

Per i prodotti owned senza `manufacturer_cost_price`, il sistema gestisce tre percorsi in ordine di priorità:

**Percorso 1 — Inserimento prezzo d'acquisto (priorità massima)**

Quando viene registrato un `manufacturer_cost_price` su un prodotto:
1. Il sistema calcola il `BaseDay` esplicito usando i parametri del Rental Profile della categoria
2. Ricalcola automaticamente tutti i prezzi rental (`rental_daily`, `rental_weekly`, `rental_monthly`, `rental_seasonal`, `rental_hourly`, `rental_half_day`) in `price_list_items`
3. Azzera `rental_price_estimated = false` e `estimated_base_day = null`
4. Dispatcha `ProductPurchasePriceUpdated` event per il ricalcolo via job

**Percorso 2 — Stima da preventivo (priorità media)**

Quando in un preventivo viene inserito manualmente un prezzo su un prodotto owned senza `manufacturer_cost_price`:
1. Il sistema calcola il `BaseDay` implicito da quel prezzo e dalla durata del preventivo
2. Salva `estimated_base_day` sul prodotto con flag `rental_price_estimated = true`
3. Il prezzo appare nel preventivo con label "Prezzo stimato da preventivo — da verificare"
4. La scheda prodotto mostra badge "Prezzo noleggio: stima da preventivo"
5. Quando poi viene aggiunto il prezzo d'acquisto reale, il flag si azzera e i prezzi si ricalcolano (Percorso 1)

**Percorso 3 — Legacy fallback (priorità minima)**

Quando non è disponibile né `manufacturer_cost_price` né `estimated_base_day`, il sistema usa il setting esistente:
- `rental.daily_rate_percent` (default 15%) applicato al `sale_price` del prodotto
- Questo fallback rimane permanentemente nel codice per retrocompatibilità

### 7.2 Logica di Selezione del BaseDay

```php
// In RentalEngineService::resolveBaseDay(Product $product): float

public function resolveBaseDay(Product $product): BaseDayResult
{
    // Percorso 1: prezzo d'acquisto reale
    if ($product->manufacturer_cost_price) {
        $profile = $this->resolveRentalProfile($product);
        return new BaseDayResult(
            baseDay: ($product->manufacturer_cost_price / $profile->break_even_days)
                     * (1 + $profile->margin_percentage / 100),
            isEstimated: false,
            source: 'purchase_price',
        );
    }

    // Percorso 2: stima da preventivo
    if ($product->rental_price_estimated && $product->estimated_base_day) {
        return new BaseDayResult(
            baseDay: $product->estimated_base_day,
            isEstimated: true,
            source: 'quote_estimate',
        );
    }

    // Percorso 3: legacy fallback
    $dailyRatePercent = (float) Setting::get('rental.daily_rate_percent', 15);
    return new BaseDayResult(
        baseDay: $product->sale_price * ($dailyRatePercent / 100),
        isEstimated: true,
        source: 'legacy_daily_rate',
    );
}
```

### 7.3 UI — Warning nel Preventivo

Per le voci di preventivo con `rental_price_estimated = true`:
- Label aggiuntiva sotto il prezzo: "Prezzo stimato da preventivo — da verificare"
- Icona warning arancione
- Il preventivo può essere inviato normalmente, ma la voce è segnalata

---

## 8. Sub-rental Intelligente

### 8.1 Modalità di Pricing

Il setting `subrental.pricing_mode` controlla il comportamento globale:

**`flexible_with_alert`** (default):
- Il preventivo con voci sub-rental è confermabile anche senza costo fornitore
- Se il margine scende sotto `subrental.min_margin_percent` (15%), viene mostrato un alert
- Il commerciale decide consapevolmente se procedere

**`block`**:
- Il preventivo con voci sub-rental non è confermabile finché il costo fornitore non è inserito per tutte le voci
- Modalità adatta ad aziende che non vogliono rischiare margin squeeze

### 8.2 Selezione Fornitore

Il setting `subrental.auto_supplier_selection` controlla la selezione:

**`auto`** (default):
- Il sistema propone il fornitore con score migliore
- L'utente può sovrascrivere la scelta

**`manual`**:
- L'utente sceglie sempre il fornitore dalla lista

**Calcolo Score Fornitore:**

```
Score = (prezzo_normalizzato × price_weight) + (reliability_score × reliability_weight)

prezzo_normalizzato = 1 - (day_rate - min_rate) / (max_rate - min_rate)
reliability_score   = campo 0-5 su product_subrental_suppliers

price_weight       = subrental.price_weight       (default 0.60)
reliability_weight = subrental.reliability_weight (default 0.40)
```

Il fornitore con score più alto viene proposto come preferito. Il campo `is_preferred` su `product_subrental_suppliers` può sovrascrivere il calcolo automatico (preferito manuale).

### 8.3 Formula Prezzo Sub-Rental

```
SupplierCost   = SupplierDayRate × DurationMultiplier × qty
ClientPrice    = SupplierCost × (1 + subrental_markup) × CommercialFactor
MarginPercent  = (ClientPrice - SupplierCost) / ClientPrice × 100
```

Dove `subrental_markup` è:
1. `product.subrental_markup` se non NULL (override prodotto)
2. `subrental.markup_default` (setting globale, default 0.30)

### 8.4 Alert Soglia Margine

Se `MarginPercent < subrental.min_margin_percent`:
- Nel preventivo: banner arancione "Margine sotto soglia su N prodotti in sub-noleggio"
- Dettaglio voce: indicatore rosso con margine attuale vs soglia

### 8.5 Storico Costi (subrental_cost_history)

Ad ogni preventivo confermato con voci sub-rental, viene registrato un record in `subrental_cost_history` tramite `RecordSubrentalCostAction`. Questo alimenta:
- L'analisi buy-vs-rent nella Dashboard KPI (Fase 4)
- Lo storico prezzi per fornitore visibile nella scheda prodotto

---

## 9. Rental Profiles Multi-Settore

### 9.1 Concetto e Filosofia

I Rental Profiles nascono dall'esigenza concreta di DGGM: l'azienda opera in due rami di business con economics profondamente diverse.

**Ramo AV/Service** (audio, video, luci per eventi): i costi fissi per evento sono elevati indipendentemente dalla durata (trasporto, setup, operatori), il ciclo di noleggio è tipicamente breve (1-7 giorni), e il break-even si raggiunge in ~40 noleggi giornalieri. La curva deve essere più aggressiva nelle prime giornate per compensare l'overhead operativo.

**Ramo Elettrico/Automazione/Allarmi/Domotica**: attrezzatura generalmente più robusta, cicli di noleggio più lunghi (settimane o mesi per cantieri), costi di setup più bassi. Break-even più lungo (~60 giorni) ma con curva più lineare perché il valore dell'attrezzatura si distribuisce meglio su durate maggiori.

**Perché non un unico set di parametri globali?** Perché usare `break_even_days=40` per una cassa audio e per un quadro elettrico produce prezzi sbagliati: la cassa verrebbe sottopagata nei noleggi lunghi, il quadro sopravvalutato nei noleggi brevi.

**Gerarchia di configurazione** (dalla più specifica alla meno specifica):

```
Settings globali rental.*        ← fallback finale per tutto il sistema
    ↑ sovrascrivono
Rental Profile di categoria      ← parametri specifici per tipo di prodotto
    ↑ (futuro) sovrascritto da
Override per singolo prodotto    ← non implementato nella v2, roadmap futura
```

Il profilo con `is_default = true` è solo un suggerimento UI (evidenziato nel form di selezione) — non ha effetti automatici nel codice. Il vero fallback finale rimane sempre i settings globali `rental.*`.

---

### 9.2 Struttura Dati Completa (tabella `rental_profiles`)

La tabella contiene tutti i parametri necessari alla formula GYMME più i parametri economici e le opzioni di scarcity/premium specifiche per settore.

| Colonna | Tipo | Default | Descrizione |
|---------|------|---------|-------------|
| `id` | `BIGINT UNSIGNED` | AUTO_INCREMENT | Chiave primaria |
| `name` | `VARCHAR(100)` | — | Nome leggibile del profilo (es. "AV/Service") |
| `code` | `VARCHAR(50)` | — | Codice univoco machine-readable (es. `av_service`) |
| `description` | `TEXT NULL` | NULL | Descrizione opzionale del settore/uso |
| `break_even_days` | `INT` | 40 | Giorni di noleggio per ammortizzare il prezzo di acquisto |
| `margin_percentage` | `DECIMAL(5,2)` | 20.00 | Margine % aggiunto al BaseDay dopo il break-even |
| `exponent_curve` | `DECIMAL(6,4)` | 0.8400 | Esponente della curva potenza nella formula GYMME; valori più alti producono una curva più lineare (meno sconto sulle durate lunghe) |
| `duration_offset` | `DECIMAL(6,4)` | 0.0200 | Offset additivo nella formula GYMME per aggiustamenti di scala |
| `decay_strength` | `DECIMAL(6,4)` | 0.1200 | Forza del decadimento logaritmico; valori più alti aumentano lo sconto sulle durate lunghe |
| `max_duration_reference` | `INT` | 30 | Giorni di riferimento per normalizzare il decadimento (tipicamente 30) |
| `max_period_cap_days` | `INT` | 90 | Soglia stagionale: per durate superiori il moltiplicatore non scende mai sotto `Mult(max_period_cap_days)` |
| `scarcity_enabled` | `TINYINT(1)` | 0 | Ogni profilo può avere scarcity attivo/disattivo indipendentemente dal globale |
| `scarcity_threshold` | `DECIMAL(4,2) NULL` | 0.30 | Ratio disponibilità (0-1) sotto cui si applica lo ScarcityFactor (rilevante solo se `scarcity_enabled = 1`) |
| `scarcity_multiplier` | `DECIMAL(4,2) NULL` | 1.10 | Moltiplicatore scarcity quando la disponibilità è sotto soglia |
| `premium_multiplier` | `DECIMAL(4,2)` | 1.15 | Moltiplicatore per prodotti marcati `is_premium = true` in questa categoria |
| `is_default` | `TINYINT(1)` | 0 | Solo un profilo può avere `is_default = true`; evidenziato nell'UI come suggerimento |
| `is_active` | `TINYINT(1)` | 1 | Profilo disattivato non viene assegnato a nuove categorie |
| `created_at` | `TIMESTAMP NULL` | — | Gestito da Laravel |
| `updated_at` | `TIMESTAMP NULL` | — | Gestito da Laravel |

**Vincoli**: `UNIQUE KEY` su `code`; `INDEX` composito su `(is_default, is_active)` per la query di lookup.

---

### 9.3 Profili Predefiniti con Parametri

I tre profili creati dal seeder coprono i rami di business DGGM e il settore edilizia (eventuale espansione futura).

| Campo | AV/Service | Elettrico/Automazione | Edilizia | Logica della differenza |
|-------|------------|----------------------|----------|------------------------|
| `break_even_days` | **40** | **60** | **80** | AV ha rotazione più alta (molti noleggi brevi); edilizia ha cicli lunghi ma meno frequenti |
| `margin_percentage` | **20** | **20** | **15** | AV e Elettrico mantengono lo stesso margine; edilizia scende al 15% per competere su prezzi di mercato più standardizzati |
| `exponent_curve` | **0.84** | **0.87** | **0.92** | AV ha curva più aggressiva (sconto più marcato sulle durate lunghe); edilizia quasi lineare perché il costo è costante nel tempo |
| `duration_offset` | **0.02** | **0.01** | **0.00** | AV ha overhead operativo anche per durate minime (setup eventi); edilizia ha costi proporzionali alla durata |
| `decay_strength` | **0.12** | **0.08** | **0.05** | AV scontistica più aggressiva per durate lunghe; edilizia quasi nessuno sconto perché il costo del materiale non diminuisce |
| `max_duration_reference` | **30** | **30** | **60** | Edilizia normalizza il decadimento su 2 mesi invece di 1 perché i noleggi tipici sono più lunghi |
| `max_period_cap_days` | **90** | **120** | **180** | AV raramente supera i 3 mesi; attrezzatura edilizia può restare su cantiere 6 mesi |
| `scarcity_enabled` | **true** | **false** | **false** | AV ha stock limitato di attrezzatura premium per eventi (mixer high-end, luci specializzate); elettrico ed edilizia hanno tipicamente scorte più ampie o sub-noleggio disponibile |
| `scarcity_threshold` | **0.30** | — | — | Scatta quando rimane meno del 30% dello stock disponibile |
| `scarcity_multiplier` | **1.10** | — | — | +10% quando la disponibilità è sotto soglia |
| `premium_multiplier` | **1.15** | **1.10** | **1.05** | AV ha più prodotti premium (console flagship, proiettori laser); edilizia premium quasi assente |
| `is_default` | **false** | **false** | **false** | Nessun profilo predefinito come default — il fallback globale sono i settings `rental.*` |

**Note sui profili DGGM**:

- **AV/Service** ha la curva più aggressiva (`exponent_curve=0.84`, `decay_strength=0.12`) perché i costi fissi per evento (trasporto furgone, tecnico audio, setup) incidono proporzionalmente molto di più su un noleggio da 1-3 giorni rispetto a uno da 7 giorni. Lo sconto sulle durate lunghe remunera il cliente per la pianificazione anticipata.
- **Elettrico/Automazione** ha una curva intermedia: i costi di installazione e collaudo esistono ma sono inferiori all'AV, e i cantieri elettrici hanno spesso durate meno prevedibili che rendono gli sconti aggressivi rischiosi.
- **Edilizia** (profilo per espansione futura) ha curva quasi lineare (`exponent_curve=0.92`) perché ponteggi e attrezzatura pesante hanno costi di manutenzione proporzionali alla durata e il mercato è molto price-sensitive con listini di riferimento standard.

---

### 9.4 Esempio Calcolo per Profilo

**Prodotto di riferimento**: cassa audio attiva professionale, prezzo di acquisto €1.000.

**Calcolo BaseDay per profilo:**

```
BaseDay (AV/Service)   = (€1.000 / 40) × (1 + 20/100) = €25 × 1.20 = €30.00/giorno
BaseDay (Elettrico)    = (€1.000 / 60) × (1 + 20/100) = €16.67 × 1.20 = €20.00/giorno
```

**Tabella prezzi periodi standard (DurationMultiplier post-calibrazione):**

| Periodo | Mult | Prezzo AV/Service | Prezzo Elettrico/Automazione |
|---------|------|-------------------|------------------------------|
| Orario | — | BaseDay ÷ 8 × 1.2 = **€4.50** | BaseDay ÷ 8 × 1.2 = **€3.00** |
| Mezza giornata | — | BaseDay × 0.7 = **€21.00** | BaseDay × 0.7 = **€14.00** |
| 1 giorno | 1.00× | **€30.00** | **€20.00** |
| 7 giorni (settimana) | ~3.52× | **€105.60** | **€70.40** |
| 30 giorni (mensile) | ~7.60× | **€228.00** | **€152.00** |
| 90 giorni (stagionale) | ~14.5× | **€435.00** | **€290.00** |

I DurationMultiplier sono identici tra profili perché dipendono dai parametri della curva GYMME, non dal BaseDay. La differenza di prezzo è interamente determinata dal `break_even_days` diverso tra i due profili.

**Lettura pratica**: con il profilo AV/Service la cassa raggiunge il break-even dopo 40 noleggi giornalieri, ovvero 40 giorni di noleggio totale distribuiti su più eventi. Con il profilo Elettrico il break-even richiede 60 giorni — più conservativo, riflettendo una frequenza di noleggio tipicamente inferiore per questo tipo di attrezzatura.

---

### 9.5 Gerarchia di Applicazione (completa)

```
Prodotto X (es: cassa audio RCF ART 910-A)
  └── product_categories.rental_profile_id
        ├── Se valorizzato (es: profilo "AV/Service")
        │     └── Usa TUTTI i parametri del rental_profile trovato
        │           (break_even_days, margin_percentage, exponent_curve,
        │            duration_offset, decay_strength, max_duration_reference,
        │            max_period_cap_days, scarcity_enabled, scarcity_threshold,
        │            scarcity_multiplier, premium_multiplier)
        └── Se NULL (categoria senza profilo assegnato)
              └── Usa settings globali rental.*
                    (rental.break_even_days, rental.margin_percentage, ecc.)
                    Non esiste un "profilo default automatico":
                    il campo is_default=true è solo un suggerimento UI
                    per evidenziare quale profilo è più usato, non produce
                    nessun effetto nel codice di risoluzione
```

**Nota importante**: l'override per singolo prodotto (`products.rental_profile_id`) non è implementato nella v2. La gerarchia si ferma alla categoria. Questa limitazione è intenzionale: avere parametri diversi per prodotti nella stessa categoria creerebbe incoerenze di pricing difficili da gestire e comunicare al commerciale.

---

### 9.6 SQL — Migration e Struttura DB

**1. Creazione tabella `rental_profiles`:**

```sql
CREATE TABLE rental_profiles (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(50) NOT NULL,
    description TEXT NULL,
    break_even_days INT NOT NULL DEFAULT 40,
    margin_percentage DECIMAL(5,2) NOT NULL DEFAULT 20.00,
    exponent_curve DECIMAL(6,4) NOT NULL DEFAULT 0.8400,
    duration_offset DECIMAL(6,4) NOT NULL DEFAULT 0.0200,
    decay_strength DECIMAL(6,4) NOT NULL DEFAULT 0.1200,
    max_duration_reference INT NOT NULL DEFAULT 30,
    max_period_cap_days INT NOT NULL DEFAULT 90,
    scarcity_enabled TINYINT(1) NOT NULL DEFAULT 0,
    scarcity_threshold DECIMAL(4,2) NULL DEFAULT 0.30,
    scarcity_multiplier DECIMAL(4,2) NULL DEFAULT 1.10,
    premium_multiplier DECIMAL(4,2) NOT NULL DEFAULT 1.15,
    is_default TINYINT(1) NOT NULL DEFAULT 0,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL,
    PRIMARY KEY (id),
    UNIQUE KEY rental_profiles_code_unique (code),
    KEY rental_profiles_is_default_is_active_index (is_default, is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**2. Aggiunta FK a `product_categories`:**

```sql
ALTER TABLE product_categories
    ADD COLUMN rental_profile_id BIGINT UNSIGNED NULL AFTER is_active,
    ADD CONSTRAINT product_categories_rental_profile_id_foreign
        FOREIGN KEY (rental_profile_id) REFERENCES rental_profiles (id)
        ON DELETE SET NULL ON UPDATE CASCADE;
```

Il `ON DELETE SET NULL` garantisce che se un profilo viene eliminato, le categorie collegate tornino automaticamente al fallback globale senza errori.

---

### 9.7 Laravel: Nomi Migration e Modello

**Migration files** (rispettare l'ordine numerico — `rental_profiles` deve esistere prima della FK su `product_categories`):

```
2026_02_20_000001_create_rental_profiles_table.php
2026_02_20_000002_add_rental_profile_id_to_product_categories_table.php
```

**Modello `App\Models\RentalProfile`:**

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class RentalProfile extends Model
{
    protected $fillable = [
        'name',
        'code',
        'description',
        'break_even_days',
        'margin_percentage',
        'exponent_curve',
        'duration_offset',
        'decay_strength',
        'max_duration_reference',
        'max_period_cap_days',
        'scarcity_enabled',
        'scarcity_threshold',
        'scarcity_multiplier',
        'premium_multiplier',
        'is_default',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'break_even_days'        => 'integer',
            'margin_percentage'      => 'decimal:2',
            'exponent_curve'         => 'decimal:4',
            'duration_offset'        => 'decimal:4',
            'decay_strength'         => 'decimal:4',
            'max_duration_reference' => 'integer',
            'max_period_cap_days'    => 'integer',
            'scarcity_enabled'       => 'boolean',
            'scarcity_threshold'     => 'decimal:2',
            'scarcity_multiplier'    => 'decimal:2',
            'premium_multiplier'     => 'decimal:2',
            'is_default'             => 'boolean',
            'is_active'              => 'boolean',
        ];
    }

    public function productCategories(): HasMany
    {
        return $this->hasMany(ProductCategory::class);
    }

    /** Restituisce tutti i parametri della formula come array flat per RentalEngineService. */
    public function toParameterArray(): array
    {
        return [
            'break_even_days'        => $this->break_even_days,
            'margin_percentage'      => (float) $this->margin_percentage,
            'exponent_curve'         => (float) $this->exponent_curve,
            'duration_offset'        => (float) $this->duration_offset,
            'decay_strength'         => (float) $this->decay_strength,
            'max_duration_reference' => $this->max_duration_reference,
            'max_period_cap_days'    => $this->max_period_cap_days,
            'scarcity_enabled'       => $this->scarcity_enabled,
            'scarcity_threshold'     => (float) $this->scarcity_threshold,
            'scarcity_multiplier'    => (float) $this->scarcity_multiplier,
            'premium_multiplier'     => (float) $this->premium_multiplier,
        ];
    }
}
```

**Relazione in `ProductCategory`:**

```php
// In app/Models/ProductCategory.php
use Illuminate\Database\Eloquent\Relations\BelongsTo;

public function rentalProfile(): BelongsTo
{
    return $this->belongsTo(RentalProfile::class);
}
```

---

### 9.8 Seeder: RentalProfileSeeder

```php
<?php

namespace Database\Seeders;

use App\Models\RentalProfile;
use Illuminate\Database\Seeder;

class RentalProfileSeeder extends Seeder
{
    public function run(): void
    {
        $profiles = [
            [
                'name'                   => 'AV/Service',
                'code'                   => 'av_service',
                'description'            => 'Audio, video, luci, backline per eventi e spettacoli. Break-even breve, curva aggressiva, scarcity attivo per stock limitato.',
                'break_even_days'        => 40,
                'margin_percentage'      => 20.00,
                'exponent_curve'         => 0.8400,
                'duration_offset'        => 0.0200,
                'decay_strength'         => 0.1200,
                'max_duration_reference' => 30,
                'max_period_cap_days'    => 90,
                'scarcity_enabled'       => true,
                'scarcity_threshold'     => 0.30,
                'scarcity_multiplier'    => 1.10,
                'premium_multiplier'     => 1.15,
                'is_default'             => false,
                'is_active'              => true,
            ],
            [
                'name'                   => 'Elettrico/Automazione',
                'code'                   => 'electrical_automation',
                'description'            => 'Quadri elettrici, cavi, strumenti di misura, sistemi di automazione, allarmi e domotica. Cicli di noleggio medi, curva intermedia.',
                'break_even_days'        => 60,
                'margin_percentage'      => 20.00,
                'exponent_curve'         => 0.8700,
                'duration_offset'        => 0.0100,
                'decay_strength'         => 0.0800,
                'max_duration_reference' => 30,
                'max_period_cap_days'    => 120,
                'scarcity_enabled'       => false,
                'scarcity_threshold'     => null,
                'scarcity_multiplier'    => null,
                'premium_multiplier'     => 1.10,
                'is_default'             => false,
                'is_active'              => true,
            ],
            [
                'name'                   => 'Edilizia',
                'code'                   => 'construction',
                'description'            => 'Ponteggi, casseforme, attrezzatura pesante da cantiere. Break-even lungo, curva quasi lineare, noleggi stagionali fino a 6 mesi.',
                'break_even_days'        => 80,
                'margin_percentage'      => 15.00,
                'exponent_curve'         => 0.9200,
                'duration_offset'        => 0.0000,
                'decay_strength'         => 0.0500,
                'max_duration_reference' => 60,
                'max_period_cap_days'    => 180,
                'scarcity_enabled'       => false,
                'scarcity_threshold'     => null,
                'scarcity_multiplier'    => null,
                'premium_multiplier'     => 1.05,
                'is_default'             => false,
                'is_active'              => true,
            ],
        ];

        foreach ($profiles as $profileData) {
            RentalProfile::updateOrCreate(
                ['code' => $profileData['code']],
                $profileData
            );
        }
    }
}
```

Il seeder usa `updateOrCreate` per essere idempotente: può essere eseguito più volte senza creare duplicati. Aggiornare `DatabaseSeeder.php` aggiungendo `RentalProfileSeeder::class` prima di `RentalSettingsSeeder::class` (i profili devono esistere prima che il seeder dei settings possa fare riferimento ad essi).

---

### 9.9 Come Usa il RentalEngineService il Profilo

Il service risolve i parametri del profilo in un unico punto centralizzato. Tutta la logica di fallback è incapsulata qui — nessun'altra classe deve sapere come si risolve un profilo.

```php
// In app/Services/RentalEngineService.php (Fase 2)

public function resolveProfile(?ProductCategory $category): array
{
    // Percorso 1: categoria con profilo assegnato
    if ($category && $category->rentalProfile && $category->rentalProfile->is_active) {
        return $category->rentalProfile->toParameterArray();
    }

    // Percorso 2: fallback ai settings globali
    // Nota: il campo is_default=true NON è usato come fallback automatico nel codice.
    // È solo un indicatore UI. Il fallback vero sono sempre i settings globali.
    return [
        'break_even_days'        => (int) Setting::get('rental.break_even_days', 40),
        'margin_percentage'      => (float) Setting::get('rental.margin_percentage', 20),
        'exponent_curve'         => (float) Setting::get('rental.exponent_curve', 0.84),
        'duration_offset'        => (float) Setting::get('rental.duration_offset', 0.02),
        'decay_strength'         => (float) Setting::get('rental.decay_strength', 0.12),
        'max_duration_reference' => (int) Setting::get('rental.max_duration_reference', 30),
        'max_period_cap_days'    => (int) Setting::get('rental.max_period_cap_days', 90),
        'scarcity_enabled'       => filter_var(Setting::get('rental.scarcity_enabled', false), FILTER_VALIDATE_BOOLEAN),
        'scarcity_threshold'     => (float) Setting::get('rental.scarcity_threshold', 0.30),
        'scarcity_multiplier'    => (float) Setting::get('rental.scarcity_multiplier', 1.10),
        'premium_multiplier'     => (float) Setting::get('rental.premium_multiplier', 1.15),
    ];
}
```

Il metodo `resolveProfile()` viene chiamato ogni volta che `RentalEngineService` deve calcolare un prezzo. Per il ricalcolo batch (job `RecalculateRentalPricesJob`), il profilo viene risolto una volta per categoria e riusato per tutti i prodotti della stessa categoria.

---

### 9.10 UI: Gestione Profili (Fase 5)

L'interfaccia di gestione dei Rental Profiles è pianificata per la Fase 5. Componenti principali:

**Pagina Settings → tab "Profili Noleggio"**
- Lista profili con colonne: Nome, Codice, Break-Even, Margine, Categorie Assegnate, Stato
- Badge colorato per profilo con `scarcity_enabled = true`
- Pulsante "Nuovo Profilo" apre form modale
- Pulsante "Ricalcola prezzi" per ogni profilo (esegue `RecalculateRentalPricesJob` in coda)

**Form modifica profilo**
- Campi divisi in tre sezioni: Parametri Economici, Parametri Curva GYMME, Scarcity & Premium
- Preview formula in tempo reale: tabella `1gg / 7gg / 30gg / 90gg` che si aggiorna mentre si cambiano i parametri (calcolata in JavaScript con la funzione `calculateDurationMultiplier` dal file `rental-engine.ts`)
- Grafico curva (opzionale, Fase 5 avanzata)

**Scheda categoria prodotto**
- Dropdown "Profilo Noleggio" con lista profili attivi
- Preview dei prezzi standard per la categoria dopo la selezione
- Badge "Profilo: AV/Service" visibile nell'elenco categorie

**Lista categorie**
- Colonna "Profilo" con badge colorato che mostra il profilo assegnato
- Filtro "Senza profilo" per trovare categorie che usano il fallback globale

---

### 9.11 Futuro: Override per Prodotto (non implementato)

In futuro sarà possibile aggiungere `rental_profile_id` direttamente alla tabella `products`, oppure un campo `break_even_days` diretto a livello prodotto (per casi specifici come prodotti con prezzo di acquisto noto ma break-even diverso dalla categoria).

La gerarchia diventerà:

```
settings globali rental.*
    ← sovrascritta da
Rental Profile della categoria
    ← sovrascritta da (FUTURO)
Rental Profile del singolo prodotto  ← products.rental_profile_id
    ← sovrascritta da (FUTURO)
Override diretto prodotto             ← products.break_even_days_override
```

Per ora la gerarchia si ferma alla categoria. Aggiungere l'override per prodotto richiederà una migration aggiuntiva e l'aggiornamento del metodo `resolveProfile()` in `RentalEngineService`.

---

## 10. Settings Completi

### 10.1 Gruppo `rental`

| Chiave | Default | Tipo | Descrizione |
|--------|---------|------|-------------|
| `rental.break_even_days` | 40 | integer | Giorni noleggio per ammortizzare il costo di acquisto (fallback globale) |
| `rental.margin_percentage` | 20 | decimal | Margine % sul BaseDay calcolato (fallback globale) |
| `rental.exponent_curve` | 0.84 | decimal | Esponente curva GYMME (da calibrare) |
| `rental.duration_offset` | 0.02 | decimal | Offset additivo GYMME |
| `rental.decay_strength` | 0.12 | decimal | Forza decadimento logaritmico GYMME |
| `rental.max_duration_reference` | 30 | integer | Riferimento normalizzazione decadimento |
| `rental.max_period_cap_days` | 90 | integer | Soglia floor stagionale |
| `rental.scarcity_enabled` | false | boolean | Abilita scarcity pricing |
| `rental.scarcity_threshold` | 0.30 | decimal | Ratio disponibilità sotto cui si applica scarcity |
| `rental.scarcity_multiplier` | 1.10 | decimal | Moltiplicatore scarcity (+10%) |
| `rental.premium_multiplier` | 1.15 | decimal | Moltiplicatore prodotti premium (+15%) |
| `rental.daily_rate_percent` | 15 | decimal | **LEGACY FALLBACK** — % di sale_price per calcolo giornaliero |

### 10.2 Gruppo `rental` — Deprecati

> Mantenere i record in DB, non usare nel codice nuovo. Mostrare come deprecati nell'UI Settings.

| Chiave | Valore attuale | Motivo deprecazione |
|--------|---------------|---------------------|
| `rental.weekly_multiplier` | ~2.646 (√7) | Sostituito dalla formula GYMME |
| `rental.monthly_multiplier` | ~5.477 (√30) | Sostituito dalla formula GYMME |

### 10.3 Gruppo `pricing`

| Chiave | Default | Tipo | Descrizione |
|--------|---------|------|-------------|
| `pricing.commercial_index_global` | 1.00 | decimal | Indice commerciale globale applicato a tutti i prezzi noleggio |

### 10.4 Gruppo `subrental` (nuovo)

| Chiave | Default | Tipo | Descrizione |
|--------|---------|------|-------------|
| `subrental.markup_default` | 0.30 | decimal | Markup default su costo fornitore sub-noleggio (30%) |
| `subrental.pricing_mode` | flexible_with_alert | string | `block` o `flexible_with_alert` |
| `subrental.min_margin_percent` | 15 | decimal | Soglia margine % sotto cui scatta l'alert |
| `subrental.auto_supplier_selection` | auto | string | `auto` o `manual` |
| `subrental.price_weight` | 0.60 | decimal | Peso del prezzo nel calcolo score fornitore |
| `subrental.reliability_weight` | 0.40 | decimal | Peso della reliability nel calcolo score fornitore |

---

## 11. Schema DB — Modifiche Necessarie

### 11.1 Tabella `products` — Nuove Colonne

```sql
ALTER TABLE products
    ADD COLUMN ownership_type ENUM('owned', 'subrental', 'mixed') NOT NULL DEFAULT 'owned'
        COMMENT 'Tipo di proprietà del prodotto per scopo noleggio'
        AFTER is_rentable,

    ADD COLUMN is_premium BOOLEAN NOT NULL DEFAULT FALSE
        COMMENT 'Prodotto premium — applica premium_multiplier al prezzo noleggio'
        AFTER ownership_type,

    ADD COLUMN subrental_markup DECIMAL(5, 2) NULL
        COMMENT 'Override markup sub-noleggio per questo prodotto (NULL = usa setting globale)'
        AFTER is_premium,

    ADD COLUMN rental_price_estimated BOOLEAN NOT NULL DEFAULT FALSE
        COMMENT 'Il prezzo noleggio è una stima da preventivo, non da prezzo acquisto reale'
        AFTER subrental_markup,

    ADD COLUMN estimated_base_day DECIMAL(10, 2) NULL
        COMMENT 'BaseDay stimato da un preventivo manuale quando manca manufacturer_cost_price'
        AFTER rental_price_estimated;
```

**NON aggiungere** `rental_profile_id` a `products` — solo `product_categories` riceve questa FK.

### 11.2 Tabella `price_list_items` — Nuove Colonne

```sql
ALTER TABLE price_list_items
    ADD COLUMN rental_hourly DECIMAL(10, 2) NULL
        COMMENT 'Prezzo orario noleggio = BaseDay / 8 × 1.2'
        AFTER is_manual_price,

    ADD COLUMN rental_half_day DECIMAL(10, 2) NULL
        COMMENT 'Prezzo mezza giornata noleggio = BaseDay × 0.7'
        AFTER rental_hourly,

    ADD COLUMN rental_seasonal DECIMAL(10, 2) NULL
        COMMENT 'Prezzo stagionale noleggio (90 gg) = BaseDay × Mult(90)'
        AFTER rental_monthly;
```

### 11.3 Tabella `price_lists` — Modifica Enum

```sql
-- Aggiungere 'multiplier' all'enum adjustment_type
ALTER TABLE price_lists
    MODIFY COLUMN adjustment_type ENUM('percentage', 'fixed', 'multiplier') NOT NULL DEFAULT 'percentage';
```

### 11.4 Tabella `quote_items` — Rimozione `is_degressive`

```sql
-- Rimuovere il campo mai usato in produzione
ALTER TABLE quote_items
    DROP COLUMN is_degressive;
```

### 11.5 Tabella `product_categories` — Nuovo FK

```sql
ALTER TABLE product_categories
    ADD COLUMN rental_profile_id BIGINT UNSIGNED NULL
        COMMENT 'Rental Profile per questa categoria (NULL = usa profilo default)'
        AFTER id,

    ADD CONSTRAINT product_categories_rental_profile_id_fk
        FOREIGN KEY (rental_profile_id) REFERENCES rental_profiles (id) ON DELETE SET NULL;
```

### 11.6 Nuova Tabella `rental_profiles`

```sql
CREATE TABLE rental_profiles (
    id                      BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    name                    VARCHAR(255)    NOT NULL,
    code                    VARCHAR(50)     NOT NULL,
    break_even_days         INT UNSIGNED    NOT NULL DEFAULT 40,
    margin_percentage       DECIMAL(5, 2)   NOT NULL DEFAULT 20.00,
    exponent_curve          DECIMAL(6, 4)   NOT NULL DEFAULT 0.8400,
    duration_offset         DECIMAL(6, 4)   NOT NULL DEFAULT 0.0200,
    decay_strength          DECIMAL(6, 4)   NOT NULL DEFAULT 0.1200,
    max_duration_reference  INT UNSIGNED    NOT NULL DEFAULT 30,
    max_period_cap_days     INT UNSIGNED    NOT NULL DEFAULT 90,
    is_default              BOOLEAN         NOT NULL DEFAULT FALSE,
    is_active               BOOLEAN         NOT NULL DEFAULT TRUE,
    created_at              TIMESTAMP       NULL,
    updated_at              TIMESTAMP       NULL,

    PRIMARY KEY (id),
    UNIQUE KEY rental_profiles_code_unique (code),
    INDEX rental_profiles_is_default_index (is_default),
    INDEX rental_profiles_is_active_index (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Profili di esempio (da inserire via seeder)
INSERT INTO rental_profiles
    (name, code, break_even_days, margin_percentage, exponent_curve, duration_offset,
     decay_strength, max_duration_reference, max_period_cap_days, is_default, is_active)
VALUES
    ('AV/Service',           'av_service',      40, 20.00, 0.84, 0.02, 0.12, 30, 90, TRUE,  TRUE),
    ('Elettrico/Automazione','electrical',       60, 20.00, 0.84, 0.02, 0.12, 30, 90, FALSE, TRUE),
    ('Edilizia',             'construction',     80, 15.00, 0.84, 0.02, 0.12, 30, 90, FALSE, TRUE);
```

### 11.7 Nuova Tabella `product_subrental_suppliers`

Separata dalla pivot `supplier_product` (che gestisce gli acquisti), questa tabella è specifica per il sub-noleggio.

```sql
CREATE TABLE product_subrental_suppliers (
    id                BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    product_id        BIGINT UNSIGNED NOT NULL,
    supplier_id       BIGINT UNSIGNED NOT NULL,
    day_rate          DECIMAL(10, 2)  NOT NULL
        COMMENT 'Costo giornaliero del fornitore per questo prodotto',
    reliability_score DECIMAL(3, 1)   NOT NULL DEFAULT 3.0
        COMMENT 'Score affidabilità fornitore 0.0–5.0',
    is_preferred      BOOLEAN         NOT NULL DEFAULT FALSE
        COMMENT 'Fornitore preferito manualmente (sovrascrive score automatico)',
    last_updated      DATE            NULL
        COMMENT 'Data ultimo aggiornamento prezzo',
    notes             TEXT            NULL,
    created_at        TIMESTAMP       NULL,
    updated_at        TIMESTAMP       NULL,

    PRIMARY KEY (id),
    UNIQUE KEY product_subrental_suppliers_product_supplier_unique (product_id, supplier_id),
    INDEX product_subrental_suppliers_product_id_index (product_id),
    INDEX product_subrental_suppliers_supplier_id_index (supplier_id),

    CONSTRAINT product_subrental_suppliers_product_id_fk
        FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE CASCADE,
    CONSTRAINT product_subrental_suppliers_supplier_id_fk
        FOREIGN KEY (supplier_id) REFERENCES suppliers (id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### 11.8 Nuova Tabella `subrental_cost_history`

```sql
CREATE TABLE subrental_cost_history (
    id               BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    product_id       BIGINT UNSIGNED NOT NULL,
    supplier_id      BIGINT UNSIGNED NOT NULL,
    quote_id         BIGINT UNSIGNED NULL
        COMMENT 'NULL per costi storici non legati a preventivo',
    actual_cost      DECIMAL(10, 2)  NOT NULL
        COMMENT 'Costo totale effettivo pagato al fornitore',
    duration_days    DECIMAL(10, 2)  NOT NULL
        COMMENT 'Durata effettiva in giorni',
    margin_generated DECIMAL(10, 2)  NULL
        COMMENT 'Margine generato = prezzo cliente - costo fornitore',
    date             DATE            NOT NULL,
    created_at       TIMESTAMP       NULL,
    updated_at       TIMESTAMP       NULL,

    PRIMARY KEY (id),
    INDEX subrental_cost_history_product_id_index (product_id),
    INDEX subrental_cost_history_supplier_id_index (supplier_id),
    INDEX subrental_cost_history_quote_id_index (quote_id),
    INDEX subrental_cost_history_date_index (date),

    CONSTRAINT subrental_cost_history_product_id_fk
        FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE RESTRICT,
    CONSTRAINT subrental_cost_history_supplier_id_fk
        FOREIGN KEY (supplier_id) REFERENCES suppliers (id) ON DELETE RESTRICT,
    CONSTRAINT subrental_cost_history_quote_id_fk
        FOREIGN KEY (quote_id) REFERENCES quotes (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### 11.9 Settings — Record da Inserire

```sql
INSERT INTO settings (group, `key`, value, type, description, created_at, updated_at) VALUES

-- Gruppo rental: parametri formula GYMME
('rental', 'rental.exponent_curve',         '0.84',  'decimal',
 'Esponente curva potenza GYMME. Calibrare con script di test (target: 7gg=3.52×, 30gg=7.60×).', NOW(), NOW()),

('rental', 'rental.duration_offset',        '0.02',  'decimal',
 'Offset additivo nella formula GYMME per aggiustamenti di scala.', NOW(), NOW()),

('rental', 'rental.decay_strength',         '0.12',  'decimal',
 'Forza del decadimento logaritmico nella formula GYMME. Valori più alti aumentano lo sconto durata.', NOW(), NOW()),

('rental', 'rental.max_duration_reference', '30',    'integer',
 'Riferimento per normalizzare il decadimento GYMME (tipicamente 30 giorni).', NOW(), NOW()),

('rental', 'rental.max_period_cap_days',    '90',    'integer',
 'Soglia stagionale: per durate superiori il moltiplicatore non scende mai sotto Mult(90).', NOW(), NOW()),

-- Gruppo rental: parametri economici (fallback globale quando non c'è Rental Profile)
('rental', 'rental.break_even_days',        '40',    'integer',
 'Numero di giorni noleggio per ammortizzare il costo di acquisto (fallback globale).', NOW(), NOW()),

('rental', 'rental.margin_percentage',      '20',    'decimal',
 'Margine percentuale aggiunto al BaseDay calcolato da break-even (fallback globale).', NOW(), NOW()),

-- Gruppo rental: scarcity e premium
('rental', 'rental.scarcity_enabled',       'false', 'boolean',
 'Abilita sovrapprezzo automatico quando la disponibilità scende sotto la soglia.', NOW(), NOW()),

('rental', 'rental.scarcity_threshold',     '0.30',  'decimal',
 'Ratio di disponibilità (0-1) sotto il quale si applica lo ScarcityFactor.', NOW(), NOW()),

('rental', 'rental.scarcity_multiplier',    '1.10',  'decimal',
 'Moltiplicatore scarcity quando la disponibilità è sotto soglia (+10% default).', NOW(), NOW()),

('rental', 'rental.premium_multiplier',     '1.15',  'decimal',
 'Moltiplicatore per prodotti marcati come premium (+15% default).', NOW(), NOW()),

-- Gruppo pricing
('pricing', 'pricing.commercial_index_global', '1.00', 'decimal',
 'Indice commerciale globale, applicato a tutti i prezzi noleggio come layer superiore ai listini.', NOW(), NOW()),

-- Gruppo subrental (nuovo)
('subrental', 'subrental.markup_default',          '0.30',                 'decimal',
 'Markup default applicato al costo fornitore per calcolare il prezzo cliente sub-noleggio.', NOW(), NOW()),

('subrental', 'subrental.pricing_mode',             'flexible_with_alert', 'string',
 'Modalità sub-noleggio: "block" impedisce conferma senza costo fornitore, "flexible_with_alert" mostra solo alert.', NOW(), NOW()),

('subrental', 'subrental.min_margin_percent',       '15',                  'decimal',
 'Soglia margine % sotto cui scatta l\'alert sul preventivo sub-noleggio.', NOW(), NOW()),

('subrental', 'subrental.auto_supplier_selection',  'auto',                'string',
 'Selezione fornitore: "auto" propone il migliore per score, "manual" richiede scelta esplicita.', NOW(), NOW()),

('subrental', 'subrental.price_weight',             '0.60',                'decimal',
 'Peso del prezzo nel calcolo dello score fornitore sub-noleggio (deve sommare 1.0 con reliability_weight).', NOW(), NOW()),

('subrental', 'subrental.reliability_weight',       '0.40',                'decimal',
 'Peso della reliability nel calcolo dello score fornitore sub-noleggio.', NOW(), NOW());
```

### 11.10 Nomi Migration Laravel

```
2026_02_20_000001_remove_is_degressive_from_quote_items_table.php
2026_02_20_000002_create_rental_profiles_table.php
2026_02_20_000003_add_rental_profile_id_to_product_categories_table.php
2026_02_20_000004_add_rental_engine_fields_to_products_table.php
2026_02_20_000005_add_rental_periods_to_price_list_items_table.php
2026_02_20_000006_add_multiplier_to_price_lists_adjustment_type_enum.php
2026_02_20_000007_create_product_subrental_suppliers_table.php
2026_02_20_000008_create_subrental_cost_history_table.php
```

---

## 12. Roadmap 5 Fasi

### Fase 1 — Fix Formula Cliff (URGENTE — 1 Sprint)

> Priorità CRITICA. Il bug produce preventivi incoerenti in produzione.

**Backend:**

1. Creare `app/Services/RentalEngineService.php` con `calculateDurationMultiplier()` (formula GYMME)
2. Rimuovere `calculateTieredCoefficient()` e `calculateDegressiveCoefficient()` da `PriceCalculatorService`
3. Aggiornare `QuoteItem::calculateTotal()` per usare il nuovo servizio
4. Aggiornare `PriceCalculatorService::calculateRentalPrices()` per periodi standard
5. Migration `remove_is_degressive_from_quote_items_table` (DROP COLUMN)
6. Seeder `RentalSettingsSeeder` con i nuovi settings gruppo `rental.*`

**Frontend:**

1. Creare `frontend/lib/utils/rental-engine.ts` con `calculateDurationMultiplier()`
2. Rimuovere `calculateTieredCoefficient()` da tutti i file frontend
3. Aggiornare i componenti di preview prezzo noleggio nel preventivo

**Test:**

```php
// tests/Unit/RentalEngineServiceTest.php

it('multiplier for 1 day is exactly 1.0', function () {
    expect(app(RentalEngineService::class)->calculateDurationMultiplier(1, ...))->toBe(1.0);
});

it('duration multiplier is monotonically increasing up to cap', function () {
    $service = app(RentalEngineService::class);
    $previous = 0;
    foreach (range(1, 90) as $days) {
        $current = $service->calculateDurationMultiplier($days, ...defaultParams());
        expect($current)->toBeGreaterThan($previous);
        $previous = $current;
    }
});

it('duration multiplier floors at cap value for long durations', function () {
    $service = app(RentalEngineService::class);
    $capValue = $service->calculateDurationMultiplier(90, ...defaultParams());
    $longValue = $service->calculateDurationMultiplier(120, ...defaultParams());
    expect($longValue)->toBeGreaterThanOrEqual($capValue);
});

it('weekly multiplier is in industry AV range', function () {
    $mult = app(RentalEngineService::class)->calculateDurationMultiplier(7, ...defaultParams());
    expect($mult)->toBeGreaterThan(3.2)->toBeLessThan(4.0);
});
```

---

### Fase 2 — Periodi Standard, Rental Profiles e Fallback Stima (2 Sprint)

**Backend:**

1. Migration `create_rental_profiles_table` + seeder con profili esempio
2. Migration `add_rental_profile_id_to_product_categories_table`
3. Migration `add_rental_periods_to_price_list_items_table` (`rental_hourly`, `rental_half_day`, `rental_seasonal`)
4. Migration `add_rental_engine_fields_to_products_table` (`ownership_type`, `is_premium`, `subrental_markup`, `rental_price_estimated`, `estimated_base_day`)
5. `RentalEngineService::resolveBaseDay()` con i tre percorsi fallback
6. `RecalculateRentalPricesJob` per ricalcolo asincrono alla modifica del prodotto
7. `ProductPurchasePriceUpdated` event + listener per trigger ricalcolo
8. `RentalProfileService` — solo calcoli, nessun DB diretto

**Frontend:**

1. Settings Page: sezione "Profili Noleggio" (lista profili, modifica parametri)
2. Scheda prodotto: badge "Prezzo stimato" se `rental_price_estimated = true`
3. Scheda prodotto: card periodi standard con prezzi calcolati (orario, mezza giornata, giornaliero, settimanale, mensile, stagionale)
4. Preventivo: label warning su voci con prezzo stimato

---

### Fase 3 — Commercial Index e Sub-rental (3 Sprint)

**Backend:**

1. Migration `add_multiplier_to_price_lists_adjustment_type_enum`
2. `CommercialFactorService` — calcola il `CommercialFactor` dai layer Price Lists
3. Migration `create_product_subrental_suppliers_table`
4. Modelli `ProductSubrentalSupplier`, relazione `Product::subrentalSuppliers()`
5. `SubrentalPricingService` — calcolo prezzo cliente, score fornitore, controllo margine
6. Migration `create_subrental_cost_history_table`
7. `RecordSubrentalCostAction` — registra storico a conferma preventivo
8. Settings gruppo `subrental.*` via seeder

**Frontend:**

1. Settings Page: indice commerciale globale + impostazioni sub-noleggio
2. Scheda prodotto: tab "Sub-Noleggio" con lista fornitori, score, storico prezzi
3. Preventivo: badge "Sub-noleggio" sulle voci, alert margine, indicatore fornitore scelto
4. Price List admin: dropdown `adjustment_type` con voce "Moltiplicatore"

---

### Fase 4 — Dashboard KPI Rental (2 Sprint)

**Widget da implementare:**

1. **Break-Even Tracker**: per ogni prodotto owned, barra progresso `noleggi_effettuati / break_even_days` con messaggio "Ancora N noleggi al break-even"
2. **Buy vs Rent Analysis**: per prodotti subrental, confronto `costo_annuale_subrental` vs `prezzo_acquisto_stimato` con semaforo (rosso > 60%, giallo 30-60%, verde < 30%)
3. **Asset ROI**: tabella con margine generato, numero noleggi, durata media, revenue per giorno disponibile
4. **Asset Sottoperformanti**: prodotti non noleggiati nell'ultimo N giorni (configurabile)
5. **Scarcity Monitor**: prodotti vicini alla soglia di disponibilità con preview del prezzo scarcity

**Dati sorgente**: `subrental_cost_history` + `quote_items` (preventivi confermati) + `products` + `stock_movements`

---

### Fase 5 — UI Avanzata e Automazioni (1 Sprint)

1. UI configurazione Rental Profiles: wizard con preview curva in tempo reale
2. Assegnazione profilo alle categorie con ereditarietà visuale
3. Bulk ricalcolo prezzi per categoria
4. Export report pricing (Excel/PDF)
5. API per integrazioni esterne (futuro: app mobile tecnici)

---

## 13. Campi e Funzionalità Rimosse

### 13.1 `is_degressive` su `quote_items`

**Stato**: Mai in produzione. Migration DROP COLUMN in Fase 1.

```sql
ALTER TABLE quote_items DROP COLUMN is_degressive;
```

Rimuovere dal codice:
- `QuoteItem::$fillable` — rimuovere `'is_degressive'`
- `QuoteItemData` — rimuovere proprietà `is_degressive`
- `QuoteItemResource` — rimuovere campo
- Qualsiasi riferimento in controller, test, frontend

### 13.2 `calculateTieredCoefficient()`

**Stato**: Buggato, produce il cliff. Sostituire con `RentalEngineService::calculateDurationMultiplier()`.

Non rinominare il metodo vecchio — rimuoverlo completamente. Aggiornare tutti i call sites.

### 13.3 `calculateDegressiveCoefficient()`

**Stato**: Logica `is_degressive` (√blocchi) mai in produzione. Rimuovere completamente.

### 13.4 `rental.weekly_multiplier` e `rental.monthly_multiplier`

**Stato**: Deprecati. I record rimangono nel DB ma non vengono letti dal codice nuovo.

Nel seeder e nell'UI Settings, mostrare questi setting con label "[DEPRECATO — non modificare]".

---

## 14. Note Implementative

### 14.1 Calibrazione Parametri GYMME

Prima del deploy in produzione, eseguire uno script di calibrazione:

```php
// Script di calibrazione (non persistere come file nel progetto — usare tinker)

$targets = [7 => 3.52, 30 => 7.60, 90 => 14.5];
$params = ['exponent_curve' => 0.84, 'duration_offset' => 0.02, 'decay_strength' => 0.12, 'max_duration_reference' => 30];

foreach ($targets as $days => $target) {
    $actual = calculateRawMultiplier($days, ...$params);
    echo sprintf("Target %dgg=%.2f×, Actual=%.2f× (diff %.1f%%)\n",
        $days, $target, $actual, abs($actual - $target) / $target * 100);
}
```

Se i valori differiscono di più del 10% dai target, aggiustare i parametri prima del deploy. La calibrazione è un processo manuale da fare una sola volta.

### 14.2 Retrocompatibilità Preventivi Esistenti

I prezzi nei `quote_items` esistenti sono salvati come valori numerici, non come riferimenti a formule. Non vengono ricalcolati automaticamente. Questo garantisce:
- Le offerte già inviate mantengono i prezzi originali
- Le revisioni di un preventivo esistente usano i nuovi prezzi (comportamento atteso)
- Nessun impatto su fatture emesse

### 14.3 Prezzi IVA Esclusa

Tutti i prezzi calcolati dal Rental Engine sono IVA esclusa. L'IVA viene applicata al momento della fatturazione, non nel pricing.

### 14.4 Comunicazione al Cliente (Prima del Deploy Fase 1)

Prima del deploy del fix cliff, comunicare proattivamente:

> "Abbiamo corretto il calcolo del prezzo per i noleggi di durata settimanale. I prezzi per 7 giorni aumenteranno allineandosi agli standard di mercato. I preventivi già inviati rimangono invariati. I nuovi preventivi rifletteranno prezzi più accurati e coerenti."

### 14.5 File da Modificare in Fase 1 — Quick Reference

**Backend:**
- `app/Services/PriceCalculatorService.php` — rimuovere `calculateTieredCoefficient()`, aggiornare `calculateRentalPrices()`
- `app/Models/QuoteItem.php` — aggiornare `calculateTotal()` o equivalente
- `app/Services/RentalEngineService.php` — NUOVO
- `database/migrations/2026_02_20_000001_remove_is_degressive_from_quote_items_table.php` — NUOVO
- `database/seeders/RentalSettingsSeeder.php` — NUOVO, aggiungere a `DatabaseSeeder`

**Frontend:**
- `frontend/lib/utils/rental-engine.ts` — NUOVO (sostituisce `calculateTieredCoefficient` ovunque si trovi)
- `frontend/lib/types/generated.d.ts` — aggiornare dopo `php artisan typescript:transform`

**Test:**
- `tests/Unit/RentalEngineServiceTest.php` — NUOVO
- `tests/Unit/QuoteCalculationsTest.php` — aggiornare test esistenti

### 14.6 Ordine Esecuzione Seeder

```php
// In DatabaseSeeder.php, dopo i seeder esistenti:
$this->call([
    // ... seeder esistenti ...
    RentalProfilesSeeder::class,  // Crea i profili base
    RentalSettingsSeeder::class,  // Crea/aggiorna tutti i settings rental.* e subrental.*
]);
```

### 14.7 Pattern per Leggere i Parametri del Profilo

```php
// In RentalEngineService — risoluzione profilo
private function resolveRentalProfile(Product $product): RentalProfileParameters
{
    // Profilo dalla categoria del prodotto
    $profile = $product->category?->rentalProfile;

    if ($profile) {
        return RentalProfileParameters::fromModel($profile);
    }

    // Profilo default
    $defaultProfile = RentalProfile::where('is_default', true)->first();
    if ($defaultProfile) {
        return RentalProfileParameters::fromModel($defaultProfile);
    }

    // Fallback globale dai settings
    return RentalProfileParameters::fromSettings();
}
```

---

*Specifica tecnica definitiva — DGGM ERP Rental Engine v2.0 — Febbraio 2026*
*Da usare come riferimento unico per l'implementazione. Sostituisce integralmente la versione 1.0.*
