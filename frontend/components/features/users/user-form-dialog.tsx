'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Role } from '@/lib/api/users';
import { AlertCircle } from 'lucide-react';

interface UserFormDialogProps {
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

export function UserFormDialog({
  open,
  onOpenChange,
  user,
  roles,
  onSubmit,
  isLoading,
}: UserFormDialogProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [isActive, setIsActive] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Reset form when dialog opens/closes or user changes
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>
            {user ? 'Modifica Utente' : 'Nuovo Utente'}
          </DialogTitle>
          <DialogDescription>
            {user
              ? 'Modifica le informazioni dell\'utente e i ruoli assegnati'
              : 'Crea un nuovo utente e assegna i ruoli necessari'}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-6 py-4">
            {/* Basic Info Section */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Informazioni Base</h3>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="user-name">
                    Nome Completo <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="user-name"
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
                    type="email"
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
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Password {!user && <span className="text-red-500">*</span>}
              </h3>

              {user && (
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Lascia vuoto per non modificare la password
                </p>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="user-password">
                    {user ? 'Nuova Password' : 'Password'}
                  </Label>
                  <Input
                    id="user-password"
                    type="password"
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
                    type="password"
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
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Ruoli</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Seleziona uno o più ruoli da assegnare all'utente
              </p>

              <div className="border border-slate-200 dark:border-slate-800 rounded-lg p-4 space-y-3">
                {roles && roles.length > 0 ? (
                  roles.map((role) => (
                    <div
                      key={role.id}
                      className="flex items-start space-x-3 p-2 rounded hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors"
                    >
                      <Checkbox
                        id={`role-${role.id}`}
                        checked={selectedRoles.includes(role.name)}
                        onCheckedChange={() => toggleRole(role.name)}
                      />
                      <div className="flex-1">
                        <Label
                          htmlFor={`role-${role.id}`}
                          className="cursor-pointer font-medium text-sm"
                        >
                          {role.display_name}
                        </Label>
                        {role.description && (
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            {role.description}
                          </p>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-4">
                    Nessun ruolo disponibile
                  </p>
                )}
              </div>
            </div>

            <Separator />

            {/* Status Section */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Stato</h3>

              <div className="flex items-center justify-between p-3 border border-slate-200 dark:border-slate-800 rounded-lg">
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
            disabled={isLoading}
          >
            {isLoading ? 'Salvataggio...' : user ? 'Aggiorna Utente' : 'Crea Utente'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
