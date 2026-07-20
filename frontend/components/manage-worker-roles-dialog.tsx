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
import { projectWorkersApi } from '@/lib/api/project-workers';
import { ProjectRoleBadge } from '@/app/(dashboard)/projects/_components/project-role-badge';
import { toast } from 'sonner';
import { handleMutationError } from '@/lib/utils/handle-mutation-error';
import { Loader2, Users } from 'lucide-react';
import type { ProjectWorker, ProjectRole } from '@/lib/types';

interface ManageWorkerRolesDialogProps {
  projectId: number;
  assignment: ProjectWorker | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ManageWorkerRolesDialog({
  projectId,
  assignment,
  open,
  onOpenChange,
}: ManageWorkerRolesDialogProps) {
  const queryClient = useQueryClient();
  const [selectedRoles, setSelectedRoles] = useState<number[]>([]);

  const { data: roles, isLoading: loadingRoles } = useQuery({
    queryKey: ['project-roles'],
    queryFn: () => projectWorkersApi.getRoles(),
    enabled: open,
  });

  const updateRolesMutation = useMutation({
    mutationFn: (roleIds: number[]) => {
      if (!assignment) throw new Error('No assignment selected');
      return projectWorkersApi.updateAssignment(assignment.id, {
        role_ids: roleIds,
      });
    },
    onSuccess: () => {
      toast.success('Ruoli aggiornati con successo');
      queryClient.invalidateQueries({ queryKey: ['project-workers', projectId] });
      onOpenChange(false);
    },
    onError: (error) => {
      handleMutationError(error, 'Errore durante l\'aggiornamento dei ruoli');
    },
  });

  const toggleRole = (roleId: number) => {
    setSelectedRoles((prev) =>
      prev.includes(roleId) ? prev.filter((id) => id !== roleId) : [...prev, roleId]
    );
  };

  const handleSave = () => {
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

  // Auto-match role_name to project_roles when roles are loaded
  useEffect(() => {
    if (!open || !assignment || !roles || roles.length === 0) return;
    // Only auto-match if no roles are currently selected from pivot
    const existingRoleIds = assignment.roles?.map((r) => r.id) ?? [];
    if (existingRoleIds.length > 0) return; // already have pivot roles, don't override

    // Try to match role_name against project_roles names (case-insensitive substring)
    const roleName = assignment.role_name;
    if (!roleName) return;

    const matched = roles
      .filter(
        (r) =>
          roleName.toLowerCase().includes(r.name.toLowerCase()) ||
          r.name.toLowerCase().includes(roleName.toLowerCase())
      )
      .map((r) => r.id);

    if (matched.length > 0) {
      setSelectedRoles(matched);
    }
  }, [open, assignment, roles]);

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
            Modifica i ruoli di {assignment.worker?.full_name} in questo progetto
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-3 block">
              Ruoli (opzionale){selectedRoles.length > 0 ? ` — ${selectedRoles.length} selezionati` : ''}
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
                    <ProjectRoleBadge
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
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Nessun ruolo selezionato — il lavoratore sarà salvato senza ruoli specifici.
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
            disabled={updateRolesMutation.isPending}
          >
            {updateRolesMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Salva Ruoli
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
