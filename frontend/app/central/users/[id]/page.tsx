"use client";

import { use, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  landlordApi,
  type TenantMembershipWithTenant,
  type AddMembershipPayload,
} from "@/lib/api/landlord";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  ArrowLeft,
  Building2,
  Calendar,
  CheckCircle2,
  Circle,
  Clock,
  Mail,
  MapPin,
  Phone,
  Plus,
  Shield,
  Trash2,
  UserCircle,
  Users,
  XCircle,
} from "lucide-react";
import Link from "next/link";

interface PageProps {
  params: Promise<{ id: string }>;
}

type GlobalUser = App.Data.Landlord.GlobalUserData & { tenants_count?: number };

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleDateString("it-IT", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center py-3 border-b border-slate-100 dark:border-slate-800 last:border-0">
      <span className="text-sm text-slate-500 dark:text-slate-400 sm:w-40 flex-shrink-0">
        {label}
      </span>
      <span className="text-sm font-medium text-slate-900 dark:text-slate-100 mt-0.5 sm:mt-0">
        {value}
      </span>
    </div>
  );
}

function MembershipStatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; className: string; icon: React.ElementType }> = {
    active: {
      label: "Attivo",
      className: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
      icon: CheckCircle2,
    },
    invited: {
      label: "Invitato",
      className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
      icon: Clock,
    },
    suspended: {
      label: "Sospeso",
      className: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
      icon: XCircle,
    },
  };

  const config = map[status] ?? {
    label: status,
    className: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
    icon: Circle,
  };
  const Icon = config.icon;

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${config.className}`}
    >
      <Icon className="h-3 w-3" />
      {config.label}
    </span>
  );
}

function RoleBadge({ role }: { role: string }) {
  const labels: Record<string, string> = {
    admin: "Admin",
    "project-manager": "Project Manager",
    worker: "Worker",
    "warehouse-manager": "Magazzino",
    foreman: "Capo Cantiere",
    accountant: "Contabile",
  };

  return (
    <span className="inline-flex items-center rounded px-2 py-0.5 text-xs font-medium bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border border-blue-100 dark:border-blue-900/50">
      {labels[role] ?? role}
    </span>
  );
}

// ── Add Membership Dialog ─────────────────────────────────────────────────────

interface AddMembershipDialogProps {
  open: boolean;
  onClose: () => void;
  userId: string;
}

function AddMembershipDialog({ open, onClose, userId }: AddMembershipDialogProps) {
  const queryClient = useQueryClient();
  const [selectedTenantId, setSelectedTenantId] = useState<string>("");
  const [selectedRole, setSelectedRole] = useState<string>("admin");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const { data: tenantsData, isLoading: tenantsLoading } = useQuery({
    queryKey: ["landlord-tenants-all-for-membership"],
    queryFn: () => landlordApi.getTenants({ per_page: 200 }),
    enabled: open,
  });

  const tenants = tenantsData?.data ?? [];

  const addMutation = useMutation({
    mutationFn: (payload: AddMembershipPayload) =>
      landlordApi.addUserMembership(userId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["landlord-user-memberships", userId] });
      queryClient.invalidateQueries({ queryKey: ["landlord-global-user", userId] });
      toast.success("Accesso aggiunto", {
        description: "L'utente è stato aggiunto al tenant.",
      });
      handleClose();
    },
    onError: (err: unknown) => {
      const axiosErr = err as { response?: { status?: number; data?: { message?: string } } };
      if (axiosErr?.response?.status === 422) {
        setErrorMsg(
          axiosErr.response.data?.message ??
            "L'utente è già membro di questo tenant.",
        );
      } else {
        setErrorMsg("Errore durante l'aggiunta. Riprova.");
      }
    },
  });

  const handleClose = () => {
    setSelectedTenantId("");
    setSelectedRole("admin");
    setErrorMsg(null);
    onClose();
  };

  const handleSubmit = () => {
    if (!selectedTenantId) {
      setErrorMsg("Seleziona un tenant.");
      return;
    }
    setErrorMsg(null);
    addMutation.mutate({ tenant_id: selectedTenantId, role: selectedRole });
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 max-w-md">
        <DialogHeader>
          <DialogTitle className="text-slate-900 dark:text-slate-100">
            Aggiungi a Tenant
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Tenant selector */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Tenant
            </label>
            {tenantsLoading ? (
              <Skeleton className="h-10 w-full rounded-md" />
            ) : (
              <Select value={selectedTenantId} onValueChange={setSelectedTenantId}>
                <SelectTrigger className="bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100">
                  <SelectValue placeholder="Seleziona tenant..." />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                  {tenants.map((t) => (
                    <SelectItem key={t.id} value={t.id ?? ""}>
                      {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Role selector */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Ruolo
            </label>
            <Select value={selectedRole} onValueChange={setSelectedRole}>
              <SelectTrigger className="bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="project-manager">Project Manager</SelectItem>
                <SelectItem value="worker">Worker</SelectItem>
                <SelectItem value="warehouse-manager">Magazzino</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Error */}
          {errorMsg && (
            <p className="text-sm text-red-600 dark:text-red-400">{errorMsg}</p>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleClose}
            className="border-slate-300 dark:border-slate-700"
          >
            Annulla
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={addMutation.isPending || !selectedTenantId}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {addMutation.isPending ? "Aggiunta..." : "Aggiungi"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function GlobalUserDetailPage({ params }: PageProps) {
  const { id } = use(params);
  const queryClient = useQueryClient();
  const [addDialogOpen, setAddDialogOpen] = useState(false);

  const {
    data: userData,
    isLoading: userLoading,
    isError: userError,
  } = useQuery({
    queryKey: ["landlord-global-user", id],
    queryFn: () => landlordApi.getGlobalUser(id),
  });

  const {
    data: membershipsData,
    isLoading: membershipsLoading,
  } = useQuery({
    queryKey: ["landlord-user-memberships", id],
    queryFn: () => landlordApi.getUserMemberships(id),
  });

  const user: GlobalUser | undefined = userData?.data;
  const memberships: TenantMembershipWithTenant[] = membershipsData?.data ?? [];

  const toggleAdminMutation = useMutation({
    mutationFn: () => landlordApi.toggleAdmin(id),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["landlord-global-user", id] });
      queryClient.invalidateQueries({ queryKey: ["landlord-global-users"] });
      const isAdmin = res.data.is_landlord_admin;
      toast.success(isAdmin ? "Admin abilitato" : "Admin rimosso", {
        description: isAdmin
          ? "L'utente è ora Landlord Admin."
          : "L'utente non è più Landlord Admin.",
      });
    },
    onError: () => {
      toast.error("Errore", { description: "Impossibile modificare il ruolo. Riprova." });
    },
  });

  const removeMembershipMutation = useMutation({
    mutationFn: (membershipId: number) =>
      landlordApi.removeUserMembership(id, membershipId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["landlord-user-memberships", id] });
      queryClient.invalidateQueries({ queryKey: ["landlord-global-user", id] });
      toast.success("Accesso rimosso");
    },
    onError: () => {
      toast.error("Errore", { description: "Impossibile rimuovere l'accesso. Riprova." });
    },
  });

  const handleRemoveMembership = (membership: TenantMembershipWithTenant) => {
    if (
      window.confirm(
        `Rimuovere l'accesso di ${user?.name ?? "questo utente"} al tenant "${membership.tenant_name}"?`,
      )
    ) {
      removeMembershipMutation.mutate(membership.id);
    }
  };

  // ── Loading state ────────────────────────────────────────────────────────

  if (userLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-9 w-9 rounded-lg" />
          <div className="space-y-2">
            <Skeleton className="h-7 w-64" />
            <Skeleton className="h-4 w-40" />
          </div>
        </div>
        <Skeleton className="h-56 rounded-xl" />
        <Skeleton className="h-48 rounded-xl" />
      </div>
    );
  }

  // ── Error state ──────────────────────────────────────────────────────────

  if (userError || !user) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-950/30 mb-4">
          <XCircle className="h-8 w-8 text-red-500 dark:text-red-400" />
        </div>
        <p className="text-base font-medium text-slate-900 dark:text-slate-100">
          Utente non trovato
        </p>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          L&apos;utente richiesto non esiste o è stato eliminato.
        </p>
        <Button
          variant="outline"
          className="mt-6 border-slate-300 dark:border-slate-700"
          asChild
        >
          <Link href="/central/users">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Torna alla lista
          </Link>
        </Button>
      </div>
    );
  }

  // ── Main render ──────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link
        href="/central/users"
        className="inline-flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Torna agli utenti globali
      </Link>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xl">
            {getInitials(user.name)}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                {user.name}
              </h1>
              {user.is_landlord_admin ? (
                <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-400">
                  <Shield className="h-3 w-3" />
                  Landlord Admin
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                  <Users className="h-3 w-3" />
                  Utente
                </span>
              )}
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              {user.email}
            </p>
          </div>
        </div>

        {/* Toggle admin button */}
        <Button
          variant="outline"
          size="sm"
          disabled={toggleAdminMutation.isPending}
          onClick={() => toggleAdminMutation.mutate()}
          className={
            user.is_landlord_admin
              ? "border-red-300 text-red-700 hover:bg-red-50 dark:border-red-700/50 dark:text-red-400 dark:hover:bg-red-950/30"
              : "border-blue-300 text-blue-700 hover:bg-blue-50 dark:border-blue-700/50 dark:text-blue-400 dark:hover:bg-blue-950/30"
          }
        >
          {toggleAdminMutation.isPending ? (
            "Elaborazione..."
          ) : user.is_landlord_admin ? (
            <>
              <XCircle className="mr-1.5 h-4 w-4" />
              Rimuovi Admin
            </>
          ) : (
            <>
              <Shield className="mr-1.5 h-4 w-4" />
              Rendi Admin
            </>
          )}
        </Button>
      </div>

      {/* Info card */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
        <div className="flex items-center gap-2 mb-4">
          <UserCircle className="h-4 w-4 text-slate-500 dark:text-slate-400" />
          <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
            Informazioni Utente
          </h2>
        </div>
        <div>
          <InfoRow label="Nome" value={user.name} />
          <InfoRow
            label="Email"
            value={
              <span className="flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />
                {user.email}
              </span>
            }
          />
          {user.phone && (
            <InfoRow
              label="Telefono"
              value={
                <span className="flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />
                  {user.phone}
                </span>
              }
            />
          )}
          {(user.city ?? user.province ?? user.country) && (
            <InfoRow
              label="Sede"
              value={
                <span className="flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />
                  {[user.city, user.province, user.country]
                    .filter(Boolean)
                    .join(", ")}
                </span>
              }
            />
          )}
          <InfoRow
            label="Registrato il"
            value={
              <span className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />
                {formatDate(user.created_at)}
              </span>
            }
          />
        </div>
      </div>

      {/* Memberships section */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-slate-500 dark:text-slate-400" />
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
              Accessi Tenant
            </h2>
            {memberships.length > 0 && (
              <span className="inline-flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs font-medium px-2 py-0.5">
                {memberships.length}
              </span>
            )}
          </div>
          <Button
            size="sm"
            onClick={() => setAddDialogOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Plus className="mr-1.5 h-4 w-4" />
            Aggiungi a Tenant
          </Button>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
          Aggiungi accesso diretto senza invito email — uso esclusivamente backoffice. Per il flusso
          standard via email, usa &quot;Inviti Accesso Tenant&quot; dalla dashboard del tenant.
        </p>

        {membershipsLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 py-3 border-b border-slate-100 dark:border-slate-800 last:border-0">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-5 w-16 rounded-full" />
                <Skeleton className="h-5 w-16 rounded-full" />
                <div className="ml-auto">
                  <Skeleton className="h-8 w-20 rounded-md" />
                </div>
              </div>
            ))}
          </div>
        ) : memberships.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <Building2 className="h-8 w-8 text-slate-300 dark:text-slate-600 mb-2" />
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Nessun accesso a tenant configurato
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {memberships.map((membership) => (
              <div
                key={membership.id}
                className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 py-4 first:pt-0 last:pb-0"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                    <Building2 className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                      {membership.tenant_name}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Aggiunto il {formatDate(membership.created_at)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <RoleBadge role={membership.role} />
                  <MembershipStatusBadge status={membership.status} />
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={removeMembershipMutation.isPending}
                    onClick={() => handleRemoveMembership(membership)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-950/30 ml-2"
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Rimuovi
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add membership dialog */}
      <AddMembershipDialog
        open={addDialogOpen}
        onClose={() => setAddDialogOpen(false)}
        userId={id}
      />
    </div>
  );
}
