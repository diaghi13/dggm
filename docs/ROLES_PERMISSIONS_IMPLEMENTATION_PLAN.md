# Piano Implementazione Gestione Ruoli e Permessi - DGGM ERP

**Data creazione:** 2026-01-28
**Autore:** Davide Donghi + Claude
**Versione:** 1.0.0
**Stato:** In implementazione

---

## 📋 Indice

1. [Analisi Stato Attuale](#analisi-stato-attuale)
2. [Problemi Identificati](#problemi-identificati)
3. [Piano Implementazione](#piano-implementazione)
4. [Idee Future](#idee-future)
5. [Note Tecniche](#note-tecniche)

---

## Analisi Stato Attuale

### Backend Laravel - Stato Attuale

#### ✅ Cosa Funziona Bene

**Struttura Permessi (185+ permessi)**
- Naming convention: `{module}.{action}` (es. `users.view`, `sites.create`, `quotes.approve`)
- Organizzati per modulo business (users, customers, sites, quotes, warehouse, ecc.)
- Azioni CRUD + azioni specializzate (approve, reject, deliver, confirm, cancel)
- Seeder completo e idempotent (`RoleAndPermissionSeeder.php`)

**Ruoli Predefiniti (8 ruoli)**
```
1. super-admin      → Accesso completo sistema
2. admin            → Gestione azienda completa (no settings.edit)
3. project-manager  → Gestione cantieri, preventivi, squadre
4. team-leader      → Gestione cantieri assegnati, team limitato
5. worker           → Time tracking, richieste materiali proprie
6. accountant       → Fatturazione, contabilità, report
7. warehousekeeper  → Magazzino, DDT, inventario
8. customer         → Solo visualizzazione (portale clienti futuro)
```

**Policies Implementate (21 policies)**
- Pattern standard CRUD per tutte le risorse principali
- Pattern ibridi (role + permission) per risorse complesse
- Autorizzazione context-aware (es. MaterialRequestPolicy con Site)
- Custom actions (respond, changeStatus, approve, reject, ecc.)

**Protezione API**
- Tutti gli endpoint protetti con `auth:sanctum`
- Middleware custom per token da cookie httpOnly
- Solo 2 endpoint pubblici (login, accept invitation)

**File Chiave**
```
backend/database/seeders/RoleAndPermissionSeeder.php
backend/app/Models/User.php (HasRoles trait)
backend/app/Policies/*.php (21 policies)
backend/config/permission.php
backend/routes/api.php
```

#### ❌ Cosa Manca (CRITICO)

**Nessuna API per Gestione Ruoli/Permessi**
- ❌ Nessun endpoint CRUD per ruoli
- ❌ Nessun endpoint per assegnare/revocare permessi a ruoli
- ❌ Nessun endpoint per assegnare/revocare ruoli a utenti
- ❌ Nessun endpoint per listare permessi
- **Risultato:** L'unico modo per gestire ruoli è tramite seeder o database diretto

**Policies Mancanti**
- `InvoicePolicy` - Manca completamente
- `TimeTrackingPolicy` - Manca completamente
- Alcuni controller non usano policies consistentemente

**Audit Trail Inesistente**
- Nessun log di modifiche a ruoli/permessi
- Impossibile tracciare chi ha fatto cosa

**Role Hierarchy Non Utilizzata**
- Spatie supporta gerarchie ruoli ma non è implementata
- Permessi duplicati tra ruoli (es. admin ha manualmente tutti i permessi di project-manager)

---

### Frontend Next.js - Stato Attuale

#### ✅ Cosa Funziona Bene

**Type System Completo**
```typescript
interface User {
  id: number;
  name: string;
  email: string;
  roles: string[];        // Array nomi ruoli
  permissions: string[];  // Array nomi permessi
  worker?: {...};
}

interface Role {
  id: number;
  name: string;
  display_name: string;
  description?: string;
  permissions: string[];
}
```

**Hook Permessi Potente**
```typescript
const {
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  hasRole,
  hasAnyRole,
  isAdmin
} = usePermissions();
```

**Componenti Protezione UI**
```tsx
// Protezione intera pagina
<ProtectedRoute permission="users.view">
  <UsersPage />
</ProtectedRoute>

// Protezione inline
<Can permission="users.delete">
  <Button>Delete</Button>
</Can>
```

**UI Management Completa**
- Pagina `/dashboard/users` con 2 tab:
  - Tab 1: Gestione utenti (CRUD, assegnazione ruoli)
  - Tab 2: Gestione ruoli (CRUD, assegnazione permessi)
- Navigazione dashboard filtrata per permessi
- Form validati con React Hook Form + Zod

**Sicurezza Token**
- Token in httpOnly cookie (secure)
- CSRF protection
- Auto-cleanup localStorage su 401

**File Chiave**
```
frontend/stores/auth-store.ts
frontend/hooks/use-permissions.ts
frontend/components/features/auth/protected-route.tsx
frontend/components/features/auth/can.tsx
frontend/app/(dashboard)/users/page.tsx
frontend/lib/api/users.ts
```

#### ❌ Cosa Manca

**API Backend Non Esistenti**
- Frontend ha UI per gestire ruoli/permessi
- Le chiamate API falliscono perché endpoint non esistono
- **Blocca completamente la funzionalità**

**Token Refresh**
- TODO nel codice ma non implementato
- Quando token scade → logout forzato

**UX Errori 403**
- Errori logged solo in console
- Nessun toast/notifica visibile all'utente

**Middleware Next.js**
- Protezione solo client-side (bypassabile)
- Manca middleware server-side per route protection

**Bulk Actions**
- Non puoi selezionare/modificare/eliminare utenti multipli
- Nessun filtro/ricerca avanzata utenti

---

## Problemi Identificati

### 🔴 CRITICI (Blocca funzionalità)

1. **Backend API mancante per ruoli/permessi**
   - Il frontend ha già l'intera UI implementata
   - Tutte le chiamate API falliscono
   - Impossibile gestire ruoli/permessi da interfaccia

### 🟡 IMPORTANTI (Limitazioni significative)

2. **Policies incomplete**
   - `InvoicePolicy` mancante
   - `TimeTrackingPolicy` mancante
   - Autorizzazione inconsistente su alcuni endpoint

3. **Nessun audit trail**
   - Impossibile tracciare modifiche sicurezza
   - Nessun log chi ha modificato ruoli/permessi

4. **UX errori 403 scadente**
   - Utente non capisce perché azione bloccata
   - Nessun feedback visuale

### 🟢 NICE-TO-HAVE (Miglioramenti futuri)

5. **Token refresh mancante**
   - Logout forzato alla scadenza token

6. **Bulk actions**
   - Gestione utenti uno alla volta (lento)

7. **Role hierarchy non usata**
   - Permessi duplicati manualmente

---

## Piano Implementazione

### FASE 1: Backend API Ruoli/Permessi (PRIORITÀ CRITICA) ⚡

**Obiettivo:** Implementare API completa per gestione ruoli e permessi

**Tempo stimato:** 1 giornata

#### 1.1 Controllers

**RoleController** (`app/Http/Controllers/Api/V1/RoleController.php`)
```php
GET    /api/v1/roles              → index()    Lista tutti i ruoli
POST   /api/v1/roles              → store()    Crea nuovo ruolo
GET    /api/v1/roles/{id}         → show()     Dettaglio ruolo
PUT    /api/v1/roles/{id}         → update()   Modifica ruolo
DELETE /api/v1/roles/{id}         → destroy()  Elimina ruolo
POST   /api/v1/roles/{id}/permissions/{permission}    → assignPermission()
DELETE /api/v1/roles/{id}/permissions/{permission}    → revokePermission()
POST   /api/v1/roles/{id}/sync-permissions             → syncPermissions() (bulk)
```

**PermissionController** (`app/Http/Controllers/Api/V1/PermissionController.php`)
```php
GET /api/v1/permissions         → index()         Lista tutti i permessi
GET /api/v1/permissions/grouped → getGrouped()    Permessi raggruppati per modulo
```

**UserRoleController** (estensione UserController esistente)
```php
POST   /api/v1/users/{id}/roles        → assignRoles()   Assegna ruoli a utente
DELETE /api/v1/users/{id}/roles/{role} → revokeRole()    Rimuovi ruolo da utente
POST   /api/v1/users/{id}/sync-roles   → syncRoles()     Sync ruoli (bulk)
```

#### 1.2 Form Requests

**StoreRoleRequest** (`app/Http/Requests/StoreRoleRequest.php`)
```php
Rules:
- name: required|string|max:255|unique:roles
- display_name: required|string|max:255
- description: nullable|string|max:1000
- permissions: nullable|array
- permissions.*: exists:permissions,name

Authorization: $user->hasRole('super-admin')
```

**UpdateRoleRequest** (`app/Http/Requests/UpdateRoleRequest.php`)
```php
Rules:
- name: readonly (non modificabile)
- display_name: required|string|max:255
- description: nullable|string|max:1000
- permissions: nullable|array
- permissions.*: exists:permissions,name

Authorization: $user->hasRole('super-admin')
```

**AssignPermissionsRequest** (`app/Http/Requests/AssignPermissionsRequest.php`)
```php
Rules:
- permissions: required|array
- permissions.*: exists:permissions,name

Authorization: $user->hasRole('super-admin')
```

**AssignRolesRequest** (`app/Http/Requests/AssignRolesRequest.php`)
```php
Rules:
- roles: required|array
- roles.*: exists:roles,name

Authorization: $user->can('users.edit')
```

#### 1.3 Policies

**RolePolicy** (`app/Policies/RolePolicy.php`)
```php
viewAny()  → return $user->can('users.view');
view()     → return $user->can('users.view');
create()   → return $user->hasRole('super-admin');
update()   → return $user->hasRole('super-admin');
delete()   → return $user->hasRole('super-admin');
```

**PermissionPolicy** (`app/Policies/PermissionPolicy.php`)
```php
viewAny() → return $user->can('users.view');  // Tutti possono vedere lista
view()    → return $user->can('users.view');
```

#### 1.4 Resources (API Response)

**RoleResource** (`app/Http/Resources/RoleResource.php`)
```php
return [
    'id' => $this->id,
    'name' => $this->name,
    'display_name' => $this->display_name,
    'description' => $this->description,
    'permissions' => $this->permissions->pluck('name'),
    'permissions_count' => $this->permissions->count(),
    'users_count' => $this->users()->count(),
    'created_at' => $this->created_at,
    'updated_at' => $this->updated_at,
];
```

**PermissionResource** (`app/Http/Resources/PermissionResource.php`)
```php
return [
    'id' => $this->id,
    'name' => $this->name,
    'guard_name' => $this->guard_name,
    'created_at' => $this->created_at,
    'updated_at' => $this->updated_at,
];
```

#### 1.5 Routes

Aggiungere in `routes/api.php`:
```php
Route::middleware('auth:sanctum')->group(function () {
    // Roles
    Route::apiResource('roles', RoleController::class);
    Route::post('roles/{role}/permissions/{permission}', [RoleController::class, 'assignPermission']);
    Route::delete('roles/{role}/permissions/{permission}', [RoleController::class, 'revokePermission']);
    Route::post('roles/{role}/sync-permissions', [RoleController::class, 'syncPermissions']);

    // Permissions
    Route::get('permissions', [PermissionController::class, 'index']);
    Route::get('permissions/grouped', [PermissionController::class, 'getGrouped']);

    // User roles
    Route::post('users/{user}/roles', [UserController::class, 'assignRoles']);
    Route::delete('users/{user}/roles/{role}', [UserController::class, 'revokeRole']);
    Route::post('users/{user}/sync-roles', [UserController::class, 'syncRoles']);
});
```

#### 1.6 Validazioni Business Logic

**Regole da implementare:**
- Non puoi eliminare ruoli di sistema (super-admin, admin)
- Non puoi eliminare ruolo se ha utenti assegnati (soft delete invece)
- Non puoi modificare nome ruolo (immutabile)
- Super-admin non può rimuoversi il proprio ruolo
- Almeno un super-admin deve sempre esistere

#### 1.7 Tests

**Feature Tests da creare:**
```php
tests/Feature/RoleManagementTest.php
- test_super_admin_can_list_roles()
- test_super_admin_can_create_role()
- test_super_admin_can_update_role()
- test_super_admin_can_delete_role()
- test_super_admin_can_assign_permissions_to_role()
- test_non_super_admin_cannot_manage_roles()
- test_cannot_delete_system_roles()
- test_cannot_delete_role_with_users()

tests/Feature/PermissionManagementTest.php
- test_can_list_permissions()
- test_can_get_grouped_permissions()
- test_permissions_are_readonly()
```

---

### FASE 2: Backend - Policies Mancanti (PRIORITÀ ALTA) 🔒

**Obiettivo:** Completare policies mancanti per autorizzazione consistente

**Tempo stimato:** 2-3 ore

#### 2.1 InvoicePolicy

**File:** `app/Policies/InvoicePolicy.php`

```php
class InvoicePolicy
{
    public function viewAny(User $user): bool
    {
        return $user->can('invoices.view');
    }

    public function view(User $user, Invoice $invoice): bool
    {
        return $user->can('invoices.view');
    }

    public function create(User $user): bool
    {
        return $user->can('invoices.create');
    }

    public function update(User $user, Invoice $invoice): bool
    {
        // Non puoi modificare fatture già inviate/pagate
        if ($invoice->status === 'sent' || $invoice->status === 'paid') {
            return false;
        }

        return $user->can('invoices.edit');
    }

    public function delete(User $user, Invoice $invoice): bool
    {
        // Puoi eliminare solo fatture in bozza
        if ($invoice->status !== 'draft') {
            return false;
        }

        return $user->can('invoices.delete');
    }

    public function send(User $user, Invoice $invoice): bool
    {
        // Puoi inviare solo fatture in bozza
        if ($invoice->status !== 'draft') {
            return false;
        }

        return $user->can('invoices.send');
    }
}
```

#### 2.2 TimeTrackingPolicy

**File:** `app/Policies/TimeTrackingPolicy.php`

```php
class TimeTrackingPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->can('time-trackings.view');
    }

    public function view(User $user, TimeTracking $timeTracking): bool
    {
        if ($user->can('time-trackings.view')) {
            return true;
        }

        // Workers can view their own time trackings
        if ($user->can('time-trackings.view-own') && $user->worker) {
            return $timeTracking->worker_id === $user->worker->id;
        }

        return false;
    }

    public function create(User $user): bool
    {
        return $user->can('time-trackings.create');
    }

    public function update(User $user, TimeTracking $timeTracking): bool
    {
        // Can't edit approved time trackings
        if ($timeTracking->status === 'approved') {
            return false;
        }

        if ($user->can('time-trackings.edit')) {
            return true;
        }

        // Workers can edit their own pending time trackings
        if ($user->worker && $timeTracking->worker_id === $user->worker->id) {
            return $timeTracking->status === 'pending';
        }

        return false;
    }

    public function delete(User $user, TimeTracking $timeTracking): bool
    {
        // Can't delete approved time trackings
        if ($timeTracking->status === 'approved') {
            return false;
        }

        return $user->can('time-trackings.delete');
    }

    public function approve(User $user, TimeTracking $timeTracking): bool
    {
        if (!$user->can('time-trackings.approve')) {
            return false;
        }

        // Can only approve pending time trackings
        return $timeTracking->status === 'pending';
    }
}
```

#### 2.3 Registrazione Policies

Aggiungere in `app/Providers/AppServiceProvider.php` o `AuthServiceProvider.php`:
```php
protected $policies = [
    Invoice::class => InvoicePolicy::class,
    TimeTracking::class => TimeTrackingPolicy::class,
];
```

#### 2.4 Update Controllers

Aggiungere `$this->authorize()` in controller esistenti:
```php
// InvoiceController
public function index() {
    $this->authorize('viewAny', Invoice::class);
    // ...
}

// TimeTrackingController
public function approve(TimeTracking $timeTracking) {
    $this->authorize('approve', $timeTracking);
    // ...
}
```

---

### FASE 3: Frontend - UX Improvements (PRIORITÀ MEDIA) 🎨

**Obiettivo:** Migliorare user experience per errori e gestione utenti

**Tempo stimato:** 3-4 ore

#### 3.1 Toast 403 Forbidden

**File da modificare:** `frontend/lib/api/client.ts`

```typescript
// Installare sonner se non presente
// npm install sonner

import { toast } from 'sonner';

// Nel blocco error handling
if (error.response?.status === 403) {
  const message = error.response?.data?.message || 'Non hai i permessi per questa azione';

  toast.error('Accesso negato', {
    description: message,
    duration: 5000,
  });

  console.error('Access forbidden:', error.response.data);
}

if (error.response?.status === 401) {
  toast.error('Sessione scaduta', {
    description: 'Effettua nuovamente il login',
    duration: 5000,
  });

  // ... resto del codice
}
```

**Aggiungere Toaster in layout:**
`frontend/app/providers.tsx`
```typescript
import { Toaster } from 'sonner';

export function Providers({ children }) {
  return (
    <>
      {children}
      <Toaster position="top-right" richColors />
    </>
  );
}
```

#### 3.2 Bulk Actions Utenti

**File da modificare:** `frontend/app/(dashboard)/users/page.tsx`

**Features da aggiungere:**
1. Checkbox per selezione multipla
2. Toolbar con azioni bulk:
   - Elimina selezionati
   - Cambia stato (attiva/disattiva)
   - Assegna ruolo
3. "Seleziona tutti" / "Deseleziona tutti"

**Esempio implementazione:**
```typescript
const [selectedUsers, setSelectedUsers] = useState<number[]>([]);

const handleBulkDelete = async () => {
  if (!confirm(`Eliminare ${selectedUsers.length} utenti?`)) return;

  await Promise.all(
    selectedUsers.map(id => usersApi.delete(id))
  );

  toast.success(`${selectedUsers.length} utenti eliminati`);
  setSelectedUsers([]);
  queryClient.invalidateQueries(['users']);
};

const handleBulkAssignRole = async (roleName: string) => {
  await Promise.all(
    selectedUsers.map(id => usersApi.assignRole(id, roleName))
  );

  toast.success(`Ruolo assegnato a ${selectedUsers.length} utenti`);
  setSelectedUsers([]);
  queryClient.invalidateQueries(['users']);
};
```

#### 3.3 Filtri e Ricerca Utenti

**Aggiungere sopra la tabella:**
```typescript
const [filters, setFilters] = useState({
  search: '',
  role: 'all',
  status: 'all'
});

const filteredUsers = users?.filter(user => {
  const matchSearch = user.name.toLowerCase().includes(filters.search.toLowerCase()) ||
                     user.email.toLowerCase().includes(filters.search.toLowerCase());

  const matchRole = filters.role === 'all' || user.roles.includes(filters.role);

  const matchStatus = filters.status === 'all' ||
                      (filters.status === 'active' && user.is_active) ||
                      (filters.status === 'inactive' && !user.is_active);

  return matchSearch && matchRole && matchStatus;
});
```

**UI Filtri:**
```tsx
<div className="flex gap-4 mb-4">
  <Input
    placeholder="Cerca per nome o email..."
    value={filters.search}
    onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
  />

  <Select value={filters.role} onValueChange={(v) => setFilters(prev => ({ ...prev, role: v }))}>
    <SelectTrigger className="w-[200px]">
      <SelectValue placeholder="Tutti i ruoli" />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="all">Tutti i ruoli</SelectItem>
      {roles?.map(role => (
        <SelectItem key={role.name} value={role.name}>{role.display_name}</SelectItem>
      ))}
    </SelectContent>
  </Select>

  <Select value={filters.status} onValueChange={(v) => setFilters(prev => ({ ...prev, status: v }))}>
    <SelectTrigger className="w-[180px]">
      <SelectValue placeholder="Stato" />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="all">Tutti</SelectItem>
      <SelectItem value="active">Attivi</SelectItem>
      <SelectItem value="inactive">Inattivi</SelectItem>
    </SelectContent>
  </Select>
</div>
```

---

### FASE 4: Audit Trail (PRIORITÀ BASSA) 📊

**Obiettivo:** Tracciare tutte le modifiche a ruoli/permessi

**Tempo stimato:** 4-5 ore

#### 4.1 Installazione Spatie Activity Log

```bash
cd backend
composer require spatie/laravel-activitylog
php artisan vendor:publish --provider="Spatie\Activitylog\ActivitylogServiceProvider" --tag="activitylog-migrations"
php artisan migrate
php artisan vendor:publish --provider="Spatie\Activitylog\ActivitylogServiceProvider" --tag="activitylog-config"
```

#### 4.2 Logging Automatico

**Aggiungere trait ai modelli:**

```php
// app/Models/User.php
use Spatie\Activitylog\Traits\LogsActivity;
use Spatie\Activitylog\LogOptions;

class User extends Authenticatable
{
    use LogsActivity;

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logOnly(['name', 'email', 'is_active'])
            ->logOnlyDirty()
            ->dontSubmitEmptyLogs();
    }
}
```

**Logging manuale in Controllers:**

```php
// RoleController::assignPermission()
activity()
    ->performedOn($role)
    ->causedBy(auth()->user())
    ->withProperties([
        'permission' => $permission->name,
        'action' => 'permission_assigned'
    ])
    ->log("Permesso '{$permission->name}' assegnato al ruolo '{$role->name}'");

// UserController::assignRole()
activity()
    ->performedOn($user)
    ->causedBy(auth()->user())
    ->withProperties([
        'role' => $roleName,
        'action' => 'role_assigned'
    ])
    ->log("Ruolo '{$roleName}' assegnato a {$user->name}");
```

#### 4.3 AuditLogController

**File:** `app/Http/Controllers/Api/V1/AuditLogController.php`

```php
class AuditLogController extends Controller
{
    public function index(Request $request)
    {
        $this->authorize('viewAny', Activity::class);

        $logs = Activity::query()
            ->when($request->user_id, fn($q, $v) => $q->where('causer_id', $v))
            ->when($request->subject_type, fn($q, $v) => $q->where('subject_type', $v))
            ->when($request->action, fn($q, $v) => $q->whereJsonContains('properties->action', $v))
            ->latest()
            ->paginate(50);

        return ActivityResource::collection($logs);
    }

    public function show(Activity $activity)
    {
        $this->authorize('view', $activity);

        return new ActivityResource($activity);
    }
}
```

#### 4.4 Frontend Audit Logs UI

**File:** `frontend/app/(dashboard)/audit-logs/page.tsx`

Features:
- Tabella con tutte le attività
- Filtri: utente, tipo risorsa, azione, data
- Timeline view per singolo utente
- Export CSV

---

### FASE 5: Sicurezza & Performance (PRIORITÀ BASSA) 🔐

**Obiettivo:** Hardening sicurezza e ottimizzazioni

**Tempo stimato:** 1 giornata

#### 5.1 Next.js Middleware Route Protection

**File:** `frontend/middleware.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const authCookie = request.cookies.get('auth_token');
  const { pathname } = request.nextUrl;

  // Public routes
  const publicRoutes = ['/login', '/accept-invitation'];
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route));

  // Redirect to login if not authenticated
  if (!authCookie && !isPublicRoute) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Redirect to dashboard if authenticated and trying to access login
  if (authCookie && pathname === '/login') {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
```

#### 5.2 Token Refresh Backend

**File:** `app/Http/Controllers/Api/V1/AuthController.php`

```php
public function refresh(Request $request)
{
    $user = $request->user();

    // Revoke current token
    $user->currentAccessToken()->delete();

    // Create new token
    $token = $user->createToken('auth_token')->plainTextToken;

    // Set cookie
    cookie()->queue('auth_token', $token, 60 * 24 * 7, null, null, true, true);

    return response()->json([
        'success' => true,
        'message' => 'Token refreshed successfully',
        'data' => [
            'user' => new UserResource($user)
        ]
    ]);
}
```

**Route:**
```php
Route::middleware('auth:sanctum')->post('auth/refresh', [AuthController::class, 'refresh']);
```

#### 5.3 Token Refresh Frontend

**File:** `frontend/lib/api/client.ts`

```typescript
let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(() => {
          return apiClient(originalRequest);
        }).catch(err => {
          return Promise.reject(err);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        await authApi.refresh();
        processQueue(null, null);
        return apiClient(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        // Redirect to login
        window.location.href = '/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);
```

#### 5.4 Role Hierarchy (Spatie)

**File:** `database/seeders/RoleAndPermissionSeeder.php`

```php
// Dopo aver creato tutti i ruoli

// Admin eredita tutti i permessi da project-manager
$admin = Role::findByName('admin');
$projectManager = Role::findByName('project-manager');
$admin->givePermissionTo($projectManager->permissions);

// Project-manager eredita permessi da team-leader
$projectManager->givePermissionTo(
    Role::findByName('team-leader')->permissions
);

// Team-leader eredita permessi da worker
Role::findByName('team-leader')->givePermissionTo(
    Role::findByName('worker')->permissions
);
```

**Config:** `config/permission.php`
```php
'enable_wildcard_permission' => true,
```

#### 5.5 Rate Limiting per Ruolo

**File:** `app/Http/Kernel.php` o `bootstrap/app.php`

```php
RateLimiter::for('api', function (Request $request) {
    $user = $request->user();

    if (!$user) {
        return Limit::perMinute(20); // Guest
    }

    if ($user->hasRole('super-admin')) {
        return Limit::perMinute(120);
    }

    if ($user->hasAnyRole(['admin', 'project-manager'])) {
        return Limit::perMinute(100);
    }

    return Limit::perMinute(60); // Default authenticated
});
```

---

## Idee Future

### 1. Permission Groups & Modules

Raggruppare permessi visivamente nell'UI:

```
📁 Anagrafica
  ├─ Clienti (view, create, edit, delete)
  ├─ Fornitori (view, create, edit, delete)
  └─ Dipendenti (view, create, edit, delete)

📁 Cantieri
  ├─ Cantieri (view, create, edit, delete, view-own)
  ├─ Squadre (view, create, edit, delete)
  └─ Materiali (view, create, edit, delete)

📁 Magazzino
  ├─ Prodotti (view, create, edit, delete)
  ├─ DDT (view, create, edit, delete, confirm, cancel)
  └─ Inventario (view, inventory)
```

**Implementazione:**
- Creare tabella `permission_groups`
- Relazione `permissions.group_id`
- UI con accordion per gruppo
- Checkbox "Seleziona tutto il gruppo"

---

### 2. Role Templates

Creare "template" per ruoli comuni:

```php
// database/seeders/RoleTemplateSeeder.php
$templates = [
    'project-manager-standard' => [
        'display_name' => 'Project Manager Standard',
        'description' => 'Gestione cantieri senza accesso fatturazione',
        'permissions' => ['sites.*', 'quotes.*', 'workers.view']
    ],
    'project-manager-full' => [
        'display_name' => 'Project Manager Full',
        'description' => 'Gestione cantieri + fatturazione',
        'permissions' => ['sites.*', 'quotes.*', 'workers.*', 'invoices.*']
    ]
];
```

**UI:**
- Dropdown "Crea da template" quando crei nuovo ruolo
- Pre-compila permessi dal template
- L'utente può modificare prima di salvare

---

### 3. Temporary Permissions

Permessi temporanei per situazioni eccezionali:

```php
// Grant temporary permission
$user->givePermissionTo('sites.approve', [
    'expires_at' => now()->addDays(7)
]);

// Check in policy
if ($user->hasPermissionUntil('sites.approve', now())) {
    return true;
}
```

**Implementazione:**
- Aggiungere colonna `expires_at` a `model_has_permissions`
- Middleware per revocare permessi scaduti
- UI con datepicker per scadenza
- Notifica utente prima scadenza

---

### 4. Site-Specific Permissions

Permessi limitati a specifici cantieri:

```php
// User può approvare quotes solo per questo cantiere
$user->givePermissionTo('quotes.approve', [
    'site_id' => 123
]);

// Check in policy
public function approve(User $user, Quote $quote)
{
    return $user->hasPermissionTo('quotes.approve', [
        'site_id' => $quote->site_id
    ]);
}
```

**Use case:**
- Project Manager esterno solo per 1 cantiere
- Accountant solo per fatture di certi cantieri
- Team Leader con permessi extra su cantieri specifici

---

### 5. Two-Factor Authentication per Super-Admin

```bash
composer require pragmarx/google2fa-laravel
```

**Features:**
- 2FA obbligatorio per super-admin
- QR Code setup
- Recovery codes
- Backup email codes

---

### 6. Permission Analytics Dashboard

Dashboard per analisi utilizzo permessi:

**Metriche:**
- Permessi più usati (top 10)
- Ruoli con meno utenti
- Utenti per permesso
- Trend assegnazioni ruoli nel tempo
- Grafico permessi per modulo

**Chart types:**
- Bar chart: utenti per ruolo
- Pie chart: distribuzione permessi
- Line chart: trend assegnazioni nel tempo
- Heatmap: permessi × ruoli

---

### 7. Dynamic Permissions

Permessi definiti dinamicamente invece che hardcoded:

**UI Admin:**
- Crea nuovo permesso custom
- Scegli modulo
- Scegli azione
- Nome auto-generato: `{module}.{action}`

**Database:**
```php
Permission::create([
    'name' => 'custom-reports.generate',
    'module' => 'Custom Reports',
    'action' => 'Generate',
    'description' => 'Can generate custom financial reports'
]);
```

**Use case:**
- Plugin/moduli custom
- Features specifiche per cliente
- Permessi temporanei per progetti

---

### 8. Role Change Notifications

Email/notifica quando ruolo o permessi cambiano:

```php
// Event
event(new UserRoleChanged($user, $oldRoles, $newRoles));

// Listener
class SendRoleChangeNotification
{
    public function handle(UserRoleChanged $event)
    {
        Mail::to($event->user)->send(
            new RoleChangedMail($event->user, $event->oldRoles, $event->newRoles)
        );
    }
}
```

**Email template:**
```
Ciao {name},

I tuoi ruoli sono stati modificati:

Ruoli aggiunti:
- Project Manager

Ruoli rimossi:
- Worker

Nuovi permessi disponibili:
- Creazione cantieri
- Approvazione preventivi

Per maggiori informazioni contatta l'amministratore.
```

---

### 9. Permission Conflicts Detection

Sistema per rilevare conflitti permessi:

**Scenari:**
- Utente ha `sites.view-own` ma non `sites.view` (warning: permesso inutile)
- Ruolo ha permesso `users.delete` ma nessuno ha `users.view` (warning: inconsistente)
- Worker ha permessi admin (error: violazione sicurezza)

**UI:**
- Badge "⚠️ Conflitto" su ruoli problematici
- Modal con spiegazione problema
- Suggerimenti risoluzione automatica

---

### 10. Permission Presets per Moduli

Quando abiliti un modulo, abilita automaticamente permessi correlati:

```php
// Abilita modulo "Fatturazione"
$modulePresets = [
    'invoicing' => [
        'permissions' => [
            'invoices.view',
            'invoices.create',
            'invoices.edit',
            'invoices.delete',
            'invoices.send'
        ],
        'default_roles' => ['accountant', 'admin', 'super-admin']
    ]
];
```

**UI:**
- Checkbox "Abilita modulo Fatturazione"
- Mostra preview permessi che verranno aggiunti
- Scegli a quali ruoli assegnare

---

## Note Tecniche

### Spatie Laravel Permission - Reference

**Documentazione:** https://spatie.be/docs/laravel-permission

**Metodi principali:**

```php
// Assign/Revoke Role
$user->assignRole('admin');
$user->removeRole('worker');
$user->syncRoles(['admin', 'project-manager']);

// Check Role
$user->hasRole('admin');
$user->hasAnyRole(['admin', 'project-manager']);
$user->hasAllRoles(['admin', 'moderator']);

// Assign/Revoke Permission
$user->givePermissionTo('users.view');
$user->revokePermissionTo('users.delete');
$user->syncPermissions(['users.view', 'users.create']);

// Check Permission
$user->can('users.view');
$user->hasPermissionTo('users.delete');
$user->hasAnyPermission(['users.edit', 'users.create']);

// Role permissions
$role->givePermissionTo('users.view');
$role->revokePermissionTo('users.delete');
$role->syncPermissions(['users.view', 'users.create']);

// Get all permissions
$user->getAllPermissions();
$user->getPermissionsViaRoles();
$user->getDirectPermissions();

// Cache
app()[PermissionRegistrar::class]->forgetCachedPermissions();
```

---

### Database Schema

**Tabelle Spatie:**
```
permissions
  - id
  - name (unique)
  - guard_name
  - created_at, updated_at

roles
  - id
  - name (unique)
  - guard_name
  - created_at, updated_at

model_has_permissions (pivot user ↔ permission)
  - permission_id
  - model_type (User)
  - model_id (user_id)

model_has_roles (pivot user ↔ role)
  - role_id
  - model_type (User)
  - model_id (user_id)

role_has_permissions (pivot role ↔ permission)
  - permission_id
  - role_id
```

**Tabelle custom da aggiungere (future):**
```
permission_groups
  - id
  - name
  - display_name
  - description
  - sort_order

permissions aggiungere:
  - group_id (FK to permission_groups)
  - module
  - action
  - description
```

---

### Frontend API Client Pattern

**Standard pattern per chiamate API:**

```typescript
// lib/api/roles.ts
export const rolesApi = {
  getAll: async (): Promise<Role[]> => {
    const { data } = await apiClient.get('/roles');
    return data.data;
  },

  getById: async (id: number): Promise<Role> => {
    const { data } = await apiClient.get(`/roles/${id}`);
    return data.data;
  },

  create: async (payload: CreateRolePayload): Promise<Role> => {
    const { data } = await apiClient.post('/roles', payload);
    return data.data;
  },

  update: async (id: number, payload: UpdateRolePayload): Promise<Role> => {
    const { data } = await apiClient.put(`/roles/${id}`, payload);
    return data.data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/roles/${id}`);
  },

  assignPermission: async (roleId: number, permission: string): Promise<void> => {
    await apiClient.post(`/roles/${roleId}/permissions/${permission}`);
  },

  revokePermission: async (roleId: number, permission: string): Promise<void> => {
    await apiClient.delete(`/roles/${roleId}/permissions/${permission}`);
  },

  syncPermissions: async (roleId: number, permissions: string[]): Promise<void> => {
    await apiClient.post(`/roles/${roleId}/sync-permissions`, { permissions });
  }
};
```

**React Query pattern:**

```typescript
// hooks/use-roles.ts
export function useRoles() {
  return useQuery({
    queryKey: ['roles'],
    queryFn: rolesApi.getAll
  });
}

export function useRole(id: number) {
  return useQuery({
    queryKey: ['roles', id],
    queryFn: () => rolesApi.getById(id),
    enabled: !!id
  });
}

export function useCreateRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: rolesApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      toast.success('Ruolo creato con successo');
    },
    onError: (error) => {
      toast.error('Errore durante la creazione del ruolo');
    }
  });
}
```

---

### Testing Checklist

**Backend Tests:**
- [ ] Super-admin può creare ruoli
- [ ] Super-admin può modificare ruoli
- [ ] Super-admin può eliminare ruoli
- [ ] Super-admin può assegnare permessi
- [ ] Non-super-admin NON può gestire ruoli
- [ ] Non puoi eliminare ruoli di sistema
- [ ] Non puoi eliminare ruolo con utenti
- [ ] Non puoi modificare nome ruolo
- [ ] Super-admin non può rimuoversi ruolo
- [ ] Policy authorization funziona
- [ ] Permissions API è readonly
- [ ] Grouped permissions ritorna struttura corretta
- [ ] User può vedere solo permessi consentiti

**Frontend Tests:**
- [ ] `usePermissions()` rileva permessi correttamente
- [ ] `<Can>` mostra/nasconde contenuto
- [ ] `<ProtectedRoute>` reindirizza se no permesso
- [ ] Toast 403 appare su errore
- [ ] Bulk actions selezionano multipli
- [ ] Filtri utenti funzionano
- [ ] Ricerca utenti funziona
- [ ] Form validazione ruoli
- [ ] Permission grouping UI

---

### Performance Considerations

**Cache Permissions:**
```php
// Spatie già cachea automaticamente
// Clear cache quando modifichi ruoli/permessi
app()[PermissionRegistrar::class]->forgetCachedPermissions();
```

**Eager Loading:**
```php
// Evita N+1 queries
$users = User::with('roles.permissions')->get();
$roles = Role::with('permissions')->get();
```

**Frontend Caching:**
```typescript
// React Query cache (5 minuti default)
export function usePermissions() {
  return useQuery({
    queryKey: ['permissions'],
    queryFn: permissionsApi.getGrouped,
    staleTime: 5 * 60 * 1000, // 5 min
    cacheTime: 10 * 60 * 1000 // 10 min
  });
}
```

---

### Security Best Practices

1. **Validate Permission Names**
   ```php
   Rule::exists('permissions', 'name')
   ```

2. **Never Trust Client Permissions**
   - Always check server-side
   - Frontend checks are UX, not security

3. **Log Sensitive Changes**
   - All role/permission modifications
   - Include IP, user-agent, timestamp

4. **Rate Limit Management Endpoints**
   - Max 10 role creations/hour
   - Max 100 permission assignments/hour

5. **CSRF Protection**
   - Already enabled via Sanctum
   - Ensure cookie `XSRF-TOKEN` sent

6. **Validate Role/Permission Existence**
   - Check exists before assign
   - Handle not found gracefully

7. **Prevent Privilege Escalation**
   - User cannot give permissions they don't have
   - Non-admin cannot create admin

---

## Changelog

### v1.0.0 - 2026-01-28
- Initial documentation
- Comprehensive analysis of current state
- 5 implementation phases planned
- 10 future ideas proposed

---

## Contributors

- Davide Donghi (DGGM ERP)
- Claude (Anthropic)

---

**Fine del documento**
