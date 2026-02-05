# Settings & Feature Flags API Documentation

Complete API reference for Settings system and Feature Flags.

**Base URL**: `/api/v1/settings`

---

## 📋 Table of Contents

1. [Settings CRUD](#settings-crud)
2. [Advanced Endpoints](#advanced-endpoints)
3. [Feature Flags](#feature-flags)
4. [Setting Types](#setting-types)
5. [Frontend Integration Guide](#frontend-integration-guide)
6. [TypeScript Types](#typescript-types)

---

## Settings CRUD

### GET `/api/v1/settings`

Get all settings with optional filters.

**Query Parameters**:
- `group` (string, optional) - Filter by group
- `user_id` (int|null, optional) - Filter by user (`null` for global)
- `is_public` (boolean, optional) - Filter by public visibility
- `search` (string, optional) - Search in key field

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "key": "app.name",
      "value": "DGGM ERP",
      "type": "string",
      "group": "general",
      "user_id": null,
      "is_public": true,
      "description": "Application name",
      "validation_rules": null,
      "allowed_values": null,
      "min_value": null,
      "max_value": null,
      "default_value": null,
      "order": 0,
      "is_feature_flag": false,
      "created_at": "2026-02-04T12:00:00.000000Z",
      "updated_at": "2026-02-04T12:00:00.000000Z"
    }
  ]
}
```

**Example**:
```typescript
// Get all general settings
const response = await fetch('/api/v1/settings?group=general');

// Get user-specific settings
const userSettings = await fetch('/api/v1/settings?user_id=5');

// Get global settings
const globalSettings = await fetch('/api/v1/settings?user_id=null');

// Get public settings
const publicSettings = await fetch('/api/v1/settings?is_public=true');
```

---

### GET `/api/v1/settings/{id}`

Get a single setting by ID.

**Response**:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "key": "app.name",
    "value": "DGGM ERP",
    "type": "string",
    ...
  }
}
```

---

### POST `/api/v1/settings`

Create a new setting.

**Body**:
```json
{
  "key": "ui.primary_color",
  "value": "#3B82F6",
  "type": "color",
  "group": "ui",
  "user_id": null,
  "is_public": false,
  "description": "Primary UI color",
  "validation_rules": ["regex:/^#[0-9A-Fa-f]{6}$/"],
  "min_value": null,
  "max_value": null,
  "default_value": "#3B82F6",
  "order": 10,
  "is_feature_flag": false
}
```

**Response** (201):
```json
{
  "success": true,
  "data": { ... },
  "message": "Setting created successfully"
}
```

---

### PUT/PATCH `/api/v1/settings/{id}`

Update an existing setting.

**Body**: Same as POST (partial updates supported with PATCH)

**Response**:
```json
{
  "success": true,
  "data": { ... },
  "message": "Setting updated successfully"
}
```

---

### DELETE `/api/v1/settings/{id}`

Delete a setting.

**Response** (204):
```json
{
  "success": true,
  "message": "Setting deleted successfully"
}
```

---

## Advanced Endpoints

### GET `/api/v1/settings/types`

Get all available setting types with metadata.

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "value": "string",
      "label": "Text",
      "validation": ["string"]
    },
    {
      "value": "number",
      "label": "Number",
      "validation": ["numeric"]
    },
    {
      "value": "boolean",
      "label": "True/False",
      "validation": ["boolean"]
    },
    {
      "value": "email",
      "label": "Email Address",
      "validation": ["email:rfc,dns"]
    },
    {
      "value": "color",
      "label": "Color (Hex)",
      "validation": ["string", "regex:/^#[0-9A-Fa-f]{6}$/"]
    },
    {
      "value": "enum",
      "label": "Select Option",
      "validation": ["string"]
    }
  ]
}
```

**Usage**: Populate setting type selector in UI.

---

### GET `/api/v1/settings/grouped`

Get all settings grouped by category.

**Query Parameters**:
- `user_id` (int|null, optional) - Filter by user

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "group": "general",
      "count": 3,
      "settings": [ ... ]
    },
    {
      "group": "company",
      "count": 4,
      "settings": [ ... ]
    },
    {
      "group": "features",
      "count": 5,
      "settings": [ ... ]
    }
  ]
}
```

**Usage**: Build tabbed settings UI with groups.

---

### GET `/api/v1/settings/key/{key}`

Get a setting value by key (simplified).

**Example**:
```typescript
// Get app name
const response = await fetch('/api/v1/settings/key/app.name');
// Response: { "success": true, "data": { "key": "app.name", "value": "DGGM ERP" } }

// Get user-specific setting
const userTheme = await fetch('/api/v1/settings/key/ui.theme?user_id=5');
```

**Response**:
```json
{
  "success": true,
  "data": {
    "key": "app.name",
    "value": "DGGM ERP"
  }
}
```

**Response (404)**:
```json
{
  "success": false,
  "message": "Setting not found"
}
```

---

### POST `/api/v1/settings/key/{key}`

Set a setting value by key (simplified).

**Body**:
```json
{
  "value": "New Value",
  "user_id": null,
  "group": "general",
  "is_public": false
}
```

**Response**:
```json
{
  "success": true,
  "data": { ... },
  "message": "Setting updated successfully"
}
```

**Usage**: Quick update without full SettingData structure.

---

### POST `/api/v1/settings/{id}/reset`

Reset a setting to its default value.

**Response**:
```json
{
  "success": true,
  "data": { ... },
  "message": "Setting reset to default value"
}
```

---

## Feature Flags

### GET `/api/v1/settings/feature-flags`

Get all feature flags.

**Query Parameters**:
- `user_id` (int|null, optional) - Filter by user

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": 10,
      "key": "features.enable_gps_tracking",
      "value": "1",
      "type": "boolean",
      "group": "features",
      "is_feature_flag": true,
      "description": "Enable GPS tracking for time entries",
      "order": 10,
      ...
    },
    {
      "id": 11,
      "key": "features.enable_semantic_search",
      "value": "1",
      "type": "boolean",
      "group": "features",
      "is_feature_flag": true,
      "order": 20,
      ...
    }
  ]
}
```

---

### GET `/api/v1/settings/feature-flags/enabled`

Get only enabled feature flags.

**Query Parameters**:
- `user_id` (int|null, optional)

**Response**: Same as above, but filtered to only enabled features.

**Usage**: Check which features are active for a user.

---

### POST `/api/v1/settings/feature-flags/{feature}/toggle`

Toggle a feature flag on/off.

**Path Parameter**:
- `feature` (string) - Feature name without `features.` prefix (e.g., `enable_gps_tracking`)

**Query Parameters**:
- `user_id` (int|null, optional) - User ID (null for global)

**Example**:
```typescript
// Toggle global feature
await fetch('/api/v1/settings/feature-flags/enable_gps_tracking/toggle', {
  method: 'POST'
});

// Toggle user-specific feature
await fetch('/api/v1/settings/feature-flags/beta_features/toggle?user_id=5', {
  method: 'POST'
});
```

**Response**:
```json
{
  "success": true,
  "data": {
    "id": 10,
    "key": "features.enable_gps_tracking",
    "value": "0",
    "type": "boolean",
    ...
  },
  "message": "Feature flag toggled successfully"
}
```

---

## Setting Types

### Available Types

| Type | Input | Validation | Use Case |
|------|-------|------------|----------|
| `string` | Text input | - | Company name, email from |
| `number` | Number input | min/max | Thresholds, limits, counts |
| `boolean` | Toggle/Checkbox | - | Feature flags, enable/disable |
| `json` | JSON editor | Valid JSON | Complex configs, arrays |
| `email` | Email input | RFC + DNS | Email addresses |
| `url` | URL input | Valid URL | Website, API endpoints |
| `color` | Color picker | #RRGGBB | UI colors, branding |
| `date` | Date picker | YYYY-MM-DD | Dates without time |
| `datetime` | Datetime picker | ISO 8601 | Full timestamps |
| `file` | File uploader | - | Logo, favicon paths |
| `enum` | Select dropdown | allowed_values | Predefined options |

---

## Frontend Integration Guide

### React Hook Example

```typescript
// hooks/useSettings.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';

export function useSettings(filters?: SettingFilters) {
  return useQuery({
    queryKey: ['settings', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.group) params.append('group', filters.group);
      if (filters?.user_id !== undefined) params.append('user_id', String(filters.user_id));
      if (filters?.is_public !== undefined) params.append('is_public', String(filters.is_public));

      const response = await apiClient.get(`/settings?${params}`);
      return response.data.data;
    },
  });
}

export function useGroupedSettings(userId?: number | null) {
  return useQuery({
    queryKey: ['settings', 'grouped', userId],
    queryFn: async () => {
      const params = userId !== undefined ? `?user_id=${userId ?? 'null'}` : '';
      const response = await apiClient.get(`/settings/grouped${params}`);
      return response.data.data;
    },
  });
}

export function useSettingTypes() {
  return useQuery({
    queryKey: ['settings', 'types'],
    queryFn: async () => {
      const response = await apiClient.get('/settings/types');
      return response.data.data;
    },
    staleTime: Infinity, // Types never change
  });
}

export function useFeatureFlags(userId?: number | null) {
  return useQuery({
    queryKey: ['settings', 'feature-flags', userId],
    queryFn: async () => {
      const params = userId !== undefined ? `?user_id=${userId ?? 'null'}` : '';
      const response = await apiClient.get(`/settings/feature-flags${params}`);
      return response.data.data;
    },
  });
}

export function useUpdateSetting() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<Setting> }) => {
      const response = await apiClient.patch(`/settings/${id}`, data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
    },
  });
}

export function useToggleFeature() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ feature, userId }: { feature: string; userId?: number | null }) => {
      const params = userId !== undefined ? `?user_id=${userId ?? 'null'}` : '';
      const response = await apiClient.post(`/settings/feature-flags/${feature}/toggle${params}`);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
    },
  });
}
```

---

### Component Examples

#### Settings Page with Tabs

```typescript
'use client';

import { useGroupedSettings } from '@/hooks/useSettings';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SettingItem } from './setting-item';

export function SettingsPage() {
  const { data: groups, isLoading } = useGroupedSettings(null); // null = global settings

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-6">Settings</h1>

      <Tabs defaultValue={groups?.[0]?.group}>
        <TabsList>
          {groups?.map((group) => (
            <TabsTrigger key={group.group} value={group.group}>
              {group.group} ({group.count})
            </TabsTrigger>
          ))}
        </TabsList>

        {groups?.map((group) => (
          <TabsContent key={group.group} value={group.group} className="space-y-4">
            {group.settings.map((setting) => (
              <SettingItem key={setting.id} setting={setting} />
            ))}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
```

---

#### Feature Flags Toggle List

```typescript
'use client';

import { useFeatureFlags, useToggleFeature } from '@/hooks/useSettings';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

export function FeatureFlagsPage() {
  const { data: flags, isLoading } = useFeatureFlags(null);
  const toggleMutation = useToggleFeature();

  const handleToggle = (feature: string) => {
    const featureName = feature.replace('features.', '');
    toggleMutation.mutate({ feature: featureName });
  };

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-6">Feature Flags</h1>

      <div className="space-y-4">
        {flags?.map((flag) => (
          <div key={flag.id} className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex-1">
              <Label htmlFor={flag.key} className="text-base font-medium">
                {flag.key.replace('features.', '')}
              </Label>
              <p className="text-sm text-muted-foreground mt-1">
                {flag.description}
              </p>
            </div>

            <Switch
              id={flag.key}
              checked={flag.value === '1' || flag.value === true}
              onCheckedChange={() => handleToggle(flag.key)}
              disabled={toggleMutation.isPending}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

#### Dynamic Setting Input

```typescript
'use client';

import { Setting } from '@/lib/types';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

export function SettingInput({ setting, onChange }: {
  setting: Setting;
  onChange: (value: any) => void;
}) {
  switch (setting.type) {
    case 'boolean':
      return (
        <Switch
          checked={setting.value === '1' || setting.value === true}
          onCheckedChange={(checked) => onChange(checked ? '1' : '0')}
        />
      );

    case 'number':
      return (
        <Input
          type="number"
          value={setting.value}
          onChange={(e) => onChange(e.target.value)}
          min={setting.min_value ?? undefined}
          max={setting.max_value ?? undefined}
        />
      );

    case 'color':
      return (
        <Input
          type="color"
          value={setting.value}
          onChange={(e) => onChange(e.target.value)}
        />
      );

    case 'email':
      return (
        <Input
          type="email"
          value={setting.value}
          onChange={(e) => onChange(e.target.value)}
        />
      );

    case 'url':
      return (
        <Input
          type="url"
          value={setting.value}
          onChange={(e) => onChange(e.target.value)}
        />
      );

    case 'date':
      return (
        <Input
          type="date"
          value={setting.value}
          onChange={(e) => onChange(e.target.value)}
        />
      );

    case 'enum':
      return (
        <Select value={setting.value} onValueChange={onChange}>
          {setting.allowed_values?.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </Select>
      );

    case 'json':
      return (
        <Textarea
          value={JSON.stringify(setting.value, null, 2)}
          onChange={(e) => {
            try {
              onChange(JSON.parse(e.target.value));
            } catch {}
          }}
          rows={6}
          className="font-mono text-sm"
        />
      );

    default: // string
      return (
        <Input
          type="text"
          value={setting.value}
          onChange={(e) => onChange(e.target.value)}
        />
      );
  }
}
```

---

## TypeScript Types

Auto-generated types are available from backend:

```typescript
// Generated by Laravel TypeScript Transformer
import { App } from '@/lib/types/generated';

type SettingData = App.Data.SettingData;
type SettingType = App.Enums.SettingType;

// Usage
const setting: SettingData = {
  id: 1,
  key: 'app.name',
  value: 'DGGM ERP',
  type: 'string',
  group: 'general',
  user_id: null,
  is_public: true,
  description: 'Application name',
  validation_rules: null,
  allowed_values: null,
  min_value: null,
  max_value: null,
  default_value: null,
  order: 0,
  is_feature_flag: false,
  created_at: '2026-02-04T12:00:00.000000Z',
  updated_at: '2026-02-04T12:00:00.000000Z',
};
```

---

## Complete Settings List for UI

### General Settings (`group: general`)

| Key | Type | Description | UI Component |
|-----|------|-------------|--------------|
| `app.name` | string | Application name | Text input |
| `app.timezone` | enum | Default timezone | Select (timezones) |
| `app.locale` | enum | Default language | Select (it, en, fr, de) |

---

### Company Settings (`group: company`)

| Key | Type | Description | UI Component |
|-----|------|-------------|--------------|
| `company.name` | string | Legal company name | Text input |
| `company.vat` | string | VAT number | Text input |
| `company.email` | email | Main email | Email input |
| `company.phone` | string | Main phone | Text input |
| `company.address` | string | Main address | Textarea |
| `company.logo` | file | Company logo | File upload (Spatie Media) |

---

### UI Settings (`group: ui`)

| Key | Type | Description | UI Component |
|-----|------|-------------|--------------|
| `ui.primary_color` | color | Primary brand color | Color picker |
| `ui.theme` | enum | Default theme | Select (light, dark, auto) |
| `ui.items_per_page` | number | Default pagination | Number (min:5, max:100) |

---

### Warehouse Settings (`group: warehouse`)

| Key | Type | Description | UI Component |
|-----|------|-------------|--------------|
| `warehouse.low_stock_threshold` | number | Low stock alert threshold | Number (min:1) |
| `warehouse.enable_notifications` | boolean | Enable warehouse alerts | Switch |

---

### Email Settings (`group: email`)

| Key | Type | Description | UI Component |
|-----|------|-------------|--------------|
| `email.enabled` | boolean | Enable email sending | Switch |
| `email.from_address` | email | From email address | Email input |
| `email.from_name` | string | From name | Text input |

---

### Notification Settings (`group: notifications`)

| Key | Type | Description | UI Component |
|-----|------|-------------|--------------|
| `notifications.channels` | json | Enabled channels | Multi-select (database, mail) |

---

### Feature Flags (`group: features`, `is_feature_flag: true`)

| Key | Description | UI Component |
|-----|-------------|--------------|
| `features.enable_gps_tracking` | GPS tracking for time entries | Switch |
| `features.enable_material_requests` | Material request system | Switch |
| `features.enable_semantic_search` | AI semantic search | Switch |
| `features.enable_pdf_generation` | PDF generation | Switch |
| `features.enable_notifications` | System notifications | Switch |

---

## Best Practices

1. **Cache Settings**: Use React Query with appropriate `staleTime`
2. **Optimistic Updates**: Update UI immediately, rollback on error
3. **Validation**: Use Zod schemas matching backend SettingType validation
4. **User Settings**: Pass `user_id` for personalized settings
5. **Feature Flags**: Check before rendering features
6. **Group Organization**: Use tabs for different setting groups
7. **Reset Button**: Always provide reset to default option
8. **Permission Checks**: Respect `is_public` and user roles

---

**Version**: 1.0
**Last Updated**: February 2026
