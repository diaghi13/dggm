'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { siteMaterialsApi } from '@/lib/api/site-materials';
import { Plus, Briefcase, TrendingUp, TrendingDown, AlertCircle, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { AddSiteMaterialDialog } from '@/app/(dashboard)/sites/_components/add-site-material-dialog';
import { LogMaterialUsageDialog } from '@/components/log-material-usage-dialog';

interface SiteMaterial {
  id: number;
  material_id: number;
  material: {
    id: number;
    code: string;
    name: string;
    unit: string;
    product_type: string;
  };
  planned_quantity: number;
  used_quantity: number;
  planned_unit_cost: number;
  actual_unit_cost: number;
  status: string;
  notes?: string;
  is_extra: boolean;
  extra_reason?: string;
}

interface SiteServicesSectionProps {
  siteId: number;
  onServicesChange?: () => void;
}

export function SiteServicesSection({
  siteId,
  onServicesChange,
}: SiteServicesSectionProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isLogUsageDialogOpen, setIsLogUsageDialogOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<SiteMaterial | null>(null);

  // Fetch services from API (only service type)
  const { data: services = [], isLoading, refetch } = useQuery({
    queryKey: ['site-services', siteId],
    queryFn: () => siteMaterialsApi.getAll(siteId, { product_type: 'service' }),
    enabled: !!siteId,
  });

  // Calculate statistics
  const extraServices = services.filter((s: SiteMaterial) => s.is_extra);
  const stats = {
    totalPlanned: services.reduce((sum: number, s: SiteMaterial) =>
      sum + (Number(s.planned_quantity || 0) * Number(s.planned_unit_cost || 0)), 0),
    totalActual: services.reduce((sum: number, s: SiteMaterial) =>
      sum + (Number(s.used_quantity || 0) * Number(s.actual_unit_cost || 0)), 0),
    totalServices: services.length,
    completed: services.filter((s: SiteMaterial) =>
      Number(s.used_quantity || 0) >= Number(s.planned_quantity || 0)).length,
    extraServices: extraServices.length,
    extraCost: extraServices.reduce((sum: number, s: SiteMaterial) =>
      sum + (Number(s.used_quantity || 0) * Number(s.actual_unit_cost || 0)), 0),
  };

  const variance = stats.totalPlanned - stats.totalActual;
  const variancePercentage = stats.totalPlanned > 0
    ? ((variance / stats.totalPlanned) * 100)
    : 0;

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      planned: { label: 'Pianificato', color: 'bg-slate-100 text-slate-700' },
      in_use: { label: 'In Corso', color: 'bg-blue-100 text-blue-700' },
      completed: { label: 'Completato', color: 'bg-green-100 text-green-700' },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.planned;

    return (
      <Badge variant="outline" className={config.color}>
        {config.label}
      </Badge>
    );
  };

  const getUsageProgress = (service: SiteMaterial) => {
    const planned = Number(service.planned_quantity || 0);
    if (planned === 0) return 0;
    return (Number(service.used_quantity || 0) / planned) * 100;
  };

  const getCostVariance = (service: SiteMaterial) => {
    const planned = Number(service.planned_quantity || 0) * Number(service.planned_unit_cost || 0);
    const actual = Number(service.used_quantity || 0) * Number(service.actual_unit_cost || 0);
    return planned - actual;
  };

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Totale Servizi</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalServices}</div>
            <p className="text-xs text-muted-foreground">
              {stats.completed} completati
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Servizi Extra</CardTitle>
            <Star className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.extraServices}</div>
            <p className="text-xs text-muted-foreground">
              € {stats.extraCost.toFixed(2)} costo
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Costo Pianificato</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">€ {stats.totalPlanned.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Budget servizi</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Costo Effettivo</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">€ {stats.totalActual.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Consuntivo ad oggi</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Varianza</CardTitle>
            <AlertCircle className={`h-4 w-4 ${variance >= 0 ? 'text-green-600' : 'text-red-600'}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${variance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              € {variance.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              {variancePercentage >= 0 ? '+' : ''}{variancePercentage.toFixed(1)}%
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Services Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Servizi</CardTitle>
              <CardDescription>
                Gestisci i servizi (ore lavoro, noleggi, trasporti) per questo cantiere
              </CardDescription>
            </div>
            <Button onClick={() => setIsAddDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Aggiungi Servizio
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {services.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Briefcase className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nessun servizio</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Inizia ad aggiungere servizi a questo cantiere
              </p>
              <Button onClick={() => setIsAddDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Aggiungi Primo Servizio
              </Button>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Codice</TableHead>
                    <TableHead>Nome</TableHead>
                    <TableHead className="text-right">Pianificato</TableHead>
                    <TableHead className="text-right">Utilizzato</TableHead>
                    <TableHead>Progresso</TableHead>
                    <TableHead className="text-right">Costo Unit. P.</TableHead>
                    <TableHead className="text-right">Costo Unit. E.</TableHead>
                    <TableHead className="text-right">Varianza</TableHead>
                    <TableHead>Stato</TableHead>
                    <TableHead className="text-right">Azioni</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {services.map((service: SiteMaterial) => {
                    const progress = getUsageProgress(service);
                    const costVariance = getCostVariance(service);

                    return (
                      <TableRow key={service.id}>
                        <TableCell className="font-medium">
                          {service.material.code}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {service.material.name}
                            {service.is_extra && (
                              <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700 border-amber-200">
                                <Star className="h-3 w-3 mr-1" />
                                EXTRA
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          {service.planned_quantity} {service.material.unit}
                        </TableCell>
                        <TableCell className="text-right">
                          {service.used_quantity} {service.material.unit}
                        </TableCell>
                        <TableCell>
                          <div className="w-24">
                            <Progress value={Math.min(progress, 100)} className="h-2" />
                            <span className="text-xs text-muted-foreground">
                              {progress.toFixed(0)}%
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          € {Number(service.planned_unit_cost || 0).toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right">
                          € {Number(service.actual_unit_cost || 0).toFixed(2)}
                        </TableCell>
                        <TableCell className={`text-right ${costVariance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          € {Number(costVariance || 0).toFixed(2)}
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(service.status)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedService(service);
                              setIsLogUsageDialogOpen(true);
                            }}
                          >
                            Registra Ore
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Service Dialog */}
      <AddSiteMaterialDialog
        siteId={siteId}
        open={isAddDialogOpen}
        onOpenChange={(open) => {
          setIsAddDialogOpen(open);
          if (!open) {
            refetch();
            onServicesChange?.();
          }
        }}
      />

      {/* Log Usage Dialog */}
      <LogMaterialUsageDialog
        siteId={siteId}
        material={selectedService}
        open={isLogUsageDialogOpen}
        onOpenChange={(open) => {
          setIsLogUsageDialogOpen(open);
          if (!open) {
            setSelectedService(null);
            refetch();
            onServicesChange?.();
          }
        }}
      />
    </div>
  );
}
