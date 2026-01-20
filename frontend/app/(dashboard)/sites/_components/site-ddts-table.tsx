'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { sitesApi } from '@/lib/api/sites';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle, Eye, FileText } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';

interface SiteDdtsTableProps {
  siteId: number;
}

export function SiteDdtsTable({ siteId }: SiteDdtsTableProps) {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Fetch DDTs
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['site-ddts', siteId, statusFilter],
    queryFn: () => sitesApi.getDdts(siteId, statusFilter !== 'all' ? { status: statusFilter } : {}),
  });

  const ddts = data?.data || [];
  const meta = data?.meta || { total: 0, pending: 0, confirmed: 0 };

  // Confirm mutation
  const confirmMutation = useMutation({
    mutationFn: (ddtId: number) => sitesApi.confirmDdt(siteId, ddtId),
    onSuccess: () => {
      toast.success('DDT confermato', {
        description: 'Il DDT è stato confermato e i materiali sono stati scaricati dal magazzino.',
      });
      queryClient.invalidateQueries({ queryKey: ['site-ddts', siteId] });
      queryClient.invalidateQueries({ queryKey: ['site-materials', siteId] });
    },
    onError: (error: any) => {
      toast.error('Errore', {
        description: error.response?.data?.message || 'Impossibile confermare il DDT',
      });
    },
  });

  const getStatusBadge = (status: string) => {
    const config = {
      draft: { label: 'Bozza', color: 'bg-gray-100 text-gray-700 border-gray-200' },
      issued: { label: 'Emesso', color: 'bg-amber-100 text-amber-700 border-amber-200' },
      in_transit: { label: 'In Transito', color: 'bg-blue-100 text-blue-700 border-blue-200' },
      delivered: { label: 'Consegnato', color: 'bg-green-100 text-green-700 border-green-200' },
      cancelled: { label: 'Annullato', color: 'bg-gray-100 text-gray-700 border-gray-200' },
    };

    const { label, color } = config[status as keyof typeof config] || config.draft;

    return (
      <Badge variant="outline" className={color}>
        {label}
      </Badge>
    );
  };

  const getTypeBadge = (type: string) => {
    const config = {
      incoming: { label: 'Carico', color: 'bg-blue-100 text-blue-700' },
      outgoing: { label: 'Scarico', color: 'bg-purple-100 text-purple-700' },
      internal: { label: 'Trasferimento', color: 'bg-indigo-100 text-indigo-700' },
      rental_out: { label: 'Noleggio Uscita', color: 'bg-orange-100 text-orange-700' },
      rental_return: { label: 'Noleggio Rientro', color: 'bg-teal-100 text-teal-700' },
      return_from_customer: { label: 'Reso Cliente', color: 'bg-pink-100 text-pink-700' },
      return_to_supplier: { label: 'Reso Fornitore', color: 'bg-cyan-100 text-cyan-700' },
    };

    const { label, color } = config[type as keyof typeof config] || { label: type, color: 'bg-gray-100 text-gray-700' };

    return (
      <Badge variant="secondary" className={color}>
        {label}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-sm text-muted-foreground">Caricamento DDT...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Filtra:</span>
        <Button
          variant={statusFilter === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setStatusFilter('all')}
        >
          Tutti ({meta.total})
        </Button>
        <Button
          variant={statusFilter === 'issued' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setStatusFilter('issued')}
        >
          Emessi ({meta.issued || 0})
        </Button>
        <Button
          variant={statusFilter === 'delivered' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setStatusFilter('delivered')}
        >
          Consegnati ({meta.delivered || 0})
        </Button>
      </div>

      {/* Table */}
      {ddts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center border rounded-lg">
          <FileText className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Nessun DDT</h3>
          <p className="text-sm text-muted-foreground">
            Non ci sono DDT per questo cantiere
          </p>
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Numero DDT</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Data</TableHead>
                <TableHead className="text-right">Articoli</TableHead>
                <TableHead>Stato</TableHead>
                <TableHead className="text-right">Azioni</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ddts.map((ddt: any) => (
                <TableRow key={ddt.id}>
                  <TableCell className="font-medium">{ddt.code || ddt.ddt_number}</TableCell>
                  <TableCell>{getTypeBadge(ddt.type)}</TableCell>
                  <TableCell>
                    {ddt.ddt_date ? format(new Date(ddt.ddt_date), 'dd MMM yyyy', { locale: it }) : '-'}
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge variant="secondary">{ddt.items?.length || 0}</Badge>
                  </TableCell>
                  <TableCell>{getStatusBadge(ddt.status)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/frontend/app/(dashboard)/dashboard/ddts/${ddt.id}`}>
                          <Eye className="h-4 w-4 mr-1" />
                          Visualizza
                        </Link>
                      </Button>
                      {(ddt.status === 'issued' || ddt.status === 'in_transit') && (
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => confirmMutation.mutate(ddt.id)}
                          disabled={confirmMutation.isPending}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Conferma
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
