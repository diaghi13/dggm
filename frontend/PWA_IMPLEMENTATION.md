# PWA Implementation Summary

## Modifiche implementate

### 1. Dipendenze installate

```bash
npm install next-pwa
npm install --save-dev sharp
```

### 2. Configurazione Next.js (`next.config.ts`)

Aggiunto `withPWA` wrapper con:
- **Service Worker**: Registrazione automatica
- **Cache Strategy**: Network-first per API, Cache-first per static assets
- **Offline fallback**: Redirect a `/offline` quando offline
- **Disabilitato in dev**: Per evitare conflitti con hot reload

### 3. Manifest PWA (`public/manifest.json`)

Creato manifest completo con:
- Nome app: "DGGM ERP"
- Descrizione in italiano
- 8 icone (72px → 512px)
- Colore tema dark: `#0f172a`
- Display mode: `standalone`
- Shortcuts per Dashboard, Cantieri, Timesheet

### 4. Icone generate (`public/icons/`)

Script automatico (`scripts/generate-icons.js`) che genera:
- **8 icone PWA**: 72, 96, 128, 144, 152, 192, 384, 512px
- **Favicon**: 32x32
- **Apple Touch Icon**: 180x180

Sorgente: `public/icons/icon.svg` (logo DGGM con gru edile)

### 5. Meta tags (`app/layout.tsx`)

Aggiunto al metadata:
- Link al manifest
- Theme color (light/dark)
- Apple Web App capable
- Viewport ottimizzato per mobile
- Icone per iOS e Android

### 6. Pagina Offline (`app/offline/page.tsx`)

Pagina dedicata mostrata quando:
- L'utente è offline
- Cerca di accedere a una pagina non in cache

Features:
- Design coerente con l'app (dark mode)
- Icona WifiOff
- Elenco cosa funziona offline
- Pulsante "Riprova"

### 7. Indicatore connessione (`components/offline-indicator.tsx`)

Notifica floating che mostra:
- 🟡 Notifica quando vai offline
- 🟢 Notifica quando torni online
- Scompare automaticamente dopo 3 secondi

Aggiunto al `DashboardLayout`.

### 8. Hook personalizzato (`hooks/use-online.ts`)

Hook React per tracciare lo stato online/offline:

```tsx
const isOnline = useOnline();
```

Utilizzabile in qualsiasi componente per reagire ai cambiamenti di connessione.

### 9. .gitignore aggiornato

Esclusi file generati dal service worker:
- `sw.js`
- `workbox-*.js`
- `worker-*.js`
- Source maps correlati

### 10. Documentazione (`PWA_GUIDE.md`)

Guida completa con:
- Come installare l'app (Desktop, Android, iOS)
- Funzionalità offline
- Strategia di cache
- Hook e componenti
- Troubleshooting
- Best practices

## File creati/modificati

### Creati
- ✅ `public/manifest.json`
- ✅ `public/icons/icon.svg`
- ✅ `public/icons/icon-*.png` (8 dimensioni)
- ✅ `public/apple-touch-icon.png`
- ✅ `public/favicon.png`
- ✅ `scripts/generate-icons.js`
- ✅ `app/offline/page.tsx`
- ✅ `components/offline-indicator.tsx`
- ✅ `hooks/use-online.ts`
- ✅ `PWA_GUIDE.md`
- ✅ `PWA_IMPLEMENTATION.md` (questo file)

### Modificati
- ✅ `next.config.ts` - Aggiunto wrapper PWA
- ✅ `app/layout.tsx` - Aggiunto metadata PWA
- ✅ `components/layout/dashboard-layout.tsx` - Aggiunto OfflineIndicator
- ✅ `.gitignore` - Esclusi file SW generati
- ✅ `package.json` - Aggiunte dipendenze

## Come testare

### 1. Build production

```bash
npm run build
npm run start
```

**Nota**: La PWA è disabilitata in modalità dev (`npm run dev`)

### 2. Installa l'app

Chrome/Edge Desktop:
- Icona "Installa" nella barra indirizzi
- Oppure Menu → Installa app

Mobile:
- Chrome Android: Menu → Installa app
- Safari iOS: Condividi → Aggiungi a Home

### 3. Testa offline

Chrome DevTools:
1. F12 → Application tab
2. Service Workers → Verifica attivo
3. Network tab → Throttling → Offline
4. Naviga nell'app

Oppure:
- Disattiva WiFi/dati
- Usa l'app installata

### 4. Verifica cache

DevTools → Application → Cache Storage
- `api-cache`: Risposte API
- `image-cache`: Immagini
- `static-resources`: CSS, JS, fonts

### 5. Lighthouse audit

DevTools → Lighthouse → Progressive Web App
Target: **Score > 90**

## Cache Strategy

### API Requests (Network First)
- URL: `https://dggm-erp.ddns.net/api/v1/*`
- Timeout: 10 secondi
- Fallback: Cache (se disponibile)
- Expiration: 24 ore, max 32 entries

### Immagini (Cache First)
- Pattern: `.(jpg|jpeg|png|svg|gif|webp)`
- Expiration: 30 giorni, max 64 entries

### Static Resources (Cache First)
- Pattern: `.(js|css|woff|woff2|ttf|otf)`
- Expiration: 30 giorni, max 64 entries

## Shortcuts definite

Nel manifest, 3 shortcuts per accesso rapido:

1. **Dashboard** → `/dashboard`
2. **Cantieri** → `/dashboard/sites`
3. **Timesheet** → `/dashboard/worker`

Accessibili da:
- Long press icona app (Android)
- Right click icona app (Windows)

## Prossimi passi (opzionali)

### 1. Push Notifications
- Backend: Endpoint per inviare notifiche
- Frontend: Permessi + subscription
- Use case: Nuovi DDT, cantieri assegnati, etc.

### 2. Background Sync
- Coda modifiche offline
- Sincronizzazione automatica quando online
- Use case: Time entries, note cantiere

### 3. Installazione suggerita
- Componente `InstallPrompt` con logica:
  - Mostra dopo X visite
  - Dismissibile (localStorage)
  - CTA chiara

### 4. Update notification
- Notifica quando SW aggiornato
- Prompt "Nuova versione disponibile"
- Pulsante per ricaricare

### 5. Offline queue UI
- Indicatore modifiche in coda
- Lista modifiche da sincronizzare
- Stato sincronizzazione

## Note tecniche

### Service Worker lifecycle

1. **Install**: SW scaricato, risorse pre-cachate
2. **Waiting**: SW pronto ma non attivo (vecchio SW ancora attivo)
3. **Activate**: Vecchio SW terminato, nuovo SW attivo
4. **Fetch**: Intercetta richieste di rete

Con `skipWaiting: true`, il nuovo SW si attiva immediatamente.

### Workbox

`next-pwa` usa internamente Workbox per:
- Generazione automatica SW
- Strategie di cache pre-definite
- Precaching automatico delle build Next.js
- Runtime caching personalizzato

### Compatibilità

- ✅ Chrome/Edge (Desktop + Mobile): Pieno supporto
- ✅ Firefox (Desktop + Mobile): Pieno supporto
- ✅ Safari (Desktop): Pieno supporto
- ⚠️ Safari iOS: Supporto limitato (no background sync, push limitati)

### HTTPS Requirement

PWA **richiede HTTPS** in produzione (eccetto localhost).

Service Worker non funziona su HTTP per motivi di sicurezza.

## Troubleshooting

### SW non si registra
- Verifica HTTPS in prod
- Controlla console errori
- DevTools → Application → Service Workers

### Cache non aggiorna
- Chiudi tutte le tab
- Riapri app
- SW si aggiorna al prossimo caricamento

### Manifest non riconosciuto
- Hard refresh (Ctrl+Shift+R)
- Verifica JSON valido
- Controlla Network tab

### Icone non appaiono
- Verifica percorsi in manifest
- Rigenera icone: `node scripts/generate-icons.js`
- Clear cache del browser

---

**Data implementazione**: 27 Gennaio 2025
**Versione**: 1.0.0
**Testato su**: Chrome 131, Safari 18