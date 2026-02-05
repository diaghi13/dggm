# Backend Setup - Gestione Sessioni

## Controller Laravel da Implementare

```php
<?php

namespace App\Http\Controllers\Api\V1;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use App\Http\Controllers\Controller;

class AuthController extends Controller
{
    /**
     * Ottieni l'utente corrente con tutte le sue sessioni
     */
    public function sessions(Request $request)
    {
        $user = $request->user();

        // Ottieni il token corrente
        $currentToken = $request->user()->currentAccessToken();

        // Ottieni tutte le sessioni (tokens) dell'utente
        $sessions = $user->tokens->map(function ($token) use ($currentToken) {
            return [
                'id' => $token->id,
                'name' => $token->name,
                'token' => substr($token->token, 0, 8) . '...', // Non esporre tutto il token
                'last_used_at' => $token->last_used_at,
                'expires_at' => $token->expires_at,
                'created_at' => $token->created_at,
                'is_current' => $currentToken && $token->id === $currentToken->id,
            ];
        });

        return response()->json([
            'success' => true,
            'data' => [
                'sessions' => $sessions,
            ],
        ]);
    }

    /**
     * Revoca una specifica sessione
     */
    public function revokeSession(Request $request, $tokenId)
    {
        $user = $request->user();
        $currentToken = $request->user()->currentAccessToken();

        // Non permettere di eliminare la sessione corrente
        if ($currentToken && $currentToken->id == $tokenId) {
            return response()->json([
                'success' => false,
                'message' => 'Non puoi disconnettere la sessione corrente',
            ], 400);
        }

        // Trova e elimina il token
        $deleted = $user->tokens()->where('id', $tokenId)->delete();

        if (!$deleted) {
            return response()->json([
                'success' => false,
                'message' => 'Sessione non trovata',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'message' => 'Sessione revocata con successo',
        ]);
    }

    /**
     * Revoca tutte le altre sessioni tranne quella corrente
     */
    public function revokeOtherSessions(Request $request)
    {
        $user = $request->user();
        $currentToken = $request->user()->currentAccessToken();

        // Elimina tutti i token tranne quello corrente
        $count = $user->tokens()
            ->where('id', '!=', $currentToken->id)
            ->delete();

        return response()->json([
            'success' => true,
            'message' => "Revocate {$count} sessioni",
            'data' => [
                'revoked_count' => $count,
            ],
        ]);
    }

    /**
     * Aggiorna profilo utente
     */
    public function updateProfile(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email,' . $request->user()->id,
        ]);

        $user = $request->user();
        $user->update($validated);

        return response()->json([
            'success' => true,
            'data' => [
                'user' => $user->load('roles'),
            ],
        ]);
    }

    /**
     * Aggiorna password
     */
    public function updatePassword(Request $request)
    {
        $validated = $request->validate([
            'current_password' => 'required',
            'password' => [
                'required',
                'min:8',
                'confirmed',
                'regex:/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/',
            ],
        ], [
            'password.regex' => 'La password deve contenere almeno una maiuscola, una minuscola e un numero',
        ]);

        $user = $request->user();

        // Verifica password corrente
        if (!Hash::check($validated['current_password'], $user->password)) {
            return response()->json([
                'success' => false,
                'message' => 'Password corrente non valida',
            ], 400);
        }

        // Aggiorna password
        $user->update([
            'password' => Hash::make($validated['password']),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Password aggiornata con successo',
        ]);
    }
}
```

## Routes (api.php)

```php
Route::middleware('auth:sanctum')->group(function () {
    // Profilo utente
    Route::put('/auth/profile', [AuthController::class, 'updateProfile']);
    Route::put('/auth/password', [AuthController::class, 'updatePassword']);

    // Gestione sessioni
    Route::get('/auth/sessions', [AuthController::class, 'sessions']);
    Route::delete('/auth/sessions/{tokenId}', [AuthController::class, 'revokeSession']);
    Route::post('/auth/sessions/revoke-others', [AuthController::class, 'revokeOtherSessions']);
});
```

## Come Funziona la Revoca

### 1. Revoca Singola Sessione

Quando chiami `DELETE /auth/sessions/{tokenId}`:

- Laravel elimina il record dalla tabella `personal_access_tokens`
- Il dispositivo con quel token **non può più fare richieste** (401 Unauthorized)
- L'utente dovrà fare login di nuovo su quel dispositivo

### 2. Revoca Tutte le Altre Sessioni

Quando chiami `POST /auth/sessions/revoke-others`:

- Laravel elimina **tutti** i token tranne quello corrente
- Tutti gli altri dispositivi vengono disconnessi immediatamente
- Solo il dispositivo corrente rimane connesso

### 3. Sanctum Middleware Verification

Sanctum automaticamente:

- Verifica che il token esista nella tabella
- Controlla che non sia scaduto (`expires_at`)
- Aggiorna `last_used_at` ad ogni richiesta

### 4. Identificazione Dispositivo Corrente

```php
$currentToken = $request->user()->currentAccessToken();
$isCurrentDevice = $token->id === $currentToken->id;
```

## Test

### 1. Testa Revoca Singola Sessione

```bash
# Ottieni tutte le sessioni
curl -X GET http://localhost:8000/api/v1/auth/sessions \
  -H "Authorization: Bearer YOUR_TOKEN"

# Revoca sessione specifica
curl -X DELETE http://localhost:8000/api/v1/auth/sessions/2 \
  -H "Authorization: Bearer YOUR_TOKEN"

# Verifica che quella sessione non funzioni più
curl -X GET http://localhost:8000/api/v1/auth/me \
  -H "Authorization: Bearer REVOKED_TOKEN"
# Dovrebbe ritornare 401 Unauthorized
```

### 2. Testa Revoca Altre Sessioni

```bash
curl -X POST http://localhost:8000/api/v1/auth/sessions/revoke-others \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Note Importanti

1. **Token Names**: Al login, imposta un nome descrittivo:

```php
$token = $user->createToken('Chrome on macOS')->plainTextToken;
```

2. **Sessione Corrente**: Frontend previene la revoca della sessione corrente (UI disabled)

3. **Expiration**: Opzionale - puoi impostare scadenza token:

```php
$token = $user->createToken('device', ['*'], now()->addDays(30));
```

4. **Abilities**: Puoi limitare permessi per token specifici se necessario

## Sicurezza

✅ Password corrente richiesta per cambio password
✅ Token revocati = accesso immediatamente negato
✅ Sessione corrente protetta da eliminazione accidentale
✅ Email univoca validata
✅ Password forte richiesta (regex validation)
