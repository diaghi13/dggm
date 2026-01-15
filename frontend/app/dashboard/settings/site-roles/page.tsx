'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { siteWorkersApi } from '@/lib/api/site-workers';
import apiClient from '@/lib/api/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Plus, Edit2, Trash2, Users, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { SiteRoleBadge } from '@/components/site-role-badge';
import type { SiteRole, ApiResponse } from '@/lib/types';

// API functions for CRUD operations
const siteRolesApi = {
  create: async (data: {
    name: string;
    slug: string;
    description?: string;
    color?: string;
    sort_order?: number;
    is_active?: boolean;
  }): Promise<SiteRole> => {
    const response = await apiClient.post<ApiResponse<SiteRole>>('/site-roles', data);
    return response.data.data;
  },

  update: async (
    id: number,
    data: {
      name?: string;
      description?: string;
      color?: string;
      sort_order?: number;
      is_active?: boolean;
    }
  ): Promise<SiteRole> => {
    const response = await apiClient.patch<ApiResponse<SiteRole>>(`/site-roles/${id}`, data);
    return response.data.data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/site-roles/${id}`);
  },
};

export default function SiteRolesPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<SiteRole | null>(null);
  const [roleName, setRoleName] = useState('');
  const [roleSlug, setRoleSlug] = useState('');
  const [roleDescription, setRoleDescription] = useState('');
  const [roleColor, setRoleColor] = useState('#3B82F6');
  const [roleSortOrder, setRoleSortOrder] = useState('0');
  const [roleActive, setRoleActive] = useState(true);

  // Fetch roles
  const { data: roles = [], isLoading } = useQuery({
    queryKey: ['site-roles'],
    queryFn: () => siteWorkersApi.getRoles(),
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: siteRolesApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['site-roles'] });
      setIsDialogOpen(false);
      resetForm();
      toast.success('Ruolo cantiere creato con successo');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Errore durante la creazione');
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => siteRolesApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['site-roles'] });
      setIsDialogOpen(false);
      resetForm();
      toast.success('Ruolo cantiere aggiornato con successo');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Errore durante l\'aggiornamento');
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: siteRolesApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['site-roles'] });
      toast.success('Ruolo cantiere eliminato');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Errore durante l\'eliminazione');
    },
  });

  const resetForm = () => {
    setEditingRole(null);
    setRoleName('');
    setRoleSlug('');
    setRoleDescription('');
    setRoleColor('#3B82F6');
    setRoleSortOrder('0');
    setRoleActive(true);
  };

  const handleSubmit = () => {
    if (!roleName || !roleSlug) {
      toast.error('Nome e slug sono obbligatori');
      return;
    }

    const data = {
      name: roleName,
      slug: roleSlug,
      description: roleDescription || undefined,
      color: roleColor,
      sort_order: parseInt(roleSortOrder) || 0,
      is_active: roleActive,
    };

    if (editingRole) {
      const { slug, ...updateData } = data;
      updateMutation.mutate({ id: editingRole.id, data: updateData });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (role: SiteRole) => {
    setEditingRole(role);
    setRoleName(role.name);
    setRoleSlug(role.slug);
    setRoleDescription(role.description || '');
    setRoleColor(role.color || '#3B82F6');
    setRoleSortOrder(role.sort_order.toString());
    setRoleActive(role.is_active);
    setIsDialogOpen(true);
  };

  // Auto-generate slug from name
  const handleNameChange = (name: string) => {
    setRoleName(name);
    if (!editingRole) {
      const slug = name
        .toLowerCase()
        .replace(/[àáâãäå]/g, 'a')
        .replace(/[èéêë]/g, 'e')
        .replace(/[ìíîï]/g, 'i')
        .replace(/[òóôõö]/g, 'o')
        .replace(/[ùúûü]/g, 'u')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
      setRoleSlug(slug);
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.push('/dashboard/settings')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Users className="h-7 w-7" />
              Ruoli Cantiere
            </h1>
            <p className="text-slate-600 dark:text-slate-400 mt-1">
              Gestisci i ruoli che i lavoratori possono avere nei cantieri
            </p>
          </div>
        </div>
        <Button onClick={() => setIsDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nuovo Ruolo
        </Button>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Ruoli Disponibili</CardTitle>
          <CardDescription>
            Ruoli che possono essere assegnati ai lavoratori nei cantieri (es: Operaio, Caposquadra,
            Supervisore, Tecnico, Autista)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-12 text-slate-500">Caricamento...</div>
          ) : roles.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>Nessun ruolo cantiere definito</p>
              <p className="text-sm mt-1">Clicca su "Nuovo Ruolo" per iniziare</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Anteprima</TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead>Descrizione</TableHead>
                  <TableHead className="text-center">Ordine</TableHead>
                  <TableHead className="text-center">Stato</TableHead>
                  <TableHead className="text-right">Azioni</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {roles.map((role) => (
                  <TableRow key={role.id}>
                    <TableCell>
                      <SiteRoleBadge role={role} />
                    </TableCell>
                    <TableCell className="font-medium">{role.name}</TableCell>
                    <TableCell className="font-mono text-sm text-slate-600 dark:text-slate-400">
                      {role.slug}
                    </TableCell>
                    <TableCell className="text-sm text-slate-600 dark:text-slate-400">
                      {role.description || '-'}
                    </TableCell>
                    <TableCell className="text-center">{role.sort_order}</TableCell>
                    <TableCell className="text-center">
                      <Badge
                        variant={role.is_active ? 'default' : 'secondary'}
                        className={
                          role.is_active
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                            : ''
                        }
                      >
                        {role.is_active ? 'Attivo' : 'Inattivo'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(role)}>
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            if (
                              confirm(
                                `Sei sicuro di voler eliminare il ruolo "${role.name}"? Questa azione non può essere annullata.`
                              )
                            ) {
                              deleteMutation.mutate(role.id);
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-red-600 dark:text-red-400" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog
        open={isDialogOpen}
        onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingRole ? 'Modifica Ruolo' : 'Nuovo Ruolo Cantiere'}</DialogTitle>
            <DialogDescription>
              {editingRole
                ? 'Modifica le informazioni del ruolo'
                : 'Crea un nuovo ruolo per i lavoratori nei cantieri'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="role-name">Nome *</Label>
              <Input
                id="role-name"
                value={roleName}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="Es: Caposquadra"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="role-slug">
                Slug * {editingRole && <span className="text-xs text-slate-500">(non modificabile)</span>}
              </Label>
              <Input
                id="role-slug"
                value={roleSlug}
                onChange={(e) => setRoleSlug(e.target.value)}
                placeholder="Es: foreman"
                disabled={!!editingRole}
                className="font-mono"
              />
              <p className="text-xs text-slate-500">
                Identificatore univoco (generato automaticamente dal nome)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="role-description">Descrizione</Label>
              <Textarea
                id="role-description"
                value={roleDescription}
                onChange={(e) => setRoleDescription(e.target.value)}
                placeholder="Descrizione del ruolo..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="role-color">Colore</Label>
                <div className="flex gap-2">
                  <Input
                    id="role-color"
                    type="color"
                    value={roleColor}
                    onChange={(e) => setRoleColor(e.target.value)}
                    className="w-16 h-10 cursor-pointer"
                  />
                  <Input
                    type="text"
                    value={roleColor}
                    onChange={(e) => setRoleColor(e.target.value)}
                    placeholder="#3B82F6"
                    className="font-mono text-sm"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="role-sort-order">Ordine</Label>
                <Input
                  id="role-sort-order"
                  type="number"
                  value={roleSortOrder}
                  onChange={(e) => setRoleSortOrder(e.target.value)}
                  placeholder="0"
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="role-active"
                checked={roleActive}
                onCheckedChange={setRoleActive}
              />
              <Label htmlFor="role-active" className="cursor-pointer">
                Ruolo Attivo
              </Label>
            </div>

            {/* Preview */}
            <div className="border-t pt-4">
              <Label className="mb-2 block">Anteprima Badge:</Label>
              <div className="flex gap-2 p-3 bg-slate-50 dark:bg-slate-900 rounded-md">
                <Badge
                  variant="outline"
                  className="border-2"
                  style={{
                    borderColor: roleColor,
                    color: roleColor,
                  }}
                >
                  {roleName || 'Nome Ruolo'}
                </Badge>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsDialogOpen(false);
                resetForm();
              }}
            >
              Annulla
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {createMutation.isPending || updateMutation.isPending
                ? 'Salvataggio...'
                : editingRole
                  ? 'Aggiorna'
                  : 'Crea'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
