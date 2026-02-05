"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  useSettings,
  useUISettings,
  useThemeSettings,
  useAppSettings,
  useFeatureFlags,
  useFeatureFlag,
} from "@/hooks/use-settings";
import { ColorPreview } from "@/components/ui/color-preview";
import { SettingsDebug } from "@/components/settings/settings-debug";

/**
 * Componente demo per mostrare l'utilizzo delle settings e feature flags
 * Tutti i dati vengono caricati da auth/me, nessuna chiamata API extra
 */
export function SettingsDemo() {
  const allSettings = useSettings();
  const uiSettings = useUISettings();
  const themeSettings = useThemeSettings();
  const appSettings = useAppSettings();
  const featureFlags = useFeatureFlags();

  // Test individual feature flags
  const hasSemanticSearch = useFeatureFlag("features.enable_semantic_search");
  const hasNotifications = useFeatureFlag("features.enable_notifications");

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Settings & Feature Flags Demo</h1>
        <p className="text-muted-foreground">
          Tutte le settings e feature flags vengono caricate da auth/me, nessuna
          chiamata API extra
        </p>
      </div>

      {/* Color Preview */}
      <ColorPreview />

      {/* Debug Settings */}
      <SettingsDebug />

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* App Settings */}
        <Card>
          <CardHeader>
            <CardTitle>App Settings</CardTitle>
            <CardDescription>Configurazione applicazione</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <p className="text-sm font-medium">Nome App</p>
              <p className="text-sm text-muted-foreground">
                {appSettings.name}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium">Lingua</p>
              <p className="text-sm text-muted-foreground">
                {appSettings.locale}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium">Timezone</p>
              <p className="text-sm text-muted-foreground">
                {appSettings.timezone}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* UI Settings */}
        <Card>
          <CardHeader>
            <CardTitle>UI Settings</CardTitle>
            <CardDescription>Preferenze interfaccia</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <p className="text-sm font-medium">Colore Primario</p>
              <div className="flex items-center gap-2">
                <div
                  className="w-6 h-6 rounded border"
                  style={{ backgroundColor: uiSettings.primaryColor }}
                />
                <p className="text-sm text-muted-foreground">
                  {uiSettings.primaryColor}
                </p>
              </div>
            </div>
            <div>
              <p className="text-sm font-medium">Tema</p>
              <p className="text-sm text-muted-foreground">
                {uiSettings.theme}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium">Items per pagina</p>
              <p className="text-sm text-muted-foreground">
                {uiSettings.itemsPerPage}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium">Formato data</p>
              <p className="text-sm text-muted-foreground">
                {uiSettings.dateFormat}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Theme Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Theme Settings</CardTitle>
            <CardDescription>Colori e branding</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <p className="text-sm font-medium">Colore Primario</p>
              <div className="flex items-center gap-2">
                <div
                  className="w-6 h-6 rounded border"
                  style={{ backgroundColor: themeSettings.primaryColor }}
                />
                <p className="text-sm text-muted-foreground">
                  {themeSettings.primaryColor}
                </p>
              </div>
            </div>
            <div>
              <p className="text-sm font-medium">Colore Secondario</p>
              <div className="flex items-center gap-2">
                <div
                  className="w-6 h-6 rounded border"
                  style={{ backgroundColor: themeSettings.secondaryColor }}
                />
                <p className="text-sm text-muted-foreground">
                  {themeSettings.secondaryColor}
                </p>
              </div>
            </div>
            <div>
              <p className="text-sm font-medium">Logo URL</p>
              <p className="text-sm text-muted-foreground">
                {themeSettings.logoUrl}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Feature Flags */}
        <Card className="md:col-span-2 lg:col-span-3">
          <CardHeader>
            <CardTitle>Feature Flags</CardTitle>
            <CardDescription>
              Features abilitate ({featureFlags.length})
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {featureFlags.map((flag) => (
                <Badge key={flag} variant="secondary">
                  {flag}
                </Badge>
              ))}
            </div>

            <div className="mt-4 space-y-2">
              <p className="text-sm font-medium">Test individuali:</p>
              <div className="flex gap-2">
                <Badge variant={hasSemanticSearch ? "default" : "outline"}>
                  Semantic Search: {hasSemanticSearch ? "✓" : "✗"}
                </Badge>
                <Badge variant={hasNotifications ? "default" : "outline"}>
                  Notifications: {hasNotifications ? "✓" : "✗"}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* All Settings */}
        <Card className="md:col-span-2 lg:col-span-3">
          <CardHeader>
            <CardTitle>Tutte le Settings</CardTitle>
            <CardDescription>Dati grezzi da auth/me</CardDescription>
          </CardHeader>
          <CardContent>
            <pre className="text-xs bg-muted p-4 rounded-lg overflow-auto max-h-96">
              {JSON.stringify(allSettings, null, 2)}
            </pre>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
