# Configurazione Cookie di Autenticazione in Produzione

## Problema

In produzione, dopo il login l'utente viene reindirizzato dalla dashboard al login. Questo accade perché il cookie `auth_token` non viene inviato correttamente con le richieste successive al login.

## Causa

Il problema è causato da una configurazione errata del cookie di autenticazione. Quando il backend è su un dominio diverso dal frontend (es. `dggm-erp.ddns.net` per entrambi ma con porte diverse, o sottodomini diversi), il browser non invia il cookie se:

1. Il dominio del cookie non è configurato correttamente
2. Il flag `secure` non è impostato correttamente per HTTPS
3. Il flag `sameSite` impedisce l'invio cross-site

## Soluzione

### 1. Configurazione Backend (.env di produzione)

Aggiungere/modificare le seguenti variabili nel file `.env` del backend in produzione:

```bash
# URL del frontend (necessario per CORS)
FRONTEND_URL=https://dggm-erp.ddns.net

# Configurazione cookie di sessione
SESSION_DOMAIN=.dggm-erp.ddns.net  # Nota il punto iniziale per includere sottodomini
SESSION_SECURE_COOKIE=true         # true in produzione con HTTPS
SESSION_SAME_SITE=lax             # lax o none (none richiede secure=true)
SESSION_PATH=/

# Configurazione SANCTUM (importante!)
SANCTUM_STATEFUL_DOMAINS=dggm-erp.ddns.net,www.dggm-erp.ddns.net
```

### 2. Spiegazione dei parametri

#### SESSION_DOMAIN
- **`.dggm-erp.ddns.net`** (con punto iniziale): Il cookie sarà valido per tutti i sottodomini
- **`dggm-erp.ddns.net`** (senza punto): Il cookie sarà valido solo per il dominio esatto
- **`null`** o non impostato: Il cookie sarà valido solo per il dominio esatto della richiesta

**Consiglio**: Se frontend e backend sono sullo stesso dominio ma porte diverse in sviluppo, usa `null`. In produzione, se sono su sottodomini diversi, usa il dominio con il punto iniziale.

#### SESSION_SECURE_COOKIE
- **`true`**: Il cookie viene inviato solo su connessioni HTTPS (OBBLIGATORIO in produzione)
- **`false`**: Il cookie viene inviato anche su HTTP (solo per sviluppo locale)

#### SESSION_SAME_SITE
- **`lax`**: Il cookie viene inviato con richieste same-site e navigazioni top-level (raccomandato)
- **`strict`**: Il cookie viene inviato solo con richieste same-site (più sicuro ma può causare problemi)
- **`none`**: Il cookie viene inviato con tutte le richieste (richiede `secure=true`)

#### SANCTUM_STATEFUL_DOMAINS
Lista di domini separati da virgola che possono effettuare richieste stateful (con cookie). Deve includere tutti i domini da cui il frontend effettuerà richieste.

### 3. Verifica della configurazione

Dopo aver applicato le modifiche:

1. **Riavviare il backend** per applicare le nuove configurazioni:
   ```bash
   php artisan config:cache
   php artisan cache:clear
   ```

2. **Verificare i cookie nel browser** (DevTools > Application > Cookies):
   - Il cookie `auth_token` deve apparire dopo il login
   - Deve avere il dominio corretto (`.dggm-erp.ddns.net` o quello configurato)
   - Deve avere `Secure` = `true` in produzione
   - Deve avere `HttpOnly` = `true`
   - Deve avere `SameSite` = `Lax` (o il valore configurato)

3. **Verificare le richieste** (DevTools > Network):
   - Dopo il login, verificare che il cookie `auth_token` venga inviato con le richieste successive
   - Verificare che l'header `Authorization: Bearer ...` sia presente (aggiunto dal middleware)

### 4. Troubleshooting

#### Il cookie non viene inviato con le richieste

**Possibili cause:**
- Dominio del cookie errato
- Frontend e backend su domini completamente diversi (es. `example.com` e `api.other.com`)
- HTTPS non configurato correttamente

**Soluzioni:**
- Verificare che `SESSION_DOMAIN` sia configurato correttamente
- Verificare che `FRONTEND_URL` e `SANCTUM_STATEFUL_DOMAINS` includano il dominio del frontend
- Verificare che HTTPS sia attivo in produzione

#### Error 401 dopo il login

**Possibili cause:**
- Il cookie viene inviato ma il token non è valido
- Il middleware `AddBearerTokenFromCookie` non sta funzionando

**Soluzioni:**
- Verificare che il middleware sia registrato in `bootstrap/app.php`
- Verificare i log del backend per errori di autenticazione
- Provare a fare il logout e login di nuovo

#### Cookie bloccato dal browser

**Possibili cause:**
- `sameSite=none` richiede `secure=true`
- Browser moderni bloccano cookie third-party

**Soluzioni:**
- Usare `sameSite=lax` invece di `none`
- Assicurarsi che `SESSION_SECURE_COOKIE=true` in produzione
- Verificare che frontend e backend siano sullo stesso dominio root

## Configurazione Attuale

### Sviluppo (localhost)
```bash
SESSION_DOMAIN=null
SESSION_SECURE_COOKIE=false
SESSION_SAME_SITE=lax
FRONTEND_URL=http://localhost:3000
SANCTUM_STATEFUL_DOMAINS=localhost,localhost:3000,127.0.0.1,127.0.0.1:8000
```

### Produzione (dggm-erp.ddns.net)
```bash
SESSION_DOMAIN=.dggm-erp.ddns.net
SESSION_SECURE_COOKIE=true
SESSION_SAME_SITE=lax
FRONTEND_URL=https://dggm-erp.ddns.net
SANCTUM_STATEFUL_DOMAINS=dggm-erp.ddns.net
```

## Modifiche al Codice

Le modifiche al codice sono già state applicate in `app/Http/Controllers/Api/V1/AuthController.php`:

1. Il metodo `login()` ora usa `config('session.domain')` invece di `null`
2. Il metodo `login()` ora usa `config('session.secure')` invece di `config('app.env') === 'production'`
3. Il metodo `login()` ora usa `config('session.same_site')` invece di `'lax'` hardcoded
4. Lo stesso vale per il metodo `logout()`

Questo permette di configurare i cookie tramite variabili d'ambiente senza modificare il codice.

## Test

### Test locale
1. Fare login
2. Verificare che il cookie `auth_token` sia presente
3. Navigare alla dashboard
4. Verificare che non venga fatto redirect al login

### Test produzione
1. Configurare le variabili d'ambiente come sopra
2. Riavviare il backend
3. Pulire i cookie del browser
4. Fare login
5. Verificare che il cookie `auth_token` sia presente con dominio e flag corretti
6. Navigare alla dashboard
7. Verificare che non venga fatto redirect al login

## Note Importanti

1. **Non usare `sameSite=none` a meno che non sia assolutamente necessario** (es. iframe cross-domain)
2. **Sempre usare `secure=true` in produzione** per proteggere i cookie
3. **Il dominio deve essere lo stesso root domain** per frontend e backend (es. `app.example.com` e `api.example.com` con `SESSION_DOMAIN=.example.com`)
4. **In caso di cambio di dominio**, i vecchi cookie non funzioneranno - gli utenti dovranno fare logout/login

## Riferimenti

- [Laravel Sanctum Documentation](https://laravel.com/docs/11.x/sanctum)
- [MDN: Set-Cookie](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Set-Cookie)
- [MDN: SameSite cookies](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Set-Cookie/SameSite)
