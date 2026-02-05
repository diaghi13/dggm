# Sistema di Gestione Settings

## Panoramica

Il sistema di gestione settings è stato organizzato per fornire una gestione centralizzata e scalabile di tutte le configurazioni del sistema.

## Struttura

### File API

#### `/lib/api/settings.ts`

Contiene tutte le API per la gestione dei settings:

- **`settingsApi`**: API per settings generali del sistema
  - `getAll()`: Ottiene tutti i settings
  - `getByGroup(group)`: Ottiene settings per gruppo
  - `get(key)`: Ottiene un singolo setting
  - `update(key, value)`: Aggiorna un singolo setting
  - `bulkUpdate(settings)`: Aggiorna più settings in batch
  - `getGroups()`: Ottiene i gruppi disponibili

- **`companySettingsApi`**: API per settings azienda
  - `get()`: Ottiene i settings azienda
  - `update(data)`: Aggiorna i settings azienda

#### Gruppi Settings Predefiniti

```typescript
SETTING_GROUPS = {
  GENERAL: "Generali",
  COMPANY: "Azienda",
  NOTIFICATIONS: "Notifiche",
  INVENTORY: "Magazzino",
  QUOTES: "Preventivi",
  LABOR: "Manodopera",
  SECURITY: "Sicurezza",
  INTEGRATIONS: "Integrazioni",
};
```

### Pagine

#### `/app/(dashboard)/admin/settings/page.tsx`

Pagina principale di gestione settings admin con:

- **Tabs per gruppo**: Ogni gruppo ha la sua tab
- **Form dinamici**: I form si generano automaticamente in base al tipo di setting
- **Salvataggio bulk**: Salva tutte le modifiche di un gruppo insieme
- **Validazione**: Validazione automatica per tipo

#### `/app/(dashboard)/settings-index/page.tsx`

Pagina index con cards per accedere alle varie sezioni:

- Impostazioni Sistema (nuovo)
- Materiali
- Ruoli Cantiere
- Utenti
- Azienda

### Componenti

#### `/components/settings/setting-field.tsx`

Componenti riutilizzabili per settings:

- **`SettingField`**: Singolo campo setting con supporto per:
  - `string`: Input testo
  - `number`: Input numerico
  - `boolean`: Switch
  - `json`: Textarea con font mono
  - `select`: Select dropdown

- **`SettingsGrid`**: Griglia di settings con layout responsivo

## Utilizzo

### 1. Aggiungere un nuovo setting

Nel backend, aggiungi il setting alla tabella `settings`:

```sql
INSERT INTO settings (key, value, type, group, description, is_public)
VALUES ('app.name', 'DGGM', 'string', 'general', 'Nome applicazione', true);
```

Il setting apparirà automaticamente nella UI nel gruppo corrispondente.

### 2. Utilizzare un setting nel frontend

```typescript
import { settingsApi } from "@/lib/api/settings";

// In un componente React Query
const { data: settings } = useQuery({
  queryKey: ["settings", "all"],
  queryFn: settingsApi.getAll,
});

// Oppure per singolo gruppo
const { data: generalSettings } = useQuery({
  queryKey: ["settings", "general"],
  queryFn: () => settingsApi.getByGroup("general"),
});
```

### 3. Aggiornare settings

```typescript
import { settingsApi } from "@/lib/api/settings";
import { useMutation } from "@tanstack/react-query";

const updateMutation = useMutation({
  mutationFn: settingsApi.bulkUpdate,
  onSuccess: () => {
    toast.success("Settings salvati");
  },
});

// Aggiorna più settings
updateMutation.mutate([
  { key: "app.name", value: "Nuovo Nome" },
  { key: "app.debug", value: "true" },
]);
```

### 4. Utilizzare il componente SettingField

```typescript
import { SettingField, SettingsGrid } from '@/components/settings/setting-field';

// Singolo campo
<SettingField
  setting={{
    key: 'app.debug',
    value: 'false',
    type: 'boolean',
    description: 'Modalità debug',
  }}
  value={debugValue}
  onChange={(key, value) => handleChange(key, value)}
/>

// Griglia di settings
<SettingsGrid
  settings={settingsArray}
  values={currentValues}
  onChange={handleChange}
  columns={2}
/>
```

## Tipi di Settings

### String

```typescript
{
  key: 'app.name',
  value: 'DGGM',
  type: 'string',
  description: 'Nome applicazione'
}
```

### Number

```typescript
{
  key: 'inventory.low_stock_threshold',
  value: '10',
  type: 'number',
  description: 'Soglia scorte minime'
}
```

### Boolean

```typescript
{
  key: 'app.maintenance_mode',
  value: 'false',
  type: 'boolean',
  description: 'Modalità manutenzione'
}
```

### JSON

```typescript
{
  key: 'email.smtp_config',
  value: '{"host":"smtp.example.com","port":587}',
  type: 'json',
  description: 'Configurazione SMTP'
}
```

### Select

```typescript
{
  key: 'app.theme',
  value: 'light',
  type: 'select',
  description: 'Tema predefinito',
  options: [
    { label: 'Chiaro', value: 'light' },
    { label: 'Scuro', value: 'dark' },
    { label: 'Sistema', value: 'system' },
  ]
}
```

## Permessi

L'accesso alle pagine di settings è controllato dal sistema di permessi:

- `/admin/settings`: Richiede permesso `settings.manage`
- `/settings`: Gestione materiali e utenti (permessi specifici)
- `/settings-index`: Dashboard generale settings

## Best Practices

1. **Organizza per gruppo**: Usa gruppi logici per settings correlati
2. **Descrizioni chiare**: Ogni setting dovrebbe avere una descrizione comprensibile
3. **Validazione**: Implementa validazione lato backend per valori critici
4. **Cache**: I settings sono cached con React Query, invalida dopo modifiche
5. **Tipi corretti**: Usa il tipo appropriato per ogni setting
6. **is_public**: Marca come public solo settings sicuri da esporre al frontend

## Migrazione da vecchia struttura

Se hai settings hardcoded, puoi migrarli:

```typescript
// Prima
const APP_NAME = "DGGM";

// Dopo
const { data: settings } = useQuery({
  queryKey: ["settings", "app.name"],
  queryFn: () => settingsApi.get("app.name"),
});
const APP_NAME = settings?.value || "DGGM";
```

## Estensione futura

- [ ] Settings con validazione personalizzata
- [ ] Settings con dipendenze (setting A abilita setting B)
- [ ] History/audit log delle modifiche
- [ ] Import/export configurazioni
- [ ] Settings environment-specific (dev/staging/prod)
- [ ] Settings con secrets (password, API keys) criptate
