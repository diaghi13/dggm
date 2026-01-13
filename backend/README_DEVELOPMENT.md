# DGGM ERP - Development Guide

## Quick Start

### 1. Start Backend (Laravel API)

```bash
# Option A: All services together (recommended)
composer dev

# Option B: Services separately
php artisan serve              # Backend API on http://localhost:8000
npm run dev                    # Vite dev server
php artisan queue:listen       # Queue worker
php artisan pail               # Real-time logs
```

The `composer dev` command starts all 4 services concurrently.

### 2. Test API with cURL

**Login:**
```bash
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@dggm.com",
    "password": "password"
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": 1,
      "name": "Super Admin",
      "email": "admin@dggm.com",
      "roles": ["super-admin"],
      "permissions": ["users.view", "users.create", ...]
    },
    "token": "1|abc123xyz..."
  }
}
```

**Get Profile (requires token):**
```bash
curl -X GET http://localhost:8000/api/v1/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Logout:**
```bash
curl -X POST http://localhost:8000/api/v1/auth/logout \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### 3. Test API with Postman/Insomnia

1. **Import Collection**: Create new request collection
2. **Base URL**: `http://localhost:8000/api/v1`
3. **Login**: POST to `/auth/login` with JSON body
4. **Save Token**: Copy token from response
5. **Set Auth**: Add `Authorization: Bearer {token}` header to requests

### Test Users

| Email | Password | Role |
|-------|----------|------|
| admin@dggm.com | password | super-admin |
| pm@dggm.com | password | project-manager |
| worker@dggm.com | password | worker |

## Database

### Reset Database
```bash
php artisan migrate:fresh --seed
```

### Run Seeders Only
```bash
php artisan db:seed
```

## Testing

### Run All Tests
```bash
composer test
# or
php artisan test
```

### Run Specific Test
```bash
php artisan test --filter=AuthenticationTest
```

### Run with Coverage
```bash
php artisan test --coverage
```

## Code Quality

### Format Code (Laravel Pint)
```bash
./vendor/bin/pint
```

### Check Code Style
```bash
./vendor/bin/pint --test
```

## Troubleshooting

### Clear Caches
```bash
php artisan config:clear
php artisan cache:clear
php artisan route:clear
```

### Regenerate Key
```bash
php artisan key:generate
```

### Storage Link
```bash
php artisan storage:link
```

## API Documentation

Once running, API endpoints available at:
- `http://localhost:8000/api/v1/auth/*` - Authentication
- `http://localhost:8000/api/v1/users/*` - User management (coming soon)
- `http://localhost:8000/api/v1/customers/*` - Customer registry (coming soon)
- More endpoints will be added as development progresses
