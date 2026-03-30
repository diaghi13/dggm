'use client';

import { useState } from 'react';
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
import { Plus } from 'lucide-react';
import { toast } from 'sonner';
import type { ProjectLaborLog } from '@/lib/types';

interface Props {
  projectId: number;
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
  regular_hours: string;
  overtime_hours: string;
  description: string;
}

const EMPTY_LOG_FORM: SubmitLogForm = {
  project_worker_id: '',
  log_date: new Date().toISOString().slice(0, 10),
  regular_hours: '8',
  overtime_hours: '0',
  description: '',
};

export function ProjectLaborLogsSection({ projectId }: Props) {
  const queryClient = useQueryClient();
  const [rejectingLog, setRejectingLog] = useState<ProjectLaborLog | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const [logForm, setLogForm] = useState<SubmitLogForm>(EMPTY_LOG_FORM);

  const { data: logsData, isLoading } = useQuery({
    queryKey: ['project-labor-logs', projectId],
    queryFn: () => projectLaborLogsApi.getByProject(projectId, { per_page: 50 }),
  });

  const { data: assignedWorkers = [] } = useQuery({
    queryKey: ['project-workers', projectId],
    queryFn: () => projectWorkersApi.getWorkersByProject(projectId),
    select: (data) => data.filter((w) => w.status !== 'slot'),
  });

  const logs = logsData?.data ?? [];

  const approveMutation = useMutation({
    mutationFn: (id: number) => projectLaborLogsApi.approve(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-labor-logs', projectId] });
      toast.success('Ore approvate');
    },
    onError: () => toast.error("Errore durante l'approvazione"),
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
    onError: () => toast.error('Errore durante il rifiuto'),
  });

  const submitMutation = useMutation({
    mutationFn: () =>
      projectLaborLogsApi.submit(parseInt(logForm.project_worker_id), {
        log_date: logForm.log_date,
        regular_hours: parseFloat(logForm.regular_hours) || 0,
        overtime_hours: parseFloat(logForm.overtime_hours) || 0,
        description: logForm.description || null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-labor-logs', projectId] });
      setShowSubmitDialog(false);
      setLogForm(EMPTY_LOG_FORM);
      toast.success('Ore inviate per approvazione');
    },
    onError: () => toast.error("Errore durante l'invio"),
  });

  const isLogFormValid =
    logForm.project_worker_id &&
    logForm.log_date &&
    logForm.regular_hours &&
    parseFloat(logForm.regular_hours) >= 0;

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
          className="gap-1 bg-blue-600 text-white hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          Invia Ore
        </Button>
      </div>

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
                    {log.submitted_by_name ?? '—'}{' '}
                    · {new Date(log.log_date).toLocaleDateString('it-IT')}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {log.regular_hours}h ordinarie
                    {log.overtime_hours > 0 && ` + ${log.overtime_hours}h straordinarie`}
                    {log.description && ` · ${log.description}`}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setRejectingLog(log);
                      setRejectionReason('');
                    }}
                    className="border-red-200 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400"
                  >
                    Rifiuta
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => approveMutation.mutate(log.id)}
                    disabled={approveMutation.isPending}
                    className="bg-green-600 text-white hover:bg-green-700"
                  >
                    Approva
                  </Button>
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
                    {log.submitted_by_name ?? '—'}{' '}
                    · {new Date(log.log_date).toLocaleDateString('it-IT')}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {log.regular_hours}h ordinarie
                    {log.overtime_hours > 0 && ` + ${log.overtime_hours}h straordinarie`}
                  </p>
                </div>
                <Badge className={statusColors[log.status ?? 'draft']}>
                  {statusLabels[log.status ?? 'draft']}
                </Badge>
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

      {/* Submit Hours Dialog */}
      <Dialog open={showSubmitDialog} onOpenChange={(open) => { if (!open) setShowSubmitDialog(false); }}>
        <DialogContent className="border-slate-200 bg-white sm:max-w-md dark:border-slate-700 dark:bg-slate-900">
          <DialogHeader>
            <DialogTitle className="text-slate-900 dark:text-slate-100">Invia Ore Lavorate</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-slate-900 dark:text-slate-100">
                Lavoratore / Slot <span className="text-red-500">*</span>
              </Label>
              <Select
                value={logForm.project_worker_id}
                onValueChange={(v) => setLogForm({ ...logForm, project_worker_id: v })}
              >
                <SelectTrigger className="border-slate-200 bg-white text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100">
                  <SelectValue placeholder="Seleziona lavoratore..." />
                </SelectTrigger>
                <SelectContent className="dark:bg-slate-900">
                  {assignedWorkers.map((w) => (
                    <SelectItem key={w.id} value={String(w.id)} className="dark:text-slate-100">
                      {w.worker?.full_name ?? w.worker_name ?? `Slot #${w.slot_index ?? w.id}`}
                      {w.role_name && ` — ${w.role_name}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {assignedWorkers.length === 0 && (
                <p className="text-xs text-amber-600 dark:text-amber-400">
                  Nessun lavoratore assegnato al progetto.
                </p>
              )}
            </div>

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
                  Ore ordinarie <span className="text-red-500">*</span>
                </Label>
                <Input
                  type="number"
                  step="0.5"
                  min="0"
                  value={logForm.regular_hours}
                  onChange={(e) => setLogForm({ ...logForm, regular_hours: e.target.value })}
                  placeholder="8"
                  className="border-slate-200 bg-white text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-900 dark:text-slate-100">
                  Ore straordinarie
                </Label>
                <Input
                  type="number"
                  step="0.5"
                  min="0"
                  value={logForm.overtime_hours}
                  onChange={(e) => setLogForm({ ...logForm, overtime_hours: e.target.value })}
                  placeholder="0"
                  className="border-slate-200 bg-white text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                />
              </div>
            </div>

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
              onClick={() => setShowSubmitDialog(false)}
              className="border-slate-200 dark:border-slate-700 dark:text-slate-100"
            >
              Annulla
            </Button>
            <Button
              onClick={() => submitMutation.mutate()}
              disabled={!isLogFormValid || submitMutation.isPending}
              className="bg-blue-600 text-white hover:bg-blue-700"
            >
              {submitMutation.isPending ? 'Inviando...' : 'Invia Ore'}
            </Button>
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
