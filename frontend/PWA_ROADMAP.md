# PWA Features Roadmap - DGGM ERP

## Stato Attuale ✅

- ✅ PWA installabile (manifest + icone)
- ✅ Service Worker minimalista (solo push notifications)
- ✅ Nessuna interferenza con Next.js
- ✅ Headers di sicurezza configurati
- ✅ Funziona su iOS 16.4+ e tutti i browser moderni

## Feature da Implementare

### 1. Push Notifications (Self-Hosted) 🔔

**Cosa**: Notifiche push native senza servizi esterni (Firebase, OneSignal, etc.)

**Use Cases**:
- Nuovo DDT assegnato
- Cantiere modificato/aggiornato
- Timesheet approvato/rifiutato
- Promemoria fine turno
- Alert magazzino (stock basso)
- Messaggi da admin/project manager

**Implementazione**:
```typescript
// Backend (Laravel)
- Genera VAPID keys (chiavi crittografiche)
- Salva subscription degli utenti (endpoint, keys)
- API endpoint per inviare notifiche

// Frontend (Next.js)
- Richiedi permesso notifiche
- Subscribe al push service
- Gestisci notifiche in arrivo
- Click notification → apri pagina specifica
```

**Tecnologie**:
- `web-push` (npm package) - Backend
- Browser Push API - Frontend
- Nessun servizio esterno necessario

**Tempo stimato**: 3-4 ore
**Priorità**: Alta (molto utile per operai)

---

### 2. Background Sync (Offline Queue) 🔄

**Cosa**: Salva modifiche offline e sincronizza automaticamente quando torna la connessione.

**Use Cases**:
- Timesheet entry creati offline
- Note cantiere aggiunte senza rete
- Foto DDT scattate offline
- Modifiche dati (prodotti, inventario)

**Implementazione**:
```typescript
// 1. IndexedDB per storage locale
- Tabella: offline_queue
  - id, action, data, timestamp, synced

// 2. Service Worker Background Sync
self.addEventListener('sync', async (event) => {
  if (event.tag === 'sync-queue') {
    await processOfflineQueue();
  }
});

// 3. UI Queue Manager
- Mostra modifiche in coda
- Badge contatore
- Stato sincronizzazione
```

**Tecnologie**:
- Background Sync API
- IndexedDB (con Dexie.js)
- Optimistic UI updates

**Tempo stimato**: 4-5 ore
**Priorità**: Media (utile ma non critico)

---

### 3. Selective Caching Strategy 💾

**Cosa**: Cache intelligente solo per dati critici offline.

**Cache Policy**:
```typescript
// Cosa cachare (ruolo Worker/Team Leader)
✅ Lista cantieri assegnati
✅ Dati cantiere corrente (materiali, team)
✅ Prodotti/materiali recenti
✅ Immagini prodotti
✅ Timesheet ultimi 7 giorni

// Cosa NON cachare
❌ Dati amministrativi
❌ Report/analytics
❌ Gestione utenti
❌ Configurazioni
```

**Strategia**:
- **Network First** (timeout 3s) → Fallback cache
- Cache solo per ruoli Worker/Team Leader
- Expiration: 24h per dati statici, 1h per dinamici
- Max 50MB storage

**Tempo stimato**: 3-4 ore
**Priorità**: Media

---

### 4. Periodic Background Sync ⏰

**Cosa**: Aggiornamenti automatici in background (anche con app chiusa).

**Use Cases**:
- Sincronizza cantieri ogni 6 ore
- Controllo nuovi DDT
- Pre-fetch dati per domani
- Pulizia cache vecchia

**Limitazioni**:
- Solo su Android (Chrome)
- iOS non supporta (app deve essere aperta)
- Richiede permesso utente

**Tempo stimato**: 2-3 ore
**Priorità**: Bassa (nice to have)

---

### 5. Offline-First UI/UX 📱

**Cosa**: Interfaccia ottimizzata per esperienza offline.

**Features**:
- **Offline Banner**: Mostra stato connessione in modo chiaro
- **Queue Badge**: Contatore modifiche in attesa di sync
- **Sync Progress**: Barra progresso sincronizzazione
- **Conflict Resolution**: UI per risolvere conflitti dati
- **Offline Pages**: Pagine visualizzabili offline

**Componenti**:
```typescript
<OfflineBanner />           // Banner top persistente
<SyncQueueWidget />         // Widget modifiche in coda
<ConflictResolver />        // Dialog risoluzione conflitti
<CacheStatus />             // Indicatore spazio cache
```

**Tempo stimato**: 3-4 ore
**Priorità**: Media

---

## Implementazione Suggerita (Priority Order)

### Fase 1: Push Notifications (Settimana 1)
**Perché prima**: Funzionalità completa e autonoma, alto valore per utenti

1. Setup VAPID keys backend
2. Database subscription storage
3. API endpoint send notification
4. Frontend permission request
5. Click handler → navigation
6. Test su vari dispositivi

**Deliverables**:
- Backend API `/api/push/subscribe`, `/api/push/send`
- Component `<PushNotificationManager />`
- Admin panel per inviare notifiche
- Documentazione uso

---

### Fase 2: Offline Queue + Basic Caching (Settimana 2)
**Perché**: Fondamenta per tutte le feature offline

1. Setup IndexedDB (Dexie.js)
2. Offline queue system
3. Background sync handler
4. Cache selettiva per worker
5. UI queue indicator

**Deliverables**:
- `OfflineQueue` service
- Service worker sync handler
- `<OfflineQueueWidget />` component
- Cache strategy configurata

---

### Fase 3: UI/UX Offline (Settimana 3)
**Perché**: Polish e completamento esperienza

1. Offline banner migliorato
2. Sync progress indicator
3. Conflict resolution UI
4. Cache management UI
5. Testing completo offline

**Deliverables**:
- Suite componenti offline
- Documentazione UX
- Testing checklist

---

### Fase 4: Advanced Features (Opzionale)
**Perché**: Nice to have, non critiche

1. Periodic background sync (Android only)
2. Advanced caching strategies
3. Pre-fetching intelligente
4. Analytics offline usage

---

## Architettura Tecnica

### Stack Offline
```
┌─────────────────────────────────────┐
│         Frontend (Next.js)          │
├─────────────────────────────────────┤
│  - React Components (UI)            │
│  - Zustand Store (state)            │
│  - TanStack Query (API cache)       │
│  - IndexedDB (Dexie.js)             │
└─────────────────────────────────────┘
              ↕
┌─────────────────────────────────────┐
│      Service Worker (sw.js)         │
├─────────────────────────────────────┤
│  - Push notification handler        │
│  - Background sync handler          │
│  - Cache strategies                 │
│  - Offline queue processor          │
└─────────────────────────────────────┘
              ↕
┌─────────────────────────────────────┐
│       Backend (Laravel API)         │
├─────────────────────────────────────┤
│  - Push notification sender         │
│  - Subscription manager             │
│  - Sync conflict resolver           │
│  - Offline queue processor          │
└─────────────────────────────────────┘
```

### Database Schema (Backend)

```sql
-- Push subscriptions
CREATE TABLE push_subscriptions (
    id BIGINT PRIMARY KEY,
    user_id BIGINT,
    endpoint TEXT,
    p256dh VARCHAR(255),
    auth VARCHAR(255),
    device_name VARCHAR(255),
    created_at TIMESTAMP,
    last_used_at TIMESTAMP
);

-- Notifications log
CREATE TABLE push_notifications (
    id BIGINT PRIMARY KEY,
    user_id BIGINT,
    title VARCHAR(255),
    body TEXT,
    url VARCHAR(255),
    sent_at TIMESTAMP,
    read_at TIMESTAMP
);

-- Offline queue (solo per debug/monitoring)
CREATE TABLE offline_sync_log (
    id BIGINT PRIMARY KEY,
    user_id BIGINT,
    action VARCHAR(100),
    data JSON,
    synced_at TIMESTAMP
);
```

### IndexedDB Schema (Frontend)

```typescript
// Dexie.js schema
class DGGMDatabase extends Dexie {
  offlineQueue!: Table<OfflineAction>;
  cachedData!: Table<CachedItem>;

  constructor() {
    super('dggm_erp');

    this.version(1).stores({
      offlineQueue: '++id, action, timestamp, synced',
      cachedData: 'key, data, expiry'
    });
  }
}

interface OfflineAction {
  id?: number;
  action: 'create' | 'update' | 'delete';
  resource: string; // 'timesheet', 'note', etc.
  data: any;
  timestamp: number;
  synced: boolean;
}

interface CachedItem {
  key: string;
  data: any;
  expiry: number;
}
```

---

## Browser Support

### Push Notifications
| Feature | Chrome | Firefox | Safari | Edge | iOS Safari |
|---------|--------|---------|--------|------|------------|
| Push API | ✅ | ✅ | ✅ 16+ | ✅ | ✅ 16.4+ (installed only) |
| Background Push | ✅ | ✅ | ✅ | ✅ | ❌ |
| Action Buttons | ✅ | ✅ | ❌ | ✅ | ❌ |

### Background Sync
| Feature | Chrome | Firefox | Safari | Edge | iOS Safari |
|---------|--------|---------|--------|------|------------|
| Background Sync | ✅ | ❌ | ❌ | ✅ | ❌ |
| Periodic Sync | ✅ | ❌ | ❌ | ✅ | ❌ |

**Fallback Strategy**:
- Background Sync non disponibile → Sync on app open
- Periodic Sync non disponibile → Manual refresh

---

## Security Considerations

### Push Notifications
1. ✅ VAPID keys secure (environment variables)
2. ✅ Subscription endpoint validation
3. ✅ Rate limiting (max 100 notifiche/utente/giorno)
4. ✅ User permission required
5. ✅ HTTPS required (già implementato)

### Offline Storage
1. ✅ Encrypt sensitive data in IndexedDB
2. ✅ Clear cache on logout
3. ✅ Max storage quota (50MB)
4. ✅ Auto-cleanup data vecchia (> 30gg)

### Background Sync
1. ✅ Validate data integrity prima sync
2. ✅ Conflict resolution server-side
3. ✅ Idempotent sync operations
4. ✅ Retry logic con exponential backoff

---

## Testing Strategy

### Push Notifications
- [ ] Test subscription flow
- [ ] Test notification delivery
- [ ] Test click action
- [ ] Test unsubscribe
- [ ] Test multi-device
- [ ] Test iOS vs Android differences

### Offline Mode
- [ ] Test create/update/delete offline
- [ ] Test sync quando torna online
- [ ] Test conflict resolution
- [ ] Test cache expiry
- [ ] Test storage quota exceeded
- [ ] Test network timeout fallback

### Cross-Browser
- [ ] Chrome Desktop
- [ ] Firefox Desktop
- [ ] Safari Desktop
- [ ] Chrome Android
- [ ] Safari iOS (installed PWA)

---

## Performance Impact

### Storage Usage
- IndexedDB: ~5-10 MB (queue + cache)
- Service Worker: ~50 KB
- Cache API: ~20-50 MB (configurabile)

**Total**: ~30-60 MB per utente

### Battery Impact
- Push notifications: Trascurabile
- Background sync: Basso (solo quando online)
- Periodic sync: Medio (ogni 6h)

**Ottimizzazioni**:
- Debounce sync events
- Batch notifications
- Limit periodic sync frequency

---

## Migration Plan

### Utenti Esistenti
1. ✅ Nessun breaking change (feature opt-in)
2. ✅ Richiesta permessi al primo uso
3. ✅ Graceful fallback se non supportato
4. ✅ Educational UI (come funziona)

### Rollout Strategy
1. **Beta** (10 utenti worker) - 1 settimana
2. **Pilot** (50% workers) - 2 settimane
3. **Full rollout** - Tutti gli utenti

---

## Next Steps

1. **Vuoi iniziare con Push Notifications?**
   - Ti preparo la guida completa implementazione
   - Backend + Frontend step-by-step

2. **Oppure Background Sync?**
   - Architettura offline queue
   - IndexedDB setup
   - Sync logic

3. **O tutto insieme?**
   - Piano di implementazione completo
   - Tutte le feature integrate

**Fammi sapere da dove vuoi partire!** 🚀

---

**Ultima revisione**: 27 Gennaio 2025
**Versione**: 1.0.0
**Status**: Pronto per implementazione
