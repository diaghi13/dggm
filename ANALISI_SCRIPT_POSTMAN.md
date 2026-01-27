# 🔍 ANALISI SCRIPT POSTMAN - ESTRAZIONE TOKEN

## ❌ PROBLEMI TROVATI

### 1. **URL Encoding Non Gestito**
Il cookie viene impostato con `%7C` invece di `|`:
```
auth_token=38%7ChqgHO3qYChA3RuxfLKorpqKB8EYGo4VrXmlKODHb2f64bb71
```

Lo script attuale estrae: `38%7ChqgHO3qYChA...` (**SBAGLIATO**)  
Serve: `38|hqgHO3qYChA...` (**CORRETTO**)

**Fix:** Usare `decodeURIComponent(token)`

### 2. **Possibili Spazi Extra**
Il valore estratto potrebbe avere spazi: `"38|abc... "`

**Fix:** Usare `.trim()`

### 3. **pm.collectionVariables vs pm.environment**
- `pm.collectionVariables` = Solo per la collezione corrente
- `pm.environment` = Persistente tra le collezioni

**Raccomandazione:** Usa `pm.environment` per maggiore flessibilità

---

## ✅ SCRIPT CORRETTO

```javascript
// Estrai il token dal cookie Set-Cookie
const setCookieHeader = pm.response.headers.get('Set-Cookie');

if (setCookieHeader) {
    // Cerca il valore di auth_token nel cookie
    const tokenMatch = setCookieHeader.match(/auth_token=([^;]+)/);
    
    if (tokenMatch && tokenMatch[1]) {
        // Estrai, pulisci e decodifica il token
        let token = tokenMatch[1].trim();
        token = decodeURIComponent(token);
        
        // Salva il token come variabile di environment
        pm.environment.set('auth_token', token);
        
        console.log('✓ Token estratto e salvato:', token.substring(0, 20) + '...');
        console.log('  Token completo:', token);
    } else {
        console.error('✗ Token non trovato nel cookie');
        console.log('  Header ricevuto:', setCookieHeader);
    }
} else {
    console.error('✗ Header Set-Cookie non trovato');
    console.log('  Headers disponibili:', Object.keys(pm.response.headers.toObject()));
}

// Test della risposta
pm.test('Login successful', function () {
    pm.response.to.have.status(200);
    const jsonData = pm.response.json();
    pm.expect(jsonData.success).to.be.true;
    pm.expect(jsonData.data).to.have.property('user');
});

pm.test('User data presente', function () {
    const jsonData = pm.response.json();
    pm.expect(jsonData.data.user).to.have.property('email');
    pm.expect(jsonData.data.user).to.have.property('name');
});

pm.test('Token salvato correttamente', function () {
    const token = pm.environment.get('auth_token');
    pm.expect(token).to.be.a('string');
    pm.expect(token).to.have.length.above(10);
    // Verifica formato: numero|hash
    pm.expect(token).to.match(/^\d+\|[a-zA-Z0-9]+$/);
});
```

---

## 🔄 MODIFICHE APPORTATE

### 1. Aggiunto `decodeURIComponent()`
```javascript
// PRIMA (SBAGLIATO)
const token = tokenMatch[1];
// Token: "38%7ChqgHO3qYChA..."

// DOPO (CORRETTO)
let token = tokenMatch[1].trim();
token = decodeURIComponent(token);
// Token: "38|hqgHO3qYChA..."
```

### 2. Aggiunto `.trim()`
Rimuove spazi extra all'inizio/fine

### 3. Cambiato a `pm.environment`
```javascript
// PRIMA
pm.collectionVariables.set('auth_token', token);

// DOPO (più flessibile)
pm.environment.set('auth_token', token);
```

### 4. Migliorato logging
```javascript
// Mostra il token completo per debug
console.log('  Token completo:', token);

// Se fallisce, mostra cosa ha ricevuto
console.log('  Header ricevuto:', setCookieHeader);
console.log('  Headers disponibili:', Object.keys(pm.response.headers.toObject()));
```

### 5. Aggiunto test per il token
```javascript
pm.test('Token salvato correttamente', function () {
    const token = pm.environment.get('auth_token');
    pm.expect(token).to.match(/^\d+\|[a-zA-Z0-9]+$/);
});
```

---

## 📋 ESEMPI DI FUNZIONAMENTO

### Input Header 1: Con URL encoding
```
Set-Cookie: auth_token=38%7ChqgHO3qYChA3RuxfLKorpqKB8EYGo4VrXmlKODHb2f64bb71; path=/; httponly
```
**Estratto:** `38|hqgHO3qYChA3RuxfLKorpqKB8EYGo4VrXmlKODHb2f64bb71` ✅

### Input Header 2: Senza URL encoding
```
Set-Cookie: auth_token=40|AbcDef123456789; path=/; httponly
```
**Estratto:** `40|AbcDef123456789` ✅

### Input Header 3: Con spazi
```
Set-Cookie: auth_token=42|XyzToken123  ; path=/
```
**Estratto:** `42|XyzToken123` ✅ (trim rimuove gli spazi)

---

## ⚙️ CONFIGURAZIONE ENVIRONMENT

Per usare lo script:

1. **Crea Environment in Postman:**
   - Nome: `DGGM Development`
   - Variabili:
     ```
     base_url: http://localhost:8002/api/v1
     auth_token: (lascia vuoto)
     ```

2. **Seleziona l'environment** dal dropdown in alto a destra

3. **Usa nelle richieste:**
   - URL: `{{base_url}}/auth/me`
   - Header: `Authorization: Bearer {{auth_token}}`

---

## 🧪 TEST

### Test Console Output Atteso:
```
✓ Token estratto e salvato: 38|hqgHO3qYChA3RuxfL...
  Token completo: 38|hqgHO3qYChA3RuxfLKorpqKB8EYGo4VrXmlKODHb2f64bb71

✓ Login successful
✓ User data presente
✓ Token salvato correttamente
```

### Se Fallisce:
```
✗ Token non trovato nel cookie
  Header ricevuto: laravel_session=...; XSRF-TOKEN=...
```

---

## ✅ CHECKLIST FINALE

- [x] Regex pattern corretto: `/auth_token=([^;]+)/`
- [x] URL decoding: `decodeURIComponent()`
- [x] Trim spazi: `.trim()`
- [x] Usa `pm.environment` invece di `pm.collectionVariables`
- [x] Logging migliorato per debug
- [x] Test aggiuntivo per validare il formato del token
- [x] Gestione errori completa

---

## 🎯 RISULTATO

**Lo script originale funzionava QUASI correttamente**, ma aveva 2 problemi:

1. ❌ Non decodificava `%7C` in `|`
2. ❌ Usava `collectionVariables` invece di `environment`

**Con le modifiche:** ✅ Funziona perfettamente!
