'use client';

import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { productsApi } from '@/lib/api/products';
import { ProductForm } from '@/app/(dashboard)/products/_components/product-form';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
import type { ProductFormData } from '@/lib/types';

export default function NewProductPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: (data: ProductFormData) => productsApi.create(data),
    onSuccess: (product) => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Prodotto creato', {
        description: `Il prodotto "${product.name}" è stato creato con successo`,
      });
      router.push(`/products/${product.id}`);
    },
    onError: (error: Error) => {
      toast.error('Errore', {
        description: (error as any).response?.data?.message || 'Impossibile creare il prodotto',
      });
    },
  });

  const handleSubmit = (data: ProductFormData) => {
    createMutation.mutate(data);
  };

  const handleCancel = () => {
    router.push('/products');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/products">
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">Nuovo Prodotto</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">Aggiungi un nuovo prodotto al catalogo</p>
        </div>
      </div>

      {/* Form */}
      <ProductForm
        mode="create"
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        isSubmitting={createMutation.isPending}
      />
    </div>
  );
}
