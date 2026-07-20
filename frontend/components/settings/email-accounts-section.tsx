"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  emailAccountsApi,
  emailLogsApi,
  type CreateEmailAccountData,
} from "@/lib/api/email-accounts";
import { settingsApi } from "@/lib/api/settings";
import { apiClient } from "@/lib/api/client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import {
  Plus,
  Edit2,
  Trash2,
  RefreshCw,
  Mail,
  CheckCircle2,
  XCircle,
  Star,
  Server,
  Loader2,
  Clock,
  AlertCircle,
  SendHorizonal,
  ChevronRight,
  ChevronLeft,
  Zap,
  Cloud,
} from "lucide-react";
import { toast } from "sonner";
import { handleMutationError } from "@/lib/utils/handle-mutation-error";

// ─── Zod Schema ───────────────────────────────────────────────────────────────

const emailAccountSchema = z.object({
  name: z.string().min(1, "Nome obbligatorio"),
  provider: z.enum(["smtp", "gmail", "outlook", "ses", "mailgun"]),
  from_name: z.string().min(1, "Nome mittente obbligatorio"),
  from_email: z.string().email("Email non valida"),
  smtp_host: z.string().optional(),
  smtp_port: z.number().optional(),
  smtp_encryption: z.enum(["tls", "ssl", "none"]).optional(),
  smtp_username: z.string().optional(),
  smtp_password: z.string().optional(),
  signature: z.string().optional(),
  is_active: z.boolean(),
  is_default: z.boolean(),
});

type EmailAccountFormValues = z.infer<typeof emailAccountSchema>;

// ─── Helpers ──────────────────────────────────────────────────────────────────

const PROVIDER_LABELS: Record<string, string> = {
  smtp: "SMTP",
  gmail: "Gmail",
  outlook: "Outlook",
  ses: "Amazon SES",
  mailgun: "Mailgun",
};

const PROVIDER_COLORS: Record<
  string,
  { bg: string; text: string; darkBg: string; darkText: string }
> = {
  smtp: {
    bg: "bg-slate-100",
    text: "text-slate-600",
    darkBg: "dark:bg-slate-800",
    darkText: "dark:text-slate-300",
  },
  gmail: {
    bg: "bg-red-50",
    text: "text-red-600",
    darkBg: "dark:bg-red-900/30",
    darkText: "dark:text-red-400",
  },
  outlook: {
    bg: "bg-blue-50",
    text: "text-blue-600",
    darkBg: "dark:bg-blue-900/30",
    darkText: "dark:text-blue-400",
  },
  ses: {
    bg: "bg-orange-50",
    text: "text-orange-600",
    darkBg: "dark:bg-orange-900/30",
    darkText: "dark:text-orange-400",
  },
  mailgun: {
    bg: "bg-purple-50",
    text: "text-purple-600",
    darkBg: "dark:bg-purple-900/30",
    darkText: "dark:text-purple-400",
  },
};

const SMTP_PROVIDERS = ["smtp", "gmail", "outlook"];
const OAUTH_PROVIDERS = ["gmail", "outlook"];

const DOCUMENT_SENDERS = [
  { key: "email.document_sender.quote", label: "Preventivi" },
  { key: "email.document_sender.invoice", label: "Fatture" },
  { key: "email.document_sender.ddt", label: "DDT" },
  { key: "email.document_sender.invitation", label: "Inviti" },
];

// ─── Email Logs Card ──────────────────────────────────────────────────────────

const LOG_STATUS_CONFIG: Record<
  string,
  { label: string; className: string; icon: React.ReactNode }
> = {
  sent: {
    label: "Inviato",
    className:
      "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-0",
    icon: <CheckCircle2 className="h-3 w-3" />,
  },
  failed: {
    label: "Fallito",
    className:
      "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-0",
    icon: <XCircle className="h-3 w-3" />,
  },
  pending: {
    label: "In attesa",
    className:
      "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 border-0",
    icon: <Clock className="h-3 w-3" />,
  },
  retrying: {
    label: "Tentativo",
    className:
      "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 border-0",
    icon: <AlertCircle className="h-3 w-3" />,
  },
};

const DOCUMENT_TYPE_LABELS: Record<string, string> = {
  quote: "Preventivo",
  invoice: "Fattura",
  ddt: "DDT",
  invitation: "Invito",
};

function formatLogDate(dateStr?: string | null): string {
  if (!dateStr) return "—";
  const date = new Date(dateStr);
  return date.toLocaleString("it-IT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function EmailLogsCard() {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [page, setPage] = useState(1);

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["email-logs", statusFilter, page],
    queryFn: () =>
      emailLogsApi.getAll({
        status: statusFilter !== "all" ? statusFilter : undefined,
        page,
      }),
    refetchInterval: 30_000,
  });

  const logs = data?.data ?? [];
  const meta = data?.meta;
  const totalPages = meta
    ? Math.ceil(meta.total / 20)
    : 1;

  return (
    <Card className="bg-white dark:bg-slate-900 border dark:border-slate-700">
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <CardTitle className="text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <SendHorizonal className="h-5 w-5" />
              Log Email Inviati
            </CardTitle>
            <CardDescription className="text-slate-500 dark:text-slate-400">
              Storico delle email inviate tramite gli account configurati
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {isFetching && !isLoading && (
              <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
            )}
            <Select
              value={statusFilter}
              onValueChange={(val) => {
                setStatusFilter(val);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-36 bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-slate-100">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tutti</SelectItem>
                <SelectItem value="sent">Inviati</SelectItem>
                <SelectItem value="failed">Falliti</SelectItem>
                <SelectItem value="pending">In attesa</SelectItem>
                <SelectItem value="retrying">Tentativo</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-12 animate-pulse rounded-md bg-slate-100 dark:bg-slate-800"
              />
            ))}
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-10 text-slate-500 dark:text-slate-400">
            <Mail className="mx-auto h-10 w-10 text-slate-300 dark:text-slate-700 mb-3" />
            <p className="font-medium">Nessun log trovato</p>
            <p className="text-sm mt-1">
              {statusFilter !== "all"
                ? "Prova a cambiare il filtro di stato"
                : "Le email inviate appariranno qui"}
            </p>
          </div>
        ) : (
          <>
            {/* Table header */}
            <div className="hidden md:grid grid-cols-[1fr_1.5fr_2fr_auto_auto] gap-3 px-3 pb-2 text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide border-b border-slate-200 dark:border-slate-700">
              <span>Data</span>
              <span>Destinatario</span>
              <span>Oggetto</span>
              <span>Documento</span>
              <span>Stato</span>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {logs.map((log) => {
                const statusCfg =
                  LOG_STATUS_CONFIG[log.status] ?? LOG_STATUS_CONFIG.pending;
                return (
                  <div
                    key={log.id}
                    className="grid grid-cols-1 md:grid-cols-[1fr_1.5fr_2fr_auto_auto] gap-1 md:gap-3 items-start md:items-center py-3 px-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-md transition-colors"
                  >
                    {/* Date */}
                    <span className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                      {formatLogDate(log.created_at)}
                    </span>

                    {/* Recipient */}
                    <span className="text-sm text-slate-700 dark:text-slate-300 truncate max-w-[200px]">
                      {log.to_name ? (
                        <>
                          <span className="font-medium">{log.to_name}</span>
                          <span className="text-slate-400 dark:text-slate-500 ml-1 text-xs">
                            &lt;{log.to_email}&gt;
                          </span>
                        </>
                      ) : (
                        log.to_email
                      )}
                    </span>

                    {/* Subject */}
                    <span className="text-sm text-slate-600 dark:text-slate-300 truncate">
                      {log.subject}
                    </span>

                    {/* Document type */}
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      {log.document_type
                        ? (DOCUMENT_TYPE_LABELS[log.document_type] ??
                          log.document_type)
                        : "—"}
                      {log.document_id ? ` #${log.document_id}` : ""}
                    </span>

                    {/* Status badge + attempts */}
                    <div className="flex items-center gap-2">
                      <Badge
                        className={`flex items-center gap-1 text-xs ${statusCfg.className}`}
                      >
                        {statusCfg.icon}
                        {statusCfg.label}
                      </Badge>
                      {log.attempts > 1 && (
                        <span className="text-xs text-slate-400 dark:text-slate-500">
                          {log.attempts}x
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-4 mt-2 border-t border-slate-200 dark:border-slate-700">
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  {meta?.total} email totali
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1}
                    className="h-7 text-xs border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300"
                  >
                    Precedente
                  </Button>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    {page} / {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page >= totalPages}
                    className="h-7 text-xs border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300"
                  >
                    Successiva
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

function formatTestDate(dateStr?: string | null): string {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "Appena testato";
  if (diffMins < 60) return `${diffMins}m fa`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h fa`;
  return `${Math.floor(diffHours / 24)}g fa`;
}

// ─── Google SVG ───────────────────────────────────────────────────────────────

function GoogleLogo() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="size-4" aria-hidden="true">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  )
}

// ─── Microsoft SVG ────────────────────────────────────────────────────────────

function MicrosoftLogo() {
  return (
    <svg viewBox="0 0 23 23" className="size-4" aria-hidden="true">
      <path fill="#f3f3f3" d="M0 0h23v23H0z" />
      <path fill="#f35325" d="M1 1h10v10H1z" />
      <path fill="#81bc06" d="M12 1h10v10H12z" />
      <path fill="#05a6f0" d="M1 12h10v10H1z" />
      <path fill="#ffba08" d="M12 12h10v10H12z" />
    </svg>
  )
}

// ─── Document Sender Selectors ────────────────────────────────────────────────

interface DocumentSendersCardProps {
  accounts: App.Data.EmailAccountData[];
}

function DocumentSendersCard({ accounts }: DocumentSendersCardProps) {
  const queryClient = useQueryClient();

  const { data: senderSettings } = useQuery({
    queryKey: ["settings", "email-senders"],
    queryFn: async () => {
      const keys = DOCUMENT_SENDERS.map((d) => d.key);
      const results: Record<string, string> = {};
      await Promise.allSettled(
        keys.map(async (key) => {
          try {
            const s = await settingsApi.getByKey(key, null);
            results[key] = s.value;
          } catch {
            results[key] = "";
          }
        }),
      );
      return results;
    },
  });

  const [localSenders, setLocalSenders] = useState<Record<string, string>>({});
  const [hasChanges, setHasChanges] = useState(false);

  const bulkUpdateMutation = useMutation({
    mutationFn: (settings: Array<{ key: string; value: string }>) =>
      settingsApi.bulkUpdate(settings),
    onSuccess: () => {
      toast.success("Mittenti salvati");
      setHasChanges(false);
      queryClient.invalidateQueries({ queryKey: ["settings", "email-senders"] });
    },
    onError: (error) => handleMutationError(error, "Errore nel salvataggio mittenti"),
  });

  const currentSenders = { ...(senderSettings ?? {}), ...localSenders };

  const handleSenderChange = (key: string, value: string) => {
    setLocalSenders((prev) => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const handleSave = () => {
    const updates = Object.entries(localSenders).map(([key, value]) => ({
      key,
      value,
    }));
    if (updates.length > 0) {
      bulkUpdateMutation.mutate(updates);
    }
  };

  return (
    <Card className="bg-white dark:bg-slate-900 border dark:border-slate-700">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Mittente per Tipo Documento
            </CardTitle>
            <CardDescription className="text-slate-500 dark:text-slate-400">
              Seleziona quale account usare per ogni tipo di documento
            </CardDescription>
          </div>
          {hasChanges && (
            <Button
              size="sm"
              onClick={handleSave}
              disabled={bulkUpdateMutation.isPending}
            >
              {bulkUpdateMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Salva
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2">
          {DOCUMENT_SENDERS.map(({ key, label }) => (
            <div key={key} className="space-y-1.5">
              <Label className="text-slate-700 dark:text-slate-300">
                {label}
              </Label>
              <Select
                value={currentSenders[key] || "none"}
                onValueChange={(val) =>
                  handleSenderChange(key, val === "none" ? "" : val)
                }
              >
                <SelectTrigger className="bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-slate-100">
                  <SelectValue placeholder="Seleziona account..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">
                    <span className="text-slate-500">— Nessuno —</span>
                  </SelectItem>
                  {accounts.map((acc) => (
                    <SelectItem key={acc.id} value={String(acc.id)}>
                      {acc.name} ({acc.from_email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Global Signature Card ────────────────────────────────────────────────────

function SignatureSettingsCard({
  companyLogoUrl,
  onImageUpload,
}: {
  companyLogoUrl?: string | null;
  onImageUpload: (file: File) => Promise<string>;
}) {
  const queryClient = useQueryClient();

  const { data: globalSignatureSetting } = useQuery({
    queryKey: ["settings", "email.signature"],
    queryFn: async () => {
      try {
        return await settingsApi.getByKey("email.signature", null);
      } catch {
        return null;
      }
    },
  });

  // Track local edits; fall back to server value when no edits yet
  const [localSignature, setLocalSignature] = useState<string | null>(null);
  const globalSignature =
    localSignature !== null
      ? localSignature
      : (globalSignatureSetting?.value ?? "");

  const saveMutation = useMutation({
    mutationFn: async (value: string) => {
      await settingsApi.bulkUpdate([{ key: "email.signature", value }]);
    },
    onSuccess: () => {
      toast.success("Firma globale salvata");
      queryClient.invalidateQueries({
        queryKey: ["settings", "email.signature"],
      });
    },
    onError: (error) => handleMutationError(error, "Errore nel salvataggio"),
  });

  return (
    <Card className="bg-white dark:bg-slate-900 border dark:border-slate-700">
      <CardHeader>
        <CardTitle className="text-base text-slate-900 dark:text-slate-100">
          Firma Email Globale
        </CardTitle>
        <CardDescription className="text-slate-500 dark:text-slate-400">
          Usata da tutti gli account che non hanno una firma specifica. Gli
          utenti possono sovrascriverla nelle loro impostazioni personali.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <RichTextEditor
          value={globalSignature}
          onChange={setLocalSignature}
          placeholder="Firma predefinita per tutte le email aziendali..."
          minHeight="140px"
          companyLogoUrl={companyLogoUrl}
          onImageUpload={onImageUpload}
        />
        <div className="flex justify-end">
          <Button
            onClick={() => saveMutation.mutate(globalSignature)}
            disabled={saveMutation.isPending}
            size="sm"
          >
            {saveMutation.isPending ? "Salvataggio..." : "Salva firma globale"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function EmailAccountsSection() {
  const queryClient = useQueryClient();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogStep, setDialogStep] = useState<"pick-provider" | "configure">("pick-provider");
  const [editingAccount, setEditingAccount] =
    useState<App.Data.EmailAccountData | null>(null);
  const [deleteTarget, setDeleteTarget] =
    useState<App.Data.EmailAccountData | null>(null);
  const [testingId, setTestingId] = useState<number | null>(null);
  const [isConnectingOAuth, setIsConnectingOAuth] = useState(false);

  // ── Queries ──
  const { data: accounts = [], isLoading } = useQuery({
    queryKey: ["email-accounts"],
    queryFn: emailAccountsApi.getAll,
  });

  const { data: companySettings } = useQuery({
    queryKey: ["settings", "company"],
    queryFn: async () => {
      const response = await apiClient.get("/settings", {
        params: { group: "company" },
      });
      const settings = response.data.data ?? response.data;
      const map: Record<string, string> = {};
      if (Array.isArray(settings)) {
        settings.forEach((s: { key: string; value: string }) => {
          map[s.key] = s.value;
        });
      }
      return map;
    },
  });

  // Build absolute URL for company logo (stored as relative path like /storage/tenants/…)
  const apiBaseUrl = (process.env.NEXT_PUBLIC_API_URL ?? "").replace(
    /\/api\/v1\/?$/,
    "",
  );
  const rawLogoPath = companySettings?.["company.logo"] ?? null;
  const companyLogoUrl = rawLogoPath
    ? rawLogoPath.startsWith("http")
      ? rawLogoPath
      : `${apiBaseUrl}${rawLogoPath}`
    : null;

  // ── Image upload for WYSIWYG editor ──
  const handleImageUpload = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append("image", file);
    // Pass Content-Type: undefined so axios removes the global 'application/json'
    // default and lets the browser set the correct multipart/form-data boundary.
    const response = await apiClient.post("/media/upload-image", formData, {
      headers: { "Content-Type": undefined },
    });
    return response.data.data?.url ?? response.data.url;
  };

  // ── Mutations ──
  const createMutation = useMutation({
    mutationFn: (data: CreateEmailAccountData) => emailAccountsApi.create(data),
    onSuccess: () => {
      toast.success("Account email creato");
      queryClient.invalidateQueries({ queryKey: ["email-accounts"] });
      setDialogOpen(false);
    },
    onError: (error) => handleMutationError(error, "Errore nella creazione account"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: CreateEmailAccountData }) =>
      emailAccountsApi.update(id, data),
    onSuccess: () => {
      toast.success("Account email aggiornato");
      queryClient.invalidateQueries({ queryKey: ["email-accounts"] });
      setDialogOpen(false);
    },
    onError: (error) => handleMutationError(error, "Errore nell'aggiornamento account"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => emailAccountsApi.delete(id),
    onSuccess: () => {
      toast.success("Account email eliminato");
      queryClient.invalidateQueries({ queryKey: ["email-accounts"] });
      setDeleteTarget(null);
    },
    onError: (error) => handleMutationError(error, "Errore nell'eliminazione account"),
  });

  const setDefaultMutation = useMutation({
    mutationFn: (id: number) => emailAccountsApi.setDefault(id),
    onSuccess: () => {
      toast.success("Account predefinito aggiornato");
      queryClient.invalidateQueries({ queryKey: ["email-accounts"] });
    },
    onError: (error) => handleMutationError(error, "Errore nell'impostare account predefinito"),
  });

  // ── Form ──
  const form = useForm<EmailAccountFormValues>({
    resolver: zodResolver(emailAccountSchema),
    defaultValues: {
      name: "",
      provider: "smtp",
      from_name: "",
      from_email: "",
      smtp_host: "",
      smtp_port: undefined,
      smtp_encryption: "tls",
      smtp_username: "",
      smtp_password: "",
      signature: "",
      is_active: true,
      is_default: false,
    },
  });

  const provider = form.watch("provider");
  const showSmtp = SMTP_PROVIDERS.includes(provider);
  const isOAuthProvider = OAUTH_PROVIDERS.includes(provider);

  const openCreate = () => {
    setEditingAccount(null);
    setDialogStep("pick-provider");
    form.reset({
      name: "",
      provider: "smtp",
      from_name: "",
      from_email: "",
      smtp_host: "",
      smtp_port: undefined,
      smtp_encryption: "tls",
      smtp_username: "",
      smtp_password: "",
      signature: "",
      is_active: true,
      is_default: false,
    });
    setDialogOpen(true);
  };

  const handleProviderSelect = (providerId: string) => {
    form.setValue("provider", providerId as EmailAccountFormValues["provider"]);
    setDialogStep("configure");
  };

  const openEdit = (account: App.Data.EmailAccountData) => {
    setEditingAccount(account);
    setDialogStep("configure");
    form.reset({
      name: account.name,
      provider: account.provider as EmailAccountFormValues["provider"],
      from_name: account.from_name,
      from_email: account.from_email,
      smtp_host: account.smtp_host ?? "",
      smtp_port: account.smtp_port ?? undefined,
      smtp_encryption: (
        account.smtp_encryption === "tls" || account.smtp_encryption === "ssl"
          ? account.smtp_encryption
          : "none"
      ) as "tls" | "ssl" | "none",
      smtp_username: account.smtp_username ?? "",
      smtp_password: "",
      signature: account.signature ?? "",
      is_active: account.is_active,
      is_default: account.is_default,
    });
    setDialogOpen(true);
  };

  const onSubmit = (values: EmailAccountFormValues) => {
    const payload: CreateEmailAccountData = {
      name: values.name,
      provider: values.provider,
      from_name: values.from_name,
      from_email: values.from_email,
      smtp_host: values.smtp_host || undefined,
      smtp_port: values.smtp_port || undefined,
      smtp_encryption:
        !values.smtp_encryption || values.smtp_encryption === "none"
          ? null
          : values.smtp_encryption,
      smtp_username: values.smtp_username || undefined,
      signature: values.signature || null,
      is_active: values.is_active,
      is_default: values.is_default,
    };

    if (values.smtp_password) {
      payload.smtp_password = values.smtp_password;
    }

    if (editingAccount && editingAccount.id !== undefined) {
      updateMutation.mutate({ id: editingAccount.id, data: payload });
    } else if (!editingAccount) {
      createMutation.mutate(payload);
    }
  };

  const handleTest = async (account: App.Data.EmailAccountData) => {
    if (account.id === undefined) return;
    setTestingId(account.id);
    try {
      const result = await emailAccountsApi.test(account.id);
      if (result.success) {
        toast.success(result.message || "Connessione riuscita");
      } else {
        toast.error(result.message || "Test fallito");
      }
      queryClient.invalidateQueries({ queryKey: ["email-accounts"] });
    } catch {
      toast.error("Errore durante il test di connessione");
    } finally {
      setTestingId(null);
    }
  };

  const handleOAuthConnect = async (oauthProvider: string) => {
    setIsConnectingOAuth(true);

    // Center popup on screen
    const w = 600, h = 700;
    const left = Math.round(window.screenX + (window.outerWidth - w) / 2);
    const top = Math.round(window.screenY + (window.outerHeight - h) / 2);

    // Open popup BEFORE await — browsers block window.open in async callbacks
    const popup = window.open(
      "about:blank",
      "_blank",
      `width=${w},height=${h},left=${left},top=${top},scrollbars=yes,resizable=yes`
    );

    if (!popup) {
      toast.error("Il browser ha bloccato il popup. Consenti i popup per questo sito e riprova.");
      setIsConnectingOAuth(false);
      return;
    }

    try {
      const response = await apiClient.get(`/email-accounts/oauth/${oauthProvider}/redirect`);
      const url: string = response.data?.data?.url ?? response.data?.url;

      if (!url) {
        popup.close();
        toast.error("URL OAuth non ricevuto dal server.");
        setIsConnectingOAuth(false);
        return;
      }

      popup.location.href = url;

      // Poll popup: intercept when it lands back on our domain with oauth result
      const timer = setInterval(() => {
        if (popup.closed) {
          clearInterval(timer);
          setIsConnectingOAuth(false);
          return;
        }

        try {
          // This throws a cross-origin error while on Google/Microsoft — that's expected
          const popupUrl = popup.location.href;

          if (popupUrl.includes("oauth=success")) {
            const params = new URLSearchParams(new URL(popupUrl).search);
            const accountId = params.get("account_id");
            popup.close();
            clearInterval(timer);
            queryClient.invalidateQueries({ queryKey: ["email-accounts"] });
            setIsConnectingOAuth(false);
            setDialogOpen(false);
            toast.success(
              accountId
                ? "Account email collegato con successo."
                : "Account email collegato con successo."
            );
          } else if (popupUrl.includes("oauth=error")) {
            const params = new URLSearchParams(new URL(popupUrl).search);
            const message = params.get("message") ?? "Errore durante la connessione OAuth.";
            popup.close();
            clearInterval(timer);
            setIsConnectingOAuth(false);
            toast.error(decodeURIComponent(message));
          }
        } catch {
          // Still on Google/Microsoft domain (cross-origin) — ignore and keep polling
        }
      }, 500);
    } catch {
      popup.close();
      toast.error("Impossibile avviare il login OAuth. Verifica la configurazione del provider.");
      setIsConnectingOAuth(false);
    }
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

  // ── Render ──
  return (
    <div className="space-y-6">
      {/* Account List */}
      <Card className="bg-white dark:bg-slate-900 border dark:border-slate-700">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Account Email Aziendali
              </CardTitle>
              <CardDescription className="text-slate-500 dark:text-slate-400">
                Gestisci gli account email per l&apos;invio di documenti e
                notifiche
              </CardDescription>
            </div>
            <Button onClick={openCreate} size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Aggiungi Account
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <div
                  key={i}
                  className="h-20 animate-pulse rounded-lg bg-slate-100 dark:bg-slate-800"
                />
              ))}
            </div>
          ) : accounts.length === 0 ? (
            <div className="text-center py-10 text-slate-500 dark:text-slate-400">
              <Mail className="mx-auto h-12 w-12 text-slate-300 dark:text-slate-700 mb-3" />
              <p className="font-medium">Nessun account email configurato</p>
              <p className="text-sm mt-1">
                Aggiungi un account SMTP o integrato per iniziare a inviare
                email
              </p>
              <Button onClick={openCreate} variant="outline" className="mt-4">
                <Plus className="mr-2 h-4 w-4" />
                Aggiungi il primo account
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {accounts.map((account) => {
                const colors =
                  PROVIDER_COLORS[account.provider] ?? PROVIDER_COLORS.smtp;
                return (
                  <div
                    key={account.id}
                    className="flex items-start justify-between p-4 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-slate-900 dark:text-slate-100">
                          {account.name}
                        </span>
                        <Badge
                          className={`${colors.bg} ${colors.text} ${colors.darkBg} ${colors.darkText} border-0 text-xs`}
                        >
                          {PROVIDER_LABELS[account.provider] ?? account.provider}
                        </Badge>
                        {account.is_default && (
                          <Badge className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-0 text-xs">
                            <Star className="mr-1 h-3 w-3" />
                            Default
                          </Badge>
                        )}
                        {!account.is_active && (
                          <Badge
                            variant="outline"
                            className="text-slate-400 dark:text-slate-500 text-xs"
                          >
                            Inattivo
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                        {account.from_name} &lt;{account.from_email}&gt;
                      </p>
                      <div className="flex items-center gap-3 mt-1 text-xs text-slate-400 dark:text-slate-500 flex-wrap">
                        {account.smtp_host && (
                          <span className="flex items-center gap-1">
                            <Server className="h-3 w-3" />
                            {account.smtp_host}:{account.smtp_port ?? 587}
                            {account.smtp_encryption
                              ? ` · ${account.smtp_encryption.toUpperCase()}`
                              : ""}
                          </span>
                        )}
                        {account.last_tested_at && (
                          <span
                            className={`flex items-center gap-1 ${
                              account.last_test_success
                                ? "text-green-600 dark:text-green-400"
                                : "text-red-500 dark:text-red-400"
                            }`}
                          >
                            {account.last_test_success ? (
                              <CheckCircle2 className="h-3 w-3" />
                            ) : (
                              <XCircle className="h-3 w-3" />
                            )}
                            Testato {formatTestDate(account.last_tested_at)}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1 ml-3 shrink-0">
                      {!account.is_default && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 px-2 text-xs text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400"
                          onClick={() =>
                            account.id !== undefined &&
                            setDefaultMutation.mutate(account.id)
                          }
                          disabled={setDefaultMutation.isPending}
                          title="Imposta come predefinito"
                        >
                          <Star className="h-3.5 w-3.5" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 px-2 text-xs text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
                        onClick={() => handleTest(account)}
                        disabled={testingId === account.id}
                        title="Testa connessione"
                      >
                        {testingId === account.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <RefreshCw className="h-3.5 w-3.5" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 px-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
                        onClick={() => openEdit(account)}
                        title="Modifica"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 px-2 text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400"
                        onClick={() => setDeleteTarget(account)}
                        title="Elimina"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Document Senders */}
      {accounts.length > 0 && <DocumentSendersCard accounts={accounts} />}

      {/* Global Signature */}
      <SignatureSettingsCard
        companyLogoUrl={companyLogoUrl}
        onImageUpload={handleImageUpload}
      />

      {/* Email Logs */}
      <EmailLogsCard />

      {/* Create / Edit Dialog — 2-step flow */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-white dark:bg-slate-900 border dark:border-slate-700 max-w-lg p-0 flex flex-col max-h-[90vh] overflow-hidden">
          {dialogStep === "pick-provider" ? (
            /* ── Step 1: Provider Picker ── */
            <>
              <DialogHeader className="px-4 py-4 border-b border-slate-200 dark:border-slate-700 flex-shrink-0">
                <DialogTitle className="text-slate-900 dark:text-slate-100 text-base">
                  Scegli il provider email
                </DialogTitle>
                <DialogDescription className="text-slate-500 dark:text-slate-400 text-sm">
                  Seleziona come vuoi connettere il tuo account email
                </DialogDescription>
              </DialogHeader>

              <div className="flex-1 overflow-y-auto py-2">
                {[
                  {
                    id: "gmail",
                    name: "Gmail",
                    description: "Google Workspace o Gmail personale",
                    type: "oauth",
                    iconBg: "bg-white border border-slate-200 dark:bg-slate-800 dark:border-slate-700",
                    icon: <GoogleLogo />,
                  },
                  {
                    id: "outlook",
                    name: "Outlook / Microsoft 365",
                    description: "Account Microsoft aziendale o personale",
                    type: "oauth",
                    iconBg: "bg-sky-100 dark:bg-sky-900/30",
                    icon: <MicrosoftLogo />,
                  },
                  {
                    id: "smtp",
                    name: "SMTP Personalizzato",
                    description: "Aruba, hosting aziendale o qualsiasi server",
                    type: "smtp",
                    iconBg: "bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700",
                    icon: <Server className="h-5 w-5 text-slate-600 dark:text-slate-300" />,
                  },
                  {
                    id: "mailgun",
                    name: "Mailgun",
                    description: "Invio massivo transazionale via SMTP relay",
                    type: "smtp",
                    iconBg: "bg-violet-100 dark:bg-violet-900/30 border border-violet-200 dark:border-violet-800",
                    icon: <Zap className="h-5 w-5 text-violet-600 dark:text-violet-400" />,
                  },
                  {
                    id: "ses",
                    name: "Amazon SES",
                    description: "SMTP relay su infrastruttura AWS",
                    type: "smtp",
                    iconBg: "bg-orange-100 dark:bg-orange-900/30 border border-orange-200 dark:border-orange-800",
                    icon: <Cloud className="h-5 w-5 text-orange-500 dark:text-orange-400" />,
                  },
                ].map((p, idx, arr) => (
                  <div key={p.id}>
                    <button
                      onClick={() => handleProviderSelect(p.id)}
                      className="w-full flex items-center gap-3.5 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors text-left"
                    >
                      <div
                        className={`w-12 h-12 rounded-2xl ${p.iconBg} flex items-center justify-center shrink-0`}
                      >
                        {p.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                            {p.name}
                          </span>
                          <span
                            className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
                              p.type === "oauth"
                                ? "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400"
                                : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                            }`}
                          >
                            {p.type === "oauth" ? "OAuth" : "SMTP"}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          {p.description}
                        </p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-slate-400 dark:text-slate-500 shrink-0" />
                    </button>
                    {idx < arr.length - 1 && (
                      <div className="h-px bg-slate-100 dark:bg-slate-800 ml-[72px]" />
                    )}
                  </div>
                ))}
              </div>

              <DialogFooter className="px-4 py-3 border-t border-slate-200 dark:border-slate-700 flex-shrink-0">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                  className="border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300"
                >
                  Annulla
                </Button>
              </DialogFooter>
            </>
          ) : (
            /* ── Step 2: Configuration Form ── */
            (() => {
              const PROVIDER_CONFIGS: Record<
                string,
                {
                  name: string;
                  description: string;
                  iconBg: string;
                  icon: React.ReactNode;
                  type: "oauth" | "smtp";
                }
              > = {
                gmail: {
                  name: "Gmail",
                  description: "Google Workspace o Gmail personale",
                  iconBg: "bg-white border border-slate-200 dark:bg-slate-800 dark:border-slate-700",
                  icon: <GoogleLogo />,
                  type: "oauth",
                },
                outlook: {
                  name: "Outlook / Microsoft 365",
                  description: "Account Microsoft aziendale o personale",
                  iconBg: "bg-sky-100 dark:bg-sky-900/30",
                  icon: <MicrosoftLogo />,
                  type: "oauth",
                },
                smtp: {
                  name: "SMTP Personalizzato",
                  description: "Aruba, hosting aziendale o qualsiasi server",
                  iconBg: "bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700",
                  icon: <Server className="h-4 w-4 text-slate-600 dark:text-slate-300" />,
                  type: "smtp",
                },
                mailgun: {
                  name: "Mailgun",
                  description: "Invio massivo transazionale via SMTP relay",
                  iconBg: "bg-violet-100 dark:bg-violet-900/30 border border-violet-200 dark:border-violet-800",
                  icon: <Zap className="h-4 w-4 text-violet-600 dark:text-violet-400" />,
                  type: "smtp",
                },
                ses: {
                  name: "Amazon SES",
                  description: "SMTP relay su infrastruttura AWS",
                  iconBg: "bg-orange-100 dark:bg-orange-900/30 border border-orange-200 dark:border-orange-800",
                  icon: <Cloud className="h-4 w-4 text-orange-500 dark:text-orange-400" />,
                  type: "smtp",
                },
              };

              const providerCfg =
                PROVIDER_CONFIGS[provider] ?? PROVIDER_CONFIGS.smtp;

              return (
                <>
                  {/* Header FISSO */}
                  <DialogHeader className="px-4 py-3 border-b border-slate-200 dark:border-slate-700 flex-shrink-0">
                    <div className="flex items-center gap-3">
                      {!editingAccount && (
                        <button
                          type="button"
                          onClick={() => setDialogStep("pick-provider")}
                          className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors"
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </button>
                      )}
                      <div
                        className={`w-9 h-9 rounded-xl ${providerCfg.iconBg} flex items-center justify-center shrink-0`}
                      >
                        {providerCfg.icon}
                      </div>
                      <div>
                        <DialogTitle className="text-slate-900 dark:text-slate-100 text-sm font-semibold leading-tight">
                          {editingAccount
                            ? `Modifica · ${providerCfg.name}`
                            : providerCfg.name}
                        </DialogTitle>
                        <DialogDescription className="text-xs text-slate-500 dark:text-slate-400">
                          {editingAccount
                            ? editingAccount.from_email
                            : providerCfg.description}
                        </DialogDescription>
                      </div>
                    </div>
                  </DialogHeader>

                  {/* Body SCROLLABILE */}
                  <div className="flex-1 overflow-y-auto px-6 py-4">
                    <form
                      id="email-account-form"
                      onSubmit={form.handleSubmit(onSubmit)}
                      className="space-y-4"
                    >
                      {/* Name */}
                      <div className="space-y-1.5">
                        <Label
                          htmlFor="name"
                          className="text-slate-700 dark:text-slate-300"
                        >
                          Nome account <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="name"
                          {...form.register("name")}
                          placeholder="es. Email principale"
                          className="bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-slate-100"
                        />
                        {form.formState.errors.name && (
                          <p className="text-xs text-red-500">
                            {form.formState.errors.name.message}
                          </p>
                        )}
                      </div>

                      {/* From name + email — sempre visibili */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <Label
                            htmlFor="from_name"
                            className="text-slate-700 dark:text-slate-300"
                          >
                            Nome mittente{" "}
                            <span className="text-red-500">*</span>
                          </Label>
                          <Input
                            id="from_name"
                            {...form.register("from_name")}
                            placeholder="Acme Srl"
                            className="bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-slate-100"
                          />
                          {form.formState.errors.from_name && (
                            <p className="text-xs text-red-500">
                              {form.formState.errors.from_name.message}
                            </p>
                          )}
                        </div>
                        <div className="space-y-1.5">
                          <Label
                            htmlFor="from_email"
                            className="text-slate-700 dark:text-slate-300"
                          >
                            Email mittente{" "}
                            <span className="text-red-500">*</span>
                          </Label>
                          <Input
                            id="from_email"
                            type="email"
                            {...form.register("from_email")}
                            placeholder="no-reply@acme.it"
                            className="bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-slate-100"
                          />
                          {form.formState.errors.from_email && (
                            <p className="text-xs text-red-500">
                              {form.formState.errors.from_email.message}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* OAuth: pannello connessione */}
                      {isOAuthProvider && (
                        <div className="rounded-xl border border-slate-200 dark:border-slate-700 p-4 space-y-3 bg-slate-50 dark:bg-slate-800/40">
                          <p className="text-sm text-slate-600 dark:text-slate-400">
                            Connetti il tuo account{" "}
                            {provider === "gmail" ? "Gmail" : "Outlook"} in
                            modo sicuro senza salvare la password.
                          </p>
                          <Button
                            type="button"
                            variant="outline"
                            className="w-full gap-2 border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                            onClick={() => handleOAuthConnect(provider)}
                            disabled={isConnectingOAuth}
                          >
                            {provider === "gmail" ? (
                              <GoogleLogo />
                            ) : (
                              <MicrosoftLogo />
                            )}
                            {isConnectingOAuth
                              ? "Apertura..."
                              : `Accedi con ${provider === "gmail" ? "Google" : "Microsoft"}`}
                          </Button>
                        </div>
                      )}

                      {/* SMTP: credenziali */}
                      {!isOAuthProvider && (
                        <>
                          {/* Provider hint */}
                          {provider === "mailgun" && (
                            <p className="text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 rounded-lg px-3 py-2 border border-slate-200 dark:border-slate-700">
                              Usa{" "}
                              <code className="font-mono text-violet-600 dark:text-violet-400">
                                smtp.mailgun.org:587
                              </code>{" "}
                              con TLS
                            </p>
                          )}
                          {provider === "ses" && (
                            <p className="text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 rounded-lg px-3 py-2 border border-slate-200 dark:border-slate-700">
                              Usa{" "}
                              <code className="font-mono text-orange-600 dark:text-orange-400">
                                email-smtp.&#123;region&#125;.amazonaws.com:587
                              </code>
                            </p>
                          )}

                          {/* SMTP section */}
                          <div className="space-y-3 rounded-lg border border-slate-200 dark:border-slate-700 p-3 bg-slate-50 dark:bg-slate-800/50">
                            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                              Configurazione SMTP
                            </p>

                            <div className="grid grid-cols-2 gap-3">
                              <div className="space-y-1.5">
                                <Label
                                  htmlFor="smtp_host"
                                  className="text-slate-700 dark:text-slate-300"
                                >
                                  Host SMTP
                                </Label>
                                <Input
                                  id="smtp_host"
                                  {...form.register("smtp_host")}
                                  placeholder="smtp.example.com"
                                  className="bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-slate-100"
                                />
                              </div>
                              <div className="space-y-1.5">
                                <Label
                                  htmlFor="smtp_port"
                                  className="text-slate-700 dark:text-slate-300"
                                >
                                  Porta
                                </Label>
                                <Input
                                  id="smtp_port"
                                  type="number"
                                  {...form.register("smtp_port", {
                                    valueAsNumber: true,
                                  })}
                                  placeholder="587"
                                  className="bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-slate-100"
                                />
                              </div>
                            </div>

                            <div className="space-y-1.5">
                              <Label className="text-slate-700 dark:text-slate-300">
                                Crittografia
                              </Label>
                              <Select
                                value={
                                  form.watch("smtp_encryption") ?? "none"
                                }
                                onValueChange={(val) =>
                                  form.setValue(
                                    "smtp_encryption",
                                    val as "tls" | "ssl" | "none",
                                  )
                                }
                              >
                                <SelectTrigger className="bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-slate-100">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="tls">
                                    TLS (STARTTLS)
                                  </SelectItem>
                                  <SelectItem value="ssl">SSL</SelectItem>
                                  <SelectItem value="none">Nessuna</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                              <div className="space-y-1.5">
                                <Label
                                  htmlFor="smtp_username"
                                  className="text-slate-700 dark:text-slate-300"
                                >
                                  Username
                                </Label>
                                <Input
                                  id="smtp_username"
                                  {...form.register("smtp_username")}
                                  placeholder="user@example.com"
                                  className="bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-slate-100"
                                />
                              </div>
                              <div className="space-y-1.5">
                                <Label
                                  htmlFor="smtp_password"
                                  className="text-slate-700 dark:text-slate-300"
                                >
                                  Password
                                </Label>
                                <Input
                                  id="smtp_password"
                                  type="password"
                                  {...form.register("smtp_password")}
                                  placeholder={
                                    editingAccount
                                      ? "Lascia vuoto per non cambiare"
                                      : "••••••••"
                                  }
                                  className="bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-slate-100"
                                />
                              </div>
                            </div>
                          </div>
                        </>
                      )}

                      {/* Firma — SEMPRE visibile */}
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                          Firma email
                        </Label>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          La firma di questo account ha priorità su firma
                          utente e firma globale.
                        </p>
                        <Controller
                          name="signature"
                          control={form.control}
                          render={({ field }) => (
                            <RichTextEditor
                              value={field.value ?? ""}
                              onChange={field.onChange}
                              placeholder="Firma per questo account email (opzionale)..."
                              minHeight="100px"
                              companyLogoUrl={companyLogoUrl}
                              onImageUpload={handleImageUpload}
                            />
                          )}
                        />
                      </div>

                      {/* Switches — SEMPRE visibili */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <Label className="text-slate-700 dark:text-slate-300">
                              Account attivo
                            </Label>
                            <p className="text-xs text-slate-400 dark:text-slate-500">
                              Disabilita per sospendere senza eliminare
                            </p>
                          </div>
                          <Switch
                            checked={form.watch("is_active")}
                            onCheckedChange={(v) =>
                              form.setValue("is_active", v)
                            }
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <Label className="text-slate-700 dark:text-slate-300">
                              Account predefinito
                            </Label>
                            <p className="text-xs text-slate-400 dark:text-slate-500">
                              Usato quando non è specificato un account
                            </p>
                          </div>
                          <Switch
                            checked={form.watch("is_default")}
                            onCheckedChange={(v) =>
                              form.setValue("is_default", v)
                            }
                          />
                        </div>
                      </div>
                    </form>
                  </div>

                  {/* Footer FISSO */}
                  <DialogFooter className="px-6 py-4 border-t border-slate-200 dark:border-slate-700 flex-shrink-0">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setDialogOpen(false)}
                      className="border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300"
                    >
                      Annulla
                    </Button>
                    {(!isOAuthProvider || editingAccount) && (
                      <Button
                        type="submit"
                        form="email-account-form"
                        disabled={isSaving}
                      >
                        {isSaving ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : null}
                        {editingAccount ? "Salva Modifiche" : "Crea Account"}
                      </Button>
                    )}
                  </DialogFooter>
                </>
              );
            })()
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent className="bg-white dark:bg-slate-900 border dark:border-slate-700">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-slate-900 dark:text-slate-100">
              Elimina account email
            </AlertDialogTitle>
            <AlertDialogDescription className="text-slate-500 dark:text-slate-400">
              Sei sicuro di voler eliminare{" "}
              <strong className="text-slate-700 dark:text-slate-300">
                {deleteTarget?.name}
              </strong>
              ? Questa azione non è reversibile.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300">
              Annulla
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={() =>
                deleteTarget?.id !== undefined &&
                deleteMutation.mutate(deleteTarget.id)
              }
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Elimina
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
