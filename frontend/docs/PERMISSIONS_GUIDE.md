# Sistema di Controllo Accessi basato su Ruoli e Permessi

Questo documento spiega come utilizzare il sistema di controllo accessi implementato nell'applicazione.

## Componenti Disponibili

### 1. Hook `usePermissions`

Hook per verificare permessi e ruoli dell'utente corrente.

```typescript
import { usePermissions } from '@/hooks/use-permissions';

function MyComponent() {
  const { 
    hasPermission, 
    hasAnyPermission, 
    hasAllPermissions,
    hasRole,
    hasAnyRole,
    isAdmin 
  } = usePermissions();

  // Verifica singolo permesso
  const canCreate = hasPermission('users.create');

  // Verifica se ha almeno uno dei permessi
  const canManage = hasAnyPermission(['users.create', 'users.edit']);

  // Verifica se ha tutti i permessi
  const canFullAccess = hasAllPermissions(['users.create', 'users.edit', 'users.delete']);

  // Verifica ruolo
  const isProjectManager = hasRole('project-manager');

  // Verifica se è admin (super-admin o admin)
  const admin = isAdmin();

  return <div>{canCreate && <Button>Crea Utente</Button>}</div>;
}
```

### 2. Componente `<Can>`

Componente per mostrare/nascondere parti dell'interfaccia in base ai permessi.

#### Esempi d'uso:

```tsx
import { Can } from '@/components/can';

// Mostra solo a utenti con permesso specifico
<Can permission="users.create">
  <Button>Crea Utente</Button>
</Can>

// Mostra a utenti con almeno uno dei permessi
<Can anyPermission={["users.create", "users.edit"]}>
  <Button>Gestisci Utenti</Button>
</Can>

// Mostra a utenti con tutti i permessi richiesti
<Can allPermissions={["users.create", "users.edit", "users.delete"]}>
  <Button>Accesso Completo</Button>
</Can>

// Mostra a utenti con ruolo specifico
<Can role="admin">
  <AdminPanel />
</Can>

// Mostra contenuto alternativo se non ha permesso
<Can 
  permission="users.delete" 
  fallback={<span className="text-muted-foreground">Non hai il permesso</span>}
>
  <Button variant="destructive">Elimina</Button>
</Can>
```

### 3. Componente `<ProtectedRoute>`

Componente per proteggere intere pagine. Reindirizza se l'utente non ha i permessi.

#### Uso nelle pagine:

```tsx
// app/users/page.tsx
import { ProtectedRoute } from '@/components/protected-route';

export default function UsersPage() {
  return (
    <ProtectedRoute permission="users.view">
      <UsersPageContent />
    </ProtectedRoute>
  );
}

// Con permessi multipli (almeno uno)
export default function MaterialsPage() {
  return (
    <ProtectedRoute anyPermission={["materials.view", "warehouse.view"]}>
      <MaterialsPageContent />
    </ProtectedRoute>
  );
}

// Con ruolo specifico
export default function AdminPage() {
  return (
    <ProtectedRoute role="admin" redirectTo="/dashboard">
      <AdminPanel />
    </ProtectedRoute>
  );
}
```

## Ruoli Disponibili

Basato sul seeder `RoleAndPermissionSeeder.php`:

1. **super-admin** - Accesso completo a tutto
2. **admin** - Accesso completo eccetto alcune impostazioni di sistema
3. **project-manager** - Gestione cantieri, preventivi, team
4. **team-leader** - Gestione cantieri assegnati e team
5. **worker** - Timbrature e richieste materiali
6. **accountant** - Gestione fatture e report finanziari
7. **warehousekeeper** - Gestione magazzino e DDT
8. **customer** - Visualizzazione preventivi e fatture (portale futuro)

## Permessi Principali

### Utenti
- `users.view` - Visualizzare utenti
- `users.create` - Creare utenti
- `users.edit` - Modificare utenti
- `users.delete` - Eliminare utenti

### Clienti
- `customers.view` - Visualizzare clienti
- `customers.create` - Creare clienti
- `customers.edit` - Modificare clienti
- `customers.delete` - Eliminare clienti

### Fornitori
- `suppliers.view` - Visualizzare fornitori
- `suppliers.create` - Creare fornitori
- `suppliers.edit` - Modificare fornitori
- `suppliers.delete` - Eliminare fornitori

### Cantieri
- `sites.view` - Visualizzare tutti i cantieri
- `sites.view-own` - Visualizzare solo cantieri assegnati
- `sites.create` - Creare cantieri
- `sites.edit` - Modificare cantieri
- `sites.delete` - Eliminare cantieri

### Preventivi
- `quotes.view` - Visualizzare preventivi
- `quotes.create` - Creare preventivi
- `quotes.edit` - Modificare preventivi
- `quotes.delete` - Eliminare preventivi
- `quotes.approve` - Approvare preventivi
- `quotes.convert-to-site` - Convertire preventivo in cantiere

### Magazzino
- `warehouse.view` - Visualizzare magazzini
- `warehouse.create` - Creare magazzini
- `warehouse.edit` - Modificare magazzini
- `warehouse.delete` - Eliminare magazzini
- `warehouse.inventory` - Gestire inventario

### Materiali
- `materials.view` - Visualizzare materiali
- `materials.create` - Creare materiali
- `materials.edit` - Modificare materiali
- `materials.delete` - Eliminare materiali

### Richieste Materiali
- `material_requests.view` - Visualizzare richieste
- `material_requests.create` - Creare richieste
- `material_requests.update` - Modificare richieste
- `material_requests.approve` - Approvare richieste
- `material_requests.reject` - Rifiutare richieste
- `material_requests.deliver` - Consegnare materiali

### DDT
- `ddts.view` - Visualizzare DDT
- `ddts.create` - Creare DDT
- `ddts.update` - Modificare DDT
- `ddts.delete` - Eliminare DDT
- `ddts.confirm` - Confermare DDT
- `ddts.cancel` - Annullare DDT

### Timbrature
- `time-trackings.view` - Visualizzare tutte le timbrature
- `time-trackings.view-own` - Visualizzare solo proprie timbrature
- `time-trackings.create` - Creare timbrature
- `time-trackings.edit` - Modificare timbrature
- `time-trackings.delete` - Eliminare timbrature
- `time-trackings.approve` - Approvare timbrature

### Fatture
- `invoices.view` - Visualizzare fatture
- `invoices.create` - Creare fatture
- `invoices.edit` - Modificare fatture
- `invoices.delete` - Eliminare fatture
- `invoices.send` - Inviare fatture

### Collaboratori
- `workers.view` - Visualizzare collaboratori
- `workers.create` - Creare collaboratori
- `workers.edit` - Modificare collaboratori
- `workers.delete` - Eliminare collaboratori
- `workers.view-rates` - Visualizzare tariffe
- `workers.manage-rates` - Gestire tariffe
- `workers.view-payroll` - Visualizzare buste paga
- `workers.manage-payroll` - Gestire buste paga

### Impostazioni
- `settings.view` - Visualizzare impostazioni
- `settings.edit` - Modificare impostazioni

## Menu di Navigazione

Il menu di navigazione è automaticamente filtrato in base ai permessi dell'utente.
Ogni voce di menu è associata a uno o più permessi. Se l'utente non ha nessuno dei permessi richiesti, la voce non viene mostrata.

**Nota**: Gli amministratori (super-admin e admin) vedono sempre tutte le voci del menu.

## Esempi Pratici

### Esempio 1: Pulsanti condizionali in una tabella

```tsx
<DataTable columns={columns} data={users}>
  {/* ... */}
  <Can permission="users.edit">
    <Button onClick={() => editUser(user)}>Modifica</Button>
  </Can>
  
  <Can permission="users.delete">
    <Button variant="destructive" onClick={() => deleteUser(user)}>
      Elimina
    </Button>
  </Can>
</DataTable>
```

### Esempio 2: Form con campi condizionali

```tsx
<Form>
  <FormField name="name" />
  <FormField name="email" />
  
  <Can permission="users.manage-rates">
    <FormField name="hourly_rate" label="Tariffa oraria" />
  </Can>
  
  <Can anyPermission={["users.create", "users.edit"]}>
    <Button type="submit">Salva</Button>
  </Can>
</Form>
```

### Esempio 3: Sezioni diverse per ruoli diversi

```tsx
<Can role="admin">
  <AdminDashboard />
</Can>

<Can role="project-manager">
  <ProjectManagerDashboard />
</Can>

<Can role="worker">
  <WorkerDashboard />
</Can>
```

### Esempio 4: Protezione di una pagina

```tsx
// app/settings/page.tsx
export default function SettingsPage() {
  return (
    <ProtectedRoute 
      anyPermission={["settings.view", "settings.edit"]}
      redirectTo="/dashboard"
    >
      <SettingsContent />
    </ProtectedRoute>
  );
}
```

## Note Importanti

1. **Admin vedono tutto**: Gli utenti con ruolo `super-admin` o `admin` hanno accesso a tutto, indipendentemente dai permessi specifici.

2. **Permessi "own"**: Alcuni permessi come `sites.view-own` o `time-trackings.view-own` indicano accesso limitato solo ai propri dati. La logica di filtraggio deve essere implementata nel backend.

3. **Controllo Backend**: Il controllo dei permessi nel frontend è solo per UX. Il backend deve sempre verificare i permessi prima di eseguire operazioni.

4. **Hydration**: I componenti aspettano che lo stato di autenticazione sia caricato prima di verificare i permessi.

## Testing

Per testare il sistema:

1. Crea utenti con ruoli diversi usando il seeder
2. Accedi con ciascun utente
3. Verifica che il menu mostri solo le voci permesse
4. Verifica che le pagine reindirizzino correttamente
5. Verifica che i pulsanti/sezioni condizionali funzionino

