# Testare API con Postman - Guida Completa

## 🎯 Come Funziona l'Autenticazione

L'API DGGM usa **cookie httpOnly** per il token di autenticazione invece di Bearer token nel body della risposta. Questo significa che il token viene:

1. Creato dal backend durante il login
2. Salvato in un **cookie httpOnly** chiamato `auth_token`
3. Inviato automaticamente dal browser con ogni richiesta
4. Letto dal middleware `AddBearerTokenFromCookie` che lo trasforma in header `Authorization: Bearer xxx`

## 📝 Metodi per Testare con Postman

### Metodo 1: Usare i Cookie di Postman (RACCOMANDATO)

Postman può gestire automaticamente i cookie come un browser.

#### Step 1: Configurazione Postman

1. Apri Postman
2. Vai su **Settings** (icona ingranaggio in alto a destra)
3. Nella sezione **General**, assicurati che:
   - ✅ **"Automatically follow redirects"** sia ON
   - ✅ **"Send cookies with requests"** sia ON

#### Step 2: Login

**Richiesta LOGIN**:

```
POST https://dggm-erp.ddns.net/api/v1/auth/login
```

**Headers**:
```
Content-Type: application/json
Accept: application/json
```

**Body** (raw JSON):
```json
{
  "email": "admin@dggm.com",
  "password": "password"
}
```

**Risposta** (esempio):
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": 1,
      "name": "Admin User",
      "email": "admin@dggm.com",
      "role": "admin"
    }
  }
}
```

**IMPORTANTE**: 
- Il token NON è nella risposta JSON
- Il token è nel **cookie** `auth_token` nell'header `Set-Cookie`
- Postman lo salverà automaticamente

#### Step 3: Verifica il Cookie

Dopo il login:

1. Clicca sulla tab **Cookies** (sotto il campo URL)
2. Seleziona `dggm-erp.ddns.net`
3. Dovresti vedere il cookie `auth_token` con un valore lungo

```
Name:      auth_token
Value:     1|xxx...lungo token...xxx
Domain:    .dggm-erp.ddns.net
Path:      /
Secure:    true
HttpOnly:  true
```

#### Step 4: Fare Richieste Autenticate

Ora Postman invierà automaticamente il cookie con ogni richiesta!

**Esempio: GET User Info**:

```
GET https://dggm-erp.ddns.net/api/v1/auth/me
```

**Headers**:
```
Accept: application/json
```

**NON servono altri header!** Il cookie viene inviato automaticamente.

**Risposta**:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "Admin User",
    "email": "admin@dggm.com",
    "role": "admin"
  }
}
```

---

### Metodo 2: Estrarre e Usare il Token Manualmente

Se preferisci vedere e usare il token direttamente:

#### Step 1: Login e Estrai il Token

**Richiesta LOGIN** (come sopra)

**Dopo la risposta**:

1. Vai alla tab **Headers** della risposta
2. Cerca l'header `Set-Cookie`
3. Copia il valore del token da `auth_token=XXX;`

Esempio:
```
Set-Cookie: auth_token=1|AbCdEfGhIjKlMnOpQrStUvWxYz1234567890; Domain=.dggm-erp.ddns.net; Path=/; Secure; HttpOnly; SameSite=Lax
```

Il token è: `1|AbCdEfGhIjKlMnOpQrStUvWxYz1234567890`

#### Step 2: Usare il Token nelle Richieste

**Richiesta Autenticata**:

```
GET https://dggm-erp.ddns.net/api/v1/auth/me
```

**Headers**:
```
Accept: application/json
Authorization: Bearer 1|AbCdEfGhIjKlMnOpQrStUvWxYz1234567890
```

**Nota**: Questo metodo bypassa il cookie e usa direttamente l'header Authorization.

---

### Metodo 3: Usare Postman Variables (AVANZATO)

Automatizza l'estrazione del token usando gli script di Postman.

#### Step 1: Crea una Collection

1. Crea una nuova **Collection** in Postman
2. Chiamala "DGGM ERP API"

#### Step 2: Configura la Richiesta di Login

**Richiesta**: 
```
POST https://dggm-erp.ddns.net/api/v1/auth/login
```

**Body**:
```json
{
  "email": "admin@dggm.com",
  "password": "password"
}
```

**Tab "Tests"** (script post-risposta):
```javascript
// Estrai il token dal cookie
const setCookieHeader = pm.response.headers.get('Set-Cookie');
if (setCookieHeader) {
    // Cerca il valore di auth_token
    const tokenMatch = setCookieHeader.match(/auth_token=([^;]+)/);
    if (tokenMatch) {
        const token = tokenMatch[1];
        // Salva il token come variabile di collection
        pm.collectionVariables.set("auth_token", token);
        console.log("Token salvato:", token);
    }
}

// Verifica che il login sia riuscito
pm.test("Login successful", function () {
    pm.response.to.have.status(200);
    const jsonData = pm.response.json();
    pm.expect(jsonData.success).to.be.true;
});
```

#### Step 3: Usa il Token nelle Altre Richieste

Per tutte le altre richieste nella collection:

**Headers**:
```
Accept: application/json
Authorization: Bearer {{auth_token}}
```

Postman sostituirà automaticamente `{{auth_token}}` con il token salvato!

---

## 📦 Collection Postman Pronta

### Import in Postman

Crea un file `DGGM_ERP_API.postman_collection.json` con questo contenuto:

```json
{
  "info": {
    "name": "DGGM ERP API",
    "description": "API Collection per DGGM ERP System",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "variable": [
    {
      "key": "base_url",
      "value": "https://dggm-erp.ddns.net/api/v1",
      "type": "string"
    },
    {
      "key": "auth_token",
      "value": "",
      "type": "string"
    }
  ],
  "item": [
    {
      "name": "Auth",
      "item": [
        {
          "name": "Login",
          "event": [
            {
              "listen": "test",
              "script": {
                "exec": [
                  "// Estrai token dal cookie",
                  "const setCookieHeader = pm.response.headers.get('Set-Cookie');",
                  "if (setCookieHeader) {",
                  "    const tokenMatch = setCookieHeader.match(/auth_token=([^;]+)/);",
                  "    if (tokenMatch) {",
                  "        pm.collectionVariables.set('auth_token', tokenMatch[1]);",
                  "        console.log('Token salvato');",
                  "    }",
                  "}",
                  "",
                  "pm.test('Login successful', function () {",
                  "    pm.response.to.have.status(200);",
                  "    pm.expect(pm.response.json().success).to.be.true;",
                  "});"
                ]
              }
            }
          ],
          "request": {
            "method": "POST",
            "header": [
              {
                "key": "Content-Type",
                "value": "application/json"
              },
              {
                "key": "Accept",
                "value": "application/json"
              }
            ],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"email\": \"admin@dggm.com\",\n  \"password\": \"password\"\n}"
            },
            "url": {
              "raw": "{{base_url}}/auth/login",
              "host": ["{{base_url}}"],
              "path": ["auth", "login"]
            }
          }
        },
        {
          "name": "Get Current User",
          "request": {
            "method": "GET",
            "header": [
              {
                "key": "Accept",
                "value": "application/json"
              },
              {
                "key": "Authorization",
                "value": "Bearer {{auth_token}}"
              }
            ],
            "url": {
              "raw": "{{base_url}}/auth/me",
              "host": ["{{base_url}}"],
              "path": ["auth", "me"]
            }
          }
        },
        {
          "name": "Logout",
          "request": {
            "method": "POST",
            "header": [
              {
                "key": "Accept",
                "value": "application/json"
              },
              {
                "key": "Authorization",
                "value": "Bearer {{auth_token}}"
              }
            ],
            "url": {
              "raw": "{{base_url}}/auth/logout",
              "host": ["{{base_url}}"],
              "path": ["auth", "logout"]
            }
          }
        }
      ]
    },
    {
      "name": "Users",
      "item": [
        {
          "name": "List Users",
          "request": {
            "method": "GET",
            "header": [
              {
                "key": "Accept",
                "value": "application/json"
              },
              {
                "key": "Authorization",
                "value": "Bearer {{auth_token}}"
              }
            ],
            "url": {
              "raw": "{{base_url}}/users",
              "host": ["{{base_url}}"],
              "path": ["users"]
            }
          }
        }
      ]
    },
    {
      "name": "Sites",
      "item": [
        {
          "name": "List Sites",
          "request": {
            "method": "GET",
            "header": [
              {
                "key": "Accept",
                "value": "application/json"
              },
              {
                "key": "Authorization",
                "value": "Bearer {{auth_token}}"
              }
            ],
            "url": {
              "raw": "{{base_url}}/sites",
              "host": ["{{base_url}}"],
              "path": ["sites"]
            }
          }
        }
      ]
    }
  ]
}
```

**Per importare**:
1. Postman > **Import**
2. Seleziona il file `DGGM_ERP_API.postman_collection.json`
3. La collection apparirà con tutte le richieste pronte

---

## 🧪 Test Passo-Passo

### 1. Test Login (Metodo Cookie)

**Richiesta**:
```
POST https://dggm-erp.ddns.net/api/v1/auth/login
Content-Type: application/json

{
  "email": "admin@dggm.com",
  "password": "password"
}
```

**Verifica**:
- Status: `200 OK`
- Response body contiene `"success": true`
- Tab **Cookies** mostra `auth_token`

### 2. Test Get User Info

**Richiesta**:
```
GET https://dggm-erp.ddns.net/api/v1/auth/me
Accept: application/json
```

**Note**: NON serve Authorization header! Il cookie viene inviato automaticamente.

**Verifica**:
- Status: `200 OK`
- Response body contiene i dati dell'utente

### 3. Test API Protetta

**Richiesta**:
```
GET https://dggm-erp.ddns.net/api/v1/users
Accept: application/json
```

**Verifica**:
- Status: `200 OK`
- Response body contiene lista utenti

### 4. Test Logout

**Richiesta**:
```
POST https://dggm-erp.ddns.net/api/v1/auth/logout
Accept: application/json
```

**Verifica**:
- Status: `200 OK`
- Cookie `auth_token` viene rimosso
- Richieste successive danno `401 Unauthorized`

---

## 🔍 Troubleshooting

### Errore 401 Unauthorized

**Causa**: Token non valido o non inviato

**Soluzioni**:
1. Verifica che il cookie `auth_token` sia presente (tab Cookies)
2. Verifica che "Send cookies with requests" sia ON in Settings
3. Fai di nuovo il login
4. Se usi Authorization header, verifica che il token sia corretto

### Errore CORS

**Causa**: Frontend non autorizzato

**Soluzione**:
- Usa Postman Desktop (non web)
- Oppure disabilita temporaneamente CORS in Postman Settings

### Cookie non viene salvato

**Causa**: Postman non salva cookie con Secure su HTTP

**Soluzione**:
- Usa HTTPS (non HTTP)
- Verifica che il dominio sia corretto

### Token scaduto

**Causa**: Token è scaduto (default 30 giorni)

**Soluzione**:
- Fai di nuovo il login
- Il vecchio token viene revocato automaticamente

---

## 📋 Credenziali di Test

```
Admin:
email: admin@dggm.com
password: password

Project Manager:
email: pm@dggm.com
password: password

Worker:
email: worker@dggm.com
password: password
```

---

## 🚀 Quick Start

1. **Importa la collection** (file JSON sopra)
2. **Esegui "Login"** request
3. **Verifica** che il token sia salvato (console: "Token salvato")
4. **Esegui** altre richieste - il token viene usato automaticamente!

---

## 💡 Tips

### Visualizza il Token
```javascript
// Nel tab Tests della richiesta Login
console.log("Token:", pm.collectionVariables.get("auth_token"));
```

### Verifica Cookie in Postman
```
Tab "Cookies" sotto il campo URL > Manage Cookies > dggm-erp.ddns.net
```

### Usa Environments per dev/prod
```
Dev Environment:
base_url = http://localhost:8000/api/v1

Prod Environment:
base_url = https://dggm-erp.ddns.net/api/v1
```

---

## 📚 Endpoint Disponibili

Vedi file `backend/routes/api.php` per la lista completa, ma ecco i principali:

**Auth**:
- `POST /auth/login` - Login
- `POST /auth/logout` - Logout  
- `GET /auth/me` - User info
- `GET /auth/sessions` - Sessioni attive

**Users**:
- `GET /users` - Lista utenti
- `POST /users` - Crea utente
- `GET /users/{id}` - Dettaglio utente
- `PUT /users/{id}` - Aggiorna utente
- `DELETE /users/{id}` - Elimina utente

**Sites**:
- `GET /sites` - Lista cantieri
- `POST /sites` - Crea cantiere
- E così via...

---

**Data**: 20 Gennaio 2026
**Versione API**: v1
