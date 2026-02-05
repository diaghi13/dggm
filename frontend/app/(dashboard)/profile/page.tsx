"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/stores/auth-store";
import { profileApi, UpdateProfileData } from "@/lib/api/profile";
import { authApi } from "@/lib/api/auth";
import { ProfileForm } from "@/components/profile/profile-form";
import { PasswordForm } from "@/components/profile/password-form";
import { SessionsTable } from "@/components/profile/sessions-table";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User, Shield, Mail, Calendar } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { it } from "date-fns/locale";

export default function ProfilePage() {
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const refreshUser = useAuthStore((state) => state.refreshUser);

  // Query per sessioni
  const { data: sessions = [], isLoading: isLoadingSessions } = useQuery({
    queryKey: ["sessions"],
    queryFn: profileApi.getSessions,
    retry: false, // Non riprovare se endpoint non implementato
    staleTime: 30000, // Cache per 30 secondi
  });

  // Mutation aggiorna profilo
  const updateProfileMutation = useMutation({
    mutationFn: (data: UpdateProfileData) => profileApi.updateProfile(data),
    onSuccess: async () => {
      await refreshUser();
      toast.success("Profilo aggiornato", {
        description: "Le tue informazioni sono state aggiornate con successo",
      });
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error("Errore", {
        description:
          err.response?.data?.message || "Impossibile aggiornare il profilo",
      });
    },
  });

  // Mutation cambia password
  const updatePasswordMutation = useMutation({
    mutationFn: (data: {
      current_password: string;
      password: string;
      password_confirmation: string;
    }) => authApi.changePassword(data),
    onSuccess: () => {
      toast.success("Password aggiornata", {
        description: "La tua password è stata modificata con successo",
      });
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error("Errore", {
        description:
          err.response?.data?.message || "Password corrente non valida",
      });
    },
  });

  // Mutation revoca sessione
  const revokeSessionMutation = useMutation({
    mutationFn: (sessionId: number) => profileApi.revokeSession(sessionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
      toast.success("Dispositivo disconnesso", {
        description: "Il dispositivo è stato disconnesso con successo",
      });
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error("Errore", {
        description:
          err.response?.data?.message ||
          "Impossibile disconnettere il dispositivo",
      });
    },
  });

  // Mutation revoca altre sessioni
  const revokeOtherSessionsMutation = useMutation({
    mutationFn: () => profileApi.revokeOtherSessions(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
      toast.success("Dispositivi disconnessi", {
        description: "Tutti gli altri dispositivi sono stati disconnessi",
      });
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error("Errore", {
        description:
          err.response?.data?.message ||
          "Impossibile disconnettere i dispositivi",
      });
    },
  });

  if (!user) {
    return null;
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Il Mio Profilo"
        description="Gestisci le tue informazioni personali e le impostazioni di sicurezza"
      />

      {/* Info Utente Card */}
      <Card className="p-6">
        <div className="flex items-start gap-6">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 text-primary">
            <User className="h-10 w-10" />
          </div>
          <div className="flex-1 space-y-4">
            <div>
              <h2 className="text-2xl font-bold">{user.name}</h2>
              <div className="flex items-center gap-2 text-muted-foreground mt-1">
                <Mail className="h-4 w-4" />
                <span>{user.email}</span>
              </div>
            </div>

            <div className="flex flex-wrap gap-6 text-sm">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">
                  Membro da{" "}
                  {formatDistanceToNow(new Date(user.created_at), {
                    addSuffix: true,
                    locale: it,
                  })}
                </span>
              </div>

              {user.roles && user.roles.length > 0 && (
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-muted-foreground" />
                  <div className="flex flex-wrap gap-1">
                    {user.roles.map((role) => (
                      <Badge key={role} variant="secondary">
                        {role}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {user.email_verified_at ? (
              <Badge variant="default" className="gap-1">
                <Mail className="h-3 w-3" />
                Email Verificata
              </Badge>
            ) : (
              <Badge variant="outline" className="gap-1">
                <Mail className="h-3 w-3" />
                Email Non Verificata
              </Badge>
            )}
          </div>
        </div>
      </Card>

      {/* Form Profilo */}
      <ProfileForm
        user={user}
        onSubmit={(data) => updateProfileMutation.mutateAsync(data)}
      />

      {/* Form Password */}
      <PasswordForm
        onSubmit={async (data) => {
          await updatePasswordMutation.mutateAsync(data);
        }}
      />

      {/* Sessioni */}
      <SessionsTable
        sessions={sessions}
        onRevokeSession={(id) => revokeSessionMutation.mutateAsync(id)}
        onRevokeOtherSessions={() => revokeOtherSessionsMutation.mutateAsync()}
        isLoading={
          isLoadingSessions ||
          revokeSessionMutation.isPending ||
          revokeOtherSessionsMutation.isPending
        }
      />
    </div>
  );
}
