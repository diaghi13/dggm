# 🚀 Queue Worker - Guida Rapida

## ❗ Problema

Le email di notifica password vengono messe in coda ma non inviate perché **il queue worker non è attivo**.

---

## ✅ Soluzioni

### **Soluzione 1: Avvia Queue Worker (Consigliato per Sviluppo)**

Apri un **nuovo terminale** e mantienilo aperto:

```bash
cd /Users/davidedonghi/Apps/dggm/backend
php artisan queue:work --tries=3 --timeout=60
```

**Quando chiudere**: Mai durante sviluppo. Tienilo aperto come il server.

**Vantaggi**:
- ✅ Simula ambiente produzione
- ✅ Job async (non blocca response)
- ✅ Vedi email processate in real-time

**Log output**:
```
[YYYY-MM-DD HH:MM:SS] Processing: App\Listeners\LogPasswordActivity
[YYYY-MM-DD HH:MM:SS] Processed:  App\Listeners\LogPasswordActivity (0.1s)
```

---

### **Soluzione 2: Sync Queue (Più Semplice)**

Per sviluppo, esegui email immediatamente senza queue:

**Modifica `.env`**:
```env
# Cambia da:
QUEUE_CONNECTION=database

# A:
QUEUE_CONNECTION=sync
```

Poi:
```bash
php artisan config:clear
php artisan queue:restart
```

**Vantaggi**:
- ✅ Nessun queue worker da avviare
- ✅ Email immediate
- ✅ Più semplice per debug

**Svantaggi**:
- ❌ Response più lenta (attende invio email)
- ❌ Non simula produzione

---

### **Soluzione 3: Composer Script (Best)**

Aggiungi uno script al `composer.json` per avviare tutto:

**File `composer.json`**:
```json
"scripts": {
    "dev": [
        "@php artisan serve --host=0.0.0.0 --port=8000 & php artisan queue:work --tries=3 &"
    ],
    "dev:stop": [
        "pkill -f 'artisan serve' && pkill -f 'artisan queue:work'"
    ]
}
```

Poi esegui:
```bash
composer dev        # Avvia server + queue worker
composer dev:stop   # Ferma tutto
```

---

## 🧪 Test Veloce

Dopo aver avviato il queue worker (soluzione 1 o 3) o cambiato a sync (soluzione 2):

**Cambia password dal frontend e verifica**:
```bash
# In un altro terminale:
tail -f storage/logs/laravel.log | grep "Password activity"

# Output atteso:
# [2026-02-05 14:00:00] local.INFO: Password activity {"event":"password_changed"...}
```

**Controlla Mailtrap**:
https://mailtrap.io/inboxes

---

## 📊 Verifica Status

### **Check jobs in queue**:
```bash
php artisan tinker --execute="echo DB::table('jobs')->count();"
```

- `0` = Tutti processati ✅
- `> 0` = Jobs pending, serve queue worker ⚠️

### **Check failed jobs**:
```bash
php artisan queue:failed
```

### **Retry failed jobs**:
```bash
php artisan queue:retry all
```

### **Clear failed jobs**:
```bash
php artisan queue:flush
```

---

## 🚀 Produzione

In produzione, usa **Supervisor** per mantenere queue worker sempre attivo:

**File `/etc/supervisor/conf.d/dggm-worker.conf`**:
```ini
[program:dggm-worker]
process_name=%(program_name)s_%(process_num)02d
command=php /path/to/artisan queue:work --sleep=3 --tries=3 --timeout=60
autostart=true
autorestart=true
stopasgroup=true
killasgroup=true
user=www-data
numprocs=2
redirect_stderr=true
stdout_logfile=/path/to/storage/logs/worker.log
```

Poi:
```bash
sudo supervisorctl reread
sudo supervisorctl update
sudo supervisorctl start dggm-worker:*
```

---

## 💡 Raccomandazione

**Per sviluppo**: Usa **Soluzione 2 (sync)** → più semplice, meno terminali aperti

**Per staging/produzione**: Usa **Soluzione 1 (database + supervisor)** → async, scalabile

---

**Problema risolto?** Ora dovresti ricevere le email! 🎉