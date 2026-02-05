# Settings & Feature Flags - Frontend Implementation Guide

Complete guide for implementing Settings UI in Next.js 16 frontend.

---

## 📋 Implementation Checklist

### Phase 1: API Integration

- [ ] Create types (`lib/types/settings.ts`)
- [ ] Create API client (`lib/api/settings.ts`)
- [ ] Create React Query hooks (`hooks/useSettings.ts`)
- [ ] Test API connection

### Phase 2: Settings Page

- [ ] Create settings layout (`app/(dashboard)/settings/layout.tsx`)
- [ ] Create main settings page (`app/(dashboard)/settings/page.tsx`)
- [ ] Create grouped tabs UI
- [ ] Create setting item component

### Phase 3: Dynamic Inputs

- [ ] Create dynamic input component for all types
- [ ] Handle validation per type
- [ ] Add save/reset buttons
- [ ] Add success/error feedback

### Phase 4: Feature Flags

- [ ] Create feature flags page (`app/(dashboard)/settings/features/page.tsx`)
- [ ] Create toggle list component
- [ ] Add bulk enable/disable
- [ ] Add search/filter

### Phase 5: User Preferences

- [ ] Create user preferences page
- [ ] Sync with user context
- [ ] Persist to localStorage as fallback
- [ ] Apply theme changes immediately

---

## 1. TypeScript Types

Create `lib/types/settings.ts`:

```typescript
// Auto-generated from backend
import { App } from './generated';

export type Setting = App.Data.SettingData;
export type SettingType = App.Enums.SettingType;

// Frontend-specific types
export interface SettingGroup {
  group: string;
  count: number;
  settings: Setting[];
}

export interface SettingFilters {
  group?: string;
  user_id?: number | null;
  is_public?: boolean;
  search?: string;
}

export interface SettingTypeInfo {
  value: string;
  label: string;
  validation: string[];
}
```

---

## 2. API Client

Create `lib/api/settings.ts`:

```typescript
import { apiClient } from './client';
import type { Setting, SettingGroup, SettingTypeInfo, SettingFilters } from '@/lib/types/settings';

export const settingsApi = {
  // Get all settings
  getAll: async (filters?: SettingFilters) => {
    const params = new URLSearchParams();
    if (filters?.group) params.append('group', filters.group);
    if (filters?.user_id !== undefined) params.append('user_id', String(filters.user_id ?? 'null'));
    if (filters?.is_public !== undefined) params.append('is_public', String(filters.is_public));
    if (filters?.search) params.append('search', filters.search);

    const response = await apiClient.get<{ data: Setting[] }>(`/settings?${params}`);
    return response.data.data;
  },

  // Get single setting
  get: async (id: number) => {
    const response = await apiClient.get<{ data: Setting }>(`/settings/${id}`);
    return response.data.data;
  },

  // Create setting
  create: async (data: Partial<Setting>) => {
    const response = await apiClient.post<{ data: Setting }>('/settings', data);
    return response.data.data;
  },

  // Update setting
  update: async (id: number, data: Partial<Setting>) => {
    const response = await apiClient.patch<{ data: Setting }>(`/settings/${id}`, data);
    return response.data.data;
  },

  // Delete setting
  delete: async (id: number) => {
    await apiClient.delete(`/settings/${id}`);
  },

  // Get types
  getTypes: async () => {
    const response = await apiClient.get<{ data: SettingTypeInfo[] }>('/settings/types');
    return response.data.data;
  },

  // Get grouped
  getGrouped: async (userId?: number | null) => {
    const params = userId !== undefined ? `?user_id=${userId ?? 'null'}` : '';
    const response = await apiClient.get<{ data: SettingGroup[] }>(`/settings/grouped${params}`);
    return response.data.data;
  },

  // Get by key
  getByKey: async (key: string, userId?: number | null) => {
    const params = userId !== undefined ? `?user_id=${userId ?? 'null'}` : '';
    const response = await apiClient.get<{ data: { key: string; value: any } }>(`/settings/key/${key}${params}`);
    return response.data.data.value;
  },

  // Set by key
  setByKey: async (key: string, value: any, options?: { user_id?: number | null; group?: string; is_public?: boolean }) => {
    const response = await apiClient.post<{ data: Setting }>(`/settings/key/${key}`, {
      value,
      ...options,
    });
    return response.data.data;
  },

  // Reset to default
  reset: async (id: number) => {
    const response = await apiClient.post<{ data: Setting }>(`/settings/${id}/reset`);
    return response.data.data;
  },

  // Feature flags
  featureFlags: {
    getAll: async (userId?: number | null) => {
      const params = userId !== undefined ? `?user_id=${userId ?? 'null'}` : '';
      const response = await apiClient.get<{ data: Setting[] }>(`/settings/feature-flags${params}`);
      return response.data.data;
    },

    getEnabled: async (userId?: number | null) => {
      const params = userId !== undefined ? `?user_id=${userId ?? 'null'}` : '';
      const response = await apiClient.get<{ data: Setting[] }>(`/settings/feature-flags/enabled${params}`);
      return response.data.data;
    },

    toggle: async (feature: string, userId?: number | null) => {
      const params = userId !== undefined ? `?user_id=${userId ?? 'null'}` : '';
      const response = await apiClient.post<{ data: Setting }>(`/settings/feature-flags/${feature}/toggle${params}`);
      return response.data.data;
    },
  },
};
```

---

## 3. React Query Hooks

Create `hooks/useSettings.ts`:

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { settingsApi } from '@/lib/api/settings';
import type { Setting, SettingFilters } from '@/lib/types/settings';

export function useSettings(filters?: SettingFilters) {
  return useQuery({
    queryKey: ['settings', filters],
    queryFn: () => settingsApi.getAll(filters),
  });
}

export function useSetting(id: number) {
  return useQuery({
    queryKey: ['settings', id],
    queryFn: () => settingsApi.get(id),
  });
}

export function useGroupedSettings(userId?: number | null) {
  return useQuery({
    queryKey: ['settings', 'grouped', userId],
    queryFn: () => settingsApi.getGrouped(userId),
  });
}

export function useSettingTypes() {
  return useQuery({
    queryKey: ['settings', 'types'],
    queryFn: () => settingsApi.getTypes(),
    staleTime: Infinity, // Types never change
  });
}

export function useSettingByKey(key: string, userId?: number | null) {
  return useQuery({
    queryKey: ['settings', 'key', key, userId],
    queryFn: () => settingsApi.getByKey(key, userId),
  });
}

export function useFeatureFlags(userId?: number | null) {
  return useQuery({
    queryKey: ['settings', 'feature-flags', userId],
    queryFn: () => settingsApi.featureFlags.getAll(userId),
  });
}

export function useEnabledFeatures(userId?: number | null) {
  return useQuery({
    queryKey: ['settings', 'feature-flags', 'enabled', userId],
    queryFn: () => settingsApi.featureFlags.getEnabled(userId),
  });
}

// Mutations

export function useCreateSetting() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Partial<Setting>) => settingsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
    },
  });
}

export function useUpdateSetting() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Setting> }) =>
      settingsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
    },
  });
}

export function useDeleteSetting() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => settingsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
    },
  });
}

export function useResetSetting() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => settingsApi.reset(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
    },
  });
}

export function useSetSettingByKey() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      key,
      value,
      options,
    }: {
      key: string;
      value: any;
      options?: { user_id?: number | null; group?: string; is_public?: boolean };
    }) => settingsApi.setByKey(key, value, options),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
    },
  });
}

export function useToggleFeature() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ feature, userId }: { feature: string; userId?: number | null }) =>
      settingsApi.featureFlags.toggle(feature, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
    },
  });
}
```

---

## 4. Settings Page Layout

Create `app/(dashboard)/settings/layout.tsx`:

```typescript
export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="container mx-auto py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">Settings</h1>
        <p className="text-slate-600 dark:text-slate-400 mt-2">
          Manage your application settings and preferences
        </p>
      </div>
      {children}
    </div>
  );
}
```

---

## 5. Settings Main Page

Create `app/(dashboard)/settings/page.tsx`:

```typescript
'use client';

import { useGroupedSettings } from '@/hooks/useSettings';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SettingItem } from './_components/setting-item';
import { Skeleton } from '@/components/ui/skeleton';

export default function SettingsPage() {
  const { data: groups, isLoading } = useGroupedSettings(null); // Global settings

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <Tabs defaultValue={groups?.[0]?.group} className="w-full">
      <TabsList className="mb-6">
        {groups?.map((group) => (
          <TabsTrigger key={group.group} value={group.group} className="capitalize">
            {group.group} <span className="ml-2 text-xs opacity-60">({group.count})</span>
          </TabsTrigger>
        ))}
      </TabsList>

      {groups?.map((group) => (
        <TabsContent key={group.group} value={group.group} className="space-y-4">
          <div className="grid gap-4">
            {group.settings.map((setting) => (
              <SettingItem key={setting.id} setting={setting} />
            ))}
          </div>
        </TabsContent>
      ))}
    </Tabs>
  );
}
```

---

## 6. Setting Item Component

Create `app/(dashboard)/settings/_components/setting-item.tsx`:

```typescript
'use client';

import { useState } from 'react';
import { useUpdateSetting, useResetSetting } from '@/hooks/useSettings';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { SettingInput } from './setting-input';
import { RotateCcw, Save } from 'lucide-react';
import { toast } from 'sonner';
import type { Setting } from '@/lib/types/settings';

export function SettingItem({ setting }: { setting: Setting }) {
  const [value, setValue] = useState(setting.value);
  const updateMutation = useUpdateSetting();
  const resetMutation = useResetSetting();

  const handleSave = () => {
    updateMutation.mutate(
      { id: setting.id, data: { value } },
      {
        onSuccess: () => toast.success('Setting updated successfully'),
        onError: () => toast.error('Failed to update setting'),
      }
    );
  };

  const handleReset = () => {
    if (!setting.default_value) {
      toast.error('No default value set');
      return;
    }

    resetMutation.mutate(setting.id, {
      onSuccess: (data) => {
        setValue(data.value);
        toast.success('Setting reset to default');
      },
      onError: () => toast.error('Failed to reset setting'),
    });
  };

  const hasChanged = value !== setting.value;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-base">{setting.key}</CardTitle>
            {setting.description && (
              <CardDescription className="mt-1">{setting.description}</CardDescription>
            )}
          </div>

          <div className="flex gap-2">
            {setting.default_value && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleReset}
                disabled={resetMutation.isPending}
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
            )}

            <Button
              size="sm"
              onClick={handleSave}
              disabled={!hasChanged || updateMutation.isPending}
            >
              <Save className="h-4 w-4 mr-2" />
              Save
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <SettingInput setting={{ ...setting, value }} onChange={setValue} />

        {/* Validation info */}
        {(setting.min_value || setting.max_value) && (
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
            Range: {setting.min_value ?? '-∞'} to {setting.max_value ?? '+∞'}
          </p>
        )}

        {setting.allowed_values && (
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
            Allowed: {setting.allowed_values.join(', ')}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
```

---

## 7. Dynamic Input Component

Create `app/(dashboard)/settings/_components/setting-input.tsx`:

```typescript
'use client';

import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Setting } from '@/lib/types/settings';

export function SettingInput({
  setting,
  onChange,
}: {
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
          className="max-w-xs"
        />
      );

    case 'color':
      return (
        <div className="flex gap-2 items-center">
          <Input
            type="color"
            value={setting.value}
            onChange={(e) => onChange(e.target.value)}
            className="w-20 h-10"
          />
          <Input
            type="text"
            value={setting.value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="#000000"
            className="max-w-xs"
          />
        </div>
      );

    case 'email':
      return (
        <Input
          type="email"
          value={setting.value}
          onChange={(e) => onChange(e.target.value)}
          className="max-w-md"
        />
      );

    case 'url':
      return (
        <Input
          type="url"
          value={setting.value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="https://example.com"
          className="max-w-md"
        />
      );

    case 'date':
      return (
        <Input
          type="date"
          value={setting.value}
          onChange={(e) => onChange(e.target.value)}
          className="max-w-xs"
        />
      );

    case 'datetime':
      return (
        <Input
          type="datetime-local"
          value={setting.value}
          onChange={(e) => onChange(e.target.value)}
          className="max-w-xs"
        />
      );

    case 'enum':
      return (
        <Select value={setting.value} onValueChange={onChange}>
          <SelectTrigger className="max-w-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {setting.allowed_values?.map((option) => (
              <SelectItem key={option} value={option}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );

    case 'json':
      return (
        <Textarea
          value={typeof setting.value === 'string' ? setting.value : JSON.stringify(setting.value, null, 2)}
          onChange={(e) => {
            try {
              onChange(JSON.parse(e.target.value));
            } catch {
              onChange(e.target.value);
            }
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
          className="max-w-md"
        />
      );
  }
}
```

---

## 8. Feature Flags Page

Create `app/(dashboard)/settings/features/page.tsx`:

```typescript
'use client';

import { useFeatureFlags, useToggleFeature } from '@/hooks/useSettings';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useState } from 'react';
import { Search } from 'lucide-react';
import { toast } from 'sonner';

export default function FeatureFlagsPage() {
  const { data: flags, isLoading } = useFeatureFlags(null);
  const toggleMutation = useToggleFeature();
  const [search, setSearch] = useState('');

  const handleToggle = (feature: string) => {
    const featureName = feature.replace('features.', '');
    toggleMutation.mutate(
      { feature: featureName },
      {
        onSuccess: () => toast.success('Feature flag toggled'),
        onError: () => toast.error('Failed to toggle feature'),
      }
    );
  };

  const filteredFlags = flags?.filter(
    (flag) =>
      flag.key.toLowerCase().includes(search.toLowerCase()) ||
      flag.description?.toLowerCase().includes(search.toLowerCase())
  );

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Feature Flags</h2>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            Enable or disable features across the application
          </p>
        </div>

        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search features..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="grid gap-4">
        {filteredFlags?.map((flag) => (
          <Card key={flag.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <CardTitle className="text-base">
                    {flag.key.replace('features.', '').replace(/_/g, ' ')}
                  </CardTitle>
                  {flag.description && (
                    <CardDescription className="mt-1">{flag.description}</CardDescription>
                  )}
                </div>

                <Switch
                  id={flag.key}
                  checked={flag.value === '1' || flag.value === true}
                  onCheckedChange={() => handleToggle(flag.key)}
                  disabled={toggleMutation.isPending}
                />
              </div>
            </CardHeader>
          </Card>
        ))}
      </div>

      {filteredFlags?.length === 0 && (
        <div className="text-center py-12 text-slate-500 dark:text-slate-400">
          No feature flags found matching "{search}"
        </div>
      )}
    </div>
  );
}
```

---

## 9. Navigation Menu

Add to sidebar navigation:

```typescript
// In your sidebar component
{
  title: 'Settings',
  icon: Settings,
  children: [
    { title: 'General', href: '/settings' },
    { title: 'Feature Flags', href: '/settings/features' },
    { title: 'My Preferences', href: '/settings/preferences' },
  ],
}
```

---

## 🎨 UI Components Needed (shadcn/ui)

Install required components:

```bash
npx shadcn@latest add card
npx shadcn@latest add tabs
npx shadcn@latest add input
npx shadcn@latest add switch
npx shadcn@latest add button
npx shadcn@latest add select
npx shadcn@latest add textarea
npx shadcn@latest add label
npx shadcn@latest add skeleton
```

---

## ✅ Testing Checklist

### Manual Testing

- [ ] Settings page loads without errors
- [ ] Tabs switch correctly
- [ ] Each setting type renders correct input
- [ ] Save button updates setting
- [ ] Reset button restores default
- [ ] Feature flags toggle correctly
- [ ] Search filters work
- [ ] Dark mode supported on all elements
- [ ] No console errors

### Edge Cases

- [ ] Invalid JSON in JSON editor
- [ ] Out of range numbers
- [ ] Invalid color format
- [ ] Empty required fields
- [ ] Network errors handled gracefully

---

## 🚀 Deployment Checklist

- [ ] TypeScript types generated
- [ ] All imports resolve correctly
- [ ] Dark mode working
- [ ] Mobile responsive
- [ ] API endpoints correct
- [ ] Error boundaries in place
- [ ] Loading states implemented
- [ ] Success/error toasts working

---

**Estimated Implementation Time**: 8-12 hours
**Complexity**: Medium
**Dependencies**: shadcn/ui, TanStack Query, Zustand (optional)

**Version**: 1.0
**Last Updated**: February 2026
