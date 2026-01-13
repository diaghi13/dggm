'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usersApi, rolesApi, permissionsApi, Role, Permission } from '@/lib/api/users';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { PageHeader } from '@/components/page-header';
import { DataTableWrapper } from '@/components/data-table-wrapper';
import { DataTableRow } from '@/components/table-components';
import { Users, Shield, Plus, Edit2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

export default function UsersManagementPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('users');

  // Users state
  const [isUserDialogOpen, setIsUserDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userPassword, setUserPassword] = useState('');
  const [userPasswordConfirm, setUserPasswordConfirm] = useState('');
  const [userRoles, setUserRoles] = useState<string[]>([]);
  const [userActive, setUserActive] = useState(true);

  // Roles state
  const [isRoleDialogOpen, setIsRoleDialogOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [roleName, setRoleName] = useState('');
  const [roleDisplayName, setRoleDisplayName] = useState('');
  const [roleDescription, setRoleDescription] = useState('');
  const [rolePermissions, setRolePermissions] = useState<string[]>([]);

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
      resetUserForm();
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
      resetUserForm();
      toast.success('Utente aggiornato');
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
      toast.success('Utente eliminato');
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
      resetRoleForm();
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
      resetRoleForm();
      toast.success('Ruolo aggiornato');
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
      toast.success('Ruolo eliminato');
    },
    onError: (error: any) => {
      toast.error('Errore', {
        description: error.response?.data?.message || 'Impossibile eliminare il ruolo',
      });
    },
  });

  // Handlers
  const resetUserForm = () => {
    setEditingUser(null);
    setUserName('');
    setUserEmail('');
    setUserPassword('');
    setUserPasswordConfirm('');
    setUserRoles([]);
    setUserActive(true);
  };

  const resetRoleForm = () => {
    setEditingRole(null);
    setRoleName('');
    setRoleDisplayName('');
    setRoleDescription('');
    setRolePermissions([]);
  };

  const handleUserSubmit = () => {
    if (!userName || !userEmail) {
      toast.error('Nome e email sono obbligatori');
      return;
    }

    if (!editingUser && !userPassword) {
      toast.error('Password obbligatoria per nuovo utente');
      return;
    }

    if (userPassword && userPassword !== userPasswordConfirm) {
      toast.error('Le password non coincidono');
      return;
    }

    const data: any = {
      name: userName,
      email: userEmail,
      roles: userRoles,
      is_active: userActive,
    };

    if (userPassword) {
      data.password = userPassword;
      data.password_confirmation = userPasswordConfirm;
    }

    if (editingUser) {
      updateUserMutation.mutate({ id: editingUser.id, data });
    } else {
      createUserMutation.mutate(data);
    }
  };

  const handleRoleSubmit = () => {
    if (!roleName || !roleDisplayName) {
      toast.error('Nome e nome visualizzato sono obbligatori');
      return;
    }

    const data = {
      name: roleName,
      display_name: roleDisplayName,
      description: roleDescription || undefined,
      permissions: rolePermissions,
    };

    if (editingRole) {
      updateRoleMutation.mutate({ id: editingRole.id, data });
    } else {
      createRoleMutation.mutate(data);
    }
  };

  const togglePermission = (permission: string) => {
    setRolePermissions(prev =>
      prev.includes(permission)
        ? prev.filter(p => p !== permission)
        : [...prev, permission]
    );
  };

  const toggleUserRole = (role: string) => {
    setUserRoles(prev =>
      prev.includes(role)
        ? prev.filter(r => r !== role)
        : [...prev, role]
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Gestione Utenti"
        description="Gestisci utenti, ruoli e permessi del sistema"
        icon={Users}
      />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="users">Utenti</TabsTrigger>
          <TabsTrigger value="roles">Ruoli & Permessi</TabsTrigger>
        </TabsList>

        {/* Users Tab */}
        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Utenti del Sistema
                  </CardTitle>
                  <CardDescription>Gestisci gli utenti e i loro ruoli</CardDescription>
                </div>
                <Dialog open={isUserDialogOpen} onOpenChange={setIsUserDialogOpen}>
                  <Button onClick={() => resetUserForm()}>
                    <Plus className="mr-2 h-4 w-4" />
                    Nuovo Utente
                  </Button>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>{editingUser ? 'Modifica Utente' : 'Nuovo Utente'}</DialogTitle>
                      <DialogDescription>
                        {editingUser ? 'Modifica le informazioni dell\'utente' : 'Crea un nuovo utente nel sistema'}
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Nome *</Label>
                          <Input value={userName} onChange={(e) => setUserName(e.target.value)} placeholder="Mario Rossi" />
                        </div>
                        <div className="space-y-2">
                          <Label>Email *</Label>
                          <Input value={userEmail} onChange={(e) => setUserEmail(e.target.value)} placeholder="mario@example.com" type="email" />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Password {!editingUser && '*'}</Label>
                          <Input value={userPassword} onChange={(e) => setUserPassword(e.target.value)} type="password" placeholder={editingUser ? "Lascia vuoto per non modificare" : ""} />
                        </div>
                        <div className="space-y-2">
                          <Label>Conferma Password</Label>
                          <Input value={userPasswordConfirm} onChange={(e) => setUserPasswordConfirm(e.target.value)} type="password" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Ruoli</Label>
                        <div className="border border-slate-200 dark:border-slate-800 rounded-md p-4 space-y-2">
                          {rolesList?.map((role: Role) => (
                            <div key={role.id} className="flex items-center space-x-2">
                              <Checkbox
                                id={`role-${role.id}`}
                                checked={userRoles.includes(role.name)}
                                onCheckedChange={() => toggleUserRole(role.name)}
                              />
                              <Label htmlFor={`role-${role.id}`} className="cursor-pointer flex-1">
                                <span className="font-medium">{role.display_name}</span>
                                {role.description && <span className="text-sm text-slate-500 dark:text-slate-400 ml-2">- {role.description}</span>}
                              </Label>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch checked={userActive} onCheckedChange={setUserActive} id="user-active" />
                        <Label htmlFor="user-active" className="cursor-pointer">Utente Attivo</Label>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsUserDialogOpen(false)}>Annulla</Button>
                      <Button onClick={handleUserSubmit} disabled={createUserMutation.isPending || updateUserMutation.isPending}>
                        {createUserMutation.isPending || updateUserMutation.isPending ? 'Salvataggio...' : editingUser ? 'Aggiorna' : 'Crea'}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {isLoadingUsers ? (
                <div className="text-center py-8 text-slate-600 dark:text-slate-400">Caricamento utenti...</div>
              ) : (
                <DataTableWrapper>
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
                        <TableHead className="font-semibold text-slate-900 dark:text-slate-100">Nome</TableHead>
                        <TableHead className="font-semibold text-slate-900 dark:text-slate-100">Email</TableHead>
                        <TableHead className="font-semibold text-slate-900 dark:text-slate-100">Ruoli</TableHead>
                        <TableHead className="font-semibold text-slate-900 dark:text-slate-100">Stato</TableHead>
                        <TableHead className="text-right font-semibold text-slate-900 dark:text-slate-100">Azioni</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.map((user: any) => (
                        <DataTableRow key={user.id}>
                          <TableCell className="font-medium text-slate-900 dark:text-slate-100">{user.name}</TableCell>
                          <TableCell className="text-slate-700 dark:text-slate-300">{user.email}</TableCell>
                          <TableCell>
                            <div className="flex gap-1 flex-wrap">
                              {user.roles?.map((role: string) => (
                                <Badge key={role} variant="outline" className="text-xs">{role}</Badge>
                              ))}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={user.is_active ? 'bg-green-100 dark:bg-green-950/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'}>
                              {user.is_active ? 'Attivo' : 'Inattivo'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Button variant="ghost" size="icon" onClick={() => {
                                setEditingUser(user);
                                setUserName(user.name);
                                setUserEmail(user.email);
                                setUserRoles(user.roles || []);
                                setUserActive(user.is_active);
                                setUserPassword('');
                                setUserPasswordConfirm('');
                                setIsUserDialogOpen(true);
                              }}>
                                <Edit2 className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => {
                                if (confirm('Sei sicuro di voler eliminare questo utente?')) {
                                  deleteUserMutation.mutate(user.id);
                                }
                              }}>
                                <Trash2 className="h-4 w-4 text-red-600 dark:text-red-400" />
                              </Button>
                            </div>
                          </TableCell>
                        </DataTableRow>
                      ))}
                    </TableBody>
                  </Table>
                </DataTableWrapper>
              )}
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
                    <Shield className="h-5 w-5" />
                    Ruoli e Permessi
                  </CardTitle>
                  <CardDescription>Gestisci i ruoli utente e i relativi permessi</CardDescription>
                </div>
                <Dialog open={isRoleDialogOpen} onOpenChange={setIsRoleDialogOpen}>
                  <Button onClick={() => resetRoleForm()}>
                    <Plus className="mr-2 h-4 w-4" />
                    Nuovo Ruolo
                  </Button>
                  <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>{editingRole ? 'Modifica Ruolo' : 'Nuovo Ruolo'}</DialogTitle>
                      <DialogDescription>
                        {editingRole ? 'Modifica le informazioni del ruolo e i permessi associati' : 'Crea un nuovo ruolo e assegna i permessi'}
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Nome Tecnico *</Label>
                          <Input
                            value={roleName}
                            onChange={(e) => setRoleName(e.target.value)}
                            placeholder="admin"
                            disabled={!!editingRole}
                          />
                          <p className="text-xs text-slate-500 dark:text-slate-400">Nome univoco in minuscolo (es: admin, manager)</p>
                        </div>
                        <div className="space-y-2">
                          <Label>Nome Visualizzato *</Label>
                          <Input
                            value={roleDisplayName}
                            onChange={(e) => setRoleDisplayName(e.target.value)}
                            placeholder="Amministratore"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Descrizione</Label>
                        <Input
                          value={roleDescription}
                          onChange={(e) => setRoleDescription(e.target.value)}
                          placeholder="Descrivi le responsabilità di questo ruolo"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Permessi</Label>
                        <div className="border border-slate-200 dark:border-slate-800 rounded-md p-4 space-y-4 max-h-[400px] overflow-y-auto">
                          {permissionsGrouped && Object.entries(permissionsGrouped).map(([group, permissions]: [string, any]) => (
                            <div key={group} className="space-y-2">
                              <h4 className="font-semibold text-sm text-slate-900 dark:text-slate-100 capitalize">{group}</h4>
                              <div className="grid grid-cols-2 gap-2 ml-4">
                                {permissions.map((permission: Permission) => (
                                  <div key={permission.name} className="flex items-center space-x-2">
                                    <Checkbox
                                      id={`perm-${permission.name}`}
                                      checked={rolePermissions.includes(permission.name)}
                                      onCheckedChange={() => togglePermission(permission.name)}
                                    />
                                    <Label htmlFor={`perm-${permission.name}`} className="cursor-pointer text-sm">
                                      {permission.display_name}
                                    </Label>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsRoleDialogOpen(false)}>Annulla</Button>
                      <Button onClick={handleRoleSubmit} disabled={createRoleMutation.isPending || updateRoleMutation.isPending}>
                        {createRoleMutation.isPending || updateRoleMutation.isPending ? 'Salvataggio...' : editingRole ? 'Aggiorna' : 'Crea'}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {isLoadingRoles ? (
                <div className="text-center py-8 text-slate-600 dark:text-slate-400">Caricamento ruoli...</div>
              ) : (
                <DataTableWrapper>
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
                        <TableHead className="font-semibold text-slate-900 dark:text-slate-100">Ruolo</TableHead>
                        <TableHead className="font-semibold text-slate-900 dark:text-slate-100">Descrizione</TableHead>
                        <TableHead className="font-semibold text-slate-900 dark:text-slate-100">Permessi</TableHead>
                        <TableHead className="font-semibold text-slate-900 dark:text-slate-100">Utenti</TableHead>
                        <TableHead className="text-right font-semibold text-slate-900 dark:text-slate-100">Azioni</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rolesList?.map((role: Role) => (
                        <DataTableRow key={role.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Shield className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                              <div>
                                <p className="font-medium text-slate-900 dark:text-slate-100">{role.display_name}</p>
                                <p className="text-xs text-slate-500 dark:text-slate-400">{role.name}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-slate-700 dark:text-slate-300">{role.description || '-'}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{role.permissions?.length || 0} permessi</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{role.users_count || 0} utenti</Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Button variant="ghost" size="icon" onClick={() => {
                                setEditingRole(role);
                                setRoleName(role.name);
                                setRoleDisplayName(role.display_name);
                                setRoleDescription(role.description || '');
                                setRolePermissions(role.permissions || []);
                                setIsRoleDialogOpen(true);
                              }}>
                                <Edit2 className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => {
                                if (confirm(`Sei sicuro di voler eliminare il ruolo "${role.display_name}"?`)) {
                                  deleteRoleMutation.mutate(role.id);
                                }
                              }}>
                                <Trash2 className="h-4 w-4 text-red-600 dark:text-red-400" />
                              </Button>
                            </div>
                          </TableCell>
                        </DataTableRow>
                      ))}
                    </TableBody>
                  </Table>
                </DataTableWrapper>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

