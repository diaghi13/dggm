# Componenti Loading - DGGM ERP

Guida completa ai componenti di loading dell'applicazione.

## 📦 Componenti Disponibili

### 1. LoadingScreen (Full Screen)

Schermo di caricamento a schermo intero con logo animato DGGM ERP.

**Quando usarlo:**
- ✅ Verifica autenticazione al caricamento dell'app
- ✅ Caricamento iniziale dei dati essenziali
- ✅ Processi lunghi che bloccano l'intera UI
- ✅ Redirect tra pagine importanti
- ✅ Hydration dello store

**Esempio:**
```tsx
import { LoadingScreen } from '@/components/loading-screen';

export function MyComponent() {
  const [isInitializing, setIsInitializing] = useState(true);

  if (isInitializing) {
    return <LoadingScreen message="Inizializzazione..." />;
  }

  return <div>Contenuto</div>;
}
```

**Props:**
- `message?: string` - Messaggio da mostrare (default: "Caricamento...")
- `className?: string` - Classi CSS aggiuntive

---

### 2. LoadingInline (Inline)

Indicatore di caricamento per aree specifiche della pagina.

**Quando usarlo:**
- ✅ Caricamento dati in una sezione specifica
- ✅ Refresh di tabelle o liste
- ✅ Caricamento dettagli in una card
- ✅ Aggiornamento di grafici o statistiche
- ✅ Skeleton screens

**Esempio:**
```tsx
import { LoadingInline } from '@/components/loading-screen';

export function DataCard() {
  const { data, isLoading } = useQuery('data');

  return (
    <Card>
      <CardContent>
        {isLoading ? (
          <LoadingInline message="Caricamento dati..." />
        ) : (
          <DataDisplay data={data} />
        )}
      </CardContent>
    </Card>
  );
}
```

**Props:**
- `message?: string` - Messaggio da mostrare (default: "Caricamento...")
- `className?: string` - Classi CSS aggiuntive

---

### 3. LoadingSpinner (Generic)

Spinner generico per uso flessibile.

**Quando usarlo:**
- ✅ All'interno di bottoni durante azioni
- ✅ Accanto a testi informativi
- ✅ In piccole aree della UI
- ✅ Indicatori di stato inline
- ✅ Custom loading states

**Esempio:**
```tsx
import { LoadingSpinner } from '@/components/loading-screen';

export function ActionButton() {
  const [isSubmitting, setIsSubmitting] = useState(false);

  return (
    <Button disabled={isSubmitting}>
      {isSubmitting && <LoadingSpinner className="w-4 h-4 mr-2" />}
      {isSubmitting ? 'Salvataggio...' : 'Salva'}
    </Button>
  );
}
```

**Props:**
- `className?: string` - Classi CSS per dimensione e colore

---

## 🎨 Stile e Animazioni

### Colori
I componenti si adattano automaticamente al tema (light/dark):
- **Light Mode**: Slate 900 (scuro)
- **Dark Mode**: Slate 100 (chiaro)

### Animazioni

1. **Spinner rotante**
   - Rotazione continua 360° in 1 secondo
   - Smooth e fluida

2. **Barra di progresso**
   - Animazione da -100% a 100% in 1.5 secondi
   - Loop infinito con ease-in-out

### Personalizzazione CSS

Le animazioni sono definite in `app/globals.css`:

```css
@keyframes progress {
  0% {
    transform: translateX(-100%);
  }
  50% {
    transform: translateX(0%);
  }
  100% {
    transform: translateX(100%);
  }
}

.animate-progress {
  animation: progress 1.5s ease-in-out infinite;
}
```

---

## 🛠️ Hooks Personalizzati

### useLoading

Hook per gestire stati di loading con callback automatici.

**Esempio:**
```tsx
import { useLoading } from '@/hooks/use-loading';

export function UserForm() {
  const { isLoading, error, execute } = useLoading();

  const handleSubmit = async (data: UserData) => {
    const result = await execute(async () => {
      return await api.createUser(data);
    });

    if (result) {
      toast.success('Utente creato!');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* form fields */}
      <Button type="submit" disabled={isLoading}>
        {isLoading && <LoadingSpinner className="w-4 h-4 mr-2" />}
        {isLoading ? 'Creazione...' : 'Crea Utente'}
      </Button>
      {error && <p className="text-red-500">{error.message}</p>}
    </form>
  );
}
```

**API:**
- `isLoading: boolean` - Stato di caricamento
- `error: Error | null` - Eventuale errore
- `execute: (callback) => Promise<T | null>` - Esegue callback con gestione loading/error
- `reset: () => void` - Reset dello stato

---

### useMultiLoading

Hook per gestire multipli stati di loading simultanei.

**Esempio:**
```tsx
import { useMultiLoading } from '@/hooks/use-loading';

export function Dashboard() {
  const { setLoading, isLoading } = useMultiLoading();

  const loadUsers = async () => {
    setLoading('users', true);
    await api.getUsers();
    setLoading('users', false);
  };

  const loadProducts = async () => {
    setLoading('products', true);
    await api.getProducts();
    setLoading('products', false);
  };

  return (
    <div>
      <section>
        {isLoading('users') ? (
          <LoadingInline message="Caricamento utenti..." />
        ) : (
          <UsersList />
        )}
      </section>
      
      <section>
        {isLoading('products') ? (
          <LoadingInline message="Caricamento prodotti..." />
        ) : (
          <ProductsList />
        )}
      </section>
      
      {/* Check if ANY loading is active */}
      {isLoading() && <GlobalLoadingIndicator />}
    </div>
  );
}
```

**API:**
- `setLoading: (key, value) => void` - Imposta stato di loading per una chiave
- `isLoading: (key?) => boolean` - Verifica stato (specifica chiave o globale)
- `reset: () => void` - Reset di tutti gli stati
- `loadingStates: Record<string, boolean>` - Tutti gli stati correnti

---

## 📋 Best Practices

### 1. Scegli il componente giusto

```tsx
// ❌ NON FARE - LoadingScreen per piccole aree
<Card>
  <LoadingScreen message="Caricamento..." />
</Card>

// ✅ FARE - LoadingInline per aree contenute
<Card>
  <LoadingInline message="Caricamento..." />
</Card>
```

### 2. Messaggi descrittivi

```tsx
// ❌ NON FARE - Messaggi generici
<LoadingScreen message="Loading..." />

// ✅ FARE - Messaggi specifici
<LoadingScreen message="Verifica autenticazione..." />
<LoadingInline message="Caricamento clienti..." />
```

### 3. Gestione errori

```tsx
// ❌ NON FARE - Ignora errori
const { isLoading, execute } = useLoading();
await execute(() => api.createUser(data));

// ✅ FARE - Gestisci errori
const { isLoading, error, execute } = useLoading();
const result = await execute(() => api.createUser(data));

if (!result) {
  toast.error(error?.message || 'Errore durante la creazione');
}
```

### 4. Accessibilità

```tsx
// ✅ Aggiungi aria-labels per screen readers
<Button disabled={isLoading} aria-busy={isLoading}>
  {isLoading && <LoadingSpinner className="w-4 h-4 mr-2" />}
  {isLoading ? 'Caricamento...' : 'Carica Dati'}
</Button>
```

### 5. Performance

```tsx
// ✅ Usa LoadingInline per sezioni indipendenti
<div className="grid grid-cols-2 gap-4">
  <Card>
    {isLoadingUsers ? (
      <LoadingInline message="Caricamento utenti..." />
    ) : (
      <UsersList />
    )}
  </Card>
  
  <Card>
    {isLoadingProducts ? (
      <LoadingInline message="Caricamento prodotti..." />
    ) : (
      <ProductsList />
    )}
  </Card>
</div>
```

---

## 🎯 Casi d'Uso Reali

### Autenticazione (Dashboard Layout)

```tsx
export function DashboardLayout({ children }) {
  const { hasHydrated, isAuthenticated, user } = useAuthStore();

  // Mostra loading durante hydration dello store
  if (!hasHydrated) {
    return <LoadingScreen message="Verifica autenticazione..." />;
  }

  // Mostra loading durante redirect
  if (!isAuthenticated || !user) {
    return <LoadingScreen message="Reindirizzamento..." />;
  }

  return <div>{children}</div>;
}
```

### Caricamento Dati in Tabella

```tsx
export function CustomersTable() {
  const { data, isLoading, refetch } = useQuery('customers');
  const { execute, isLoading: isRefreshing } = useLoading();

  const handleRefresh = () => {
    execute(() => refetch());
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between">
          <CardTitle>Clienti</CardTitle>
          <Button onClick={handleRefresh} disabled={isRefreshing}>
            {isRefreshing && <LoadingSpinner className="w-4 h-4 mr-2" />}
            Aggiorna
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <LoadingInline message="Caricamento clienti..." />
        ) : (
          <DataTable data={data} />
        )}
      </CardContent>
    </Card>
  );
}
```

### Form Submission

```tsx
export function CustomerForm() {
  const { isLoading, error, execute } = useLoading();
  const { mutate } = useMutation();

  const handleSubmit = async (data: CustomerData) => {
    const result = await execute(async () => {
      return await mutate(data);
    });

    if (result) {
      toast.success('Cliente creato con successo!');
      router.push('/dashboard/customers');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* form fields */}
      
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error.message}</AlertDescription>
        </Alert>
      )}

      <div className="flex gap-2">
        <Button type="submit" disabled={isLoading}>
          {isLoading && <LoadingSpinner className="w-4 h-4 mr-2" />}
          {isLoading ? 'Salvataggio...' : 'Salva Cliente'}
        </Button>
        <Button type="button" variant="outline">
          Annulla
        </Button>
      </div>
    </form>
  );
}
```

---

## 🧪 Testing

Per testare i componenti di loading:

```tsx
import { render, screen } from '@testing-library/react';
import { LoadingScreen, LoadingInline, LoadingSpinner } from '@/components/loading-screen';

describe('Loading Components', () => {
  it('renders LoadingScreen with custom message', () => {
    render(<LoadingScreen message="Test loading" />);
    expect(screen.getByText('Test loading')).toBeInTheDocument();
  });

  it('renders LoadingInline', () => {
    render(<LoadingInline message="Loading data" />);
    expect(screen.getByText('Loading data')).toBeInTheDocument();
  });

  it('renders LoadingSpinner', () => {
    const { container } = render(<LoadingSpinner />);
    expect(container.querySelector('.animate-spin')).toBeInTheDocument();
  });
});
```

---

## 📚 Riferimenti

- **Componenti**: `frontend/components/loading-screen.tsx`
- **Hooks**: `frontend/hooks/use-loading.ts`
- **Stili**: `frontend/app/globals.css`
- **Esempio**: `frontend/app/dashboard/loading-example/page.tsx`

---

## 🎉 Conclusione

I componenti di loading sono progettati per:
- ✅ Essere coerenti con il design system
- ✅ Supportare light/dark mode automaticamente
- ✅ Essere accessibili (ARIA labels, semantic HTML)
- ✅ Essere performanti (CSS animations, no JS)
- ✅ Essere riutilizzabili in tutta l'app
- ✅ Migliorare la UX durante attese

Per domande o suggerimenti, consulta la pagina di esempio: `/dashboard/loading-example`

