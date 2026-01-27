# PWA Quick Start 🚀

Setup rapido per testare la PWA.

## Test Locale (3 passi)

### 1. Build
```bash
cd frontend
npm run build
```

### 2. Start
```bash
npm run start
```

### 3. Apri
```
http://localhost:3000
```

## Installa l'app

### Desktop (Chrome/Edge)
Cerca l'icona **"Installa"** nella barra indirizzi → Click

### Mobile Android
Menu (⋮) → **"Installa app"**

### Mobile iOS (Safari)
Condividi → **"Aggiungi a Home"**

## Test Offline

### Chrome DevTools
1. F12
2. Application → Service Workers (verifica sia "activated")
3. Network → Throttling → **Offline**
4. Naviga nell'app ✨

### Oppure
- Disattiva WiFi
- Prova a navigare
- Vedrai la pagina `/offline`

## Verifica PWA

### Lighthouse Score
1. F12 → Lighthouse
2. Select "Progressive Web App"
3. Generate report
4. Target: **Score > 90** ✅

### Service Worker
DevTools → Application → Service Workers
- Status: **activated and running** ✅

### Cache
DevTools → Application → Cache Storage
- `api-cache` ✅
- `image-cache` ✅
- `static-resources` ✅

## Rigenerare Icone

Se modifichi il logo SVG:

```bash
node scripts/generate-icons.js
```

## Troubleshooting

### "Service worker non trovato"
→ Hai fatto `npm run build` prima di `npm run start`?

### "PWA non si installa"
→ Apri in Chrome/Edge (non Firefox per il test iniziale)
→ Verifica HTTPS in produzione

### "Cache non funziona"
→ Chiudi tutte le tab dell'app
→ Riapri
→ DevTools → Application → Clear storage → Clear site data

## Comandi Rapidi

```bash
# Build
npm run build

# Start production
npm run start

# Genera icone
node scripts/generate-icons.js

# Dev (PWA disabilitata)
npm run dev
```

## Docs Complete

Per maggiori dettagli:
- 📖 **PWA_GUIDE.md** - Guida completa utente
- 🔧 **PWA_IMPLEMENTATION.md** - Dettagli tecnici
- ✅ **PWA_SETUP_COMPLETE.md** - Riepilogo setup

---

**Tempo setup**: ~5 minuti
**Difficoltà**: Facile ⭐
**Status**: ✅ Pronto per il test