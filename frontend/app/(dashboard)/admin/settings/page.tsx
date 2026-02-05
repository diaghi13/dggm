"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  settingsApi,
  featureFlagsApi,
  SETTING_GROUPS,
  Setting,
} from "@/lib/api/settings";
import { useAuthStore } from "@/stores/auth-store";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Settings,
  Building2,
  Bell,
  Package,
  FileText,
  Users,
  Shield,
  Plug,
  Save,
  RefreshCw,
  Mail,
  Palette,
  Flag,
  Layout,
  DollarSign,
} from "lucide-react";
import { toast } from "sonner";
import { useSearchParams } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const iconMap = {
  Settings,
  Building2,
  Bell,
  Package,
  FileText,
  Users,
  Shield,
  Plug,
  Mail,
  Palette,
  Flag,
  Layout,
  DollarSign,
} as const;

export default function AdminSettingsPage() {
  const queryClient = useQueryClient();
  const { refreshUser } = useAuthStore();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const [activeTab, setActiveTab] = useState(tabParam || "general");
  const [changedSettings, setChangedSettings] = useState<
    Record<string, string>
  >({});

  // Fetch all settings
  const { data: allSettings = [], isLoading } = useQuery({
    queryKey: ["settings", "all"],
    queryFn: () => settingsApi.getAll(),
  });

  // Fetch feature flags
  const { data: featureFlags = [], isLoading: isLoadingFlags } = useQuery({
    queryKey: ["feature-flags"],
    queryFn: () => featureFlagsApi.getAll(),
  });

  // Bulk update settings mutation
  const bulkUpdateMutation = useMutation({
    mutationFn: settingsApi.bulkUpdate,
    onMutate: async (newSettings) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["settings"] });

      // Snapshot the previous value
      const previousSettings = queryClient.getQueryData(["settings", "all"]);

      // Optimistically update to the new value
      queryClient.setQueryData(["settings", "all"], (old: Setting[]) => {
        if (!old) return old;
        return old.map((setting) => {
          const update = newSettings.find((s) => s.key === setting.key);
          return update ? { ...setting, value: update.value } : setting;
        });
      });

      return { previousSettings };
    },
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ["settings"] });
      setChangedSettings({});
      // Refresh auth store to get updated settings
      await refreshUser();
      toast.success("Impostazioni salvate con successo");
    },
    onError: (error: unknown, _newSettings, context) => {
      // Rollback on error
      if (context?.previousSettings) {
        queryClient.setQueryData(["settings", "all"], context.previousSettings);
      }
      const err = error as { response?: { data?: { message?: string } } };
      toast.error("Errore", {
        description:
          err.response?.data?.message || "Impossibile salvare le impostazioni",
      });
    },
  });

  // Toggle feature flag mutation
  const toggleFeatureMutation = useMutation({
    mutationFn: ({ key, enabled }: { key: string; enabled: boolean }) =>
      featureFlagsApi.toggle(key, enabled),
    onMutate: async ({ key, enabled }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["feature-flags"] });

      // Snapshot the previous value
      const previousFlags = queryClient.getQueryData(["feature-flags"]);

      // Optimistically update to the new value
      queryClient.setQueryData(["feature-flags"], (old: Setting[]) => {
        if (!old) return old;
        return old.map((flag) =>
          flag.key === key
            ? { ...flag, value: enabled ? "true" : "false" }
            : flag,
        );
      });

      return { previousFlags };
    },
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ["feature-flags"] });
      // Refresh auth store to get updated settings
      await refreshUser();
      toast.success("Feature flag aggiornata");
    },
    onError: (error: unknown, _variables, context) => {
      // Rollback on error
      if (context?.previousFlags) {
        queryClient.setQueryData(["feature-flags"], context.previousFlags);
      }
      const err = error as { response?: { data?: { message?: string } } };
      toast.error("Errore", {
        description:
          err.response?.data?.message ||
          "Impossibile aggiornare la feature flag",
      });
    },
  });

  const handleSettingChange = (key: string, value: string) => {
    setChangedSettings((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSaveSettings = (group: string) => {
    const settingsToUpdate = Object.entries(changedSettings)
      .filter(([key]) => {
        const setting = allSettings.find((s: Setting) => s.key === key);
        return setting?.group === group;
      })
      .map(([key, value]) => ({ key, value }));

    if (settingsToUpdate.length === 0) {
      toast.info("Nessuna modifica da salvare");
      return;
    }

    bulkUpdateMutation.mutate(settingsToUpdate);
  };

  const getSettingsByGroup = (group: string): Setting[] => {
    return allSettings.filter((s: Setting) => s.group === group);
  };

  const getSettingValue = (key: string) => {
    if (changedSettings[key] !== undefined) {
      return changedSettings[key];
    }
    const setting = allSettings.find((s: Setting) => s.key === key);
    return setting?.value || "";
  };

  const renderSettingInput = (setting: Setting) => {
    const value = getSettingValue(setting.key);
    const displayName = setting.description || setting.key;

    switch (setting.type) {
      case "boolean":
        return (
          <div className="flex items-center space-x-2">
            <Switch
              id={setting.key}
              checked={value === "true" || value === "1"}
              onCheckedChange={(checked) =>
                handleSettingChange(setting.key, checked ? "true" : "false")
              }
            />
            <Label htmlFor={setting.key} className="cursor-pointer">
              {displayName}
            </Label>
          </div>
        );

      case "number":
        return (
          <div className="space-y-2">
            <Label htmlFor={setting.key}>{displayName}</Label>
            <Input
              id={setting.key}
              type="number"
              value={value}
              onChange={(e) => handleSettingChange(setting.key, e.target.value)}
              min={setting.min_value ?? undefined}
              max={setting.max_value ?? undefined}
            />
            {(setting.min_value !== null || setting.max_value !== null) && (
              <p className="text-xs text-muted-foreground">
                {setting.min_value !== null && `Min: ${setting.min_value}`}
                {setting.min_value !== null &&
                  setting.max_value !== null &&
                  " - "}
                {setting.max_value !== null && `Max: ${setting.max_value}`}
              </p>
            )}
          </div>
        );

      case "email":
        return (
          <div className="space-y-2">
            <Label htmlFor={setting.key}>{displayName}</Label>
            <Input
              id={setting.key}
              type="email"
              value={value}
              onChange={(e) => handleSettingChange(setting.key, e.target.value)}
              placeholder="example@domain.com"
            />
          </div>
        );

      case "url":
        return (
          <div className="space-y-2">
            <Label htmlFor={setting.key}>{displayName}</Label>
            <Input
              id={setting.key}
              type="url"
              value={value}
              onChange={(e) => handleSettingChange(setting.key, e.target.value)}
              placeholder="https://example.com"
            />
          </div>
        );

      case "color":
        return (
          <div className="space-y-2">
            <Label htmlFor={setting.key}>{displayName}</Label>
            <div className="flex items-center gap-2">
              <Input
                id={setting.key}
                type="color"
                value={value || "#000000"}
                onChange={(e) =>
                  handleSettingChange(setting.key, e.target.value)
                }
                className="h-10 w-20 cursor-pointer"
              />
              <Input
                type="text"
                value={value}
                onChange={(e) =>
                  handleSettingChange(setting.key, e.target.value)
                }
                placeholder="#000000"
                className="flex-1 font-mono"
              />
            </div>
          </div>
        );

      case "date":
        return (
          <div className="space-y-2">
            <Label htmlFor={setting.key}>{displayName}</Label>
            <Input
              id={setting.key}
              type="date"
              value={value}
              onChange={(e) => handleSettingChange(setting.key, e.target.value)}
            />
          </div>
        );

      case "datetime":
        return (
          <div className="space-y-2">
            <Label htmlFor={setting.key}>{displayName}</Label>
            <Input
              id={setting.key}
              type="datetime-local"
              value={value}
              onChange={(e) => handleSettingChange(setting.key, e.target.value)}
            />
          </div>
        );

      case "enum":
        return (
          <div className="space-y-2">
            <Label htmlFor={setting.key}>{displayName}</Label>
            <Select
              value={value}
              onValueChange={(newValue) =>
                handleSettingChange(setting.key, newValue)
              }
            >
              <SelectTrigger id={setting.key}>
                <SelectValue placeholder="Seleziona un'opzione" />
              </SelectTrigger>
              <SelectContent>
                {setting.allowed_values?.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        );

      case "json":
        // Check if it's an array (try to parse and see)
        let isArray = false;
        let arrayValues: string[] = [];
        try {
          const parsed = JSON.parse(value || "[]");
          if (Array.isArray(parsed)) {
            isArray = true;
            arrayValues = parsed;
          }
        } catch {
          // Not valid JSON or not array
        }

        if (isArray) {
          // Render multi-select for arrays
          return (
            <div className="space-y-2">
              <Label htmlFor={setting.key}>{displayName}</Label>
              <div className="flex flex-wrap gap-2 p-2 border rounded-md min-h-10">
                {arrayValues.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary rounded-md text-sm"
                  >
                    <span>{item}</span>
                    <button
                      type="button"
                      onClick={() => {
                        const newArray = arrayValues.filter(
                          (_, i) => i !== index,
                        );
                        handleSettingChange(
                          setting.key,
                          JSON.stringify(newArray),
                        );
                      }}
                      className="hover:text-destructive"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  id={`${setting.key}-new`}
                  placeholder="Aggiungi nuovo valore..."
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      const input = e.currentTarget;
                      const newValue = input.value.trim();
                      if (newValue && !arrayValues.includes(newValue)) {
                        const newArray = [...arrayValues, newValue];
                        handleSettingChange(
                          setting.key,
                          JSON.stringify(newArray),
                        );
                        input.value = "";
                      }
                    }
                  }}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Premi Invio per aggiungere un valore
              </p>
            </div>
          );
        }

        // Standard JSON textarea for objects
        return (
          <div className="space-y-2">
            <Label htmlFor={setting.key}>{displayName}</Label>
            <Textarea
              id={setting.key}
              value={value}
              onChange={(e) => handleSettingChange(setting.key, e.target.value)}
              rows={4}
              className="font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground">
              Formato JSON valido richiesto
            </p>
          </div>
        );

      case "file":
        return (
          <div className="space-y-2">
            <Label htmlFor={setting.key}>{displayName}</Label>
            <Input
              id={setting.key}
              type="file"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  // TODO: Implement file upload logic
                  handleSettingChange(setting.key, file.name);
                  toast.info("Upload file non ancora implementato");
                }
              }}
            />
            {value && (
              <p className="text-sm text-muted-foreground">File: {value}</p>
            )}
          </div>
        );

      default: // string
        return (
          <div className="space-y-2">
            <Label htmlFor={setting.key}>{displayName}</Label>
            <Input
              id={setting.key}
              type="text"
              value={value}
              onChange={(e) => handleSettingChange(setting.key, e.target.value)}
            />
          </div>
        );
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <div className="space-y-2">
          <div className="h-10 w-64 animate-pulse rounded-md bg-slate-100 dark:bg-slate-800" />
          <div className="h-5 w-96 animate-pulse rounded-md bg-slate-100 dark:bg-slate-800" />
        </div>
        <div className="h-150 animate-pulse rounded-md bg-slate-100 dark:bg-slate-800" />
      </div>
    );
  }

  const hasChanges = Object.keys(changedSettings).length > 0;

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Settings className="h-7 w-7" />
          Impostazioni Sistema
        </h1>
        <p className="text-slate-600 dark:text-slate-400 mt-1">
          Configura le impostazioni globali del sistema
        </p>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 lg:grid-cols-10">
          {Object.values(SETTING_GROUPS).map((group) => {
            const Icon =
              iconMap[group.icon as keyof typeof iconMap] || Settings;
            return (
              <TabsTrigger key={group.key} value={group.key} className="gap-2">
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{group.label}</span>
              </TabsTrigger>
            );
          })}
        </TabsList>

        {/* Company Settings Tab */}
        <TabsContent value="company" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    {SETTING_GROUPS.COMPANY.label}
                  </CardTitle>
                  <CardDescription>
                    {SETTING_GROUPS.COMPANY.description}
                  </CardDescription>
                </div>
                {getSettingsByGroup("company").length > 0 && (
                  <Button
                    onClick={() => handleSaveSettings("company")}
                    disabled={bulkUpdateMutation.isPending || !hasChanges}
                  >
                    {bulkUpdateMutation.isPending ? (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                        Salvataggio...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Salva Modifiche
                      </>
                    )}
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {getSettingsByGroup("company").length === 0 ? (
                <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                  <Building2 className="mx-auto h-12 w-12 text-slate-300 dark:text-slate-700 mb-3" />
                  <p>Nessuna impostazione azienda configurata</p>
                  <p className="text-sm mt-1">
                    Contatta l&apos;amministratore per aggiungere impostazioni
                  </p>
                </div>
              ) : (
                <div className="grid gap-6 md:grid-cols-2">
                  {getSettingsByGroup("company").map((setting: Setting) => (
                    <div key={setting.key}>{renderSettingInput(setting)}</div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Other Settings Tabs - Generated dynamically */}
        {[
          "general",
          "theme",
          "ui",
          "warehouse",
          "email",
          "notifications",
          "files",
          "pricing",
        ].map((groupKey) => {
          const group = Object.values(SETTING_GROUPS).find(
            (g) => g.key === groupKey,
          );
          if (!group) return null;

          const Icon = iconMap[group.icon as keyof typeof iconMap] || Settings;
          const groupSettings = getSettingsByGroup(groupKey);

          return (
            <TabsContent key={groupKey} value={groupKey} className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Icon className="h-5 w-5" />
                        {group.label}
                      </CardTitle>
                      <CardDescription>{group.description}</CardDescription>
                    </div>
                    {groupSettings.length > 0 && (
                      <Button
                        onClick={() => handleSaveSettings(groupKey)}
                        disabled={bulkUpdateMutation.isPending || !hasChanges}
                      >
                        {bulkUpdateMutation.isPending ? (
                          <>
                            <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                            Salvataggio...
                          </>
                        ) : (
                          <>
                            <Save className="mr-2 h-4 w-4" />
                            Salva Modifiche
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {groupSettings.length === 0 ? (
                    <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                      <Icon className="mx-auto h-12 w-12 text-slate-300 dark:text-slate-700 mb-3" />
                      <p>
                        Nessuna impostazione configurata per{" "}
                        {group.label.toLowerCase()}
                      </p>
                      <p className="text-sm mt-1">
                        Contatta l&apos;amministratore per aggiungere
                        impostazioni
                      </p>
                    </div>
                  ) : (
                    <div className="grid gap-6 md:grid-cols-2">
                      {groupSettings.map((setting: Setting) => (
                        <div key={setting.key}>
                          {renderSettingInput(setting)}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          );
        })}

        {/* Feature Flags Tab */}
        <TabsContent value="features" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Flag className="h-5 w-5" />
                    {SETTING_GROUPS.FEATURES.label}
                  </CardTitle>
                  <CardDescription>
                    {SETTING_GROUPS.FEATURES.description}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {isLoadingFlags ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="h-12 animate-pulse rounded-md bg-slate-100 dark:bg-slate-800"
                    />
                  ))}
                </div>
              ) : featureFlags.length === 0 ? (
                <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                  <Flag className="mx-auto h-12 w-12 text-slate-300 dark:text-slate-700 mb-3" />
                  <p>Nessuna feature flag configurata</p>
                  <p className="text-sm mt-1">
                    Le feature flags permettono di abilitare/disabilitare
                    funzionalità senza rilasci
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {featureFlags.map((flag: Setting) => (
                    <div
                      key={flag.key}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="font-medium">
                          {flag.description || flag.key}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {flag.description}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          Key: <code className="font-mono">{flag.key}</code>
                        </div>
                      </div>
                      <Switch
                        checked={flag.value === "true" || flag.value === "1"}
                        onCheckedChange={(enabled) =>
                          toggleFeatureMutation.mutate({
                            key: flag.key,
                            enabled,
                          })
                        }
                        disabled={toggleFeatureMutation.isPending}
                      />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
