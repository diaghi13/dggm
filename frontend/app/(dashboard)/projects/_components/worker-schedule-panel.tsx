'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { projectWorkersApi } from '@/lib/api/project-workers';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { handleMutationError } from '@/lib/utils/handle-mutation-error';
import { format, parseISO } from 'date-fns';
import { it } from 'date-fns/locale';
import { Calendar, Plus, Trash2, RefreshCw, Loader2, Pencil, X as XIcon, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ProjectWorker, Project, ProjectScheduleDayStatus, ProjectWorkerSchedule } from '@/lib/types';

interface Props {
  projectWorker: ProjectWorker;
  project: Project | null;
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

interface EditState {
  planned_start_time: string;
  planned_end_time: string;
  cost_rate: string;
  customer_rate: string;
  notes: string;
}

function scheduleToEditState(s: ProjectWorkerSchedule): EditState {
  return {
    planned_start_time: s.planned_start_time?.slice(0, 5) ?? '',
    planned_end_time: s.planned_end_time?.slice(0, 5) ?? '',
    cost_rate: s.cost_rate != null ? String(s.cost_rate) : '',
    customer_rate: s.customer_rate != null ? String(s.customer_rate) : '',
    notes: s.notes ?? '',
  };
}

export function WorkerSchedulePanel({ projectWorker, project }: Props) {
  const queryClient = useQueryClient();

  // ── Inline editing ──────────────────────────────────────────────────────────
  const [editingScheduleId, setEditingScheduleId] = useState<number | null>(null);
  const [editState, setEditState] = useState<EditState>({
    planned_start_time: '',
    planned_end_time: '',
    cost_rate: '',
    customer_rate: '',
    notes: '',
  });

  // ── Generate dialog ─────────────────────────────────────────────────────────
  const [generateOpen, setGenerateOpen] = useState(false);
  const [genStartDate, setGenStartDate] = useState(project?.start_date ?? '');
  const [genEndDate, setGenEndDate] = useState(project?.estimated_end_date ?? '');
  const [genStartTime, setGenStartTime] = useState('09:00');
  const [genEndTime, setGenEndTime] = useState('18:00');
  const [genSkipWeekends, setGenSkipWeekends] = useState(false);
  const [genReplace, setGenReplace] = useState(false);

  // ── Add day dialog ──────────────────────────────────────────────────────────
  const [addDayOpen, setAddDayOpen] = useState(false);
  const [newDate, setNewDate] = useState('');
  const [newStartTime, setNewStartTime] = useState('09:00');
  const [newEndTime, setNewEndTime] = useState('18:00');
  const [newNotes, setNewNotes] = useState('');

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ['worker-schedules', projectWorker.id] });

  // Fetch schedules (lazy: only when panel is rendered)
  const { data: schedules = [], isLoading } = useQuery({
    queryKey: ['worker-schedules', projectWorker.id],
    queryFn: () => projectWorkersApi.getSchedules(projectWorker.id),
  });

  const generateMutation = useMutation({
    mutationFn: () =>
      projectWorkersApi.generateSchedule(projectWorker.id, {
        start_date: genStartDate,
        end_date: genEndDate,
        start_time: genStartTime || undefined,
        end_time: genEndTime || undefined,
        skip_weekends: genSkipWeekends,
        replace: genReplace,
      }),
    onSuccess: (result) => {
      invalidate();
      queryClient.invalidateQueries({ queryKey: ['project-schedules', projectWorker.project_id] });
      setGenerateOpen(false);
      toast.success(`${result.meta.generated_count} convocazioni generate`);
    },
    onError: (error) => handleMutationError(error, 'Errore nella generazione delle convocazioni'),
  });

  const addDayMutation = useMutation({
    mutationFn: () =>
      projectWorkersApi.createSchedule(projectWorker.id, {
        scheduled_date: newDate,
        planned_start_time: newStartTime || null,
        planned_end_time: newEndTime || null,
        notes: newNotes.trim() || null,
      }),
    onSuccess: () => {
      invalidate();
      queryClient.invalidateQueries({ queryKey: ['project-schedules', projectWorker.project_id] });
      setAddDayOpen(false);
      setNewDate('');
      setNewStartTime('09:00');
      setNewEndTime('18:00');
      setNewNotes('');
      toast.success('Giorno aggiunto');
    },
    onError: (error) => handleMutationError(error, 'Errore durante il salvataggio'),
  });

  const deleteDayMutation = useMutation({
    mutationFn: (scheduleId: number) => projectWorkersApi.deleteSchedule(scheduleId),
    onSuccess: () => {
      invalidate();
      queryClient.invalidateQueries({ queryKey: ['project-schedules', projectWorker.project_id] });
      toast.success('Convocazione rimossa');
    },
    onError: (error) => handleMutationError(error, 'Errore durante la rimozione'),
  });

  const updateDayMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: { planned_start_time?: string | null; planned_end_time?: string | null; cost_rate?: number | null; customer_rate?: number | null; notes?: string | null } }) =>
      projectWorkersApi.updateSchedule(id, data),
    onSuccess: () => {
      invalidate();
      queryClient.invalidateQueries({ queryKey: ['project-schedules', projectWorker.project_id] });
      setEditingScheduleId(null);
      toast.success('Convocazione aggiornata');
    },
    onError: (error) => handleMutationError(error, "Errore durante l'aggiornamento"),
  });

  const hasProjectDates = !!(project?.start_date && project?.estimated_end_date);

  return (
    <div className="mt-2 border-t border-slate-100 pt-3 dark:border-slate-800">
      {/* Panel header */}
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400">
          <Calendar className="h-3.5 w-3.5" />
          Convocazioni
          {schedules.length > 0 && (
            <span className="ml-0.5 rounded-full bg-slate-100 px-1.5 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
              {schedules.length}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {hasProjectDates && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setGenStartDate(project?.start_date ?? '');
                setGenEndDate(project?.estimated_end_date ?? '');
                setGenerateOpen(true);
              }}
              className="h-6 gap-1 px-2 text-xs text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100"
            >
              <RefreshCw className="h-3 w-3" />
              Genera
            </Button>
          )}
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setAddDayOpen(true)}
            className="h-6 gap-1 px-2 text-xs text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100"
          >
            <Plus className="h-3 w-3" />
            Aggiungi
          </Button>
        </div>
      </div>

      {/* Schedule days list */}
      {isLoading ? (
        <div className="flex items-center gap-1.5 py-2 text-xs text-slate-400">
          <Loader2 className="h-3 w-3 animate-spin" />
          Caricamento...
        </div>
      ) : schedules.length === 0 ? (
        <p className="py-2 text-xs italic text-slate-400 dark:text-slate-500">
          {hasProjectDates
            ? 'Genera convocazioni automaticamente o aggiungile manualmente.'
            : 'Aggiungi le date di convocazione manualmente.'}
        </p>
      ) : (
        <div className="space-y-0.5">
          {schedules.map((s) => {
            const isEditing = editingScheduleId === s.id;
            if (isEditing) {
              return (
                <div
                  key={s.id}
                  className="rounded border border-blue-200 bg-blue-50/50 px-2 py-2 dark:border-blue-800/50 dark:bg-blue-950/20"
                >
                  <div className="mb-2 text-xs font-medium text-slate-700 dark:text-slate-300">
                    {format(parseISO(s.scheduled_date), 'EEE dd MMM', { locale: it })}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-[10px] font-medium text-slate-500 dark:text-slate-400">
                        Inizio
                      </label>
                      <Input
                        type="time"
                        value={editState.planned_start_time}
                        onChange={(e) => setEditState((p) => ({ ...p, planned_start_time: e.target.value }))}
                        className="h-7 border-slate-200 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-medium text-slate-500 dark:text-slate-400">
                        Fine
                      </label>
                      <Input
                        type="time"
                        value={editState.planned_end_time}
                        onChange={(e) => setEditState((p) => ({ ...p, planned_end_time: e.target.value }))}
                        className="h-7 border-slate-200 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-medium text-slate-500 dark:text-slate-400">
                        Tariffa costo €/gg
                      </label>
                      <Input
                        type="text"
                        inputMode="numeric"
                        value={editState.cost_rate}
                        onChange={(e) => setEditState((p) => ({ ...p, cost_rate: e.target.value }))}
                        placeholder="es. 250"
                        className="h-7 border-slate-200 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-medium text-slate-500 dark:text-slate-400">
                        Tariffa vendita €/gg
                      </label>
                      <Input
                        type="text"
                        inputMode="numeric"
                        value={editState.customer_rate}
                        onChange={(e) => setEditState((p) => ({ ...p, customer_rate: e.target.value }))}
                        placeholder="es. 350"
                        className="h-7 border-slate-200 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                      />
                    </div>
                  </div>
                  <div className="mt-2 space-y-1">
                    <label className="text-[10px] font-medium text-slate-500 dark:text-slate-400">
                      Note
                    </label>
                    <Input
                      value={editState.notes}
                      onChange={(e) => setEditState((p) => ({ ...p, notes: e.target.value }))}
                      placeholder="Note opzionali…"
                      className="h-7 border-slate-200 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                    />
                  </div>
                  <div className="mt-2 flex items-center justify-end gap-1.5">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setEditingScheduleId(null)}
                      className="h-6 px-2 text-xs text-slate-500 dark:text-slate-400"
                    >
                      <XIcon className="mr-1 h-3 w-3" />
                      Annulla
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => {
                        const parseRate = (val: string) => {
                          const n = parseFloat(val);
                          return isNaN(n) ? null : n;
                        };
                        updateDayMutation.mutate({
                          id: s.id,
                          data: {
                            planned_start_time: editState.planned_start_time || null,
                            planned_end_time: editState.planned_end_time || null,
                            cost_rate: parseRate(editState.cost_rate),
                            customer_rate: parseRate(editState.customer_rate),
                            notes: editState.notes.trim() || null,
                          },
                        });
                      }}
                      disabled={updateDayMutation.isPending}
                      className="h-6 px-2 text-xs"
                    >
                      {updateDayMutation.isPending ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <>
                          <Check className="mr-1 h-3 w-3" />
                          Salva
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              );
            }

            return (
              <div
                key={s.id}
                className="group flex items-center gap-2 rounded px-1.5 py-1 hover:bg-slate-50 dark:hover:bg-slate-800/50"
              >
                <span className="w-28 shrink-0 text-xs font-medium text-slate-800 dark:text-slate-200">
                  {format(parseISO(s.scheduled_date), 'EEE dd MMM', { locale: it })}
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  {s.planned_start_time?.slice(0, 5) ?? '09:00'} – {s.planned_end_time?.slice(0, 5) ?? '18:00'}
                </span>
                <span className="text-xs text-slate-400 dark:text-slate-500">
                  ({s.effective_planned_hours}h)
                </span>
                {s.cost_rate != null && (
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    €{Number(s.cost_rate).toFixed(0)}/gg
                  </span>
                )}
                {s.customer_rate != null && (
                  <span className="text-xs text-emerald-600 dark:text-emerald-400">
                    €{Number(s.customer_rate).toFixed(0)}/gg
                  </span>
                )}
                <Badge
                  className={cn(
                    'ml-auto shrink-0 px-1.5 py-0 text-xs',
                    scheduleStatusColors[s.status as string]
                  )}
                >
                  {scheduleStatusLabels[s.status as string] ?? s.status}
                </Badge>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setEditState(scheduleToEditState(s));
                    setEditingScheduleId(s.id);
                  }}
                  className="h-5 w-5 shrink-0 p-0 text-slate-300 opacity-0 transition-opacity group-hover:opacity-100 hover:text-blue-500 dark:text-slate-600 dark:hover:text-blue-400"
                >
                  <Pencil className="h-3 w-3" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => deleteDayMutation.mutate(s.id)}
                  disabled={deleteDayMutation.isPending}
                  className="h-5 w-5 shrink-0 p-0 text-slate-300 opacity-0 transition-opacity group-hover:opacity-100 hover:text-red-500 dark:text-slate-600 dark:hover:text-red-400"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Generate Schedule Dialog ─────────────────────────────────────────── */}
      <Dialog open={generateOpen} onOpenChange={setGenerateOpen}>
        <DialogContent className="border-slate-200 bg-white sm:max-w-sm dark:border-slate-700 dark:bg-slate-900">
          <DialogHeader>
            <DialogTitle className="text-slate-900 dark:text-slate-100">
              Genera convocazioni
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-slate-900 dark:text-slate-100">Dal</Label>
                <Input
                  type="date"
                  value={genStartDate}
                  onChange={(e) => setGenStartDate(e.target.value)}
                  className="border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-slate-900 dark:text-slate-100">Al</Label>
                <Input
                  type="date"
                  value={genEndDate}
                  onChange={(e) => setGenEndDate(e.target.value)}
                  className="border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-slate-900 dark:text-slate-100">Orario inizio</Label>
                <Input
                  type="time"
                  value={genStartTime}
                  onChange={(e) => setGenStartTime(e.target.value)}
                  className="border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-slate-900 dark:text-slate-100">Orario fine</Label>
                <Input
                  type="time"
                  value={genEndTime}
                  onChange={(e) => setGenEndTime(e.target.value)}
                  className="border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="skip-weekends"
                  checked={genSkipWeekends}
                  onCheckedChange={(c) => setGenSkipWeekends(!!c)}
                />
                <label
                  htmlFor="skip-weekends"
                  className="cursor-pointer text-sm text-slate-700 dark:text-slate-300"
                >
                  Escludi sabato e domenica
                </label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="replace-existing"
                  checked={genReplace}
                  onCheckedChange={(c) => setGenReplace(!!c)}
                />
                <label
                  htmlFor="replace-existing"
                  className="cursor-pointer text-sm text-slate-700 dark:text-slate-300"
                >
                  Sostituisci convocazioni esistenti
                </label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setGenerateOpen(false)}
              className="border-slate-200 dark:border-slate-700 dark:text-slate-100"
            >
              Annulla
            </Button>
            <Button
              onClick={() => generateMutation.mutate()}
              disabled={!genStartDate || !genEndDate || generateMutation.isPending}
              className=""
            >
              {generateMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generando...
                </>
              ) : (
                'Genera'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Add Day Dialog ───────────────────────────────────────────────────── */}
      <Dialog open={addDayOpen} onOpenChange={(o) => { if (!o) { setAddDayOpen(false); setNewDate(''); setNewNotes(''); } }}>
        <DialogContent className="border-slate-200 bg-white sm:max-w-xs dark:border-slate-700 dark:bg-slate-900">
          <DialogHeader>
            <DialogTitle className="text-slate-900 dark:text-slate-100">
              Aggiungi convocazione
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-slate-900 dark:text-slate-100">
                Data <span className="text-red-500">*</span>
              </Label>
              <Input
                type="date"
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
                className="border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1.5">
                <Label className="text-slate-900 dark:text-slate-100">Dalle</Label>
                <Input
                  type="time"
                  value={newStartTime}
                  onChange={(e) => setNewStartTime(e.target.value)}
                  className="border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-slate-900 dark:text-slate-100">Alle</Label>
                <Input
                  type="time"
                  value={newEndTime}
                  onChange={(e) => setNewEndTime(e.target.value)}
                  className="border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-slate-900 dark:text-slate-100">Note (opzionale)</Label>
              <Input
                value={newNotes}
                onChange={(e) => setNewNotes(e.target.value)}
                placeholder="Istruzioni speciali, punto di raccolta…"
                className="border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setAddDayOpen(false)}
              className="border-slate-200 dark:border-slate-700 dark:text-slate-100"
            >
              Annulla
            </Button>
            <Button
              onClick={() => addDayMutation.mutate()}
              disabled={!newDate || addDayMutation.isPending}
              className=""
            >
              {addDayMutation.isPending ? 'Salvo...' : 'Aggiungi'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
