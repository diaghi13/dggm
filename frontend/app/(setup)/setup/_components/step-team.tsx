"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { usersApi } from "@/lib/api/users";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, Copy, Check } from "lucide-react";
import { toast } from "sonner";

const ROLES = [
  { value: "SuperAdmin", label: "Super Admin" },
  { value: "Admin", label: "Admin" },
  { value: "ProjectManager", label: "Project Manager" },
  { value: "Foreman", label: "Capo cantiere" },
  { value: "Worker", label: "Operaio" },
  { value: "Accountant", label: "Contabile" },
  { value: "WarehouseManager", label: "Responsabile Magazzino" },
];

function generatePassword(): string {
  const chars =
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%";
  let password = "";
  for (let i = 0; i < 12; i++) {
    password += chars[Math.floor(Math.random() * chars.length)];
  }
  return password;
}

const schema = z.object({
  name: z.string().min(1, "Il nome è obbligatorio"),
  email: z.string().email("Email non valida"),
  role: z.string().min(1, "Seleziona un ruolo"),
});

type FormValues = z.infer<typeof schema>;

interface StepTeamProps {
  onComplete: () => void;
  onSkip: () => void;
}

export function StepTeam({ onComplete, onSkip }: StepTeamProps) {
  const [createdPassword, setCreatedPassword] = useState<string | null>(null);
  const [createdEmail, setCreatedEmail] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      email: "",
      role: "Admin",
    },
  });

  const roleValue = watch("role");

  const mutation = useMutation({
    mutationFn: (values: FormValues & { password: string }) =>
      usersApi.create({
        name: values.name,
        email: values.email,
        password: values.password,
        password_confirmation: values.password,
        roles: [values.role],
        is_active: true,
      }),
    onSuccess: (_data, variables) => {
      setCreatedPassword(variables.password);
      setCreatedEmail(variables.email);
      toast.success("Utente creato con successo");
    },
    onError: () => {
      toast.error("Errore nella creazione dell'utente");
    },
  });

  const onSubmit = (values: FormValues) => {
    const password = generatePassword();
    mutation.mutate({ ...values, password });
  };

  const copyPassword = async () => {
    if (createdPassword) {
      await navigator.clipboard.writeText(createdPassword);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (createdPassword) {
    return (
      <div>
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
            Utente creato
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Condividi le credenziali con il nuovo membro del team.
          </p>
        </div>

        <div className="rounded-lg border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950/30 p-4 space-y-3">
          <div>
            <p className="text-xs text-green-700 dark:text-green-400 font-medium mb-0.5">
              Email
            </p>
            <p className="text-sm font-mono text-green-900 dark:text-green-200">
              {createdEmail}
            </p>
          </div>
          <div>
            <p className="text-xs text-green-700 dark:text-green-400 font-medium mb-0.5">
              Password temporanea
            </p>
            <div className="flex items-center gap-2">
              <code className="flex-1 text-sm font-mono bg-white dark:bg-slate-900 border border-green-200 dark:border-green-700 px-3 py-1.5 rounded text-green-900 dark:text-green-100">
                {createdPassword}
              </code>
              <Button
                size="sm"
                variant="outline"
                onClick={copyPassword}
                className="shrink-0 border-green-300 dark:border-green-700"
              >
                {copied ? (
                  <Check className="w-3.5 h-3.5 text-green-600" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </Button>
            </div>
          </div>
        </div>

        <p className="text-xs text-slate-500 dark:text-slate-400 mt-3">
          L&apos;utente dovrà cambiare la password al primo accesso.
        </p>

        <div className="pt-6 flex justify-end">
          <Button onClick={onComplete}>Continua</Button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
            Aggiungi un membro del team
          </h2>
          <Badge variant="outline" className="text-xs font-normal">
            Opzionale
          </Badge>
        </div>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Puoi saltare questo passaggio e aggiungere utenti in seguito dalle
          impostazioni.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="name">Nome completo</Label>
          <Input
            id="name"
            {...register("name")}
            placeholder="Mario Rossi"
          />
          {errors.name && (
            <p className="text-xs text-red-500">{errors.name.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            {...register("email")}
            placeholder="mario.rossi@azienda.it"
          />
          {errors.email && (
            <p className="text-xs text-red-500">{errors.email.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="role">Ruolo</Label>
          <Select
            value={roleValue}
            onValueChange={(v) => setValue("role", v)}
          >
            <SelectTrigger id="role">
              <SelectValue placeholder="Seleziona un ruolo" />
            </SelectTrigger>
            <SelectContent>
              {ROLES.map((r) => (
                <SelectItem key={r.value} value={r.value}>
                  {r.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.role && (
            <p className="text-xs text-red-500">{errors.role.message}</p>
          )}
        </div>

        <div className="pt-2 flex items-center justify-between">
          <Button type="button" variant="ghost" onClick={onSkip}>
            Salta
          </Button>
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending && (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            )}
            Crea utente
          </Button>
        </div>
      </form>
    </div>
  );
}
