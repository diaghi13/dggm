'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usersApi, rolesApi, permissionsApi } from '@/lib/api/users';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PageHeader } from '@/components/layout/page-header';
import { ProtectedRoute } from '@/components/features/auth/protected-route';
import { Can } from '@/components/features/auth/can';
import { UserManagementTable } from '@/components/features/users/user-management-table';
import { RoleManagementTable } from '@/components/features/users/role-management-table';
import { UserFormSheet } from '@/components/features/users/user-form-sheet';
import { RoleFormSheet } from '@/components/features/users/role-form-sheet';
import { Users, Shield, Plus, UserCog } from 'lucide-react';
import { toast } from 'sonner';

export default function UsersManagementPage() {
  return (
    <ProtectedRoute permission="users.view">
      <UsersManagementContent />
    </ProtectedRoute>
  );
}

function UsersManagementContent() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('users');

  // User dialog state
  const [isUserDialogOpen, setIsUserDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);

  // Role dialog state
  const [isRoleDialogOpen, setIsRoleDialogOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<any>(null);

  // Fetch users
  const { data: usersData, isLoading: isLoadingUsers } = useQuery({
    queryKey: ['users'],
    queryFn: () => usersApi.getAll({ per_page: 100 }),
  });

  const users = usersData?.data || [];

  // Fetch roles
  const { data: rolesList, isLoading: isLoadingRoles } = useQuery({
    queryKey: ['roles'],
    queryFn: rolesApi.getAll,
  });

  // Fetch permissions grouped
  const { data: permissionsGrouped } = useQuery({
    queryKey: ['permissions-grouped'],
    queryFn: permissionsApi.getGrouped,
  });

  // User mutations
  const createUserMutation = useMutation({
    mutationFn: usersApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setIsUserDialogOpen(false);
      setEditingUser(null);
      toast.success('Utente creato con successo');
    },
    onError: (error: any) => {
      toast.error('Errore', {
        description: error.response?.data?.message || 'Impossibile creare l\'utente',
      });
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => usersApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setIsUserDialogOpen(false);
      setEditingUser(null);
      toast.success('Utente aggiornato con successo');
    },
    onError: (error: any) => {
      toast.error('Errore', {
        description: error.response?.data?.message || 'Impossibile aggiornare l\'utente',
      });
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: usersApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('Utente eliminato con successo');
    },
    onError: (error: any) => {
      toast.error('Errore', {
        description: error.response?.data?.message || 'Impossibile eliminare l\'utente',
      });
    },
  });

  // Role mutations
  const createRoleMutation = useMutation({
    mutationFn: rolesApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      setIsRoleDialogOpen(false);
      setEditingRole(null);
      toast.success('Ruolo creato con successo');
    },
    onError: (error: any) => {
      toast.error('Errore', {
        description: error.response?.data?.message || 'Impossibile creare il ruolo',
      });
    },
  });

  const updateRoleMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => rolesApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      setIsRoleDialogOpen(false);
      setEditingRole(null);
      toast.success('Ruolo aggiornato con successo');
    },
    onError: (error: any) => {
      toast.error('Errore', {
        description: error.response?.data?.message || 'Impossibile aggiornare il ruolo',
      });
    },
  });

  const deleteRoleMutation = useMutation({
    mutationFn: rolesApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      toast.success('Ruolo eliminato con successo');
    },
    onError: (error: any) => {
      toast.error('Errore', {
        description: error.response?.data?.message || 'Impossibile eliminare il ruolo',
      });
    },
  });

  // Handlers
  const handleCreateUser = () => {
    setEditingUser(null);
    setIsUserDialogOpen(true);
  };

  const handleEditUser = (user: any) => {
    setEditingUser(user);
    setIsUserDialogOpen(true);
  };

  const handleUserSubmit = (data: any) => {
    if (editingUser) {
      updateUserMutation.mutate({ id: editingUser.id, data });
    } else {
      createUserMutation.mutate(data);
    }
  };

  const handleDeleteUser = (userId: number) => {
    deleteUserMutation.mutate(userId);
  };

  const handleCreateRole = () => {
    setEditingRole(null);
    setIsRoleDialogOpen(true);
  };

  const handleEditRole = (role: any) => {
    setEditingRole(role);
    setIsRoleDialogOpen(true);
  };

  const handleRoleSubmit = (data: any) => {
    if (editingRole) {
      updateRoleMutation.mutate({ id: editingRole.id, data });
    } else {
      createRoleMutation.mutate(data);
    }
  };

  const handleDeleteRole = (roleId: number) => {
    deleteRoleMutation.mutate(roleId);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Gestione Utenti e Ruoli"
        description="Gestisci utenti, ruoli e permessi del sistema"
        icon={UserCog}
      />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full max-w-[400px] grid-cols-2">
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Utenti
          </TabsTrigger>
          <TabsTrigger value="roles" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Ruoli & Permessi
          </TabsTrigger>
        </TabsList>

        {/* Users Tab */}
        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    Utenti del Sistema
                  </CardTitle>
                  <CardDescription className="mt-1.5">
                    Gestisci gli utenti del sistema e assegna i ruoli
                  </CardDescription>
                </div>
                <Can permission="users.create">
                  <Button onClick={handleCreateUser} size="sm">
                    <Plus className="mr-2 h-4 w-4" />
                    Nuovo Utente
                  </Button>
                </Can>
              </div>
            </CardHeader>
            <CardContent>
              <UserManagementTable
                users={users}
                isLoading={isLoadingUsers}
                onEdit={handleEditUser}
                onDelete={handleDeleteUser}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Roles & Permissions Tab */}
        <TabsContent value="roles" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                    Ruoli e Permessi
                  </CardTitle>
                  <CardDescription className="mt-1.5">
                    Gestisci i ruoli del sistema e i permessi associati
                  </CardDescription>
                </div>
                <Can role="super-admin">
                  <Button onClick={handleCreateRole} size="sm">
                    <Plus className="mr-2 h-4 w-4" />
                    Nuovo Ruolo
                  </Button>
                </Can>
              </div>
            </CardHeader>
            <CardContent>
              <RoleManagementTable
                roles={rolesList || []}
                isLoading={isLoadingRoles}
                onEdit={handleEditRole}
                onDelete={handleDeleteRole}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* User Form Sheet */}
      <UserFormSheet
        open={isUserDialogOpen}
        onOpenChange={setIsUserDialogOpen}
        user={editingUser}
        roles={rolesList || []}
        onSubmit={handleUserSubmit}
        isLoading={createUserMutation.isPending || updateUserMutation.isPending}
      />

      {/* Role Form Sheet */}
      <RoleFormSheet
        open={isRoleDialogOpen}
        onOpenChange={setIsRoleDialogOpen}
        role={editingRole}
        permissionsGrouped={permissionsGrouped}
        onSubmit={handleRoleSubmit}
        isLoading={createRoleMutation.isPending || updateRoleMutation.isPending}
      />
    </div>
  );
}
