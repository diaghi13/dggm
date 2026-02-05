# Sistema di Gestione Profilo Utente

## 📋 Panoramica

Sistema completo per la gestione del profilo utente con aggiornamento dati, cambio password e gestione sessioni attive.

## 🎯 Funzionalità Implementate

### 1. **Gestione Profilo** (`/profile`)

- ✅ Visualizzazione informazioni utente
- ✅ Modifica nome e email
- ✅ Cambio password con validazione
- ✅ Visualizzazione ruoli e permessi (read-only)
- ✅ Badge verifica email
- ✅ Data di registrazione

### 2. **Gestione Sessioni**

- ✅ Lista di tutte le sessioni attive
- ✅ Identificazione dispositivo corrente
- ✅ Revoca sessioni individuali
- ✅ Disconnessione di tutti gli altri dispositivi
- ✅ Icone device (mobile/desktop)
- ✅ Ultimo accesso e data creazione

### 3. **Sicurezza**

- ✅ Validazione password forte (min 8 char, maiuscola, minuscola, numero)
- ✅ Conferma password richiesta
- ✅ Show/hide password con icone
- ✅ Protezione sessione corrente (non eliminabile)

## 📁 Struttura File

```
app/(dashboard)/profile/
└── page.tsx                              # Pagina principale profilo

components/profile/
├── profile-form.tsx                      # Form aggiornamento profilo
├── password-form.tsx                     # Form cambio password
└── sessions-table.tsx                    # Tabella gestione sessioni

lib/api/
└── profile.ts                            # API client profilo e sessioni

stores/
└── auth-store.ts                         # Store auth esistente (già usato)
```

## 🔌 Endpoint Backend

### ✅ Già Disponibili

- `GET /auth/me` - Dati utente completi
- `GET /auth/sessions` - Lista sessioni
- `DELETE /auth/sessions/{tokenId}` - Revoca sessione
- `POST /auth/sessions/revoke-others` - Revoca altre sessioni

### ⚠️ Da Implementare Backend

- `PUT /auth/profile` - Aggiorna profilo (name, email)
- `PUT /auth/password` - Cambia password

**Request Body per `/auth/profile`:**

```json
{
  "name": "Mario Rossi",
  "email": "mario.rossi@example.com"
}
```

**Request Body per `/auth/password`:**

```json
{
  "current_password": "old_password",
  "password": "new_password",
  "password_confirmation": "new_password"
}
```

**Response attesa per `/auth/sessions`:**

```json
{
  "success": true,
  "data": {
    "sessions": [
      {
        "id": 1,
        "name": "Chrome on macOS",
        "token": "...",
        "last_used_at": "2026-02-05T10:30:00.000000Z",
        "expires_at": null,
        "created_at": "2026-02-01T09:00:00.000000Z",
        "is_current": true
      }
    ]
  }
}
```

## 🎨 UI/UX

### Card Informazioni Utente

- Avatar con iniziali colorate
- Nome e email in evidenza
- Badge ruoli
- Badge verifica email
- Data registrazione

### Form Profilo

- Layout a 2 colonne responsive
- Validazione real-time
- Pulsante "Salva" disabilitato se nessuna modifica
- FormSection con titolo e descrizione

### Form Password

- 3 campi: corrente, nuova, conferma
- Toggle show/hide per ogni campo
- Validazione password forte
- Reset automatico dopo successo

### Tabella Sessioni

- Card per ogni sessione
- Icona device-specific
- Badge "Sessione Corrente"
- Timestamp relativi (es: "2 giorni fa")
- Pulsante revoca per altre sessioni
- Alert dialog conferma disconnessione
- Pulsante "Disconnetti tutti" se > 1 sessione

## 🔐 Sicurezza

### Validazione Password

```typescript
- Minimo 8 caratteri
- Almeno 1 maiuscola
- Almeno 1 minuscola
- Almeno 1 numero
- Password e conferma devono combaciare
```

### Protezioni Sessioni

- Sessione corrente non eliminabile
- Conferma richiesta per disconnessioni
- Conteggio sessioni da eliminare mostrato

## 🚀 Come Usare

### Accesso alla Pagina

1. Click su avatar utente (mobile/desktop)
2. Menu → "Account"
3. Oppure navigare direttamente a `/profile`

### Aggiornare Profilo

1. Modificare nome o email
2. Click "Salva Modifiche"
3. Store auth aggiornato automaticamente

### Cambiare Password

1. Inserire password corrente
2. Inserire nuova password (con requisiti)
3. Confermare nuova password
4. Click "Aggiorna Password"

### Gestire Sessioni

1. Vedere lista dispositivi connessi
2. Click icona cestino per disconnettere singolo device
3. Oppure "Disconnetti Tutti" per tutti gli altri

## 🧪 Test Suggeriti

### Frontend (già funzionante)

- ✅ Rendering pagina profilo
- ✅ Validazione form (client-side)
- ✅ UI responsive
- ✅ Gestione stati loading
- ✅ Toast notifications

### Backend (da implementare)

- ⚠️ Endpoint `PUT /auth/profile`
- ⚠️ Endpoint `PUT /auth/password`
- ⚠️ Validazione password corrente
- ⚠️ Validazione unicità email
- ⚠️ Update session con `is_current` flag

## 📦 Dipendenze Utilizzate

```json
{
  "react-hook-form": "Form management",
  "zod": "Schema validation",
  "@tanstack/react-query": "Data fetching",
  "date-fns": "Date formatting",
  "sonner": "Toast notifications",
  "zustand": "State management"
}
```

## 🎯 Pattern Utilizzati

- ✅ React Hook Form + Zod per validazione
- ✅ TanStack Query per data fetching
- ✅ Zustand per auth state
- ✅ Componenti UI riutilizzabili (FormSection, Card, etc)
- ✅ Layout responsive mobile-first
- ✅ Toast feedback per tutte le azioni
- ✅ Alert dialog per azioni distruttive
- ✅ Stile coerente con resto app

## 🔧 Configurazione Backend Necessaria

### Laravel Controller Esempio

```php
// ProfileController.php

public function update(Request $request)
{
    $validated = $request->validate([
        'name' => 'required|string|max:255',
        'email' => 'required|email|unique:users,email,' . auth()->id(),
    ]);

    $user = auth()->user();
    $user->update($validated);

    return response()->json([
        'success' => true,
        'data' => ['user' => $user->load('roles', 'permissions')],
    ]);
}

public function updatePassword(Request $request)
{
    $validated = $request->validate([
        'current_password' => 'required',
        'password' => 'required|min:8|confirmed|regex:/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/',
    ]);

    if (!Hash::check($validated['current_password'], auth()->user()->password)) {
        return response()->json([
            'success' => false,
            'message' => 'Password corrente non valida',
        ], 400);
    }

    auth()->user()->update([
        'password' => Hash::make($validated['password'])
    ]);

    return response()->json(['success' => true]);
}
```

## ✅ Completato

Sistema di gestione profilo completamente funzionante lato frontend. Backend necessita solo di 2 endpoint aggiuntivi (`PUT /auth/profile` e `PUT /auth/password`).
