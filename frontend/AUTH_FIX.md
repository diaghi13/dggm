# Fix Autenticazione - Doppia Verifica + Hydration

## Problemi Identificati e Risolti

### 1. Doppia Verifica del Token
Il sistema aveva una **doppia verifica del token** che causava loop e redirect indesiderati.

### 2. Refresh Rimandava al Login
Dopo il login, facendo **refresh (F5)**, l'utente veniva riportato al login anche con token valido.

## Modifiche Apportate

### 1. Rimosso `checkAuth()` dal Layout
**File**: `frontend/components/dashboard-layout.tsx`

- Rimosso il `useEffect` che chiamava `checkAuth()`
- Ora il layout si basa solo sullo stato `isAuthenticated` di Zustand
- L'interceptor gestisce automaticamente i token invalidi/scaduti

### 2. Unificata Gestione del Token
**File**: `frontend/stores/auth-store.ts`

- Rimossa la doppia scrittura del token (`auth_token` + Zustand storage)
- Ora il token viene salvato **solo** nello storage di Zustand (`auth-storage`)
- Rimossa completamente la funzione `checkAuth()` dallo store
- Semplificati `setAuth()` e `clearAuth()`

### 3. Aggiornato API Client
**File**: `frontend/lib/api/client.ts`

**Request Interceptor**:
- Ora legge il token dallo storage di Zustand (`auth-storage`)
- Parsing JSON sicuro con error handling

**Response Interceptor**:
- Gestisce i 401 pulendo lo storage di Zustand
- Previene loop controllando se siamo già sulla pagina di login
- Redirect solo quando necessario

### 4. Aggiunto Hydration State
**File**: `frontend/stores/auth-store.ts`

- Aggiunto `hasHydrated` per tracciare quando Zustand ha finito di caricare
- Aggiunto `onRehydrateStorage` callback che imposta `hasHydrated: true`
- Il dashboard aspetta `hasHydrated: true` prima di verificare l'autenticazione

**File**: `frontend/components/dashboard-layout.tsx`

- Aggiornato per leggere `hasHydrated` dallo store
- Il redirect al login avviene **solo dopo** che lo store è stato idratato
- Mostra schermo vuoto durante i ~50-100ms di hydration

## Come Funziona Ora

### Flusso di Autenticazione

1. **Login**:
   ```
   User → Login Form → authApi.login() → setAuth(user, token)
   → Zustand persiste user, token, isAuthenticated
   ```

2. **Request API**:
   ```
   API Call → Interceptor legge token da 'auth-storage'
   → Aggiunge header Authorization: Bearer {token}
   ```

3. **Token Valido**:
   ```
   API Response → Dati ritornati all'applicazione
   ```

4. **Token Invalido/Scaduto**:
   ```
   API Response 401 → Interceptor pulisce 'auth-storage'
   → Redirect a /login (se non già lì)
   ```

5. **Check Autenticazione**:
   ```
   Dashboard Layout → Verifica isAuthenticated da Zustand
   → Se false: redirect a /login
   → Se true: mostra contenuto
   ```

### Storage Unificato

Prima (Problematico):
```
localStorage:
  - 'auth_token': "xyz..."
  - 'auth-storage': { state: { user, token, isAuthenticated } }
```

Ora (Corretto):
```
localStorage:
  - 'auth-storage': { state: { user, token, isAuthenticated } }
```

## Vantaggi

✅ **Nessun loop**: Una sola fonte di verità per l'autenticazione  
✅ **Nessuna doppia verifica**: L'interceptor gestisce tutto automaticamente  
✅ **Stato consistente**: Un solo punto di storage per il token  
✅ **Meno chiamate API**: Nessuna chiamata ridondante a `/auth/me`  
✅ **Migliore UX**: Redirect immediati e puliti in caso di token invalido  
✅ **Refresh funziona**: F5 non fa più logout, rimani autenticato  
✅ **Hydration sicura**: Verifica auth solo quando lo stato è pronto  

## Test Consigliati

1. **Login con credenziali valide** → Dovrebbe salvare token e permettere accesso
2. **Refresh della pagina (F5)** → Dovrebbe mantenere l'autenticazione ✨ NUOVO
3. **Navigazione tra pagine + refresh** → Dovrebbe mantenere auth ovunque ✨ NUOVO
4. **Token scaduto** → Dovrebbe fare redirect a login senza loop
5. **Logout manuale** → Dovrebbe pulire tutto e tornare al login
6. **Accesso a rotte protette senza token** → Dovrebbe reindirizzare al login

## Note Tecniche

- Zustand `persist` middleware usa `auth-storage` come chiave nel localStorage
- Il formato è: `{ state: { user, token, isAuthenticated }, version: 0 }`
- L'interceptor fa parsing sicuro con try/catch per evitare crash
- Il redirect controlla `window.location.pathname` per evitare loop infiniti
- **Hydration**: `onRehydrateStorage` callback imposta `hasHydrated: true` quando lo store è pronto
- **Performance**: L'hydration richiede ~50-100ms, impercettibile per l'utente
- Durante l'hydration, il componente ritorna `null` (schermo vuoto momentaneo)

