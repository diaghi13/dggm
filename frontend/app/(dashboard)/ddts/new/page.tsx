"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation } from "@tanstack/react-query";
import { ddtsApi } from "@/lib/api/ddts";
import { warehousesApi } from "@/lib/api/warehouses";
import { suppliersApi } from "@/lib/api/suppliers";
import { customersApi } from "@/lib/api/customers";
import { projectsApi } from "@/lib/api/projects";
import { productsApi } from "@/lib/api/products";
import { priceListsApi } from "@/lib/api/price-lists";
import { kitAssembliesApi } from "@/lib/api/kit-assemblies";
import type { DdtType, DdtFormData, ReturnReason, Project, Customer, Supplier } from "@/lib/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowLeft, Trash2, Save, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { ComboboxSelect } from "@/components/combobox-select";

// Component for assembly selector per DDT item
function KitAssemblySelect({
  productId,
  value,
  onChange,
  warehouseId,
}: {
  productId: number;
  value: number | null;
  onChange: (id: number | null) => void;
  warehouseId?: number;
}) {
  const { data: assembliesData, isLoading } = useQuery({
    queryKey: ['kit-assemblies-available', productId, warehouseId],
    queryFn: () => kitAssembliesApi.getAvailable(productId, warehouseId),
  });

  const assemblies = assembliesData?.data ?? [];

  return (
    <Select
      value={value?.toString() ?? 'none'}
      onValueChange={(v) => onChange(v === 'none' ? null : Number(v))}
      disabled={isLoading}
    >
      <SelectTrigger className="min-w-[160px]">
        <SelectValue placeholder="Nessuna assembly" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="none">
          <span className="text-muted-foreground">Nessuna assembly</span>
        </SelectItem>
        {assemblies.map((assembly) => (
          <SelectItem key={assembly.id} value={assembly.id.toString()}>
            <div className="flex items-center gap-2">
              <span>{assembly.name}</span>
              {assembly.warehouse?.name && (
                <span className="text-xs text-muted-foreground">
                  ({assembly.warehouse.name})
                </span>
              )}
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

const ddtTypeLabels: Record<DdtType, string> = {
  incoming: "Carico da Fornitore",
  outgoing: "Scarico a Cliente/Cantiere",
  internal: "Trasferimento Interno",
  rental_out: "Noleggio Uscita",
  rental_return: "Noleggio Rientro",
  return_from_customer: "Reso da Cliente",
  return_to_supplier: "Reso a Fornitore",
};

const returnReasonLabels: Record<ReturnReason, string> = {
  defective: "Difettoso",
  wrong_item: "Articolo Errato",
  excess: "Eccesso",
  warranty: "Garanzia",
  customer_dissatisfaction: "Insoddisfazione Cliente",
  other: "Altro",
};

export default function NewDdtPage() {
  const router = useRouter();

  const [formData, setFormData] = useState<DdtFormData>({
    type: "incoming",
    from_warehouse_id: 0,
    ddt_number: "",
    ddt_date: new Date().toISOString().split("T")[0],
    items: [],
  });

  const [searchMaterial, setSearchMaterial] = useState("");
  const [priceListSearch, setPriceListSearch] = useState("");

  // Fetch next DDT number
  const { data: nextNumberData } = useQuery({
    queryKey: ["ddt-next-number"],
    queryFn: () => ddtsApi.getNextNumber(),
  });

  // Auto-populate DDT number when available
  useEffect(() => {
    if (nextNumberData?.suggested_number && !formData.ddt_number) {
      setFormData((prev) => ({
        ...prev,
        ddt_number: nextNumberData.suggested_number,
      }));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nextNumberData]);

  // Fetch options
  const { data: warehousesData } = useQuery({
    queryKey: ["warehouses", { is_active: true }],
    queryFn: () => warehousesApi.getAll({ is_active: true, per_page: 100 }),
  });

  const { data: suppliersData } = useQuery({
    queryKey: ["suppliers", { is_active: true }],
    queryFn: () => suppliersApi.getAll({ is_active: true, per_page: 100 }),
    enabled: ["incoming", "return_to_supplier"].includes(formData.type),
  });

  const { data: customersData } = useQuery({
    queryKey: ["customers", { is_active: true }],
    queryFn: () => customersApi.getAll({ is_active: true, per_page: 100 }),
    enabled: ["outgoing", "return_from_customer"].includes(formData.type),
  });

  const { data: sitesData } = useQuery({
    queryKey: ["projects", { status: "in_progress" }],
    queryFn: () => projectsApi.getAll({ status: "in_progress", per_page: 100 }),
    enabled: formData.type === "outgoing",
  });

  const { data: rentalProjectsData } = useQuery({
    queryKey: ["projects-rental", { per_page: 100 }],
    queryFn: () => projectsApi.getAll({ per_page: 100 }),
    enabled: formData.type === "rental_out",
  });

  const { data: priceListsData, isLoading: isLoadingPriceLists } = useQuery({
    queryKey: ["price-lists", { is_active: true, search: priceListSearch }],
    queryFn: () => priceListsApi.getAll({ is_active: true, search: priceListSearch, per_page: 50 }),
  });

  // Auto-select default price list
  const { data: defaultPriceList } = useQuery({
    queryKey: ["price-list-default"],
    queryFn: () => priceListsApi.getDefault(),
    enabled: !formData.price_list_id,
  });

  useEffect(() => {
    if (defaultPriceList && !formData.price_list_id) {
      setFormData((prev) => ({ ...prev, price_list_id: defaultPriceList.id }));
    }
  }, [defaultPriceList, formData.price_list_id]);

  const { data: materialsData, isLoading: isLoadingMaterials } = useQuery({
    queryKey: ["products", { search: searchMaterial, is_active: true }],
    queryFn: () =>
      productsApi.getAll({
        search: searchMaterial,
        is_active: true,
        per_page: 50,
      }),
  });

  const warehouses = warehousesData?.data ?? [];
  const suppliers = suppliersData?.data ?? [];
  const customers = customersData?.data ?? [];
  const sites = sitesData?.data ?? [];
  const rentalProjects = rentalProjectsData?.data ?? [];
  const materials = materialsData?.data ?? [];

  // Auto-populate rental dates from selected project
  useEffect(() => {
    if (formData.type === "rental_out" && formData.project_id) {
      const project = rentalProjects.find((p: Project) => p.id === formData.project_id);
      if (project) {
        setFormData((prev) => ({
          ...prev,
          ...(project.start_date && !prev.rental_start_date
            ? { rental_start_date: project.start_date }
            : {}),
          ...(project.estimated_end_date && !prev.rental_end_date
            ? { rental_end_date: project.estimated_end_date }
            : {}),
        }));
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.project_id, formData.type]);

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (data: DdtFormData) => {
      // Convert null to undefined for API
      const apiData = {
        ...data,
        supplier_id: data.supplier_id || undefined,
        customer_id: data.customer_id || undefined,
        project_id: data.project_id || undefined,
        to_warehouse_id: data.to_warehouse_id || undefined,
        transport_date: data.transport_date || undefined,
        carrier_name: data.carrier_name || undefined,
        tracking_number: data.tracking_number || undefined,
        rental_start_date: data.rental_start_date || undefined,
        rental_end_date: data.rental_end_date || undefined,
        parent_ddt_id: data.parent_ddt_id || undefined,
        return_reason: data.return_reason || undefined,
        return_notes: data.return_notes || undefined,
        notes: data.notes || undefined,
        price_list_id: data.price_list_id || undefined,
        items: data.items.map((item) => ({
          product_id: item.product_id,
          quantity: item.quantity,
          unit: item.unit,
          unit_cost: item.unit_cost,
          notes: item.notes || undefined,
          kit_assembly_id: item.kit_assembly_id || undefined,
        })),
      };
      return ddtsApi.create(apiData);
    },
    onSuccess: (ddt) => {
      toast.success("DDT Creato", {
        description: `DDT ${ddt.code} creato con successo in modalità bozza.`,
      });
      router.push(`/ddts/${ddt.id}`);
    },
    onError: (error: { response?: { data?: { message?: string } } }) => {
      toast.error("Errore", {
        description:
          error.response?.data?.message || "Impossibile creare il DDT",
      });
    },
  });

  const handleAddItem = async (material: App.Data.ProductData) => {
    if (!material.id) return;
    const materialId = material.id;

    let unitCost: number = material.standard_cost || 0;
    let pricingBreakdown: string | undefined;

    if (formData.type === "rental_out") {
      const start = formData.rental_start_date;
      const end = formData.rental_end_date;
      const durationDays =
        start && end
          ? Math.ceil(
              (new Date(end).getTime() - new Date(start).getTime()) /
                (1000 * 60 * 60 * 24),
            )
          : null;

      try {
        const pricing = await productsApi.getPricing(materialId, {
          price_list_id: formData.price_list_id ?? undefined,
          quote_type: "rental",
          duration_days: durationDays ?? undefined,
        });

        if (pricing.rental_total && durationDays) {
          unitCost = pricing.rental_total;
          const dailyRate = pricing.rental_daily ?? 0;
          const multiplier = pricing.duration_multiplier;
          if (multiplier && multiplier !== 1) {
            pricingBreakdown = `${durationDays} gg × €${dailyRate.toFixed(2)}/gg × ${multiplier.toFixed(2)}`;
          } else {
            pricingBreakdown = `${durationDays} gg × €${dailyRate.toFixed(2)}/gg`;
          }
        } else if (pricing.rental_daily) {
          unitCost = pricing.rental_daily;
          pricingBreakdown = `€${pricing.rental_daily.toFixed(2)}/gg`;
        }
      } catch {
        // Fallback al standard_cost
      }
    } else if (formData.supplier_id) {
      try {
        const supplierPrices = await productsApi.getSupplierPrices(materialId);
        const supplierPrice = supplierPrices.find(
          (sp) => sp.supplier_id === formData.supplier_id,
        );
        if (supplierPrice) {
          unitCost = supplierPrice.final_price ?? supplierPrice.purchase_price;
        }
      } catch {
        // In caso di errore usa il costo standard come fallback
      }
    }

    setFormData((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        {
          product_id: materialId,
          quantity: 1,
          unit: material.unit || "",
          unit_cost: unitCost,
          notes: null,
          kit_assembly_id: null,
          _pricing_breakdown: pricingBreakdown,
        },
      ],
    }));
    setSearchMaterial("");
  };

  const handleRemoveItem = (index: number) => {
    setFormData({
      ...formData,
      items: formData.items.filter((_, i) => i !== index),
    });
  };

  const handleItemChange = (index: number, field: string, value: string | number | null) => {
    const newItems = [...formData.items];
    newItems[index] = { ...newItems[index], [field]: value };
    setFormData({ ...formData, items: newItems });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.from_warehouse_id) {
      toast.error("Errore Validazione", {
        description: "Seleziona il magazzino di origine",
      });
      return;
    }

    if (formData.items.length === 0) {
      toast.error("Errore Validazione", {
        description: "Aggiungi almeno un articolo",
      });
      return;
    }

    createMutation.mutate(formData);
  };

  // Check if any item is a kit product
  const hasKitItems = formData.items.some((item) => {
    const material = materials.find((m: App.Data.ProductData) => m.id === item.product_id);
    return material?.product_type === 'kit';
  });

  // Dynamic field requirements based on DDT type
  const requiresSupplier = ["incoming", "return_to_supplier"].includes(
    formData.type,
  );
  const requiresCustomer = ["outgoing", "return_from_customer"].includes(
    formData.type,
  );
  const requiresSite = formData.type === "outgoing";
  const requiresRentalProject = formData.type === "rental_out";
  const requiresToWarehouse = ["internal", "rental_out"].includes(
    formData.type,
  );
  const requiresRentalDates = ["rental_out", "rental_return"].includes(
    formData.type,
  );
  const requiresReturnReason = [
    "return_from_customer",
    "return_to_supplier",
  ].includes(formData.type);

  return (
    <form onSubmit={handleSubmit} className="space-y-6 pb-10">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button type="button" variant="ghost" asChild>
            <Link href="/ddts">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Annulla
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Nuovo DDT</h1>
            <p className="text-slate-600 mt-1">
              Crea un nuovo Documento Di Trasporto
            </p>
          </div>
        </div>
        <Button type="submit" disabled={createMutation.isPending}>
          <Save className="h-4 w-4 mr-2" />
          {createMutation.isPending ? "Salvataggio..." : "Salva Bozza"}
        </Button>
      </div>

      {/* Type Selection */}
      <Card className="border-2 border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle>Tipo DDT</CardTitle>
          <CardDescription>
            Seleziona il tipo di documento da creare
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Select
            value={formData.type}
            onValueChange={(value: DdtType) =>
              setFormData({
                ...formData,
                type: value,
                supplier_id: null,
                customer_id: null,
                project_id: null,
                to_warehouse_id: null,
              })
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(ddtTypeLabels).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* General Info */}
      <Card>
        <CardHeader>
          <CardTitle>Informazioni Generali</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="ddt_number">
                Numero DDT <span className="text-red-500">*</span>
              </Label>
              <Input
                id="ddt_number"
                required
                value={formData.ddt_number}
                onChange={(e) =>
                  setFormData({ ...formData, ddt_number: e.target.value })
                }
                placeholder={
                  nextNumberData?.suggested_number || "Es: DDT-2026-0001"
                }
              />
              {nextNumberData?.suggested_number && (
                <p className="text-xs text-slate-500">
                  Suggerito: {nextNumberData.suggested_number}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="ddt_date">
                Data DDT <span className="text-red-500">*</span>
              </Label>
              <Input
                id="ddt_date"
                type="date"
                required
                value={formData.ddt_date}
                onChange={(e) =>
                  setFormData({ ...formData, ddt_date: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="transport_date">Data Trasporto</Label>
              <Input
                id="transport_date"
                type="date"
                value={formData.transport_date || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    transport_date: e.target.value || null,
                  })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="carrier_name">Vettore</Label>
              <Input
                id="carrier_name"
                value={formData.carrier_name || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    carrier_name: e.target.value || null,
                  })
                }
                placeholder="Nome trasportatore"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tracking_number">
                Numero Tracking (opzionale)
              </Label>
              <Input
                id="tracking_number"
                value={formData.tracking_number || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    tracking_number: e.target.value || null,
                  })
                }
                placeholder="Es: 1Z999AA10123456784 (lascia vuoto se non disponibile)"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Parties & Warehouses */}
      <Card>
        <CardHeader>
          <CardTitle>Magazzini e Parti Coinvolte</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* From Warehouse */}
            <div className="space-y-2">
              <Label htmlFor="from_warehouse_id">
                Magazzino Origine <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.from_warehouse_id?.toString() || undefined}
                onValueChange={(value) =>
                  setFormData({
                    ...formData,
                    from_warehouse_id: parseInt(value),
                  })
                }
              >
                <SelectTrigger className="min-w-[200px]">
                  <SelectValue placeholder="Seleziona magazzino" />
                </SelectTrigger>
                <SelectContent>
                  {warehouses.length === 0 ? (
                    <div className="p-2 text-sm text-slate-500">
                      Nessun magazzino disponibile
                    </div>
                  ) : (
                    warehouses.map((warehouse: App.Data.WarehouseData) => (
                      <SelectItem
                        key={warehouse.id!}
                        value={warehouse.id!.toString()}
                      >
                        {warehouse.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* To Warehouse (if needed) */}
            {requiresToWarehouse && (
              <div className="space-y-2">
                <Label htmlFor="to_warehouse_id">
                  Magazzino Destinazione <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.to_warehouse_id?.toString() || undefined}
                  onValueChange={(value) =>
                    setFormData({
                      ...formData,
                      to_warehouse_id: parseInt(value),
                    })
                  }
                >
                  <SelectTrigger className="min-w-[200px]">
                    <SelectValue placeholder="Seleziona magazzino" />
                  </SelectTrigger>
                  <SelectContent>
                    {warehouses.filter(
                      (w: App.Data.WarehouseData) => w.id !== formData.from_warehouse_id,
                    ).length === 0 ? (
                      <div className="p-2 text-sm text-slate-500">
                        Nessun altro magazzino disponibile
                      </div>
                    ) : (
                      warehouses
                        .filter((w: App.Data.WarehouseData) => w.id !== formData.from_warehouse_id)
                        .map((warehouse: App.Data.WarehouseData) => (
                          <SelectItem
                            key={warehouse.id!}
                            value={warehouse.id!.toString()}
                          >
                            {warehouse.name}
                          </SelectItem>
                        ))
                    )}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Supplier (if needed) */}
            {requiresSupplier && (
              <div className="space-y-2">
                <Label htmlFor="supplier_id">
                  Fornitore <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.supplier_id?.toString() || undefined}
                  onValueChange={(value) =>
                    setFormData({ ...formData, supplier_id: parseInt(value) })
                  }
                >
                  <SelectTrigger className="min-w-[200px]">
                    <SelectValue placeholder="Seleziona fornitore" />
                  </SelectTrigger>
                  <SelectContent>
                    {suppliers.length === 0 ? (
                      <div className="p-2 text-sm text-slate-500">
                        Nessun fornitore disponibile
                      </div>
                    ) : (
                      suppliers.map((supplier: Supplier) => (
                        <SelectItem
                          key={supplier.id}
                          value={supplier.id!.toString()}
                        >
                          {supplier.company_name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Customer (if needed) */}
            {requiresCustomer && (
              <div className="space-y-2">
                <Label htmlFor="customer_id">
                  Cliente <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.customer_id?.toString() || undefined}
                  onValueChange={(value) =>
                    setFormData({ ...formData, customer_id: parseInt(value) })
                  }
                >
                  <SelectTrigger className="min-w-[200px]">
                    <SelectValue placeholder="Seleziona cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    {customers.length === 0 ? (
                      <div className="p-2 text-sm text-slate-500">
                        Nessun cliente disponibile
                      </div>
                    ) : (
                      customers.map((customer: Customer) => (
                        <SelectItem
                          key={customer.id}
                          value={customer.id.toString()}
                        >
                          {customer.display_name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Site (if needed) */}
            {requiresSite && (
              <div className="space-y-2">
                <Label htmlFor="project_id">Progetto (opzionale)</Label>
                <Select
                  value={formData.project_id?.toString() || undefined}
                  onValueChange={(value) =>
                    setFormData({
                      ...formData,
                      project_id: value ? parseInt(value) : null,
                    })
                  }
                >
                  <SelectTrigger className="min-w-[200px]">
                    <SelectValue placeholder="Seleziona progetto" />
                  </SelectTrigger>
                  <SelectContent>
                    {sites.length === 0 ? (
                      <div className="p-2 text-sm text-slate-500">
                        Nessun progetto disponibile
                      </div>
                    ) : (
                      sites.map((site: Project) => (
                        <SelectItem key={site.id} value={site.id.toString()}>
                          {site.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Project for rental_out */}
            {requiresRentalProject && (
              <div className="space-y-2">
                <Label htmlFor="rental_project_id">Progetto (opzionale)</Label>
                <Select
                  value={formData.project_id?.toString() || undefined}
                  onValueChange={(value) =>
                    setFormData({
                      ...formData,
                      project_id: value ? parseInt(value) : null,
                      // Reset date auto-popolate se si cambia progetto
                      rental_start_date: null,
                      rental_end_date: null,
                    })
                  }
                >
                  <SelectTrigger className="min-w-[200px]">
                    <SelectValue placeholder="Seleziona progetto" />
                  </SelectTrigger>
                  <SelectContent>
                    {rentalProjects.length === 0 ? (
                      <div className="p-2 text-sm text-slate-500 dark:text-slate-400">
                        Nessun progetto disponibile
                      </div>
                    ) : (
                      rentalProjects.map((project: Project) => (
                        <SelectItem key={project.id} value={project.id.toString()}>
                          {project.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                {formData.project_id && (
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Le date di noleggio vengono auto-popolate dalle date del progetto
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Listino Prezzi */}
          <div className="space-y-2">
            <Label htmlFor="price_list_id">Listino Prezzi</Label>
            <ComboboxSelect
              options={
                priceListsData?.data.map((priceList) => ({
                  value: priceList.id!.toString(),
                  label: priceList.name || "",
                  description: priceList.description || undefined,
                })) || []
              }
              value={formData.price_list_id?.toString()}
              onValueChange={(value) =>
                setFormData((prev) => ({
                  ...prev,
                  price_list_id: value ? parseInt(value) : null,
                }))
              }
              onSearchChange={setPriceListSearch}
              placeholder="Seleziona listino"
              searchPlaceholder="Cerca listino..."
              emptyText="Nessun listino trovato"
              loading={isLoadingPriceLists}
            />
            {formData.type === "rental_out" && (
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Il listino viene usato per calcolare i prezzi di noleggio degli articoli aggiunti
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Rental Dates (if needed) */}
      {requiresRentalDates && (
        <Card>
          <CardHeader>
            <CardTitle>Date Noleggio</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="rental_start_date">Data Inizio Noleggio</Label>
                <Input
                  id="rental_start_date"
                  type="date"
                  value={formData.rental_start_date || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      rental_start_date: e.target.value || null,
                    })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="rental_end_date">Data Fine Prevista</Label>
                <Input
                  id="rental_end_date"
                  type="date"
                  value={formData.rental_end_date || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      rental_end_date: e.target.value || null,
                    })
                  }
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Return Reason (if needed) */}
      {requiresReturnReason && (
        <Card className="border-orange-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              Motivo Reso
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="return_reason">Motivo</Label>
              <Select
                value={formData.return_reason || undefined}
                onValueChange={(value: ReturnReason) =>
                  setFormData({ ...formData, return_reason: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleziona motivo" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(returnReasonLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="return_notes">Note Reso</Label>
              <Textarea
                id="return_notes"
                value={formData.return_notes || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    return_notes: e.target.value || null,
                  })
                }
                placeholder="Descrizione dettagliata del reso..."
                rows={3}
              />
            </div>

            {formData.return_reason &&
              (["defective", "warranty"] as ReturnReason[]).includes(
                formData.return_reason,
              ) && (
                <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
                  <p className="text-sm text-yellow-800 font-medium">
                    ⚠️ Materiale difettoso: verrà automaticamente messo in
                    QUARANTENA alla conferma del DDT
                  </p>
                </div>
              )}
          </CardContent>
        </Card>
      )}

      {/* Items */}
      <Card>
        <CardHeader>
          <CardTitle>Articoli ({formData.items.length})</CardTitle>
          <CardDescription>
            Aggiungi gli articoli da movimentare
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Add Item */}
          <div className="space-y-2">
            <Label>Cerca Articolo</Label>
            <ComboboxSelect
              value={searchMaterial}
              onValueChange={(value) => {
                const material = materials.find(
                  (m: App.Data.ProductData) => m.id?.toString() === value,
                );
                if (material) {
                  handleAddItem(material);
                  setSearchMaterial("");
                } else {
                  setSearchMaterial(value);
                }
              }}
              placeholder="Cerca per codice o nome..."
              searchPlaceholder="Digita per cercare..."
              emptyText={
                isLoadingMaterials
                  ? "Caricamento..."
                  : "Nessun articolo trovato"
              }
              loading={isLoadingMaterials}
              options={materials.map((m: App.Data.ProductData) => ({
                value: m.id!.toString(),
                label: `${m.code} - ${m.name}`,
              }))}
              onSearchChange={setSearchMaterial}
            />
          </div>

          {/* Items Table */}
          {formData.items.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Articolo</TableHead>
                  {hasKitItems && <TableHead>Assembly</TableHead>}
                  <TableHead>Quantità</TableHead>
                  <TableHead>Unità</TableHead>
                  <TableHead>Costo Unit.</TableHead>
                  <TableHead>Note</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {formData.items.map((item, index) => {
                  const material = materials.find(
                    (m: App.Data.ProductData) => m.id === item.product_id,
                  );
                  const isKit = material?.product_type === 'kit';
                  return (
                    <TableRow key={index}>
                      <TableCell>
                        {material ? (
                          <div>
                            <p className="font-medium">{material.name}</p>
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                              {material.code}
                            </p>
                            {isKit && (
                              <Badge variant="secondary" className="text-xs mt-1">
                                KIT
                              </Badge>
                            )}
                            {formData.type === "rental_out" && item._pricing_breakdown && (
                              <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                                {item._pricing_breakdown}
                              </p>
                            )}
                          </div>
                        ) : (
                          `ID: ${item.product_id}`
                        )}
                      </TableCell>
                      {hasKitItems && (
                        <TableCell>
                          {isKit ? (
                            <KitAssemblySelect
                              productId={item.product_id}
                              value={item.kit_assembly_id ?? null}
                              onChange={(id) => handleItemChange(index, 'kit_assembly_id', id)}
                              warehouseId={formData.from_warehouse_id || undefined}
                            />
                          ) : (
                            <span className="text-muted-foreground text-sm">—</span>
                          )}
                        </TableCell>
                      )}
                      <TableCell>
                        <Input
                          type="number"
                          step="0.01"
                          min="0.01"
                          value={item.quantity || ""}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value);
                            handleItemChange(
                              index,
                              "quantity",
                              isNaN(val) ? 0 : val,
                            );
                          }}
                          className="w-24"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          value={item.unit}
                          onChange={(e) =>
                            handleItemChange(index, "unit", e.target.value)
                          }
                          className="w-20"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          value={item.unit_cost || ""}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value);
                            handleItemChange(
                              index,
                              "unit_cost",
                              isNaN(val) ? 0 : val,
                            );
                          }}
                          className="w-24"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          value={item.notes || ""}
                          onChange={(e) =>
                            handleItemChange(
                              index,
                              "notes",
                              e.target.value || null,
                            )
                          }
                          placeholder="Note..."
                        />
                      </TableCell>
                      <TableCell>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveItem(index)}
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}

          {formData.items.length === 0 && (
            <div className="text-center py-8 text-slate-500">
              <AlertTriangle className="h-12 w-12 mx-auto mb-2 text-slate-300" />
              <p>Nessun articolo aggiunto</p>
              <p className="text-sm">
                Cerca e aggiungi articoli usando il campo sopra
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Notes */}
      <Card>
        <CardHeader>
          <CardTitle>Note</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={formData.notes || ""}
            onChange={(e) =>
              setFormData({ ...formData, notes: e.target.value || null })
            }
            placeholder="Note aggiuntive sul DDT..."
            rows={4}
          />
        </CardContent>
      </Card>

      {/* Submit */}
      <div className="flex items-center justify-end gap-4">
        <Button type="button" variant="outline" asChild>
          <Link href="/ddts">Annulla</Link>
        </Button>
        <Button type="submit" disabled={createMutation.isPending}>
          <Save className="h-4 w-4 mr-2" />
          {createMutation.isPending ? "Salvataggio..." : "Salva Bozza"}
        </Button>
      </div>
    </form>
  );
}
