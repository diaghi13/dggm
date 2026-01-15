'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { siteWorkersApi } from '@/lib/api/site-workers';
import { SiteRoleBadge } from '@/components/site-role-badge';
import { toast } from 'sonner';
import { Loader2, Users } from 'lucide-react';
import type { SiteWorker, SiteRole } from '@/lib/types';

interface ManageWorkerRolesDialogProps {
  siteId: number;
  assignment: SiteWorker | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ManageWorkerRolesDialog({
  siteId,
  assignment,
  open,
  onOpenChange,
}: ManageWorkerRolesDialogProps) {
  const queryClient = useQueryClient();
  const [selectedRoles, setSelectedRoles] = useState<number[]>([]);

  const { data: roles, isLoading: loadingRoles } = useQuery({
    queryKey: ['site-roles'],
    queryFn: () => siteWorkersApi.getRoles(),
    enabled: open,
  });

  const updateRolesMutation = useMutation({
    mutationFn: (roleIds: number[]) => {
      if (!assignment) throw new Error('No assignment selected');
      return siteWorkersApi.updateAssignment(assignment.id, {
        role_ids: roleIds,
      });
    },
    onSuccess: () => {
      toast.success('Ruoli aggiornati con successo');
      queryClient.invalidateQueries({ queryKey: ['site-workers', siteId] });
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Errore durante l\'aggiornamento dei ruoli');
    },
  });

  const toggleRole = (roleId: number) => {
    setSelectedRoles((prev) =>
      prev.includes(roleId) ? prev.filter((id) => id !== roleId) : [...prev, roleId]
    );
  };

  const handleSave = () => {
    if (selectedRoles.length === 0) {
      toast.error('Seleziona almeno un ruolo');
      return;
    }
    updateRolesMutation.mutate(selectedRoles);
  };

  useEffect(() => {
    if (open && assignment) {
      // Load current roles
      const currentRoleIds = assignment.roles?.map((r) => r.id) || [];
      setSelectedRoles(currentRoleIds);
    } else if (!open) {
      setSelectedRoles([]);
    }
  }, [open, assignment]);

  if (!assignment) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Gestisci Ruoli
          </DialogTitle>
          <DialogDescription>
            Modifica i ruoli di {assignment.worker?.full_name} in questo cantiere
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-3 block">
              Ruoli assegnati ({selectedRoles.length})
            </label>
            {loadingRoles ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
              </div>
            ) : (
              <div className="flex flex-wrap gap-2 p-4 border rounded-md bg-slate-50 dark:bg-slate-900 min-h-[120px]">
                {roles?.map((role) => (
                  <button
                    key={role.id}
                    type="button"
                    onClick={() => toggleRole(role.id)}
                    className="transition-all hover:scale-105"
                  >
                    <SiteRoleBadge
                      role={role}
                      className={
                        selectedRoles.includes(role.id)
                          ? 'border-2 opacity-100 shadow-sm'
                          : 'opacity-40 hover:opacity-60'
                      }
                    />
                  </button>
                ))}
              </div>
            )}
            <p className="text-xs text-slate-500 mt-2">
              Clicca sui badge per selezionare/deselezionare i ruoli
            </p>
          </div>

          {selectedRoles.length === 0 && (
            <p className="text-sm text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-md p-3">
              ⚠️ Seleziona almeno un ruolo per il lavoratore
            </p>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={updateRolesMutation.isPending}
          >
            Annulla
          </Button>
          <Button
            onClick={handleSave}
            disabled={updateRolesMutation.isPending || selectedRoles.length === 0}
          >
            {updateRolesMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Salva Ruoli
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
