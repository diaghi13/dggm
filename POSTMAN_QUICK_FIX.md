# 🚀 FIX RAPIDO: 401 Unauthorized in Postman

## TL;DR - Soluzione in 3 Passi

### 1️⃣ Login
```
POST http://localhost:8002/api/v1/auth/login
Content-Type: application/json

{
  "email": "admin@dggm.com",
  "password": "password"
}
```

### 2️⃣ Copia il Token
- Risposta → Tab **Cookies** → `auth_token` → **Copia il valore**

### 3️⃣ Usa il Token
```
GET http://localhost:8002/api/v1/auth/me
Authorization: Bearer {IL_TOKEN_COPIATO}
```

---

## ⚡ Test Automatico

Verifica che tutto funzioni:

```bash
./test-auth.sh
```

Lo script ti darà il token da usare.

---

## 📚 Guide Dettagliate

- **Guida completa:** `FIX_POSTMAN_401.md`
- **Guida autenticazione:** `POSTMAN_AUTH_GUIDE.md`
- **Collezione Postman:** `DGGM_ERP_API.postman_collection.json`

---

## ❓ Perché ricevo 401?

Il backend usa **cookie httpOnly** per sicurezza. Postman non invia automaticamente i cookie come un browser.

**Soluzione:** Usa l'header `Authorization: Bearer {token}` invece dei cookie.

Il middleware `AddBearerTokenFromCookie` converte automaticamente il cookie in Bearer token per il frontend, ma Postman deve usare il Bearer token direttamente.
