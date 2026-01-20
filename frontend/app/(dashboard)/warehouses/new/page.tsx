'use client';

import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { warehousesApi } from '@/lib/api/warehouses';
import { WarehouseForm } from '@/components/warehouse-form';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

export default function NewWarehousePage() {
  const router = useRouter();

  const createMutation = useMutation({
    mutationFn: (data: any) => warehousesApi.create(data),
    onSuccess: (data) => {
      toast.success('Magazzino creato', {
        description: 'Il magazzino è stato creato con successo',
      });
      router.push(`/warehouses/${data.id}`);
    },
    onError: (error: any) => {
      toast.error('Errore', {
        description: error.response?.data?.message || 'Impossibile creare il magazzino',
      });
    },
  });

  const handleSubmit = (data: any) => {
    createMutation.mutate(data);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/frontend/app/(dashboard)/warehouses">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Nuovo Magazzino</h1>
          <p className="text-slate-600 mt-1">Crea un nuovo magazzino nel sistema</p>
        </div>
      </div>

      {/* Form */}
      <WarehouseForm onSubmit={handleSubmit} isLoading={createMutation.isPending} />
    </div>
  );
}
