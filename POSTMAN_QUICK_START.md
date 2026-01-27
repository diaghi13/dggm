# 🚀 Guida Rapida Postman - DGGM ERP

## ⚡ Setup in 3 Passi

### 1️⃣ Importa la Collection

1. Apri **Postman**
2. Clicca su **Import** (in alto a sinistra)
3. Trascina o seleziona: `DGGM_ERP_API.postman_collection.json`
4. Clicca **Import**

✅ La collection "DGGM ERP API" apparirà nella sidebar

### 2️⃣ Importa l'Environment (opzionale)

1. Clicca su **Import**
2. Seleziona: `DGGM_ERP_Production.postman_environment.json`
3. Clicca **Import**
4. Seleziona l'environment "DGGM ERP - Production" dal dropdown in alto a destra

### 3️⃣ Fai il Login

1. Apri la collection **DGGM ERP API**
2. Cartella **🔐 Authentication**
3. Click su **Login (Admin)**
4. Clicca **Send**

✅ Il token viene estratto automaticamente e salvato!

---

## 🎯 Come Recuperare il Token

### Metodo 1: Automatico (RACCOMANDATO) ✨

**È GIÀ FATTO!** 

La request di Login ha uno script che:
1. Estrae il token dal cookie `Set-Cookie`
2. Lo salva in `{{auth_token}}`
3. Tutte le altre request lo usano automaticamente

**Verifica nella Console**:
- Dopo il login, guarda la tab **Console** in basso
- Dovresti vedere: `✓ Token estratto e salvato: 1|xxx...`

### Metodo 2: Manuale (vedere il token)

**Dopo il Login**:

1. Vai alla tab **Headers** della risposta
2. Cerca `Set-Cookie`
3. Copia il valore dopo `auth_token=` fino al `;`

Esempio:
```
Set-Cookie: auth_token=1|AbCdEf123456; Domain=.dggm-erp.ddns.net; ...
```

Token: `1|AbCdEf123456`

**Uso manuale**:
- Apri una qualsiasi request
- Tab **Headers**
- Aggiungi: `Authorization: Bearer 1|AbCdEf123456`

### Metodo 3: Da Postman Cookies

1. Clicca su **Cookies** (sotto il campo URL)
2. Seleziona `dggm-erp.ddns.net`
3. Cerca il cookie `auth_token`
4. Copia il valore

---

## 📋 Workflow Completo

```
┌─────────────────────────────────────────┐
│ 1. Esegui "Login (Admin)"               │
│    ↓                                     │
│    Token salvato automaticamente        │
│    in {{auth_token}}                    │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│ 2. Esegui qualsiasi altra request       │
│    (Users, Sites, Materials, etc.)      │
│    ↓                                     │
│    Il token viene usato automaticamente │
│    via: Authorization: Bearer {{...}}   │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│ 3. Quando finisci:                      │
│    Esegui "Logout"                      │
│    ↓                                     │
│    Token viene rimosso                  │
└─────────────────────────────────────────┘
```

---

## 🧪 Test delle Request

### Login
```
POST {{base_url}}/auth/login

Body:
{
  "email": "admin@dggm.com",
  "password": "password"
}

✅ Risposta: Status 200
✅ Console: "✓ Token estratto e salvato"
```

### Get Current User
```
GET {{base_url}}/auth/me

Headers:
Authorization: Bearer {{auth_token}}  ← Automatico!

✅ Risposta: Dati utente
```

### List Users
```
GET {{base_url}}/users

Headers:
Authorization: Bearer {{auth_token}}  ← Automatico!

✅ Risposta: Lista utenti
```

---

## 🔑 Credenziali Disponibili

| Ruolo           | Email              | Password   |
|-----------------|-------------------|------------|
| Admin           | admin@dggm.com    | password   |
| Project Manager | pm@dggm.com       | password   |
| Worker          | worker@dggm.com   | password   |

**Nella collection ci sono 3 request di login**, una per ogni ruolo!

---

## 🐛 Risoluzione Problemi

### ❌ Errore 401 Unauthorized (CON cookie salvato correttamente)

**Causa**: Il cookie `auth_token` viene criptato da Laravel per default

**Sintomi**:
- Il cookie appare correttamente in Postman Cookies
- La richiesta viene inviata con il cookie
- Backend risponde con 401 Unauthorized

**Soluzione PERMANENTE (Backend)**:

Il middleware `EncryptCookies` è stato configurato per escludere `auth_token` dalla crittografia.

**Sul server di produzione**:
```bash
cd /var/www/html/dggm/backend

# Verifica che il file sia aggiornato
cat app/Http/Middleware/EncryptCookies.php
# Deve contenere: protected $except = ['auth_token'];

# Pulisci la cache
php artisan config:cache
php artisan cache:clear

# Riavvia i servizi
sudo systemctl restart php8.2-fpm nginx
```

**Soluzione TEMPORANEA (Postman)**:

Se non puoi aggiornare il backend immediatamente, usa il metodo manuale:

1. Fai il login e copia il token dal cookie
2. Usa direttamente l'header `Authorization: Bearer TOKEN`
3. NON usare il cookie

### ❌ Errore 401 Unauthorized

**Causa**: Token non valido o mancante

**Soluzione**:
1. Fai di nuovo il Login
2. Verifica che nella Console appaia "✓ Token estratto e salvato"
3. Controlla che l'header `Authorization: Bearer {{auth_token}}` sia presente

### ❌ "{{auth_token}}" appare letteralmente nell'header

**Causa**: Variabile non impostata

**Soluzione**:
1. Fai il Login
2. Controlla la variabile: icona occhio in alto a destra
3. Cerca `auth_token` - deve avere un valore

### ❌ Cookie non viene salvato

**Causa**: Settings di Postman

**Soluzione**:
1. **Settings** (⚙️) > **General**
2. Abilita **"Send cookies with requests"**
3. Riprova il login

### ❌ CORS error

**Causa**: Stai usando Postman Web

**Soluzione**:
- Usa **Postman Desktop App**
- Oppure disabilita CORS in Settings (solo per test)

---

## 💡 Tips & Tricks

### Vedere Tutte le Variabili
Click sull'**icona occhio** 👁️ in alto a destra per vedere:
- Collection Variables
- Environment Variables
- Global Variables

### Usare la Console
**View** > **Show Postman Console** per vedere:
- Log degli script
- Token estratto
- Errori dettagliati

### Duplicare Request
Right-click su una request > **Duplicate** per creare varianti

### Testare con Diversi Ruoli
Esegui:
1. **Login (Admin)** → testa come admin
2. **Login (PM)** → testa come PM
3. **Login (Worker)** → testa come worker

Ogni login sovrascrive il token precedente.

### Salvare Risposte
Click su **Save Response** per salvare esempi di risposte

---

## 📦 File Disponibili

| File | Descrizione |
|------|-------------|
| `DGGM_ERP_API.postman_collection.json` | Collection con tutte le request |
| `DGGM_ERP_Production.postman_environment.json` | Environment per produzione |
| `DGGM_ERP_Development.postman_environment.json` | Environment per sviluppo |
| `POSTMAN_TESTING.md` | Documentazione completa |
| `POSTMAN_QUICK_START.md` | Questa guida |

---

## 🎓 Prossimi Passi

1. ✅ Importa la collection
2. ✅ Fai il login
3. ✅ Testa alcune request (Users, Sites, etc.)
4. 📖 Leggi `POSTMAN_TESTING.md` per dettagli avanzati
5. 🔧 Personalizza le request per i tuoi test

---

## 🆘 Supporto

**Problemi?**
1. Controlla la **Console** di Postman
2. Controlla i **Headers** della risposta
3. Verifica le **variabili** (icona occhio)
4. Leggi `POSTMAN_TESTING.md` per troubleshooting dettagliato

**Tutto OK?** 🎉
Sei pronto per testare l'API completa!

---

**Creato**: 20 Gennaio 2026
**Versione**: 1.0
