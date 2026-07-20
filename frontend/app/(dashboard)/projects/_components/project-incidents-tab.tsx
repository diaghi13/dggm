'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { projectIncidentsApi } from '@/lib/api/project-incidents';
import { projectStockApi } from '@/lib/api/project-stock';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertTriangle,
  Wrench,
  Droplets,
  Skull,
  PackageX,
  Plus,
  CheckCircle2,
  Info,
} from 'lucide-react';
import { toast } from 'sonner';
import { handleMutationError } from '@/lib/utils/handle-mutation-error';
import { CurrencyDisplay, CurrencyInput } from '@/components/ui/currency-input';
import type {
  ProjectMaterialIncident,
  IncidentType,
  DamageSeverity,
  IncidentStatus,
  ReportIncidentInput,
  ResolveIncidentInput,
} from '@/lib/types';

interface Props {
  projectId: number;
}

// ─── Config maps ────────────────────────────────────────────────────────────

const incidentTypeConfig: Record<
  IncidentType,
  { label: string; className: string; icon: React.ReactNode }
> = {
  missing: {
    label: 'Mancante',
    className: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300',
    icon: <PackageX className="h-3 w-3" />,
  },
  broken: {
    label: 'Rotto',
    className: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',
    icon: <Wrench className="h-3 w-3" />,
  },
  damaged: {
    label: 'Danneggiato',
    className: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',
    icon: <AlertTriangle className="h-3 w-3" />,
  },
  contaminated: {
    label: 'Contaminato',
    className: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
    icon: <Droplets className="h-3 w-3" />,
  },
  lost_by_client: {
    label: 'Perso dal Cliente',
    className: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
    icon: <Skull className="h-3 w-3" />,
  },
  stolen: {
    label: 'Rubato',
    className: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
    icon: <Skull className="h-3 w-3" />,
  },
};

const severityConfig: Record<DamageSeverity, { label: string; className: string }> = {
  minor: {
    label: 'Minore',
    className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  },
  major: {
    label: 'Grave',
    className: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',
  },
  write_off: {
    label: 'Irrecuperabile',
    className: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
  },
};

const statusConfig: Record<IncidentStatus, { label: string; className: string }> = {
  open: {
    label: 'Aperta',
    className: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300',
  },
  reviewed: {
    label: 'In Revisione',
    className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  },
  resolved: {
    label: 'Risolta',
    className: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
  },
  invoiced: {
    label: 'Fatturata',
    className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  },
};

const STATUS_FILTERS: Array<{ value: string; label: string }> = [
  { value: 'all', label: 'Tutte' },
  { value: 'open', label: 'Aperte' },
  { value: 'reviewed', label: 'Revisione' },
  { value: 'resolved', label: 'Risolte' },
  { value: 'invoiced', label: 'Fatturate' },
];

const INCIDENT_TYPES: IncidentType[] = [
  'missing',
  'broken',
  'damaged',
  'contaminated',
  'lost_by_client',
  'stolen',
];

const SEVERITY_OPTIONS: DamageSeverity[] = ['minor', 'major', 'write_off'];

// ─── New incident form state ─────────────────────────────────────────────────

interface NewIncidentForm {
  project_material_id: number | null;
  incident_type: IncidentType;
  damage_severity: DamageSeverity | null;
  description: string;
  incident_date: string;
  charge_amount: number | null;
}

const EMPTY_INCIDENT_FORM: NewIncidentForm = {
  project_material_id: null,
  incident_type: 'damaged',
  damage_severity: null,
  description: '',
  incident_date: new Date().toISOString().slice(0, 10),
  charge_amount: null,
};

interface ResolveForm {
  resolution_notes: string;
  charge_amount: number | null;
  is_chargeable_to_client: boolean;
}

const EMPTY_RESOLVE_FORM: ResolveForm = {
  resolution_notes: '',
  charge_amount: null,
  is_chargeable_to_client: false,
};

// ─── Component ───────────────────────────────────────────────────────────────

export function ProjectIncidentsTab({ projectId }: Props) {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [resolvingIncident, setResolvingIncident] =
    useState<ProjectMaterialIncident | null>(null);
  const [newForm, setNewForm] = useState<NewIncidentForm>(EMPTY_INCIDENT_FORM);
  const [resolveForm, setResolveForm] = useState<ResolveForm>(EMPTY_RESOLVE_FORM);

  const queryParams =
    statusFilter === 'all' ? undefined : { status: statusFilter };

  const { data: incidents = [], isLoading, isFetching } = useQuery({
    queryKey: ['project-incidents', projectId, statusFilter],
    queryFn: () => projectIncidentsApi.getByProject(projectId, queryParams),
    enabled: !!projectId,
    placeholderData: keepPreviousData,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });

  // Fetch stock for product selector in "new incident" dialog
  const { data: stockItems = [] } = useQuery({
    queryKey: ['project-stock', projectId],
    queryFn: () => projectStockApi.getStock(projectId),
    enabled: showNewDialog,
  });

  const createMutation = useMutation({
    mutationFn: (data: ReportIncidentInput) =>
      projectIncidentsApi.create(projectId, data),
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: ['project-incidents', projectId] });
      setShowNewDialog(false);
      setNewForm(EMPTY_INCIDENT_FORM);
      if (created.is_chargeable_to_client && created.charge_amount) {
        toast.success('Segnalazione creata', {
          description: `Addebitabile al cliente: ${new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(Number(created.charge_amount))}`,
        });
      } else {
        toast.success('Segnalazione creata');
      }
    },
    onError: (error) => handleMutationError(error, 'Errore durante la creazione'),
  });

  const resolveMutation = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: number;
      data: ResolveIncidentInput;
    }) => projectIncidentsApi.resolve(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-incidents', projectId] });
      setResolvingIncident(null);
      setResolveForm(EMPTY_RESOLVE_FORM);
      toast.success('Segnalazione risolta');
    },
    onError: (error) => handleMutationError(error, 'Errore durante la risoluzione'),
  });

  const handleCreate = () => {
    if (!newForm.project_material_id) return;
    createMutation.mutate({
      project_material_id: newForm.project_material_id,
      incident_type: newForm.incident_type,
      damage_severity: newForm.damage_severity ?? undefined,
      description: newForm.description,
      incident_date: newForm.incident_date,
      charge_amount: newForm.charge_amount ?? undefined,
    });
  };

  const handleResolve = () => {
    if (!resolvingIncident) return;
    resolveMutation.mutate({
      id: resolvingIncident.id,
      data: {
        resolution_notes: resolveForm.resolution_notes,
        charge_amount: resolveForm.charge_amount ?? undefined,
        is_chargeable_to_client: resolveForm.is_chargeable_to_client,
      },
    });
  };

  const openResolveDialog = (incident: ProjectMaterialIncident) => {
    setResolvingIncident(incident);
    setResolveForm({
      resolution_notes: '',
      charge_amount: incident.charge_amount ?? null,
      is_chargeable_to_client: incident.is_chargeable_to_client,
    });
  };

  const isNewFormValid =
    newForm.project_material_id !== null &&
    newForm.description.trim().length > 0 &&
    newForm.incident_date.length > 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            Segnalazioni
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Materiali mancanti, rotti o danneggiati
          </p>
        </div>
        <Button
          onClick={() => {
            setNewForm(EMPTY_INCIDENT_FORM);
            setShowNewDialog(true);
          }}
          className="gap-2"
        >
          <Plus className="h-4 w-4" />
          Nuova Segnalazione
        </Button>
      </div>

      {/* Status filter */}
      <div className="flex flex-wrap gap-2">
        {STATUS_FILTERS.map((f) => (
          <Button
            key={f.value}
            variant={statusFilter === f.value ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStatusFilter(f.value)}
            disabled={isFetching}
            className={
              statusFilter === f.value
                ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                : 'border-slate-200 text-slate-700 dark:border-slate-700 dark:text-slate-300'
            }
          >
            {f.label}
          </Button>
        ))}
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12 text-slate-500 dark:text-slate-400">
          Caricamento segnalazioni...
        </div>
      ) : incidents.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 py-12 text-center dark:border-slate-700 dark:bg-slate-800/20">
          <AlertTriangle className="h-12 w-12 text-slate-300 dark:text-slate-600 mb-4" />
          <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
            Nessuna segnalazione
          </p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-500">
            {statusFilter === 'all'
              ? 'Non sono presenti segnalazioni per questo progetto.'
              : `Nessuna segnalazione con stato "${STATUS_FILTERS.find((f) => f.value === statusFilter)?.label}".`}
          </p>
        </div>
      ) : (
        <div className="rounded-lg border border-slate-200 dark:border-slate-700">
          <Table>
            <TableHeader>
              <TableRow className="border-slate-200 dark:border-slate-700">
                <TableHead className="text-slate-700 dark:text-slate-300">Prodotto</TableHead>
                <TableHead className="text-slate-700 dark:text-slate-300">Tipo</TableHead>
                <TableHead className="text-slate-700 dark:text-slate-300">Gravità</TableHead>
                <TableHead className="text-slate-700 dark:text-slate-300">Addebitabile</TableHead>
                <TableHead className="text-slate-700 dark:text-slate-300">Stato</TableHead>
                <TableHead className="text-slate-700 dark:text-slate-300">Data</TableHead>
                <TableHead className="text-slate-700 dark:text-slate-300">Azioni</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {incidents.map((incident) => {
                const typeConf = incidentTypeConfig[incident.incident_type];
                const statConf = statusConfig[incident.status];
                const canResolve =
                  incident.status === 'open' || incident.status === 'reviewed';

                return (
                  <TableRow
                    key={incident.id}
                    className="border-slate-100 dark:border-slate-800"
                  >
                    <TableCell>
                      <p className="font-medium text-slate-900 dark:text-slate-100">
                        {incident.product_name}
                      </p>
                      {incident.reported_by_name && (
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          da {incident.reported_by_name}
                        </p>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge className={`${typeConf.className} gap-1`}>
                        {typeConf.icon}
                        {typeConf.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {incident.damage_severity ? (
                        <Badge
                          className={severityConfig[incident.damage_severity].className}
                        >
                          {severityConfig[incident.damage_severity].label}
                        </Badge>
                      ) : (
                        <span className="text-slate-400 dark:text-slate-500 text-sm">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {incident.is_chargeable_to_client ? (
                        <span className="text-sm font-semibold text-green-600 dark:text-green-400">
                          {incident.charge_amount != null ? (
                            <>€ <CurrencyDisplay value={Number(incident.charge_amount)} /></>
                          ) : (
                            'Sì'
                          )}
                        </span>
                      ) : (
                        <span className="text-slate-400 dark:text-slate-500 text-sm">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge className={statConf.className}>{statConf.label}</Badge>
                    </TableCell>
                    <TableCell className="text-sm text-slate-700 dark:text-slate-300">
                      {new Date(incident.incident_date).toLocaleDateString('it-IT')}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        {canResolve && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openResolveDialog(incident)}
                            className="border-green-200 text-green-700 hover:bg-green-50 dark:border-green-800 dark:text-green-400 dark:hover:bg-green-950/20 text-xs h-7"
                          >
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Risolvi
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400 text-xs h-7"
                        >
                          <Info className="h-3 w-3 mr-1" />
                          Dettagli
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {/* New incident dialog */}
      <Dialog
        open={showNewDialog}
        onOpenChange={(open) => {
          if (!open) setShowNewDialog(false);
        }}
      >
        <DialogContent className="border-slate-200 bg-white sm:max-w-lg dark:border-slate-700 dark:bg-slate-900">
          <DialogHeader>
            <DialogTitle className="text-slate-900 dark:text-slate-100">
              Nuova Segnalazione
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Product selector */}
            <div className="space-y-2">
              <Label className="text-slate-900 dark:text-slate-100">
                Prodotto <span className="text-red-500">*</span>
              </Label>
              <Select
                value={newForm.project_material_id?.toString() ?? ''}
                onValueChange={(v) =>
                  setNewForm({ ...newForm, project_material_id: parseInt(v) })
                }
              >
                <SelectTrigger className="border-slate-200 bg-white text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100">
                  <SelectValue placeholder="Seleziona prodotto in cantiere..." />
                </SelectTrigger>
                <SelectContent className="dark:bg-slate-900">
                  {stockItems.map((item) => (
                    <SelectItem
                      key={item.project_material_id}
                      value={item.project_material_id.toString()}
                      className="dark:text-slate-100"
                    >
                      {item.product_name}{' '}
                      <span className="text-slate-400">({item.product_code})</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Incident type */}
            <div className="space-y-2">
              <Label className="text-slate-900 dark:text-slate-100">
                Tipo <span className="text-red-500">*</span>
              </Label>
              <Select
                value={newForm.incident_type}
                onValueChange={(v) =>
                  setNewForm({ ...newForm, incident_type: v as IncidentType })
                }
              >
                <SelectTrigger className="border-slate-200 bg-white text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="dark:bg-slate-900">
                  {INCIDENT_TYPES.map((t) => (
                    <SelectItem key={t} value={t} className="dark:text-slate-100">
                      {incidentTypeConfig[t].label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Severity */}
            <div className="space-y-2">
              <Label className="text-slate-900 dark:text-slate-100">Gravità</Label>
              <Select
                value={newForm.damage_severity ?? 'none'}
                onValueChange={(v) =>
                  setNewForm({
                    ...newForm,
                    damage_severity: v === 'none' ? null : (v as DamageSeverity),
                  })
                }
              >
                <SelectTrigger className="border-slate-200 bg-white text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100">
                  <SelectValue placeholder="Seleziona gravità (opzionale)" />
                </SelectTrigger>
                <SelectContent className="dark:bg-slate-900">
                  <SelectItem value="none" className="dark:text-slate-100">
                    Non specificata
                  </SelectItem>
                  {SEVERITY_OPTIONS.map((s) => (
                    <SelectItem key={s} value={s} className="dark:text-slate-100">
                      {severityConfig[s].label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label className="text-slate-900 dark:text-slate-100">
                Descrizione <span className="text-red-500">*</span>
              </Label>
              <Textarea
                value={newForm.description}
                onChange={(e) =>
                  setNewForm({ ...newForm, description: e.target.value })
                }
                placeholder="Descrivi il problema..."
                rows={3}
                className="border-slate-200 bg-white text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
            </div>

            {/* Date */}
            <div className="space-y-2">
              <Label className="text-slate-900 dark:text-slate-100">
                Data Segnalazione <span className="text-red-500">*</span>
              </Label>
              <Input
                type="date"
                value={newForm.incident_date}
                onChange={(e) =>
                  setNewForm({ ...newForm, incident_date: e.target.value })
                }
                className="border-slate-200 bg-white text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
            </div>

            {/* Charge override */}
            <div className="space-y-2">
              <Label className="text-slate-900 dark:text-slate-100">
                Importo Addebito (€) — opzionale
              </Label>
              <CurrencyInput
                value={newForm.charge_amount}
                onChange={(v) => setNewForm({ ...newForm, charge_amount: v })}
                className="border-slate-200 bg-white text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowNewDialog(false)}
              className="border-slate-200 dark:border-slate-700 dark:text-slate-100"
            >
              Annulla
            </Button>
            <Button
              onClick={handleCreate}
              disabled={!isNewFormValid || createMutation.isPending}
            >
              {createMutation.isPending ? 'Creando...' : 'Crea Segnalazione'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Resolve dialog */}
      <Dialog
        open={!!resolvingIncident}
        onOpenChange={(open) => {
          if (!open) setResolvingIncident(null);
        }}
      >
        <DialogContent className="border-slate-200 bg-white sm:max-w-md dark:border-slate-700 dark:bg-slate-900">
          <DialogHeader>
            <DialogTitle className="text-slate-900 dark:text-slate-100">
              Risolvi Segnalazione
            </DialogTitle>
          </DialogHeader>

          {resolvingIncident && (
            <div className="space-y-4">
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/50">
                <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                  {resolvingIncident.product_name}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge
                    className={incidentTypeConfig[resolvingIncident.incident_type].className}
                  >
                    {incidentTypeConfig[resolvingIncident.incident_type].label}
                  </Badge>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {resolvingIncident.description}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-slate-900 dark:text-slate-100">
                  Note Risoluzione <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  value={resolveForm.resolution_notes}
                  onChange={(e) =>
                    setResolveForm({ ...resolveForm, resolution_notes: e.target.value })
                  }
                  placeholder="Descrivi come è stato risolto..."
                  rows={3}
                  className="border-slate-200 bg-white text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_chargeable"
                  checked={resolveForm.is_chargeable_to_client}
                  onChange={(e) =>
                    setResolveForm({
                      ...resolveForm,
                      is_chargeable_to_client: e.target.checked,
                    })
                  }
                  className="h-4 w-4 rounded border-slate-300 text-blue-600"
                />
                <Label
                  htmlFor="is_chargeable"
                  className="cursor-pointer text-sm text-slate-700 dark:text-slate-300"
                >
                  Addebitare al cliente
                </Label>
              </div>

              {resolveForm.is_chargeable_to_client && (
                <div className="space-y-2">
                  <Label className="text-slate-900 dark:text-slate-100">
                    Importo Addebito (€)
                  </Label>
                  <CurrencyInput
                    value={resolveForm.charge_amount}
                    onChange={(v) =>
                      setResolveForm({ ...resolveForm, charge_amount: v })
                    }
                    className="border-slate-200 bg-white text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  />
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setResolvingIncident(null)}
              className="border-slate-200 dark:border-slate-700 dark:text-slate-100"
            >
              Annulla
            </Button>
            <Button
              onClick={handleResolve}
              disabled={
                !resolveForm.resolution_notes.trim() || resolveMutation.isPending
              }
            >
              {resolveMutation.isPending ? 'Risolvendo...' : 'Segna come Risolta'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
