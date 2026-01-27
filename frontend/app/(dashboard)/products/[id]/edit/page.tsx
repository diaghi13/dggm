'use client';

import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productsApi } from '@/lib/api/products';
import { ProductForm } from '@/app/(dashboard)/products/_components/product-form';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Save, X } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
import type { ProductFormData } from '@/lib/types';

export default function ProductEditPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const productId = parseInt(params.id as string);

  const { data: product, isLoading } = useQuery({
    queryKey: ['product', productId],
    queryFn: () => productsApi.getById(productId),
    enabled: !!productId,
  });

  const updateMutation = useMutation({
    mutationFn: (data: ProductFormData) => productsApi.update(productId, data),
    onSuccess: (updatedProduct) => {
      queryClient.invalidateQueries({ queryKey: ['product', productId] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Prodotto aggiornato', {
        description: `Il prodotto "${updatedProduct.name}" è stato aggiornato con successo`,
      });
      router.push(`/products/${productId}`);
    },
    onError: (error: Error) => {
      toast.error('Errore', {
        description: (error as any).response?.data?.message || 'Impossibile salvare le modifiche',
      });
    },
  });

  const handleSubmit = (data: ProductFormData) => {
    updateMutation.mutate(data);
  };

  const handleCancel = () => {
    router.push(`/products/${productId}`);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
          <p className="mt-4 text-sm text-slate-600 dark:text-slate-400">Caricamento prodotto...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/products">
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">Prodotto non trovato</h1>
            <p className="text-slate-600 dark:text-slate-400 mt-1">Il prodotto richiesto non esiste</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={`/products/${productId}`}>
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
              Modifica: {product.name}
            </h1>
            <p className="text-slate-600 dark:text-slate-400 mt-1">
              Codice: {product.code}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={updateMutation.isPending}
          >
            <X className="h-4 w-4 mr-2" />
            Annulla
          </Button>
          <Button
            onClick={() => {
              // Trigger form submit
              const submitBtn = document.getElementById('product-form-submit');
              if (submitBtn) submitBtn.click();
            }}
            disabled={updateMutation.isPending}
          >
            <Save className="h-4 w-4 mr-2" />
            {updateMutation.isPending ? 'Salvataggio...' : 'Salva Modifiche'}
          </Button>
        </div>
      </div>

      {/* Form */}
      <ProductForm
        mode="edit"
        initialData={product}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        isSubmitting={updateMutation.isPending}
      />
    </div>
  );
}
