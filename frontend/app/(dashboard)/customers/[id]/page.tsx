'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { customersApi } from '@/lib/api/customers';
import { quotesApi } from '@/lib/api/quotes';
import { sitesApi } from '@/lib/api/sites';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CustomerForm } from '@/components/customer-form';
import { ArrowLeft, Edit, Save, User, Building2, FileText, MapPin, Mail } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';

export default function CustomerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const customerId = parseInt(params.id as string);

  const [editMode, setEditMode] = useState(false);

  const { data: customer, isLoading } = useQuery({
    queryKey: ['customer', customerId],
    queryFn: () => customersApi.getById(customerId),
    enabled: !!customerId,
  });

  const { data: quotesData } = useQuery({
    queryKey: ['customer-quotes', customerId],
    queryFn: () => quotesApi.getAll({ customer_id: customerId, per_page: 50 }),
    enabled: !!customerId,
  });

  const { data: sitesData } = useQuery({
    queryKey: ['customer-sites', customerId],
    queryFn: () => sitesApi.getAll({ customer_id: customerId, per_page: 50 }),
    enabled: !!customerId,
  });

  const quotes = quotesData?.data ?? [];
  const sites = sitesData?.data ?? [];

  const updateMutation = useMutation({
    mutationFn: (data: any) => customersApi.update(customerId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer', customerId] });
      setEditMode(false);
      toast.success('Cliente aggiornato con successo');
    },
    onError: (error: any) => {
      toast.error('Errore', {
        description: error.response?.data?.message || 'Impossibile aggiornare il cliente',
      });
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <User className="h-12 w-12 mx-auto mb-4 text-slate-400 dark:text-slate-600 animate-pulse" />
          <p className="text-slate-600 dark:text-slate-400">Caricamento cliente...</p>
        </div>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <User className="h-12 w-12 mx-auto mb-4 text-red-400" />
          <p className="text-slate-600 dark:text-slate-400">Cliente non trovato</p>
          <Button asChild className="mt-4">
            <Link href="/customers">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Torna alla lista
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  const Icon = customer.type === 'company' ? Building2 : User;

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push('/customers')}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-2xl font-bold">{customer.display_name}</h1>
            </div>
            <p className="text-sm text-slate-500">{customer.type === 'company' ? 'Azienda' : 'Privato'}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {editMode ? (
            <>
              <Button variant="outline" onClick={() => setEditMode(false)}>
                Annulla
              </Button>
              <Button onClick={() => {}} form="customer-form" disabled={updateMutation.isPending}>
                <Save className="mr-2 h-4 w-4" />
                {updateMutation.isPending ? 'Salvataggio...' : 'Salva Modifiche'}
              </Button>
            </>
          ) : (
            <Button onClick={() => setEditMode(true)}>Modifica</Button>
          )}
        </div>
      </div>

      {/* Status Badges */}
      <div className="flex gap-2 flex-wrap">
        <Badge className={customer.is_active ? 'bg-green-100 dark:bg-green-950/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800 font-medium text-xs border' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 font-medium text-xs border'}>
          {customer.is_active ? 'Attivo' : 'Inattivo'}
        </Badge>
        <Badge className={customer.type === 'company' ? 'bg-blue-100 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800 font-medium text-xs border' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 font-medium text-xs border'}>
          {customer.type === 'company' ? 'Azienda' : 'Privato'}
        </Badge>
      </div>

      <Tabs defaultValue="info" className="space-y-6">
        <TabsList>
          <TabsTrigger value="info">Informazioni</TabsTrigger>
          <TabsTrigger value="quotes">Preventivi ({quotes.length})</TabsTrigger>
          <TabsTrigger value="sites">Cantieri ({sites.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="info" className="space-y-6">
          {editMode ? (
            <Card>
              <CardHeader>
                <CardTitle>Modifica Cliente</CardTitle>
              </CardHeader>
              <CardContent>
                <CustomerForm
                  id="customer-form"
                  customer={customer}
                  onSubmit={(data) => updateMutation.mutate(data)}
                  isLoading={updateMutation.isPending}
                />
                <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-slate-200 dark:border-slate-800">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setEditMode(false)}
                    disabled={updateMutation.isPending}
                  >
                    Annulla
                  </Button>
                  <Button
                    type="submit"
                    form="customer-form"
                    disabled={updateMutation.isPending}
                  >
                    {updateMutation.isPending ? 'Salvataggio...' : 'Salva Modifiche'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Dati Anagrafici */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {Icon && <Icon className="h-5 w-5" />}
                    Dati Anagrafici
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>Tipo Cliente</Label>
                    <Input
                      value={customer.type === 'company' ? 'Azienda' : 'Privato'}
                      disabled
                      className="bg-slate-50 dark:bg-slate-900"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Stato</Label>
                    <Input
                      value={customer.is_active ? 'Attivo' : 'Inattivo'}
                      disabled
                      className="bg-slate-50 dark:bg-slate-900"
                    />
                  </div>

                  {customer.type === 'company' ? (
                    <div className="space-y-2 col-span-2">
                      <Label>Ragione Sociale</Label>
                      <Input
                        value={customer.company_name || ''}
                        disabled
                        className="bg-slate-50 dark:bg-slate-900"
                      />
                    </div>
                  ) : (
                    <>
                      <div className="space-y-2">
                        <Label>Nome</Label>
                        <Input
                          value={customer.first_name || ''}
                          disabled
                          className="bg-slate-50 dark:bg-slate-900"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Cognome</Label>
                        <Input
                          value={customer.last_name || ''}
                          disabled
                          className="bg-slate-50 dark:bg-slate-900"
                        />
                      </div>
                    </>
                  )}

                  {customer.vat_number && (
                    <div className="space-y-2">
                      <Label>Partita IVA</Label>
                      <Input
                        value={customer.vat_number}
                        disabled
                        className="bg-slate-50 dark:bg-slate-900"
                      />
                    </div>
                  )}

                  {customer.tax_code && (
                    <div className="space-y-2">
                      <Label>Codice Fiscale</Label>
                      <Input
                        value={customer.tax_code}
                        disabled
                        className="bg-slate-50 dark:bg-slate-900"
                      />
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
                  {customer.email && (
                    <div className="space-y-2">
                      <Label>Email</Label>
                      <Input
                        value={customer.email}
                        disabled
                        className="bg-slate-50 dark:bg-slate-900"
                      />
                    </div>
                  )}

                  {customer.phone && (
                    <div className="space-y-2">
                      <Label>Telefono</Label>
                      <Input
                        value={customer.phone}
                        disabled
                        className="bg-slate-50 dark:bg-slate-900"
                      />
                    </div>
                  )}

                  {customer.mobile && (
                    <div className="space-y-2">
                      <Label>Cellulare</Label>
                      <Input
                        value={customer.mobile}
                        disabled
                        className="bg-slate-50 dark:bg-slate-900"
                      />
                    </div>
                  )}

                  {customer.address && (
                    <div className="space-y-2 col-span-2">
                      <Label>Indirizzo Completo</Label>
                      <Input
                        value={`${customer.address}${customer.city ? `, ${customer.city}` : ''}${customer.province ? ` (${customer.province})` : ''}${customer.postal_code ? ` - ${customer.postal_code}` : ''}`}
                        disabled
                        className="bg-slate-50 dark:bg-slate-900"
                      />
                    </div>
                  )}
                </CardContent>
              </Card>

              {customer.notes && (
                <Card>
                  <CardHeader>
                    <CardTitle>Note</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{customer.notes}</p>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </TabsContent>

        <TabsContent value="quotes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Preventivi</CardTitle>
            </CardHeader>
            <CardContent>
              {quotes.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="w-12 h-12 mx-auto mb-4 text-slate-300 dark:text-slate-700" />
                  <p className="text-slate-600 dark:text-slate-400">Nessun preventivo associato</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
                      <TableHead className="font-semibold text-slate-900 dark:text-slate-100">Codice</TableHead>
                      <TableHead className="font-semibold text-slate-900 dark:text-slate-100">Titolo</TableHead>
                      <TableHead className="font-semibold text-slate-900 dark:text-slate-100">Data</TableHead>
                      <TableHead className="text-right font-semibold text-slate-900 dark:text-slate-100">Importo</TableHead>
                      <TableHead className="text-right font-semibold text-slate-900 dark:text-slate-100">Azioni</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {quotes.map((quote: any) => (
                      <TableRow key={quote.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                        <TableCell className="font-mono text-sm text-slate-900 dark:text-slate-100">{quote.code}</TableCell>
                        <TableCell className="text-slate-900 dark:text-slate-100">{quote.title}</TableCell>
                        <TableCell className="text-slate-600 dark:text-slate-400">
                          {format(new Date(quote.issue_date), 'dd MMM yyyy', { locale: it })}
                        </TableCell>
                        <TableCell className="text-right font-semibold text-slate-900 dark:text-slate-100">
                          € {parseFloat(quote.total_amount).toLocaleString('it-IT', { minimumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm" asChild>
                            <Link href={`/frontend/app/(dashboard)/quotes/${quote.id}`}>Visualizza</Link>
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

        <TabsContent value="sites" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Cantieri</CardTitle>
            </CardHeader>
            <CardContent>
              {sites.length === 0 ? (
                <div className="text-center py-8">
                  <MapPin className="w-12 h-12 mx-auto mb-4 text-slate-300 dark:text-slate-700" />
                  <p className="text-slate-600 dark:text-slate-400">Nessun cantiere associato</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
                      <TableHead className="font-semibold text-slate-900 dark:text-slate-100">Codice</TableHead>
                      <TableHead className="font-semibold text-slate-900 dark:text-slate-100">Nome</TableHead>
                      <TableHead className="font-semibold text-slate-900 dark:text-slate-100">Città</TableHead>
                      <TableHead className="font-semibold text-slate-900 dark:text-slate-100">Stato</TableHead>
                      <TableHead className="text-right font-semibold text-slate-900 dark:text-slate-100">Azioni</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sites.map((site: any) => (
                      <TableRow key={site.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                        <TableCell className="font-mono text-sm text-slate-900 dark:text-slate-100">{site.code}</TableCell>
                        <TableCell className="text-slate-900 dark:text-slate-100">{site.name}</TableCell>
                        <TableCell className="text-slate-600 dark:text-slate-400">{site.city || '-'}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{site.status}</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm" asChild>
                            <Link href={`/frontend/app/(dashboard)/sites/${site.id}`}>Visualizza</Link>
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
      </Tabs>
    </div>
  );
}

