# Fix: Redirect al Login dopo l'Autenticazione in Produzione

## 🔴 Problema

Dopo aver effettuato il login in produzione (`https://dggm-erp.ddns.net`), l'utente viene immediatamente reindirizzato dalla dashboard alla pagina di login.

## ✅ Causa

Il cookie `auth_token` non viene configurato correttamente, quindi il browser non lo invia con le richieste successive. Il backend non riceve il token di autenticazione e risponde con 401 Unauthorized, causando il redirect.

## 🚀 Soluzione Rapida (5 minuti)

### 1. Configura il file .env del backend sul server di produzione

```bash
# Accedi al server
ssh user@dggm-erp.ddns.net

# Modifica il file .env del backend
cd /path/to/backend
nano .env
```

Aggiungi/modifica queste righe:

```bash
# Configurazione base
APP_ENV=production
APP_URL=https://dggm-erp.ddns.net
FRONTEND_URL=https://dggm-erp.ddns.net

# Configurazione cookie (IMPORTANTE!)
SESSION_DOMAIN=.dggm-erp.ddns.net
SESSION_SECURE_COOKIE=true
SESSION_SAME_SITE=lax

# Sanctum
SANCTUM_STATEFUL_DOMAINS=dggm-erp.ddns.net
```

### 2. Applica le modifiche

```bash
# Pulisci la cache di configurazione
php artisan config:cache
php artisan cache:clear

# Riavvia il server (scegli quello appropriato)
sudo systemctl restart php8.2-fpm
sudo systemctl restart nginx
# oppure
sudo systemctl restart apache2
```

### 3. Testa

1. Apri il browser in **modalità incognito**
2. Vai su `https://dggm-erp.ddns.net`
3. Effettua il login
4. Verifica che la dashboard si carichi senza redirect

## 📊 Verifica Dettagliata

### Controlla i cookie nel browser

1. Dopo il login, apri **DevTools** (F12)
2. Vai su **Application** > **Cookies** > `https://dggm-erp.ddns.net`
3. Cerca il cookie `auth_token`
4. Verifica che abbia:
   - **Name**: `auth_token`
   - **Domain**: `.dggm-erp.ddns.net` (con il punto iniziale)
   - **Path**: `/`
   - **Secure**: ✅ (checked)
   - **HttpOnly**: ✅ (checked)
   - **SameSite**: `Lax`

### Controlla le richieste di rete

1. DevTools > **Network**
2. Effettua il login
3. Osserva la richiesta `POST /api/v1/auth/login`
4. Nella risposta, controlla gli header:
   - Dovrebbe esserci `Set-Cookie: auth_token=...`
5. Osserva le richieste successive (es. `GET /api/v1/auth/me`)
6. Negli header della richiesta, verifica che ci sia:
   - `Cookie: auth_token=...`

## 🔧 Script di Verifica Automatica

Nel backend c'è uno script che verifica la configurazione:

```bash
cd /path/to/backend
./check-cookie-config.sh
```

Lo script controllerà:
- ✓ Variabili d'ambiente configurate correttamente
- ✓ Configurazione sessione
- ✓ Configurazione Sanctum
- ✓ Middleware registrati
- ✓ Suggerimenti per l'ambiente corrente

## 📖 Documentazione Completa

Per maggiori dettagli, consulta:

- **[PRODUCTION_SETUP.md](./PRODUCTION_SETUP.md)** - Guida completa setup produzione
- **[COOKIE_CONFIGURATION.md](./COOKIE_CONFIGURATION.md)** - Documentazione tecnica dettagliata sui cookie

## ⚠️ Note Importanti

### Per sviluppo locale

Le configurazioni di sviluppo sono diverse:

```bash
SESSION_DOMAIN=null
SESSION_SECURE_COOKIE=false
SESSION_SAME_SITE=lax
SANCTUM_STATEFUL_DOMAINS=localhost,localhost:3000,127.0.0.1,127.0.0.1:8000
```

### Per HTTPS

Il flag `SESSION_SECURE_COOKIE=true` richiede HTTPS. Se non hai HTTPS configurato:

1. **Usa Let's Encrypt** per un certificato SSL gratuito:
   ```bash
   sudo certbot --nginx -d dggm-erp.ddns.net
   ```

2. Oppure temporaneamente usa `SESSION_SECURE_COOKIE=false` (NON raccomandato per produzione)

### Dominio con punto iniziale

`SESSION_DOMAIN=.dggm-erp.ddns.net` (con il punto) permette al cookie di funzionare su:
- `dggm-erp.ddns.net`
- `www.dggm-erp.ddns.net`
- `api.dggm-erp.ddns.net`
- Qualsiasi sottodominio

Senza il punto, funzionerebbe solo sul dominio esatto.

## 🐛 Troubleshooting

### Il cookie non appare dopo il login

**Causa possibile**: Errore nella risposta del backend

**Soluzione**: 
```bash
# Controlla i log
tail -f storage/logs/laravel.log
```

### Il cookie appare ma non viene inviato

**Causa possibile**: Dominio del cookie non corrisponde

**Soluzione**: 
- Verifica che `SESSION_DOMAIN` sia corretto
- Se frontend e backend sono su domini diversi, assicurati che condividano lo stesso dominio root

### Errore CORS

**Causa possibile**: CORS non configurato per accettare credentials

**Soluzione**:
Verifica che `config/cors.php` abbia:
```php
'supports_credentials' => true,
'allowed_origins' => [
    env('FRONTEND_URL', 'http://localhost:3000'),
],
```

## 📞 Supporto

Se il problema persiste:

1. Esegui `./check-cookie-config.sh` e condividi l'output
2. Controlla i log: `storage/logs/laravel.log`
3. Controlla la console del browser per errori JavaScript
4. Verifica che HTTPS sia configurato correttamente

---

**Modifiche applicate al codice**:
- `AuthController.php`: Aggiornato per usare configurazioni da `.env`
- `.env.example`: Aggiornato con nuove variabili
- Documentazione completa creata

**Data fix**: 20 Gennaio 2026
