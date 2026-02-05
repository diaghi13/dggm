"use client";

import { useAuthStore } from "@/stores/auth-store";
import { useThemeSettings } from "@/hooks/use-settings";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function SettingsDebug() {
  const settings = useAuthStore((state) => state.settings);
  const { primaryColor, secondaryColor, logoUrl, faviconUrl } =
    useThemeSettings();

  return (
    <Card className="border-yellow-500">
      <CardHeader>
        <CardTitle>🐛 Debug Settings</CardTitle>
        <CardDescription>Verifica dati da auth store</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="font-semibold">Hook useThemeSettings():</p>
          <pre className="bg-muted p-2 rounded text-xs mt-2">
            {JSON.stringify(
              { primaryColor, secondaryColor, logoUrl, faviconUrl },
              null,
              2,
            )}
          </pre>
        </div>

        <div>
          <p className="font-semibold">Store settings.global (raw):</p>
          <pre className="bg-muted p-2 rounded text-xs mt-2 max-h-96 overflow-auto">
            {JSON.stringify(settings?.global, null, 2)}
          </pre>
        </div>

        <div>
          <p className="font-semibold">🔑 TUTTE le keys in settings.global:</p>
          <pre className="bg-muted p-2 rounded text-xs mt-2 max-h-48 overflow-auto">
            {JSON.stringify(Object.keys(settings?.global || {}), null, 2)}
          </pre>
        </div>

        <div>
          <p className="font-semibold">
            Keys che contengono "theme", "color", "primary", "secondary":
          </p>
          <ul className="text-sm space-y-1 mt-2">
            {Object.entries(settings?.global || {})
              .filter(
                ([key]) =>
                  key.includes("theme") ||
                  key.includes("color") ||
                  key.includes("primary") ||
                  key.includes("secondary"),
              )
              .map(([key, value]) => (
                <li key={key} className="bg-muted p-2 rounded">
                  <span className="font-mono text-xs font-bold">{key}</span>:
                  <span className="ml-2">{String(value)}</span>
                </li>
              ))}
            {Object.keys(settings?.global || {}).filter(
              (key) =>
                key.includes("theme") ||
                key.includes("color") ||
                key.includes("primary") ||
                key.includes("secondary"),
            ).length === 0 && (
              <li className="text-red-500 font-bold">
                ⚠️ NESSUNA chiave trovata!
              </li>
            )}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
