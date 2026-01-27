'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productsApi } from '@/lib/api/products';
import { ComboboxSelect } from '@/components/combobox-select';
import { toast } from 'sonner';
import type { ProductCategory } from '@/lib/types';

interface ProductCategoryComboboxProps {
  value?: number | null;
  onValueChange: (value: number | null) => void;
  className?: string;
  required?: boolean;
}

export function ProductCategoryCombobox({
  value,
  onValueChange,
  className,
  required = false,
}: ProductCategoryComboboxProps) {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');

  const { data: categoriesData, isLoading } = useQuery({
    queryKey: ['product-categories', { search, is_active: true }],
    queryFn: () => productsApi.getCategories(),
  });

  const categories: ProductCategory[] = categoriesData ?? [];

  const createMutation = useMutation({
    mutationFn: (name: string) =>
      productsApi.createCategory({
        name,
        code: name.toLowerCase().replace(/\s+/g, '_'),
        sort_order: categories.length + 1,
      }),
    onSuccess: (newCategory) => {
      queryClient.invalidateQueries({ queryKey: ['product-categories'] });
      onValueChange(newCategory.id!);
      toast.success('Categoria creata', {
        description: `La categoria "${newCategory.name}" è stata creata con successo`,
      });
    },
    onError: (error: Error) => {
      toast.error('Errore', {
        description: (error as Error & { response?: { data?: { message?: string } } }).response?.data?.message || 'Impossibile creare la categoria',
      });
    },
  });

  // Filter categories by search
  const filteredCategories = search
    ? categories.filter((cat) =>
        cat.name.toLowerCase().includes(search.toLowerCase())
      )
    : categories;

  const options = filteredCategories.map((cat) => ({
    value: cat.id!.toString(),
    label: cat.name,
  }));

  // Check if search matches any existing category
  const exactMatch = categories.find(
    (cat) => cat.name.toLowerCase() === search.toLowerCase()
  );

  // Add "Create new" option if search doesn't match and has text
  if (search && !exactMatch && search.length >= 2) {
    options.unshift({
      value: '__create__',
      label: `✨ Crea "${search}"`,
    });
  }

  const handleValueChange = (newValue: string | undefined) => {
    if (!newValue) {
      onValueChange(null);
      return;
    }

    if (newValue === '__create__') {
      // Create new category
      createMutation.mutate(search);
    } else {
      onValueChange(parseInt(newValue));
    }
  };

  return (
    <ComboboxSelect
      value={value?.toString()}
      onValueChange={handleValueChange}
      onSearchChange={setSearch}
      options={options}
      placeholder={required ? "Seleziona o crea categoria *" : "Seleziona o crea categoria"}
      emptyText="Nessuna categoria trovata. Digita per crearne una nuova."
      loading={isLoading || createMutation.isPending}
      className={className}
    />
  );
}
