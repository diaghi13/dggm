'use client';

import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { suppliersApi } from '@/lib/api/suppliers';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, Factory, Mail, Phone, MapPin, Package, Users, Globe, FileText } from 'lucide-react';
import Link from 'next/link';

export default function SupplierDetailPage() {
  const params = useParams();
  const router = useRouter();
  const supplierId = parseInt(params.id as string);

  const { data: supplier, isLoading } = useQuery({
    queryKey: ['supplier', supplierId],
    queryFn: () => suppliersApi.getById(supplierId),
    enabled: !!supplierId,
  });

  const { data: workers, isLoading: workersLoading } = useQuery({
    queryKey: ['supplier-workers', supplierId],
    queryFn: () => suppliersApi.getWorkers(supplierId),
    enabled: !!supplierId && (supplier?.supplier_type === 'personnel' || supplier?.supplier_type === 'both'),
  });

  const { data: rates, isLoading: ratesLoading } = useQuery({
    queryKey: ['supplier-rates', supplierId],
    queryFn: () => suppliersApi.getRates(supplierId),
    enabled: !!supplierId && (supplier?.supplier_type === 'personnel' || supplier?.supplier_type === 'both'),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Factory className="h-12 w-12 mx-auto mb-4 text-slate-400 dark:text-slate-600 animate-pulse" />
          <p className="text-slate-600 dark:text-slate-400">Caricamento fornitore...</p>
        </div>
      </div>
    );
  }

  if (!supplier) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Factory className="h-12 w-12 mx-auto mb-4 text-red-400" />
          <p className="text-slate-600 dark:text-slate-400">Fornitore non trovato</p>
          <Button asChild className="mt-4">
            <Link href="/dashboard/suppliers">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Torna alla lista
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  const getSupplierTypeConfig = () => {
    switch (supplier.supplier_type) {
      case 'materials':
        return { label: 'Materiali', icon: Package, className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' };
      case 'personnel':
        return { label: 'Personale', icon: Users, className: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' };
      case 'both':
        return { label: 'Entrambi', icon: Factory, className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' };
      default:
        return { label: '-', icon: Package, className: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400' };
    }
  };

  const typeConfig = getSupplierTypeConfig();
  const TypeIcon = typeConfig.icon;

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push('/dashboard/suppliers')}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{supplier.company_name}</h1>
              <Badge variant="outline" className="font-mono text-xs">
                {supplier.code}
              </Badge>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Fornitore di {typeConfig.label}
            </p>
          </div>
        </div>
      </div>

      {/* Status Badges */}
      <div className="flex gap-2 flex-wrap">
        <Badge className={supplier.is_active ? 'bg-green-100 dark:bg-green-950/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800 font-medium text-xs border' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 font-medium text-xs border'}>
          {supplier.is_active ? 'Attivo' : 'Inattivo'}
        </Badge>
        <Badge variant="secondary" className={`${typeConfig.className} font-medium`}>
          <TypeIcon className="h-3 w-3 mr-1" />
          {typeConfig.label}
        </Badge>
        {supplier.personnel_type && (
          <Badge variant="outline" className="font-medium text-xs">
            {supplier.personnel_type}
          </Badge>
        )}
      </div>

      <Tabs defaultValue="info" className="space-y-6">
        <TabsList>
          <TabsTrigger value="info">Informazioni</TabsTrigger>
          {(supplier.supplier_type === 'personnel' || supplier.supplier_type === 'both') && (
            <>
              <TabsTrigger value="workers">Collaboratori ({workers?.length || 0})</TabsTrigger>
              <TabsTrigger value="rates">Tariffe ({rates?.length || 0})</TabsTrigger>
            </>
          )}
        </TabsList>

        <TabsContent value="info" className="space-y-6">
          {/* Dati Azienda */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Factory className="h-5 w-5" />
                Dati Azienda
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <div className="text-sm text-slate-500 dark:text-slate-400">Ragione Sociale</div>
                <div className="text-slate-900 dark:text-slate-100 font-medium">{supplier.company_name}</div>
              </div>

              {supplier.vat_number && (
                <div className="space-y-2">
                  <div className="text-sm text-slate-500 dark:text-slate-400">Partita IVA</div>
                  <div className="text-slate-900 dark:text-slate-100 font-mono">{supplier.vat_number}</div>
                </div>
              )}

              {supplier.tax_code && (
                <div className="space-y-2">
                  <div className="text-sm text-slate-500 dark:text-slate-400">Codice Fiscale</div>
                  <div className="text-slate-900 dark:text-slate-100 font-mono">{supplier.tax_code}</div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Contatti */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Contatti
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-6">
              {supplier.email && (
                <div className="space-y-2">
                  <div className="text-sm text-slate-500 dark:text-slate-400">Email</div>
                  <div className="text-slate-900 dark:text-slate-100">{supplier.email}</div>
                </div>
              )}

              {supplier.phone && (
                <div className="space-y-2">
                  <div className="text-sm text-slate-500 dark:text-slate-400">Telefono</div>
                  <div className="text-slate-900 dark:text-slate-100">{supplier.phone}</div>
                </div>
              )}

              {supplier.mobile && (
                <div className="space-y-2">
                  <div className="text-sm text-slate-500 dark:text-slate-400">Cellulare</div>
                  <div className="text-slate-900 dark:text-slate-100">{supplier.mobile}</div>
                </div>
              )}

              {supplier.website && (
                <div className="space-y-2">
                  <div className="text-sm text-slate-500 dark:text-slate-400">Sito Web</div>
                  <a href={supplier.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1">
                    <Globe className="h-3 w-3" />
                    {supplier.website}
                  </a>
                </div>
              )}

              {supplier.address && (
                <div className="space-y-2 col-span-2">
                  <div className="text-sm text-slate-500 dark:text-slate-400">Indirizzo</div>
                  <div className="text-slate-900 dark:text-slate-100">
                    {supplier.address}{supplier.city && `, ${supplier.city}`}{supplier.province && ` (${supplier.province})`}{supplier.postal_code && ` - ${supplier.postal_code}`}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Note */}
          {supplier.notes && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Note
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{supplier.notes}</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {(supplier.supplier_type === 'personnel' || supplier.supplier_type === 'both') && (
          <>
            <TabsContent value="workers" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Collaboratori
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {workersLoading ? (
                    <div className="text-center py-8">
                      <Users className="w-12 h-12 mx-auto mb-4 text-slate-400 dark:text-slate-600 animate-pulse" />
                      <p className="text-slate-600 dark:text-slate-400">Caricamento collaboratori...</p>
                    </div>
                  ) : !workers || workers.length === 0 ? (
                    <div className="text-center py-8">
                      <Users className="w-12 h-12 mx-auto mb-4 text-slate-300 dark:text-slate-700" />
                      <p className="text-slate-600 dark:text-slate-400">Nessun collaboratore registrato</p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-slate-50 dark:bg-slate-800/50">
                          <TableHead>Codice</TableHead>
                          <TableHead>Nome</TableHead>
                          <TableHead>Ruolo</TableHead>
                          <TableHead>Stato</TableHead>
                          <TableHead className="text-right">Azioni</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {workers.map((worker: any) => (
                          <TableRow key={worker.id}>
                            <TableCell className="font-mono text-sm">{worker.code}</TableCell>
                            <TableCell>{worker.display_name}</TableCell>
                            <TableCell>{worker.job_title || '-'}</TableCell>
                            <TableCell>
                              <Badge variant={worker.is_active ? 'default' : 'secondary'}>
                                {worker.is_active ? 'Attivo' : 'Inattivo'}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <Button variant="ghost" size="sm" asChild>
                                <Link href={`/dashboard/workers/${worker.id}`}>Visualizza</Link>
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="rates" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Tariffe</CardTitle>
                </CardHeader>
                <CardContent>
                  {ratesLoading ? (
                    <div className="text-center py-8">
                      <Package className="w-12 h-12 mx-auto mb-4 text-slate-400 dark:text-slate-600 animate-pulse" />
                      <p className="text-slate-600 dark:text-slate-400">Caricamento tariffe...</p>
                    </div>
                  ) : !rates || rates.length === 0 ? (
                    <div className="text-center py-8">
                      <Package className="w-12 h-12 mx-auto mb-4 text-slate-300 dark:text-slate-700" />
                      <p className="text-slate-600 dark:text-slate-400">Nessuna tariffa configurata</p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-slate-50 dark:bg-slate-800/50">
                          <TableHead>Servizio</TableHead>
                          <TableHead>Tipo</TableHead>
                          <TableHead className="text-right">Importo</TableHead>
                          <TableHead>Valida Dal</TableHead>
                          <TableHead>Valida Al</TableHead>
                          <TableHead>Stato</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {rates.map((rate: any) => (
                          <TableRow key={rate.id}>
                            <TableCell className="font-medium">{rate.service_type}</TableCell>
                            <TableCell className="text-slate-600 dark:text-slate-400">
                              {rate.rate_type === 'hourly' && 'Oraria'}
                              {rate.rate_type === 'daily' && 'Giornaliera'}
                              {rate.rate_type === 'weekly' && 'Settimanale'}
                              {rate.rate_type === 'monthly' && 'Mensile'}
                              {rate.rate_type === 'fixed_project' && 'Forfait'}
                            </TableCell>
                            <TableCell className="text-right font-semibold">
                              € {parseFloat(rate.rate_amount).toLocaleString('it-IT', { minimumFractionDigits: 2 })}
                            </TableCell>
                            <TableCell className="text-slate-600 dark:text-slate-400">
                              {rate.valid_from ? new Date(rate.valid_from).toLocaleDateString('it-IT') : '-'}
                            </TableCell>
                            <TableCell className="text-slate-600 dark:text-slate-400">
                              {rate.valid_to ? new Date(rate.valid_to).toLocaleDateString('it-IT') : '-'}
                            </TableCell>
                            <TableCell>
                              {!rate.valid_to || new Date(rate.valid_to) > new Date() ? (
                                <Badge className="bg-green-100 dark:bg-green-950/30 text-green-700 dark:text-green-400">
                                  Attiva
                                </Badge>
                              ) : (
                                <Badge variant="outline">Scaduta</Badge>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </>
        )}
      </Tabs>
    </div>
  );
}
