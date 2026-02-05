# Email Notifications - Sistema Completo

**Data**: Febbraio 2026
**Status**: ✅ Completamente configurato e testato

---

## 📧 Configurazione Email

### **Mailtrap (Development/Test)**
```env
MAIL_MAILER=smtp
MAIL_HOST=sandbox.smtp.mailtrap.io
MAIL_PORT=2525
MAIL_USERNAME=6dfa0b51505edc
MAIL_PASSWORD=06445fbe51d113
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS="noreply@dggm.test"
MAIL_FROM_NAME="${APP_NAME}"
```

**Status**: ✅ Configurato e testato
**Inbox**: https://mailtrap.io/inboxes

---

## 📨 Notifiche Email Implementate

### **1. Sistema Password (Sicurezza)**

| Evento | Notifica | Trigger | Contenuto |
|--------|----------|---------|-----------|
| **Forgot Password** | `ResetPassword` (Laravel) | User richiede reset | Link con token |
| **Password Reset** | `PasswordResetSuccessful` | Reset completato | IP, Device, Timestamp, Avviso sicurezza |
| **Password Change** | `PasswordChangedNotification` | Cambio password | IP, Device, Timestamp, Avviso |

**Features**:
- ✅ Email automatiche via Listener `LogPasswordActivity`
- ✅ Queue async (`ShouldQueue`)
- ✅ Device detection (iPhone, Android, PC, Mac)
- ✅ IP address tracking
- ✅ Timestamp italiano (d/m/Y alle H:i)
- ✅ Link diretto al login
- ✅ Avvisi sicurezza

### **2. Sistema Workers**

| Notifica | Trigger | Canali |
|----------|---------|--------|
| `WorkerInvited` | Invito collaboratore | `mail` |
| `WorkerAssignedToSite` | Assegnazione cantiere | `mail`, `database` |
| `AssignmentRespondedByWorker` | Risposta assegnazione | `mail`, `database` |

### **3. Sistema Materiali**

| Notifica | Trigger | Canali |
|----------|---------|--------|
| `MaterialRequested` | Richiesta materiale | `mail`, `database` |
| `MaterialRequestApproved` | Richiesta approvata | `mail`, `database` |
| `MaterialRequestRejected` | Richiesta rifiutata | `mail`, `database` |

---

## 🏗️ Architettura Notifiche

### **Pattern Event-Driven**

```
Action → Event → Listener → Notification → Email
```

**Esempio Password Reset**:
```php
ResetPasswordAction::execute()
    ↓
PasswordReset::dispatch()
    ↓
LogPasswordActivity::handle()
    ↓
PasswordResetSuccessful Notification
    ↓
Email inviata (queued)
```

### **File Struttura**

```
app/
├── Actions/Auth/
│   ├── SendPasswordResetLinkAction.php
│   ├── ResetPasswordAction.php
│   └── ChangePasswordAction.php
├── Events/
│   ├── PasswordResetRequested.php
│   ├── PasswordReset.php
│   └── PasswordChanged.php
├── Listeners/
│   └── LogPasswordActivity.php (invia email)
├── Notifications/
│   ├── PasswordResetSuccessful.php         ← NEW
│   ├── PasswordChangedNotification.php     ← NEW
│   ├── WorkerInvited.php
│   ├── MaterialRequested.php
│   └── ... (altre 4 notifiche)
└── Http/Controllers/Api/V1/
    ├── AuthController.php
    └── NotificationController.php (notifiche in-app)
```

---

## 📊 Sistema Notifiche Database

### **In-App Notifications**

Il sistema include anche notifiche persistenti nel database:

**Endpoints**:
- `GET /api/v1/notifications` - Lista notifiche
- `GET /api/v1/notifications/unread-count` - Contatore
- `POST /api/v1/notifications/{id}/mark-read` - Segna letta
- `POST /api/v1/notifications/mark-all-read` - Segna tutte
- `DELETE /api/v1/notifications/{id}` - Elimina
- `DELETE /api/v1/notifications/read/all` - Elimina lette

**Database**:
```sql
notifications (tabella Laravel standard)
├── id
├── type (classe notification)
├── notifiable_type (User)
├── notifiable_id
├── data (JSON payload)
├── read_at
└── created_at
```

---

## 🧪 Testing

### **Unit Tests**
```bash
php artisan test --filter=PasswordResetTest
```

**7 test coperti**:
- ✅ Richiesta reset password
- ✅ Validazione email invalida
- ✅ Reset con token valido
- ✅ Reset con token invalido
- ✅ Cambio password autenticato
- ✅ Validazione password attuale errata
- ✅ Autenticazione richiesta
- ✅ **Email sicurezza inviate** (PasswordResetSuccessful, PasswordChangedNotification)

### **Manual Test**
Usa `test-manual-password-reset.md` per test completi con curl.

---

## 📧 Template Email

### **Esempio: PasswordResetSuccessful**

```
Subject: Password Resettata con Successo

Ciao [Nome Utente],

La tua password è stata **resettata con successo**.

**Dettagli operazione:**
📅 Data e ora: 05/02/2026 alle 14:30
🌍 Indirizzo IP: 192.168.1.100
💻 Dispositivo: Mac

⚠️ Se non hai richiesto tu questa modifica, il tuo account potrebbe essere compromesso.

[Accedi al tuo Account]

Per sicurezza, tutte le sessioni attive sono state terminate.
Dovrai effettuare nuovamente il login.

Se hai domande o dubbi, contattaci immediatamente.

Cordiali saluti,
Il Team di DGGM ERP
```

---

## 🚀 Produzione

### **Passaggio a SMTP Reale**

Quando vai in produzione, aggiorna `.env`:

```env
# SMTP Gmail
MAIL_MAILER=smtp
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=your-app-password
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS="noreply@your-domain.com"
MAIL_FROM_NAME="DGGM ERP"
```

**Provider consigliati**:
- **Mailgun** (Laravel partner, 10k email/mese free)
- **AWS SES** (economico, affidabile)
- **Postmark** (delivery rate eccellente)
- **SendGrid** (100 email/giorno free)

### **Queue Worker**

In produzione, assicurati che il queue worker sia attivo:

```bash
php artisan queue:work --queue=default --tries=3 --timeout=60
```

**Supervisor Config** (`/etc/supervisor/conf.d/laravel-worker.conf`):
```ini
[program:laravel-worker]
process_name=%(program_name)s_%(process_num)02d
command=php /path/to/artisan queue:work --sleep=3 --tries=3
autostart=true
autorestart=true
stopasgroup=true
killasgroup=true
user=www-data
numprocs=2
redirect_stderr=true
stdout_logfile=/path/to/storage/logs/worker.log
```

---

## 📈 Monitoring

### **Log Email**

Tutte le email vengono loggate:

```bash
tail -f storage/logs/laravel.log | grep "Password activity"
```

### **Queue Failed Jobs**

```bash
php artisan queue:failed
php artisan queue:retry all
```

---

## 🔧 Troubleshooting

### Email non arrivano?

1. **Check queue**:
   ```bash
   php artisan queue:work
   ```

2. **Check logs**:
   ```bash
   tail -f storage/logs/laravel.log
   ```

3. **Test SMTP connection**:
   ```bash
   php artisan tinker
   Mail::raw('Test', fn($msg) => $msg->to('test@example.com')->subject('Test'));
   ```

### Mailtrap non riceve?

1. Verifica credenziali in `.env`
2. Controlla inbox corretto su Mailtrap
3. Verifica `MAIL_MAILER=smtp` (non `log`)

---

## 📝 Aggiungere Nuove Notifiche

### 1. Crea Notification
```bash
php artisan make:notification OrderShipped
```

### 2. Configura canali
```php
public function via(object $notifiable): array
{
    return ['mail', 'database']; // Scegli canali
}
```

### 3. Template Email
```php
public function toMail(object $notifiable): MailMessage
{
    return (new MailMessage)
        ->subject('Order Shipped')
        ->line('Your order has been shipped!')
        ->action('Track Order', url('/orders/123'));
}
```

### 4. Invia Notification
```php
$user->notify(new OrderShipped($order));
```

---

**Maintained by**: Davide Donghi
**Last Updated**: Febbraio 2026
**Version**: 1.0