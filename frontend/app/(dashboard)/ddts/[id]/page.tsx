'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ddtsApi } from '@/lib/api/ddts';
import type { Ddt, DdtType, DdtStatus, ReturnReason } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  TruckIcon,
  Package,
  AlertTriangle,
  FileText,
} from 'lucide-react';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import Link from 'next/link';
import { toast } from 'sonner';

const ddtTypeLabels: Record<DdtType, string> = {
  incoming: 'Carico da Fornitore',
  outgoing: 'Scarico a Cliente/Cantiere',
  internal: 'Trasferimento Interno',
  rental_out: 'Noleggio Uscita',
  rental_return: 'Noleggio Rientro',
  return_from_customer: 'Reso da Cliente',
  return_to_supplier: 'Reso a Fornitore',
};

const ddtTypeColors: Record<DdtType, string> = {
  incoming: 'bg-green-100 text-green-700 border-green-200',
  outgoing: 'bg-blue-100 text-blue-700 border-blue-200',
  internal: 'bg-purple-100 text-purple-700 border-purple-200',
  rental_out: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  rental_return: 'bg-cyan-100 text-cyan-700 border-cyan-200',
  return_from_customer: 'bg-orange-100 text-orange-700 border-orange-200',
  return_to_supplier: 'bg-red-100 text-red-700 border-red-200',
};

const ddtStatusLabels: Record<DdtStatus, string> = {
  draft: 'Bozza',
  issued: 'Emesso',
  in_transit: 'In Transito',
  delivered: 'Consegnato',
  cancelled: 'Annullato',
};

const ddtStatusColors: Record<DdtStatus, string> = {
  draft: 'bg-slate-100 text-slate-700',
  issued: 'bg-blue-100 text-blue-700',
  in_transit: 'bg-yellow-100 text-yellow-700',
  delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
};

const returnReasonLabels: Record<ReturnReason, string> = {
  defective: 'Difettoso',
  wrong_item: 'Articolo Errato',
  excess: 'Eccesso',
  warranty: 'Garanzia',
  customer_dissatisfaction: 'Insoddisfazione Cliente',
  other: 'Altro',
};

export default function DdtDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const ddtId = parseInt(params.id as string);

  // Fetch DDT details
  const { data: ddt, isLoading } = useQuery<Ddt>({
    queryKey: ['ddt', ddtId],
    queryFn: () => ddtsApi.getById(ddtId),
  });

  // Confirm mutation
  const confirmMutation = useMutation({
    mutationFn: () => ddtsApi.confirm(ddtId),
    onSuccess: () => {
      toast.success('DDT Confermato', {
        description: 'Il DDT è stato confermato e i movimenti di magazzino sono stati generati automaticamente.',
      });
      queryClient.invalidateQueries({ queryKey: ['ddt', ddtId] });
      queryClient.invalidateQueries({ queryKey: ['ddts'] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['stock-movements'] });
    },
    onError: (error: any) => {
      toast.error('Errore', {
        description: error.response?.data?.message || 'Impossibile confermare il DDT',
      });
    },
  });

  // Cancel mutation
  const cancelMutation = useMutation({
    mutationFn: () => ddtsApi.cancel(ddtId),
    onSuccess: () => {
      toast.success('DDT Annullato', {
        description: 'Il DDT è stato annullato e i movimenti sono stati rollback.',
      });
      queryClient.invalidateQueries({ queryKey: ['ddt', ddtId] });
      queryClient.invalidateQueries({ queryKey: ['ddts'] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['stock-movements'] });
    },
    onError: (error: any) => {
      toast.error('Errore', {
        description:
          error.response?.data?.message || 'Impossibile annullare il DDT (forse è già stato consegnato?)',
      });
    },
  });

  // Mark as delivered mutation
  const markDeliveredMutation = useMutation({
    mutationFn: () => ddtsApi.markAsDelivered(ddtId),
    onSuccess: () => {
      toast.success('DDT Consegnato', {
        description: 'Il DDT è stato marcato come consegnato.',
      });
      queryClient.invalidateQueries({ queryKey: ['ddt', ddtId] });
      queryClient.invalidateQueries({ queryKey: ['ddts'] });
    },
    onError: (error: any) => {
      toast.error('Errore', {
        description: error.response?.data?.message || 'Impossibile marcare come consegnato',
      });
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Package className="h-12 w-12 mx-auto mb-4 text-slate-400 animate-pulse" />
          <p className="text-slate-600">Caricamento DDT...</p>
        </div>
      </div>
    );
  }

  if (!ddt) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-red-400" />
          <p className="text-slate-600">DDT non trovato</p>
          <Button asChild className="mt-4">
            <Link href="/frontend/app/(dashboard)/ddts">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Torna alla lista
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" asChild>
            <Link href="/frontend/app/(dashboard)/ddts">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Indietro
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">{ddt.code}</h1>
            <p className="text-slate-600 mt-1">Dettaglio Documento Di Trasporto</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge className={ddtStatusColors[ddt.status]}>{ddtStatusLabels[ddt.status]}</Badge>
          <Badge variant="outline" className={ddtTypeColors[ddt.type]}>
            {ddtTypeLabels[ddt.type]}
          </Badge>
        </div>
      </div>

      {/* Critical Actions - PULSANTE A PROVA DI SCEMO */}
      {ddt.can_be_confirmed && (
        <Card className="border-2 border-green-300 bg-green-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-900">
              <AlertTriangle className="h-5 w-5" />
              Azione Richiesta: Conferma DDT
            </CardTitle>
            <CardDescription className="text-green-800">
              Questo DDT è in bozza e deve essere confermato per generare i movimenti di magazzino.{' '}
              <strong>Attenzione: questa azione è irreversibile dopo la consegna fisica!</strong>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  size="lg"
                  className="bg-green-600 hover:bg-green-700 text-white font-semibold"
                  disabled={confirmMutation.isPending}
                >
                  <CheckCircle2 className="h-5 w-5 mr-2" />
                  {confirmMutation.isPending ? 'Conferma in corso...' : 'Conferma DDT e Genera Movimenti'}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Sei assolutamente sicuro?</AlertDialogTitle>
                  <AlertDialogDescription className="space-y-2">
                    <p>
                      Confermando questo DDT verranno <strong>automaticamente generati</strong> i
                      seguenti movimenti di magazzino:
                    </p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>
                        <strong>Carico/Scarico</strong> automatico in base al tipo di DDT
                      </li>
                      <li>
                        <strong>Aggiornamento quantità</strong> disponibile/riservata/quarantena
                      </li>
                      <li>
                        <strong>Registrazione movimenti</strong> nello storico
                      </li>
                    </ul>
                    <p className="text-red-600 font-semibold mt-4">
                      ⚠️ Potrai annullare solo se il materiale NON è ancora stato consegnato
                      fisicamente!
                    </p>
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Annulla, non confermare</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => confirmMutation.mutate()}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    Sì, conferma e genera movimenti
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardContent>
        </Card>
      )}

      {/* Cancel Action */}
      {ddt.can_be_cancelled && ddt.status === 'issued' && (
        <Card className="border-2 border-red-300 bg-red-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-900">
              <XCircle className="h-5 w-5" />
              Annulla DDT
            </CardTitle>
            <CardDescription className="text-red-800">
              Puoi annullare questo DDT perché il materiale non è ancora stato consegnato
              fisicamente. Tutti i movimenti verranno rollback.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="destructive"
                  size="lg"
                  disabled={cancelMutation.isPending}
                >
                  <XCircle className="h-5 w-5 mr-2" />
                  {cancelMutation.isPending ? 'Annullamento...' : 'Annulla DDT e Rollback Movimenti'}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Confermi l'annullamento?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Annullando questo DDT, tutti i movimenti di magazzino generati verranno
                    automaticamente rollback. Il DDT passerà allo stato "Annullato".
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>No, mantieni attivo</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => cancelMutation.mutate()}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    Sì, annulla DDT
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardContent>
        </Card>
      )}

      {/* Mark as Delivered Action */}
      {ddt.status === 'issued' && !ddt.delivered_at && (
        <Card className="border-2 border-blue-300 bg-blue-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-900">
              <TruckIcon className="h-5 w-5" />
              Marca come Consegnato
            </CardTitle>
            <CardDescription className="text-blue-800">
              Una volta marcato come consegnato, <strong>NON potrai più annullare</strong> questo DDT.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button size="lg" disabled={markDeliveredMutation.isPending}>
                  <Package className="h-5 w-5 mr-2" />
                  {markDeliveredMutation.isPending ? 'Salvataggio...' : 'Marca come Consegnato'}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Materiale consegnato fisicamente?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Conferma che il materiale è stato consegnato fisicamente alla destinazione.
                    Dopo questa azione NON sarà più possibile annullare il DDT.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>No, non ancora</AlertDialogCancel>
                  <AlertDialogAction onClick={() => markDeliveredMutation.mutate()}>
                    Sì, consegnato
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardContent>
        </Card>
      )}

      {/* DDT Information */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* General Info */}
        <Card>
          <CardHeader>
            <CardTitle>Informazioni Generali</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <label className="text-sm font-medium text-slate-600">Numero DDT</label>
              <p className="text-lg font-semibold">{ddt.ddt_number}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-600">Data DDT</label>
              <p>{format(new Date(ddt.ddt_date), 'dd/MM/yyyy', { locale: it })}</p>
            </div>
            {ddt.transport_date && (
              <div>
                <label className="text-sm font-medium text-slate-600">Data Trasporto</label>
                <p>{format(new Date(ddt.transport_date), 'dd/MM/yyyy', { locale: it })}</p>
              </div>
            )}
            {ddt.delivered_at && (
              <div>
                <label className="text-sm font-medium text-slate-600">Data Consegna</label>
                <p className="text-green-700 font-medium">
                  {format(new Date(ddt.delivered_at), "dd/MM/yyyy 'alle' HH:mm", { locale: it })}
                </p>
              </div>
            )}
            {ddt.carrier_name && (
              <div>
                <label className="text-sm font-medium text-slate-600">Vettore</label>
                <p>{ddt.carrier_name}</p>
              </div>
            )}
            {ddt.tracking_number && (
              <div>
                <label className="text-sm font-medium text-slate-600">Numero Tracking</label>
                <p className="font-mono text-sm">{ddt.tracking_number}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Parties Involved */}
        <Card>
          <CardHeader>
            <CardTitle>Parti Coinvolte</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {ddt.supplier && (
              <div>
                <label className="text-sm font-medium text-slate-600">Fornitore</label>
                <p className="text-lg font-semibold">{ddt.supplier.name}</p>
                <p className="text-sm text-slate-500">{ddt.supplier.code}</p>
              </div>
            )}
            {ddt.customer && (
              <div>
                <label className="text-sm font-medium text-slate-600">Cliente</label>
                <p className="text-lg font-semibold">{ddt.customer.name}</p>
                <p className="text-sm text-slate-500">{ddt.customer.code}</p>
              </div>
            )}
            {ddt.site && (
              <div>
                <label className="text-sm font-medium text-slate-600">Cantiere</label>
                <p className="text-lg font-semibold">{ddt.site.name}</p>
                <p className="text-sm text-slate-500">{ddt.site.code}</p>
              </div>
            )}
            {ddt.from_warehouse && (
              <div>
                <label className="text-sm font-medium text-slate-600">Da Magazzino</label>
                <p className="font-semibold">{ddt.from_warehouse.name}</p>
                <p className="text-sm text-slate-500">{ddt.from_warehouse.code}</p>
              </div>
            )}
            {ddt.to_warehouse && (
              <div>
                <label className="text-sm font-medium text-slate-600">A Magazzino</label>
                <p className="font-semibold">{ddt.to_warehouse.name}</p>
                <p className="text-sm text-slate-500">{ddt.to_warehouse.code}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Rental Info (if applicable) */}
      {(ddt.rental_start_date || ddt.rental_end_date) && (
        <Card>
          <CardHeader>
            <CardTitle>Informazioni Noleggio</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-3">
            {ddt.rental_start_date && (
              <div>
                <label className="text-sm font-medium text-slate-600">Data Inizio</label>
                <p>{format(new Date(ddt.rental_start_date), 'dd/MM/yyyy', { locale: it })}</p>
              </div>
            )}
            {ddt.rental_end_date && (
              <div>
                <label className="text-sm font-medium text-slate-600">Data Fine Prevista</label>
                <p>{format(new Date(ddt.rental_end_date), 'dd/MM/yyyy', { locale: it })}</p>
              </div>
            )}
            {ddt.rental_actual_return_date && (
              <div>
                <label className="text-sm font-medium text-slate-600">Data Rientro Effettiva</label>
                <p className="text-green-700 font-medium">
                  {format(new Date(ddt.rental_actual_return_date), 'dd/MM/yyyy', { locale: it })}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Return Info (if applicable) */}
      {ddt.return_reason && (
        <Card className="border-orange-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              Informazioni Reso
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <label className="text-sm font-medium text-slate-600">Motivo Reso</label>
              <Badge className="bg-orange-100 text-orange-700">
                {returnReasonLabels[ddt.return_reason]}
              </Badge>
            </div>
            {ddt.return_notes && (
              <div>
                <label className="text-sm font-medium text-slate-600">Note Reso</label>
                <p className="text-slate-700">{ddt.return_notes}</p>
              </div>
            )}
            {(['defective', 'warranty'] as ReturnReason[]).includes(ddt.return_reason) && (
              <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
                <p className="text-sm text-yellow-800 font-medium">
                  ⚠️ Materiale marcato come difettoso: verrà messo in QUARANTENA automaticamente
                  alla conferma del DDT
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Items */}
      <Card>
        <CardHeader>
          <CardTitle>Articoli ({ddt.total_items})</CardTitle>
          <CardDescription>
            Quantità totale: <strong>{ddt.total_quantity.toFixed(2)}</strong>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Codice</TableHead>
                <TableHead>Articolo</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead className="text-right">Quantità</TableHead>
                <TableHead>Unità</TableHead>
                <TableHead className="text-right">Costo Unit.</TableHead>
                <TableHead className="text-right">Totale</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ddt.items?.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-mono text-sm">{item.material?.code}</TableCell>
                  <TableCell className="font-medium">{item.material?.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{item.material?.category}</Badge>
                  </TableCell>
                  <TableCell className="text-right font-semibold">{item.quantity}</TableCell>
                  <TableCell>{item.unit}</TableCell>
                  <TableCell className="text-right">
                    {Number(item.unit_cost) > 0 ? `€ ${Number(item.unit_cost).toFixed(2)}` : '-'}
                  </TableCell>
                  <TableCell className="text-right font-semibold">
                    {Number(item.total_cost) > 0 ? `€ ${Number(item.total_cost).toFixed(2)}` : '-'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Notes */}
      {ddt.notes && (
        <Card>
          <CardHeader>
            <CardTitle>Note</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-700 whitespace-pre-wrap">{ddt.notes}</p>
          </CardContent>
        </Card>
      )}

      {/* Stock Movements */}
      {ddt.stock_movements_count && ddt.stock_movements_count > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Movimenti di Magazzino Generati</CardTitle>
            <CardDescription>
              Questo DDT ha generato {ddt.stock_movements_count} movimenti automatici
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" asChild>
              <Link href="/frontend/app/(dashboard)/stock-movements">
                <FileText className="h-4 w-4 mr-2" />
                Visualizza Movimenti
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Metadata */}
      <Card>
        <CardHeader>
          <CardTitle>Metadati</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          <div>
            <label className="text-sm font-medium text-slate-600">Creato da</label>
            <p>{ddt.created_by_user?.name || `ID ${ddt.created_by}`}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-slate-600">Data Creazione</label>
            <p>{format(new Date(ddt.created_at), "dd/MM/yyyy 'alle' HH:mm", { locale: it })}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-slate-600">Ultimo Aggiornamento</label>
            <p>{format(new Date(ddt.updated_at), "dd/MM/yyyy 'alle' HH:mm", { locale: it })}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
