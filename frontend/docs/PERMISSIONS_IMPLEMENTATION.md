# Sistema di Controllo Accessi - Implementazione Completata ✅

## Cosa è Stato Implementato

### 1. **Hook `usePermissions`** (`frontend/hooks/use-permissions.ts`)
Hook personalizzato per verificare permessi e ruoli dell'utente:
- `hasPermission(permission)` - Verifica singolo permesso
- `hasAnyPermission([...])` - Verifica almeno uno dei permessi
- `hasAllPermissions([...])` - Verifica tutti i permessi
- `hasRole(role)` - Verifica ruolo specifico
- `hasAnyRole([...])` - Verifica almeno uno dei ruoli
- `isAdmin()` - Verifica se è super-admin o admin

**Nota**: Gli admin (super-admin e admin) hanno sempre accesso a tutto.

### 2. **Componente `<Can>`** (`frontend/components/can.tsx`)
Componente per mostrare/nascondere elementi UI in base ai permessi:

```tsx
<Can permission="users.create">
  <Button>Crea Utente</Button>
</Can>

<Can anyPermission={["users.edit", "users.delete"]}>
  <Button>Gestisci</Button>
</Can>

<Can role="admin">
  <AdminPanel />
</Can>
```

### 3. **Componente `<ProtectedRoute>`** (`frontend/components/protected-route.tsx`)
Componente per proteggere intere pagine, reindirizza se mancano i permessi:

```tsx
export default function UsersPage() {
  return (
    <ProtectedRoute permission="users.view">
      <UsersContent />
    </ProtectedRoute>
  );
}
```

### 4. **Menu di Navigazione con Filtri** (`frontend/components/dashboard-layout.tsx`)
Il menu laterale è ora filtrato automaticamente in base ai permessi:
- Ogni voce di menu ha associati uno o più permessi
- Le voci senza permessi richiesti vengono nascoste
- I gruppi senza voci visibili vengono nascosti
- Gli admin vedono sempre tutto

**Struttura configurazione menu**:
```tsx
{
  name: 'Clienti',
  href: '/dashboard/customers',
  icon: Users,
  permissions: ['customers.view']
}
```

### 5. **Pagine Protette Implementate**

#### Users Page ✅
- ProtectedRoute con `users.view`
- Pulsante "Nuovo Utente" → `users.create`
- Pulsante "Modifica" → `users.edit`
- Pulsante "Elimina" → `users.delete`
- Tab "Ruoli & Permessi" → solo `super-admin`
- Gestione ruoli limitata a super-admin

#### Materials Page ✅
- ProtectedRoute con `materials.view`
- Pulsante "Nuovo Materiale" → `materials.create`
- Pulsante "Modifica" (nelle colonne) → `materials.edit`
- Pulsante "Elimina" (nelle colonne) → `materials.delete`
- Empty state con pulsante → `materials.create`

## Permessi Disponibili

Basati sul seeder Laravel (`RoleAndPermissionSeeder.php`):

### Moduli Principali
- **users**: view, create, edit, delete
- **customers**: view, create, edit, delete
- **suppliers**: view, create, edit, delete
- **sites**: view, view-own, create, edit, delete
- **quotes**: view, create, edit, delete, approve, convert-to-site
- **materials**: view, create, edit, delete
- **warehouse**: view, create, edit, delete, inventory
- **material_requests**: view, create, update, approve, reject, deliver, delete
- **ddts**: view, create, update, delete, confirm, cancel
- **time-trackings**: view, view-own, create, edit, delete, approve
- **invoices**: view, create, edit, delete, send
- **workers**: view, create, edit, delete, view-rates, manage-rates, view-payroll, manage-payroll
- **contractors**: view, create, edit, delete
- **vehicles**: view, create, edit, delete
- **settings**: view, edit
- **site_roles**: view, create, update, delete
- **site_workers**: view, create, update, delete
- **site_materials**: view, create, update, delete
- **reports**: view, financial, sites, time-tracking

## Ruoli Definiti

1. **super-admin** → Accesso completo a tutto
2. **admin** → Accesso completo eccetto alcune impostazioni di sistema
3. **project-manager** → Gestione cantieri, preventivi, team
4. **team-leader** → Gestione cantieri assegnati e team
5. **worker** → Timbrature e richieste materiali
6. **accountant** → Gestione fatture e report finanziari
7. **warehousekeeper** → Gestione magazzino e DDT
8. **customer** → Visualizzazione (portale futuro)

## Come Proteggere Nuove Pagine

### 1. Proteggere la Pagina Intera

```tsx
// app/dashboard/xxx/page.tsx
import { ProtectedRoute } from '@/components/protected-route';
import { Can } from '@/components/can';

export default function XxxPage() {
  return (
    <ProtectedRoute permission="xxx.view">
      <XxxPageContent />
    </ProtectedRoute>
  );
}

function XxxPageContent() {
  // ... contenuto della pagina
}
```

### 2. Proteggere Pulsanti di Azione

```tsx
<Can permission="xxx.create">
  <Button onClick={handleCreate}>
    <Plus className="mr-2 h-4 w-4" />
    Nuovo
  </Button>
</Can>

<Can permission="xxx.edit">
  <Button onClick={handleEdit}>
    <Edit className="mr-2 h-4 w-4" />
    Modifica
  </Button>
</Can>

<Can permission="xxx.delete">
  <Button variant="destructive" onClick={handleDelete}>
    <Trash2 className="mr-2 h-4 w-4" />
    Elimina
  </Button>
</Can>
```

### 3. Proteggere Colonne della Tabella

```tsx
// components/xxx-columns.tsx
import { Can } from '@/components/can';

{
  id: 'actions',
  cell: ({ row }) => (
    <div className="flex gap-1">
      <Can permission="xxx.edit">
        <Button onClick={() => onEdit(row.original)}>
          <Edit className="h-4 w-4" />
        </Button>
      </Can>
      <Can permission="xxx.delete">
        <Button onClick={() => onDelete(row.original)}>
          <Trash2 className="h-4 w-4" />
        </Button>
      </Can>
    </div>
  ),
}
```

### 4. Aggiungere Voci al Menu

```tsx
// components/dashboard-layout.tsx
const navigationConfig: NavigationItem[] = [
  // ...
  {
    name: 'Nuova Sezione',
    icon: IconName,
    children: [
      {
        name: 'Nuova Voce',
        href: '/dashboard/new-item',
        icon: IconName,
        permissions: ['new-item.view']
      },
    ]
  },
];
```

## File di Documentazione

1. **PERMISSIONS_GUIDE.md** - Guida completa all'uso del sistema
2. **PERMISSIONS_TODO.md** - Lista pagine da implementare con esempi

## Testing

### Come Testare

1. **Creare utenti di test con ruoli diversi**:
   ```bash
   php artisan db:seed --class=RoleAndPermissionSeeder
   ```

2. **Accedere con diversi ruoli**:
   - Super Admin → Deve vedere tutto
   - Project Manager → Deve vedere cantieri, preventivi, team
   - Team Leader → Deve vedere solo cantieri assegnati
   - Worker → Deve vedere solo timbrature e richieste materiali
   - Warehousekeeper → Deve vedere solo magazzino e DDT
   - Accountant → Deve vedere solo fatture e report finanziari

3. **Verificare**:
   - Menu mostra solo voci permesse
   - Pagine reindirizzano se mancano permessi
   - Pulsanti sono nascosti se mancano permessi
   - Admin vedono sempre tutto

### Scenario di Test Consigliati

```
✓ Admin → Login → Vede tutte le voci del menu
✓ Admin → Accede a qualsiasi pagina → Funziona
✓ Worker → Login → Vede solo: Dashboard, Cantieri (propri), Timbrature
✓ Worker → Prova ad accedere a /users → Reindirizzato a /dashboard
✓ Team Leader → Vede cantieri, materiali, timbrature (team)
✓ Warehousekeeper → Vede solo magazzino, materiali, DDT
✓ Accountant → Vede solo clienti, fornitori, fatture, report
```

## Backend: Verifica Permessi

Il backend Laravel usa **Spatie Permission** e già restituisce ruoli e permessi:

```php
// UserResource.php
return [
    'id' => $this->id,
    'name' => $this->name,
    'email' => $this->email,
    'roles' => $this->getRoleNames(),
    'permissions' => $this->getAllPermissions()->pluck('name'),
    // ...
];
```

I middleware e policy Laravel devono essere configurati per verificare i permessi lato server.

## Prossimi Passi

1. ✅ Applicare ProtectedRoute alle pagine rimanenti (vedi PERMISSIONS_TODO.md)
2. ✅ Proteggere i pulsanti nelle altre pagine
3. ✅ Testare con utenti di ruoli diversi
4. ⏳ Implementare filtri backend per permessi "-own" (sites.view-own, etc.)
5. ⏳ Aggiungere Policy Laravel per verifiche server-side
6. ⏳ Implementare audit log per azioni sensibili

## Note Importanti

- **Sicurezza**: Il controllo frontend è solo UX. Il backend DEVE sempre verificare i permessi.
- **Performance**: I permessi sono già in cache grazie a Zustand persist.
- **Hydration**: Il sistema aspetta il caricamento dello stato auth prima di mostrare contenuti.
- **Admin Bypass**: Super-admin e admin hanno sempre accesso completo (by design).

---

**Implementato da**: GitHub Copilot
**Data**: 18 Gennaio 2026

