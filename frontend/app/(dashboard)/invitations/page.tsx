'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { invitationsApi } from '@/lib/api/invitations';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CreateInvitationDialog } from '@/components/create-invitation-dialog';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import {
  Mail,
  UserPlus,
  MoreVertical,
  Send,
  Trash2,
  CheckCircle2,
  Clock,
  AlertCircle,
  Copy,
} from 'lucide-react';
import type { WorkerInvitation } from '@/lib/types';

export default function InvitationsPage() {
  const queryClient = useQueryClient();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedTab, setSelectedTab] = useState('pending');

  const { data: invitations, isLoading } = useQuery({
    queryKey: ['invitations'],
    queryFn: () => invitationsApi.getAll(),
  });

  const resendMutation = useMutation({
    mutationFn: (invitationId: number) => invitationsApi.resend(invitationId),
    onSuccess: () => {
      toast.success('Invito reinviato');
      queryClient.invalidateQueries({ queryKey: ['invitations'] });
    },
    onError: () => {
      toast.error('Errore durante il reinvio');
    },
  });

  const cancelMutation = useMutation({
    mutationFn: (invitationId: number) => invitationsApi.cancel(invitationId),
    onSuccess: () => {
      toast.success('Invito annullato');
      queryClient.invalidateQueries({ queryKey: ['invitations'] });
    },
    onError: () => {
      toast.error('Errore durante l\'annullamento');
    },
  });

  const copyInviteLink = (token: string) => {
    const url = `${window.location.origin}/accept-invitation/${token}`;
    navigator.clipboard.writeText(url);
    toast.success('Link copiato negli appunti');
  };

  const pendingInvitations =
    invitations?.filter(
      (inv) => !inv.accepted_at && new Date(inv.expires_at) > new Date()
    ) || [];

  const expiredInvitations =
    invitations?.filter(
      (inv) => !inv.accepted_at && new Date(inv.expires_at) <= new Date()
    ) || [];

  const acceptedInvitations = invitations?.filter((inv) => inv.accepted_at) || [];

  const renderInvitationRow = (invitation: WorkerInvitation) => {
    const isExpired = new Date(invitation.expires_at) < new Date();
    const isAccepted = !!invitation.accepted_at;

    return (
      <TableRow key={invitation.id}>
        <TableCell>
          <div>
            <div className="font-medium">
              {invitation.first_name} {invitation.last_name}
            </div>
            <div className="text-sm text-slate-500">{invitation.email}</div>
          </div>
        </TableCell>
        <TableCell>
          <Badge variant="outline">
            {invitation.worker_type === 'employee'
              ? 'Dipendente'
              : invitation.worker_type === 'external'
                ? 'Esterno'
                : 'Freelancer'}
          </Badge>
        </TableCell>
        <TableCell>
          {invitation.job_title || (
            <span className="text-sm text-slate-400">Non specificato</span>
          )}
        </TableCell>
        <TableCell>
          <div>
            {isAccepted ? (
              <Badge className="bg-green-100 text-green-700 border-green-300">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Accettato
              </Badge>
            ) : isExpired ? (
              <Badge variant="outline" className="border-red-300 text-red-700">
                <AlertCircle className="h-3 w-3 mr-1" />
                Scaduto
              </Badge>
            ) : (
              <Badge variant="outline" className="border-yellow-300 text-yellow-700">
                <Clock className="h-3 w-3 mr-1" />
                In Attesa
              </Badge>
            )}
          </div>
        </TableCell>
        <TableCell>
          <div className="text-sm">
            <div>Inviato: {format(new Date(invitation.created_at), 'dd MMM yyyy', { locale: it })}</div>
            {isAccepted ? (
              <div className="text-green-600">
                Accettato: {format(new Date(invitation.accepted_at!), 'dd MMM yyyy', { locale: it })}
              </div>
            ) : (
              <div className="text-slate-500">
                Scade: {format(new Date(invitation.expires_at), 'dd MMM yyyy', { locale: it })}
              </div>
            )}
          </div>
        </TableCell>
        <TableCell>
          <div className="text-sm text-slate-600">
            {invitation.invited_by?.name || 'N/D'}
          </div>
        </TableCell>
        <TableCell>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Azioni</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {!isAccepted && !isExpired && (
                <>
                  <DropdownMenuItem onClick={() => copyInviteLink(invitation.token)}>
                    <Copy className="h-4 w-4 mr-2" />
                    Copia Link
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => resendMutation.mutate(invitation.id)}>
                    <Send className="h-4 w-4 mr-2" />
                    Reinvia Email
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </>
              )}
              {!isAccepted && (
                <DropdownMenuItem
                  onClick={() => cancelMutation.mutate(invitation.id)}
                  className="text-red-600"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Annulla Invito
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </TableCell>
      </TableRow>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-slate-500">Caricamento...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Inviti Lavoratori</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            Gestisci gli inviti per registrare nuovi collaboratori
          </p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <UserPlus className="h-4 w-4 mr-2" />
          Nuovo Invito
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">In Attesa</CardTitle>
            <Clock className="h-4 w-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingInvitations.length}</div>
            <p className="text-xs text-slate-500 mt-1">Inviti pendenti</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Accettati</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{acceptedInvitations.length}</div>
            <p className="text-xs text-slate-500 mt-1">Account creati</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Scaduti</CardTitle>
            <AlertCircle className="h-4 w-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{expiredInvitations.length}</div>
            <p className="text-xs text-slate-500 mt-1">Da reinviare</p>
          </CardContent>
        </Card>
      </div>

      {/* Invitations Table */}
      <Card>
        <Tabs value={selectedTab} onValueChange={setSelectedTab}>
          <CardHeader>
            <TabsList>
              <TabsTrigger value="pending">
                In Attesa
                {pendingInvitations.length > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {pendingInvitations.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="accepted">Accettati</TabsTrigger>
              <TabsTrigger value="expired">
                Scaduti
                {expiredInvitations.length > 0 && (
                  <Badge variant="destructive" className="ml-2">
                    {expiredInvitations.length}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>
          </CardHeader>

          <CardContent>
            <TabsContent value="pending" className="mt-0">
              {pendingInvitations.length === 0 ? (
                <div className="text-center py-12 text-slate-500">
                  <Mail className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>Nessun invito in attesa</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Lavoratore</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Qualifica</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Inviato Da</TableHead>
                      <TableHead className="w-[80px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>{pendingInvitations.map(renderInvitationRow)}</TableBody>
                </Table>
              )}
            </TabsContent>

            <TabsContent value="accepted" className="mt-0">
              {acceptedInvitations.length === 0 ? (
                <div className="text-center py-12 text-slate-500">
                  <CheckCircle2 className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>Nessun invito accettato</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Lavoratore</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Qualifica</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Inviato Da</TableHead>
                      <TableHead className="w-[80px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>{acceptedInvitations.map(renderInvitationRow)}</TableBody>
                </Table>
              )}
            </TabsContent>

            <TabsContent value="expired" className="mt-0">
              {expiredInvitations.length === 0 ? (
                <div className="text-center py-12 text-slate-500">
                  <AlertCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>Nessun invito scaduto</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Lavoratore</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Qualifica</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Inviato Da</TableHead>
                      <TableHead className="w-[80px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>{expiredInvitations.map(renderInvitationRow)}</TableBody>
                </Table>
              )}
            </TabsContent>
          </CardContent>
        </Tabs>
      </Card>

      {/* Create Invitation Dialog */}
      <CreateInvitationDialog open={createDialogOpen} onOpenChange={setCreateDialogOpen} />
    </div>
  );
}
