'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { workersApi } from '@/lib/api/workers';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, Edit, Save, UserCheck, Mail, Phone, MapPin, Briefcase, Calendar, DollarSign, FileText, Users, Building2 } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import { WorkerForm } from '@/components/worker-form';
import { WorkerRateForm } from '@/components/worker-rate-form';
import type { WorkerFormData } from '@/lib/types';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Trash2, Plus, Pencil } from 'lucide-react';

const workerTypeLabels = {
  employee: 'Dipendente',
  freelancer: 'Freelance',
  external: 'Esterno',
} as const;

const contractTypeLabels = {
  permanent: 'Indeterminato',
  fixed_term: 'Determinato',
  seasonal: 'Stagionale',
  project_based: 'A Progetto',
  internship: 'Stage',
} as const;

const rateTypeLabels = {
  hourly: 'Oraria',
  daily: 'Giornaliera',
  weekly: 'Settimanale',
  monthly: 'Mensile',
  fixed_project: 'Progetto Fisso',
} as const;

const rateContextLabels = {
  internal_cost: 'Costo Interno',
  customer_billing: 'Fatturazione Cliente',
  payroll: 'Busta Paga',
} as const;

export default function WorkerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const workerId = parseInt(params.id as string);

  const [editMode, setEditMode] = useState(false);
  const [isRateDialogOpen, setIsRateDialogOpen] = useState(false);
  const [editingRate, setEditingRate] = useState<any | null>(null);
  const [isDeleteRateDialogOpen, setIsDeleteRateDialogOpen] = useState(false);
  const [rateToDelete, setRateToDelete] = useState<any | null>(null);

  const { data: worker, isLoading } = useQuery({
    queryKey: ['worker', workerId],
    queryFn: () => workersApi.getById(workerId),
    enabled: !!workerId,
  });

  const { data: ratesData } = useQuery({
    queryKey: ['worker-rates', workerId],
    queryFn: () => workersApi.getRates(workerId),
    enabled: !!workerId,
  });

  const { data: sitesData } = useQuery({
    queryKey: ['worker-sites', workerId],
    queryFn: () => workersApi.getSites(workerId),
    enabled: !!workerId,
  });

  const rates = ratesData || [];
  const sites = sitesData || [];

  const updateMutation = useMutation({
    mutationFn: (data: any) => workersApi.update(workerId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['worker', workerId] });
      setEditMode(false);
      toast.success('Collaboratore aggiornato con successo');
    },
    onError: (error: any) => {
      toast.error('Errore', {
        description: error.response?.data?.message || 'Impossibile aggiornare il collaboratore',
      });
    },
  });

  const createRateMutation = useMutation({
    mutationFn: (data: any) => workersApi.createRate(workerId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['worker-rates', workerId] });
      setIsRateDialogOpen(false);
      setEditingRate(null);
      toast.success('Tariffa creata con successo');
    },
    onError: (error: any) => {
      toast.error('Errore', {
        description: error.response?.data?.message || 'Impossibile creare la tariffa',
      });
    },
  });

  const deleteRateMutation = useMutation({
    mutationFn: (rateId: number) => workersApi.deleteRate(workerId, rateId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['worker-rates', workerId] });
      setIsDeleteRateDialogOpen(false);
      setRateToDelete(null);
      toast.success('Tariffa eliminata con successo');
    },
    onError: (error: any) => {
      toast.error('Errore', {
        description: error.response?.data?.message || 'Impossibile eliminare la tariffa',
      });
    },
  });

  const handleCreateRate = () => {
    setEditingRate(null);
    setIsRateDialogOpen(true);
  };

  const handleDeleteRate = (rate: any) => {
    setRateToDelete(rate);
    setIsDeleteRateDialogOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <UserCheck className="h-12 w-12 mx-auto mb-4 text-slate-400 dark:text-slate-600 animate-pulse" />
          <p className="text-slate-600 dark:text-slate-400">Caricamento collaboratore...</p>
        </div>
      </div>
    );
  }

  if (!worker) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <UserCheck className="h-12 w-12 mx-auto mb-4 text-red-400" />
          <p className="text-slate-600 dark:text-slate-400">Collaboratore non trovato</p>
          <Button asChild className="mt-4">
            <Link href="/frontend/app/(dashboard)/workers">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Torna alla lista
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push('/workers')}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{worker.display_name}</h1>
              <Badge variant="outline" className="font-mono text-xs">
                {worker.code}
              </Badge>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {workerTypeLabels[worker.worker_type]} • {worker.job_title || 'Nessun ruolo'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {editMode ? (
            <>
              <Button variant="outline" onClick={() => setEditMode(false)}>
                Annulla
              </Button>
              <Button onClick={() => {}} form="worker-form" disabled={updateMutation.isPending}>
                <Save className="mr-2 h-4 w-4" />
                {updateMutation.isPending ? 'Salvataggio...' : 'Salva Modifiche'}
              </Button>
            </>
          ) : (
            <Button onClick={() => setEditMode(true)}>
              <Edit className="mr-2 h-4 w-4" />
              Modifica
            </Button>
          )}
        </div>
      </div>

      {/* Status Badges */}
      <div className="flex gap-2 flex-wrap">
        <Badge className={worker.is_active ? 'bg-green-100 dark:bg-green-950/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800 font-medium text-xs border' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 font-medium text-xs border'}>
          {worker.is_active ? 'Attivo' : 'Inattivo'}
        </Badge>
        <Badge className="bg-blue-100 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800 font-medium text-xs border">
          {workerTypeLabels[worker.worker_type]}
        </Badge>
        {worker.contract_type && (
          <Badge variant="outline" className="font-medium text-xs">
            {contractTypeLabels[worker.contract_type]}
          </Badge>
        )}
        {worker.supplier && (
          <Badge className="bg-orange-100 dark:bg-orange-950/30 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-800 font-medium text-xs border">
            <Building2 className="h-3 w-3 mr-1" />
            {worker.supplier.company_name}
          </Badge>
        )}
      </div>

      <Tabs defaultValue="info" className="space-y-6">
        <TabsList>
          <TabsTrigger value="info">Informazioni</TabsTrigger>
          <TabsTrigger value="rates">Tariffe ({rates.length})</TabsTrigger>
          <TabsTrigger value="sites">Cantieri ({sites.length})</TabsTrigger>
          {worker.worker_type === 'employee' && worker.payroll_data && (
            <TabsTrigger value="payroll">Busta Paga</TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="info" className="space-y-6">
          {editMode ? (
            <Card>
              <CardHeader>
                <CardTitle>Modifica Collaboratore</CardTitle>
              </CardHeader>
              <CardContent>
                <WorkerForm
                  worker={worker}
                  onSubmit={(data: WorkerFormData) => {
                    updateMutation.mutate(data);
                  }}
                  onCancel={() => setEditMode(false)}
                  isLoading={updateMutation.isPending}
                />
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Dati Anagrafici */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <UserCheck className="h-5 w-5" />
                    Dati Anagrafici
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>Nome</Label>
                    <Input
                      value={worker.first_name}
                      disabled
                      className="bg-slate-50 dark:bg-slate-900"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Cognome</Label>
                    <Input
                      value={worker.last_name}
                      disabled
                      className="bg-slate-50 dark:bg-slate-900"
                    />
                  </div>

                  {worker.tax_code && (
                    <div className="space-y-2">
                      <Label>Codice Fiscale</Label>
                      <Input
                        value={worker.tax_code}
                        disabled
                        className="bg-slate-50 dark:bg-slate-900 font-mono"
                      />
                    </div>
                  )}

                  {worker.vat_number && (
                    <div className="space-y-2">
                      <Label>Partita IVA</Label>
                      <Input
                        value={worker.vat_number}
                        disabled
                        className="bg-slate-50 dark:bg-slate-900 font-mono"
                      />
                    </div>
                  )}

                  {worker.birth_date && (
                    <div className="space-y-2">
                      <Label>Data di Nascita</Label>
                      <Input
                        value={format(new Date(worker.birth_date), 'dd/MM/yyyy')}
                        disabled
                        className="bg-slate-50 dark:bg-slate-900"
                      />
                    </div>
                  )}

                  {worker.birth_place && (
                    <div className="space-y-2">
                      <Label>Luogo di Nascita</Label>
                      <Input
                        value={worker.birth_place}
                        disabled
                        className="bg-slate-50 dark:bg-slate-900"
                      />
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Contratto */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Briefcase className="h-5 w-5" />
                    Informazioni Contratto
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>Tipo Collaboratore</Label>
                    <Input
                      value={workerTypeLabels[worker.worker_type]}
                      disabled
                      className="bg-slate-50 dark:bg-slate-900"
                    />
                  </div>
                  {worker.contract_type && (
                    <div className="space-y-2">
                      <Label>Tipo Contratto</Label>
                      <Input
                        value={contractTypeLabels[worker.contract_type]}
                        disabled
                        className="bg-slate-50 dark:bg-slate-900"
                      />
                    </div>
                  )}

                  {worker.job_title && (
                    <div className="space-y-2">
                      <Label>Ruolo</Label>
                      <Input
                        value={worker.job_title}
                        disabled
                        className="bg-slate-50 dark:bg-slate-900"
                      />
                    </div>
                  )}

                  {worker.job_level && (
                    <div className="space-y-2">
                      <Label>Livello</Label>
                      <Input
                        value={worker.job_level}
                        disabled
                        className="bg-slate-50 dark:bg-slate-900"
                      />
                    </div>
                  )}

                  {worker.hire_date && (
                    <div className="space-y-2">
                      <Label>Data Assunzione</Label>
                      <Input
                        value={format(new Date(worker.hire_date), 'dd/MM/yyyy')}
                        disabled
                        className="bg-slate-50 dark:bg-slate-900"
                      />
                    </div>
                  )}

                  {worker.contract_end_date && (
                    <div className="space-y-2">
                      <Label>Fine Contratto</Label>
                      <Input
                        value={format(new Date(worker.contract_end_date), 'dd/MM/yyyy')}
                        disabled
                        className="bg-slate-50 dark:bg-slate-900"
                      />
                    </div>
                  )}

                  {worker.supplier && (
                    <div className="space-y-2 col-span-2">
                      <Label>Fornitore</Label>
                      <Input
                        value={`${worker.supplier.company_name} (${worker.supplier.code})`}
                        disabled
                        className="bg-slate-50 dark:bg-slate-900"
                      />
                    </div>
                  )}

                  {worker.payment_notes && (
                    <div className="space-y-2 col-span-2">
                      <Label>Note Pagamento</Label>
                      <Input
                        value={worker.payment_notes}
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
                  {worker.email && (
                    <div className="space-y-2">
                      <Label>Email</Label>
                      <Input
                        value={worker.email}
                        disabled
                        className="bg-slate-50 dark:bg-slate-900"
                      />
                    </div>
                  )}

                  {worker.phone && (
                    <div className="space-y-2">
                      <Label>Telefono</Label>
                      <Input
                        value={worker.phone}
                        disabled
                        className="bg-slate-50 dark:bg-slate-900"
                      />
                    </div>
                  )}

                  {worker.mobile && (
                    <div className="space-y-2">
                      <Label>Cellulare</Label>
                      <Input
                        value={worker.mobile}
                        disabled
                        className="bg-slate-50 dark:bg-slate-900"
                      />
                    </div>
                  )}

                  {worker.address && (
                    <div className="space-y-2 col-span-2">
                      <Label>Indirizzo Completo</Label>
                      <Input
                        value={`${worker.address}${worker.city ? `, ${worker.city}` : ''}${worker.province ? ` (${worker.province})` : ''}${worker.postal_code ? ` - ${worker.postal_code}` : ''}`}
                        disabled
                        className="bg-slate-50 dark:bg-slate-900"
                      />
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Sicurezza */}
              {(worker.has_safety_training || worker.can_drive_company_vehicles) && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Sicurezza e Abilitazioni
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-2 gap-6">
                    {worker.has_safety_training !== undefined && (
                      <div className="space-y-2">
                        <Label>Formazione Sicurezza</Label>
                        <Input
                          value={worker.has_safety_training ? 'Completata' : 'Non completata'}
                          disabled
                          className="bg-slate-50 dark:bg-slate-900"
                        />
                      </div>
                    )}

                    {worker.safety_training_expires_at && (
                      <div className="space-y-2">
                        <Label>Scadenza Formazione</Label>
                        <Input
                          value={format(new Date(worker.safety_training_expires_at), 'dd/MM/yyyy')}
                          disabled
                          className="bg-slate-50 dark:bg-slate-900"
                        />
                      </div>
                    )}

                    {worker.can_drive_company_vehicles !== undefined && (
                      <div className="space-y-2">
                        <Label>Guida Mezzi Aziendali</Label>
                        <Input
                          value={worker.can_drive_company_vehicles ? 'Autorizzato' : 'Non autorizzato'}
                          disabled
                          className="bg-slate-50 dark:bg-slate-900"
                        />
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {worker.notes && (
                <Card>
                  <CardHeader>
                    <CardTitle>Note</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{worker.notes}</p>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </TabsContent>

        <TabsContent value="rates" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Tariffe
              </CardTitle>
              <Button onClick={handleCreateRate} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Nuova Tariffa
              </Button>
            </CardHeader>
            <CardContent>
              {rates.length === 0 ? (
                <div className="text-center py-8">
                  <DollarSign className="w-12 h-12 mx-auto mb-4 text-slate-300 dark:text-slate-700" />
                  <p className="text-slate-600 dark:text-slate-400">Nessuna tariffa configurata</p>
                  <Button onClick={handleCreateRate} variant="outline" className="mt-4">
                    <Plus className="h-4 w-4 mr-2" />
                    Crea Prima Tariffa
                  </Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
                      <TableHead className="font-semibold text-slate-900 dark:text-slate-100">Contesto</TableHead>
                      <TableHead className="font-semibold text-slate-900 dark:text-slate-100">Tipo</TableHead>
                      <TableHead className="text-right font-semibold text-slate-900 dark:text-slate-100">Importo</TableHead>
                      <TableHead className="font-semibold text-slate-900 dark:text-slate-100">Valida Dal</TableHead>
                      <TableHead className="font-semibold text-slate-900 dark:text-slate-100">Valida Al</TableHead>
                      <TableHead className="font-semibold text-slate-900 dark:text-slate-100">Stato</TableHead>
                      <TableHead className="text-right font-semibold text-slate-900 dark:text-slate-100">Azioni</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rates.map((rate: any) => (
                      <TableRow key={rate.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                        <TableCell className="text-slate-900 dark:text-slate-100">
                          {rateContextLabels[rate.context as keyof typeof rateContextLabels]}
                        </TableCell>
                        <TableCell className="text-slate-900 dark:text-slate-100">
                          {rateTypeLabels[rate.rate_type as keyof typeof rateTypeLabels]}
                        </TableCell>
                        <TableCell className="text-right font-semibold text-slate-900 dark:text-slate-100">
                          € {parseFloat(rate.rate_amount).toLocaleString('it-IT', { minimumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell className="text-slate-600 dark:text-slate-400">
                          {format(new Date(rate.valid_from), 'dd/MM/yyyy')}
                        </TableCell>
                        <TableCell className="text-slate-600 dark:text-slate-400">
                          {rate.valid_to ? format(new Date(rate.valid_to), 'dd/MM/yyyy') : '-'}
                        </TableCell>
                        <TableCell>
                          {rate.is_current ? (
                            <Badge className="bg-green-100 dark:bg-green-950/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800">
                              Corrente
                            </Badge>
                          ) : (
                            <Badge variant="outline">Storica</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteRate(rate)}
                              className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-950/30"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
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
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Cantieri Assegnati
              </CardTitle>
            </CardHeader>
            <CardContent>
              {sites.length === 0 ? (
                <div className="text-center py-8">
                  <MapPin className="w-12 h-12 mx-auto mb-4 text-slate-300 dark:text-slate-700" />
                  <p className="text-slate-600 dark:text-slate-400">Nessun cantiere assegnato</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
                      <TableHead className="font-semibold text-slate-900 dark:text-slate-100">Codice</TableHead>
                      <TableHead className="font-semibold text-slate-900 dark:text-slate-100">Nome Cantiere</TableHead>
                      <TableHead className="font-semibold text-slate-900 dark:text-slate-100">Ruolo</TableHead>
                      <TableHead className="font-semibold text-slate-900 dark:text-slate-100">Dal</TableHead>
                      <TableHead className="font-semibold text-slate-900 dark:text-slate-100">Al</TableHead>
                      <TableHead className="text-right font-semibold text-slate-900 dark:text-slate-100">Azioni</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sites.map((site: any) => (
                      <TableRow key={site.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                        <TableCell className="font-mono text-sm text-slate-900 dark:text-slate-100">{site.code}</TableCell>
                        <TableCell className="text-slate-900 dark:text-slate-100">{site.name}</TableCell>
                        <TableCell className="text-slate-600 dark:text-slate-400">
                          {site.pivot?.site_role || '-'}
                        </TableCell>
                        <TableCell className="text-slate-600 dark:text-slate-400">
                          {site.pivot?.assigned_from ? format(new Date(site.pivot.assigned_from), 'dd/MM/yyyy') : '-'}
                        </TableCell>
                        <TableCell className="text-slate-600 dark:text-slate-400">
                          {site.pivot?.assigned_to ? format(new Date(site.pivot.assigned_to), 'dd/MM/yyyy') : '-'}
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

        {worker.worker_type === 'employee' && worker.payroll_data && (
          <TabsContent value="payroll" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Dati Busta Paga
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-6">
                {worker.payroll_data.gross_monthly_salary && (
                  <div className="space-y-2">
                    <Label>Stipendio Mensile Lordo</Label>
                    <Input
                      value={`€ ${Number(worker.payroll_data.gross_monthly_salary).toLocaleString('it-IT', { minimumFractionDigits: 2 })}`}
                      disabled
                      className="bg-slate-50 dark:bg-slate-900 font-semibold"
                    />
                  </div>
                )}

                {worker.payroll_data.net_monthly_salary && (
                  <div className="space-y-2">
                    <Label>Stipendio Mensile Netto</Label>
                    <Input
                      value={`€ ${Number(worker.payroll_data.net_monthly_salary).toLocaleString('it-IT', { minimumFractionDigits: 2 })}`}
                      disabled
                      className="bg-slate-50 dark:bg-slate-900 font-semibold"
                    />
                  </div>
                )}

                {worker.payroll_data.contract_level && (
                  <div className="space-y-2">
                    <Label>Livello Contrattuale</Label>
                    <Input
                      value={worker.payroll_data.contract_level}
                      disabled
                      className="bg-slate-50 dark:bg-slate-900"
                    />
                  </div>
                )}

                {worker.payroll_data.ccnl_type && (
                  <div className="space-y-2">
                    <Label>CCNL</Label>
                    <Input
                      value={worker.payroll_data.ccnl_type}
                      disabled
                      className="bg-slate-50 dark:bg-slate-900"
                    />
                  </div>
                )}

                {worker.payroll_data.payroll_frequency && (
                  <div className="space-y-2">
                    <Label>Frequenza Pagamento</Label>
                    <Input
                      value={worker.payroll_data.payroll_frequency}
                      disabled
                      className="bg-slate-50 dark:bg-slate-900"
                    />
                  </div>
                )}

                {worker.payroll_data.iban && (
                  <div className="space-y-2 col-span-2">
                    <Label>IBAN</Label>
                    <Input
                      value={worker.payroll_data.iban}
                      disabled
                      className="bg-slate-50 dark:bg-slate-900 font-mono"
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>

      {/* Rate Dialog */}
      <Dialog open={isRateDialogOpen} onOpenChange={setIsRateDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingRate ? 'Modifica Tariffa' : 'Nuova Tariffa'}
            </DialogTitle>
            <DialogDescription>
              {editingRate
                ? 'Modifica i dettagli della tariffa esistente'
                : 'Crea una nuova tariffa per questo collaboratore'
              }
            </DialogDescription>
          </DialogHeader>
          <WorkerRateForm
            rate={editingRate}
            onSubmit={(data) => createRateMutation.mutate(data)}
            onCancel={() => {
              setIsRateDialogOpen(false);
              setEditingRate(null);
            }}
            isLoading={createRateMutation.isPending}
          />
          <div className="flex justify-end gap-2 pt-4 border-t border-slate-200 dark:border-slate-700">
            <Button
              variant="outline"
              onClick={() => {
                setIsRateDialogOpen(false);
                setEditingRate(null);
              }}
              disabled={createRateMutation.isPending}
            >
              Annulla
            </Button>
            <Button
              type="submit"
              form="worker-rate-form"
              disabled={createRateMutation.isPending}
            >
              {createRateMutation.isPending ? 'Salvataggio...' : 'Salva'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Rate Confirmation Dialog */}
      <AlertDialog open={isDeleteRateDialogOpen} onOpenChange={setIsDeleteRateDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Conferma Eliminazione</AlertDialogTitle>
            <AlertDialogDescription>
              Sei sicuro di voler eliminare questa tariffa? Questa azione non può essere annullata.
              {rateToDelete && (
                <div className="mt-4 p-3 bg-slate-50 dark:bg-slate-800 rounded-md">
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                    {rateContextLabels[rateToDelete.context as keyof typeof rateContextLabels]} - {rateTypeLabels[rateToDelete.rate_type as keyof typeof rateTypeLabels]}
                  </p>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                    Importo: € {parseFloat(rateToDelete.rate_amount).toLocaleString('it-IT', { minimumFractionDigits: 2 })}
                  </p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Valida dal: {format(new Date(rateToDelete.valid_from), 'dd/MM/yyyy')}
                  </p>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteRateMutation.isPending}>
              Annulla
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => rateToDelete && deleteRateMutation.mutate(rateToDelete.id)}
              disabled={deleteRateMutation.isPending}
              className="bg-red-600 hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-700"
            >
              {deleteRateMutation.isPending ? 'Eliminazione...' : 'Elimina'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
