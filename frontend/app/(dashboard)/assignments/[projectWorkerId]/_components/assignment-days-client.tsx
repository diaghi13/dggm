'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { projectWorkersApi } from '@/lib/api/project-workers';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, X, Calendar, MapPin, User } from 'lucide-react';
import { toast } from 'sonner';
import { handleMutationError } from '@/lib/utils/handle-mutation-error';
import { cn } from '@/lib/utils';
import type { ProjectWorkerSchedule } from '@/lib/types';

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300',
  accepted: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
  rejected: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
  completed: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  cancelled: 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400',
  modified: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',
};

const statusLabels: Record<string, string> = {
  pending: 'In attesa',
  accepted: 'Accettata',
  rejected: 'Rifiutata',
  completed: 'Completata',
  cancelled: 'Annullata',
  modified: 'Modificata',
};

interface Props {
  projectWorkerId: number;
}

export function AssignmentDaysClient({ projectWorkerId }: Props) {
  const queryClient = useQueryClient();

  const { data: assignment, isLoading: loadingAssignment } = useQuery({
    queryKey: ['project-worker', projectWorkerId],
    queryFn: () => projectWorkersApi.getAssignment(projectWorkerId),
  });

  const { data: schedules = [], isLoading: loadingSchedules } = useQuery({
    queryKey: ['assignment-schedules', projectWorkerId],
    queryFn: () => projectWorkersApi.getSchedules(projectWorkerId),
    enabled: !!assignment,
  });

  const acceptMutation = useMutation({
    mutationFn: (scheduleId: number) => projectWorkersApi.acceptSchedule(scheduleId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assignment-schedules', projectWorkerId] });
      toast.success('Giornata accettata');
    },
    onError: (error) => handleMutationError(error, 'Errore durante la conferma della giornata'),
  });

  const rejectMutation = useMutation({
    mutationFn: (scheduleId: number) => projectWorkersApi.rejectSchedule(scheduleId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assignment-schedules', projectWorkerId] });
      toast.success('Giornata rifiutata');
    },
    onError: (error) => handleMutationError(error, 'Errore durante il rifiuto della giornata'),
  });

  const pendingSchedules = (schedules as ProjectWorkerSchedule[]).filter(
    (s) => s.status === 'pending',
  );
  const isLoading = loadingAssignment || loadingSchedules;
  const isMutating = acceptMutation.isPending || rejectMutation.isPending;

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <p className="text-slate-500 dark:text-slate-400">Caricamento...</p>
      </div>
    );
  }

  if (!assignment) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <p className="text-slate-500 dark:text-slate-400">Assegnazione non trovata.</p>
      </div>
    );
  }

  const sortedSchedules = [...(schedules as ProjectWorkerSchedule[])].sort((a, b) =>
    a.scheduled_date.localeCompare(b.scheduled_date),
  );

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      {/* Assignment header */}
      <div className="mb-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">
          {assignment.project?.name ?? 'Progetto'}
        </h1>

        {assignment.project?.customer?.display_name && (
          <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400">
            <User className="h-3.5 w-3.5 shrink-0" />
            {assignment.project.customer.display_name}
          </p>
        )}

        {assignment.project?.address && (
          <p className="mt-0.5 flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400">
            <MapPin className="h-3.5 w-3.5 shrink-0" />
            {assignment.project.address}
          </p>
        )}

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Badge
            className={cn(
              'text-xs',
              statusColors[assignment.status] ?? 'bg-slate-100 text-slate-600',
            )}
          >
            {assignment.status_label ?? assignment.status}
          </Badge>
          {assignment.role_name && (
            <span className="text-xs text-slate-500 dark:text-slate-400">{assignment.role_name}</span>
          )}
          {assignment.assigned_from && (
            <span className="flex items-center gap-1 text-xs text-slate-400 dark:text-slate-500">
              <Calendar className="h-3 w-3" />
              {new Date(assignment.assigned_from).toLocaleDateString('it-IT', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
              })}
              {assignment.assigned_to && (
                <>
                  {' '}–{' '}
                  {new Date(assignment.assigned_to).toLocaleDateString('it-IT', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  })}
                </>
              )}
            </span>
          )}
        </div>
      </div>

      {/* Scheduled days */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
            <Calendar className="h-4 w-4" />
            Giornate pianificate ({sortedSchedules.length})
          </h2>
          {pendingSchedules.length > 0 && (
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {pendingSchedules.length} in attesa di risposta
            </span>
          )}
        </div>

        {sortedSchedules.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white p-8 text-center dark:border-slate-700 dark:bg-slate-900">
            <Calendar className="mx-auto mb-3 h-8 w-8 text-slate-300 dark:text-slate-600" />
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Nessuna giornata pianificata per questa assegnazione.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white dark:divide-slate-800 dark:border-slate-700 dark:bg-slate-900">
            {sortedSchedules.map((schedule) => (
              <div
                key={schedule.id}
                className="flex items-center justify-between gap-4 p-4"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                    {new Date(schedule.scheduled_date + 'T00:00:00').toLocaleDateString('it-IT', {
                      weekday: 'long',
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </p>
                  {(schedule.planned_start_time || schedule.planned_end_time) && (
                    <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                      {schedule.planned_start_time?.slice(0, 5)}
                      {schedule.planned_end_time && ` – ${schedule.planned_end_time.slice(0, 5)}`}
                      {schedule.planned_hours != null && ` · ${schedule.planned_hours}h`}
                    </p>
                  )}
                  {schedule.notes && (
                    <p className="mt-0.5 truncate text-xs italic text-slate-400 dark:text-slate-500">
                      {schedule.notes}
                    </p>
                  )}
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  {schedule.status === 'pending' ? (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => rejectMutation.mutate(schedule.id)}
                        disabled={isMutating}
                        className="h-8 w-8 border-red-200 p-0 text-red-500 hover:bg-red-50 hover:text-red-600 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950"
                        title="Rifiuta giornata"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => acceptMutation.mutate(schedule.id)}
                        disabled={isMutating}
                        className="h-8 w-8 p-0"
                        title="Accetta giornata"
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                    </>
                  ) : (
                    <Badge
                      className={cn(
                        'text-xs',
                        statusColors[schedule.status] ?? 'bg-slate-100 text-slate-600',
                      )}
                    >
                      {statusLabels[schedule.status] ?? schedule.status}
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {pendingSchedules.length > 1 && (
          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              className="border-red-200 text-red-500 hover:bg-red-50 hover:text-red-600 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950"
              disabled={isMutating}
              onClick={() => {
                pendingSchedules.forEach((s) => rejectMutation.mutate(s.id));
              }}
            >
              <X className="mr-1.5 h-3.5 w-3.5" />
              Rifiuta tutte ({pendingSchedules.length})
            </Button>
            <Button
              size="sm"
              disabled={isMutating}
              onClick={() => {
                pendingSchedules.forEach((s) => acceptMutation.mutate(s.id));
              }}
            >
              <Check className="mr-1.5 h-3.5 w-3.5" />
              Accetta tutte ({pendingSchedules.length})
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
