"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { projectMaterialsApi } from "@/lib/api/project-materials";
import {
  Plus,
  Package,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  Star,
  TruckIcon,
  PackagePlus,
  ArrowRightLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { CurrencyDisplay } from "@/components/ui/currency-input";
import { AddProjectMaterialDialog } from "@/app/(dashboard)/projects/_components/add-project-material-dialog";
import { ProjectMaterialOrderList } from "@/app/(dashboard)/projects/_components/project-material-order-list";
import { DeliverMaterialDialog } from "@/components/deliver-material-dialog";
import { ReturnMaterialDialog } from "@/components/return-material-dialog";
import { TransferMaterialDialog } from "@/components/transfer-material-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ClipboardList } from "lucide-react";

interface ProjectMaterialsSectionProps {
  projectId: number;
  onMaterialsChange?: () => void;
}

export function ProjectMaterialsSection({
  projectId,
  onMaterialsChange,
}: ProjectMaterialsSectionProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isDeliverDialogOpen, setIsDeliverDialogOpen] = useState(false);
  const [isReturnDialogOpen, setIsReturnDialogOpen] = useState(false);
  const [isTransferDialogOpen, setIsTransferDialogOpen] = useState(false);
  const [selectedMaterial, setSelectedMaterial] =
    useState<App.Data.ProjectMaterialData | null>(null);

  // Fetch materials from API (physical products + kits, no services)
  const {
    data: materials = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["project-materials", projectId],
    queryFn: async () => {
      // Fetch all and filter out services client-side
      // (backend doesn't support multiple product_type filter yet)
      const all = await projectMaterialsApi.getAll(projectId);
      return all.filter(
        (m: App.Data.ProjectMaterialData) =>
          m.product?.product_type !== "service",
      );
    },
    enabled: !!projectId,
  });

  // Calculate statistics
  const extraMaterials = materials.filter(
    (m: App.Data.ProjectMaterialData) => m.is_extra,
  );
  const stats = {
    totalPlanned: materials.reduce(
      (sum: number, m: App.Data.ProjectMaterialData) =>
        sum +
        Number(m.planned_quantity || 0) * Number(m.planned_unit_cost || 0),
      0,
    ),
    totalActual: materials.reduce(
      (sum: number, m: App.Data.ProjectMaterialData) => {
        const netQuantity =
          Number(m.delivered_quantity || 0) - Number(m.returned_quantity || 0);
        return sum + netQuantity * Number(m.actual_unit_cost || 0);
      },
      0,
    ),
    totalMaterials: materials.length,
    depleted: materials.filter((m: App.Data.ProjectMaterialData) => {
      const netQuantity =
        Number(m.delivered_quantity || 0) - Number(m.returned_quantity || 0);
      return netQuantity >= Number(m.planned_quantity || 0);
    }).length,
    extraMaterials: extraMaterials.length,
    extraCost: extraMaterials.reduce(
      (sum: number, m: App.Data.ProjectMaterialData) => {
        const netQuantity =
          Number(m.delivered_quantity || 0) - Number(m.returned_quantity || 0);
        return sum + netQuantity * Number(m.actual_unit_cost || 0);
      },
      0,
    ),
  };

  const variance = stats.totalPlanned - stats.totalActual;
  const variancePercentage =
    stats.totalPlanned > 0 ? (variance / stats.totalPlanned) * 100 : 0;

  const getStatusBadge = (status: string | null) => {
    const statusConfig = {
      planned: {
        label: "Pianificato",
        color:
          "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
      },
      reserved: {
        label: "Riservato",
        color: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
      },
      partial: {
        label: "Parziale",
        color:
          "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300",
      },
      delivered: {
        label: "Consegnato",
        color:
          "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300",
      },
      completed: {
        label: "Completato",
        color:
          "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
      },
    };

    const config =
      statusConfig[status as keyof typeof statusConfig] || statusConfig.planned;

    return (
      <Badge variant="outline" className={config.color}>
        {config.label}
      </Badge>
    );
  };

  const getUsageProgress = (material: App.Data.ProjectMaterialData) => {
    const planned = Number(material.planned_quantity || 0);
    if (planned === 0) return 0;
    const netQuantity =
      Number(material.delivered_quantity || 0) -
      Number(material.returned_quantity || 0);
    return (netQuantity / planned) * 100;
  };

  const getCostVariance = (material: App.Data.ProjectMaterialData) => {
    const planned =
      Number(material.planned_quantity || 0) *
      Number(material.planned_unit_cost || 0);
    const netQuantity =
      Number(material.delivered_quantity || 0) -
      Number(material.returned_quantity || 0);
    const actual = netQuantity * Number(material.actual_unit_cost || 0);
    return planned - actual;
  };

  // Map ProjectMaterialData to the structure expected by dialog components
  const mapMaterialForDialog = (material: App.Data.ProjectMaterialData) => ({
    id: material.id || 0,
    product_id: material.product_id || 0,
    product: {
      name: material.product?.name || material.product_name || "",
      code: material.product?.code || material.product_code || "",
      unit: material.product?.unit || "",
    },
    planned_quantity: Number(material.planned_quantity || 0),
    delivered_quantity: Number(material.delivered_quantity || 0),
    returned_quantity: Number(material.returned_quantity || 0),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 border-4 border-slate-200 border-t-slate-600 rounded-full animate-spin" />
          <p className="text-sm text-slate-500">Caricamento materiali...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Totale Materiali
            </CardTitle>
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
            <CardTitle className="text-sm font-medium">
              Materiali Extra
            </CardTitle>
            <Star className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.extraMaterials}</div>
            <p className="text-xs text-muted-foreground">
              <CurrencyDisplay value={stats.extraCost} /> costo
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Costo Pianificato
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              <CurrencyDisplay value={stats.totalPlanned} />
            </div>
            <p className="text-xs text-muted-foreground">Budget materiali</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Costo Effettivo
            </CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              <CurrencyDisplay value={stats.totalActual} />
            </div>
            <p className="text-xs text-muted-foreground">Consuntivo ad oggi</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Varianza</CardTitle>
            <AlertCircle
              className={`h-4 w-4 ${variance >= 0 ? "text-green-600" : "text-red-600"}`}
            />
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${variance >= 0 ? "text-green-600" : "text-red-600"}`}
            >
              <CurrencyDisplay value={variance} />
            </div>
            <p className="text-xs text-muted-foreground">
              {variancePercentage >= 0 ? "+" : ""}
              {variancePercentage.toFixed(1)}%
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
                Gestisci i materiali assegnati a questo progetto
              </CardDescription>
            </div>
            <Button onClick={() => setIsAddDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Aggiungi Materiale
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="gestione" className="space-y-4">
            <TabsList>
              <TabsTrigger value="gestione">
                <Package className="h-4 w-4 mr-2" />
                Gestione
              </TabsTrigger>
              <TabsTrigger value="lista-ordine">
                <ClipboardList className="h-4 w-4 mr-2" />
                Lista Ordine
              </TabsTrigger>
            </TabsList>

            {/* ── Tab Lista Ordine ── */}
            <TabsContent value="lista-ordine">
              <div className="mb-3 p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
                <p className="text-xs text-green-700 dark:text-green-300">
                  Lista atomica dei materiali da ordinare/preparare. I prodotti composti vengono scomposti nei loro articoli componenti, con le quantità aggregate.
                </p>
              </div>
              <ProjectMaterialOrderList materials={materials} />
            </TabsContent>

            {/* ── Tab Gestione ── */}
            <TabsContent value="gestione">
          {materials.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Package className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nessun materiale</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Inizia ad aggiungere materiali a questo progetto
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
                  {materials.map((material: App.Data.ProjectMaterialData) => {
                    const progress = getUsageProgress(material);
                    const costVariance = getCostVariance(material);

                    if (!material.product) return null; // Skip if product data is missing

                    return (
                      <TableRow key={material.id}>
                        <TableCell className="font-medium">
                          {material.product.code}
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              {material.product.name}
                              {material.product.product_type === "composite" && (
                                <Badge variant="secondary" className="text-xs">
                                  KIT
                                </Badge>
                              )}
                              {material.product.product_type === "kit" && (
                                <Badge variant="secondary" className="text-xs">
                                  KIT
                                </Badge>
                              )}
                              {material.is_extra && (
                                <Badge
                                  variant="outline"
                                  className="text-xs bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300"
                                >
                                  <Star className="h-3 w-3 mr-1" />
                                  EXTRA
                                </Badge>
                              )}
                            </div>
                            {material.kit_assembly && (
                              <p className="text-xs text-muted-foreground mt-0.5">
                                Assembly: {material.kit_assembly.name}
                                {material.kit_assembly.location && (
                                  <span className="ml-1">— {material.kit_assembly.location}</span>
                                )}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {material.product.product_type}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {material.planned_quantity} {material.product.unit}
                        </TableCell>
                        <TableCell className="text-right">
                          {material.delivered_quantity} {material.product.unit}
                        </TableCell>
                        <TableCell className="text-right">
                          {material.returned_quantity &&
                          material.returned_quantity > 0 ? (
                            <span className="text-blue-600">
                              {material.returned_quantity}{" "}
                              {material.product.unit}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="w-24">
                            <Progress
                              value={Math.min(progress, 100)}
                              className="h-2"
                            />
                            <span className="text-xs text-muted-foreground">
                              {progress.toFixed(0)}%
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <CurrencyDisplay value={Number(material.planned_unit_cost || 0)} />
                        </TableCell>
                        <TableCell className="text-right">
                          <CurrencyDisplay value={Number(material.actual_unit_cost || 0)} />
                        </TableCell>
                        <TableCell
                          className={`text-right ${costVariance >= 0 ? "text-green-600" : "text-red-600"}`}
                        >
                          <CurrencyDisplay value={Number(costVariance || 0)} />
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(material.status && material.status)}
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
                              >
                                <TruckIcon className="h-4 w-4 text-green-600" />
                                <span>Consegna Materiale</span>
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedMaterial(material);
                                  setIsReturnDialogOpen(true);
                                }}
                                className="flex items-center gap-2"
                                disabled={
                                  Number(material.delivered_quantity || 0) -
                                    Number(material.returned_quantity || 0) <=
                                  0
                                }
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
                                disabled={
                                  Number(material.delivered_quantity || 0) -
                                    Number(material.returned_quantity || 0) <=
                                  0
                                }
                              >
                                <ArrowRightLeft className="h-4 w-4 text-purple-600" />
                                <span>Trasferisci a Progetto</span>
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
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Add Material Dialog */}
      <AddProjectMaterialDialog
        projectId={projectId}
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
        projectId={projectId}
        material={
          selectedMaterial ? mapMaterialForDialog(selectedMaterial) : null
        }
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
        projectId={projectId}
        material={
          selectedMaterial ? mapMaterialForDialog(selectedMaterial) : null
        }
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
        projectId={projectId}
        material={
          selectedMaterial ? mapMaterialForDialog(selectedMaterial) : null
        }
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
