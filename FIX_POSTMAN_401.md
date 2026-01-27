# RISOLUZIONE 401 UNAUTHORIZED IN POSTMAN

## Problema
Quando fai una richiesta a `/auth/me` o altre API protette in Postman, ricevi `401 Unauthorized`.

## Causa
Il backend usa **cookie httpOnly** per l'autenticazione. Postman non invia automaticamente i cookie come un browser.

## Soluzione Rapida (COPY-PASTE)

### Step 1: Login

```
POST http://localhost:8002/api/v1/auth/login

Headers:
  Content-Type: application/json
  Accept: application/json

Body (raw JSON):
{
  "email": "admin@dggm.com",
  "password": "password"
}
```

### Step 2: Estrai il Token

Nella risposta:
1. Vai alla tab **Cookies**
2. Trova `auth_token`
3. Copia il valore (es. `38|abcd1234...`)

**IMPORTANTE:** Copia il valore COMPLETO, incluso il numero prima di `|`

### Step 3: Usa il Token

Per tutte le altre richieste, aggiungi questo header:

```
Authorization: Bearer 38|abcd1234...
```

Sostituisci `38|abcd1234...` con il token che hai copiato.

### Esempio: /auth/me

```
GET http://localhost:8002/api/v1/auth/me

Headers:
  Accept: application/json
  Authorization: Bearer 38|abcd1234...
```

---

## Metodo Automatico (Variabili d'Ambiente)

### 1. Crea Environment

In Postman:
1. Clicca **Environments** (a sinistra)
2. Crea nuovo environment "Development"
3. Aggiungi variabili:
   - `base_url` = `http://localhost:8002/api/v1`
   - `auth_token` = (lascia vuoto)

### 2. Script Post-Login

Nella richiesta di **Login**, tab **Tests**, aggiungi:

```javascript
// Estrai token dal cookie
const setCookie = pm.response.headers.get('Set-Cookie');
if (setCookie) {
    const match = setCookie.match(/auth_token=([^;]+)/);
    if (match) {
        pm.environment.set('auth_token', match[1]);
        console.log('✓ Token salvato');
    }
}
```

### 3. Usa Variabili

In tutte le richieste:

**URL:**
```
{{base_url}}/auth/me
```

**Headers:**
```
Authorization: Bearer {{auth_token}}
Accept: application/json
```

---

## Test Veloce

Esegui lo script di test per verificare tutto:

```bash
./test-auth.sh
```

Questo script ti darà il token da usare in Postman.

---

## Collezione Pronta

Importa in Postman:
- `DGGM_ERP_API.postman_collection.json`
- `DGGM_ERP_Development.postman_environment.json`

La collezione ha già gli script automatici configurati.

---

## Troubleshooting

### ❌ "Token non trovato nei cookies"

**Verifica:**
1. Che la richiesta di login ritorni `200`
2. Che ci sia `"success": true` nella risposta
3. Nella tab **Cookies** ci deve essere `auth_token`

### ❌ "401 Unauthorized" anche con il token

**Verifica:**
1. Che l'header sia: `Authorization: Bearer {token}`
2. Che il token sia completo (incluso il numero prima di `|`)
3. Che il token non sia scaduto (dura 30 giorni)

### ❌ "Invalid token format"

**Problema:** Il token deve essere nel formato `{id}|{hash}`

**Esempio corretto:** `38|hqgHO3qYChA3RuxfLKorpqK...`

**Verifica:**
- Che ci sia il numero prima di `|`
- Che non ci siano spazi
- Che il carattere `|` non sia codificato come `%7C`
