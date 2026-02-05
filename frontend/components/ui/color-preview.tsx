"use client";

import { useThemeSettings } from "@/hooks/use-settings";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

/**
 * Componente per preview dei colori configurati nelle settings
 */
export function ColorPreview() {
  const { primaryColor, secondaryColor } = useThemeSettings();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Anteprima Colori</CardTitle>
        <CardDescription>
          Colori configurati nelle impostazioni tema
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Colore Primario */}
        <div className="space-y-2">
          <p className="text-sm font-medium">
            Colore Primario ({primaryColor})
          </p>
          <div className="flex flex-wrap gap-2">
            <Button>Button Primary</Button>
            <Button variant="outline">Button Outline</Button>
            <Badge>Badge Default</Badge>
            <Badge variant="secondary">Badge Secondary</Badge>
            <Badge variant="destructive">Badge Destructive</Badge>
          </div>
          <div
            className="h-20 rounded-md border"
            style={{ backgroundColor: primaryColor }}
          />
        </div>

        {/* Colore Secondario */}
        <div className="space-y-2">
          <p className="text-sm font-medium">
            Colore Secondario ({secondaryColor})
          </p>
          <div
            className="h-20 rounded-md border"
            style={{ backgroundColor: secondaryColor }}
          />
        </div>

        {/* Esempi di componenti che usano --primary */}
        <div className="space-y-2">
          <p className="text-sm font-medium">
            Componenti con CSS variable --primary
          </p>
          <div className="space-y-2">
            <div className="h-4 bg-primary rounded" />
            <div className="h-4 bg-primary/80 rounded" />
            <div className="h-4 bg-primary/60 rounded" />
            <div className="h-4 bg-primary/40 rounded" />
            <div className="h-4 bg-primary/20 rounded" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
