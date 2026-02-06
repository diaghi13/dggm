# 🚀 Supervisor Setup - Production Queue Worker

**Sistema**: Debian/Ubuntu
**Scopo**: Mantenere `php artisan queue:work` sempre attivo in produzione

---

## 📋 Step 1: Installa Supervisor

```bash
# Su Debian/Ubuntu
sudo apt update
sudo apt install supervisor -y

# Verifica installazione
sudo supervisorctl version
```

---

## 📝 Step 2: Crea File Configurazione

Crea il file di configurazione per il worker DGGM:

```bash
sudo nano /etc/supervisor/conf.d/dggm-queue-worker.conf
```

**Contenuto del file**:

```ini
[program:dggm-queue-worker]
process_name=%(program_name)s_%(process_num)02d
command=php /var/www/dggm/backend/artisan queue:work --sleep=3 --tries=3 --max-time=3600 --timeout=60
autostart=true
autorestart=true
stopasgroup=true
killasgroup=true
user=www-data
numprocs=2
redirect_stderr=true
stdout_logfile=/var/www/dggm/backend/storage/logs/queue-worker.log
stdout_logfile_maxbytes=10MB
stdout_logfile_backups=5
stopwaitsecs=3600
```

### 📖 Spiegazione Parametri

| Parametro | Valore | Descrizione |
|-----------|--------|-------------|
| `process_name` | `dggm-queue-worker_%(process_num)02d` | Nome processo (es. dggm-queue-worker_00) |
| `command` | `php artisan queue:work...` | Comando da eseguire |
| `--sleep=3` | 3 secondi | Attesa tra controlli coda |
| `--tries=3` | 3 tentativi | Retry per job falliti |
| `--max-time=3600` | 1 ora | Riavvio worker dopo 1h (memoria) |
| `--timeout=60` | 60 secondi | Timeout singolo job |
| `autostart` | true | Avvio automatico con sistema |
| `autorestart` | true | Riavvio automatico se crasha |
| `user` | www-data | Utente di esecuzione (stesso di PHP-FPM) |
| `numprocs` | 2 | Numero processi paralleli |
| `stdout_logfile` | path | File log output |

---

## 🔧 Step 3: Personalizza Percorsi

⚠️ **IMPORTANTE**: Modifica questi percorsi nel file `.conf`:

```bash
# Cambia da:
command=php /var/www/dggm/backend/artisan queue:work...
stdout_logfile=/var/www/dggm/backend/storage/logs/queue-worker.log

# A (il tuo percorso reale):
command=php /percorso/reale/al/tuo/progetto/backend/artisan queue:work...
stdout_logfile=/percorso/reale/al/tuo/progetto/backend/storage/logs/queue-worker.log
```

**Come trovare il percorso**:
```bash
# Sul server:
cd ~/dggm/backend
pwd
# Output esempio: /home/deploy/dggm/backend
```

---

## ⚙️ Step 4: Verifica Permessi

Il worker deve poter scrivere nei log:

```bash
# Sul server, nella directory del progetto:
cd /percorso/tuo/progetto/backend

# Assicurati che www-data possa scrivere
sudo chown -R www-data:www-data storage/
sudo chmod -R 775 storage/

# Verifica
ls -la storage/logs/
```

---

## 🚀 Step 5: Avvia Supervisor

```bash
# 1. Rileggi le configurazioni
sudo supervisorctl reread

# Output atteso:
# dggm-queue-worker: available

# 2. Aggiorna Supervisor con le nuove config
sudo supervisorctl update

# Output atteso:
# dggm-queue-worker: added process group

# 3. Verifica status
sudo supervisorctl status

# Output atteso:
# dggm-queue-worker:dggm-queue-worker_00   RUNNING   pid 12345, uptime 0:00:05
# dggm-queue-worker:dggm-queue-worker_01   RUNNING   pid 12346, uptime 0:00:05
```

---

## 📊 Step 6: Comandi Utili

### **Status Worker**
```bash
sudo supervisorctl status dggm-queue-worker:*
```

### **Start Worker**
```bash
sudo supervisorctl start dggm-queue-worker:*
```

### **Stop Worker**
```bash
sudo supervisorctl stop dggm-queue-worker:*
```

### **Restart Worker**
```bash
sudo supervisorctl restart dggm-queue-worker:*
```

### **Leggi Log Real-time**
```bash
tail -f /percorso/tuo/progetto/backend/storage/logs/queue-worker.log
```

### **Restart dopo deploy**
```bash
# Dopo ogni deploy, riavvia il worker per caricare nuovo codice
sudo supervisorctl restart dggm-queue-worker:*
```

---

## 🔍 Step 7: Test Funzionamento

### **1. Verifica worker attivo**
```bash
ps aux | grep "queue:work"
```

Dovresti vedere 2 processi attivi.

### **2. Testa con cambio password**

Dal tuo frontend:
1. Cambia password di un utente
2. Controlla i log:
   ```bash
   tail -f storage/logs/queue-worker.log
   ```
3. Dovresti vedere:
   ```
   [2026-02-05 15:00:00] Processing: App\Listeners\LogPasswordActivity
   [2026-02-05 15:00:01] Processed:  App\Listeners\LogPasswordActivity
   ```

### **3. Verifica email su Mailtrap (dev) o casella reale (prod)**

---

## 🐛 Troubleshooting

### **Worker non si avvia**

```bash
# Controlla errori Supervisor
sudo supervisorctl tail dggm-queue-worker:dggm-queue-worker_00 stderr

# Controlla log Laravel
tail -50 /percorso/progetto/backend/storage/logs/laravel.log
```

**Errori comuni**:

1. **"command not found: php"**
   ```bash
   # Usa percorso assoluto PHP
   which php
   # Output: /usr/bin/php

   # Modifica command in .conf:
   command=/usr/bin/php /percorso/artisan queue:work...
   ```

2. **"Permission denied"**
   ```bash
   sudo chown -R www-data:www-data storage/
   sudo chmod -R 775 storage/
   ```

3. **"Database connection refused"**
   ```bash
   # Verifica .env è corretto
   cat /percorso/progetto/backend/.env | grep DB_

   # Testa connessione
   php artisan tinker --execute="DB::connection()->getPdo();"
   ```

### **Worker crasha continuamente**

```bash
# Aumenta memoria PHP
sudo nano /etc/php/8.3/cli/php.ini

# Trova e modifica:
memory_limit = 512M

# Restart Supervisor
sudo supervisorctl restart dggm-queue-worker:*
```

### **Job restano in coda**

```bash
# Sul server, verifica jobs pending
php artisan queue:work --once

# Se funziona manualmente ma non con Supervisor:
# Verifica utente corretto (www-data)
sudo -u www-data php artisan queue:work --once
```

---

## 🔄 Step 8: Deploy Automation

Aggiungi al tuo script di deploy:

```bash
#!/bin/bash
# deploy.sh

# ... (git pull, composer install, etc.)

# Riavvia queue worker per caricare nuovo codice
echo "🔄 Restarting queue workers..."
sudo supervisorctl restart dggm-queue-worker:*

# Attendi che ripartano
sleep 3

# Verifica status
sudo supervisorctl status dggm-queue-worker:*

echo "✅ Deploy completed!"
```

---

## 📧 Step 9: SMTP Produzione

Non dimenticare di configurare SMTP reale in produzione!

**Nel file `.env` (produzione)**:

```env
# Mailtrap (SOLO per staging/test)
# MAIL_MAILER=smtp
# MAIL_HOST=sandbox.smtp.mailtrap.io

# Produzione - Esempio Mailgun
MAIL_MAILER=smtp
MAIL_HOST=smtp.mailgun.org
MAIL_PORT=587
MAIL_USERNAME=postmaster@yourdomain.com
MAIL_PASSWORD=your-mailgun-password
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS=noreply@yourdomain.com
MAIL_FROM_NAME="${APP_NAME}"

# Oppure AWS SES
# MAIL_MAILER=ses
# AWS_ACCESS_KEY_ID=your-key
# AWS_SECRET_ACCESS_KEY=your-secret
# AWS_DEFAULT_REGION=eu-west-1
```

**Dopo modifica `.env`**:
```bash
php artisan config:clear
sudo supervisorctl restart dggm-queue-worker:*
```

---

## ✅ Checklist Finale

Prima di andare in produzione:

- [ ] Supervisor installato
- [ ] File `.conf` creato con percorsi corretti
- [ ] Permessi storage/ corretti (www-data)
- [ ] Worker avviato (`supervisorctl status`)
- [ ] Test cambio password → email ricevuta
- [ ] SMTP produzione configurato (non Mailtrap!)
- [ ] Script deploy include restart worker
- [ ] Monitoring attivo (logs, Sentry, etc.)

---

## 📊 Monitoring (Opzionale ma Consigliato)

### **Laravel Horizon** (alternativa visuale a Supervisor)

```bash
composer require laravel/horizon

php artisan horizon:install
php artisan migrate

# Poi accedi a:
https://tuodominio.com/horizon
```

### **Sentry per Error Tracking**

```bash
composer require sentry/sentry-laravel

# .env
SENTRY_LARAVEL_DSN=your-sentry-dsn
```

---

## 🎯 Riepilogo Comandi Essenziali

```bash
# Status
sudo supervisorctl status dggm-queue-worker:*

# Restart (dopo deploy)
sudo supervisorctl restart dggm-queue-worker:*

# Log real-time
tail -f storage/logs/queue-worker.log

# Failed jobs
php artisan queue:failed

# Retry failed
php artisan queue:retry all
```

---

**Setup completato!** 🎉

Il tuo sistema è pronto per produzione con email automatiche che funzionano in background tramite Supervisor.