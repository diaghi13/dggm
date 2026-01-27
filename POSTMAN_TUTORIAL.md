# 📺 TUTORIAL STEP-BY-STEP: Testare API con Postman

## Scenario
Vuoi testare le API del backend DGGM ERP in locale con Postman, ma ricevi sempre `401 Unauthorized`.

---

## 🎬 PARTE 1: Preparazione

### 1. Avvia il server backend

```bash
cd /Users/davidedonghi/Apps/dggm/backend
php artisan serve --port=8002
```

Dovresti vedere:
```
INFO  Server running on [http://127.0.0.1:8002]
```

### 2. Apri Postman

---

## 🎬 PARTE 2: Login (Prima Richiesta)

### 1. Crea una nuova richiesta in Postman

- Clicca **New** → **HTTP Request**
- Metodo: **POST**
- URL: `http://localhost:8002/api/v1/auth/login`

### 2. Configura gli Headers

Clicca sulla tab **Headers** e aggiungi:

| Key | Value |
|-----|-------|
| Content-Type | application/json |
| Accept | application/json |

### 3. Configura il Body

- Clicca sulla tab **Body**
- Seleziona **raw**
- Seleziona **JSON** dal dropdown
- Inserisci:

```json
{
  "email": "admin@dggm.com",
  "password": "password"
}
```

### 4. Invia la richiesta

Clicca **Send**

### 5. Verifica la risposta

Dovresti vedere:

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": 1,
      "name": "Super Admin",
      "email": "admin@dggm.com",
      ...
    }
  }
}
```

Status: **200 OK** ✅

---

## 🎬 PARTE 3: Estrarre il Token

### 1. Vai alla tab Cookies

Nella risposta di Postman, clicca sulla tab **Cookies** (accanto a Body, Headers, ecc.)

### 2. Trova il cookie auth_token

Dovresti vedere qualcosa come:

```
Name: auth_token
Value: 38|hqgHO3qYChA3RuxfLKorpqKB8EYGo4VrXmlKODHb2f64bb71
Domain: localhost
Path: /
```

### 3. Copia il valore COMPLETO

**IMPORTANTE:** Copia tutto, incluso il numero prima di `|`

Esempio: `38|hqgHO3qYChA3RuxfLKorpqKB8EYGo4VrXmlKODHb2f64bb71`

---

## 🎬 PARTE 4: Testare /auth/me (Richiesta Protetta)

### 1. Crea una nuova richiesta

- Clicca **New** → **HTTP Request**
- Metodo: **GET**
- URL: `http://localhost:8002/api/v1/auth/me`

### 2. Configura gli Headers

Clicca sulla tab **Headers** e aggiungi:

| Key | Value |
|-----|-------|
| Accept | application/json |
| Authorization | Bearer 38\|hqgHO3qYChA3RuxfLKorpqKB8EYGo4VrXmlKODHb2f64bb71 |

⚠️ **ATTENZIONE:** Devi scrivere `Bearer ` (con lo spazio) seguito dal token

### 3. Invia la richiesta

Clicca **Send**

### 4. Verifica la risposta

Dovresti vedere:

```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "Super Admin",
    "email": "admin@dggm.com",
    ...
  }
}
```

Status: **200 OK** ✅

---

## 🎬 PARTE 5: Testare senza token (deve fallire)

### 1. Crea una nuova richiesta

- Metodo: **GET**
- URL: `http://localhost:8002/api/v1/auth/me`

### 2. Configura gli Headers (SENZA Authorization)

Solo:

| Key | Value |
|-----|-------|
| Accept | application/json |

### 3. Invia la richiesta

Clicca **Send**

### 4. Verifica la risposta

Dovresti vedere:

```json
{
  "message": "Unauthenticated."
}
```

Status: **401 Unauthorized** ✅

Questo è **corretto**! Senza il token, la richiesta viene respinta.

---

## 🎬 PARTE 6: Automatizzare con Variabili (BONUS)

### 1. Crea un Environment

- Clicca **Environments** (a sinistra)
- Clicca **+** per creare nuovo
- Nome: `DGGM Development`
- Aggiungi variabili:

| Variable | Initial Value | Current Value |
|----------|---------------|---------------|
| base_url | http://localhost:8002/api/v1 | http://localhost:8002/api/v1 |
| auth_token | | |

- Clicca **Save**
- Seleziona l'environment dal dropdown in alto a destra

### 2. Modifica la richiesta di Login

- URL: `{{base_url}}/auth/login`
- Vai alla tab **Tests**
- Aggiungi questo script:

```javascript
// Estrai il token dal cookie
const setCookie = pm.response.headers.get('Set-Cookie');
if (setCookie) {
    const match = setCookie.match(/auth_token=([^;]+)/);
    if (match) {
        const token = decodeURIComponent(match[1]);
        pm.environment.set('auth_token', token);
        console.log('✓ Token salvato:', token.substring(0, 20) + '...');
    }
}
```

### 3. Modifica la richiesta /auth/me

- URL: `{{base_url}}/auth/me`
- Header Authorization: `Bearer {{auth_token}}`

### 4. Test Automatico

1. Fai login → Il token viene salvato automaticamente
2. Fai /auth/me → Il token viene usato automaticamente

---

## ✅ CHECKLIST Finale

Prima di testare, verifica:

- [ ] Server Laravel avviato sulla porta 8002
- [ ] Richiesta di login restituisce 200 OK
- [ ] Cookie `auth_token` presente nella risposta
- [ ] Token copiato COMPLETO (con numero prima di `|`)
- [ ] Header `Authorization: Bearer {token}` presente
- [ ] Spazio dopo `Bearer` nell'header

---

## ❌ Troubleshooting

### "Connection refused"
→ Il server non è avviato. Esegui `php artisan serve --port=8002`

### "401 Unauthorized" anche con il token
→ Verifica che l'header sia: `Authorization: Bearer {token}` (con lo spazio)

### "Token non trovato nei cookies"
→ Verifica che il login ritorni 200 OK

### "Invalid token format"
→ Copia il token COMPLETO, incluso il numero prima di `|`

---

## 🎉 Fatto!

Ora puoi testare tutte le API protette in Postman usando il token Bearer!

Per altre richieste:
- `/api/v1/customers`
- `/api/v1/sites`
- `/api/v1/products`
- ecc.

Usa sempre l'header: `Authorization: Bearer {token}`
