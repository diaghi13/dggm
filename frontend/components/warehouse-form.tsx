'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { apiClient } from '@/lib/api/client';

interface WarehouseFormProps {
  initialData?: any;
  onSubmit: (data: any) => void;
  isLoading?: boolean;
}

export function WarehouseForm({ initialData, onSubmit, isLoading }: WarehouseFormProps) {
  const [formData, setFormData] = useState({
    code: initialData?.code || '',
    name: initialData?.name || '',
    type: initialData?.type || 'central',
    address: initialData?.address || '',
    city: initialData?.city || '',
    manager_id: initialData?.manager_id?.toString() || '',
    is_active: initialData?.is_active ?? true,
  });

  // Fetch users for manager selection
  const { data: usersData } = useQuery({
    queryKey: ['users', { per_page: 100 }],
    queryFn: async () => {
      const response = await apiClient.get('/users', { params: { per_page: 100 } });
      return response.data;
    },
  });

  const users = usersData?.data ?? [];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      manager_id: formData.manager_id ? parseInt(formData.manager_id) : null,
    });
  };

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Informazioni Generali */}
      <Card>
        <CardHeader>
          <CardTitle>Informazioni Generali</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="code">
                Codice Magazzino <span className="text-red-500">*</span>
              </Label>
              <Input
                id="code"
                value={formData.code}
                onChange={(e) => handleChange('code', e.target.value)}
                placeholder="WH-001"
                required
                disabled={!!initialData}
              />
              {initialData && (
                <p className="text-xs text-slate-500">Il codice non può essere modificato</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">
                Nome Magazzino <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                placeholder="Magazzino Centrale Roma"
                required
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="type">
                Tipo Magazzino <span className="text-red-500">*</span>
              </Label>
              <Select value={formData.type} onValueChange={(value) => handleChange('type', value)}>
                <SelectTrigger id="type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="central">Centrale</SelectItem>
                  <SelectItem value="site_storage">Deposito Cantiere</SelectItem>
                  <SelectItem value="mobile_truck">Mobile (Camion)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="manager_id">Responsabile</Label>
              <Select
                value={formData.manager_id || 'none'}
                onValueChange={(value) => handleChange('manager_id', value === 'none' ? '' : value)}
              >
                <SelectTrigger id="manager_id">
                  <SelectValue placeholder="Seleziona responsabile" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nessuno</SelectItem>
                  {users.map((user: any) => (
                    <SelectItem key={user.id} value={user.id.toString()}>
                      {user.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is_active"
              checked={formData.is_active}
              onChange={(e) => handleChange('is_active', e.target.checked)}
              className="w-4 h-4 rounded border-slate-300"
            />
            <Label htmlFor="is_active" className="cursor-pointer">
              Magazzino attivo
            </Label>
          </div>
        </CardContent>
      </Card>

      {/* Indirizzo e Ubicazione */}
      <Card>
        <CardHeader>
          <CardTitle>Indirizzo e Ubicazione</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="address">Indirizzo Completo</Label>
            <Input
              id="address"
              value={formData.address}
              onChange={(e) => handleChange('address', e.target.value)}
              placeholder="Via Roma 123"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="city">Città</Label>
            <Input
              id="city"
              value={formData.city}
              onChange={(e) => handleChange('city', e.target.value)}
              placeholder="Roma"
            />
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex items-center gap-3">
        <Button type="submit" disabled={isLoading} className="min-w-[120px]">
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {initialData ? 'Aggiorna Magazzino' : 'Crea Magazzino'}
        </Button>
      </div>
    </form>
  );
}
