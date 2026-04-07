"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  landlordApi,
  type CreateBroadcastPayload,
  type ServiceBroadcast,
} from "@/lib/api/landlord";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Megaphone,
  Clock,
  Users,
  CheckCircle2,
  AlertTriangle,
  Info,
  Loader2,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { it } from "date-fns/locale";

const AVAILABLE_ROLES = [
  { value: "admin", label: "Amministratore" },
  { value: "project-manager", label: "Project Manager" },
  { value: "team-leader", label: "Caposquadra" },
  { value: "worker", label: "Operaio" },
  { value: "accountant", label: "Contabile" },
  { value: "warehousekeeper", label: "Magazziniere" },
] as const;

const BROADCAST_TYPES = [
  {
    value: "info" as const,
    label: "Informazione",
    emoji: "ℹ️",
    color:
      "border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300",
    activeColor:
      "border-blue-500 dark:border-blue-400 bg-blue-100 dark:bg-blue-900/60 ring-2 ring-blue-500 dark:ring-blue-400",
  },
  {
    value: "success" as const,
    label: "Buone notizie",
    emoji: "✅",
    color:
      "border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-950/40 text-green-700 dark:text-green-300",
    activeColor:
      "border-green-500 dark:border-green-400 bg-green-100 dark:bg-green-900/60 ring-2 ring-green-500 dark:ring-green-400",
  },
  {
    value: "warning" as const,
    label: "Attenzione",
    emoji: "⚠️",
    color:
      "border-yellow-300 dark:border-yellow-700 bg-yellow-50 dark:bg-yellow-950/40 text-yellow-700 dark:text-yellow-300",
    activeColor:
      "border-yellow-500 dark:border-yellow-400 bg-yellow-100 dark:bg-yellow-900/60 ring-2 ring-yellow-500 dark:ring-yellow-400",
  },
  {
    value: "announcement" as const,
    label: "Annuncio",
    emoji: "📢",
    color:
      "border-purple-300 dark:border-purple-700 bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300",
    activeColor:
      "border-purple-500 dark:border-purple-400 bg-purple-100 dark:bg-purple-900/60 ring-2 ring-purple-500 dark:ring-purple-400",
  },
] as const;

function getBroadcastTypeIcon(type: ServiceBroadcast["type"]) {
  switch (type) {
    case "info":
      return <Info className="h-4 w-4 text-blue-500 dark:text-blue-400" />;
    case "success":
      return (
        <CheckCircle2 className="h-4 w-4 text-green-500 dark:text-green-400" />
      );
    case "warning":
      return (
        <AlertTriangle className="h-4 w-4 text-yellow-500 dark:text-yellow-400" />
      );
    case "announcement":
      return (
        <Megaphone className="h-4 w-4 text-purple-500 dark:text-purple-400" />
      );
  }
}

function getStatusBadge(status: ServiceBroadcast["status"]) {
  switch (status) {
    case "pending":
      return (
        <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800">
          In invio
        </Badge>
      );
    case "dispatched":
      return (
        <Badge className="bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300 border-green-200 dark:border-green-800">
          Inviata
        </Badge>
      );
    case "failed":
      return (
        <Badge className="bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300 border-red-200 dark:border-red-800">
          Errore
        </Badge>
      );
  }
}

function getRoleLabel(role: string): string {
  const found = AVAILABLE_ROLES.find((r) => r.value === role);
  return found ? found.label : role;
}

export default function BroadcastsPage() {
  const queryClient = useQueryClient();

  // Form state
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [type, setType] =
    useState<CreateBroadcastPayload["type"]>("info");
  const [allUsers, setAllUsers] = useState(true);
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Fetch broadcasts history
  const { data: broadcastsData, isLoading } = useQuery({
    queryKey: ["landlord-broadcasts"],
    queryFn: () => landlordApi.getBroadcasts(1),
  });

  const createMutation = useMutation({
    mutationFn: (payload: CreateBroadcastPayload) =>
      landlordApi.createBroadcast(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["landlord-broadcasts"] });
      setTitle("");
      setMessage("");
      setType("info");
      setAllUsers(true);
      setSelectedRoles([]);
      setSuccessMessage("Comunicazione inviata con successo!");
      setTimeout(() => setSuccessMessage(null), 5000);
    },
  });

  const handleRoleToggle = (role: string) => {
    setSelectedRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role],
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) return;

    createMutation.mutate({
      title: title.trim(),
      message: message.trim(),
      type,
      target_roles: allUsers ? null : selectedRoles,
    });
  };

  const broadcasts = broadcastsData?.data ?? [];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
          Comunicazioni di Servizio
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Invia notifiche in-app a tutti i tenant o a ruoli specifici
        </p>
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT — Compose form */}
        <div className="lg:col-span-1">
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
            {/* Card header */}
            <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-200 dark:border-slate-800">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-950/50">
                <Megaphone className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
              <h2 className="font-semibold text-slate-900 dark:text-slate-100">
                Nuova Comunicazione
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {/* Success banner */}
              {successMessage && (
                <div className="flex items-center gap-2 rounded-lg bg-green-50 dark:bg-green-950/40 border border-green-200 dark:border-green-800 px-4 py-3">
                  <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                  <p className="text-sm text-green-700 dark:text-green-300">
                    {successMessage}
                  </p>
                </div>
              )}

              {/* Error banner */}
              {createMutation.isError && (
                <div className="flex items-center gap-2 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 px-4 py-3">
                  <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400 flex-shrink-0" />
                  <p className="text-sm text-red-700 dark:text-red-300">
                    Errore nell&apos;invio. Riprova.
                  </p>
                </div>
              )}

              {/* Title */}
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Titolo <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Es: Aggiornamento di sistema"
                  required
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-shadow"
                />
              </div>

              {/* Message */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                    Messaggio <span className="text-red-500">*</span>
                  </label>
                  <span
                    className={cn(
                      "text-xs",
                      message.length > 1800
                        ? "text-red-500 dark:text-red-400"
                        : "text-slate-400 dark:text-slate-500",
                    )}
                  >
                    {message.length}/2000
                  </span>
                </div>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={4}
                  required
                  maxLength={2000}
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-shadow resize-none"
                />
              </div>

              {/* Type */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Tipo
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {BROADCAST_TYPES.map((bt) => (
                    <button
                      key={bt.value}
                      type="button"
                      onClick={() => setType(bt.value)}
                      className={cn(
                        "flex items-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-medium transition-all",
                        type === bt.value ? bt.activeColor : bt.color,
                      )}
                    >
                      <span className="text-base leading-none">{bt.emoji}</span>
                      <span>{bt.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Target roles */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Destinatari
                </label>
                <div className="space-y-2">
                  {/* All users */}
                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={allUsers}
                      onChange={(e) => {
                        setAllUsers(e.target.checked);
                        if (e.target.checked) setSelectedRoles([]);
                      }}
                      className="h-4 w-4 rounded border-slate-300 dark:border-slate-600 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                      <Users className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400" />
                      Tutti gli utenti
                    </span>
                  </label>

                  {/* Divider */}
                  {!allUsers && (
                    <div className="pt-1 space-y-1.5">
                      {AVAILABLE_ROLES.map((role) => (
                        <label
                          key={role.value}
                          className="flex items-center gap-2.5 cursor-pointer pl-1"
                        >
                          <input
                            type="checkbox"
                            checked={selectedRoles.includes(role.value)}
                            onChange={() => handleRoleToggle(role.value)}
                            disabled={allUsers}
                            className="h-4 w-4 rounded border-slate-300 dark:border-slate-600 text-blue-600 focus:ring-blue-500 disabled:opacity-40"
                          />
                          <span className="text-sm text-slate-700 dark:text-slate-300">
                            {role.label}
                          </span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Submit */}
              <Button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500 text-white"
                disabled={
                  createMutation.isPending ||
                  !title.trim() ||
                  !message.trim() ||
                  (!allUsers && selectedRoles.length === 0)
                }
              >
                {createMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Invio in corso...
                  </>
                ) : (
                  <>
                    <Megaphone className="h-4 w-4 mr-2" />
                    Invia Comunicazione
                  </>
                )}
              </Button>
            </form>
          </div>
        </div>

        {/* RIGHT — History */}
        <div className="lg:col-span-2">
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
            {/* Card header */}
            <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-200 dark:border-slate-800">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800">
                <Clock className="h-4 w-4 text-slate-500 dark:text-slate-400" />
              </div>
              <h2 className="font-semibold text-slate-900 dark:text-slate-100">
                Comunicazioni Inviate
              </h2>
            </div>

            {/* List */}
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {isLoading ? (
                // Loading skeleton
                <>
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="px-6 py-4 space-y-2">
                      <div className="flex items-center gap-3">
                        <Skeleton className="h-4 w-4 rounded-full" />
                        <Skeleton className="h-4 w-48" />
                        <Skeleton className="h-5 w-16 ml-auto rounded-full" />
                      </div>
                      <Skeleton className="h-3 w-full" />
                      <Skeleton className="h-3 w-32" />
                    </div>
                  ))}
                </>
              ) : broadcasts.length === 0 ? (
                // Empty state
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 mb-4">
                    <Megaphone className="h-6 w-6 text-slate-400 dark:text-slate-500" />
                  </div>
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                    Nessuna comunicazione inviata
                  </p>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    Le comunicazioni inviate appariranno qui.
                  </p>
                </div>
              ) : (
                broadcasts.map((broadcast) => (
                  <div
                    key={broadcast.id}
                    className="px-6 py-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      {/* Icon */}
                      <div className="mt-0.5 flex-shrink-0">
                        {getBroadcastTypeIcon(broadcast.type)}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-3 flex-wrap">
                          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                            {broadcast.title}
                          </p>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            {getStatusBadge(broadcast.status)}
                          </div>
                        </div>

                        <p className="mt-0.5 text-sm text-slate-600 dark:text-slate-400 line-clamp-2">
                          {broadcast.message.length > 80
                            ? `${broadcast.message.slice(0, 80)}…`
                            : broadcast.message}
                        </p>

                        <div className="mt-2 flex items-center gap-3 flex-wrap text-xs text-slate-500 dark:text-slate-400">
                          {/* Target */}
                          <span className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {broadcast.target_roles === null
                              ? "Tutti"
                              : broadcast.target_roles
                                  .map(getRoleLabel)
                                  .join(", ")}
                          </span>

                          {/* Stats — only if dispatched */}
                          {broadcast.status === "dispatched" && (
                            <span className="text-slate-400 dark:text-slate-500">
                              {broadcast.tenant_count} tenant ·{" "}
                              {broadcast.user_count} utenti
                            </span>
                          )}

                          {/* Date */}
                          <span className="ml-auto flex-shrink-0">
                            {formatDistanceToNow(
                              new Date(broadcast.created_at),
                              { addSuffix: true, locale: it },
                            )}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
