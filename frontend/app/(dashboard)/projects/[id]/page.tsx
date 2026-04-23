"use client";

import { useState, useCallback } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { projectsApi } from "@/lib/api/projects";
import { customersApi } from "@/lib/api/customers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ComboboxSelect } from "@/components/combobox-select";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import {
  ProjectDesktopSidebar,
  ProjectMobileNav,
} from "@/app/(dashboard)/projects/_components/project-sidebar";
import {
  ArrowLeft,
  Save,
  Building2,
  User,
  Calendar,
  MapPin,
  Euro,
  AlertCircle,
  FileText,
} from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ProjectDocumentsSection } from "@/app/(dashboard)/projects/_components/project-documents-section";
import { ProjectMaterialsSection } from "@/app/(dashboard)/projects/_components/project-materials-section";
import { DdtPendingAlert } from "@/components/ddt-pending-alert";
import { ProjectPersonnelTab } from "@/app/(dashboard)/projects/_components/project-personnel-tab";
import { ProductRequestsTab } from "@/app/(dashboard)/products/_components/material-requests-tab";
import { ProjectServicesSection } from "@/app/(dashboard)/projects/_components/project-services-section";
import { ProjectLaborLogsSection } from "@/app/(dashboard)/projects/_components/project-labor-logs-section";
import { ProjectExpensesSection } from "@/app/(dashboard)/projects/_components/project-expenses-section";
import { ProjectSummaryTab } from "@/app/(dashboard)/projects/_components/project-summary-tab";
import { ProjectStockTab } from "@/app/(dashboard)/projects/_components/project-stock-tab";
import { ProjectAvailabilityTab } from "@/app/(dashboard)/projects/_components/project-availability-tab";
import { ProjectOrderListTab } from "@/app/(dashboard)/projects/_components/project-order-list-tab";
import { ProjectIncidentsTab } from "@/app/(dashboard)/projects/_components/project-incidents-tab";
import { CurrencyDisplay, CurrencyInput } from "@/components/ui/currency-input";
import { ProjectFinalBalanceSection } from "@/app/(dashboard)/projects/_components/project-final-balance-section";
import { ProjectRiepilogoTab } from "@/app/(dashboard)/projects/_components/project-riepilogo-tab";

const statusColors: Record<string, string> = {
  draft:
    "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200",
  planned: "bg-blue-100 text-blue-700 border-blue-200",
  in_progress: "bg-green-100 text-green-700 border-green-200",
  on_hold: "bg-amber-100 text-amber-700 border-amber-200",
  completed: "bg-emerald-100 text-emerald-700 border-emerald-200",
  cancelled: "bg-red-100 text-red-700 border-red-200",
};

const statusLabels: Record<string, string> = {
  draft: "Bozza",
  planned: "Pianificato",
  in_progress: "In Corso",
  on_hold: "In Pausa",
  completed: "Completato",
  cancelled: "Annullato",
};

const priorityColors: Record<string, string> = {
  low: "bg-slate-100 text-slate-700 border-slate-200",
  medium: "bg-blue-100 text-blue-700 border-blue-200",
  high: "bg-orange-100 text-orange-700 border-orange-200",
  urgent: "bg-red-100 text-red-700 border-red-200",
};

const priorityLabels: Record<string, string> = {
  low: "Bassa",
  medium: "Media",
  high: "Alta",
  urgent: "Urgente",
};

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const projectId = parseInt(params.id as string);

  const activeTab = searchParams.get("tab") ?? "riepilogo";

  const handleTabChange = (tab: string) => {
    const newParams = new URLSearchParams(searchParams.toString());
    newParams.set("tab", tab);
    router.push(`?${newParams.toString()}`, { scroll: false });
  };

  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState<any>({});
  const [customerSearch, setCustomerSearch] = useState("");

  const {
    data: project,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["project", projectId],
    queryFn: () => projectsApi.getById(projectId),
    enabled: !!projectId,
  });

  // Lazy load customers only when editing
  const { data: customersData, isLoading: isLoadingCustomers } = useQuery({
    queryKey: ["customers", { is_active: true, search: customerSearch }],
    queryFn: () =>
      customersApi.getAll({
        is_active: true,
        search: customerSearch,
        per_page: 50,
      }),
    enabled: editMode,
  });

  // Fetch DDTs for pending alert
  const { data: ddtData } = useQuery({
    queryKey: ["project-ddts", projectId],
    queryFn: () => projectsApi.getDdts(projectId),
    enabled: !!projectId,
  });

  const pendingDdtsCount = ddtData?.meta?.pending || 0;

  // Confirm all DDTs mutation
  const confirmAllDdtsMutation = useMutation({
    mutationFn: () => {
      const pendingDdts =
        ddtData?.data?.filter(
          (d: any) => d.status === "issued" || d.status === "in_transit",
        ) || [];
      const ddtIds = pendingDdts.map((d: any) => d.id);
      return projectsApi.confirmMultipleDdts(projectId, ddtIds);
    },
    onSuccess: () => {
      toast.success("DDT confermati", {
        description: "Tutti i DDT sono stati confermati con successo.",
      });
      queryClient.invalidateQueries({ queryKey: ["project-ddts", projectId] });
      queryClient.invalidateQueries({
        queryKey: ["project-materials", projectId],
      });
    },
    onError: (error: any) => {
      toast.error("Errore", {
        description:
          error.response?.data?.message || "Impossibile confermare i DDT",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => projectsApi.update(projectId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project", projectId] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      setEditMode(false);
      toast.success("Progetto aggiornato", {
        description: "Le modifiche sono state salvate con successo",
      });
    },
    onError: (error: any) => {
      toast.error("Errore", {
        description:
          error.response?.data?.message || "Impossibile salvare le modifiche",
      });
    },
  });

  const handleSave = useCallback(() => {
    updateMutation.mutate(formData);
  }, [formData, updateMutation]);

  const handleCancel = useCallback(() => {
    setEditMode(false);
    setFormData({});
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 border-4 border-slate-200 dark:border-slate-800 border-t-slate-600 rounded-full animate-spin" />
          <p className="text-sm text-slate-500">Caricamento progetto...</p>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Building2 className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">
            Progetto non trovato
          </h2>
          <p className="text-slate-600 dark:text-slate-400 mb-6">
            Il progetto richiesto non esiste o è stato eliminato
          </p>
          <Button onClick={() => router.push("/projects")} variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Torna ai Progetti
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/projects")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-2xl font-bold">{project.name}</h1>
            </div>
            <p className="text-sm text-slate-500">{project.code}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {editMode ? (
            <>
              <Button variant="outline" onClick={handleCancel}>
                Annulla
              </Button>
              <Button onClick={handleSave} disabled={updateMutation.isPending}>
                <Save className="mr-2 h-4 w-4" />
                {updateMutation.isPending
                  ? "Salvataggio..."
                  : "Salva Modifiche"}
              </Button>
            </>
          ) : (
            <Button onClick={() => setEditMode(true)}>Modifica</Button>
          )}
        </div>
      </div>

      {/* Status Badges */}
      <div className="flex gap-2 flex-wrap">
        <Badge
          className={
            statusColors[project.status] + " font-medium text-xs border"
          }
        >
          {statusLabels[project.status]}
        </Badge>
        {project.priority && (
          <Badge
            className={
              priorityColors[project.priority] + " font-medium text-xs border"
            }
          >
            {priorityLabels[project.priority]}
          </Badge>
        )}
        {project.quote_id && project.quote && (
          <Badge
            className="bg-sky-50 dark:bg-sky-950/30 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-800 font-medium text-xs border cursor-pointer hover:bg-sky-100 dark:hover:bg-sky-950/50 transition-colors"
            onClick={() => router.push(`/quotes/${project.quote_id}`)}
          >
            <FileText className="h-3 w-3 mr-1" />
            Preventivo: {project.quote.code}
          </Badge>
        )}
      </div>

      {/* DDT Pending Alert */}
      {pendingDdtsCount > 0 && (
        <DdtPendingAlert
          pendingCount={pendingDdtsCount}
          onViewAll={() => handleTabChange("documenti")}
          onConfirmAll={() => confirmAllDdtsMutation.mutate()}
          isConfirming={confirmAllDdtsMutation.isPending}
        />
      )}

      {/* Navigazione + Contenuto */}
      <ProjectMobileNav activeTab={activeTab} onTabChange={handleTabChange} />
      <div className="flex gap-8 items-start">
        <ProjectDesktopSidebar
          activeTab={activeTab}
          onTabChange={handleTabChange}
        />
        <div className="flex-1 min-w-0">
          <Tabs value={activeTab} onValueChange={handleTabChange}>
            <TabsContent value="riepilogo">
              <ProjectRiepilogoTab
                project={project}
                editMode={editMode}
                formData={formData}
                setFormData={setFormData}
                customersData={customersData}
                isLoadingCustomers={isLoadingCustomers}
                setCustomerSearch={setCustomerSearch}
              />
            </TabsContent>

            <TabsContent value="materiali">
              <ProjectMaterialsSection
                projectId={project.id}
                onMaterialsChange={() => refetch()}
              />
            </TabsContent>

            <TabsContent value="servizi">
              <ProjectServicesSection
                projectId={project.id}
                onServicesChange={() => refetch()}
              />
            </TabsContent>

            <TabsContent value="documenti">
              <Card>
                <CardContent className="pt-6">
                  <ProjectDocumentsSection
                    projectId={project.id}
                    media={project.media || []}
                    onMediaChange={() => refetch()}
                    readOnly={!editMode}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="personale">
              <ProjectPersonnelTab projectId={project.id} project={project} />
            </TabsContent>

            <TabsContent value="ore">
              <ProjectLaborLogsSection projectId={project.id} />
            </TabsContent>

            <TabsContent value="spese">
              <ProjectExpensesSection projectId={project.id} />
            </TabsContent>

            <TabsContent value="richieste">
              <ProductRequestsTab
                projectId={projectId}
                projectName={project.name}
              />
            </TabsContent>

            <TabsContent value="stock">
              <ProjectStockTab projectId={project.id} />
            </TabsContent>

            <TabsContent value="disponibilita">
              <ProjectAvailabilityTab projectId={project.id} />
            </TabsContent>

            <TabsContent value="ordini">
              <ProjectOrderListTab projectId={project.id} />
            </TabsContent>

            <TabsContent value="segnalazioni">
              <ProjectIncidentsTab projectId={project.id} />
            </TabsContent>

            <TabsContent value="final-balance">
              <ProjectFinalBalanceSection
                projectId={project.id}
                hasQuote={!!project.quote_id}
              />
            </TabsContent>

            <TabsContent value="project-summary" className="space-y-4">
              <ProjectSummaryTab projectId={project.id} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
