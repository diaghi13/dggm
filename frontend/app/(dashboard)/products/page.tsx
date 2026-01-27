'use client';

import {useState, useMemo, useCallback} from 'react';
import {useQuery, useMutation, useQueryClient} from '@tanstack/react-query';
import {productsApi} from '@/lib/api/products';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '@/components/ui/card';
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select';
import {Package, Plus, Search, AlertTriangle, DollarSign, Archive, Scan} from 'lucide-react';
import {DataTable} from '@/components/shared/data-table/data-table';
import {createProductsColumns} from '@/app/(dashboard)/products/_components/products-columns';
import {BarcodeScanner} from '@/components/barcode-scanner';
import {toast} from 'sonner';
import Link from 'next/link';
import {useRouter} from 'next/navigation';
import {ProtectedRoute} from '@/components/features/auth/protected-route';
import {Can} from '@/components/features/auth/can';
import type {Product} from '@/lib/types';

const categoryLabels: Record<string, string> = {
  construction: 'Edilizia',
  electrical: 'Elettrico',
  plumbing: 'Idraulica',
  tools: 'Attrezzi',
  equipment: 'Attrezzatura',
  general: 'Generale',
};

export default function ProductsPage() {
  return (
    <ProtectedRoute permission="materials.view">
      <ProductsPageContent/>
    </ProtectedRoute>
  );
}

function ProductsPageContent() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<string>('');
  const [showInactive, setShowInactive] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);

  const {data: productsData, isLoading} = useQuery({
    queryKey: ['products', {search, category, is_active: !showInactive ? true : undefined}],
    queryFn: () =>
      productsApi.getAll({
        search,
        category: category || undefined,
        is_active: !showInactive ? true : undefined,
        per_page: 100,
      }),
  });

  const products = productsData?.data ?? [];
  const meta = productsData?.meta;

  const deleteMutation = useMutation({
    mutationFn: (id: number) => productsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ['products']});
      toast.success('Prodotto eliminato', {
        description: 'Il prodotto è stato eliminato con successo',
      });
    },
    onError: (error: Error) => {
      toast.error('Errore', {
        description: error.message || 'Impossibile eliminare il prodotto',
      });
    },
  });

  const handleDelete = useCallback((id: number, name: string) => {
    if (confirm(`Sei sicuro di voler eliminare il prodotto "${name}"?`)) {
      deleteMutation.mutate(id);
    }
  }, [deleteMutation]);

  const handleBarcodeScan = useCallback(
    async (barcode: string) => {
      try {
        const response = await productsApi.getAll({
          barcode,
          is_active: true,
          per_page: 1,
        });

        const products = response.data;
        if (products && products.length > 0) {
          const product = products[0];
          // Naviga alla pagina del prodotto
          router.push(`/products/${product.id}`);
          toast.success('Prodotto trovato', {
            description: `${product.code} - ${product.name}`,
          });
        } else {
          toast.error('Prodotto non trovato', {
            description: `Nessun prodotto con barcode: ${barcode}`,
          });
        }
      } catch (error) {
        console.error('Errore ricerca barcode:', error);
        toast.error('Errore ricerca', {
          description: 'Impossibile cercare il prodotto',
        });
      }
    },
    [router]
  );

  // Define columns
  const columns = useMemo(
    () =>
      createProductsColumns(
        (product: Product) => {
          router.push(`/products/${product.id}`);
        },
        (product: Product) => {
          handleDelete(product.id!, product.name);
        }
      ),
    [handleDelete, router]
  );

  // Calcola statistiche
  const stats = {
    total: products.length,
    active: products.filter((p: Product) => p.is_active).length,
    inactive: products.filter((p: Product) => !p.is_active).length,
    totalValue: products.reduce((sum: number, p: Product) => sum + (Number(p.total_stock || 0) * Number(p.standard_cost || 0)), 0),
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">Catalogo Prodotti</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">Gestione completa del catalogo prodotti e materiali</p>
        </div>
        <Can permission="materials.create">
          <Link href="/products/new">
            <Button className="shadow-md">
              <Plus className="mr-2 h-4 w-4"/>
              Nuovo Prodotto
            </Button>
          </Link>
        </Can>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Totale Prodotti</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground"/>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">
              {stats.active} attivi, {stats.inactive} inattivi
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valore Magazzino</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground"/>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">€ {stats.totalValue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Valore totale stock</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Categorie</CardTitle>
            <Archive className="h-4 w-4 text-muted-foreground"/>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Object.keys(categoryLabels).length}
            </div>
            <p className="text-xs text-muted-foreground">Categorie disponibili</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Alert Scorte</CardTitle>
            <AlertTriangle className="h-4 w-4 text-amber-600"/>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">0</div>
            <p className="text-xs text-muted-foreground">Sotto scorta minima</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filtri</CardTitle>
          <CardDescription>Filtra e cerca prodotti nel catalogo</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400"/>
                <Input
                  placeholder="Cerca per codice o nome..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10 h-11"
                />
              </div>
              <Button
                variant="outline"
                size="icon"
                className="h-11 w-11 flex-shrink-0"
                onClick={() => setScannerOpen(true)}
                title="Scansiona barcode"
              >
                <Scan className="h-5 w-5" />
              </Button>
            </div>
            <Select value={category || 'all'} onValueChange={(value) => setCategory(value === 'all' ? '' : value)}>
              <SelectTrigger className="h-11">
                <SelectValue placeholder="Tutte le categorie"/>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tutte le categorie</SelectItem>
                {Object.entries(categoryLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="show-inactive"
                checked={showInactive}
                onChange={(e) => setShowInactive(e.target.checked)}
                className="w-4 h-4 rounded border-slate-300"
              />
              <label htmlFor="show-inactive" className="text-sm text-slate-700 dark:text-slate-300 cursor-pointer">
                Mostra prodotti inattivi
              </label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Products Table */}
      <Card>
        <CardHeader>
          <CardTitle>Prodotti ({products.length})</CardTitle>
          <CardDescription>
            {meta?.total ? `${meta.total} prodotti totali` : 'Elenco di tutti i prodotti'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={products}
            isLoading={isLoading}
            storageKey="products-table"
            onRowClick={(product: Product) => router.push(`/products/${product.id}`)}
            emptyState={
              <div className="text-center py-12">
                <Package className="mx-auto h-12 w-12 text-slate-300"/>
                <h3 className="mt-4 text-lg font-semibold text-slate-900 dark:text-slate-100">Nessun prodotto trovato</h3>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                  {search || category
                    ? 'Prova a modificare i filtri di ricerca'
                    : 'Inizia creando il tuo primo prodotto'}
                </p>
                {!search && !category && (
                  <Can permission="materials.create">
                    <Link href="/products/new">
                      <Button className="mt-4">
                        <Plus className="mr-2 h-4 w-4"/>
                        Crea Primo Prodotto
                      </Button>
                    </Link>
                  </Can>
                )}
              </div>
            }
          />
        </CardContent>
      </Card>

      {/* Barcode Scanner */}
      <BarcodeScanner
        open={scannerOpen}
        onOpenChange={setScannerOpen}
        onScan={handleBarcodeScan}
        title="Scansiona Barcode Prodotto"
        description="Scansiona il barcode per cercare e aprire la pagina del prodotto"
      />
    </div>
  );
}
