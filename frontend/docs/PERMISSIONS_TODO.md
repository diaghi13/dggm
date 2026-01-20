# Implementazione Permessi - Pagine da Aggiornare

## Pagine Già Implementate ✅

1. **Users Page** (`/users/page.tsx`)
   - ✅ ProtectedRoute con `users.view`
   - ✅ Pulsante "Nuovo Utente" con `users.create`
   - ✅ Pulsante Edit con `users.edit`
   - ✅ Pulsante Delete con `users.delete`
   - ✅ Tab Ruoli limitata a `super-admin`

2. **Materials Page** (`/materials/page.tsx`)
   - ✅ ProtectedRoute con `materials.view`
   - ✅ Pulsante "Nuovo Materiale" con `materials.create`

## Pagine da Implementare

### 1. Customers (`/dashboard/customers/page.tsx`)

```tsx
import { ProtectedRoute } from '@/components/protected-route';
import { Can } from '@/components/can';

export default function CustomersPage() {
  return (
    <ProtectedRoute permission="customers.view">
      <CustomersPageContent />
    </ProtectedRoute>
  );
}

// Nel contenuto:
<Can permission="customers.create">
  <Button onClick={handleCreate}>Nuovo Cliente</Button>
</Can>

<Can permission="customers.edit">
  <Button onClick={handleEdit}>Modifica</Button>
</Can>

<Can permission="customers.delete">
  <Button onClick={handleDelete}>Elimina</Button>
</Can>
```

### 2. Suppliers (`/dashboard/suppliers/page.tsx`)

```tsx
<ProtectedRoute permission="suppliers.view">
  <SuppliersPageContent />
</ProtectedRoute>

// Pulsanti:
<Can permission="suppliers.create">...</Can>
<Can permission="suppliers.edit">...</Can>
<Can permission="suppliers.delete">...</Can>
```

### 3. Sites (`/dashboard/sites/page.tsx`)

```tsx
<ProtectedRoute anyPermission={["sites.view", "sites.view-own"]}>
  <SitesPageContent />
</ProtectedRoute>

// Pulsanti:
<Can permission="sites.create">...</Can>
<Can permission="sites.edit">...</Can>
<Can permission="sites.delete">...</Can>
```

### 4. Quotes (`/quotes/page.tsx`)

```tsx
<ProtectedRoute permission="quotes.view">
  <QuotesPageContent />
</ProtectedRoute>

// Pulsanti:
<Can permission="quotes.create">...</Can>
<Can permission="quotes.edit">...</Can>
<Can permission="quotes.delete">...</Can>
<Can permission="quotes.approve">
  <Button>Approva</Button>
</Can>
<Can permission="quotes.convert-to-site">
  <Button>Converti in Cantiere</Button>
</Can>
```

### 5. Warehouses (`/warehouses/page.tsx`)

```tsx
<ProtectedRoute permission="warehouse.view">
  <WarehousesPageContent />
</ProtectedRoute>

// Pulsanti:
<Can permission="warehouse.create">...</Can>
<Can permission="warehouse.edit">...</Can>
<Can permission="warehouse.delete">...</Can>
```

### 6. Workers (`/dashboard/workers/page.tsx`)

```tsx
<ProtectedRoute permission="workers.view">
  <WorkersPageContent />
</ProtectedRoute>

// Pulsanti:
<Can permission="workers.create">...</Can>
<Can permission="workers.edit">...</Can>
<Can permission="workers.delete">...</Can>

// Campi sensibili:
<Can permission="workers.view-rates">
  <div>Tariffa: €{worker.hourly_rate}</div>
</Can>

<Can permission="workers.manage-rates">
  <Input name="hourly_rate" />
</Can>
```

### 7. DDTs (`/dashboard/ddts/page.tsx`)

```tsx
<ProtectedRoute permission="ddts.view">
  <DDTsPageContent />
</ProtectedRoute>

// Pulsanti:
<Can permission="ddts.create">...</Can>
<Can permission="ddts.update">...</Can>
<Can permission="ddts.delete">...</Can>
<Can permission="ddts.confirm">
  <Button>Conferma DDT</Button>
</Can>
<Can permission="ddts.cancel">
  <Button>Annulla DDT</Button>
</Can>
```

### 8. Invoices (`/dashboard/invoices/page.tsx`)

```tsx
<ProtectedRoute permission="invoices.view">
  <InvoicesPageContent />
</ProtectedRoute>

// Pulsanti:
<Can permission="invoices.create">...</Can>
<Can permission="invoices.edit">...</Can>
<Can permission="invoices.delete">...</Can>
<Can permission="invoices.send">
  <Button>Invia Fattura</Button>
</Can>
```

### 9. Settings (`/settings/page.tsx`)

```tsx
<ProtectedRoute anyPermission={["settings.view", "settings.edit"]}>
  <SettingsPageContent />
</ProtectedRoute>

// Campi di modifica:
<Can permission="settings.edit">
  <Input name="company_name" />
  <Button type="submit">Salva</Button>
</Can>
```

### 10. Site Roles (`/settings/site-roles/page.tsx`)

```tsx
<ProtectedRoute permission="site_roles.view">
  <SiteRolesPageContent />
</ProtectedRoute>

<Can permission="site_roles.create">...</Can>
<Can permission="site_roles.update">...</Can>
<Can permission="site_roles.delete">...</Can>
```

## Pattern per i Column Definitions

Per le tabelle con colonne di azioni, proteggi i pulsanti nel file delle colonne:

```tsx
// components/customers-columns.tsx (esempio)
import { Can } from '@/components/can';

{
  id: 'actions',
  cell: ({ row }) => (
    <div className="flex gap-1">
      <Can permission="customers.edit">
        <Button onClick={() => onEdit(row.original)}>
          <Edit className="h-4 w-4" />
        </Button>
      </Can>
      <Can permission="customers.delete">
        <Button onClick={() => onDelete(row.original)}>
          <Trash2 className="h-4 w-4" />
        </Button>
      </Can>
    </div>
  ),
}
```

## Pattern per Form di Dettaglio

Nelle pagine di dettaglio (`/dashboard/xxx/[id]/page.tsx`):

```tsx
export default function CustomerDetailPage() {
  return (
    <ProtectedRoute permission="customers.view">
      <CustomerDetailContent />
    </ProtectedRoute>
  );
}

// Nel form:
<Can anyPermission={["customers.create", "customers.edit"]}>
  <Button type="submit">Salva</Button>
</Can>

<Can permission="customers.delete">
  <Button variant="destructive" onClick={handleDelete}>
    Elimina
  </Button>
</Can>
```

## Dashboard Page (`/dashboard/page.tsx`)

La dashboard è visibile a tutti gli utenti autenticati, ma mostra widget diversi:

```tsx
// Dashboard principale - tutti possono vederla
export default function DashboardPage() {
  return <DashboardContent />;
}

// Widget condizionali:
<Can anyPermission={["sites.view", "sites.view-own"]}>
  <SitesOverviewWidget />
</Can>

<Can permission="quotes.view">
  <QuotesOverviewWidget />
</Can>

<Can permission="warehouse.view">
  <WarehouseOverviewWidget />
</Can>

<Can anyPermission={["time-trackings.view", "time-trackings.view-own"]}>
  <TimeTrackingWidget />
</Can>

<Can permission="reports.financial">
  <FinancialSummaryWidget />
</Can>
```

## Note Importanti

1. **Worker vs Workers**: Fai attenzione alla distinzione:
   - `workers.*` = permessi per gestire collaboratori (admin/PM)
   - L'utente worker avrà accesso limitato tramite permessi specifici

2. **Own Permissions**: I permessi che finiscono con `-own` richiedono filtri backend:
   - `sites.view-own`: l'utente vede solo i cantieri assegnati
   - `time-trackings.view-own`: l'utente vede solo le proprie timbrature

3. **Contractors vs Workers**: 
   - `workers.*` = collaboratori interni
   - `contractors.*` = ditte esterne

4. **Admin Bypass**: Ricorda che super-admin e admin vedono tutto automaticamente.

## Checklist Implementazione

Per ogni pagina:

- [ ] Wrap con `<ProtectedRoute>`
- [ ] Pulsante "Nuovo/Crea" con `Can permission="xxx.create"`
- [ ] Pulsante "Modifica" con `Can permission="xxx.edit"`
- [ ] Pulsante "Elimina" con `Can permission="xxx.delete"`
- [ ] Azioni speciali (approve, send, etc.) con permessi specifici
- [ ] Campi sensibili (tariffe, costi) nascosti se necessario
- [ ] Testare con utenti di ruoli diversi

