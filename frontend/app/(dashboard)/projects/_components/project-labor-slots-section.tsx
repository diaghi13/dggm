'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { projectWorkersApi } from '@/lib/api/project-workers';
import { workersApi } from '@/lib/api/workers';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Plus, Trash2, Users } from 'lucide-react';
import type { ProjectWorker } from '@/lib/types';
import { CurrencyDisplay, CurrencyInput, formatCurrency } from '@/components/ui/currency-input';

interface Props {
  projectId: number;
}

const statusColors: Record<string, string> = {
  slot:      'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
  pending:   'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300',
  accepted:  'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  active:    'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
  completed: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  rejected:  'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
  cancelled: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
};

const statusLabels: Record<string, string> = {
  slot:      'Non assegnato',
  pending:   'In attesa risposta',
  accepted:  'Accettato',
  active:    'Attivo',
  completed: 'Completato',
  rejected:  'Rifiutato',
  cancelled: 'Annullato',
};

export function ProjectLaborSlotsSection({ projectId }: Props) {
  const queryClient = useQueryClient();

  // Assign dialog
  const [assigningSlot, setAssigningSlot] = useState<ProjectWorker | null>(null);
  const [selectedWorkerId, setSelectedWorkerId] = useState<string>('');
  const [assignedFrom, setAssignedFrom] = useState('');
  const [actualCostRate, setActualCostRate] = useState<number | null>(null);

  // Create slot dialog
  const [createOpen, setCreateOpen] = useState(false);
  const [newRoleName, setNewRoleName] = useState('');
  const [newEstimatedDays, setNewEstimatedDays] = useState('');
  const [newBudgetRate, setNewBudgetRate] = useState<number | null>(null);
  const [newCustomerRate, setNewCustomerRate] = useState<number | null>(null);
  const [newNotes, setNewNotes] = useState('');

  const { data: workers = [], isLoading } = useQuery({
    queryKey: ['project-workers', projectId],
    queryFn: () => projectWorkersApi.getWorkersByProject(projectId),
  });

  const { data: availableWorkers = [] } = useQuery({
    queryKey: ['workers-list'],
    queryFn: () => workersApi.getAll({ per_page: 100 }),
    select: (r) => r.data ?? [],
  });

  const slots = workers.filter((w) => w.status === 'slot');
  const assigned = workers.filter((w) => w.status !== 'slot');

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['project-workers', projectId] });

  // Assign worker to slot
  const assignMutation = useMutation({
    mutationFn: ({
      slotId, workerId, from, costRate,
    }: { slotId: number; workerId: number; from: string; costRate: number | null }) =>
      projectWorkersApi.assignSlot(slotId, {
        worker_id: workerId,
        assigned_from: from || undefined,
        actual_cost_rate: costRate ?? undefined,
      }),
    onSuccess: (result) => {
      invalidate();
      setAssigningSlot(null);
      setSelectedWorkerId('');
      setAssignedFrom('');
      setActualCostRate(null);
      toast.success('Lavoratore assegnato con successo');

      const costRate = Number(result.actual_cost_rate ?? 0);
      const customerRate = Number(result.customer_rate ?? 0);
      if (costRate > 0 && customerRate > 0 && costRate >= customerRate) {
        toast.warning(
          `Attenzione: la tariffa costo (€\u202f${formatCurrency(costRate)}/gg) è ≥ al prezzo venduto (€\u202f${formatCurrency(customerRate)}/gg). Margine zero o perdita.`,
          { duration: 8000 }
        );
      }
    },
    onError: () => toast.error("Errore durante l'assegnazione"),
  });

  // Create new slot manually
  const createSlotMutation = useMutation({
    mutationFn: () =>
      projectWorkersApi.createSlot(projectId, {
        role_name: newRoleName.trim(),
        estimated_days: newEstimatedDays !== '' ? parseFloat(newEstimatedDays) : null,
        budget_cost_rate: newBudgetRate,
        customer_rate: newCustomerRate,
        notes: newNotes.trim() || null,
      }),
    onSuccess: () => {
      invalidate();
      setCreateOpen(false);
      setNewRoleName('');
      setNewEstimatedDays('');
      setNewBudgetRate(null);
      setNewCustomerRate(null);
      setNewNotes('');
      toast.success('Slot creato');
    },
    onError: () => toast.error('Errore durante la creazione dello slot'),
  });

  // Delete a slot (only unassigned)
  const deleteSlotMutation = useMutation({
    mutationFn: (slotId: number) => projectWorkersApi.removeWorker(slotId),
    onSuccess: () => { invalidate(); toast.success('Slot eliminato'); },
    onError: () => toast.error("Errore durante l'eliminazione"),
  });

  const handleAssign = () => {
    if (!assigningSlot || !selectedWorkerId) return;
    assignMutation.mutate({
      slotId: assigningSlot.id,
      workerId: parseInt(selectedWorkerId),
      from: assignedFrom,
      costRate: actualCostRate,
    });
  };

  const handleCreate = () => {
    if (!newRoleName.trim()) return;
    createSlotMutation.mutate();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8 text-slate-500 dark:text-slate-400">
        Caricamento personale...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Personale</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Slot di personale dal preventivo e aggiunte manuali
          </p>
        </div>
        <Button
          size="sm"
          onClick={() => setCreateOpen(true)}
          className="gap-2 bg-blue-600 text-white hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          Aggiungi slot
        </Button>
      </div>

      {/* Unassigned Slots */}
      {slots.length > 0 && (
        <Card className="border-slate-200 dark:border-slate-700">
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-slate-900 dark:text-slate-100">
              Slot da assegnare ({slots.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {slots.map((slot) => (
                <div key={slot.id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                  <div className="space-y-0.5">
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                      {slot.role_name ?? 'Ruolo non definito'}
                      {(slot.slot_index ?? 1) > 1 && (
                        <span className="ml-1 text-xs text-slate-500 dark:text-slate-400">
                          #{slot.slot_index}
                        </span>
                      )}
                    </p>
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-slate-500 dark:text-slate-400">
                      {slot.estimated_days != null && (
                        <span>{slot.estimated_days} gg stimati</span>
                      )}
                      {slot.budget_cost_rate != null && (
                        <span>· Costo budget: <CurrencyDisplay value={Number(slot.budget_cost_rate)} />/gg</span>
                      )}
                      {slot.customer_rate != null && (
                        <span>· Tariffa cliente: <CurrencyDisplay value={Number(slot.customer_rate)} />/gg</span>
                      )}
                      {slot.notes && (
                        <span className="italic">· {slot.notes}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-4">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setAssigningSlot(slot)}
                      className="border-slate-200 dark:border-slate-700 dark:text-slate-100"
                    >
                      Assegna
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => deleteSlotMutation.mutate(slot.id)}
                      disabled={deleteSlotMutation.isPending}
                      className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Assigned Workers */}
      {assigned.length > 0 && (
        <Card className="border-slate-200 dark:border-slate-700">
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-slate-900 dark:text-slate-100">
              Personale assegnato ({assigned.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {assigned.map((pw) => (
                <div key={pw.id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                  <div className="space-y-0.5">
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                      {pw.worker?.full_name ?? pw.worker_name ?? '—'}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {pw.role_name ?? 'Nessun ruolo'}
                      {pw.assigned_from &&
                        ` · Dal ${new Date(pw.assigned_from).toLocaleDateString('it-IT')}`}
                    </p>
                  </div>
                  <Badge className={statusColors[pw.status ?? 'pending']}>
                    {statusLabels[pw.status ?? 'pending']}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty state */}
      {slots.length === 0 && assigned.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 py-12 text-center dark:border-slate-700 dark:bg-slate-800/20">
          <Users className="h-12 w-12 text-slate-300 dark:text-slate-600 mb-4" />
          <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
            Nessun personale configurato
          </p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-500">
            Gli slot vengono creati dalla conversione del preventivo o puoi aggiungerli manualmente.
          </p>
          <Button
            size="sm"
            onClick={() => setCreateOpen(true)}
            className="mt-4 gap-2 bg-blue-600 text-white hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            Aggiungi il primo slot
          </Button>
        </div>
      )}

      {/* ── Assign Worker Dialog ────────────────────────────────── */}
      <Dialog
        open={!!assigningSlot}
        onOpenChange={(open) => {
          if (!open) {
            setAssigningSlot(null);
            setSelectedWorkerId('');
            setAssignedFrom('');
            setActualCostRate(null);
          }
        }}
      >
        <DialogContent className="border-slate-200 bg-white sm:max-w-md dark:border-slate-700 dark:bg-slate-900">
          <DialogHeader>
            <DialogTitle className="text-slate-900 dark:text-slate-100">Assegna collaboratore</DialogTitle>
          </DialogHeader>
          {assigningSlot && (
            <div className="space-y-4">
              <div className="rounded-md bg-slate-50 p-3 dark:bg-slate-800">
                <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                  {assigningSlot.role_name}
                </p>
                {assigningSlot.estimated_days != null && (
                  <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                    {assigningSlot.estimated_days} giorni stimati
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label className="text-slate-900 dark:text-slate-100">
                  Collaboratore <span className="text-red-500">*</span>
                </Label>
                <Select value={selectedWorkerId} onValueChange={setSelectedWorkerId}>
                  <SelectTrigger className="border-slate-200 bg-white text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100">
                    <SelectValue placeholder="Seleziona collaboratore..." />
                  </SelectTrigger>
                  <SelectContent className="border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
                    {availableWorkers.map((w) => (
                      <SelectItem key={w.id} value={String(w.id)} className="dark:text-slate-100">
                        {w.full_name} {w.code ? `(${w.code})` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-slate-900 dark:text-slate-100">Data inizio (opzionale)</Label>
                <Input
                  type="date"
                  value={assignedFrom}
                  onChange={(e) => setAssignedFrom(e.target.value)}
                  className="border-slate-200 bg-white text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-slate-900 dark:text-slate-100">
                  Tariffa costo (€/gg) — opzionale
                </Label>
                <CurrencyInput
                  value={actualCostRate}
                  onChange={(v) => setActualCostRate(v)}
                  placeholder="Auto da tariffa collaboratore"
                  className="border-slate-200 bg-white text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                />
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Lascia vuoto per usare la tariffa standard del collaboratore
                </p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => { setAssigningSlot(null); setSelectedWorkerId(''); setAssignedFrom(''); setActualCostRate(null); }}
              className="border-slate-200 dark:border-slate-700 dark:text-slate-100"
            >
              Annulla
            </Button>
            <Button
              onClick={handleAssign}
              disabled={!selectedWorkerId || assignMutation.isPending}
              className="bg-blue-600 text-white hover:bg-blue-700"
            >
              {assignMutation.isPending ? 'Assegnando...' : 'Assegna'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Create Slot Dialog ──────────────────────────────────── */}
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
          }
        }}
      >
        <DialogContent className="border-slate-200 bg-white sm:max-w-md dark:border-slate-700 dark:bg-slate-900">
          <DialogHeader>
            <DialogTitle className="text-slate-900 dark:text-slate-100">Nuovo slot personale</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-slate-900 dark:text-slate-100">
                Ruolo / Mansione <span className="text-red-500">*</span>
              </Label>
              <Input
                value={newRoleName}
                onChange={(e) => setNewRoleName(e.target.value)}
                placeholder="es. Elettricista, Operatore video, Fonico…"
                className="border-slate-200 bg-white text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
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
              </div>
              <div className="space-y-2">
                <Label className="text-slate-900 dark:text-slate-100">Tariffa cliente (€/gg)</Label>
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
              onClick={handleCreate}
              disabled={!newRoleName.trim() || createSlotMutation.isPending}
              className="bg-blue-600 text-white hover:bg-blue-700"
            >
              {createSlotMutation.isPending ? 'Creando...' : 'Crea slot'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
