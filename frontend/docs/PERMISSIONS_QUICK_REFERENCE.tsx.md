// ESEMPIO RAPIDO: Come proteggere una pagina esistente
// =====================================================

// PRIMA (senza protezioni):
// ============================================
export default function CustomersPage() {
  const router = useRouter();
  const [customers, setCustomers] = useState([]);

  return (
    <div>
      <h1>Clienti</h1>
      <Button onClick={handleCreate}>Nuovo Cliente</Button>
      <Table>
        {/* ... */}
        <Button onClick={handleEdit}>Modifica</Button>
        <Button onClick={handleDelete}>Elimina</Button>
      </Table>
    </div>
  );
}

// DOPO (con protezioni):
// ============================================
import { ProtectedRoute } from '@/components/features/auth/protected-route';
import { Can } from '@/components/features/auth/can';

export default function CustomersPage() {
  return (
    <ProtectedRoute permission="customers.view">
      <CustomersPageContent />
    </ProtectedRoute>
  );
}

function CustomersPageContent() {
  const router = useRouter();
  const [customers, setCustomers] = useState([]);

  return (
    <div>
      <h1>Clienti</h1>

      <Can permission="customers.create">
        <Button onClick={handleCreate}>Nuovo Cliente</Button>
      </Can>

      <Table>
        {/* ... */}
        <Can permission="customers.edit">
          <Button onClick={handleEdit}>Modifica</Button>
        </Can>

        <Can permission="customers.delete">
          <Button onClick={handleDelete}>Elimina</Button>
        </Can>
      </Table>
    </div>
  );
}

// ESEMPIO CON FORM DI DETTAGLIO
// ============================================
export default function CustomerDetailPage() {
  return (
    <ProtectedRoute permission="customers.view">
      <CustomerDetailContent />
    </ProtectedRoute>
  );
}

function CustomerDetailContent() {
  const { id } = useParams();
  const isNew = id === 'new';

  return (
    <Form>
      <FormField name="name" />
      <FormField name="email" />

      <Can anyPermission={["customers.create", "customers.edit"]}>
        <Button type="submit">
          {isNew ? 'Crea' : 'Salva'}
        </Button>
      </Can>

      {!isNew && (
        <Can permission="customers.delete">
          <Button variant="destructive" onClick={handleDelete}>
            Elimina
          </Button>
        </Can>
      )}
    </Form>
  );
}

// ESEMPIO CON COLONNE TABELLA
// ============================================
// In components/customers-columns.tsx

import { Can } from '@/components/features/auth/can';

export const createCustomersColumns = (onEdit, onDelete) => [
  // ... altre colonne
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
  },
];

// ESEMPIO CON PERMESSI MULTIPLI
// ============================================
export default function WarehousePage() {
  return (
    // User needs warehouse.view OR warehouse.inventory
    <ProtectedRoute anyPermission={["warehouse.view", "warehouse.inventory"]}>
      <WarehousePageContent />
    </ProtectedRoute>
  );
}

function WarehousePageContent() {
  return (
    <div>
      <Can permission="warehouse.view">
        <WarehouseList />
      </Can>

      <Can permission="warehouse.inventory">
        <InventoryManagement />
      </Can>

      <Can permission="warehouse.create">
        <Button>Nuovo Magazzino</Button>
      </Can>
    </div>
  );
}

// ESEMPIO CON RUOLI
// ============================================
export default function AdminSettingsPage() {
  return (
    <ProtectedRoute role="super-admin">
      <AdminSettingsContent />
    </ProtectedRoute>
  );
}

// ESEMPIO CON FALLBACK
// ============================================
function ActionButtons({ item }) {
  return (
    <div className="flex gap-2">
      <Can
        permission="items.edit"
        fallback={
          <span className="text-sm text-muted-foreground">
            Sola lettura
          </span>
        }
      >
        <Button>Modifica</Button>
      </Can>
    </div>
  );
}

// ESEMPIO CON HOOK usePermissions
// ============================================
import { usePermissions } from '@/hooks/use-permissions';

function MyComponent() {
  const { hasPermission, hasAnyPermission, isAdmin } = usePermissions();

  // Logica condizionale
  const canManage = hasAnyPermission(['items.create', 'items.edit']);

  if (isAdmin()) {
    return <AdminView />;
  }

  return (
    <div>
      {hasPermission('items.view') && <ItemsList />}
      {canManage && <ManagementPanel />}
    </div>
  );
}

// CHECKLIST VELOCE
// ============================================
// Per ogni pagina:
// □ Importa ProtectedRoute e Can
// □ Wrap export default con ProtectedRoute
// □ Sposta contenuto in funzione separata (es: XxxPageContent)
// □ Wrap pulsante "Nuovo/Crea" con <Can permission="xxx.create">
// □ Wrap pulsante "Modifica" con <Can permission="xxx.edit">
// □ Wrap pulsante "Elimina" con <Can permission="xxx.delete">
// □ Se ha azioni speciali (approve, send, etc.) usa permessi specifici
// □ Testa con utente worker/team-leader per verificare

// PATTERN PER EMPTY STATE
// ============================================
<DataTable
  // ...
  emptyState={
    <div className="text-center py-12">
      <Icon className="mx-auto h-12 w-12 text-slate-300" />
      <h3>Nessun elemento</h3>
      <Can permission="xxx.create">
        <Button className="mt-4">Crea Primo Elemento</Button>
      </Can>
    </div>
  }
/>

