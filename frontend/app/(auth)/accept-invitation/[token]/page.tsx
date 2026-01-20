'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useMutation, useQuery } from '@tanstack/react-query';
import { invitationsApi } from '@/lib/api/invitations';
import { useAuthStore } from '@/stores/auth-store';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { Loader2, CheckCircle2, XCircle, UserPlus, AlertCircle } from 'lucide-react';

const acceptInvitationSchema = z
  .object({
    password: z.string().min(8, 'La password deve essere di almeno 8 caratteri'),
    password_confirmation: z.string(),
  })
  .refine((data) => data.password === data.password_confirmation, {
    message: 'Le password non corrispondono',
    path: ['password_confirmation'],
  });

type AcceptInvitationFormData = z.infer<typeof acceptInvitationSchema>;

export default function AcceptInvitationPage() {
  const params = useParams();
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const token = params.token as string;
  const [accepted, setAccepted] = useState(false);

  const form = useForm<AcceptInvitationFormData>({
    resolver: zodResolver(acceptInvitationSchema),
    defaultValues: {
      password: '',
      password_confirmation: '',
    },
  });

  // Fetch invitation details
  const {
    data: invitation,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['invitation', token],
    queryFn: () => invitationsApi.getByToken(token),
    retry: false,
  });

  const acceptMutation = useMutation({
    mutationFn: (data: AcceptInvitationFormData) =>
      invitationsApi.accept(token, {
        password: data.password,
        password_confirmation: data.password_confirmation,
      }),
    onSuccess: (response) => {
      toast.success('Account creato con successo!');
      setAccepted(true);

      // Set auth and redirect (token is in httpOnly cookie)
      setAuth(response.user);

      setTimeout(() => {
        router.push('/dashboard/worker');
      }, 2000);
    },
    onError: (error: unknown) => {
      let errorMessage = 'Errore durante la creazione dell\'account';

      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'object' && error !== null) {
        const err = error as { response?: { data?: { message?: string } } };
        errorMessage = err.response?.data?.message || errorMessage;
      }

      toast.error(errorMessage);
    },
  });

  const onSubmit = (data: AcceptInvitationFormData) => {
    acceptMutation.mutate(data);
  };

  // Check if invitation is expired
  const isExpired = invitation?.expires_at
    ? new Date(invitation.expires_at) < new Date()
    : false;

  const isAlreadyAccepted = !!invitation?.accepted_at;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-900">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-slate-500" />
          <p className="text-slate-500 mt-4">Caricamento invito...</p>
        </div>
      </div>
    );
  }

  if (error || !invitation) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-900 p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <div className="flex items-center gap-2">
              <XCircle className="h-6 w-6 text-red-500" />
              <CardTitle>Invito Non Valido</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                L&apos;invito non è stato trovato o il link non è valido. Contatta chi ti ha invitato
                per ricevere un nuovo link.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isExpired) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-900 p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <div className="flex items-center gap-2">
              <XCircle className="h-6 w-6 text-orange-500" />
              <CardTitle>Invito Scaduto</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Questo invito è scaduto il{' '}
                {new Date(invitation.expires_at).toLocaleDateString('it-IT')}.
                <br />
                Contatta chi ti ha invitato per ricevere un nuovo link.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isAlreadyAccepted) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-900 p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-6 w-6 text-green-500" />
              <CardTitle>Invito Già Accettato</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <Alert>
              <AlertDescription>
                Hai già accettato questo invito. Puoi accedere alla piattaforma con le tue
                credenziali.
              </AlertDescription>
            </Alert>
            <Button className="w-full mt-4" onClick={() => router.push('/login')}>
              Vai al Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (accepted) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-900 p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-6 w-6 text-green-500" />
              <CardTitle>Account Creato!</CardTitle>
            </div>
            <CardDescription>
              Il tuo account è stato creato con successo. Verrai reindirizzato alla dashboard...
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-slate-500" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-900 p-4">
      <Card className="max-w-md w-full">
        <CardHeader>
          <div className="flex items-center gap-2">
            <UserPlus className="h-6 w-6 text-blue-500" />
            <CardTitle>Accetta Invito</CardTitle>
          </div>
          <CardDescription>
            Sei stato invitato a collaborare. Crea il tuo account per iniziare.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Invitation Details */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg space-y-2">
            <div>
              <span className="text-sm font-medium">Nome:</span>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {invitation.first_name} {invitation.last_name}
              </p>
            </div>
            <div>
              <span className="text-sm font-medium">Email:</span>
              <p className="text-sm text-slate-600 dark:text-slate-400">{invitation.email}</p>
            </div>
            {invitation.phone && (
              <div>
                <span className="text-sm font-medium">Telefono:</span>
                <p className="text-sm text-slate-600 dark:text-slate-400">{invitation.phone}</p>
              </div>
            )}
            {invitation.job_title && (
              <div>
                <span className="text-sm font-medium">Ruolo:</span>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {invitation.job_title}
                </p>
              </div>
            )}
          </div>

          {/* Password Form */}
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password *</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="Inserisci password" {...field} />
                    </FormControl>
                    <FormDescription className="text-xs">
                      Minimo 8 caratteri
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password_confirmation"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Conferma Password *</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="Conferma password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="w-full"
                disabled={acceptMutation.isPending}
              >
                {acceptMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Crea Account e Accedi
              </Button>
            </form>
          </Form>

          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-xs">
              Creando l&apos;account accetti i termini di servizio e la privacy policy.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
}
