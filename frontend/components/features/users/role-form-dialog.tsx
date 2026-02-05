'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Role } from '@/lib/api/users';
import { AlertCircle, Check } from 'lucide-react';

interface RoleFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  role: Role | null;
  permissionsGrouped: Record<string, any[]> | undefined;
  onSubmit: (data: { name: string; display_name: string; description?: string; permissions: string[] }) => void;
  isLoading: boolean;
}

export function RoleFormDialog({
  open,
  onOpenChange,
  role,
  permissionsGrouped,
  onSubmit,
  isLoading,
}: RoleFormDialogProps) {
  const [name, setName] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  // Reset form when dialog opens/closes or role changes
  useEffect(() => {
    if (open) {
      if (role) {
        setName(role.name);
        setDisplayName(role.display_name);
        setDescription(role.description || '');
        setSelectedPermissions(role.permissions || []);
      } else {
        setName('');
        setDisplayName('');
        setDescription('');
        setSelectedPermissions([]);
      }
      // Expand all groups by default
      if (permissionsGrouped) {
        setExpandedGroups(new Set(Object.keys(permissionsGrouped)));
      }
    }
  }, [open, role, permissionsGrouped]);

  const togglePermission = (permissionName: string) => {
    setSelectedPermissions(prev =>
      prev.includes(permissionName)
        ? prev.filter(p => p !== permissionName)
        : [...prev, permissionName]
    );
  };

  const toggleGroup = (groupName: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      if (next.has(groupName)) {
        next.delete(groupName);
      } else {
        next.add(groupName);
      }
      return next;
    });
  };

  const selectAllInGroup = (groupPermissions: any[]) => {
    const groupPermissionNames = groupPermissions.map(p => p.name);
    const allSelected = groupPermissionNames.every(p => selectedPermissions.includes(p));

    if (allSelected) {
      // Deselect all
      setSelectedPermissions(prev => prev.filter(p => !groupPermissionNames.includes(p)));
    } else {
      // Select all
      setSelectedPermissions(prev => {
        const next = new Set([...prev, ...groupPermissionNames]);
        return Array.from(next);
      });
    }
  };

  const handleSubmit = () => {
    onSubmit({
      name,
      display_name: displayName,
      description: description || undefined,
      permissions: selectedPermissions,
    });
  };

  const isFormValid = () => {
    return name.trim() && displayName.trim();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {role ? 'Modifica Ruolo' : 'Nuovo Ruolo'}
          </DialogTitle>
          <DialogDescription>
            {role
              ? 'Modifica le informazioni del ruolo e i permessi associati'
              : 'Crea un nuovo ruolo e assegna i permessi necessari'}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-6 py-4">
            {/* Basic Info Section */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Informazioni Base</h3>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="role-name">
                    Nome Tecnico <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="role-name"
                    value={name}
                    onChange={(e) => setName(e.target.value.toLowerCase().replace(/\s+/g, '-'))}
                    placeholder="es: project-manager"
                    disabled={!!role}
                    className="font-mono text-sm"
                  />
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {role ? 'Il nome tecnico non può essere modificato' : 'Usa solo lettere minuscole, numeri e trattini'}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="role-display-name">
                    Nome Visualizzato <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="role-display-name"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="es: Project Manager"
                  />
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Nome leggibile mostrato agli utenti
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="role-description">Descrizione</Label>
                <Textarea
                  id="role-description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Descrivi le responsabilità e i compiti di questo ruolo"
                  rows={3}
                  className="resize-none"
                />
              </div>
            </div>

            <Separator />

            {/* Permissions Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    Permessi
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Seleziona i permessi da assegnare a questo ruolo
                  </p>
                </div>
                <Badge variant="secondary" className="text-xs">
                  {selectedPermissions.length} selezionati
                </Badge>
              </div>

              {!permissionsGrouped ? (
                <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                  Caricamento permessi...
                </div>
              ) : Object.keys(permissionsGrouped).length === 0 ? (
                <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/20 p-3 rounded-md">
                  <AlertCircle className="h-4 w-4" />
                  <span className="text-sm">Nessun permesso disponibile nel sistema</span>
                </div>
              ) : (
                <div className="border border-slate-200 dark:border-slate-800 rounded-lg divide-y divide-slate-200 dark:divide-slate-800">
                  {Object.entries(permissionsGrouped).map(([groupName, permissions]) => {
                    const isExpanded = expandedGroups.has(groupName);
                    const groupPermissionNames = permissions.map(p => p.name);
                    const selectedCount = groupPermissionNames.filter(p => selectedPermissions.includes(p)).length;
                    const totalCount = groupPermissionNames.length;
                    const allSelected = selectedCount === totalCount;

                    return (
                      <div key={groupName} className="bg-white dark:bg-slate-900">
                        <div
                          className="flex items-center justify-between p-3 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                          onClick={() => toggleGroup(groupName)}
                        >
                          <div className="flex items-center gap-3 flex-1">
                            <div className={`w-4 h-4 flex items-center justify-center rounded border transition-all ${
                              allSelected
                                ? 'bg-blue-500 border-blue-500'
                                : selectedCount > 0
                                ? 'bg-blue-100 dark:bg-blue-950 border-blue-400 dark:border-blue-600'
                                : 'border-slate-300 dark:border-slate-600'
                            }`}>
                              {allSelected && <Check className="h-3 w-3 text-white" />}
                              {selectedCount > 0 && !allSelected && (
                                <div className="h-2 w-2 bg-blue-500 rounded-sm" />
                              )}
                            </div>
                            <h4 className="font-semibold text-sm text-slate-900 dark:text-slate-100 capitalize">
                              {groupName.replace(/-/g, ' ')}
                            </h4>
                            <Badge variant="outline" className="text-xs">
                              {selectedCount}/{totalCount}
                            </Badge>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs"
                            onClick={(e) => {
                              e.stopPropagation();
                              selectAllInGroup(permissions);
                            }}
                          >
                            {allSelected ? 'Deseleziona' : 'Seleziona'} tutti
                          </Button>
                        </div>

                        {isExpanded && (
                          <div className="p-3 pt-0">
                            <div className="grid grid-cols-2 gap-2 mt-2">
                              {permissions.map((permission: any) => (
                                <div
                                  key={permission.name}
                                  className="flex items-start space-x-2 p-2 rounded hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors"
                                >
                                  <Checkbox
                                    id={`perm-${permission.name}`}
                                    checked={selectedPermissions.includes(permission.name)}
                                    onCheckedChange={() => togglePermission(permission.name)}
                                  />
                                  <div className="flex-1">
                                    <Label
                                      htmlFor={`perm-${permission.name}`}
                                      className="cursor-pointer text-sm font-normal leading-tight"
                                    >
                                      {permission.action}
                                    </Label>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                                      {permission.name}
                                    </p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </ScrollArea>

        <DialogFooter className="flex items-center gap-2 pt-4 border-t border-slate-200 dark:border-slate-800">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Annulla
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!isFormValid() || isLoading}
          >
            {isLoading ? 'Salvataggio...' : role ? 'Aggiorna Ruolo' : 'Crea Ruolo'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
