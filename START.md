# 🚀 Quick Start Guide - DGGM ERP

## Avvio Completo del Progetto

### Opzione 1: Terminali Separati (Consigliato per sviluppo)

**Terminal 1 - Backend Laravel:**
```bash
cd /Users/davidedonghi/Apps/dggm/backend
composer dev
```

Questo avvia 4 servizi:
- ✅ Laravel API su http://localhost:8000
- ✅ Queue worker
- ✅ Laravel Pail (logs real-time)
- ✅ Vite dev server

**Terminal 2 - Frontend Next.js:**
```bash
cd /Users/davidedonghi/Apps/dggm/frontend
npm run dev
```

Questo avvia:
- ✅ Next.js su http://localhost:3000

### Opzione 2: Comandi Singoli

**Solo Backend API:**
```bash
cd backend
php artisan serve
# API disponibile su http://localhost:8000
```

**Solo Frontend:**
```bash
cd frontend
npm run dev
# App disponibile su http://localhost:3000
```

## Test API Backend (senza frontend)

### Con cURL

**Login:**
```bash
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@dggm.com",
    "password": "password"
  }'
```

**Risposta:**
```json
{
  "success": true,
  "data": {
    "token": "1|abc123..."
  }
}
```

**Get Profile:**
```bash
curl -X GET http://localhost:8000/api/v1/auth/me \
  -H "Authorization: Bearer IL_TUO_TOKEN"
```

### Con Browser

1. Apri http://localhost:3000
2. Login con: `admin@dggm.com` / `password`
3. Dashboard disponibile

## Utenti Demo

| Email | Password | Ruolo |
|-------|----------|-------|
| admin@dggm.com | password | Super Admin |
| pm@dggm.com | password | Project Manager |
| worker@dggm.com | password | Worker |

## Struttura Progetto

```
dggm/
├── backend/          Laravel 12 API
│   ├── app/
│   ├── routes/api.php
│   ├── database/
│   └── tests/
│
├── frontend/         Next.js 14
│   ├── app/
│   ├── components/
│   └── lib/
│
└── README.md
```

## URLs Importanti

- **Frontend App**: http://localhost:3000
- **Backend API**: http://localhost:8000/api/v1
- **API Docs**: (Coming soon)

## Comandi Utili

### Backend
```bash
# Reset database
cd backend
php artisan migrate:fresh --seed

# Run tests
composer test

# Format code
./vendor/bin/pint
```

### Frontend
```bash
# Build production
cd frontend
npm run build

# Lint
npm run lint
```

## Troubleshooting

### Porta già in uso (Backend)
```bash
# Il backend si avvierà automaticamente sulla porta successiva disponibile
# Es: 8001, 8002, etc.
```

### Dipendenze non installate
```bash
# Backend
cd backend
composer install

# Frontend
cd frontend
npm install
```

### Database non trovato
```bash
cd backend
php artisan migrate:fresh --seed
```

## Next Steps

1. ✅ Backend e Frontend configurati
2. ✅ Autenticazione funzionante
3. 🚧 **Prossimo**: Implementare CRUD Customers
4. 📋 **Poi**: Sites, Quotes, Time Tracking...

---

**Sviluppo attivo**: Entrambi i server in modalità watch - le modifiche si riflettono automaticamente!
