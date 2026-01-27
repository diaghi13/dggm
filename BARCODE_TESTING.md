# 🧪 Test Barcode Scanner

## Come Testare il Barcode Scanner

### 1. Test Locale (Senza Hardware)

#### Opzione A: Usa un'immagine di barcode
1. Apri il browser su: `http://localhost:3000/warehouses`
2. Click su "Carico Iniziale/Bulk"
3. Click sull'icona scanner 📷
4. Consenti l'accesso alla fotocamera
5. Mostra un barcode stampato o su un altro schermo alla webcam

#### Opzione B: Genera barcode di test
Puoi generare barcode online gratuitamente:
- https://barcode.tec-it.com/
- https://www.free-barcode-generator.net/
- https://www.barcodesinc.com/generator/

**Formati consigliati per test:**
- EAN-13: Usa un codice a 13 cifre (es: 8007020010301)
- CODE-128: Usa testo alfanumerico (es: PROD-001)

### 2. Test su Mobile (Android/iOS)

#### Preparazione
1. Assicurati che il backend sia raggiungibile dalla rete locale
2. Trova l'IP del tuo Mac: `ifconfig | grep "inet " | grep -v 127.0.0.1`
3. Configura il proxy o aggiorna `.env.local`:
   ```
   NEXT_PUBLIC_API_URL=http://TUO_IP:8000
   ```

#### Test
1. Apri Safari (iOS) o Chrome (Android)
2. Vai a: `http://TUO_IP:3000` (sostituisci TUO_IP)
3. Accedi all'app
4. Vai su Magazzini → Carico Bulk
5. Click scanner 📷
6. Inquadra un barcode con la fotocamera posteriore

### 3. Test con Pistola Wireless

#### Setup Pistola
1. Collega la pistola (Bluetooth o USB dongle)
2. Verifica che funzioni: apri un editor di testo
3. Scansiona un barcode → dovrebbe digitare il codice

#### Test nell'App
1. Apri qualsiasi campo di input prodotto
2. Click nel campo per dare focus
3. Scansiona con la pistola
4. Il codice dovrebbe apparire e fare ricerca automatica

### 4. Test Ricerca per Barcode

#### Preparazione Dati
Assicurati di avere prodotti con barcode nel DB:
```sql
UPDATE products 
SET barcode = '8007020010301' 
WHERE code = 'PROD-001';
```

#### Test API
```bash
# Test diretto API
curl "http://localhost:8000/api/v1/products?barcode=8007020010301"

# Dovrebbe tornare:
# {
#   "success": true,
#   "data": [...],
#   "meta": {...}
# }
```

#### Test Frontend
1. Apri ProductAutocomplete
2. Click scanner 📷
3. Scansiona barcode configurato
4. Verifica che il prodotto venga selezionato

## ✅ Checklist Test

### Scanner PWA
- [ ] Permesso fotocamera richiesto correttamente
- [ ] Fotocamera si avvia senza errori
- [ ] Barcode EAN-13 riconosciuto
- [ ] Barcode CODE-128 riconosciuto
- [ ] Toast "Barcode scansionato" appare
- [ ] Prodotto trovato e selezionato
- [ ] Gestione "Prodotto non trovato"
- [ ] Chiusura scanner funziona
- [ ] Funziona su mobile (iOS)
- [ ] Funziona su mobile (Android)

### Integrazione BulkIntakeDialog
- [ ] Bottone scanner visibile
- [ ] Scanner si apre correttamente
- [ ] Prodotto trovato via barcode
- [ ] Campo costo auto-compilato
- [ ] Prodotto aggiunto alla lista
- [ ] Reset form dopo aggiunta

### Integrazione ProductAutocomplete
- [ ] Bottone scanner sempre visibile
- [ ] Non interferisce con ricerca manuale
- [ ] Funziona in tutti i contesti (DDT, Preventivi, etc.)
- [ ] Layout responsive

### API Backend
- [ ] GET /products?barcode=XXX funziona
- [ ] Ricerca esatta barcode
- [ ] Ricerca in search generale include barcode
- [ ] Performance accettabile

### Pistola Wireless (se disponibile)
- [ ] Pistola riconosciuta come tastiera
- [ ] Scansione inserisce codice
- [ ] INVIO automatico cerca prodotto
- [ ] Velocità scansione soddisfacente

## 🐛 Problemi Comuni

### "Permission Denied"
- Soluzione: Vai nelle impostazioni del browser → Permessi sito → Consenti fotocamera

### Scanner non parte su iOS
- Soluzione: Devi usare HTTPS. Per test locale:
  1. Usa ngrok: `ngrok http 3000`
  2. O configura certificato SSL locale

### Barcode non letto
- Aumenta illuminazione
- Pulisci la lente
- Usa barcode stampato (non schermo)
- Verifica formato supportato

### "Prodotto non trovato"
- Verifica barcode nel DB: `SELECT * FROM products WHERE barcode = 'XXX'`
- Controlla che `barcode` non sia NULL
- Testa API diretta: `curl "http://localhost:8000/api/v1/products?barcode=XXX"`

## 📸 Screenshot Test

Cattura screenshot di:
1. Scanner attivo con barcode inquadrato
2. Toast "Barcode scansionato"
3. Prodotto auto-selezionato
4. Lista prodotti in BulkIntakeDialog

## 🎯 Metriche di Successo

- ✅ Tempo medio scansione: <2 secondi
- ✅ Tasso di successo: >90%
- ✅ Nessun crash dell'app
- ✅ Esperienza utente fluida
- ✅ Feedback visivo chiaro

---

**Data test:** _____________________
**Testato da:** _____________________
**Device:** _____________________
**Browser:** _____________________
**Risultato:** ✅ PASS / ❌ FAIL
**Note:** _____________________
