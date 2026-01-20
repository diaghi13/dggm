# Configurazione Produzione - dggm-erp.ddns.net

## Problema Riscontrato

Dopo il login in produzione, l'utente viene reindirizzato dalla dashboard al login. Questo è causato da una configurazione errata dei cookie di autenticazione.

## Soluzione Rapida

### 1. Configurare il file .env del backend in produzione

Aggiungi/modifica queste variabili nel file `.env` del backend sul server di produzione:

```bash
# URL e Ambiente
APP_ENV=production
APP_DEBUG=false
APP_URL=https://dggm-erp.ddns.net
FRONTEND_URL=https://dggm-erp.ddns.net

# Configurazione Cookie (IMPORTANTE!)
SESSION_DOMAIN=.dggm-erp.ddns.net
SESSION_SECURE_COOKIE=true
SESSION_SAME_SITE=lax
SESSION_PATH=/

# Sanctum - Domini autorizzati
SANCTUM_STATEFUL_DOMAINS=dggm-erp.ddns.net
```

### 2. Riavviare il backend

Dopo aver modificato il file `.env`, esegui:

```bash
cd /path/to/backend
php artisan config:cache
php artisan cache:clear
php artisan config:clear
# Riavvia il server web (nginx/apache) o PHP-FPM
sudo systemctl restart php8.x-fpm  # o il tuo servizio PHP
sudo systemctl restart nginx       # o apache2
```

### 3. Testare

1. Apri il browser in modalità incognito
2. Vai su https://dggm-erp.ddns.net
3. Fai login
4. Apri DevTools > Application > Cookies
5. Verifica che il cookie `auth_token` sia presente con:
   - **Domain**: `.dggm-erp.ddns.net`
   - **Path**: `/`
   - **Secure**: ✓ (checked)
   - **HttpOnly**: ✓ (checked)
   - **SameSite**: `Lax`

6. Naviga alla dashboard - NON dovrebbe più reindirizzare al login

## Spiegazione Dettagliata

### Perché il problema si verificava?

1. **Dominio del cookie non configurato**: Il cookie veniva creato senza un dominio specifico, quindi il browser lo associava solo all'indirizzo esatto della risposta
2. **Richieste successive non includevano il cookie**: Quando il frontend faceva richieste all'API, il browser non inviava il cookie perché il dominio non corrispondeva
3. **401 Unauthorized**: Il backend non riceveva il token, quindi rispondeva con 401
4. **Redirect al login**: Il frontend intercettava il 401 e reindirizzava l'utente al login

### Come la soluzione risolve il problema?

1. **SESSION_DOMAIN=.dggm-erp.ddns.net**: Imposta il dominio del cookie in modo che sia valido per tutto il dominio (nota il punto iniziale)
2. **SESSION_SECURE_COOKIE=true**: Assicura che il cookie sia inviato solo su HTTPS (obbligatorio in produzione)
3. **SESSION_SAME_SITE=lax**: Permette l'invio del cookie con navigazioni top-level mantenendo la sicurezza CSRF
4. **SANCTUM_STATEFUL_DOMAINS**: Autorizza il dominio del frontend a effettuare richieste stateful

## Architettura del Sistema di Autenticazione

```
┌─────────────────────────────────────────────────────────────┐
│ BROWSER (https://dggm-erp.ddns.net)                         │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1. POST /api/v1/auth/login                                 │
│     { email, password }                                     │
│                                                              │
│  ◄────────────────────────────────────────────────────────  │
│     Response: { user }                                      │
│     Set-Cookie: auth_token=xxx; Domain=.dggm-erp.ddns.net   │
│                                                              │
│  2. Cookie salvato nel browser                              │
│     Domain: .dggm-erp.ddns.net                              │
│     Secure: true, HttpOnly: true, SameSite: Lax             │
│                                                              │
│  3. GET /api/v1/auth/me                                     │
│     Cookie: auth_token=xxx  ◄── Inviato automaticamente     │
│                                                              │
│  ──────────────────────────────────────────────────────────►│
│     Middleware: AddBearerTokenFromCookie                    │
│     Authorization: Bearer xxx  ◄── Aggiunto dal middleware  │
│                                                              │
│     Sanctum verifica il token                               │
│     ✓ Autenticazione riuscita                               │
│                                                              │
│  ◄────────────────────────────────────────────────────────  │
│     Response: { user }                                      │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## Configurazioni Alternative

### Se frontend e backend sono su porte diverse (es. localhost)

```bash
SESSION_DOMAIN=null
SESSION_SECURE_COOKIE=false
SESSION_SAME_SITE=lax
SANCTUM_STATEFUL_DOMAINS=localhost,localhost:3000,127.0.0.1,127.0.0.1:8000
```

### Se frontend e backend sono su sottodomini diversi

```bash
# Frontend: app.dggm-erp.ddns.net
# Backend: api.dggm-erp.ddns.net
SESSION_DOMAIN=.dggm-erp.ddns.net  # Nota il punto iniziale!
SESSION_SECURE_COOKIE=true
SESSION_SAME_SITE=lax
SANCTUM_STATEFUL_DOMAINS=app.dggm-erp.ddns.net,api.dggm-erp.ddns.net
```

### Se frontend e backend sono su domini completamente diversi

⚠️ **NON RACCOMANDATO** - I cookie non funzioneranno in questo scenario. Usa invece token JWT nel local storage o considera di unificare i domini.

## Checklist Post-Deploy

- [ ] File `.env` aggiornato con le variabili corrette
- [ ] Cache Laravel pulita (`php artisan config:cache`)
- [ ] Server web/PHP-FPM riavviato
- [ ] HTTPS configurato e funzionante
- [ ] Certificato SSL valido (non self-signed in produzione)
- [ ] Cookie `auth_token` visibile in DevTools dopo il login
- [ ] Cookie ha Domain, Secure, HttpOnly, SameSite corretti
- [ ] Nessun errore 401 dopo il login
- [ ] Dashboard accessibile senza redirect al login
- [ ] Logout funzionante (cookie viene rimosso)

## Troubleshooting

### Il cookie non appare dopo il login

**Verifica:**
```bash
# Nel backend
php artisan config:show session
# Verifica che SESSION_DOMAIN, SESSION_SECURE_COOKIE, SESSION_SAME_SITE siano corretti

# Verifica i log
tail -f storage/logs/laravel.log
```

### Il cookie appare ma non viene inviato con le richieste

**Possibili cause:**
- Dominio del cookie non corrisponde al dominio della richiesta
- `Secure` è true ma stai usando HTTP (deve essere HTTPS)
- Problema con SameSite

**Soluzione:**
- Verifica che `SESSION_DOMAIN` sia corretto
- Verifica che HTTPS sia attivo
- Prova `SESSION_SAME_SITE=none` temporaneamente (richiede `SESSION_SECURE_COOKIE=true`)

### Errore CORS

**Verifica `config/cors.php`:**
```php
'allowed_origins' => [
    env('FRONTEND_URL', 'http://localhost:3000'),
],
'supports_credentials' => true,
```

**Verifica che `FRONTEND_URL` nel `.env` sia corretto**

### Errore "CSRF token mismatch"

**Questo non dovrebbe accadere** con l'autenticazione basata su Bearer token tramite cookie.

Se accade, verifica:
```bash
# config/sanctum.php
'stateful' => explode(',', env('SANCTUM_STATEFUL_DOMAINS', '...')),
```

## Contatti

In caso di problemi persistenti:
1. Controlla i log del backend: `storage/logs/laravel.log`
2. Controlla i log del frontend: Browser DevTools > Console
3. Controlla i log del web server: `/var/log/nginx/error.log` o `/var/log/apache2/error.log`
4. Verifica la configurazione HTTPS/certificato SSL

## Riferimenti

- Documentazione completa: [COOKIE_CONFIGURATION.md](./COOKIE_CONFIGURATION.md)
- Laravel Sanctum: https://laravel.com/docs/11.x/sanctum
- MDN Cookies: https://developer.mozilla.org/en-US/docs/Web/HTTP/Cookies
