'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import ConvocazioniPrintView from './convocazioni-print-view';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { projectWorkersApi } from '@/lib/api/project-workers';
import { projectsApi } from '@/lib/api/projects';
import { workersApi } from '@/lib/api/workers';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ProjectWorkerStatusBadge } from './project-worker-status-badge';
import { ProjectRoleBadges } from './project-role-badge';
import { AssignWorkerDialog } from './assign-worker-dialog';
import { ManageWorkerRolesDialog } from '@/components/manage-worker-roles-dialog';
import { ComboboxSelect } from '@/components/combobox-select';
import { WorkerSchedulePanel } from './worker-schedule-panel';
import { CurrencyDisplay, CurrencyInput, formatCurrency } from '@/components/ui/currency-input';
import { toast } from 'sonner';
import { format, parseISO } from 'date-fns';
import { it } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import type { ProjectWorker, ProjectWorkerStatus, Project, ProjectRole } from '@/lib/types';
import {
  Plus,
  Trash2,
  Users,
  UserPlus,
  MoreVertical,
  CheckCircle2,
  XCircle,
  Play,
  CheckCheck,
  Ban,
  AlertTriangle,
  Search,
  X as XIcon,
  Edit,
  ChevronDown,
  ChevronRight,
  Calendar,
  ClipboardList,
  Send,
  Check,
  Printer,
  ClipboardCheck,
} from 'lucide-react';

interface Props {
  projectId: number;
  project: Project;
}

const ACTIVE_STATUSES: ProjectWorkerStatus[] = ['pending', 'accepted', 'active'];
const HISTORY_STATUSES: ProjectWorkerStatus[] = ['completed', 'cancelled', 'rejected'];


export function ProjectPersonnelTab({ projectId, project }: Props) {
  const queryClient = useQueryClient();

  // ── Shared dialogs ──────────────────────────────────────────────────────────
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [editAssignment, setEditAssignment] = useState<ProjectWorker | null>(null);
  const [rolesDialogOpen, setRolesDialogOpen] = useState(false);
  const [manageRolesAssignment, setManageRolesAssignment] = useState<ProjectWorker | null>(null);

  // ── Slot quick-assign dialog ────────────────────────────────────────────────
  const [assigningSlot, setAssigningSlot] = useState<ProjectWorker | null>(null);
  const [selectedWorkerId, setSelectedWorkerId] = useState('');
  const [assignedFrom, setAssignedFrom] = useState(project.start_date ?? '');
  const [assignedTo, setAssignedTo] = useState(project.estimated_end_date ?? '');
  const [actualCostRate, setActualCostRate] = useState<number | null>(null);
  const [rateAutoFilled, setRateAutoFilled] = useState(false);

  // ── Create slot dialog ──────────────────────────────────────────────────────
  const [createOpen, setCreateOpen] = useState(false);
  const [newRoleName, setNewRoleName] = useState('');
  const [newEstimatedDays, setNewEstimatedDays] = useState('');
  const [newBudgetRate, setNewBudgetRate] = useState<number | null>(null);
  const [newCustomerRate, setNewCustomerRate] = useState<number | null>(null);
  const [newNotes, setNewNotes] = useState('');
  // Optional immediate worker assignment
  const [newWorkerId, setNewWorkerId] = useState('');
  const [newWorkerAssignedFrom, setNewWorkerAssignedFrom] = useState('');
  const [newWorkerAssignedTo, setNewWorkerAssignedTo] = useState('');
  const [newWorkerCostRate, setNewWorkerCostRate] = useState<number | null>(null);
  const [newWorkerRateAutoFilled, setNewWorkerRateAutoFilled] = useState(false);

  // ── Lavoratori filters + expand ─────────────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<ProjectWorkerStatus | 'all'>('all');
  const [expandedWorkerIds, setExpandedWorkerIds] = useState<Set<number>>(new Set());

  // ── Data ────────────────────────────────────────────────────────────────────
  const { data: allWorkers = [], isLoading } = useQuery({
    queryKey: ['project-workers', projectId],
    queryFn: () => projectWorkersApi.getWorkersByProject(projectId),
  });

  const { data: projectRoles = [] } = useQuery({
    queryKey: ['project-roles'],
    queryFn: () => projectWorkersApi.getRoles(),
  });

  const { data: availableWorkers = [] } = useQuery({
    queryKey: ['workers-list'],
    queryFn: () => workersApi.getAll({ per_page: 200 }),
    select: (r) => r.data ?? [],
  });

  // ── Fetch selected worker details (for rate auto-fill) ──────────────────────
  const { data: selectedWorkerData } = useQuery({
    queryKey: ['worker-detail', selectedWorkerId],
    queryFn: () => workersApi.getById(parseInt(selectedWorkerId)),
    enabled: !!selectedWorkerId && !!assigningSlot,
  });

  const { data: newSlotWorkerData } = useQuery({
    queryKey: ['worker-detail', newWorkerId],
    queryFn: () => workersApi.getById(parseInt(newWorkerId)),
    enabled: !!newWorkerId && createOpen,
  });

  // Auto-fill estimated days + assignment dates when create dialog opens
  useEffect(() => {
    if (!createOpen) return;
    setNewWorkerAssignedFrom(project.start_date ?? '');
    setNewWorkerAssignedTo(project.estimated_end_date ?? '');
    if (project.start_date && project.estimated_end_date) {
      const start = new Date(project.start_date);
      const end = new Date(project.estimated_end_date);
      const diffDays = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      if (diffDays > 0) {
        setNewEstimatedDays(String(diffDays));
      }
    }
  }, [createOpen, project.start_date, project.estimated_end_date]);

  // Auto-fill cost rate in create dialog from worker's current daily rate
  useEffect(() => {
    if (!newSlotWorkerData || !createOpen) return;
    const currentRate =
      newSlotWorkerData.rates?.find(
        (r) => r.is_current && r.rate_type === 'daily' && r.context === 'internal_cost'
      ) ??
      newSlotWorkerData.rates?.find((r) => r.is_current && r.rate_type === 'daily');
    if (currentRate) {
      setNewWorkerCostRate(currentRate.rate_amount);
      setNewWorkerRateAutoFilled(true);
    } else {
      setNewWorkerRateAutoFilled(false);
    }
  }, [newSlotWorkerData, createOpen]);

  // Auto-fill cost rate from worker's current daily rate
  useEffect(() => {
    if (!selectedWorkerData || !assigningSlot) return;
    // Prefer internal_cost context, fallback to any current daily rate
    const currentRate =
      selectedWorkerData.rates?.find(
        (r) => r.is_current && r.rate_type === 'daily' && r.context === 'internal_cost'
      ) ??
      selectedWorkerData.rates?.find(
        (r) => r.is_current && r.rate_type === 'daily'
      );
    if (currentRate) {
      setActualCostRate(currentRate.rate_amount);
      setRateAutoFilled(true);
    } else {
      setRateAutoFilled(false);
    }
  }, [selectedWorkerData, assigningSlot]);

  // ── Fetch project schedules for Convocazioni tab ────────────────────────────
  const { data: convocazioni = [] } = useQuery({
    queryKey: ['project-schedules', projectId],
    queryFn: () => projectsApi.getWorkerSchedules(projectId),
  });

  // ── Print convocazioni ──────────────────────────────────────────────────────
  const printRef = useRef<HTMLDivElement>(null);
  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Convocazioni - ${project.name}`,
    pageStyle: `
      @page {
        size: A3 landscape;
        margin: 0;
      }
      @media print {
        body {
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
          margin: 0;
          padding: 0;
        }
      }
    `,
  });

  const presencePrintRef = useRef<HTMLDivElement>(null);
  const handlePrintPresence = useReactToPrint({
    contentRef: presencePrintRef,
    documentTitle: `Foglio Presenze - ${project.name}`,
    pageStyle: `
      @page {
        size: A3 landscape;
        margin: 0;
      }
      @media print {
        body {
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
          margin: 0;
          padding: 0;
        }
      }
    `,
  });

  const slots = useMemo(() => allWorkers.filter((w) => w.status === 'slot'), [allWorkers]);

  const activeWorkers = useMemo(
    () => allWorkers.filter((w) => ACTIVE_STATUSES.includes(w.status as ProjectWorkerStatus)),
    [allWorkers]
  );

  const historyWorkers = useMemo(
    () => allWorkers.filter((w) => HISTORY_STATUSES.includes(w.status as ProjectWorkerStatus)),
    [allWorkers]
  );

  // Aggregate active workers into one entry per physical worker (worker_id)
  const aggregatedWorkers = useMemo(() => {
    const map = new Map<number, {
      workerId: number;
      workerName: string;
      workerCode: string | null;
      slots: typeof activeWorkers;
      roles: string[];
      isActive: boolean;
    }>();

    for (const pw of activeWorkers) {
      const wid = pw.worker?.id ?? pw.worker_id;
      if (!wid) continue;
      if (!map.has(wid)) {
        map.set(wid, {
          workerId: wid,
          workerName: pw.worker?.full_name ?? pw.worker_name ?? '—',
          workerCode: pw.worker?.code ?? pw.worker_code ?? null,
          slots: [],
          roles: [],
          isActive: pw.is_active ?? true,
        });
      }
      const entry = map.get(wid)!;
      entry.slots.push(pw);
      if (pw.role_name && !entry.roles.includes(pw.role_name)) {
        entry.roles.push(pw.role_name);
      }
      if (pw.roles) {
        for (const r of pw.roles) {
          if (r.name && !entry.roles.includes(r.name)) entry.roles.push(r.name);
        }
      }
    }

    return Array.from(map.values());
  }, [activeWorkers]);

  const filteredAggregatedWorkers = useMemo(() => {
    return aggregatedWorkers.filter((entry) => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (!entry.workerName.toLowerCase().includes(q)) return false;
      }
      if (statusFilter !== 'all') {
        // Keep entry if at least one slot matches the status filter
        if (!entry.slots.some((s) => s.status === statusFilter)) return false;
      }
      return true;
    });
  }, [aggregatedWorkers, searchQuery, statusFilter]);

  // Group slots by role_name for the aggregated summary
  const slotsByRole = useMemo(() => {
    const map = new Map<string, { total: number; filled: number; slots: typeof slots }>();
    for (const slot of slots) {
      const key = slot.role_name ?? 'Ruolo non definito';
      const existing = map.get(key) ?? { total: 0, filled: 0, slots: [] };
      existing.total += 1;
      if (slot.worker_id) existing.filled += 1;
      existing.slots.push(slot);
      map.set(key, existing);
    }
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [slots]);

  // Group convocazioni by date
  const convocazioniByDate = useMemo(() => {
    const map = new Map<string, typeof convocazioni>();
    for (const c of convocazioni) {
      const existing = map.get(c.scheduled_date) ?? [];
      existing.push(c);
      map.set(c.scheduled_date, existing);
    }
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [convocazioni]);

  const pendingCount = activeWorkers.filter((w) => w.status === 'pending').length;

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ['project-workers', projectId] });

  const toggleExpanded = (workerId: number) => {
    setExpandedWorkerIds((prev) => {
      const next = new Set(prev);
      if (next.has(workerId)) next.delete(workerId);
      else next.add(workerId);
      return next;
    });
  };

  // ── Mutations ───────────────────────────────────────────────────────────────
  const assignSlotMutation = useMutation({
    mutationFn: ({
      slotId, workerId, from, to, costRate,
    }: { slotId: number; workerId: number; from: string; to: string; costRate: number | null }) =>
      projectWorkersApi.assignSlot(slotId, {
        worker_id: workerId,
        assigned_from: from || undefined,
        assigned_to: to || null,
        actual_cost_rate: costRate ?? undefined,
      }),
    onSuccess: (result) => {
      invalidate();
      setAssigningSlot(null);
      setSelectedWorkerId('');
      setAssignedFrom(project.start_date ?? '');
      setAssignedTo(project.estimated_end_date ?? '');
      setActualCostRate(null);
      setRateAutoFilled(false);
      toast.success('Lavoratore assegnato con successo');
      const cost = Number(result.actual_cost_rate ?? 0);
      const customerRate = Number(result.customer_rate ?? 0);
      if (cost > 0 && customerRate > 0 && cost >= customerRate) {
        toast.warning(
          `Attenzione: tariffa costo (€\u202f${formatCurrency(cost)}/gg) ≥ prezzo venduto (€\u202f${formatCurrency(customerRate)}/gg).`,
          { duration: 8000 }
        );
      }
    },
    onError: () => toast.error("Errore durante l'assegnazione"),
  });

  const createSlotMutation = useMutation({
    mutationFn: async () => {
      const slot = await projectWorkersApi.createSlot(projectId, {
        role_name: newRoleName.trim(),
        estimated_days: newEstimatedDays !== '' ? parseFloat(newEstimatedDays) : null,
        budget_cost_rate: newBudgetRate,
        customer_rate: newCustomerRate,
        notes: newNotes.trim() || null,
      });
      if (newWorkerId) {
        await projectWorkersApi.assignSlot(slot.id, {
          worker_id: parseInt(newWorkerId),
          assigned_from: newWorkerAssignedFrom || undefined,
          assigned_to: newWorkerAssignedTo || null,
          actual_cost_rate: newWorkerCostRate ?? undefined,
        });
      }
      return { slot, workerAssigned: !!newWorkerId };
    },
    onSuccess: ({ workerAssigned }) => {
      invalidate();
      setCreateOpen(false);
      setNewRoleName('');
      setNewEstimatedDays('');
      setNewBudgetRate(null);
      setNewCustomerRate(null);
      setNewNotes('');
      setNewWorkerId('');
      setNewWorkerAssignedFrom('');
      setNewWorkerAssignedTo('');
      setNewWorkerCostRate(null);
      setNewWorkerRateAutoFilled(false);
      toast.success(workerAssigned ? 'Slot creato e collaboratore assegnato' : 'Slot creato');
    },
    onError: (error: unknown) => {
      const msg = (error as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg ?? 'Errore durante la creazione dello slot');
    },
  });

  const deleteSlotMutation = useMutation({
    mutationFn: (id: number) => projectWorkersApi.removeWorker(id),
    onSuccess: () => { invalidate(); toast.success('Slot eliminato'); },
    onError: () => toast.error("Errore durante l'eliminazione"),
  });

  const acceptMutation = useMutation({
    mutationFn: (id: number) => projectWorkersApi.acceptAssignment(id),
    onSuccess: () => { invalidate(); toast.success('Assegnazione accettata'); },
    onError: () => toast.error("Errore"),
  });

  const rejectMutation = useMutation({
    mutationFn: (id: number) => projectWorkersApi.rejectAssignment(id),
    onSuccess: () => { invalidate(); toast.success('Assegnazione rifiutata'); },
    onError: () => toast.error('Errore'),
  });

  const resendInviteMutation = useMutation({
    mutationFn: (id: number) => projectWorkersApi.resendInvite(id),
    onSuccess: () => toast.success('Invito re-inviato con successo'),
    onError: () => toast.error('Errore durante il re-invio'),
  });

  const changeStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      projectWorkersApi.changeStatus(id, { status: status as ProjectWorkerStatus }),
    onSuccess: () => { invalidate(); toast.success('Stato aggiornato'); },
    onError: () => toast.error("Errore"),
  });

  const removeMutation = useMutation({
    mutationFn: (id: number) => projectWorkersApi.removeWorker(id),
    onSuccess: () => { invalidate(); toast.success('Lavoratore rimosso'); },
    onError: () => toast.error('Errore'),
  });

  const acceptAllConvocazioniMutation = useMutation({
    mutationFn: async (workerId: number) => {
      const pending = convocazioni.filter(
        (c) => c.worker_id != null && c.worker_id === workerId && c.status === 'pending'
      );
      await Promise.all(pending.map((c) => projectWorkersApi.acceptSchedule(c.id)));
      return pending.length;
    },
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: ['project-schedules', projectId] });
      toast.success(`${count} convocazion${count === 1 ? 'e accettata' : 'i accettate'}`);
    },
    onError: () => toast.error("Errore durante l'accettazione"),
  });

  const acceptScheduleMutation = useMutation({
    mutationFn: (scheduleId: number) => projectWorkersApi.acceptSchedule(scheduleId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-schedules', projectId] });
      toast.success('Convocazione accettata');
    },
    onError: () => toast.error("Errore durante l'accettazione"),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8 text-slate-500 dark:text-slate-400">
        Caricamento personale...
      </div>
    );
  }

  const scheduleStatusColors: Record<string, string> = {
    pending:   'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
    accepted:  'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
    rejected:  'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
    modified:  'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300',
    completed: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
    cancelled: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  };

  const scheduleStatusLabels: Record<string, string> = {
    pending:   'In attesa',
    accepted:  'Confermato',
    rejected:  'Rifiutato',
    modified:  'Modificato',
    completed: 'Completato',
    cancelled: 'Annullato',
  };

  return (
    <div className="space-y-4">
      <Tabs defaultValue="slot" className="space-y-4">
        {/* ── Tab list ─────────────────────────────────────────────────────── */}
        <TabsList>
          <TabsTrigger value="slot" className="gap-1.5">
            <ClipboardList className="h-3.5 w-3.5" />
            Slot
            {slots.length > 0 && (
              <Badge className="ml-1 h-4 min-w-4 rounded-full px-1 text-[10px] bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300">
                {slots.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="lavoratori" className="gap-1.5">
            <Users className="h-3.5 w-3.5" />
            Lavoratori
            {pendingCount > 0 && (
              <Badge className="ml-1 h-4 min-w-4 rounded-full px-1 text-[10px] bg-yellow-200 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300">
                {pendingCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="convocazioni" className="gap-1.5">
            <Calendar className="h-3.5 w-3.5" />
            Convocazioni
            {convocazioni.length > 0 && (
              <Badge className="ml-1 h-4 min-w-4 rounded-full px-1 text-[10px] bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300">
                {convocazioniByDate.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="storico">Storico</TabsTrigger>
        </TabsList>

        {/* ══════════════════════════════════════════════════════════════════════
            TAB: SLOT
           ══════════════════════════════════════════════════════════════════════ */}
        <TabsContent value="slot" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-slate-900 dark:text-slate-100">
                Slot da ricoprire
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Posizioni aperte dal preventivo o aggiunte manualmente
              </p>
            </div>
            <Button
              size="sm"
              onClick={() => setCreateOpen(true)}
              className="gap-1.5"
            >
              <Plus className="h-4 w-4" />
              Aggiungi slot
            </Button>
          </div>

          {slots.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 py-12 text-center dark:border-slate-700 dark:bg-slate-800/20">
              <Users className="mb-4 h-10 w-10 text-slate-300 dark:text-slate-600" />
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                Nessuno slot aperto
              </p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-500">
                Gli slot vengono creati dalla conversione del preventivo o manualmente.
              </p>
              <Button
                size="sm"
                onClick={() => setCreateOpen(true)}
                className="mt-4 gap-1.5"
              >
                <Plus className="h-4 w-4" />
                Aggiungi il primo slot
              </Button>
            </div>
          ) : (
            <>
              {/* Aggregated role summary */}
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
                {slotsByRole.map(([roleName, { total, filled }]) => {
                  const allFilled = filled === total;
                  const noneFilled = filled === 0;
                  return (
                    <div
                      key={roleName}
                      className={cn(
                        'rounded-lg border px-3 py-2.5',
                        allFilled
                          ? 'border-green-200 bg-green-50 dark:border-green-800/40 dark:bg-green-950/20'
                          : noneFilled
                            ? 'border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/30'
                            : 'border-yellow-200 bg-yellow-50 dark:border-yellow-800/40 dark:bg-yellow-950/20'
                      )}
                    >
                      <p className="truncate text-xs font-medium text-slate-700 dark:text-slate-300">
                        {roleName}
                      </p>
                      <div className="mt-1 flex items-center gap-1.5">
                        <span className={cn(
                          'text-lg font-bold tabular-nums leading-none',
                          allFilled
                            ? 'text-green-600 dark:text-green-400'
                            : noneFilled
                              ? 'text-slate-500 dark:text-slate-400'
                              : 'text-yellow-600 dark:text-yellow-400'
                        )}>
                          {filled}
                        </span>
                        <span className="text-xs text-slate-400 dark:text-slate-500">/ {total}</span>
                        <span className="ml-auto text-[10px] text-slate-400 dark:text-slate-500">
                          {allFilled ? '✓ coperti' : `${total - filled} aperti`}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              <Card className="border-slate-200 dark:border-slate-700">
              <CardContent className="pt-4">
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {slots.map((slot) => (
                    <div
                      key={slot.id}
                      className="flex items-center justify-between py-3 first:pt-0 last:pb-0"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                            {slot.role_name ?? 'Ruolo non definito'}
                            {(slot.slot_index ?? 1) > 1 && (
                              <span className="ml-1 text-xs text-slate-400 dark:text-slate-500">
                                #{slot.slot_index}
                              </span>
                            )}
                          </p>
                          {slot.quote_item_id && (
                            <Badge className="h-4 px-1.5 text-[10px] bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-400">
                              Preventivo
                            </Badge>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-slate-500 dark:text-slate-400">
                          {slot.estimated_days != null && (
                            <span>{slot.estimated_days} gg stimati</span>
                          )}
                          {slot.budget_cost_rate != null && (
                            <span>
                              · Costo:{' '}
                              <CurrencyDisplay value={Number(slot.budget_cost_rate)} />/gg
                            </span>
                          )}
                          {slot.customer_rate != null && (
                            <span>
                              · Vendita:{' '}
                              <CurrencyDisplay value={Number(slot.customer_rate)} />/gg
                            </span>
                          )}
                          {slot.notes && <span className="italic">· {slot.notes}</span>}
                        </div>
                      </div>
                      <div className="ml-4 flex shrink-0 items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setAssigningSlot(slot);
                            setSelectedWorkerId('');
                            setAssignedFrom(project.start_date ?? '');
                            setAssignedTo(project.estimated_end_date ?? '');
                            setActualCostRate(null);
                            setRateAutoFilled(false);
                          }}
                          className="border-slate-200 dark:border-slate-700 dark:text-slate-100"
                        >
                          Assegna
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => deleteSlotMutation.mutate(slot.id)}
                          disabled={deleteSlotMutation.isPending}
                          className="text-red-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            </>
          )}
        </TabsContent>

        {/* ══════════════════════════════════════════════════════════════════════
            TAB: LAVORATORI
           ══════════════════════════════════════════════════════════════════════ */}
        <TabsContent value="lavoratori" className="space-y-4">
          {pendingCount > 0 && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                {pendingCount} lavorator{pendingCount === 1 ? 'e' : 'i'} in attesa di conferma
              </AlertDescription>
            </Alert>
          )}

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-40">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Cerca per nome o mansione..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
            </div>
            <Select
              value={statusFilter}
              onValueChange={(v) => setStatusFilter(v as ProjectWorkerStatus | 'all')}
            >
              <SelectTrigger className="w-40 border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100">
                <SelectValue placeholder="Tutti gli stati" />
              </SelectTrigger>
              <SelectContent className="border-slate-200 dark:border-slate-700 dark:bg-slate-900">
                <SelectItem value="all">Tutti gli stati</SelectItem>
                <SelectItem value="pending">In attesa</SelectItem>
                <SelectItem value="accepted">Accettato</SelectItem>
                <SelectItem value="active">Attivo</SelectItem>
              </SelectContent>
            </Select>
            {(searchQuery || statusFilter !== 'all') && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => { setSearchQuery(''); setStatusFilter('all'); }}
                className="text-slate-500 dark:text-slate-400"
              >
                <XIcon className="mr-1 h-4 w-4" />
                Pulisci
              </Button>
            )}
          </div>

          <Card className="border-slate-200 dark:border-slate-700">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-base text-slate-900 dark:text-slate-100">
                Personale assegnato
              </CardTitle>
              <Button
                size="sm"
                onClick={() => { setEditAssignment(null); setAssignDialogOpen(true); }}
                className="gap-1.5"
              >
                <UserPlus className="h-4 w-4" />
                Assegna lavoratore
              </Button>
            </CardHeader>
            <CardContent>
              {filteredAggregatedWorkers.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <UserPlus className="mb-3 h-10 w-10 text-slate-300 dark:text-slate-600" />
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {searchQuery || statusFilter !== 'all'
                      ? 'Nessun lavoratore trovato con i filtri selezionati'
                      : 'Nessun lavoratore assegnato — assegna uno slot o usa "Assegna lavoratore"'}
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredAggregatedWorkers.map((entry) => {
                    const representativeSlot = entry.slots[0];
                    const isExpanded = expandedWorkerIds.has(entry.workerId);
                    const scheduleCount = convocazioni.filter(
                      (c) =>
                        (c.worker_id != null && c.worker_id === entry.workerId) ||
                        entry.slots.some((s) => s.id === c.project_worker_id)
                    ).length;
                    return (
                      <div key={entry.workerId} className="py-2 first:pt-0 last:pb-0">
                        {/* Worker row — entire row is clickable except the dropdown */}
                        <div
                          className="flex items-center gap-3 cursor-pointer rounded-md px-1 -mx-1 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                          onClick={() => toggleExpanded(entry.workerId)}
                        >
                          {/* Expand toggle */}
                          <span className="shrink-0 text-slate-400">
                            {isExpanded ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                          </span>

                          {/* Worker info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                                {entry.workerName}
                              </span>
                              {entry.workerCode && (
                                <span className="text-xs text-slate-400 dark:text-slate-500 font-mono">
                                  {entry.workerCode}
                                </span>
                              )}
                              {entry.roles.map((role) => (
                                <Badge key={role} variant="secondary" className="text-[10px] px-1.5 py-0 h-4">
                                  {role}
                                </Badge>
                              ))}
                              {scheduleCount > 0 && (
                                <span className="inline-flex items-center gap-0.5 rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                                  <Calendar className="h-2.5 w-2.5" />
                                  {scheduleCount}
                                </span>
                              )}
                            </div>
                            <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-slate-400 dark:text-slate-500">
                              {representativeSlot?.assigned_from && (
                                <span>
                                  Dal{' '}
                                  {format(parseISO(String(representativeSlot.assigned_from)), 'dd MMM yyyy', { locale: it })}
                                  {representativeSlot.assigned_to &&
                                    ` → ${format(parseISO(String(representativeSlot.assigned_to)), 'dd MMM yyyy', { locale: it })}`}
                                </span>
                              )}
                              {entry.slots.length > 1 && (
                                <span className="text-slate-400 dark:text-slate-500">
                                  {entry.slots.length} assegnazioni
                                </span>
                              )}
                              {representativeSlot?.actual_cost_rate != null && (
                                <span>
                                  Costo: <CurrencyDisplay value={Number(representativeSlot.actual_cost_rate)} />/gg
                                </span>
                              )}
                              {representativeSlot?.customer_rate != null && (
                                <span>
                                  Vendita: <CurrencyDisplay value={Number(representativeSlot.customer_rate)} />/gg
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Status badge — show primary slot status */}
                          <ProjectWorkerStatusBadge status={representativeSlot?.status ?? 'pending'} />

                          {/* Actions — stop propagation so click doesn't toggle expand */}
                          <div onClick={(e) => e.stopPropagation()}>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-7 w-7 p-0 shrink-0">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="border-slate-200 dark:border-slate-700 dark:bg-slate-900">
                              <DropdownMenuLabel className="text-slate-900 dark:text-slate-100">
                                Azioni
                              </DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => {
                                  if (representativeSlot) {
                                    // Merge all unique roles from every slot for this worker
                                    const allRoles = entry.slots
                                      .flatMap((s) => s.roles ?? [])
                                      .filter(
                                        (r, i, arr) =>
                                          arr.findIndex((x) => x.id === r.id) === i
                                      );
                                    const mergedAssignment: ProjectWorker = {
                                      ...representativeSlot,
                                      roles: allRoles,
                                    };
                                    setEditAssignment(mergedAssignment);
                                  } else {
                                    setEditAssignment(null);
                                  }
                                  setAssignDialogOpen(true);
                                }}
                                className="dark:text-slate-100"
                              >
                                <Edit className="mr-2 h-4 w-4" />
                                Modifica
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => { setManageRolesAssignment(representativeSlot ?? null); setRolesDialogOpen(true); }}
                                className="dark:text-slate-100"
                              >
                                <Users className="mr-2 h-4 w-4" />
                                Gestisci Ruoli
                              </DropdownMenuItem>
                              {convocazioni.some(
                                (c) => c.worker_id != null && c.worker_id === entry.workerId && c.status === 'pending'
                              ) && (
                                <>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onClick={() => acceptAllConvocazioniMutation.mutate(entry.workerId)}
                                    disabled={acceptAllConvocazioniMutation.isPending}
                                    className="dark:text-slate-100"
                                  >
                                    <Check className="mr-2 h-4 w-4" />
                                    Accetta convocazioni
                                  </DropdownMenuItem>
                                </>
                              )}
                              <DropdownMenuSeparator />
                              {representativeSlot?.status === 'pending' && (
                                <>
                                  <DropdownMenuItem
                                    onClick={() => representativeSlot && acceptMutation.mutate(representativeSlot.id)}
                                    className="dark:text-slate-100"
                                  >
                                    <CheckCircle2 className="mr-2 h-4 w-4" />
                                    Accetta
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => representativeSlot && rejectMutation.mutate(representativeSlot.id)}
                                    className="dark:text-slate-100"
                                  >
                                    <XCircle className="mr-2 h-4 w-4" />
                                    Rifiuta
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => representativeSlot && resendInviteMutation.mutate(representativeSlot.id)}
                                    className="dark:text-slate-100"
                                  >
                                    <Send className="mr-2 h-4 w-4" />
                                    Re-invia invito
                                  </DropdownMenuItem>
                                </>
                              )}
                              {representativeSlot?.status === 'accepted' && (
                                <DropdownMenuItem
                                  onClick={() => representativeSlot && changeStatusMutation.mutate({ id: representativeSlot.id, status: 'active' })}
                                  className="dark:text-slate-100"
                                >
                                  <Play className="mr-2 h-4 w-4" />
                                  Attiva
                                </DropdownMenuItem>
                              )}
                              {representativeSlot?.status === 'active' && (
                                <DropdownMenuItem
                                  onClick={() => representativeSlot && changeStatusMutation.mutate({ id: representativeSlot.id, status: 'completed' })}
                                  className="dark:text-slate-100"
                                >
                                  <CheckCheck className="mr-2 h-4 w-4" />
                                  Completa
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem
                                onClick={() => representativeSlot && changeStatusMutation.mutate({ id: representativeSlot.id, status: 'cancelled' })}
                                className="dark:text-slate-100"
                              >
                                <Ban className="mr-2 h-4 w-4" />
                                Annulla
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => representativeSlot && removeMutation.mutate(representativeSlot.id)}
                                className="text-red-600 dark:text-red-400"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Rimuovi
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                          </div>{/* end stopPropagation wrapper */}
                        </div>{/* end row */}

                        {/* Expandable schedule panel */}
                        {isExpanded && representativeSlot && (
                          <div className="pl-7">
                            <WorkerSchedulePanel projectWorker={representativeSlot} project={project} />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ══════════════════════════════════════════════════════════════════════
            TAB: CONVOCAZIONI
           ══════════════════════════════════════════════════════════════════════ */}
        <TabsContent value="convocazioni" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-slate-900 dark:text-slate-100">
                Vista giorno per giorno
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Chi è convocato per ogni data, con orari e stato conferma
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrintPresence}
                disabled={convocazioni.filter((c) => c.status === 'accepted').length === 0}
                className="gap-1.5"
              >
                <ClipboardCheck className="h-3.5 w-3.5" />
                Foglio Presenze
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrint}
                disabled={convocazioni.length === 0}
                className="gap-1.5"
              >
                <Printer className="h-3.5 w-3.5" />
                Stampa / PDF
              </Button>
            </div>
          </div>

          {convocazioniByDate.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 py-12 text-center dark:border-slate-700 dark:bg-slate-800/20">
              <Calendar className="mb-4 h-10 w-10 text-slate-300 dark:text-slate-600" />
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                Nessuna convocazione pianificata
              </p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-500">
                Assegna i lavoratori e genera le convocazioni dalla tab Lavoratori.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {convocazioniByDate.map(([date, entries]) => (
                <Card key={date} className="border-slate-200 dark:border-slate-700">
                  <CardHeader className="pb-2 pt-3">
                    <CardTitle className="flex items-center gap-2 text-sm text-slate-900 dark:text-slate-100">
                      <Calendar className="h-4 w-4 text-blue-500" />
                      {format(parseISO(date), 'EEEE dd MMMM yyyy', { locale: it })}
                      <Badge className="ml-auto text-xs bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                        {entries.length} {entries.length === 1 ? 'lavoratore' : 'lavoratori'}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="divide-y divide-slate-50 dark:divide-slate-800/50">
                      {entries.map((entry) => (
                        <div
                          key={entry.id}
                          className="flex items-center gap-3 py-2 first:pt-0 last:pb-0"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                              {entry.worker_name ?? '—'}
                            </p>
                            {entry.role_name && (
                              <p className="text-xs text-slate-500 dark:text-slate-400">
                                {entry.role_name}
                              </p>
                            )}
                          </div>
                          <span className="text-xs text-slate-500 dark:text-slate-400">
                            {entry.planned_start_time?.slice(0, 5) ?? '09:00'} – {entry.planned_end_time?.slice(0, 5) ?? '18:00'}
                          </span>
                          <span className="text-xs text-slate-400">
                            ({entry.effective_planned_hours}h)
                          </span>
                          <Badge
                            className={cn(
                              'shrink-0 px-1.5 py-0 text-xs',
                              scheduleStatusColors[entry.status as string] ?? scheduleStatusColors.pending
                            )}
                          >
                            {scheduleStatusLabels[entry.status as string] ?? entry.status}
                          </Badge>
                          {entry.status === 'pending' && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-6 gap-1 px-2 text-xs border-slate-200 dark:border-slate-700 dark:text-slate-100"
                              disabled={acceptScheduleMutation.isPending}
                              onClick={() => acceptScheduleMutation.mutate(entry.id)}
                            >
                              <Check className="h-3 w-3" />
                              Accetta
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ══════════════════════════════════════════════════════════════════════
            TAB: STORICO
           ══════════════════════════════════════════════════════════════════════ */}
        <TabsContent value="storico" className="space-y-4">
          <Card className="border-slate-200 dark:border-slate-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-base text-slate-900 dark:text-slate-100">
                Storico lavoratori
              </CardTitle>
            </CardHeader>
            <CardContent>
              {historyWorkers.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <Users className="mb-3 h-10 w-10 text-slate-300 dark:text-slate-600" />
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Nessun lavoratore nello storico
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="border-slate-200 dark:border-slate-700">
                      <TableHead className="text-slate-600 dark:text-slate-400">Lavoratore</TableHead>
                      <TableHead className="text-slate-600 dark:text-slate-400">Mansione</TableHead>
                      <TableHead className="text-slate-600 dark:text-slate-400">Stato</TableHead>
                      <TableHead className="text-slate-600 dark:text-slate-400">Periodo</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {historyWorkers.map((worker) => (
                      <TableRow key={worker.id} className="border-slate-100 dark:border-slate-800">
                        <TableCell className="font-medium text-slate-900 dark:text-slate-100">
                          {worker.worker?.full_name ?? worker.worker_name ?? '—'}
                        </TableCell>
                        <TableCell className="text-sm text-slate-500 dark:text-slate-400">
                          {worker.role_name ?? '—'}
                        </TableCell>
                        <TableCell>
                          <ProjectWorkerStatusBadge status={worker.status} />
                        </TableCell>
                        <TableCell className="text-sm text-slate-500 dark:text-slate-400">
                          {worker.assigned_from
                            ? format(parseISO(String(worker.assigned_from)), 'dd MMM yyyy', { locale: it })
                            : '—'}
                          {worker.assigned_to &&
                            ` → ${format(parseISO(String(worker.assigned_to)), 'dd MMM yyyy', { locale: it })}`}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ══════════════════════════════════════════════════════════════════════
          DIALOGS
         ══════════════════════════════════════════════════════════════════════ */}

      {/* ── Quick-assign slot dialog ─────────────────────────────────────────── */}
      <Dialog
        open={!!assigningSlot}
        onOpenChange={(open) => {
          if (!open) {
            setAssigningSlot(null);
            setSelectedWorkerId('');
            setAssignedFrom(project.start_date ?? '');
            setAssignedTo(project.estimated_end_date ?? '');
            setActualCostRate(null);
            setRateAutoFilled(false);
          }
        }}
      >
        <DialogContent className="border-slate-200 bg-white sm:max-w-md dark:border-slate-700 dark:bg-slate-900">
          <DialogHeader>
            <DialogTitle className="text-slate-900 dark:text-slate-100">
              Assegna collaboratore
            </DialogTitle>
          </DialogHeader>
          {assigningSlot && (
            <div className="space-y-4">
              {/* Slot info */}
              <div className="rounded-md bg-slate-50 p-3 dark:bg-slate-800">
                <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                  {assigningSlot.role_name}
                </p>
                <div className="mt-0.5 flex gap-3 text-xs text-slate-500 dark:text-slate-400">
                  {assigningSlot.estimated_days != null && (
                    <span>{assigningSlot.estimated_days} gg stimati</span>
                  )}
                  {assigningSlot.customer_rate != null && (
                    <span>Vendita: <CurrencyDisplay value={Number(assigningSlot.customer_rate)} />/gg</span>
                  )}
                </div>
              </div>

              {/* Worker select */}
              <div className="space-y-2">
                <Label className="text-slate-900 dark:text-slate-100">
                  Collaboratore <span className="text-red-500">*</span>
                </Label>
                <ComboboxSelect
                  options={availableWorkers.map((w) => ({
                    value: String(w.id),
                    label: w.full_name,
                    description: w.job_title ?? undefined,
                  }))}
                  value={selectedWorkerId}
                  onValueChange={(v) => {
                    setSelectedWorkerId(v);
                    setActualCostRate(null);
                    setRateAutoFilled(false);
                  }}
                  placeholder="Seleziona collaboratore..."
                  searchPlaceholder="Cerca per nome..."
                  emptyText="Nessun collaboratore trovato"
                />
                {selectedWorkerData && (
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {selectedWorkerData.job_title
                      ? `${selectedWorkerData.job_title} · `
                      : ''}
                    {selectedWorkerData.worker_type === 'employee'
                      ? 'Dipendente interno'
                      : 'Esterno — verrà inviata notifica di invito'}
                  </p>
                )}
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="text-slate-900 dark:text-slate-100">Data inizio</Label>
                  <Input
                    type="date"
                    value={assignedFrom}
                    onChange={(e) => setAssignedFrom(e.target.value)}
                    className="border-slate-200 bg-white text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  />
                  {project.start_date && (
                    <p className="text-xs text-slate-400 dark:text-slate-500">
                      Da inizio progetto
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-900 dark:text-slate-100">Data fine (opz.)</Label>
                  <Input
                    type="date"
                    value={assignedTo}
                    onChange={(e) => setAssignedTo(e.target.value)}
                    className="border-slate-200 bg-white text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  />
                  {project.estimated_end_date && (
                    <p className="text-xs text-slate-400 dark:text-slate-500">
                      Da fine progetto
                    </p>
                  )}
                </div>
              </div>

              {/* Cost rate override */}
              <div className="space-y-2">
                <Label className="text-slate-900 dark:text-slate-100">
                  Tariffa costo (€/gg)
                </Label>
                <CurrencyInput
                  value={actualCostRate}
                  onChange={(v) => { setActualCostRate(v); setRateAutoFilled(false); }}
                  placeholder="es. 200,00"
                  className="border-slate-200 bg-white text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                />
                <p className="text-xs text-slate-400 dark:text-slate-500">
                  {rateAutoFilled
                    ? '✓ Auto-compilata dalla tariffa del collaboratore — modificabile'
                    : 'Lascia vuoto per usare la tariffa standard del collaboratore'}
                </p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => { setAssigningSlot(null); setSelectedWorkerId(''); setAssignedTo(project.estimated_end_date ?? ''); setActualCostRate(null); setRateAutoFilled(false); }}
              className="border-slate-200 dark:border-slate-700 dark:text-slate-100"
            >
              Annulla
            </Button>
            <Button
              onClick={() => {
                if (!assigningSlot || !selectedWorkerId) return;
                assignSlotMutation.mutate({
                  slotId: assigningSlot.id,
                  workerId: parseInt(selectedWorkerId),
                  from: assignedFrom,
                  to: assignedTo,
                  costRate: actualCostRate,
                });
              }}
              disabled={!selectedWorkerId || assignSlotMutation.isPending}
            >
              {assignSlotMutation.isPending ? 'Assegnando...' : 'Assegna'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Create Slot Dialog ───────────────────────────────────────────────── */}
      <Dialog
        open={createOpen}
        onOpenChange={(open) => {
          if (!open) {
            setCreateOpen(false);
            setNewRoleName('');
            setNewEstimatedDays('');
            setNewBudgetRate(null);
            setNewCustomerRate(null);
            setNewNotes('');
            setNewWorkerId('');
            setNewWorkerAssignedFrom('');
            setNewWorkerAssignedTo('');
            setNewWorkerCostRate(null);
            setNewWorkerRateAutoFilled(false);
          }
        }}
      >
        <DialogContent className="border-slate-200 bg-white sm:max-w-lg dark:border-slate-700 dark:bg-slate-900">
          <DialogHeader>
            <DialogTitle className="text-slate-900 dark:text-slate-100">
              Nuovo slot personale
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Role name with project-role suggestions */}
            <div className="space-y-2">
              <Label className="text-slate-900 dark:text-slate-100">
                Mansione / Ruolo <span className="text-red-500">*</span>
              </Label>
              <Select
                value=""
                onValueChange={(roleName) => setNewRoleName(roleName)}
              >
                <SelectTrigger className="border-slate-200 bg-white text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100">
                  <SelectValue placeholder="Suggerisci dal preventivo…" />
                </SelectTrigger>
                <SelectContent className="border-slate-200 dark:border-slate-700 dark:bg-slate-900">
                  {projectRoles.map((role) => (
                    <SelectItem key={role.id} value={role.name} className="dark:text-slate-100">
                      {role.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                value={newRoleName}
                onChange={(e) => setNewRoleName(e.target.value)}
                placeholder="es. Elettricista, Operatore video, Fonico…"
                className="border-slate-200 bg-white text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
              <p className="text-xs text-slate-400 dark:text-slate-500">
                Seleziona un suggerimento o scrivi liberamente
              </p>
            </div>

            <div className="space-y-2">
              <Label className="text-slate-900 dark:text-slate-100">Giorni stimati</Label>
              <Input
                type="text"
                inputMode="decimal"
                value={newEstimatedDays}
                onChange={(e) => setNewEstimatedDays(e.target.value)}
                placeholder="es. 3"
                className="border-slate-200 bg-white text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-slate-900 dark:text-slate-100">Costo budget (€/gg)</Label>
                <CurrencyInput
                  value={newBudgetRate}
                  onChange={(v) => setNewBudgetRate(v)}
                  placeholder="0,00"
                  className="border-slate-200 bg-white text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                />
                <p className="text-xs text-slate-400 dark:text-slate-500">
                  Previsione per il budget, anche senza collaboratore assegnato
                </p>
              </div>
              <div className="space-y-2">
                <Label className="text-slate-900 dark:text-slate-100">Tariffa vendita (€/gg)</Label>
                <CurrencyInput
                  value={newCustomerRate}
                  onChange={(v) => setNewCustomerRate(v)}
                  placeholder="0,00"
                  className="border-slate-200 bg-white text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-slate-900 dark:text-slate-100">Note (opzionale)</Label>
              <Textarea
                value={newNotes}
                onChange={(e) => setNewNotes(e.target.value)}
                placeholder="Dettagli aggiuntivi…"
                rows={2}
                className="border-slate-200 bg-white text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
            </div>

            {/* Separator */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-slate-200 dark:border-slate-700" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-slate-400 dark:bg-slate-900 dark:text-slate-500">
                  Assegna subito un collaboratore (opzionale)
                </span>
              </div>
            </div>

            {/* Worker assignment section */}
            <div className="space-y-3">
              <div className="space-y-2">
                <Label className="text-slate-900 dark:text-slate-100">Collaboratore</Label>
                <ComboboxSelect
                  options={availableWorkers.map((w) => ({
                    value: String(w.id),
                    label: w.full_name,
                    description: w.job_title ?? undefined,
                  }))}
                  value={newWorkerId}
                  onValueChange={(v) => {
                    setNewWorkerId(v);
                    setNewWorkerCostRate(null);
                    setNewWorkerRateAutoFilled(false);
                  }}
                  placeholder="Seleziona collaboratore (opzionale)..."
                  searchPlaceholder="Cerca per nome..."
                  emptyText="Nessun collaboratore trovato"
                />
                {newSlotWorkerData && (
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {newSlotWorkerData.job_title ? `${newSlotWorkerData.job_title} · ` : ''}
                    {newSlotWorkerData.worker_type === 'employee'
                      ? 'Dipendente interno'
                      : 'Esterno — verrà inviata notifica di invito'}
                  </p>
                )}
              </div>

              {newWorkerId && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label className="text-slate-900 dark:text-slate-100">Data inizio</Label>
                      <Input
                        type="date"
                        value={newWorkerAssignedFrom}
                        onChange={(e) => setNewWorkerAssignedFrom(e.target.value)}
                        className="border-slate-200 bg-white text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-slate-900 dark:text-slate-100">Data fine (opz.)</Label>
                      <Input
                        type="date"
                        value={newWorkerAssignedTo}
                        onChange={(e) => setNewWorkerAssignedTo(e.target.value)}
                        className="border-slate-200 bg-white text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-900 dark:text-slate-100">Tariffa costo (€/gg)</Label>
                    <CurrencyInput
                      value={newWorkerCostRate}
                      onChange={(v) => { setNewWorkerCostRate(v); setNewWorkerRateAutoFilled(false); }}
                      placeholder="es. 200,00"
                      className="border-slate-200 bg-white text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                    />
                    <p className="text-xs text-slate-400 dark:text-slate-500">
                      {newWorkerRateAutoFilled
                        ? '✓ Auto-compilata dalla tariffa del collaboratore — modificabile'
                        : 'Lascia vuoto per usare la tariffa standard del collaboratore'}
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCreateOpen(false)}
              className="border-slate-200 dark:border-slate-700 dark:text-slate-100"
            >
              Annulla
            </Button>
            <Button
              onClick={() => { if (newRoleName.trim()) createSlotMutation.mutate(); }}
              disabled={!newRoleName.trim() || createSlotMutation.isPending}
            >
              {createSlotMutation.isPending ? 'Creando...' : 'Crea slot'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Full assign worker dialog ─────────────────────────────────────────── */}
      <AssignWorkerDialog
        projectId={projectId}
        project={project}
        assignment={editAssignment}
        open={assignDialogOpen}
        onOpenChange={(open) => {
          setAssignDialogOpen(open);
          if (!open) setEditAssignment(null);
        }}
      />

      {/* ── Manage roles dialog ───────────────────────────────────────────────── */}
      <ManageWorkerRolesDialog
        projectId={projectId}
        assignment={manageRolesAssignment}
        open={rolesDialogOpen}
        onOpenChange={(open) => {
          setRolesDialogOpen(open);
          if (!open) setManageRolesAssignment(null);
        }}
      />

      {/* ── Hidden print target ──────────────────────────────────────────────── */}
      <div style={{ display: 'none' }}>
        <div ref={printRef}>
          <ConvocazioniPrintView
            project={project}
            convocazioni={convocazioni}
            printedAt={new Date()}
          />
        </div>
      </div>

      {/* ── Hidden presence sheet print target ──────────────────────────────── */}
      <div style={{ display: 'none' }}>
        <div ref={presencePrintRef}>
          <ConvocazioniPrintView
            project={project}
            convocazioni={convocazioni}
            showOnlyAccepted
            printedAt={new Date()}
          />
        </div>
      </div>
    </div>
  );
}
