'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import { ddtsApi } from '@/lib/api/ddts';
import { warehousesApi } from '@/lib/api/warehouses';
import { suppliersApi } from '@/lib/api/suppliers';
import { customersApi } from '@/lib/api/customers';
import { sitesApi } from '@/lib/api/sites';
import { productsApi } from '@/lib/api/products';
import type { DdtType, DdtFormData, ReturnReason } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ArrowLeft, Plus, Trash2, Save, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { ComboboxSelect } from '@/components/combobox-select';

const ddtTypeLabels: Record<DdtType, string> = {
  incoming: 'Carico da Fornitore',
  outgoing: 'Scarico a Cliente/Cantiere',
  internal: 'Trasferimento Interno',
  rental_out: 'Noleggio Uscita',
  rental_return: 'Noleggio Rientro',
  return_from_customer: 'Reso da Cliente',
  return_to_supplier: 'Reso a Fornitore',
};

const returnReasonLabels: Record<ReturnReason, string> = {
  defective: 'Difettoso',
  wrong_item: 'Articolo Errato',
  excess: 'Eccesso',
  warranty: 'Garanzia',
  customer_dissatisfaction: 'Insoddisfazione Cliente',
  other: 'Altro',
};

export default function NewDdtPage() {
  const router = useRouter();

  const [formData, setFormData] = useState<DdtFormData>({
    type: 'incoming',
    from_warehouse_id: 0,
    ddt_number: '',
    ddt_date: new Date().toISOString().split('T')[0],
    items: [],
  });

  const [searchMaterial, setSearchMaterial] = useState('');

  // Fetch next DDT number
  const { data: nextNumberData } = useQuery({
    queryKey: ['ddt-next-number'],
    queryFn: () => ddtsApi.getNextNumber(),
  });

  // Auto-populate DDT number when available
  useEffect(() => {
    if (nextNumberData?.suggested_number && !formData.ddt_number) {
      setFormData((prev) => ({ ...prev, ddt_number: nextNumberData.suggested_number }));
    }
  }, [nextNumberData]);

  // Fetch options
  const { data: warehousesData } = useQuery({
    queryKey: ['warehouses', { is_active: true }],
    queryFn: () => warehousesApi.getAll({ is_active: true, per_page: 100 }),
  });

  const { data: suppliersData } = useQuery({
    queryKey: ['suppliers', { is_active: true }],
    queryFn: () => suppliersApi.getAll({ is_active: true, per_page: 100 }),
    enabled: ['incoming', 'return_to_supplier'].includes(formData.type),
  });

  const { data: customersData } = useQuery({
    queryKey: ['customers', { is_active: true }],
    queryFn: () => customersApi.getAll({ is_active: true, per_page: 100 }),
    enabled: ['outgoing', 'return_from_customer'].includes(formData.type),
  });

  const { data: sitesData } = useQuery({
    queryKey: ['sites', { status: 'in_progress' }],
    queryFn: () => sitesApi.getAll({ status: 'in_progress', per_page: 100 }),
    enabled: formData.type === 'outgoing',
  });

  const { data: materialsData, isLoading: isLoadingMaterials } = useQuery({
    queryKey: ['products', { search: searchMaterial, is_active: true }],
    queryFn: () => productsApi.getAll({ search: searchMaterial, is_active: true, per_page: 50 }),
  });

  const warehouses = warehousesData?.data ?? [];
  const suppliers = suppliersData?.data ?? [];
  const customers = customersData?.data ?? [];
  const sites = sitesData?.data ?? [];
  const materials = materialsData?.data ?? [];

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (data: DdtFormData) => {
      // Convert null to undefined for API
      const apiData = {
        ...data,
        supplier_id: data.supplier_id || undefined,
        customer_id: data.customer_id || undefined,
        site_id: data.site_id || undefined,
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
        items: data.items.map(item => ({
          product_id: item.product_id,
          quantity: item.quantity,
          unit: item.unit,
          unit_cost: item.unit_cost,
          notes: item.notes || undefined,
        })),
      };
      return ddtsApi.create(apiData);
    },
    onSuccess: (ddt) => {
      toast.success('DDT Creato', {
        description: `DDT ${ddt.code} creato con successo in modalità bozza.`,
      });
      router.push(`/ddts/${ddt.id}`);
    },
    onError: (error: any) => {
      toast.error('Errore', {
        description: error.response?.data?.message || 'Impossibile creare il DDT',
      });
    },
  });

  const handleAddItem = (material: any) => {
    setFormData({
      ...formData,
      items: [
        ...formData.items,
        {
          product_id: material.id,
          quantity: 1,
          unit: material.unit,
          unit_cost: material.standard_cost || 0,
          notes: null,
        },
      ],
    });
    setSearchMaterial('');
  };

  const handleRemoveItem = (index: number) => {
    setFormData({
      ...formData,
      items: formData.items.filter((_, i) => i !== index),
    });
  };

  const handleItemChange = (index: number, field: string, value: any) => {
    const newItems = [...formData.items];
    newItems[index] = { ...newItems[index], [field]: value };
    setFormData({ ...formData, items: newItems });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.from_warehouse_id) {
      toast.error('Errore Validazione', {
        description: 'Seleziona il magazzino di origine',
      });
      return;
    }

    if (formData.items.length === 0) {
      toast.error('Errore Validazione', {
        description: 'Aggiungi almeno un articolo',
      });
      return;
    }

    createMutation.mutate(formData);
  };

  // Dynamic field requirements based on DDT type
  const requiresSupplier = ['incoming', 'return_to_supplier'].includes(formData.type);
  const requiresCustomer = ['outgoing', 'return_from_customer'].includes(formData.type);
  const requiresSite = formData.type === 'outgoing';
  const requiresToWarehouse = ['internal', 'rental_out'].includes(formData.type);
  const requiresRentalDates = ['rental_out', 'rental_return'].includes(formData.type);
  const requiresReturnReason = ['return_from_customer', 'return_to_supplier'].includes(
    formData.type
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-6 pb-10">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button type="button" variant="ghost" asChild>
            <Link href="/frontend/app/(dashboard)/ddts">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Annulla
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Nuovo DDT</h1>
            <p className="text-slate-600 mt-1">Crea un nuovo Documento Di Trasporto</p>
          </div>
        </div>
        <Button type="submit" disabled={createMutation.isPending}>
          <Save className="h-4 w-4 mr-2" />
          {createMutation.isPending ? 'Salvataggio...' : 'Salva Bozza'}
        </Button>
      </div>

      {/* Type Selection */}
      <Card className="border-2 border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle>Tipo DDT</CardTitle>
          <CardDescription>Seleziona il tipo di documento da creare</CardDescription>
        </CardHeader>
        <CardContent>
          <Select
            value={formData.type}
            onValueChange={(value: DdtType) =>
              setFormData({ ...formData, type: value, supplier_id: null, customer_id: null, site_id: null, to_warehouse_id: null })
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
                onChange={(e) => setFormData({ ...formData, ddt_number: e.target.value })}
                placeholder={nextNumberData?.suggested_number || "Es: DDT-2026-0001"}
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
                onChange={(e) => setFormData({ ...formData, ddt_date: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="transport_date">Data Trasporto</Label>
              <Input
                id="transport_date"
                type="date"
                value={formData.transport_date || ''}
                onChange={(e) =>
                  setFormData({ ...formData, transport_date: e.target.value || null })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="carrier_name">Vettore</Label>
              <Input
                id="carrier_name"
                value={formData.carrier_name || ''}
                onChange={(e) =>
                  setFormData({ ...formData, carrier_name: e.target.value || null })
                }
                placeholder="Nome trasportatore"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tracking_number">Numero Tracking (opzionale)</Label>
              <Input
                id="tracking_number"
                value={formData.tracking_number || ''}
                onChange={(e) =>
                  setFormData({ ...formData, tracking_number: e.target.value || null })
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
                  setFormData({ ...formData, from_warehouse_id: parseInt(value) })
                }
              >
                <SelectTrigger className="min-w-[200px]">
                  <SelectValue placeholder="Seleziona magazzino" />
                </SelectTrigger>
                <SelectContent>
                  {warehouses.length === 0 ? (
                    <div className="p-2 text-sm text-slate-500">Nessun magazzino disponibile</div>
                  ) : (
                    warehouses.map((warehouse: any) => (
                      <SelectItem key={warehouse.id} value={warehouse.id.toString()}>
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
                    setFormData({ ...formData, to_warehouse_id: parseInt(value) })
                  }
                >
                  <SelectTrigger className="min-w-[200px]">
                    <SelectValue placeholder="Seleziona magazzino" />
                  </SelectTrigger>
                  <SelectContent>
                    {warehouses.filter((w: any) => w.id !== formData.from_warehouse_id).length === 0 ? (
                      <div className="p-2 text-sm text-slate-500">Nessun altro magazzino disponibile</div>
                    ) : (
                      warehouses
                        .filter((w: any) => w.id !== formData.from_warehouse_id)
                        .map((warehouse: any) => (
                          <SelectItem key={warehouse.id} value={warehouse.id.toString()}>
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
                      <div className="p-2 text-sm text-slate-500">Nessun fornitore disponibile</div>
                    ) : (
                      suppliers.map((supplier: any) => (
                        <SelectItem key={supplier.id} value={supplier.id.toString()}>
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
                      <div className="p-2 text-sm text-slate-500">Nessun cliente disponibile</div>
                    ) : (
                      customers.map((customer: any) => (
                        <SelectItem key={customer.id} value={customer.id.toString()}>
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
                <Label htmlFor="site_id">Cantiere (opzionale)</Label>
                <Select
                  value={formData.site_id?.toString() || undefined}
                  onValueChange={(value) =>
                    setFormData({ ...formData, site_id: value ? parseInt(value) : null })
                  }
                >
                  <SelectTrigger className="min-w-[200px]">
                    <SelectValue placeholder="Seleziona cantiere" />
                  </SelectTrigger>
                  <SelectContent>
                    {sites.length === 0 ? (
                      <div className="p-2 text-sm text-slate-500">Nessun cantiere disponibile</div>
                    ) : (
                      sites.map((site: any) => (
                        <SelectItem key={site.id} value={site.id.toString()}>
                          {site.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
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
                  value={formData.rental_start_date || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, rental_start_date: e.target.value || null })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="rental_end_date">Data Fine Prevista</Label>
                <Input
                  id="rental_end_date"
                  type="date"
                  value={formData.rental_end_date || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, rental_end_date: e.target.value || null })
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
                value={formData.return_notes || ''}
                onChange={(e) => setFormData({ ...formData, return_notes: e.target.value || null })}
                placeholder="Descrizione dettagliata del reso..."
                rows={3}
              />
            </div>

            {formData.return_reason &&
              (['defective', 'warranty'] as ReturnReason[]).includes(formData.return_reason) && (
                <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
                  <p className="text-sm text-yellow-800 font-medium">
                    ⚠️ Materiale difettoso: verrà automaticamente messo in QUARANTENA alla
                    conferma del DDT
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
          <CardDescription>Aggiungi gli articoli da movimentare</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Add Item */}
          <div className="space-y-2">
            <Label>Cerca Articolo</Label>
            <ComboboxSelect
              value={searchMaterial}
              onValueChange={(value) => {
                const material = materials.find((m: any) => m.id.toString() === value);
                if (material) {
                  handleAddItem(material);
                  setSearchMaterial('');
                } else {
                  setSearchMaterial(value);
                }
              }}
              placeholder="Cerca per codice o nome..."
              searchPlaceholder="Digita per cercare..."
              emptyText={isLoadingMaterials ? "Caricamento..." : "Nessun articolo trovato"}
              loading={isLoadingMaterials}
              options={materials.map((m: any) => ({
                value: m.id.toString(),
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
                  <TableHead>Quantità</TableHead>
                  <TableHead>Unità</TableHead>
                  <TableHead>Costo Unit.</TableHead>
                  <TableHead>Note</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {formData.items.map((item, index) => {
                  const material = materials.find((m: any) => m.id === item.product_id);
                  return (
                    <TableRow key={index}>
                      <TableCell>
                        {material ? (
                          <div>
                            <p className="font-medium">{material.name}</p>
                            <p className="text-sm text-slate-500">{material.code}</p>
                          </div>
                        ) : (
                          `ID: ${item.product_id}`
                        )}
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          step="0.01"
                          min="0.01"
                          value={item.quantity || ''}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value);
                            handleItemChange(index, 'quantity', isNaN(val) ? 0 : val);
                          }}
                          className="w-24"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          value={item.unit}
                          onChange={(e) => handleItemChange(index, 'unit', e.target.value)}
                          className="w-20"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          value={item.unit_cost || ''}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value);
                            handleItemChange(index, 'unit_cost', isNaN(val) ? 0 : val);
                          }}
                          className="w-24"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          value={item.notes || ''}
                          onChange={(e) =>
                            handleItemChange(index, 'notes', e.target.value || null)
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
              <p className="text-sm">Cerca e aggiungi articoli usando il campo sopra</p>
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
            value={formData.notes || ''}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value || null })}
            placeholder="Note aggiuntive sul DDT..."
            rows={4}
          />
        </CardContent>
      </Card>

      {/* Submit */}
      <div className="flex items-center justify-end gap-4">
        <Button type="button" variant="outline" asChild>
          <Link href="/frontend/app/(dashboard)/ddts">Annulla</Link>
        </Button>
        <Button type="submit" disabled={createMutation.isPending}>
          <Save className="h-4 w-4 mr-2" />
          {createMutation.isPending ? 'Salvataggio...' : 'Salva Bozza'}
        </Button>
      </div>
    </form>
  );
}
