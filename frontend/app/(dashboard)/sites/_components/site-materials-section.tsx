'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { siteMaterialsApi } from '@/lib/api/site-materials';
import { Plus, Package, TrendingUp, TrendingDown, AlertCircle, Star, TruckIcon, PackagePlus, ArrowRightLeft } from 'lucide-react';
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
import { DeliverMaterialDialog } from '@/components/deliver-material-dialog';
import { ReturnMaterialDialog } from '@/components/return-material-dialog';
import { TransferMaterialDialog } from '@/components/transfer-material-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';

interface SiteMaterial {
  id: number;
  material_id: number;
  material: {
    id: number;
    code: string;
    name: string;
    unit: string;
    product_type: string;
    is_kit: boolean;
  };
  planned_quantity: number;
  allocated_quantity: number;
  delivered_quantity: number;
  used_quantity: number;
  returned_quantity: number;
  planned_unit_cost: number;
  actual_unit_cost: number;
  status: string;
  status_label?: string;
  status_color?: string;
  required_date?: string;
  delivery_date?: string;
  notes?: string;
  is_extra: boolean;
  extra_reason?: string;
  requested_by?: number;
  requested_at?: string;
  requested_by_user?: {
    id: number;
    name: string;
    email: string;
  };
  pending_ddt?: {
    id: number;
    code: string;
    status: string;
    ddt_date: string;
  } | null;
}

interface SiteMaterialsSectionProps {
  siteId: number;
  onMaterialsChange?: () => void;
}

export function SiteMaterialsSection({
  siteId,
  onMaterialsChange,
}: SiteMaterialsSectionProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isDeliverDialogOpen, setIsDeliverDialogOpen] = useState(false);
  const [isReturnDialogOpen, setIsReturnDialogOpen] = useState(false);
  const [isTransferDialogOpen, setIsTransferDialogOpen] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState<SiteMaterial | null>(null);

  // Fetch materials from API (physical products + kits, no services)
  const { data: materials = [], isLoading, refetch } = useQuery({
    queryKey: ['site-materials', siteId],
    queryFn: async () => {
      // Fetch all and filter out services client-side
      // (backend doesn't support multiple product_type filter yet)
      const all = await siteMaterialsApi.getAll(siteId);
      return all.filter((m: SiteMaterial) => m.material.product_type !== 'service');
    },
    enabled: !!siteId,
  });

  // Calculate statistics
  const extraMaterials = materials.filter((m: SiteMaterial) => m.is_extra);
  const stats = {
    totalPlanned: materials.reduce((sum: number, m: SiteMaterial) =>
      sum + (Number(m.planned_quantity || 0) * Number(m.planned_unit_cost || 0)), 0),
    totalActual: materials.reduce((sum: number, m: SiteMaterial) => {
      const netQuantity = Number(m.delivered_quantity || 0) - Number(m.returned_quantity || 0);
      return sum + (netQuantity * Number(m.actual_unit_cost || 0));
    }, 0),
    totalMaterials: materials.length,
    depleted: materials.filter((m: SiteMaterial) => {
      const netQuantity = Number(m.delivered_quantity || 0) - Number(m.returned_quantity || 0);
      return netQuantity >= Number(m.planned_quantity || 0);
    }).length,
    extraMaterials: extraMaterials.length,
    extraCost: extraMaterials.reduce((sum: number, m: SiteMaterial) => {
      const netQuantity = Number(m.delivered_quantity || 0) - Number(m.returned_quantity || 0);
      return sum + (netQuantity * Number(m.actual_unit_cost || 0));
    }, 0),
  };

  const variance = stats.totalPlanned - stats.totalActual;
  const variancePercentage = stats.totalPlanned > 0
    ? ((variance / stats.totalPlanned) * 100)
    : 0;

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      planned: { label: 'Pianificato', color: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300' },
      reserved: { label: 'Riservato', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' },
      partial: { label: 'Parziale', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300' },
      delivered: { label: 'Consegnato', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300' },
      completed: { label: 'Completato', color: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.planned;

    return (
      <Badge variant="outline" className={config.color}>
        {config.label}
      </Badge>
    );
  };

  const getUsageProgress = (material: SiteMaterial) => {
    const planned = Number(material.planned_quantity || 0);
    if (planned === 0) return 0;
    const netQuantity = Number(material.delivered_quantity || 0) - Number(material.returned_quantity || 0);
    return (netQuantity / planned) * 100;
  };

  const getCostVariance = (material: SiteMaterial) => {
    const planned = Number(material.planned_quantity || 0) * Number(material.planned_unit_cost || 0);
    const netQuantity = Number(material.delivered_quantity || 0) - Number(material.returned_quantity || 0);
    const actual = netQuantity * Number(material.actual_unit_cost || 0);
    return planned - actual;
  };

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Totale Materiali</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalMaterials}</div>
            <p className="text-xs text-muted-foreground">
              {stats.depleted} completati
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Materiali Extra</CardTitle>
            <Star className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.extraMaterials}</div>
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
            <p className="text-xs text-muted-foreground">Budget materiali</p>
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

      {/* Materials Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Materiali</CardTitle>
              <CardDescription>
                Gestisci i materiali assegnati a questo cantiere
              </CardDescription>
            </div>
            <Button onClick={() => setIsAddDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Aggiungi Materiale
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {materials.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Package className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nessun materiale</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Inizia ad aggiungere materiali a questo cantiere
              </p>
              <Button onClick={() => setIsAddDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Aggiungi Primo Materiale
              </Button>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Codice</TableHead>
                    <TableHead>Nome</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead className="text-right">Pianificato</TableHead>
                    <TableHead className="text-right">Consegnato</TableHead>
                    <TableHead className="text-right">Restituito</TableHead>
                    <TableHead>Progresso</TableHead>
                    <TableHead className="text-right">Costo Unit. P.</TableHead>
                    <TableHead className="text-right">Costo Unit. E.</TableHead>
                    <TableHead className="text-right">Varianza</TableHead>
                    <TableHead>Stato</TableHead>
                    <TableHead className="text-right">Azioni</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {materials.map((material: SiteMaterial) => {
                    const progress = getUsageProgress(material);
                    const costVariance = getCostVariance(material);

                    return (
                      <TableRow key={material.id}>
                        <TableCell className="font-medium">
                          {material.material.code}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 flex-wrap">
                            {material.material.name}
                            {material.material.is_kit && (
                              <Badge variant="secondary" className="text-xs">
                                KIT
                              </Badge>
                            )}
                            {material.is_extra && (
                              <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300">
                                <Star className="h-3 w-3 mr-1" />
                                EXTRA
                              </Badge>
                            )}
                            {material.pending_ddt && (
                              <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300">
                                <TruckIcon className="h-3 w-3 mr-1" />
                                DDT {material.pending_ddt.code}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {material.material.product_type}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {material.planned_quantity} {material.material.unit}
                        </TableCell>
                        <TableCell className="text-right">
                          {material.delivered_quantity} {material.material.unit}
                        </TableCell>
                        <TableCell className="text-right">
                          {material.returned_quantity > 0 ? (
                            <span className="text-blue-600">
                              {material.returned_quantity} {material.material.unit}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
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
                          € {Number(material.planned_unit_cost || 0).toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right">
                          € {Number(material.actual_unit_cost || 0).toFixed(2)}
                        </TableCell>
                        <TableCell className={`text-right ${costVariance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          € {Number(costVariance || 0).toFixed(2)}
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(material.status)}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="outline" size="sm">
                                Azioni
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedMaterial(material);
                                  setIsDeliverDialogOpen(true);
                                }}
                                className="flex items-center gap-2"
                                disabled={!!material.pending_ddt}
                              >
                                <TruckIcon className="h-4 w-4 text-green-600" />
                                <span>
                                  {material.pending_ddt
                                    ? `DDT ${material.pending_ddt.code} in transito`
                                    : 'Consegna Materiale'}
                                </span>
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedMaterial(material);
                                  setIsReturnDialogOpen(true);
                                }}
                                className="flex items-center gap-2"
                                disabled={material.delivered_quantity - material.returned_quantity <= 0}
                              >
                                <PackagePlus className="h-4 w-4 text-blue-600" />
                                <span>Rientro Avanzi</span>
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedMaterial(material);
                                  setIsTransferDialogOpen(true);
                                }}
                                className="flex items-center gap-2"
                                disabled={material.delivered_quantity - material.returned_quantity <= 0}
                              >
                                <ArrowRightLeft className="h-4 w-4 text-purple-600" />
                                <span>Trasferisci a Cantiere</span>
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
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

      {/* Add Material Dialog */}
      <AddSiteMaterialDialog
        siteId={siteId}
        open={isAddDialogOpen}
        onOpenChange={(open) => {
          setIsAddDialogOpen(open);
          if (!open) {
            refetch();
            onMaterialsChange?.();
          }
        }}
      />

      {/* Deliver Material Dialog */}
      <DeliverMaterialDialog
        siteId={siteId}
        material={selectedMaterial}
        open={isDeliverDialogOpen}
        onOpenChange={(open) => {
          setIsDeliverDialogOpen(open);
          if (!open) {
            setSelectedMaterial(null);
            refetch();
            onMaterialsChange?.();
          }
        }}
      />

      {/* Return Material Dialog */}
      <ReturnMaterialDialog
        siteId={siteId}
        material={selectedMaterial}
        open={isReturnDialogOpen}
        onOpenChange={(open) => {
          setIsReturnDialogOpen(open);
          if (!open) {
            setSelectedMaterial(null);
            refetch();
            onMaterialsChange?.();
          }
        }}
      />

      {/* Transfer Material Dialog */}
      <TransferMaterialDialog
        siteId={siteId}
        material={selectedMaterial}
        open={isTransferDialogOpen}
        onOpenChange={(open) => {
          setIsTransferDialogOpen(open);
          if (!open) {
            setSelectedMaterial(null);
            refetch();
            onMaterialsChange?.();
          }
        }}
      />
    </div>
  );
}
