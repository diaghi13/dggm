# PWA Guide - DGGM ERP

Questa guida spiega come utilizzare l'app DGGM ERP come Progressive Web App (PWA).

## Cos'è una PWA?

Una Progressive Web App è un'applicazione web che può essere installata sul dispositivo e funziona come un'app native, con supporto per:
- **Installazione**: Può essere installata sulla home screen del dispositivo
- **Offline support**: Funziona anche senza connessione internet (con limitazioni)
- **Push notifications**: Può ricevere notifiche (futuro)
- **Performance**: Caricamento più veloce grazie alla cache

## Come installare l'app

### Su Desktop (Chrome, Edge, Brave)

1. Apri l'app nel browser
2. Cerca l'icona "Installa" nella barra degli indirizzi (a destra)
3. Clicca su "Installa DGGM ERP"
4. L'app verrà aggiunta al menu Start/Applications

**Oppure:**
- Chrome: Menu (⋮) → Installa DGGM ERP
- Edge: Menu (⋯) → App → Installa questo sito come app

### Su Mobile (Android)

1. Apri l'app in Chrome/Edge
2. Tocca il menu (⋮) in alto a destra
3. Seleziona "Installa app" o "Aggiungi a schermata Home"
4. Conferma l'installazione

### Su Mobile (iOS/Safari)

1. Apri l'app in Safari
2. Tocca il pulsante Condividi (rettangolo con freccia verso l'alto)
3. Scorri e seleziona "Aggiungi alla schermata Home"
4. Conferma con "Aggiungi"

**Nota**: Su iOS, l'app non avrà tutte le funzionalità PWA (es. service worker limitati).

## Funzionalità Offline

### Cosa funziona offline:

✅ **Navigazione**: Puoi navigare tra le pagine già visitate
✅ **Visualizzazione dati**: I dati precedentemente caricati sono visibili dalla cache
✅ **UI completa**: Tutta l'interfaccia è disponibile

### Cosa NON funziona offline:

❌ **Nuove richieste API**: Non puoi caricare nuovi dati dal server
❌ **Modifiche**: Le modifiche richiedono connessione
❌ **Login**: Il login richiede connessione internet

### Strategia di cache

L'app usa una strategia **Network First** per le API:
- Prova sempre a prendere dati freschi dal server
- Se offline, usa la cache (se disponibile)
- Timeout di 10 secondi prima di usare la cache

Le risorse statiche (immagini, CSS, JS) usano **Cache First** per performance ottimali.

## Indicatore di connessione

L'app mostra automaticamente un indicatore quando:
- 🟡 **Vai offline**: Notifica gialla "Sei offline"
- 🟢 **Torni online**: Notifica verde "Connessione ripristinata"

L'indicatore scompare automaticamente dopo 3 secondi.

## Pagina Offline

Se provi ad accedere a una pagina non in cache mentre sei offline, vedrai una pagina dedicata con:
- Messaggio chiaro sullo stato offline
- Elenco di cosa puoi fare offline
- Pulsante per riprovare

## Hook personalizzato

Puoi usare l'hook `useOnline()` nei tuoi componenti per reagire allo stato della connessione:

```tsx
import { useOnline } from '@/hooks/use-online';

function MyComponent() {
  const isOnline = useOnline();

  return (
    <div>
      {isOnline ? (
        <p>Sei online</p>
      ) : (
        <p>Sei offline - alcune funzionalità sono limitate</p>
      )}
    </div>
  );
}
```

## Aggiornamenti dell'app

### Aggiornamento automatico

L'app si aggiorna automaticamente quando:
1. Chiudi tutte le schede/finestre dell'app
2. Riapri l'app
3. Il nuovo service worker si attiva automaticamente

### Sviluppo locale

In modalità sviluppo (`npm run dev`), la PWA è **disabilitata** per evitare problemi con il hot reload.

Per testare la PWA in locale:
```bash
npm run build
npm run start
```

## Configurazione

### Manifest (`public/manifest.json`)

Il manifest definisce:
- Nome e descrizione dell'app
- Icone in varie dimensioni
- Colore tema (dark: `#0f172a`)
- Display mode (`standalone`)
- Shortcuts (scorciatoie app)

### Service Worker

Il service worker è generato automaticamente da `next-pwa` e gestisce:
- Cache delle risorse
- Strategie di cache personalizzate
- Fallback offline
- Aggiornamenti automatici

### Icone

Le icone sono generate automaticamente dallo script `scripts/generate-icons.js`:
- **Sorgente**: `public/icons/icon.svg`
- **Dimensioni generate**: 72, 96, 128, 144, 152, 192, 384, 512px
- **Favicon**: 32x32
- **Apple Touch Icon**: 180x180

Per rigenerare le icone:
```bash
node scripts/generate-icons.js
```

## Modifiche al manifest

Se modifichi `public/manifest.json`, ricorda di:
1. Riavviare il dev server
2. Fare hard refresh (Ctrl+Shift+R / Cmd+Shift+R)
3. Disinstallare e reinstallare l'app (in dev)

## Cache Strategy personalizzata

La configurazione in `next.config.ts` definisce:

```typescript
runtimeCaching: [
  {
    // API: Network First (10s timeout)
    urlPattern: /^https:\/\/dggm-erp\.ddns\.net\/api\/v1\/.*/i,
    handler: 'NetworkFirst',
    options: {
      cacheName: 'api-cache',
      expiration: {
        maxEntries: 32,
        maxAgeSeconds: 24 * 60 * 60 // 24 ore
      },
      networkTimeoutSeconds: 10,
    }
  },
  {
    // Immagini: Cache First
    urlPattern: /\.(?:jpg|jpeg|png|svg|gif|webp)$/i,
    handler: 'CacheFirst',
    options: {
      cacheName: 'image-cache',
      expiration: {
        maxEntries: 64,
        maxAgeSeconds: 30 * 24 * 60 * 60 // 30 giorni
      }
    }
  }
]
```

## Troubleshooting

### L'app non si installa
- Verifica che sia servita via HTTPS (in produzione)
- Controlla che il manifest.json sia valido
- Prova in modalità incognito

### La cache non si aggiorna
- Chiudi tutte le schede dell'app
- Riapri l'app
- In dev: disattiva il service worker dalle DevTools

### Voglio disabilitare la PWA
Nel `next.config.ts`:
```typescript
disable: true, // invece di process.env.NODE_ENV === 'development'
```

## Testing

### Chrome DevTools

1. Apri DevTools (F12)
2. Tab "Application"
3. Sezioni utili:
   - **Manifest**: Verifica manifest.json
   - **Service Workers**: Stato del SW
   - **Cache Storage**: Vedi cosa è in cache
   - **Offline**: Simula offline

### Lighthouse

Esegui un audit PWA:
1. DevTools → Lighthouse
2. Seleziona "Progressive Web App"
3. Click "Generate report"

Target: **Score > 90**

## Best Practices

### Per sviluppatori

1. **Testa offline**: Simula offline dalle DevTools
2. **Gestisci errori di rete**: Usa try/catch per le API
3. **Mostra loader**: Durante le richieste di rete
4. **Feedback utente**: Indica quando è offline
5. **Cache invalidation**: Invalida cache dopo mutazioni

### Per utenti

1. **Installa l'app**: Migliore esperienza su mobile
2. **Connessione stabile**: Per sincronizzare le modifiche
3. **Aggiorna regolarmente**: Chiudi e riapri l'app periodicamente

## Roadmap PWA

Funzionalità future pianificate:

- [ ] **Push Notifications**: Notifiche per nuovi cantieri, DDT, etc.
- [ ] **Background Sync**: Sincronizza modifiche offline quando torni online
- [ ] **Geolocation**: Time tracking GPS (già implementato, ma migliorabile offline)
- [ ] **Camera**: Scatta foto DDT offline
- [ ] **Offline queue**: Coda modifiche da sincronizzare

## Risorse

- [PWA Documentation](https://web.dev/progressive-web-apps/)
- [next-pwa](https://github.com/shadowwalker/next-pwa)
- [Workbox](https://developers.google.com/web/tools/workbox)
- [Web App Manifest](https://web.dev/add-manifest/)

---

**Ultima revisione**: Gennaio 2025
**Versione PWA**: 1.0.0