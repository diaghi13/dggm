'use client';

import { use, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { landlordApi, type TenantInvitationPreview } from '@/lib/api/landlord';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Building2, CheckCircle2, XCircle, Shield, Eye, EyeOff, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface PageProps {
  params: Promise<{ token: string }>;
}

const ROLE_LABELS: Record<string, string> = {
  admin: 'Amministratore',
  'project-manager': 'Project Manager',
  foreman: 'Caposquadra',
  worker: 'Operaio',
  accountant: 'Contabile',
  'warehouse-manager': 'Responsabile Magazzino',
  customer: 'Cliente',
};

function translateRole(role: string): string {
  return ROLE_LABELS[role] ?? role;
}

function formatDateItalian(dateString: string): string {
  return new Date(dateString).toLocaleDateString('it-IT', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

// Zod schema — password required only for new users
const buildSchema = (isNewUser: boolean) =>
  isNewUser
    ? z
        .object({
          name: z.string().min(1, 'Il nome è obbligatorio'),
          password: z.string().min(8, 'La password deve essere di almeno 8 caratteri'),
          password_confirmation: z.string(),
        })
        .refine((data) => data.password === data.password_confirmation, {
          message: 'Le password non corrispondono',
          path: ['password_confirmation'],
        })
    : z.object({
        name: z.string().optional(),
        password: z.string().optional(),
        password_confirmation: z.string().optional(),
      });

type FormData = {
  name?: string;
  password?: string;
  password_confirmation?: string;
};

// ─── Loading skeleton ────────────────────────────────────────────────────────

function LoadingState() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-950 p-4">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto text-slate-500 dark:text-slate-400" />
        <p className="text-slate-500 dark:text-slate-400 mt-4">Caricamento invito...</p>
      </div>
    </div>
  );
}

// ─── Error state ─────────────────────────────────────────────────────────────

function ErrorState() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-950 p-4">
      <Card className="max-w-md w-full border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <CardHeader>
          <div className="flex items-center gap-2">
            <XCircle className="h-6 w-6 text-red-500" />
            <CardTitle className="text-slate-900 dark:text-slate-100">
              Invito non valido o scaduto
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertDescription>
              Il link di invito non è valido o è già scaduto. Contatta l&apos;amministratore
              dell&apos;azienda per ricevere un nuovo invito.
            </AlertDescription>
          </Alert>
          <Button asChild variant="outline" className="w-full">
            <Link href="/login">Vai al Login</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Success state ────────────────────────────────────────────────────────────

function SuccessState() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-950 p-4">
      <Card className="max-w-md w-full border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <CardHeader>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-6 w-6 text-green-500" />
            <CardTitle className="text-slate-900 dark:text-slate-100">Accesso attivato!</CardTitle>
          </div>
          <CardDescription className="text-slate-500 dark:text-slate-400">
            Puoi ora effettuare il login con le tue credenziali.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild className="w-full">
            <Link href="/login">Vai al Login</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function AcceptTenantInvitationPage({ params }: PageProps) {
  const { token } = use(params);
  const [accepted, setAccepted] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const {
    data: previewData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['tenant-invitation-preview', token],
    queryFn: () => landlordApi.previewTenantInvitation(token),
    retry: false,
  });

  const preview: TenantInvitationPreview | undefined = previewData?.data;
  const isNewUser = preview?.is_new_user ?? false;

  const schema = buildSchema(isNewUser);

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      password: '',
      password_confirmation: '',
    },
  });

  const acceptMutation = useMutation({
    mutationFn: (data: FormData) =>
      landlordApi.acceptTenantInvitation(token, data.password || undefined, data.name || undefined),
    onSuccess: () => {
      setAccepted(true);
    },
    onError: (err: unknown) => {
      let message = "Errore durante l'accettazione dell'invito";
      if (err instanceof Error) {
        message = err.message;
      } else if (typeof err === 'object' && err !== null) {
        const cast = err as { response?: { data?: { message?: string } } };
        message = cast.response?.data?.message ?? message;
      }
      toast.error(message);
    },
  });

  const onSubmit = (data: FormData) => {
    acceptMutation.mutate(data);
  };

  if (isLoading) return <LoadingState />;
  if (error || !preview) return <ErrorState />;
  if (accepted) return <SuccessState />;

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-950 p-4">
      <Card className="max-w-md w-full border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/30">
              <Building2 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <CardTitle className="text-slate-900 dark:text-slate-100">
                Accetta Invito Aziendale
              </CardTitle>
              <CardDescription className="text-slate-500 dark:text-slate-400">
                Sei stato invitato ad accedere a{' '}
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  {preview.tenant_name}
                </span>
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Invitation details */}
          <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500 dark:text-slate-400">Email</span>
              <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                {preview.email}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500 dark:text-slate-400">Ruolo</span>
              <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                <Shield className="h-3 w-3" />
                {translateRole(preview.role)}
              </span>
            </div>

            {preview.expires_at && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-500 dark:text-slate-400">Scadenza</span>
                <span className="text-sm text-slate-700 dark:text-slate-300">
                  {formatDateItalian(preview.expires_at)}
                </span>
              </div>
            )}
          </div>

          {/* Form */}
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-700 dark:text-slate-300">
                      Nome completo {isNewUser && <span className="text-red-500">*</span>}
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="text"
                        placeholder="Mario Rossi"
                        className="bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-slate-100"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {isNewUser && (
                <>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Per completare la registrazione, scegli una password per il tuo account.
                  </p>

                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-700 dark:text-slate-300">
                          Password <span className="text-red-500">*</span>
                        </FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input
                              type={showPassword ? 'text' : 'password'}
                              placeholder="Inserisci password"
                              className="pr-10 bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-slate-100"
                              {...field}
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword((v) => !v)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                              tabIndex={-1}
                            >
                              {showPassword ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </button>
                          </div>
                        </FormControl>
                        <FormDescription className="text-xs text-slate-500 dark:text-slate-400">
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
                        <FormLabel className="text-slate-700 dark:text-slate-300">
                          Conferma Password <span className="text-red-500">*</span>
                        </FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input
                              type={showConfirm ? 'text' : 'password'}
                              placeholder="Conferma password"
                              className="pr-10 bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-slate-100"
                              {...field}
                            />
                            <button
                              type="button"
                              onClick={() => setShowConfirm((v) => !v)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                              tabIndex={-1}
                            >
                              {showConfirm ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}

              {!isNewUser && (
                <Alert className="border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20">
                  <CheckCircle2 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  <AlertDescription className="text-blue-700 dark:text-blue-300 text-sm">
                    Hai già un account. Clicca su &quot;Accetta invito&quot; per attivare l&apos;accesso
                    a <strong>{preview.tenant_name}</strong>.
                  </AlertDescription>
                </Alert>
              )}

              <Button
                type="submit"
                className="w-full"
                disabled={acceptMutation.isPending}
              >
                {acceptMutation.isPending && (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                )}
                {isNewUser ? 'Crea Account e Accedi' : 'Accetta Invito'}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
