'use client';

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DataTableWrapper } from '@/components/shared/data-table/data-table-wrapper';
import { DataTableRow } from '@/components/shared/data-table/table-components';
import { Can } from '@/components/features/auth/can';
import { Users, Edit2, Trash2, Search, Filter, AlertTriangle } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

interface User {
  id: number;
  name: string;
  email: string;
  roles: string[];
  is_active: boolean;
}

interface UserManagementTableProps {
  users: User[];
  isLoading: boolean;
  onEdit: (user: User) => void;
  onDelete: (userId: number) => void;
}

export function UserManagementTable({
  users,
  isLoading,
  onEdit,
  onDelete,
}: UserManagementTableProps) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);

  // Filter users
  const filteredUsers = useMemo(() => {
    if (!users) return [];

    return users.filter(user => {
      // Search filter (name or email)
      const matchesSearch = search === '' ||
        user.name.toLowerCase().includes(search.toLowerCase()) ||
        user.email.toLowerCase().includes(search.toLowerCase());

      // Status filter
      const matchesStatus = statusFilter === 'all' ||
        (statusFilter === 'active' && user.is_active) ||
        (statusFilter === 'inactive' && !user.is_active);

      return matchesSearch && matchesStatus;
    });
  }, [users, search, statusFilter]);

  const handleDeleteClick = (user: User) => {
    setUserToDelete(user);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (userToDelete) {
      onDelete(userToDelete.id);
      setDeleteDialogOpen(false);
      setUserToDelete(null);
    }
  };

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent align-[-0.125em]"></div>
        <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">Caricamento utenti...</p>
      </div>
    );
  }

  return (
    <>
      {/* Filters */}
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            type="search"
            placeholder="Cerca per nome o email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
            autoComplete="off"
            name="user-search"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-slate-500" />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tutti gli stati</SelectItem>
              <SelectItem value="active">Attivi</SelectItem>
              <SelectItem value="inactive">Inattivi</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Results count */}
      {search && (
        <div className="mb-3 text-sm text-slate-600 dark:text-slate-400">
          Trovati <strong>{filteredUsers.length}</strong> utenti
        </div>
      )}

      {filteredUsers.length === 0 ? (
        <div className="text-center py-12 text-slate-600 dark:text-slate-400">
          <Users className="h-12 w-12 mx-auto mb-3 text-slate-400 dark:text-slate-600" />
          <p className="text-sm">
            {search ? 'Nessun utente trovato con i criteri di ricerca' : 'Nessun utente trovato'}
          </p>
        </div>
      ) : (
        <DataTableWrapper>
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
                <TableHead className="font-semibold text-slate-900 dark:text-slate-100 w-[250px]">
                  Utente
                </TableHead>
                <TableHead className="font-semibold text-slate-900 dark:text-slate-100">
                  Email
                </TableHead>
                <TableHead className="font-semibold text-slate-900 dark:text-slate-100">
                  Ruoli
                </TableHead>
                <TableHead className="font-semibold text-slate-900 dark:text-slate-100 text-center w-[100px]">
                  Stato
                </TableHead>
                <TableHead className="text-right font-semibold text-slate-900 dark:text-slate-100 w-[120px]">
                  Azioni
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <DataTableRow key={user.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-900 dark:bg-slate-700 flex items-center justify-center text-white font-semibold text-sm">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-slate-900 dark:text-slate-100">
                          {user.name}
                        </p>
                      </div>
                    </div>
                  </TableCell>

                  <TableCell className="text-slate-700 dark:text-slate-300">
                    <span className="font-mono text-sm">{user.email}</span>
                  </TableCell>

                  <TableCell>
                    <div className="flex gap-1 flex-wrap">
                      {user.roles && user.roles.length > 0 ? (
                        user.roles.map((role) => (
                          <Badge
                            key={role}
                            variant="outline"
                            className="text-xs capitalize"
                          >
                            {role.replace(/-/g, ' ')}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-xs text-slate-400 dark:text-slate-500 italic">
                          Nessun ruolo
                        </span>
                      )}
                    </div>
                  </TableCell>

                  <TableCell className="text-center">
                    <Badge
                      variant="secondary"
                      className={
                        user.is_active
                          ? 'bg-green-100 dark:bg-green-950/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                      }
                    >
                      {user.is_active ? 'Attivo' : 'Inattivo'}
                    </Badge>
                  </TableCell>

                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Can permission="users.edit">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onEdit(user)}
                          title="Modifica utente"
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                      </Can>

                      <Can permission="users.delete">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteClick(user)}
                          title="Elimina utente"
                        >
                          <Trash2 className="h-4 w-4 text-red-600 dark:text-red-400" />
                        </Button>
                      </Can>
                    </div>
                  </TableCell>
                </DataTableRow>
              ))}
            </TableBody>
          </Table>
        </DataTableWrapper>
      )}

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
                Sei sicuro di voler eliminare l'utente <strong>{userToDelete?.name}</strong>?
              </p>
              <p className="text-sm text-amber-600 dark:text-amber-500">
                Questa azione non può essere annullata. Tutti i dati associati all'utente verranno eliminati.
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
    </>
  );
}
