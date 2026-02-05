'use client';

import { useState } from 'react';
import { Role } from '@/lib/api/users';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DataTableWrapper } from '@/components/shared/data-table/data-table-wrapper';
import { DataTableRow } from '@/components/shared/data-table/table-components';
import { Can } from '@/components/features/auth/can';
import { Shield, Edit2, Trash2, Users, Key, AlertTriangle, Settings } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { AssignPermissionsDialog } from '@/components/assign-permissions-dialog';

interface RoleManagementTableProps {
  roles: Role[];
  isLoading: boolean;
  onEdit: (role: Role) => void;
  onDelete: (roleId: number) => void;
}

export function RoleManagementTable({
  roles,
  isLoading,
  onEdit,
  onDelete,
}: RoleManagementTableProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [roleToDelete, setRoleToDelete] = useState<Role | null>(null);
  const [permissionsDialogOpen, setPermissionsDialogOpen] = useState(false);
  const [roleForPermissions, setRoleForPermissions] = useState<Role | null>(null);

  const handleDeleteClick = (role: Role) => {
    setRoleToDelete(role);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (roleToDelete) {
      onDelete(roleToDelete.id);
      setDeleteDialogOpen(false);
      setRoleToDelete(null);
    }
  };

  const handleManagePermissions = (role: Role) => {
    setRoleForPermissions(role);
    setPermissionsDialogOpen(true);
  };

  const isSystemRole = (roleName: string) => {
    return ['super-admin', 'admin'].includes(roleName);
  };

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent align-[-0.125em]"></div>
        <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">Caricamento ruoli...</p>
      </div>
    );
  }

  if (!roles || roles.length === 0) {
    return (
      <div className="text-center py-12 text-slate-600 dark:text-slate-400">
        <Shield className="h-12 w-12 mx-auto mb-3 text-slate-400 dark:text-slate-600" />
        <p className="text-sm">Nessun ruolo trovato</p>
      </div>
    );
  }

  return (
    <>
      <DataTableWrapper>
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
              <TableHead className="font-semibold text-slate-900 dark:text-slate-100 w-[250px]">
                Ruolo
              </TableHead>
              <TableHead className="font-semibold text-slate-900 dark:text-slate-100">
                Descrizione
              </TableHead>
              <TableHead className="font-semibold text-slate-900 dark:text-slate-100 text-center w-[120px]">
                Permessi
              </TableHead>
              <TableHead className="font-semibold text-slate-900 dark:text-slate-100 text-center w-[120px]">
                Utenti
              </TableHead>
              <TableHead className="text-right font-semibold text-slate-900 dark:text-slate-100 w-[120px]">
                Azioni
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {roles.map((role) => (
              <DataTableRow key={role.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${
                      isSystemRole(role.name)
                        ? 'bg-purple-100 dark:bg-purple-950/30'
                        : 'bg-blue-100 dark:bg-blue-950/30'
                    }`}>
                      <Shield className={`w-4 h-4 ${
                        isSystemRole(role.name)
                          ? 'text-purple-600 dark:text-purple-400'
                          : 'text-blue-600 dark:text-blue-400'
                      }`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-slate-900 dark:text-slate-100">
                          {role.display_name}
                        </p>
                        {isSystemRole(role.name) && (
                          <Badge variant="secondary" className="text-xs">
                            Sistema
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                        {role.name}
                      </p>
                    </div>
                  </div>
                </TableCell>

                <TableCell className="text-slate-700 dark:text-slate-300">
                  <p className="line-clamp-2 text-sm">
                    {role.description || (
                      <span className="text-slate-400 dark:text-slate-500 italic">
                        Nessuna descrizione
                      </span>
                    )}
                  </p>
                </TableCell>

                <TableCell className="text-center">
                  <div className="flex items-center justify-center gap-1">
                    <Key className="h-3.5 w-3.5 text-slate-400" />
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      {role.permissions?.length || 0}
                    </span>
                  </div>
                </TableCell>

                <TableCell className="text-center">
                  <div className="flex items-center justify-center gap-1">
                    <Users className="h-3.5 w-3.5 text-slate-400" />
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      {role.users_count || 0}
                    </span>
                  </div>
                </TableCell>

                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Can role="super-admin">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleManagePermissions(role)}
                        title="Gestisci permessi"
                      >
                        <Settings className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      </Button>
                    </Can>

                    <Can role="super-admin">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onEdit(role)}
                        title="Modifica ruolo"
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                    </Can>

                    <Can role="super-admin">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteClick(role)}
                        disabled={isSystemRole(role.name) || (role.users_count ?? 0) > 0}
                        title={
                          isSystemRole(role.name)
                            ? 'Non puoi eliminare ruoli di sistema'
                            : (role.users_count ?? 0) > 0
                            ? 'Non puoi eliminare ruoli con utenti assegnati'
                            : 'Elimina ruolo'
                        }
                      >
                        <Trash2 className={`h-4 w-4 ${
                          isSystemRole(role.name) || (role.users_count ?? 0) > 0
                            ? 'text-slate-300 dark:text-slate-600'
                            : 'text-red-600 dark:text-red-400'
                        }`} />
                      </Button>
                    </Can>
                  </div>
                </TableCell>
              </DataTableRow>
            ))}
          </TableBody>
        </Table>
      </DataTableWrapper>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
              Conferma Eliminazione
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                Sei sicuro di voler eliminare il ruolo <strong>{roleToDelete?.display_name}</strong>?
              </p>
              <p className="text-sm text-amber-600 dark:text-amber-500">
                Questa azione non può essere annullata.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annulla</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800"
            >
              Elimina
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Permissions Management Dialog */}
      <AssignPermissionsDialog
        role={roleForPermissions}
        open={permissionsDialogOpen}
        onOpenChange={setPermissionsDialogOpen}
      />
    </>
  );
}
