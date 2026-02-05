# Settings System - Quick Start Guide

## 🚀 Guida Rapida per Sviluppatori

### Accesso alla Pagina Settings

```
📍 Dashboard Settings Index: /settings-index
📍 Admin Settings: /admin/settings
📍 Direct Tab Access: /admin/settings?tab=<group>
```

---

## 🔧 Utilizzo nell'Applicazione

### 1. Leggere un Setting

```typescript
import { settingsApi } from "@/lib/api/settings";

// Ottieni tutte le settings
const settings = await settingsApi.getAll();

// Ottieni settings per gruppo
const generalSettings = await settingsApi.getByGroup("general");

// Ottieni un setting specifico per chiave
const appName = await settingsApi.getByKey("app_name");
console.log(appName.value); // "My Application"

// Ottieni settings raggruppate
const grouped = await settingsApi.getGrouped();
grouped.forEach((group) => {
  console.log(`${group.group}: ${group.count} settings`);
  group.settings.forEach((s) => console.log(`  - ${s.key}: ${s.value}`));
});
```

### 2. Aggiornare un Setting

```typescript
// Update semplice per chiave
await settingsApi.updateByKey("app_name", "New Application Name");

// Update con opzioni avanzate
await settingsApi.updateByKey("theme_color", "#FF0000", {
  user_id: 123, // Setting specifico per utente
  is_public: false, // Visibilità
});

// Update completo per ID
await settingsApi.update(42, {
  value: "new value",
  description: "Updated description",
  min_value: 10,
  max_value: 100,
});

// Bulk update multipli
await settingsApi.bulkUpdate([
  { key: "smtp_host", value: "smtp.gmail.com" },
  { key: "smtp_port", value: "587" },
  { key: "smtp_user", value: "user@gmail.com" },
]);
```

### 3. Creare un Nuovo Setting

```typescript
await settingsApi.create({
  key: "my_custom_setting",
  value: "default value",
  type: "string",
  group: "general",
  description: "My custom setting description",
  is_public: true,
  order: 10,
});

// Setting con validazione
await settingsApi.create({
  key: "max_items_per_page",
  value: "20",
  type: "number",
  group: "ui",
  description: "Maximum items per page in tables",
  min_value: 10,
  max_value: 100,
  default_value: "20",
  is_public: true,
});

// Setting enum con opzioni
await settingsApi.create({
  key: "theme_mode",
  value: "light",
  type: "enum",
  group: "ui",
  description: "Application theme mode",
  allowed_values: ["light", "dark", "auto"],
  default_value: "light",
  is_public: true,
});
```

### 4. Eliminare e Reset

```typescript
// Elimina setting
await settingsApi.delete(settingId);

// Reset a valore default
await settingsApi.reset(settingId);
```

---

## 🚩 Feature Flags

### Utilizzo Feature Flags

```typescript
import { featureFlagsApi } from "@/lib/api/settings";

// Ottieni tutte le feature flags
const allFlags = await featureFlagsApi.getAll();

// Ottieni solo quelle abilitate (array di chiavi)
const enabledFlags = await featureFlagsApi.getEnabled();
// ['new_dashboard', 'beta_features']

// Check se una feature è abilitata
const isDashboardEnabled = await featureFlagsApi.isEnabled("new_dashboard");
if (isDashboardEnabled) {
  // Mostra nuova dashboard
}

// Toggle feature flag
await featureFlagsApi.toggle("beta_features", true); // Abilita
await featureFlagsApi.toggle("beta_features", false); // Disabilita
```

### Feature Flag nel Componente

```typescript
'use client';
import { useQuery } from '@tanstack/react-query';
import { featureFlagsApi } from '@/lib/api/settings';

export function MyComponent() {
  const { data: enabledFlags = [] } = useQuery({
    queryKey: ['feature-flags', 'enabled'],
    queryFn: () => featureFlagsApi.getEnabled(),
  });

  const isNewDashboardEnabled = enabledFlags.includes('new_dashboard');

  return (
    <div>
      {isNewDashboardEnabled ? (
        <NewDashboard />
      ) : (
        <OldDashboard />
      )}
    </div>
  );
}
```

---

## 🎨 Tipi di Setting Disponibili

### 1. String

```typescript
{ type: 'string', value: 'any text' }
```

**UI**: Input text  
**Uso**: Nomi, descrizioni, testi generici

### 2. Number

```typescript
{
  type: 'number',
  value: '42',
  min_value: 0,
  max_value: 100
}
```

**UI**: Input number con min/max  
**Uso**: Contatori, limiti, quantità

### 3. Boolean

```typescript
{ type: 'boolean', value: 'true' }
```

**UI**: Switch  
**Uso**: Flags on/off, abilitazioni

### 4. Email

```typescript
{ type: 'email', value: 'user@domain.com' }
```

**UI**: Input email con validazione  
**Uso**: Email di sistema, notifiche

### 5. URL

```typescript
{ type: 'url', value: 'https://example.com' }
```

**UI**: Input URL con validazione  
**Uso**: Link esterni, API endpoints

### 6. Color

```typescript
{ type: 'color', value: '#FF5733' }
```

**UI**: Color picker + text input  
**Uso**: Colori tema, personalizzazione UI

### 7. Date

```typescript
{ type: 'date', value: '2025-01-15' }
```

**UI**: Date picker  
**Uso**: Date di scadenza, pianificazioni

### 8. Datetime

```typescript
{ type: 'datetime', value: '2025-01-15T14:30:00' }
```

**UI**: Datetime picker  
**Uso**: Timestamp, orari precisi

### 9. Enum

```typescript
{
  type: 'enum',
  value: 'medium',
  allowed_values: ['small', 'medium', 'large']
}
```

**UI**: Select dropdown  
**Uso**: Scelte predefinite, opzioni multiple

### 10. JSON

```typescript
{
  type: 'json',
  value: '{"key": "value", "nested": {"data": true}}'
}
```

**UI**: Textarea con font mono  
**Uso**: Configurazioni complesse, strutture dati

### 11. File

```typescript
{ type: 'file', value: 'path/to/file.pdf' }
```

**UI**: File input  
**Uso**: Upload documenti, immagini, allegati

---

## 🗂️ Gruppi di Settings

### General (general)

Impostazioni generali del sistema

- Nome applicazione
- Lingua di default
- Timezone
- Formato data/ora

### Company (company)

Informazioni aziendali

- Ragione sociale
- P.IVA / Codice fiscale
- Indirizzo sede
- Contatti

### UI (ui)

Interfaccia utente

- Tema (light/dark)
- Colori personalizzati
- Items per pagina
- Dimensioni font

### Warehouse (warehouse)

Gestione magazzino

- Soglie minime
- Unità di misura default
- Categorie materiali
- Metodo valorizzazione

### Email (email)

Configurazione email

- SMTP host/port
- Credenziali
- Email mittente
- Template email

### Notifications (notifications)

Sistema notifiche

- Tipi notifiche abilitate
- Canali (email, push, in-app)
- Frequenza invio
- Template notifiche

### Files (files)

Gestione file

- Max upload size
- Tipi file permessi
- Storage path
- Compressione immagini

### Features (features)

Feature flags

- Funzionalità beta
- A/B testing
- Rollout progressivi
- Experimental features

---

## 🎯 Best Practices

### 1. Naming Convention

```typescript
// ✅ Good
"smtp_host";
"max_items_per_page";
"enable_notifications";

// ❌ Bad
"SmtpHost";
"MaxItemsPerPage";
"EnableNotifications";
```

**Regola**: snake_case, descrittivo, inglese

### 2. Gruppi Appropriati

```typescript
// ✅ Corretto
{ key: 'theme_color', group: 'ui' }
{ key: 'smtp_host', group: 'email' }

// ❌ Sbagliato
{ key: 'theme_color', group: 'general' }
{ key: 'smtp_host', group: 'notifications' }
```

### 3. Valori di Default

```typescript
// ✅ Sempre fornire default
{
  key: 'items_per_page',
  value: '20',
  default_value: '20', // ✅
  type: 'number',
}

// ❌ Mancante default
{
  key: 'items_per_page',
  value: '20',
  // default_value missing ❌
}
```

### 4. Descrizioni Chiare

```typescript
// ✅ Good
description: "Maximum number of items displayed per page in data tables";

// ❌ Bad
description: "Items";
```

### 5. Validazione Constraints

```typescript
// ✅ Number con limiti
{
  type: 'number',
  min_value: 1,
  max_value: 100,
}

// ✅ Enum con opzioni
{
  type: 'enum',
  allowed_values: ['small', 'medium', 'large'],
}
```

### 6. Feature Flags

```typescript
// ✅ Feature flag correttamente marcata
{
  key: 'enable_new_dashboard',
  type: 'boolean',
  value: 'false',
  group: 'features',
  is_feature_flag: true, // ✅
}
```

---

## 🔍 Esempi Pratici

### Esempio 1: Theme Switcher

```typescript
'use client';
import { useState } from 'react';
import { settingsApi } from '@/lib/api/settings';

export function ThemeSwitcher() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  const handleChangeTheme = async (newTheme: 'light' | 'dark') => {
    await settingsApi.updateByKey('theme_mode', newTheme, {
      user_id: currentUser.id, // Setting per utente
      is_public: false,
    });
    setTheme(newTheme);
  };

  return (
    <button onClick={() => handleChangeTheme(theme === 'light' ? 'dark' : 'light')}>
      {theme === 'light' ? '🌙' : '☀️'}
    </button>
  );
}
```

### Esempio 2: Pagination Settings

```typescript
import { useQuery } from '@tanstack/react-query';
import { settingsApi } from '@/lib/api/settings';

export function DataTable() {
  const { data: itemsPerPage } = useQuery({
    queryKey: ['settings', 'items_per_page'],
    queryFn: async () => {
      const setting = await settingsApi.getByKey('items_per_page');
      return parseInt(setting.value) || 20;
    },
  });

  return (
    <Table>
      {/* Usa itemsPerPage per pagination */}
    </Table>
  );
}
```

### Esempio 3: Feature Flag Hook

```typescript
import { useQuery } from '@tanstack/react-query';
import { featureFlagsApi } from '@/lib/api/settings';

export function useFeatureFlag(flag: string) {
  const { data: isEnabled = false } = useQuery({
    queryKey: ['feature-flag', flag],
    queryFn: () => featureFlagsApi.isEnabled(flag),
    staleTime: 5 * 60 * 1000, // Cache 5 minuti
  });

  return isEnabled;
}

// Uso nel componente
export function MyComponent() {
  const isNewDashboardEnabled = useFeatureFlag('new_dashboard');

  return isNewDashboardEnabled ? <NewFeature /> : <OldFeature />;
}
```

---

## 🐛 Troubleshooting

### Problema: Setting non si aggiorna

```typescript
// ❌ Dimenticato invalidare cache
await settingsApi.updateByKey("app_name", "New Name");

// ✅ Invalida la cache React Query
await settingsApi.updateByKey("app_name", "New Name");
queryClient.invalidateQueries({ queryKey: ["settings"] });
```

### Problema: Type mismatch

```typescript
// ❌ Tipo sbagliato
await settingsApi.create({
  type: "number",
  value: 42, // ❌ Deve essere stringa!
});

// ✅ Corretto
await settingsApi.create({
  type: "number",
  value: "42", // ✅ Sempre stringa
});
```

### Problema: Feature flag non funziona

```typescript
// Verifica sia marcata come feature flag
const setting = await settingsApi.get(settingId);
console.log(setting.is_feature_flag); // deve essere true
console.log(setting.group); // deve essere 'features'
```

---

## 📚 API Reference Completa

Vedi documentazione dettagliata:

- `/docs/SETTINGS_FRONTEND_BACKEND_ALIGNMENT.md`
- `/docs/settings/SETTINGS_API_DOCUMENTATION.md` (backend)
- `/lib/api/settings.ts` (source code)

---

## 🆘 Support

Per domande o problemi:

1. Consulta la documentazione completa
2. Verifica gli esempi pratici sopra
3. Controlla gli errori TypeScript
4. Testa in `/admin/settings` la pagina UI
