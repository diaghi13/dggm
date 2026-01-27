# Guida Autenticazione Postman - DGGM ERP

## Problema

L'applicazione usa **cookie httpOnly** per l'autenticazione. Postman non gestisce automaticamente questi cookie come un browser, quindi ricevi `401 Unauthorized`.

## Soluzione: 2 Metodi

### Metodo 1: Bearer Token (RACCOMANDATO per Postman)

Questo è il metodo più semplice per testare con Postman.

#### Step 1: Login
**Request:**
```
POST http://localhost:8002/api/v1/auth/login
```

**Headers:**
```
Content-Type: application/json
Accept: application/json
```

**Body (raw JSON):**
```json
{
  "email": "admin@dggm.com",
  "password": "password"
}
```

**Risposta:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": { ... }
  }
}
```

#### Step 2: Estrai il Token dal Cookie

Nella risposta di Postman:
1. Vai alla tab **Cookies**
2. Trova il cookie `auth_token`
3. Copia il suo valore (es. `38|abcd1234...`)

#### Step 3: Usa il Token nelle Richieste Successive

Per tutte le altre richieste (es. `/auth/me`, `/customers`, ecc.):

**Headers:**
```
Authorization: Bearer 38|abcd1234...
Accept: application/json
```

**Esempio:**
```
GET http://localhost:8002/api/v1/auth/me
```

---

### Metodo 2: Cookie Automatico (per chi preferisce usare i cookie)

#### Step 1: Abilita Cookie Jar in Postman

1. Vai su **Settings** (icona ingranaggio in alto a destra)
2. **General** → **Cookies**
3. Abilita **Enable cookie jar**

#### Step 2: Login

Fai la stessa richiesta di login del Metodo 1.

#### Step 3: Usa i Cookie Automaticamente

Postman salverà automaticamente il cookie `auth_token` e lo invierà nelle richieste successive allo stesso dominio.

**NOTA:** Questo metodo funziona solo se il middleware `AddBearerTokenFromCookie` è attivo (già configurato nel tuo backend).

---

## Variabili d'Ambiente Postman (Raccomandato)

Per gestire meglio i token, crea delle variabili d'ambiente:

### 1. Crea Environment "Development"

```json
{
  "name": "Development",
  "values": [
    {
      "key": "base_url",
      "value": "http://localhost:8002",
      "enabled": true
    },
    {
      "key": "auth_token",
      "value": "",
      "enabled": true
    }
  ]
}
```

### 2. Script Post-Login Automatico

Nella richiesta di **Login**, aggiungi questo script nella tab **Tests**:

```javascript
// Estrai il token dal cookie e salvalo nella variabile d'ambiente
const cookies = pm.cookies.all();
const authCookie = cookies.find(c => c.name === 'auth_token');

if (authCookie) {
    pm.environment.set('auth_token', authCookie.value);
    console.log('Token salvato:', authCookie.value);
}
```

### 3. Usa la Variabile nelle Richieste

Nelle altre richieste, usa:

**URL:**
```
{{base_url}}/api/v1/auth/me
```

**Headers:**
```
Authorization: Bearer {{auth_token}}
Accept: application/json
```

---

## Test Rapido con cURL

Per verificare che tutto funzioni:

```bash
# 1. Login e salva token
TOKEN=$(curl -s -c - -X POST http://localhost:8002/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{"email": "admin@dggm.com", "password": "password"}' \
  | grep auth_token | awk '{print $7}' | sed 's/%7C/|/g')

echo "Token: $TOKEN"

# 2. Test /auth/me
curl -X GET http://localhost:8002/api/v1/auth/me \
  -H "Accept: application/json" \
  -H "Authorization: Bearer $TOKEN"
```

---

## Troubleshooting

### 401 Unauthorized dopo il login

**Causa:** Il token non viene inviato correttamente.

**Soluzione:**
1. Verifica che l'header `Authorization` sia presente: `Bearer {token}`
2. Verifica che il token non sia vuoto o corrotto
3. Verifica che il token sia copiato correttamente (incluso il numero prima di `|`)

### Token non trovato nei cookies

**Causa:** Il backend non sta impostando il cookie.

**Soluzione:**
1. Verifica che la risposta di login abbia status `200`
2. Controlla la tab **Cookies** in Postman
3. Se non c'è il cookie, verifica la configurazione del backend

### Cookie non inviato automaticamente

**Causa:** Cookie Jar disabilitato in Postman.

**Soluzione:**
1. Abilita **Cookie Jar** nelle impostazioni di Postman
2. Oppure usa il Metodo 1 (Bearer Token)

---

## Collezione Postman Pronta

Importa la collezione `DGGM_ERP_API.postman_collection.json` e l'environment `DGGM_ERP_Development.postman_environment.json` già presenti nella root del progetto.

La collezione include già:
- Script automatici per estrarre il token
- Variabili d'ambiente configurate
- Esempi di tutte le API principali
