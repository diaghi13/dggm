'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { handleMutationError } from '@/lib/utils/handle-mutation-error';
import { Shield, Check } from 'lucide-react';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { permissionsApi, rolesApi, type Role } from '@/lib/api/users';

interface AssignPermissionsDialogProps {
  role: Role | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AssignPermissionsDialog({
  role,
  open,
  onOpenChange,
}: AssignPermissionsDialogProps) {
  const queryClient = useQueryClient();
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);

  // Fetch grouped permissions
  const { data: groupedPermissions = {}, isLoading } = useQuery({
    queryKey: ['permissions-grouped'],
    queryFn: permissionsApi.getGrouped,
    enabled: open,
  });

  // Sync permissions mutation
  const syncMutation = useMutation({
    mutationFn: ({ roleId, permissions }: { roleId: number; permissions: string[] }) =>
      rolesApi.syncPermissions(roleId, permissions),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('Permessi aggiornati con successo');
      onOpenChange(false);
    },
    onError: (error) => {
      handleMutationError(error, 'Errore durante l\'aggiornamento dei permessi');
    },
  });

  // Initialize selected permissions when role changes
  useEffect(() => {
    if (role) {
      setSelectedPermissions(role.permissions || []);
    }
  }, [role]);

  const togglePermission = (permissionName: string) => {
    setSelectedPermissions((prev) =>
      prev.includes(permissionName)
        ? prev.filter((p) => p !== permissionName)
        : [...prev, permissionName]
    );
  };

  const toggleModule = (module: string) => {
    const modulePermissions = groupedPermissions[module]?.map((p: any) => p.name) || [];
    const allSelected = modulePermissions.every((p: string) => selectedPermissions.includes(p));

    if (allSelected) {
      // Deselect all
      setSelectedPermissions((prev) => prev.filter((p) => !modulePermissions.includes(p)));
    } else {
      // Select all
      setSelectedPermissions((prev) => [...new Set([...prev, ...modulePermissions])]);
    }
  };

  const handleSave = () => {
    if (role) {
      syncMutation.mutate({
        roleId: role.id,
        permissions: selectedPermissions,
      });
    }
  };

  const moduleCounts = Object.entries(groupedPermissions).reduce((acc, [module, permissions]: [string, any]) => {
    const selected = (permissions as any[]).filter((p) => selectedPermissions.includes(p.name)).length;
    const total = (permissions as any[]).length;
    acc[module] = { selected, total };
    return acc;
  }, {} as Record<string, { selected: number; total: number }>);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Gestisci Permessi - {role?.display_name}
          </DialogTitle>
          <DialogDescription>
            Seleziona i permessi da assegnare al ruolo. I permessi raggruppati per modulo.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto pr-2">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-slate-600 dark:text-slate-400">Caricamento permessi...</div>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(groupedPermissions).map(([module, permissions]: [string, any]) => {
                const { selected, total } = moduleCounts[module];
                const allSelected = selected === total;
                const someSelected = selected > 0 && selected < total;

                return (
                  <div key={module} className="space-y-3">
                    {/* Module Header */}
                    <div className="flex items-center justify-between sticky top-0 bg-white dark:bg-slate-900 py-2 border-b border-slate-200 dark:border-slate-800">
                      <div className="flex items-center gap-3">
                        <Checkbox
                          checked={allSelected}
                          onCheckedChange={() => toggleModule(module)}
                          className={someSelected ? 'opacity-50' : ''}
                        />
                        <div>
                          <Badge variant="outline" className="text-sm font-semibold">
                            {module.toUpperCase()}
                          </Badge>
                          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                            {selected} / {total} selezionati
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Permissions Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pl-8">
                      {(permissions as any[]).map((permission) => {
                        const isSelected = selectedPermissions.includes(permission.name);
                        return (
                          <div
                            key={permission.id}
                            className={`
                              flex items-start gap-3 p-3 rounded-md border
                              ${isSelected
                                ? 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800'
                                : 'bg-slate-50 dark:bg-slate-800/30 border-slate-200 dark:border-slate-800'
                              }
                              hover:border-blue-300 dark:hover:border-blue-700 transition-colors cursor-pointer
                            `}
                            onClick={() => togglePermission(permission.name)}
                          >
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={() => togglePermission(permission.name)}
                              className="mt-0.5"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-sm text-slate-900 dark:text-slate-100">
                                  {permission.display_name || permission.name}
                                </span>
                                {isSelected && (
                                  <Check className="h-4 w-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                                )}
                              </div>
                              <p className="text-xs font-mono text-slate-500 dark:text-slate-400 truncate">
                                {permission.name}
                              </p>
                              {permission.description && (
                                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                                  {permission.description}
                                </p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}

              {Object.keys(groupedPermissions).length === 0 && (
                <div className="text-center py-12">
                  <Shield className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                  <p className="text-slate-600 dark:text-slate-400">
                    Nessun permesso disponibile
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="border-t border-slate-200 dark:border-slate-800 pt-4">
          <div className="flex items-center justify-between w-full">
            <div className="text-sm text-slate-600 dark:text-slate-400">
              {selectedPermissions.length} permessi selezionati
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={syncMutation.isPending}
              >
                Annulla
              </Button>
              <Button
                type="button"
                onClick={handleSave}
                disabled={syncMutation.isPending}
              >
                {syncMutation.isPending ? 'Salvataggio...' : 'Salva Permessi'}
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
