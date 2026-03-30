'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { projectExpensesApi } from '@/lib/api/project-expenses';
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
import type { ProjectExpense } from '@/lib/types';
import { CurrencyDisplay, CurrencyInput } from '@/components/ui/currency-input';

interface Props {
  projectId: number;
}

const statusColors: Record<string, string> = {
  draft:         'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
  submitted:     'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300',
  auto_approved: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
  approved:      'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
  rejected:      'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
};

const statusLabels: Record<string, string> = {
  draft:         'Bozza',
  submitted:     'In attesa',
  auto_approved: 'Approvato',
  approved:      'Approvato',
  rejected:      'Rifiutato',
};

const categoryLabels: Record<string, string> = {
  travel:        'Viaggio',
  accommodation: 'Alloggio',
  meal:          'Pasti',
  fuel:          'Carburante',
  toll:          'Pedaggio',
  parking:       'Parcheggio',
  equipment:     'Attrezzatura',
  communication: 'Comunicazione',
  other:         'Altro',
};

const CATEGORIES = Object.entries(categoryLabels).map(([value, label]) => ({ value, label }));

interface AddExpenseForm {
  category: string;
  description: string;
  amount: number | null;
  expense_date: string;
  is_billable_to_client: boolean;
  notes: string;
}

const EMPTY_FORM: AddExpenseForm = {
  category: 'other',
  description: '',
  amount: null,
  expense_date: new Date().toISOString().slice(0, 10),
  is_billable_to_client: false,
  notes: '',
};

export function ProjectExpensesSection({ projectId }: Props) {
  const queryClient = useQueryClient();
  const [rejectingExpense, setRejectingExpense] = useState<ProjectExpense | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [addForm, setAddForm] = useState<AddExpenseForm>(EMPTY_FORM);

  const { data: expensesData, isLoading } = useQuery({
    queryKey: ['project-expenses', projectId],
    queryFn: () => projectExpensesApi.getByProject(projectId, { per_page: 50 }),
  });

  const expenses = expensesData?.data ?? [];

  const approveMutation = useMutation({
    mutationFn: (id: number) => projectExpensesApi.approve(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-expenses', projectId] });
      toast.success('Spesa approvata');
    },
    onError: () => toast.error("Errore durante l'approvazione"),
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) =>
      projectExpensesApi.reject(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-expenses', projectId] });
      setRejectingExpense(null);
      setRejectionReason('');
      toast.success('Spesa rifiutata');
    },
    onError: () => toast.error('Errore durante il rifiuto'),
  });

  const createMutation = useMutation({
    mutationFn: () =>
      projectExpensesApi.create(projectId, {
        category: addForm.category,
        description: addForm.description,
        amount: addForm.amount ?? 0,
        expense_date: addForm.expense_date,
        is_billable_to_client: addForm.is_billable_to_client,
        notes: addForm.notes || null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-expenses', projectId] });
      setShowAddDialog(false);
      setAddForm(EMPTY_FORM);
      toast.success('Spesa aggiunta');
    },
    onError: () => toast.error('Errore durante la creazione'),
  });

  const pending = expenses.filter((e) => e.status === 'submitted');
  const rest = expenses.filter((e) => e.status !== 'submitted');
  const totalApproved = expenses
    .filter((e) => e.status === 'approved' || e.status === 'auto_approved')
    .reduce((sum, e) => sum + Number(e.amount), 0);

  const isAddFormValid = addForm.description.trim() && addForm.amount != null && addForm.amount > 0 && addForm.expense_date;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8 text-slate-500 dark:text-slate-400">
        Caricamento spese...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with add button */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
          Spese progetto
        </h3>
        <Button
          size="sm"
          onClick={() => {
            setAddForm(EMPTY_FORM);
            setShowAddDialog(true);
          }}
          className="gap-1 bg-blue-600 text-white hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          Aggiungi Spesa
        </Button>
      </div>

      {totalApproved > 0 && (
        <div className="flex items-center justify-between rounded-lg bg-slate-50 p-3 dark:bg-slate-800/50">
          <span className="text-sm text-slate-600 dark:text-slate-400">
            Totale spese approvate
          </span>
          <span className="font-semibold text-slate-900 dark:text-slate-100">
            <CurrencyDisplay value={totalApproved} />
          </span>
        </div>
      )}

      {pending.length > 0 && (
        <div>
          <h4 className="mb-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
            In attesa di approvazione ({pending.length})
          </h4>
          <div className="divide-y divide-slate-100 rounded-lg border border-yellow-200 dark:divide-slate-800 dark:border-yellow-800/50">
            {pending.map((expense) => (
              <div key={expense.id} className="flex items-center justify-between p-3">
                <div className="space-y-0.5">
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                    {expense.description}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {categoryLabels[expense.category] ?? expense.category}
                    {' · '}
                    {new Date(expense.expense_date).toLocaleDateString('it-IT')}
                    {' · '}
                    {expense.submitted_by_name ?? '—'}
                    {expense.is_billable_to_client && (
                      <span className="ml-1 text-blue-600 dark:text-blue-400">· Da fatturare</span>
                    )}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    <CurrencyDisplay value={Number(expense.amount)} />
                  </span>
                  <div className="flex items-center gap-1">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setRejectingExpense(expense);
                        setRejectionReason('');
                      }}
                      className="border-red-200 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400"
                    >
                      Rifiuta
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => approveMutation.mutate(expense.id)}
                      disabled={approveMutation.isPending}
                      className="bg-green-600 text-white hover:bg-green-700"
                    >
                      Approva
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {rest.length > 0 && (
        <div>
          <h4 className="mb-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
            Storico spese
          </h4>
          <div className="divide-y divide-slate-100 rounded-lg border border-slate-200 dark:divide-slate-800 dark:border-slate-700">
            {rest.map((expense) => (
              <div key={expense.id} className="flex items-center justify-between p-3">
                <div className="space-y-0.5">
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                    {expense.description}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {categoryLabels[expense.category] ?? expense.category}
                    {' · '}
                    {new Date(expense.expense_date).toLocaleDateString('it-IT')}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    <CurrencyDisplay value={Number(expense.amount)} />
                  </span>
                  <Badge className={statusColors[expense.status ?? 'draft']}>
                    {statusLabels[expense.status ?? 'draft']}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {expenses.length === 0 && (
        <div className="py-8 text-center text-sm text-slate-500 dark:text-slate-400">
          Nessuna spesa registrata per questo progetto.
        </div>
      )}

      {/* Add Expense Dialog */}
      <Dialog open={showAddDialog} onOpenChange={(open) => { if (!open) { setShowAddDialog(false); } }}>
        <DialogContent className="border-slate-200 bg-white sm:max-w-md dark:border-slate-700 dark:bg-slate-900">
          <DialogHeader>
            <DialogTitle className="text-slate-900 dark:text-slate-100">Aggiungi Spesa</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-slate-900 dark:text-slate-100">Categoria</Label>
              <Select value={addForm.category} onValueChange={(v) => setAddForm({ ...addForm, category: v })}>
                <SelectTrigger className="border-slate-200 bg-white text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="dark:bg-slate-900">
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c.value} value={c.value} className="dark:text-slate-100">{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-slate-900 dark:text-slate-100">
                Descrizione <span className="text-red-500">*</span>
              </Label>
              <Input
                value={addForm.description}
                onChange={(e) => setAddForm({ ...addForm, description: e.target.value })}
                placeholder="Es. Pranzo con cliente, carburante..."
                className="border-slate-200 bg-white text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-slate-900 dark:text-slate-100">
                  Importo (€) <span className="text-red-500">*</span>
                </Label>
                <CurrencyInput
                  value={addForm.amount}
                  onChange={(v) => setAddForm({ ...addForm, amount: v })}
                  className="border-slate-200 bg-white text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-900 dark:text-slate-100">
                  Data <span className="text-red-500">*</span>
                </Label>
                <Input
                  type="date"
                  value={addForm.expense_date}
                  onChange={(e) => setAddForm({ ...addForm, expense_date: e.target.value })}
                  className="border-slate-200 bg-white text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="billable"
                checked={addForm.is_billable_to_client}
                onChange={(e) => setAddForm({ ...addForm, is_billable_to_client: e.target.checked })}
                className="h-4 w-4 rounded border-slate-300 text-blue-600"
              />
              <Label htmlFor="billable" className="cursor-pointer text-sm text-slate-700 dark:text-slate-300">
                Da fatturare al cliente
              </Label>
            </div>

            <div className="space-y-2">
              <Label className="text-slate-900 dark:text-slate-100">Note (opzionale)</Label>
              <Textarea
                value={addForm.notes}
                onChange={(e) => setAddForm({ ...addForm, notes: e.target.value })}
                placeholder="Note aggiuntive..."
                rows={2}
                className="border-slate-200 bg-white text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowAddDialog(false)}
              className="border-slate-200 dark:border-slate-700 dark:text-slate-100"
            >
              Annulla
            </Button>
            <Button
              onClick={() => createMutation.mutate()}
              disabled={!isAddFormValid || createMutation.isPending}
              className="bg-blue-600 text-white hover:bg-blue-700"
            >
              {createMutation.isPending ? 'Aggiungendo...' : 'Aggiungi'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog
        open={!!rejectingExpense}
        onOpenChange={(open) => {
          if (!open) {
            setRejectingExpense(null);
          }
        }}
      >
        <DialogContent className="border-slate-200 bg-white sm:max-w-md dark:border-slate-700 dark:bg-slate-900">
          <DialogHeader>
            <DialogTitle className="text-slate-900 dark:text-slate-100">Rifiuta spesa</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Indica il motivo del rifiuto (obbligatorio).
            </p>
            <Textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Es. Spesa non autorizzata o non documentata..."
              className="border-slate-200 bg-white text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRejectingExpense(null)}
              className="border-slate-200 dark:border-slate-700 dark:text-slate-100"
            >
              Annulla
            </Button>
            <Button
              variant="destructive"
              disabled={!rejectionReason.trim() || rejectMutation.isPending}
              onClick={() => {
                if (rejectingExpense) {
                  rejectMutation.mutate({ id: rejectingExpense.id, reason: rejectionReason });
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
