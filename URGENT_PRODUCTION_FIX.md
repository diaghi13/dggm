# 🚨 FIX IMMEDIATO - Configurazione Errata in Produzione

## ❌ PROBLEMI CRITICI Trovati

### 1. SESSION_DOMAIN Troppo Generico (GRAVE!)
```bash
# ATTUALE (PERICOLOSO!)
SESSION_DOMAIN=.ddns.net

# PROBLEMA: Questo permette a TUTTI i siti *.ddns.net di leggere il cookie!
# Qualsiasi sito come "malicious.ddns.net" potrebbe rubare il tuo token!
```

### 2. SESSION_SECURE_COOKIE non sicuro
```bash
# ATTUALE (INSICURO!)
SESSION_SECURE_COOKIE=false

# PROBLEMA: Il cookie può essere intercettato su connessioni HTTP
```

### 3. SESSION_DOMAIN duplicato
```bash
# Nel file .env ci sono DUE righe:
# SESSION_DOMAIN=null  (commentata)
SESSION_DOMAIN=.ddns.net  (attiva)
```

---

## ✅ SOLUZIONE RAPIDA (2 minuti)

### Opzione 1: Script Automatico (RACCOMANDATO)

Sul server di produzione:

```bash
# 1. Vai nella directory backend
cd /var/www/html/dggm/backend

# 2. Esegui lo script di fix
bash fix-production-env.sh

# 3. Riavvia i servizi
sudo systemctl restart php8.2-fpm
sudo systemctl restart nginx
```

### Opzione 2: Manuale

Sul server di produzione:

```bash
# 1. Vai nella directory backend
cd /var/www/html/dggm/backend

# 2. Backup del file .env
cp .env .env.backup

# 3. Modifica il file .env
nano .env
```

**Trova e MODIFICA queste righe:**

```bash
# PRIMA (SBAGLIATO)
# SESSION_DOMAIN=null
SESSION_SECURE_COOKIE=false
SESSION_SAME_SITE=lax
SESSION_DOMAIN=.ddns.net

# DOPO (CORRETTO)
SESSION_DOMAIN=.dggm-erp.ddns.net
SESSION_SECURE_COOKIE=true
SESSION_SAME_SITE=lax
```

**Salva** (Ctrl+O, Invio, Ctrl+X) e poi:

```bash
# 4. Pulisci la cache
php artisan config:clear
php artisan cache:clear
php artisan config:cache

# 5. Riavvia i servizi
sudo systemctl restart php8.2-fpm
sudo systemctl restart nginx

# O se usi Apache:
# sudo systemctl restart apache2
```

---

## 🔍 Verifica che Funzioni

### 1. Test Login

1. Apri browser in **modalità incognito**
2. Vai su `https://dggm-erp.ddns.net`
3. Fai login
4. **La dashboard dovrebbe caricarsi senza redirect** ✓

### 2. Verifica Cookie (DevTools)

1. Dopo il login, premi F12
2. Vai su **Application** > **Cookies** > `https://dggm-erp.ddns.net`
3. Trova il cookie `auth_token`
4. Verifica:

```
✓ Domain:    .dggm-erp.ddns.net  (non più .ddns.net!)
✓ Secure:    ✓ (checked)
✓ HttpOnly:  ✓ (checked)
✓ SameSite:  Lax
```

### 3. Verifica Richieste (DevTools > Network)

1. Dopo il login, guarda le richieste
2. Le richieste all'API dovrebbero includere:
   - **Cookie**: `auth_token=xxx`
   - Nessun errore 401

---

## 📋 Configurazione Finale Corretta

Il tuo file `.env` in produzione dovrebbe avere:

```bash
APP_NAME=DGGM-ERP
APP_ENV=production
APP_KEY=base64:XJuIww1G8Nz+nh7dXyUx0UVhTIsG6RK5b8djrJu9h+Q=
APP_DEBUG=false
APP_URL=https://dggm-erp.ddns.net
FRONTEND_URL=https://dggm-erp.ddns.net

# ... altre configurazioni ...

# ✅ CONFIGURAZIONE COOKIE CORRETTA
SESSION_DRIVER=database
SESSION_LIFETIME=120
SESSION_ENCRYPT=false
SESSION_PATH=/
SESSION_DOMAIN=.dggm-erp.ddns.net
SESSION_SECURE_COOKIE=true
SESSION_SAME_SITE=lax

# ... altre configurazioni ...

SANCTUM_STATEFUL_DOMAINS=dggm-erp.ddns.net
```

**Nota**: Rimuovi eventuali righe duplicate o commentate di `SESSION_DOMAIN`

---

## 🛡️ Perché Queste Modifiche sono Importanti?

### SESSION_DOMAIN=.dggm-erp.ddns.net invece di .ddns.net

**Prima (INSICURO):**
```
.ddns.net → Cookie leggibile da:
  - dggm-erp.ddns.net ✓
  - malicious.ddns.net ❌ PERICOLO!
  - any-site.ddns.net ❌ PERICOLO!
  - Qualsiasi sottodominio di ddns.net
```

**Dopo (SICURO):**
```
.dggm-erp.ddns.net → Cookie leggibile da:
  - dggm-erp.ddns.net ✓
  - www.dggm-erp.ddns.net ✓
  - api.dggm-erp.ddns.net ✓
  - SOLO sottodomini di dggm-erp.ddns.net
```

### SESSION_SECURE_COOKIE=true invece di false

**Prima (INSICURO):**
- Cookie inviato anche su HTTP
- Possibile intercettazione Man-in-the-Middle
- Token esposto in chiaro

**Dopo (SICURO):**
- Cookie inviato SOLO su HTTPS
- Traffico criptato
- Token protetto

---

## ⚠️ Se qualcosa va storto

### Ripristina il backup

```bash
cd /var/www/html/dggm/backend
cp .env.backup .env
php artisan config:cache
sudo systemctl restart php8.2-fpm nginx
```

### Controlla i log

```bash
# Log Laravel
tail -f storage/logs/laravel.log

# Log Nginx
sudo tail -f /var/log/nginx/error.log

# Log PHP
sudo tail -f /var/log/php8.2-fpm.log
```

---

## 📞 Supporto

Se dopo le modifiche il problema persiste:

1. Verifica che HTTPS sia configurato correttamente
2. Verifica che il certificato SSL sia valido
3. Pulisci i cookie del browser completamente
4. Prova in modalità incognito
5. Controlla i log (vedi sopra)

---

## ✅ Checklist Finale

- [ ] Backup del file `.env` creato
- [ ] `SESSION_DOMAIN=.dggm-erp.ddns.net` (con punto iniziale)
- [ ] `SESSION_SECURE_COOKIE=true`
- [ ] `SESSION_SAME_SITE=lax`
- [ ] Nessuna riga duplicata di `SESSION_DOMAIN`
- [ ] Cache Laravel pulita (`config:cache`)
- [ ] Servizi riavviati (PHP-FPM + Nginx)
- [ ] Test login in modalità incognito
- [ ] Cookie `auth_token` presente con Domain corretto
- [ ] Dashboard carica senza redirect
- [ ] Navigazione nell'app funziona

---

**Data**: 20 Gennaio 2026
**Criticità**: 🔴 ALTA (vulnerabilità di sicurezza + funzionalità rotta)
**Tempo richiesto**: 2-5 minuti
**Downtime**: ~30 secondi (riavvio servizi)
