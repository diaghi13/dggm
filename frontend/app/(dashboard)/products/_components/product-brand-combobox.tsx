"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { productsApi } from "@/lib/api/products";
import { ComboboxSelect } from "@/components/combobox-select";
import { toast } from "sonner";
import type { ProductBrand } from "@/lib/types";

interface ProductBrandComboboxProps {
  value?: number | null;
  onValueChange: (value: number | null) => void;
  className?: string;
  required?: boolean;
}

export function ProductBrandCombobox({
  value,
  onValueChange,
  className,
  required = false,
}: ProductBrandComboboxProps) {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");

  const { data: brandsData, isLoading } = useQuery({
    queryKey: ["product-brands", { search, is_active: true }],
    queryFn: () => productsApi.getBrands(),
  });

  const brands: ProductBrand[] = brandsData ?? [];

  const createMutation = useMutation({
    mutationFn: (name: string) =>
      productsApi.createBrand({
        name,
        code: name.toLowerCase().replace(/\s+/g, "_"),
      }),
    onSuccess: (newBrand) => {
      queryClient.invalidateQueries({ queryKey: ["product-brands"] });
      onValueChange(newBrand.id!);
      toast.success("Brand creato", {
        description: `Il brand "${newBrand.name}" è stato creato con successo`,
      });
    },
    onError: (error: Error) => {
      toast.error("Errore", {
        description:
          (error as Error & { response?: { data?: { message?: string } } })
            .response?.data?.message || "Impossibile creare il brand",
      });
    },
  });

  // Filter brands by search
  const filteredBrands = search
    ? brands.filter((brand) =>
        brand.name.toLowerCase().includes(search.toLowerCase()),
      )
    : brands;

  const options = filteredBrands.map((brand) => ({
    value: brand.id!.toString(),
    label: brand.name,
  }));

  // Check if search matches any existing brand
  const exactMatch = brands.find(
    (brand) => brand.name.toLowerCase() === search.toLowerCase(),
  );

  // Add "Create new" option if search doesn't match and has text
  if (search && !exactMatch && search.length >= 2) {
    options.unshift({
      value: "__create__",
      label: `✨ Crea "${search}"`,
    });
  }

  const handleValueChange = (newValue: string | undefined) => {
    if (!newValue) {
      onValueChange(null);
      return;
    }

    if (newValue === "__create__") {
      // Create new brand
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
      placeholder={
        required ? "Seleziona o crea brand *" : "Seleziona o crea brand"
      }
      emptyText="Nessun brand trovato. Digita per crearne uno nuovo."
      loading={isLoading || createMutation.isPending}
      className={className}
    />
  );
}
