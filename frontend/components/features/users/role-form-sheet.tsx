'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Role } from '@/lib/api/users';
import {
  AlertCircle,
  Check,
  ChevronDown,
  ChevronRight,
  Shield,
  X,
  CheckSquare,
  Square
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface RoleFormSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  role: Role | null;
  permissionsGrouped: Record<string, any[]> | undefined;
  onSubmit: (data: { name: string; display_name: string; description?: string; permissions: string[] }) => void;
  isLoading: boolean;
}

export function RoleFormSheet({
  open,
  onOpenChange,
  role,
  permissionsGrouped,
  onSubmit,
  isLoading,
}: RoleFormSheetProps) {
  const [name, setName] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Reset form when sheet opens/closes or role changes
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
      setErrors({});
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

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!name.trim()) {
      newErrors.name = 'Il nome è obbligatorio';
    }

    if (!displayName.trim()) {
      newErrors.displayName = 'Il nome visualizzato è obbligatorio';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;

    onSubmit({
      name,
      display_name: displayName,
      description: description || undefined,
      permissions: selectedPermissions,
    });
  };

  const isGroupFullySelected = (groupPermissions: any[]) => {
    const groupPermissionNames = groupPermissions.map(p => p.name);
    return groupPermissionNames.every(p => selectedPermissions.includes(p));
  };

  const isGroupPartiallySelected = (groupPermissions: any[]) => {
    const groupPermissionNames = groupPermissions.map(p => p.name);
    const selectedCount = groupPermissionNames.filter(p => selectedPermissions.includes(p)).length;
    return selectedCount > 0 && selectedCount < groupPermissionNames.length;
  };

  const getGroupIcon = (groupName: string) => {
    const icons: Record<string, any> = {
      customers: '👤',
      suppliers: '🏢',
      sites: '🏗️',
      quotes: '📋',
      warehouse: '📦',
      products: '🔧',
      inventory: '📊',
      invoices: '💰',
      users: '👥',
      roles: '🛡️',
      permissions: '🔐',
      reports: '📈',
      settings: '⚙️',
    };
    return icons[groupName] || '📁';
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-2xl overflow-hidden flex flex-col p-0">
        <SheetHeader className="px-6 py-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-slate-900 dark:bg-slate-700 flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <SheetTitle className="text-xl">
                {role ? 'Modifica Ruolo' : 'Nuovo Ruolo'}
              </SheetTitle>
              <SheetDescription>
                {role
                  ? 'Modifica le informazioni del ruolo e i permessi assegnati'
                  : 'Crea un nuovo ruolo e assegna i permessi necessari'
                }
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6">
          <div className="space-y-6 py-6">
            {/* Basic Info */}
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-3">
                  Informazioni Base
                </h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="role-name">
                      Nome Tecnico <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="role-name"
                      value={name}
                      onChange={(e) => {
                        setName(e.target.value);
                        if (errors.name) setErrors(prev => ({ ...prev, name: '' }));
                      }}
                      placeholder="es: project-manager"
                      className={errors.name ? 'border-red-500' : ''}
                      disabled={!!role} // Nome immutabile in modifica
                    />
                    {role && (
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Il nome tecnico non può essere modificato
                      </p>
                    )}
                    {errors.name && (
                      <p className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {errors.name}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="role-display-name">
                      Nome Visualizzato <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="role-display-name"
                      value={displayName}
                      onChange={(e) => {
                        setDisplayName(e.target.value);
                        if (errors.displayName) setErrors(prev => ({ ...prev, displayName: '' }));
                      }}
                      placeholder="es: Project Manager"
                      className={errors.displayName ? 'border-red-500' : ''}
                    />
                    {errors.displayName && (
                      <p className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {errors.displayName}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="role-description">Descrizione</Label>
                    <Textarea
                      id="role-description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Descrizione del ruolo e delle sue responsabilità..."
                      rows={3}
                    />
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            {/* Permissions */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    Permessi
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Seleziona i permessi da assegnare al ruolo
                  </p>
                </div>
                <Badge variant="secondary" className="text-xs">
                  {selectedPermissions.length} selezionati
                </Badge>
              </div>

              {permissionsGrouped && Object.keys(permissionsGrouped).length > 0 ? (
                <div className="space-y-2">
                  {Object.entries(permissionsGrouped).map(([groupName, groupPermissions]) => {
                    const isExpanded = expandedGroups.has(groupName);
                    const isFullySelected = isGroupFullySelected(groupPermissions);
                    const isPartiallySelected = isGroupPartiallySelected(groupPermissions);

                    return (
                      <div
                        key={groupName}
                        className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden"
                      >
                        {/* Group Header */}
                        <button
                          onClick={() => toggleGroup(groupName)}
                          className="w-full px-4 py-3 flex items-center gap-3 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        >
                          <span className="text-lg">{getGroupIcon(groupName)}</span>
                          <div className="flex-1 text-left">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm text-slate-900 dark:text-slate-100 capitalize">
                                {groupName.replace(/-/g, ' ')}
                              </span>
                              <Badge variant="outline" className="text-xs">
                                {groupPermissions.length}
                              </Badge>
                            </div>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                              {groupPermissions.filter(p => selectedPermissions.includes(p.name)).length} / {groupPermissions.length} selezionati
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                selectAllInGroup(groupPermissions);
                              }}
                              className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded transition-colors"
                              title={isFullySelected ? 'Deseleziona tutti' : 'Seleziona tutti'}
                            >
                              {isFullySelected ? (
                                <CheckSquare className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                              ) : isPartiallySelected ? (
                                <Square className="w-4 h-4 text-blue-400 dark:text-blue-500 fill-blue-100 dark:fill-blue-900" />
                              ) : (
                                <Square className="w-4 h-4 text-slate-400" />
                              )}
                            </button>
                            {isExpanded ? (
                              <ChevronDown className="w-4 h-4 text-slate-500" />
                            ) : (
                              <ChevronRight className="w-4 h-4 text-slate-500" />
                            )}
                          </div>
                        </button>

                        {/* Group Permissions */}
                        {isExpanded && (
                          <div className="p-3 space-y-2 bg-white dark:bg-slate-900">
                            {groupPermissions.map((permission) => (
                              <div
                                key={permission.name}
                                className={cn(
                                  "flex items-start gap-3 p-2 rounded-md transition-colors",
                                  selectedPermissions.includes(permission.name)
                                    ? "bg-blue-50 dark:bg-blue-950/20"
                                    : "hover:bg-slate-50 dark:hover:bg-slate-800/30"
                                )}
                              >
                                <Checkbox
                                  id={`permission-${permission.id}`}
                                  checked={selectedPermissions.includes(permission.name)}
                                  onCheckedChange={() => togglePermission(permission.name)}
                                  className="mt-0.5"
                                />
                                <Label
                                  htmlFor={`permission-${permission.id}`}
                                  className="flex-1 cursor-pointer"
                                >
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                                      {permission.action}
                                    </span>
                                    {selectedPermissions.includes(permission.name) && (
                                      <Check className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                                    )}
                                  </div>
                                  <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                                    {permission.name}
                                  </p>
                                </Label>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                  <Shield className="w-12 h-12 mx-auto mb-3 text-slate-300 dark:text-slate-600" />
                  <p className="text-sm">Nessun permesso disponibile</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
          <div className="flex items-center justify-between gap-3">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              <X className="w-4 h-4 mr-2" />
              Annulla
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Salvataggio...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  {role ? 'Aggiorna Ruolo' : 'Crea Ruolo'}
                </>
              )}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
