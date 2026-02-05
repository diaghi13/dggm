"use client";

import {
  FeatureFlag,
  FeatureFlagAll,
  FeatureFlagAny,
} from "@/components/features/feature-flag";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Package, Search, FileText, Bell } from "lucide-react";

/**
 * Esempi di utilizzo delle feature flags nell'applicazione
 */
export function FeatureFlagExamples() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>🎯 Esempi Feature Flags</CardTitle>
          <CardDescription>
            Mostra funzionalità in base alle feature flags abilitate
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Esempio 1: Feature singola */}
          <div>
            <h3 className="font-medium mb-2">
              1. Feature Singola - GPS Tracking
            </h3>
            <FeatureFlag
              flag="features.enable_gps_tracking"
              fallback={
                <div className="text-sm text-muted-foreground">
                  GPS Tracking non disponibile (feature disabilitata)
                </div>
              }
            >
              <Button variant="default" className="gap-2">
                <MapPin className="h-4 w-4" />
                Traccia Posizione GPS
              </Button>
            </FeatureFlag>
          </div>

          {/* Esempio 2: Feature con fallback */}
          <div>
            <h3 className="font-medium mb-2">
              2. Con Fallback - Richieste Materiali
            </h3>
            <FeatureFlag
              flag="features.enable_material_requests"
              fallback={
                <Badge variant="secondary">
                  Richieste Materiali - Prossimamente
                </Badge>
              }
            >
              <Button variant="default" className="gap-2">
                <Package className="h-4 w-4" />
                Nuova Richiesta Materiale
              </Button>
            </FeatureFlag>
          </div>

          {/* Esempio 3: Tutte le features richieste */}
          <div>
            <h3 className="font-medium mb-2">
              3. Tutte Richieste - Ricerca Avanzata (serve search +
              notifications)
            </h3>
            <FeatureFlagAll
              flags={[
                "features.enable_semantic_search",
                "features.enable_notifications",
              ]}
              fallback={
                <div className="text-sm text-muted-foreground">
                  Ricerca avanzata richiede sia Semantic Search che Notifiche
                </div>
              }
            >
              <Button variant="default" className="gap-2">
                <Search className="h-4 w-4" />
                Ricerca Avanzata con Notifiche
              </Button>
            </FeatureFlagAll>
          </div>

          {/* Esempio 4: Almeno una feature */}
          <div>
            <h3 className="font-medium mb-2">
              4. Almeno Una - PDF o Notifiche
            </h3>
            <FeatureFlagAny
              flags={[
                "features.enable_pdf_generation",
                "features.enable_notifications",
              ]}
              fallback={
                <div className="text-sm text-muted-foreground">
                  Nessuna opzione di esportazione disponibile
                </div>
              }
            >
              <div className="flex gap-2">
                <FeatureFlag flag="features.enable_pdf_generation">
                  <Button variant="outline" size="sm" className="gap-2">
                    <FileText className="h-4 w-4" />
                    Esporta PDF
                  </Button>
                </FeatureFlag>
                <FeatureFlag flag="features.enable_notifications">
                  <Button variant="outline" size="sm" className="gap-2">
                    <Bell className="h-4 w-4" />
                    Notifica
                  </Button>
                </FeatureFlag>
              </div>
            </FeatureFlagAny>
          </div>

          {/* Esempio 5: Sezione intera condizionale */}
          <FeatureFlag flag="features.enable_semantic_search">
            <div className="border-t pt-4">
              <h3 className="font-medium mb-2">
                🎉 Funzionalità Sperimentale - Ricerca Semantica
              </h3>
              <p className="text-sm text-muted-foreground mb-3">
                Questa funzionalità è disponibile perché hai abilitato la
                ricerca semantica.
              </p>
              <Card className="bg-primary/5 border-primary/20">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <Search className="h-8 w-8 text-primary" />
                    <div>
                      <h4 className="font-medium">Ricerca Intelligente</h4>
                      <p className="text-sm text-muted-foreground">
                        Trova risultati basati sul contesto e significato
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </FeatureFlag>
        </CardContent>
      </Card>
    </div>
  );
}
