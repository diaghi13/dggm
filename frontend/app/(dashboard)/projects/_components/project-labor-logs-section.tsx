'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { projectLaborLogsApi } from '@/lib/api/project-labor-logs';
import { projectWorkersApi } from '@/lib/api/project-workers';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import { ChevronDown, ChevronRight, Pencil, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { handleMutationError } from '@/lib/utils/handle-mutation-error';
import { cn } from '@/lib/utils';
import type { ProjectLaborLog } from '@/lib/types';

interface Props {
  projectId: number;
  plannedHours?: number;
}

const statusColors: Record<string, string> = {
  draft:     'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
  submitted: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300',
  approved:  'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
  rejected:  'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
};

const statusLabels: Record<string, string> = {
  draft:     'Bozza',
  submitted: 'In attesa',
  approved:  'Approvato',
  rejected:  'Rifiutato',
};

interface SubmitLogForm {
  project_worker_id: string;
  log_date: string;
  clock_in: string;
  clock_out: string;
  description: string;
  overtime_cause: string;
  is_billable_to_client: boolean;
  overtime_rate_multiplier: string;
  include_in_final_balance: boolean;
  break_minutes: number;
  overtime_rate_type: 'multiplier' | 'direct_rate';
  overtime_direct_rate: number | null;
  status: string;
}

const EMPTY_LOG_FORM: SubmitLogForm = {
  project_worker_id: '',
  log_date: new Date().toISOString().slice(0, 10),
  clock_in: '08:00',
  clock_out: '16:00',
  description: '',
  overtime_cause: '',
  is_billable_to_client: false,
  overtime_rate_multiplier: '1.5',
  include_in_final_balance: true,
  break_minutes: 0,
  overtime_rate_type: 'multiplier',
  overtime_direct_rate: null,
  status: 'submitted',
};

function formatTime(t: string | null): string {
  if (!t) return '—';
  // Accepts HH:MM or HH:MM:SS
  return t.slice(0, 5);
}

interface CollapsibleCardProps {
  title: string;
  children: React.ReactNode;
}

function CollapsibleCard({ title, children }: CollapsibleCardProps) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-lg border border-slate-200 dark:border-slate-700">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-3 py-2 text-sm font-medium text-slate-900 dark:text-slate-100"
      >
        <span>{title}</span>
        {open ? (
          <ChevronDown className="h-4 w-4 text-slate-500 dark:text-slate-400" />
        ) : (
          <ChevronRight className="h-4 w-4 text-slate-500 dark:text-slate-400" />
        )}
      </button>
      {open && (
        <div className="border-t border-slate-100 dark:border-slate-800 px-3 py-2">
          {children}
        </div>
      )}
    </div>
  );
}

export function ProjectLaborLogsSection({ projectId, plannedHours }: Props) {
  const queryClient = useQueryClient();
  const [rejectingLog, setRejectingLog] = useState<ProjectLaborLog | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const [logForm, setLogForm] = useState<SubmitLogForm>(EMPTY_LOG_FORM);
  const [editingLog, setEditingLog] = useState<ProjectLaborLog | null>(null);
  const pendingStatusChange = useRef<string | null>(null);

  const { data: logsData, isLoading } = useQuery({
    queryKey: ['project-labor-logs', projectId],
    queryFn: () => projectLaborLogsApi.getByProject(projectId, { per_page: 50 }),
  });

  const { data: assignedWorkers = [] } = useQuery({
    queryKey: ['project-workers', projectId],
    queryFn: () => projectWorkersApi.getWorkersByProject(projectId),
    select: (data) => data.filter((w) => w.status !== 'slot'),
  });

  const uniqueWorkers = useMemo(() => {
    const seen = new Set<number>();
    return assignedWorkers.filter((pw) => {
      const id = pw.worker?.id ?? pw.worker_id;
      if (!id || seen.has(id)) return false;
      seen.add(id);
      return true;
    });
  }, [assignedWorkers]);

  const logs = logsData?.data ?? [];

  const approveMutation = useMutation({
    mutationFn: (id: number) => projectLaborLogsApi.approve(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-labor-logs', projectId] });
      toast.success('Ore approvate');
    },
    onError: (error) => handleMutationError(error, "Errore durante l'approvazione"),
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) =>
      projectLaborLogsApi.reject(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-labor-logs', projectId] });
      setRejectingLog(null);
      setRejectionReason('');
      toast.success('Ore rifiutate');
    },
    onError: (error) => handleMutationError(error, 'Errore durante il rifiuto'),
  });

  // Computed hours from clock_in / clock_out in the form, accounting for break
  const computedHours = useMemo(() => {
    const { clock_in: clockIn, clock_out: clockOut, break_minutes: breakMins } = logForm;
    if (!clockIn || !clockOut) return null;
    const [inH, inM] = clockIn.split(':').map(Number);
    const [outH, outM] = clockOut.split(':').map(Number);
    let totalMins = (outH * 60 + outM) - (inH * 60 + inM);
    if (totalMins <= 0) totalMins += 24 * 60; // crosses midnight
    totalMins = Math.max(0, totalMins - (breakMins ?? 0));
    const totalHours = totalMins / 60;
    const regularHours = Math.min(totalHours, 8);
    const overtimeHours = Math.max(0, totalHours - 8);
    return { totalHours, regularHours, overtimeHours };
  }, [logForm.clock_in, logForm.clock_out, logForm.break_minutes]);

  const overtimeHours = computedHours?.overtimeHours ?? 0;

  // Smart break suggestion when clock_in/clock_out change
  useEffect(() => {
    const { clock_in: clockIn, clock_out: clockOut } = logForm;
    if (!clockIn || !clockOut) return;
    if (logForm.break_minutes !== 0) return;

    const [inH, inM] = clockIn.split(':').map(Number);
    const [outH, outM] = clockOut.split(':').map(Number);
    let rawMins = (outH * 60 + outM) - (inH * 60 + inM);
    if (rawMins <= 0) rawMins += 24 * 60;
    const rawHours = rawMins / 60;

    let suggested = 0;
    if (rawHours >= 13) suggested = 90;
    else if (rawHours >= 8) suggested = 60;
    else if (rawHours >= 6) suggested = 30;

    if (suggested > 0) {
      setLogForm((prev) => ({ ...prev, break_minutes: suggested }));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [logForm.clock_in, logForm.clock_out]);

  useEffect(() => {
    if (showSubmitDialog && !logForm.project_worker_id && uniqueWorkers.length > 0) {
      setLogForm((prev) => ({ ...prev, project_worker_id: String(uniqueWorkers[0].id) }));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showSubmitDialog, uniqueWorkers]);

  const submitMutation = useMutation({
    mutationFn: () => {
      const pwId = parseInt(logForm.project_worker_id, 10);
      if (isNaN(pwId)) throw new Error('Seleziona un lavoratore');
      return projectLaborLogsApi.submit(pwId, {
        log_date: logForm.log_date,
        clock_in: logForm.clock_in || undefined,
        clock_out: logForm.clock_out || undefined,
        description: logForm.description || null,
        overtime_cause: overtimeHours > 0 ? logForm.overtime_cause || null : null,
        is_billable_to_client: overtimeHours > 0 ? logForm.is_billable_to_client : false,
        overtime_rate_multiplier: overtimeHours > 0 && logForm.overtime_rate_type === 'multiplier'
          ? parseFloat(logForm.overtime_rate_multiplier) || 1.5
          : null,
        include_in_final_balance: overtimeHours > 0 ? logForm.include_in_final_balance : true,
        break_minutes: logForm.break_minutes,
        overtime_rate_type: overtimeHours > 0 ? logForm.overtime_rate_type : null,
        overtime_direct_rate: overtimeHours > 0 && logForm.overtime_rate_type === 'direct_rate'
          ? logForm.overtime_direct_rate
          : null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-labor-logs', projectId] });
      setShowSubmitDialog(false);
      setLogForm(EMPTY_LOG_FORM);
      toast.success('Ore inviate per approvazione');
    },
    onError: (error) => handleMutationError(error, "Errore durante l'invio"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => projectLaborLogsApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-labor-logs', projectId] });
      toast.success('Registrazione eliminata');
    },
    onError: (error) => handleMutationError(error, "Errore durante l'eliminazione"),
  });

  const changeStatusMutation = useMutation({
    mutationFn: ({ id, status, reason }: { id: number; status: string; reason?: string }) =>
      projectLaborLogsApi.changeStatus(id, status, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-labor-logs', projectId] });
      setShowSubmitDialog(false);
      setEditingLog(null);
      setLogForm(EMPTY_LOG_FORM);
      toast.success('Ore aggiornate');
    },
    onError: (error) => handleMutationError(error, 'Errore durante il cambio stato'),
  });

  const updateMutation = useMutation({
    mutationFn: () => {
      if (!editingLog) throw new Error('Nessun log selezionato');
      return projectLaborLogsApi.update(editingLog.id, {
        log_date: logForm.log_date,
        clock_in: logForm.clock_in || undefined,
        clock_out: logForm.clock_out || undefined,
        description: logForm.description || null,
        overtime_cause: overtimeHours > 0 ? logForm.overtime_cause || null : null,
        is_billable_to_client: overtimeHours > 0 ? logForm.is_billable_to_client : false,
        overtime_rate_multiplier: overtimeHours > 0 && logForm.overtime_rate_type === 'multiplier'
          ? parseFloat(logForm.overtime_rate_multiplier) || 1.5
          : null,
        include_in_final_balance: overtimeHours > 0 ? logForm.include_in_final_balance : true,
        break_minutes: logForm.break_minutes,
        overtime_rate_type: overtimeHours > 0 ? logForm.overtime_rate_type : null,
        overtime_direct_rate: overtimeHours > 0 && logForm.overtime_rate_type === 'direct_rate'
          ? logForm.overtime_direct_rate
          : null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-labor-logs', projectId] });
      if (pendingStatusChange.current && editingLog) {
        changeStatusMutation.mutate({ id: editingLog.id, status: pendingStatusChange.current });
        pendingStatusChange.current = null;
      } else {
        setShowSubmitDialog(false);
        setEditingLog(null);
        setLogForm(EMPTY_LOG_FORM);
        toast.success('Ore aggiornate');
      }
    },
    onError: (error) => {
      pendingStatusChange.current = null;
      handleMutationError(error, 'Errore durante la modifica');
    },
  });

  const handleDeleteLog = (log: ProjectLaborLog) => {
    if (!window.confirm('Sei sicuro di voler eliminare questa registrazione?')) return;
    deleteMutation.mutate(log.id);
  };

  const handleEditLog = (log: ProjectLaborLog) => {
    setEditingLog(log);
    setLogForm({
      project_worker_id: String(log.project_worker_id),
      log_date: log.log_date,
      clock_in: log.clock_in ? log.clock_in.slice(0, 5) : '',
      clock_out: log.clock_out ? log.clock_out.slice(0, 5) : '',
      description: log.description ?? '',
      overtime_cause: log.overtime_cause ?? '',
      is_billable_to_client: log.is_billable_to_client ?? false,
      overtime_rate_multiplier: String(log.overtime_rate_multiplier ?? 1.5),
      include_in_final_balance: log.include_in_final_balance ?? true,
      break_minutes: log.break_minutes ?? 0,
      overtime_rate_type: (log.overtime_rate_type as 'multiplier' | 'direct_rate') ?? 'multiplier',
      overtime_direct_rate: log.overtime_direct_rate ?? null,
      status: log.status ?? 'submitted',
    });
    setShowSubmitDialog(true);
  };

  const isLogFormValid =
    logForm.project_worker_id &&
    logForm.log_date &&
    logForm.clock_in &&
    logForm.clock_out;

  // Summary aggregations over approved logs
  const approvedLogs = useMemo(() => logs.filter((l) => l.status === 'approved'), [logs]);

  const byWorker = useMemo(() => {
    const map = new Map<string, { name: string; regularHours: number; overtimeHours: number; totalHours: number }>();
    for (const log of approvedLogs) {
      const key = String(log.project_worker_id);
      const name = log.worker_name ?? log.submitted_by_name ?? `Worker #${log.project_worker_id}`;
      const existing = map.get(key) ?? { name, regularHours: 0, overtimeHours: 0, totalHours: 0 };
      map.set(key, {
        name,
        regularHours: existing.regularHours + log.regular_hours,
        overtimeHours: existing.overtimeHours + log.overtime_hours,
        totalHours: existing.totalHours + log.total_hours,
      });
    }
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [approvedLogs]);

  const byDate = useMemo(() => {
    const map = new Map<string, { date: string; workerCount: number; workerIds: Set<number>; totalHours: number }>();
    for (const log of approvedLogs) {
      const existing = map.get(log.log_date);
      if (existing) {
        existing.workerIds.add(log.project_worker_id);
        existing.workerCount = existing.workerIds.size;
        existing.totalHours += log.total_hours;
      } else {
        map.set(log.log_date, {
          date: log.log_date,
          workerCount: 1,
          workerIds: new Set([log.project_worker_id]),
          totalHours: log.total_hours,
        });
      }
    }
    return Array.from(map.values()).sort((a, b) => a.date.localeCompare(b.date));
  }, [approvedLogs]);

  const effectiveHours = useMemo(
    () => approvedLogs.reduce((sum, l) => sum + l.total_hours, 0),
    [approvedLogs],
  );

  const delta = plannedHours != null ? effectiveHours - plannedHours : null;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8 text-slate-500 dark:text-slate-400">
        Caricamento ore lavorate...
      </div>
    );
  }

  const pending = logs.filter((l) => l.status === 'submitted');
  const rest = logs.filter((l) => l.status !== 'submitted');

  return (
    <div className="space-y-4">
      {/* Header with submit button */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
          Ore lavorate
        </h3>
        <Button
          size="sm"
          onClick={() => {
            setLogForm(EMPTY_LOG_FORM);
            setShowSubmitDialog(true);
          }}
          className="gap-1"
        >
          <Plus className="h-4 w-4" />
          Invia Ore
        </Button>
      </div>

      {/* Summary cards */}
      {logs.length > 0 && (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          {/* Card 1 — Per Lavoratore */}
          <CollapsibleCard title={`Per lavoratore (${byWorker.length})`}>
            {byWorker.length === 0 ? (
              <p className="text-xs text-slate-500 dark:text-slate-400">Nessun log approvato.</p>
            ) : (
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-slate-500 dark:text-slate-400">
                    <th className="pb-1 text-left font-medium">Lavoratore</th>
                    <th className="pb-1 text-right font-medium">Reg.</th>
                    <th className="pb-1 text-right font-medium">Str.</th>
                    <th className="pb-1 text-right font-medium">Tot.</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {byWorker.map((row) => (
                    <tr key={row.name} className="text-slate-700 dark:text-slate-300">
                      <td className="py-1 pr-2 truncate max-w-[100px]">{row.name}</td>
                      <td className="py-1 text-right">{row.regularHours.toFixed(1)}h</td>
                      <td className="py-1 text-right">{row.overtimeHours.toFixed(1)}h</td>
                      <td className="py-1 text-right font-medium">{row.totalHours.toFixed(1)}h</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CollapsibleCard>

          {/* Card 2 — Per Data */}
          <CollapsibleCard title={`Per data (${byDate.length} giorni)`}>
            {byDate.length === 0 ? (
              <p className="text-xs text-slate-500 dark:text-slate-400">Nessun log approvato.</p>
            ) : (
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-slate-500 dark:text-slate-400">
                    <th className="pb-1 text-left font-medium">Data</th>
                    <th className="pb-1 text-right font-medium">Lav.</th>
                    <th className="pb-1 text-right font-medium">Ore</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {byDate.map((row) => (
                    <tr key={row.date} className="text-slate-700 dark:text-slate-300">
                      <td className="py-1 pr-2">
                        {new Date(row.date).toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit' })}
                      </td>
                      <td className="py-1 text-right">{row.workerCount}</td>
                      <td className="py-1 text-right font-medium">{row.totalHours.toFixed(1)}h</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CollapsibleCard>

          {/* Card 3 — Pianificato vs Effettivo */}
          <CollapsibleCard title="Pianificato vs Effettivo">
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400">Pianificate</span>
                <span className="font-medium text-slate-700 dark:text-slate-300">
                  {plannedHours != null ? `${plannedHours.toFixed(1)}h` : '—'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400">Effettive</span>
                <span className="font-medium text-slate-700 dark:text-slate-300">
                  {effectiveHours.toFixed(1)}h
                </span>
              </div>
              {delta != null && (
                <div className="flex items-center justify-between border-t border-slate-100 pt-1 dark:border-slate-800">
                  <span className="text-slate-500 dark:text-slate-400">Delta</span>
                  <span
                    className={cn(
                      'font-semibold',
                      delta > 0
                        ? 'text-red-600 dark:text-red-400'
                        : 'text-green-600 dark:text-green-400',
                    )}
                  >
                    {delta > 0 ? '+' : ''}{delta.toFixed(1)}h
                  </span>
                </div>
              )}
            </div>
          </CollapsibleCard>
        </div>
      )}

      {pending.length > 0 && (
        <div>
          <h4 className="mb-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
            In attesa di approvazione ({pending.length})
          </h4>
          <div className="divide-y divide-slate-100 rounded-lg border border-yellow-200 dark:divide-slate-800 dark:border-yellow-800/50">
            {pending.map((log) => (
              <div key={log.id} className="flex items-center justify-between p-3">
                <div className="space-y-0.5">
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                    {log.worker_name ?? log.submitted_by_name ?? '—'}{' '}
                    · {new Date(log.log_date).toLocaleDateString('it-IT')}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {log.clock_in && log.clock_out
                      ? `${formatTime(log.clock_in)} → ${formatTime(log.clock_out)} · `
                      : ''}
                    {log.total_hours.toFixed(1)}h
                    {log.overtime_hours > 0 && ` (${log.overtime_hours.toFixed(1)}h str.)`}
                    {log.description && ` · ${log.description}`}
                  </p>
                  {log.is_auto_approved && (
                    <span className="text-xs text-muted-foreground italic">Auto-approvato</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleEditLog(log)}
                    className="h-8 w-8 p-0 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
                    title="Modifica"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDeleteLog(log)}
                    disabled={deleteMutation.isPending}
                    className="h-8 w-8 p-0 text-slate-500 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400"
                    title="Elimina"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setRejectingLog(log);
                      setRejectionReason('');
                    }}
                    className="text-destructive border-destructive/30 hover:bg-destructive/10"
                  >
                    Rifiuta
                  </Button>
                  {log.overtime_hours > 0 ? (
                    <Button
                      size="sm"
                      onClick={() => approveMutation.mutate(log.id)}
                      disabled={approveMutation.isPending}
                    >
                      Approva
                    </Button>
                  ) : (
                    <div className="flex flex-col items-end gap-0.5">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => approveMutation.mutate(log.id)}
                        disabled={approveMutation.isPending}
                      >
                        Approva
                      </Button>
                      <span className="text-xs text-muted-foreground">ore ordinarie non convocate</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {rest.length > 0 && (
        <div>
          <h4 className="mb-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
            Storico
          </h4>
          <div className="divide-y divide-slate-100 rounded-lg border border-slate-200 dark:divide-slate-800 dark:border-slate-700">
            {rest.map((log) => (
              <div key={log.id} className="flex items-center justify-between p-3">
                <div className="space-y-0.5">
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                    {log.worker_name ?? log.submitted_by_name ?? '—'}{' '}
                    · {new Date(log.log_date).toLocaleDateString('it-IT')}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {log.clock_in && log.clock_out
                      ? `${formatTime(log.clock_in)} → ${formatTime(log.clock_out)} · `
                      : ''}
                    {log.total_hours.toFixed(1)}h
                    {log.overtime_hours > 0 && ` (${log.overtime_hours.toFixed(1)}h str.)`}
                  </p>
                  {log.is_auto_approved && (
                    <span className="text-xs text-muted-foreground italic">Auto-approvato</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {log.status !== 'approved' && (
                    <>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleEditLog(log)}
                        className="h-8 w-8 p-0 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
                        title="Modifica"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeleteLog(log)}
                        disabled={deleteMutation.isPending}
                        className="h-8 w-8 p-0 text-slate-500 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400"
                        title="Elimina"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </>
                  )}
                  <Badge className={statusColors[log.status ?? 'draft']}>
                    {statusLabels[log.status ?? 'draft']}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {logs.length === 0 && (
        <div className="py-8 text-center text-sm text-slate-500 dark:text-slate-400">
          Nessuna registrazione ore per questo progetto.
        </div>
      )}

      {/* Submit / Edit Hours Dialog */}
      <Dialog open={showSubmitDialog} onOpenChange={(open) => { if (!open) { setShowSubmitDialog(false); setEditingLog(null); } }}>
        <DialogContent className="border-slate-200 bg-white sm:max-w-md dark:border-slate-700 dark:bg-slate-900">
          <DialogHeader>
            <DialogTitle className="text-slate-900 dark:text-slate-100">
              {editingLog ? 'Modifica Ore' : 'Invia Ore Lavorate'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-slate-900 dark:text-slate-100">
                Lavoratore / Slot <span className="text-red-500">*</span>
              </Label>
              <Select
                value={logForm.project_worker_id}
                onValueChange={(v) => setLogForm({ ...logForm, project_worker_id: v })}
                disabled={!!editingLog}
              >
                <SelectTrigger className="border-slate-200 bg-white text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100">
                  <SelectValue placeholder="Seleziona lavoratore..." />
                </SelectTrigger>
                <SelectContent className="dark:bg-slate-900">
                  {uniqueWorkers.map((w) => (
                    <SelectItem key={w.id} value={String(w.id)} className="dark:text-slate-100">
                      {w.worker?.full_name ?? w.worker_name ?? `Slot #${w.slot_index ?? w.id}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {uniqueWorkers.length === 0 && (
                <p className="text-xs text-amber-600 dark:text-amber-400">
                  Nessun lavoratore assegnato al progetto.
                </p>
              )}
            </div>

            {editingLog && (
              <div className="space-y-2">
                <Label className="text-slate-900 dark:text-slate-100">Stato</Label>
                <Select
                  value={logForm.status}
                  onValueChange={(v) => setLogForm({ ...logForm, status: v })}
                >
                  <SelectTrigger className="border-slate-200 bg-white text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="dark:bg-slate-900">
                    <SelectItem value="draft" className="dark:text-slate-100">Bozza</SelectItem>
                    <SelectItem value="submitted" className="dark:text-slate-100">Inviato</SelectItem>
                    <SelectItem value="approved" className="dark:text-slate-100">Approvato</SelectItem>
                    <SelectItem value="rejected" className="dark:text-slate-100">Rifiutato</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label className="text-slate-900 dark:text-slate-100">
                Data <span className="text-red-500">*</span>
              </Label>
              <Input
                type="date"
                value={logForm.log_date}
                onChange={(e) => setLogForm({ ...logForm, log_date: e.target.value })}
                className="border-slate-200 bg-white text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-slate-900 dark:text-slate-100">
                  Orario ingresso <span className="text-red-500">*</span>
                </Label>
                <Input
                  type="time"
                  value={logForm.clock_in}
                  onChange={(e) => setLogForm({ ...logForm, clock_in: e.target.value })}
                  className="border-slate-200 bg-white text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-900 dark:text-slate-100">
                  Orario uscita <span className="text-red-500">*</span>
                </Label>
                <Input
                  type="time"
                  value={logForm.clock_out}
                  onChange={(e) => setLogForm({ ...logForm, clock_out: e.target.value })}
                  className="border-slate-200 bg-white text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                />
              </div>
            </div>

            {/* Break selector */}
            <div className="flex items-center gap-3">
              <label className="text-sm font-medium min-w-fit text-slate-900 dark:text-slate-100">Pausa</label>
              <div className="flex items-center gap-2">
                {([0, 30, 60, 90] as const).map((mins) => (
                  <button
                    key={mins}
                    type="button"
                    onClick={() => setLogForm((prev) => ({ ...prev, break_minutes: mins }))}
                    className={cn(
                      'px-2.5 py-1 rounded text-xs border transition-all',
                      logForm.break_minutes === mins
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'border-border hover:bg-muted text-slate-700 dark:text-slate-300',
                    )}
                  >
                    {mins === 0 ? 'Nessuna' : `${mins}min`}
                  </button>
                ))}
              </div>
            </div>

            {/* Computed hours preview */}
            {computedHours && (
              <div className="rounded-md bg-muted px-3 py-2 text-sm dark:bg-slate-800">
                <span className="font-medium text-slate-900 dark:text-slate-100">
                  {computedHours.totalHours.toFixed(1)}h totali
                </span>
                <span className="ml-2 text-muted-foreground dark:text-slate-400">
                  ({computedHours.regularHours.toFixed(1)}h regolari
                  {computedHours.overtimeHours > 0 && ` + ${computedHours.overtimeHours.toFixed(1)}h straordinari`})
                </span>
                {logForm.break_minutes > 0 && (
                  <span className="ml-2 text-muted-foreground dark:text-slate-400">
                    · pausa {logForm.break_minutes}min
                  </span>
                )}
              </div>
            )}

            {/* Overtime fields — only when computed overtime > 0 */}
            {overtimeHours > 0 && (
              <>
                <div className="space-y-2">
                  <Label className="text-slate-900 dark:text-slate-100">Causa straordinario</Label>
                  <Select
                    value={logForm.overtime_cause}
                    onValueChange={(v) => {
                      const autoBillable = v === 'client_request' || v === 'project_delay_client_fault';
                      setLogForm({ ...logForm, overtime_cause: v, is_billable_to_client: autoBillable });
                    }}
                  >
                    <SelectTrigger className="border-slate-200 bg-white text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100">
                      <SelectValue placeholder="Causa straordinario" />
                    </SelectTrigger>
                    <SelectContent className="dark:bg-slate-900">
                      <SelectItem value="client_request" className="dark:text-slate-100">Richiesta cliente</SelectItem>
                      <SelectItem value="project_delay_our_fault" className="dark:text-slate-100">Nostro ritardo</SelectItem>
                      <SelectItem value="project_delay_client_fault" className="dark:text-slate-100">Ritardo cliente</SelectItem>
                      <SelectItem value="weather" className="dark:text-slate-100">Meteo</SelectItem>
                      <SelectItem value="unforeseen" className="dark:text-slate-100">Imprevisto</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="is_billable"
                    checked={logForm.is_billable_to_client}
                    onChange={(e) => setLogForm({ ...logForm, is_billable_to_client: e.target.checked })}
                    className="h-4 w-4 rounded border-slate-300 text-blue-600"
                  />
                  <Label htmlFor="is_billable" className="cursor-pointer text-sm text-slate-700 dark:text-slate-300">
                    Addebitabile al cliente
                  </Label>
                </div>

                {/* Overtime rate type selector */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-900 dark:text-slate-100">Tariffa straordinario</label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setLogForm((prev) => ({ ...prev, overtime_rate_type: 'multiplier' }))}
                      className={cn(
                        'px-3 py-1.5 rounded text-sm border transition-all',
                        logForm.overtime_rate_type === 'multiplier'
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'border-border hover:bg-muted text-slate-700 dark:text-slate-300',
                      )}
                    >
                      Moltiplicatore
                    </button>
                    <button
                      type="button"
                      onClick={() => setLogForm((prev) => ({ ...prev, overtime_rate_type: 'direct_rate' }))}
                      className={cn(
                        'px-3 py-1.5 rounded text-sm border transition-all',
                        logForm.overtime_rate_type === 'direct_rate'
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'border-border hover:bg-muted text-slate-700 dark:text-slate-300',
                      )}
                    >
                      Tariffa diretta
                    </button>
                  </div>
                  {logForm.overtime_rate_type === 'multiplier' && (
                    <div className="flex items-center gap-2">
                      <label className="text-sm text-muted-foreground">Moltiplicatore</label>
                      <input
                        type="number"
                        step="0.05"
                        min="1"
                        max="3"
                        value={logForm.overtime_rate_multiplier}
                        onChange={(e) => setLogForm((prev) => ({ ...prev, overtime_rate_multiplier: e.target.value }))}
                        className="w-20 rounded border border-border px-2 py-1 text-sm bg-background text-slate-900 dark:text-slate-100"
                      />
                      <span className="text-sm text-muted-foreground">x tariffa base</span>
                    </div>
                  )}
                  {logForm.overtime_rate_type === 'direct_rate' && (
                    <div className="flex items-center gap-2">
                      <label className="text-sm text-muted-foreground">€/ora straordinario</label>
                      <input
                        type="number"
                        step="0.5"
                        min="0"
                        value={logForm.overtime_direct_rate ?? ''}
                        onChange={(e) => setLogForm((prev) => ({
                          ...prev,
                          overtime_direct_rate: parseFloat(e.target.value) || null,
                        }))}
                        className="w-24 rounded border border-border px-2 py-1 text-sm bg-background text-slate-900 dark:text-slate-100"
                        placeholder="es. 35.00"
                      />
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="include_in_final_balance"
                    checked={logForm.include_in_final_balance}
                    onChange={(e) => setLogForm({ ...logForm, include_in_final_balance: e.target.checked })}
                    className="h-4 w-4 rounded border-slate-300 text-blue-600"
                  />
                  <Label htmlFor="include_in_final_balance" className="cursor-pointer text-sm text-slate-700 dark:text-slate-300">
                    Includi in Final Balance
                  </Label>
                </div>
              </>
            )}

            <div className="space-y-2">
              <Label className="text-slate-900 dark:text-slate-100">Descrizione (opzionale)</Label>
              <Textarea
                value={logForm.description}
                onChange={(e) => setLogForm({ ...logForm, description: e.target.value })}
                placeholder="Attività svolte..."
                rows={2}
                className="border-slate-200 bg-white text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => { setShowSubmitDialog(false); setEditingLog(null); }}
              className="border-slate-200 dark:border-slate-700 dark:text-slate-100"
            >
              Annulla
            </Button>
            {editingLog ? (
              <Button
                onClick={() => {
                  pendingStatusChange.current = logForm.status !== editingLog.status ? logForm.status : null;
                  updateMutation.mutate();
                }}
                disabled={!isLogFormValid || updateMutation.isPending || changeStatusMutation.isPending}
              >
                {updateMutation.isPending || changeStatusMutation.isPending ? 'Salvando...' : 'Salva Modifiche'}
              </Button>
            ) : (
              <Button
                onClick={() => submitMutation.mutate()}
                disabled={!isLogFormValid || submitMutation.isPending}
              >
                {submitMutation.isPending ? 'Inviando...' : 'Invia Ore'}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog
        open={!!rejectingLog}
        onOpenChange={(open) => {
          if (!open) {
            setRejectingLog(null);
          }
        }}
      >
        <DialogContent className="border-slate-200 bg-white sm:max-w-md dark:border-slate-700 dark:bg-slate-900">
          <DialogHeader>
            <DialogTitle className="text-slate-900 dark:text-slate-100">Rifiuta ore</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Indica il motivo del rifiuto (obbligatorio).
            </p>
            <Textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Es. Le ore indicate non corrispondono al lavoro effettuato..."
              className="border-slate-200 bg-white text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRejectingLog(null)}
              className="border-slate-200 dark:border-slate-700 dark:text-slate-100"
            >
              Annulla
            </Button>
            <Button
              variant="destructive"
              disabled={!rejectionReason.trim() || rejectMutation.isPending}
              onClick={() => {
                if (rejectingLog) {
                  rejectMutation.mutate({ id: rejectingLog.id, reason: rejectionReason });
                }
              }}
            >
              {rejectMutation.isPending ? 'Rifiutando...' : 'Rifiuta'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
