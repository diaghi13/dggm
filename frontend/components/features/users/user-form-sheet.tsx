'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Role } from '@/lib/api/users';
import { AlertCircle, User, Check, X, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';

interface UserFormSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: any | null;
  roles: Role[];
  onSubmit: (data: {
    name: string;
    email: string;
    password?: string;
    password_confirmation?: string;
    roles: string[];
    is_active: boolean;
  }) => void;
  isLoading: boolean;
}

export function UserFormSheet({
  open,
  onOpenChange,
  user,
  roles,
  onSubmit,
  isLoading,
}: UserFormSheetProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [isActive, setIsActive] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Reset form when sheet opens/closes or user changes
  useEffect(() => {
    if (open) {
      if (user) {
        setName(user.name);
        setEmail(user.email);
        setPassword('');
        setPasswordConfirmation('');
        setSelectedRoles(user.roles || []);
        setIsActive(user.is_active ?? true);
      } else {
        setName('');
        setEmail('');
        setPassword('');
        setPasswordConfirmation('');
        setSelectedRoles([]);
        setIsActive(true);
      }
      setErrors({});
    }
  }, [open, user]);

  const toggleRole = (roleName: string) => {
    setSelectedRoles(prev =>
      prev.includes(roleName)
        ? prev.filter(r => r !== roleName)
        : [...prev, roleName]
    );
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!name.trim()) {
      newErrors.name = 'Il nome è obbligatorio';
    }

    if (!email.trim()) {
      newErrors.email = 'L\'email è obbligatoria';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Email non valida';
    }

    if (!user && !password) {
      newErrors.password = 'La password è obbligatoria per nuovi utenti';
    }

    if (password && password.length < 8) {
      newErrors.password = 'La password deve essere di almeno 8 caratteri';
    }

    if (password && password !== passwordConfirmation) {
      newErrors.passwordConfirmation = 'Le password non coincidono';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) {
      return;
    }

    const data: any = {
      name,
      email,
      roles: selectedRoles,
      is_active: isActive,
    };

    if (password) {
      data.password = password;
      data.password_confirmation = passwordConfirmation;
    }

    onSubmit(data);
  };

  const getRoleColor = (roleName: string) => {
    const colors: Record<string, string> = {
      'super-admin': 'bg-red-100 dark:bg-red-950/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800',
      'admin': 'bg-purple-100 dark:bg-purple-950/30 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-800',
      'project-manager': 'bg-blue-100 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800',
      'accountant': 'bg-green-100 dark:bg-green-950/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800',
      'warehousekeeper': 'bg-orange-100 dark:bg-orange-950/30 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-800',
    };
    return colors[roleName] || 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700';
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-xl overflow-hidden flex flex-col p-0">
        <SheetHeader className="px-6 py-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-slate-900 dark:bg-slate-700 flex items-center justify-center">
              <User className="w-5 h-5 text-white" />
            </div>
            <div>
              <SheetTitle className="text-xl">
                {user ? 'Modifica Utente' : 'Nuovo Utente'}
              </SheetTitle>
              <SheetDescription>
                {user
                  ? 'Modifica le informazioni dell\'utente e i ruoli assegnati'
                  : 'Crea un nuovo utente e assegna i ruoli necessari'}
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6">
          <div className="space-y-6 py-6">
            {/* Basic Info Section */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Informazioni Base</h3>

              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="user-name">
                    Nome Completo <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="user-name"
                    name="name"
                    autoComplete="name"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      if (errors.name) setErrors(prev => ({ ...prev, name: '' }));
                    }}
                    placeholder="Mario Rossi"
                    className={errors.name ? 'border-red-500' : ''}
                  />
                  {errors.name && (
                    <p className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.name}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="user-email">
                    Email <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="user-email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (errors.email) setErrors(prev => ({ ...prev, email: '' }));
                    }}
                    placeholder="mario@example.com"
                    className={errors.email ? 'border-red-500' : ''}
                  />
                  {errors.email && (
                    <p className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.email}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <Separator />

            {/* Password Section */}
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  Password {!user && <span className="text-red-500">*</span>}
                </h3>
                {user && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Lascia vuoto per non modificare la password
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="user-password">
                    {user ? 'Nuova Password' : 'Password'}
                  </Label>
                  <Input
                    id="user-password"
                    name="password"
                    type="password"
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (errors.password) setErrors(prev => ({ ...prev, password: '' }));
                    }}
                    placeholder={user ? '••••••••' : 'Minimo 8 caratteri'}
                    className={errors.password ? 'border-red-500' : ''}
                  />
                  {errors.password && (
                    <p className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.password}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="user-password-confirm">Conferma Password</Label>
                  <Input
                    id="user-password-confirm"
                    name="password_confirmation"
                    type="password"
                    autoComplete="new-password"
                    value={passwordConfirmation}
                    onChange={(e) => {
                      setPasswordConfirmation(e.target.value);
                      if (errors.passwordConfirmation) setErrors(prev => ({ ...prev, passwordConfirmation: '' }));
                    }}
                    placeholder="Ripeti la password"
                    className={errors.passwordConfirmation ? 'border-red-500' : ''}
                  />
                  {errors.passwordConfirmation && (
                    <p className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.passwordConfirmation}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <Separator />

            {/* Roles Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Ruoli</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Seleziona uno o più ruoli da assegnare all'utente
                  </p>
                </div>
                <Badge variant="secondary" className="text-xs">
                  {selectedRoles.length} selezionati
                </Badge>
              </div>

              <div className="space-y-2">
                {roles && roles.length > 0 ? (
                  roles.map((role) => (
                    <div
                      key={role.id}
                      className={cn(
                        "flex items-start gap-3 p-3 rounded-lg border transition-all",
                        selectedRoles.includes(role.name)
                          ? "bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800"
                          : "border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/30"
                      )}
                    >
                      <Checkbox
                        id={`role-${role.id}`}
                        checked={selectedRoles.includes(role.name)}
                        onCheckedChange={() => toggleRole(role.name)}
                        className="mt-0.5"
                      />
                      <div className="flex-1">
                        <Label
                          htmlFor={`role-${role.id}`}
                          className="cursor-pointer"
                        >
                          <div className="flex items-center gap-2">
                            <Shield className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                            <span className="font-medium text-sm text-slate-900 dark:text-slate-100">
                              {role.display_name}
                            </span>
                            {selectedRoles.includes(role.name) && (
                              <Check className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                            )}
                          </div>
                          {role.description && (
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                              {role.description}
                            </p>
                          )}
                        </Label>
                      </div>
                      <Badge
                        variant="outline"
                        className={cn("text-xs", getRoleColor(role.name))}
                      >
                        {role.permissions_count || 0}
                      </Badge>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-8">
                    Nessun ruolo disponibile
                  </p>
                )}
              </div>
            </div>

            <Separator />

            {/* Status Section */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Stato</h3>

              <div className="flex items-center justify-between p-4 border border-slate-200 dark:border-slate-800 rounded-lg bg-slate-50 dark:bg-slate-800/30">
                <div className="space-y-0.5">
                  <Label htmlFor="user-active" className="cursor-pointer font-medium">
                    Utente Attivo
                  </Label>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Gli utenti inattivi non possono accedere al sistema
                  </p>
                </div>
                <Switch
                  id="user-active"
                  checked={isActive}
                  onCheckedChange={setIsActive}
                />
              </div>
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
                  {user ? 'Aggiorna Utente' : 'Crea Utente'}
                </>
              )}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
