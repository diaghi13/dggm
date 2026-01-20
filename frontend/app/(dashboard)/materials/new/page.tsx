'use client';

import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { materialsApi } from '@/lib/api/materials';
import { MaterialForm } from '@/app/(dashboard)/materials/_components/material-form';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

export default function NewMaterialPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: (data: any) => materialsApi.create(data),
    onSuccess: (material) => {
      queryClient.invalidateQueries({ queryKey: ['materials'] });
      toast.success('Materiale creato', {
        description: `Il materiale "${material.name}" è stato creato con successo`,
      });
      router.push(`/materials/${material.id}`);
    },
    onError: (error: any) => {
      toast.error('Errore', {
        description: error.response?.data?.message || 'Impossibile creare il materiale',
      });
    },
  });

  const handleSubmit = (data: any) => {
    createMutation.mutate(data);
  };

  const handleCancel = () => {
    router.push('/materials');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/frontend/app/(dashboard)/materials">
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Nuovo Materiale</h1>
          <p className="text-slate-600 mt-1">Aggiungi un nuovo materiale al catalogo</p>
        </div>
      </div>

      {/* Form */}
      <MaterialForm
        mode="create"
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        isSubmitting={createMutation.isPending}
      />
    </div>
  );
}
