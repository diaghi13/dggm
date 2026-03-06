'use client';

import { useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { projectsApi } from '@/lib/api/projects';
import { customersApi } from '@/lib/api/customers';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ComboboxSelect } from '@/components/combobox-select';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
} from 'lucide-react';
import { toast } from 'sonner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ProjectDocumentsSection } from '@/app/(dashboard)/projects/_components/project-documents-section';
import { ProjectMaterialsSection } from '@/app/(dashboard)/projects/_components/project-materials-section';
import { DdtPendingAlert } from '@/components/ddt-pending-alert';
import { ProjectWorkersTab } from '@/app/(dashboard)/projects/_components/project-workers-tab';
import { ProductRequestsTab } from '@/app/(dashboard)/products/_components/material-requests-tab';
import { ProjectServicesSection } from '@/app/(dashboard)/projects/_components/project-services-section';

const statusColors: Record<string, string> = {
  draft: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200',
  planned: 'bg-blue-100 text-blue-700 border-blue-200',
  in_progress: 'bg-green-100 text-green-700 border-green-200',
  on_hold: 'bg-amber-100 text-amber-700 border-amber-200',
  completed: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  cancelled: 'bg-red-100 text-red-700 border-red-200',
};

const statusLabels: Record<string, string> = {
  draft: 'Bozza',
  planned: 'Pianificato',
  in_progress: 'In Corso',
  on_hold: 'In Pausa',
  completed: 'Completato',
  cancelled: 'Annullato',
};

const priorityColors: Record<string, string> = {
  low: 'bg-slate-100 text-slate-700 border-slate-200',
  medium: 'bg-blue-100 text-blue-700 border-blue-200',
  high: 'bg-orange-100 text-orange-700 border-orange-200',
  urgent: 'bg-red-100 text-red-700 border-red-200',
};

const priorityLabels: Record<string, string> = {
  low: 'Bassa',
  medium: 'Media',
  high: 'Alta',
  urgent: 'Urgente',
};

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const projectId = parseInt(params.id as string);

  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState<any>({});
  const [customerSearch, setCustomerSearch] = useState('');

  const { data: project, isLoading, refetch } = useQuery({
    queryKey: ['project', projectId],
    queryFn: () => projectsApi.getById(projectId),
    enabled: !!projectId,
  });

  // Lazy load customers only when editing
  const { data: customersData, isLoading: isLoadingCustomers } = useQuery({
    queryKey: ['customers', { is_active: true, search: customerSearch }],
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
    queryKey: ['project-ddts', projectId],
    queryFn: () => projectsApi.getDdts(projectId),
    enabled: !!projectId,
  });

  const pendingDdtsCount = ddtData?.meta?.pending || 0;

  // Confirm all DDTs mutation
  const confirmAllDdtsMutation = useMutation({
    mutationFn: () => {
      const pendingDdts = ddtData?.data?.filter((d: any) =>
        d.status === 'issued' || d.status === 'in_transit'
      ) || [];
      const ddtIds = pendingDdts.map((d: any) => d.id);
      return projectsApi.confirmMultipleDdts(projectId, ddtIds);
    },
    onSuccess: () => {
      toast.success('DDT confermati', {
        description: 'Tutti i DDT sono stati confermati con successo.',
      });
      queryClient.invalidateQueries({ queryKey: ['project-ddts', projectId] });
      queryClient.invalidateQueries({ queryKey: ['project-materials', projectId] });
    },
    onError: (error: any) => {
      toast.error('Errore', {
        description: error.response?.data?.message || 'Impossibile confermare i DDT',
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => projectsApi.update(projectId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      setEditMode(false);
      toast.success('Progetto aggiornato', {
        description: 'Le modifiche sono state salvate con successo',
      });
    },
    onError: (error: any) => {
      toast.error('Errore', {
        description:
          error.response?.data?.message || 'Impossibile salvare le modifiche',
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
          <Button onClick={() => router.push('/projects')} variant="outline">
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
            onClick={() => router.push('/projects')}
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
              <Button
                onClick={handleSave}
                disabled={updateMutation.isPending}
              >
                <Save className="mr-2 h-4 w-4" />
                {updateMutation.isPending ? 'Salvataggio...' : 'Salva Modifiche'}
              </Button>
            </>
          ) : (
            <Button onClick={() => setEditMode(true)}>Modifica</Button>
          )}
        </div>
      </div>

      {/* Status Badges */}
      <div className="flex gap-2 flex-wrap">
        <Badge className={statusColors[project.status] + ' font-medium text-xs border'}>
          {statusLabels[project.status]}
        </Badge>
        {project.priority && (
          <Badge className={priorityColors[project.priority] + ' font-medium text-xs border'}>
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
          onViewAll={() => {
            // Scroll to documents tab or switch to it
            const documentsTab = document.querySelector('[value="documenti"]');
            if (documentsTab instanceof HTMLElement) {
              documentsTab.click();
            }
          }}
          onConfirmAll={() => confirmAllDdtsMutation.mutate()}
          isConfirming={confirmAllDdtsMutation.isPending}
        />
      )}

      {/* Tabs */}
      <Tabs defaultValue="riepilogo" className="space-y-6">
        <TabsList>
          <TabsTrigger value="riepilogo">Riepilogo</TabsTrigger>
          <TabsTrigger value="materiali">Materiali</TabsTrigger>
          <TabsTrigger value="servizi">Servizi</TabsTrigger>
          <TabsTrigger value="documenti">Documenti</TabsTrigger>
          <TabsTrigger value="squadra">Squadra</TabsTrigger>
          <TabsTrigger value="richieste">Richieste Materiale</TabsTrigger>
          <TabsTrigger value="timesheet">Timesheet</TabsTrigger>
          <TabsTrigger value="costi">Analisi Costi</TabsTrigger>
        </TabsList>

        <TabsContent value="riepilogo" className="space-y-6">
          {/* Informazioni Generali */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Informazioni Generali
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>Codice Progetto</Label>
                <Input
                  value={project.code}
                  disabled
                  className="bg-slate-50 dark:bg-slate-900"
                />
              </div>

              <div className="space-y-2">
                <Label>Nome Progetto *</Label>
                <Input
                  value={editMode ? formData.name ?? project.name : project.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  disabled={!editMode}
                  placeholder="Nome del progetto"
                />
              </div>

              <div className="space-y-2">
                <Label>Cliente *</Label>
                {editMode ? (
                  <ComboboxSelect
                    options={
                      customersData?.data.map((customer: any) => ({
                        value: customer.id.toString(),
                        label: customer.display_name,
                        description: customer.email || undefined,
                      })) ?? []
                    }
                    value={formData.customer_id?.toString() ?? project.customer_id?.toString()}
                    onValueChange={(value) =>
                      setFormData({ ...formData, customer_id: parseInt(value) })
                    }
                    onSearchChange={setCustomerSearch}
                    placeholder="Seleziona un cliente"
                    searchPlaceholder="Cerca cliente..."
                    emptyText="Nessun cliente trovato"
                    loading={isLoadingCustomers}
                    icon={<User className="h-4 w-4 text-slate-400 dark:text-slate-500" />}
                  />
                ) : (
                  <Input
                    value={project.customer?.display_name || 'Non specificato'}
                    disabled
                    className="bg-slate-50 dark:bg-slate-900"
                  />
                )}
              </div>

              <div className="space-y-2">
                <Label>Stato *</Label>
                {editMode ? (
                  <Select
                    value={formData.status ?? project.status}
                    onValueChange={(value) =>
                      setFormData({ ...formData, status: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleziona stato" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Bozza</SelectItem>
                      <SelectItem value="planned">Pianificato</SelectItem>
                      <SelectItem value="in_progress">In Corso</SelectItem>
                      <SelectItem value="on_hold">In Pausa</SelectItem>
                      <SelectItem value="completed">Completato</SelectItem>
                      <SelectItem value="cancelled">Annullato</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    value={statusLabels[project.status]}
                    disabled
                    className="bg-slate-50 dark:bg-slate-900"
                  />
                )}
              </div>

              <div className="space-y-2">
                <Label>Priorità</Label>
                {editMode ? (
                  <Select
                    value={formData.priority ?? project.priority ?? ''}
                    onValueChange={(value) =>
                      setFormData({ ...formData, priority: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleziona priorità" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Bassa</SelectItem>
                      <SelectItem value="medium">Media</SelectItem>
                      <SelectItem value="high">Alta</SelectItem>
                      <SelectItem value="urgent">Urgente</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    value={project.priority ? priorityLabels[project.priority] : 'Non specificata'}
                    disabled
                    className="bg-slate-50 dark:bg-slate-900"
                  />
                )}
              </div>

              <div className="col-span-2 space-y-2">
                <Label>Descrizione</Label>
                <Textarea
                  value={
                    editMode
                      ? formData.description ?? project.description ?? ''
                      : project.description || ''
                  }
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  disabled={!editMode}
                  placeholder="Descrizione del progetto"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Indirizzo e Localizzazione */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Indirizzo e Localizzazione
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {!project.address && !editMode && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Indirizzo non specificato. Alcuni progetti potrebbero non avere un
                    indirizzo definito (es. eventi, location temporanee).
                  </AlertDescription>
                </Alert>
              )}

              <div className="grid grid-cols-2 gap-6">
                <div className="col-span-2 space-y-2">
                  <Label>Indirizzo</Label>
                  <Input
                    value={
                      editMode
                        ? formData.address ?? project.address ?? ''
                        : project.address || ''
                    }
                    onChange={(e) =>
                      setFormData({ ...formData, address: e.target.value })
                    }
                    disabled={!editMode}
                    placeholder="Via, numero civico"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Città</Label>
                  <Input
                    value={
                      editMode ? formData.city ?? project.city ?? '' : project.city || ''
                    }
                    onChange={(e) =>
                      setFormData({ ...formData, city: e.target.value })
                    }
                    disabled={!editMode}
                    placeholder="Città"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Provincia</Label>
                  <Input
                    value={
                      editMode
                        ? formData.province ?? project.province ?? ''
                        : project.province || ''
                    }
                    onChange={(e) =>
                      setFormData({ ...formData, province: e.target.value })
                    }
                    disabled={!editMode}
                    placeholder="Sigla provincia (es. MI)"
                    maxLength={2}
                  />
                </div>

                <div className="space-y-2">
                  <Label>CAP</Label>
                  <Input
                    value={
                      editMode
                        ? formData.postal_code ?? project.postal_code ?? ''
                        : project.postal_code || ''
                    }
                    onChange={(e) =>
                      setFormData({ ...formData, postal_code: e.target.value })
                    }
                    disabled={!editMode}
                    placeholder="Codice postale"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Latitudine (GPS)</Label>
                  <Input
                    type="number"
                    step="0.00000001"
                    value={
                      editMode
                        ? formData.latitude ?? project.latitude ?? ''
                        : project.latitude || ''
                    }
                    onChange={(e) =>
                      setFormData({ ...formData, latitude: parseFloat(e.target.value) })
                    }
                    disabled={!editMode}
                    placeholder="es. 45.4642"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Longitudine (GPS)</Label>
                  <Input
                    type="number"
                    step="0.00000001"
                    value={
                      editMode
                        ? formData.longitude ?? project.longitude ?? ''
                        : project.longitude || ''
                    }
                    onChange={(e) =>
                      setFormData({ ...formData, longitude: parseFloat(e.target.value) })
                    }
                    disabled={!editMode}
                    placeholder="es. 9.1900"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Raggio GPS (metri)</Label>
                  <Input
                    type="number"
                    value={
                      editMode
                        ? formData.gps_radius ?? project.gps_radius ?? 100
                        : project.gps_radius || 100
                    }
                    onChange={(e) =>
                      setFormData({ ...formData, gps_radius: parseInt(e.target.value) })
                    }
                    disabled={!editMode}
                    placeholder="100"
                  />
                  <p className="text-xs text-slate-500">
                    Raggio di validazione per timbrature GPS
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Date e Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Date e Timeline
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label>Data Inizio</Label>
                <Input
                  type="date"
                  value={
                    editMode
                      ? formData.start_date ?? project.start_date ?? ''
                      : project.start_date || ''
                  }
                  onChange={(e) =>
                    setFormData({ ...formData, start_date: e.target.value })
                  }
                  disabled={!editMode}
                />
              </div>

              <div className="space-y-2">
                <Label>Data Fine Stimata</Label>
                <Input
                  type="date"
                  value={
                    editMode
                      ? formData.estimated_end_date ?? project.estimated_end_date ?? ''
                      : project.estimated_end_date || ''
                  }
                  onChange={(e) =>
                    setFormData({ ...formData, estimated_end_date: e.target.value })
                  }
                  disabled={!editMode}
                />
              </div>

              <div className="space-y-2">
                <Label>Data Fine Effettiva</Label>
                <Input
                  type="date"
                  value={
                    editMode
                      ? formData.actual_end_date ?? project.actual_end_date ?? ''
                      : project.actual_end_date || ''
                  }
                  onChange={(e) =>
                    setFormData({ ...formData, actual_end_date: e.target.value })
                  }
                  disabled={!editMode}
                />
              </div>
            </CardContent>
          </Card>

          {/* Dati Finanziari */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Euro className="h-5 w-5" />
                Dati Finanziari
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>Importo Stimato (€)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={
                    editMode
                      ? formData.estimated_amount ?? project.estimated_amount ?? ''
                      : project.estimated_amount || ''
                  }
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      estimated_amount: parseFloat(e.target.value),
                    })
                  }
                  disabled={!editMode}
                  placeholder="0.00"
                />
              </div>

              <div className="space-y-2">
                <Label>Costo Effettivo (€)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={
                    editMode
                      ? formData.actual_cost ?? project.actual_cost ?? ''
                      : project.actual_cost || ''
                  }
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      actual_cost: parseFloat(e.target.value),
                    })
                  }
                  disabled={!editMode}
                  placeholder="0.00"
                />
              </div>

              <div className="space-y-2">
                <Label>Importo Fatturato (€)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={
                    editMode
                      ? formData.invoiced_amount ?? project.invoiced_amount ?? ''
                      : project.invoiced_amount || ''
                  }
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      invoiced_amount: parseFloat(e.target.value),
                    })
                  }
                  disabled={!editMode}
                  placeholder="0.00"
                />
              </div>

              <div className="space-y-2">
                <Label>Margine</Label>
                <div className="flex items-center gap-2">
                  <Input
                    value={`€ ${Number(project.margin || 0).toFixed(2)}`}
                    disabled
                    className={`bg-slate-50 dark:bg-slate-900 font-semibold ${
                      Number(project.margin || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}
                  />
                  <Input
                    value={`${Number(project.margin_percentage || 0).toFixed(1)}%`}
                    disabled
                    className={`bg-slate-50 dark:bg-slate-900 font-semibold w-24 ${
                      Number(project.margin_percentage || 0) >= 0
                        ? 'text-green-600'
                        : 'text-red-600'
                    }`}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Note */}
          <Card>
            <CardHeader>
              <CardTitle>Note</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Note Pubbliche</Label>
                <Textarea
                  value={
                    editMode ? formData.notes ?? project.notes ?? '' : project.notes || ''
                  }
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                  disabled={!editMode}
                  placeholder="Note visibili al cliente"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label>Note Interne</Label>
                <Textarea
                  value={
                    editMode
                      ? formData.internal_notes ?? project.internal_notes ?? ''
                      : project.internal_notes || ''
                  }
                  onChange={(e) =>
                    setFormData({ ...formData, internal_notes: e.target.value })
                  }
                  disabled={!editMode}
                  placeholder="Note interne (non visibili al cliente)"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>
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

        <TabsContent value="squadra">
          <ProjectWorkersTab projectId={projectId} />
        </TabsContent>

        <TabsContent value="richieste">
          <ProductRequestsTab projectId={projectId} projectName={project.name} />
        </TabsContent>

        <TabsContent value="timesheet">
          <Card>
            <CardContent className="py-12">
              <div className="text-center text-slate-500">
                <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>Sezione timesheet in sviluppo...</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="costi">
          <Card>
            <CardContent className="py-12">
              <div className="text-center text-slate-500">
                <Euro className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>Sezione analisi costi in sviluppo...</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
