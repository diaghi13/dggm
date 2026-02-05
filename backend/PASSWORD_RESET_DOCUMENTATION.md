# Password Reset & Change Password API

Implementazione completa del sistema di reset password e cambio password per utenti autenticati.

## 📋 Endpoints Disponibili

### 1. **Forgot Password** (Richiedi reset via email)
**Endpoint**: `POST /api/v1/auth/forgot-password`
**Autenticazione**: ❌ Non richiesta
**Rate Limit**: 5 richieste ogni 10 minuti per email

**Request Body**:
```json
{
  "email": "user@example.com"
}
```

**Success Response** (200):
```json
{
  "success": true,
  "message": "Password reset link sent to your email"
}
```

**Error Response** (422):
```json
{
  "success": false,
  "message": "The email field is required.",
  "errors": {
    "email": ["The email field is required."]
  }
}
```

**Note**:
- Invia email all'utente con link e token per il reset
- Token valido per 60 minuti (configurabile in `config/auth.php`)
- Se l'email non esiste, restituisce comunque 200 per sicurezza (non rivela se l'utente esiste)

---

### 2. **Reset Password** (Reset con token da email)
**Endpoint**: `POST /api/v1/auth/reset-password`
**Autenticazione**: ❌ Non richiesta

**Request Body**:
```json
{
  "email": "user@example.com",
  "token": "token-from-email",
  "password": "NewPassword123!",
  "password_confirmation": "NewPassword123!"
}
```

**Success Response** (200):
```json
{
  "success": true,
  "message": "Password reset successfully"
}
```

**Error Response** (400):
```json
{
  "success": false,
  "message": "Invalid or expired reset token"
}
```

**Validation Rules**:
- `email`: required, email format
- `token`: required
- `password`: required, min 8 caratteri, deve essere confermato
- `password_confirmation`: required, deve coincidere con `password`

**Note**:
- Il token deve corrispondere a quello inviato via email
- Dopo il reset, TUTTI i token Sanctum dell'utente vengono revocati per sicurezza
- L'utente dovrà rifare login dopo il reset

---

### 3. **Change Password** (Cambio password autenticato)
**Endpoint**: `POST /api/v1/auth/change-password`
**Autenticazione**: ✅ Richiesta (Bearer token o cookie)

**Request Headers**:
```
Authorization: Bearer {token}
```

**Request Body**:
```json
{
  "current_password": "OldPassword123!",
  "password": "NewPassword123!",
  "password_confirmation": "NewPassword123!"
}
```

**Success Response** (200):
```json
{
  "success": true,
  "message": "Password changed successfully"
}
```

**Error Response** (422):
```json
{
  "success": false,
  "message": "The provided password does not match your current password.",
  "errors": {
    "current_password": ["The provided password does not match your current password."]
  }
}
```

**Validation Rules**:
- `current_password`: required
- `password`: required, min 8 caratteri, deve essere confermato
- `password_confirmation`: required, deve coincidere con `password`

**Note**:
- Richiede la password attuale per conferma
- NON revoca i token esistenti (a differenza del reset)
- L'utente rimane loggato dopo il cambio

---

## 🔧 Configurazione

### Email Configuration

Per inviare le email di reset password, configura `.env`:

```env
# SMTP Configuration (es. Gmail, Mailgun, SES)
MAIL_MAILER=smtp
MAIL_HOST=smtp.mailtrap.io
MAIL_PORT=2525
MAIL_USERNAME=your_username
MAIL_PASSWORD=your_password
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS=noreply@example.com
MAIL_FROM_NAME="${APP_NAME}"
```

**Test in sviluppo**:
- Usa [Mailtrap](https://mailtrap.io) per testare le email senza inviarle
- Oppure usa `MAIL_MAILER=log` per vedere le email nei log

### Token Expiration

Configura la durata del token in `config/auth.php`:

```php
'passwords' => [
    'users' => [
        'provider' => 'users',
        'table' => 'password_reset_tokens',
        'expire' => 60, // minuti (default: 60)
        'throttle' => 60, // secondi tra richieste (default: 60)
    ],
],
```

---

## 📧 Personalizzazione Email

### Metodo 1: Publishing della notification
```bash
php artisan vendor:publish --tag=laravel-notifications
```

### Metodo 2: Custom notification nel modello User

In `app/Models/User.php`, aggiungi:

```php
use Illuminate\Auth\Notifications\ResetPassword;

public function sendPasswordResetNotification($token)
{
    $this->notify(new ResetPassword($token));
}
```

Crea custom notification:
```bash
php artisan make:notification CustomResetPassword
```

---

## 🧪 Testing

Esegui i test:
```bash
php artisan test --filter=PasswordResetTest
```

Test coperti:
- ✅ Richiesta reset password con email valida
- ✅ Validazione email non esistente
- ✅ Reset password con token valido
- ✅ Gestione token invalidi/scaduti
- ✅ Cambio password per utente autenticato
- ✅ Validazione password attuale errata
- ✅ Richiesta autenticazione per cambio password

---

## 🔐 Sicurezza

### Rate Limiting

Aggiungi rate limiting in `routes/api.php` (opzionale):

```php
Route::middleware(['throttle:5,10'])->group(function () {
    Route::post('/forgot-password', [AuthController::class, 'forgotPassword']);
});
```

Limita a 5 richieste ogni 10 minuti.

### Best Practices Implementate

✅ **Password hashing**: Bcrypt automatico
✅ **Token revocation**: Tutti i token revocati dopo reset
✅ **Token expiration**: Token validi solo 60 minuti
✅ **Throttling**: Protezione contro brute force
✅ **Logging**: Ogni azione loggata per audit
✅ **Events**: Eventi per estendere funzionalità
✅ **Validation**: Input sanitizzato e validato

---

## 📊 Eventi Disponibili

Puoi ascoltare questi eventi per estendere la funzionalità:

### PasswordResetRequested
```php
use App\Events\PasswordResetRequested;

Event::listen(PasswordResetRequested::class, function ($event) {
    Log::info('Password reset requested', [
        'email' => $event->email,
        'ip_address' => $event->metadata['ip_address'],
    ]);
});
```

### PasswordReset
```php
use App\Events\PasswordReset;

Event::listen(PasswordReset::class, function ($event) {
    // Invia notifica all'utente
    // Log per audit
    // Alert se reset sospetto
});
```

### PasswordChanged
```php
use App\Events\PasswordChanged;

Event::listen(PasswordChanged::class, function ($event) {
    // Conferma via email
    // Log cambio password
});
```

---

## 🚀 Frontend Integration

### Esempio React/Next.js

```typescript
// forgot-password.tsx
const handleForgotPassword = async (email: string) => {
  const response = await fetch('/api/v1/auth/forgot-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });

  const data = await response.json();

  if (data.success) {
    alert('Check your email for reset link');
  }
};

// reset-password.tsx
const handleResetPassword = async (token: string, email: string, password: string) => {
  const response = await fetch('/api/v1/auth/reset-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      token,
      email,
      password,
      password_confirmation: password,
    }),
  });

  const data = await response.json();

  if (data.success) {
    router.push('/login');
  }
};

// change-password.tsx
const handleChangePassword = async (currentPassword: string, newPassword: string) => {
  const response = await fetch('/api/v1/auth/change-password', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
      current_password: currentPassword,
      password: newPassword,
      password_confirmation: newPassword,
    }),
  });

  const data = await response.json();

  if (data.success) {
    alert('Password changed successfully');
  }
};
```

---

## 🐛 Troubleshooting

### Email non inviate?
1. Verifica configurazione SMTP in `.env`
2. Controlla log: `storage/logs/laravel.log`
3. Testa con `MAIL_MAILER=log` per vedere output nei log

### Token non valido?
1. Token scaduto (60 minuti di default)
2. Richiedi nuovo token
3. Verifica che la tabella `password_reset_tokens` esista

### Database migration error?
```bash
php artisan migrate:fresh
```

La migration `create_users_table` include già `password_reset_tokens`.

---

## 📝 TypeScript Types

Generati automaticamente con `php artisan typescript:transform`:

```typescript
// App.Data.ForgotPasswordData
export type ForgotPasswordData = {
  email: string;
}

// App.Data.ResetPasswordData
export type ResetPasswordData = {
  email: string;
  password: string;
  password_confirmation?: string;
  token: string;
}

// App.Data.ChangePasswordData
export type ChangePasswordData = {
  current_password: string;
  password: string;
  password_confirmation?: string;
}
```

---

**Implementato da**: Davide Donghi
**Data**: Febbraio 2026
**Versione Laravel**: 12
**Pattern**: Query/Action/Service Architecture