"use client";

import React, { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { finalBalancesApi } from "@/lib/api/final-balances";
import { projectsApi } from "@/lib/api/projects";
import { quotesApi } from "@/lib/api/quotes";
import { customersApi } from "@/lib/api/customers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Save, FileCheck } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ProtectedRoute } from "@/components/features/auth/protected-route";
import type { CreateFinalBalanceInput } from "@/lib/types";

const NONE_VALUE = "__none__";

export default function NewFinalBalancePage() {
  return (
    <ProtectedRoute permission="projects.view">
      <NewFinalBalancePageContent />
    </ProtectedRoute>
  );
}

function NewFinalBalancePageContent() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [title, setTitle] = useState("");
  const [projectId, setProjectId] = useState<string>("");
  const [quoteId, setQuoteId] = useState<string>("");
  const [customerId, setCustomerId] = useState<string>("");
  const [referenceText, setReferenceText] = useState("");
  const [taxPercentage, setTaxPercentage] = useState("22");
  const [discountPercentage, setDiscountPercentage] = useState("0");
  const [isPartial, setIsPartial] = useState(false);
  const [notes, setNotes] = useState("");

  // Fetch projects
  const { data: projectsData } = useQuery({
    queryKey: ["projects-select"],
    queryFn: () => projectsApi.getAll({ per_page: 100, is_active: true }),
  });
  const projects = Array.isArray(projectsData?.data) ? projectsData.data : [];

  // Fetch quotes
  const { data: quotesData } = useQuery({
    queryKey: ["quotes-select"],
    queryFn: () => quotesApi.getAll({ per_page: 100 }),
  });
  const quotes = Array.isArray(quotesData?.data) ? quotesData.data : [];

  // Fetch customers
  const { data: customersData } = useQuery({
    queryKey: ["customers-select"],
    queryFn: () => customersApi.getAll({ per_page: 100, is_active: true }),
  });
  const customers = Array.isArray(customersData?.data) ? customersData.data : [];

  const createMutation = useMutation({
    mutationFn: finalBalancesApi.create,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["final-balances"] });
      toast.success("Final Balance creato con successo");
      router.push(`/final-balances/${data.id}`);
    },
    onError: (error: Error) => {
      toast.error("Errore", {
        description: error.message || "Impossibile creare il Final Balance",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      toast.error("Il titolo è obbligatorio");
      return;
    }

    const payload: CreateFinalBalanceInput = {
      title: title.trim(),
      project_id: projectId && projectId !== NONE_VALUE ? Number(projectId) : null,
      quote_id: quoteId && quoteId !== NONE_VALUE ? Number(quoteId) : null,
      customer_id: customerId && customerId !== NONE_VALUE ? Number(customerId) : null,
      reference_text: referenceText.trim() || null,
      tax_percentage: Number(taxPercentage),
      discount_percentage: Number(discountPercentage),
      is_partial: isPartial,
      notes: notes.trim() || null,
    };

    createMutation.mutate(payload);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/final-balances">
          <Button
            variant="outline"
            size="icon"
            className="border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
            Nuovo Final Balance
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            Crea un nuovo consuntivo
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Main Info */}
        <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
          <CardHeader>
            <CardTitle className="text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <FileCheck className="h-5 w-5" />
              Informazioni Principali
            </CardTitle>
            <CardDescription className="text-slate-600 dark:text-slate-400">
              Dati fondamentali del consuntivo
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Title */}
            <div className="space-y-2">
              <Label
                htmlFor="title"
                className="text-slate-700 dark:text-slate-300"
              >
                Titolo <span className="text-red-500">*</span>
              </Label>
              <Input
                id="title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Es. Consuntivo Progetto Via Roma 2024..."
                required
                className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
              />
            </div>

            {/* Project */}
            <div className="space-y-2">
              <Label className="text-slate-700 dark:text-slate-300">
                Progetto (opzionale)
              </Label>
              <Select value={projectId || NONE_VALUE} onValueChange={setProjectId}>
                <SelectTrigger className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100">
                  <SelectValue placeholder="Nessun progetto" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE_VALUE}>
                    <span className="text-slate-400">Nessun progetto</span>
                  </SelectItem>
                  {projects.map((p) => (
                    <SelectItem key={p.id} value={String(p.id)}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Quote */}
            <div className="space-y-2">
              <Label className="text-slate-700 dark:text-slate-300">
                Preventivo (opzionale)
              </Label>
              <Select value={quoteId || NONE_VALUE} onValueChange={setQuoteId}>
                <SelectTrigger className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100">
                  <SelectValue placeholder="Nessun preventivo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE_VALUE}>
                    <span className="text-slate-400">Nessun preventivo</span>
                  </SelectItem>
                  {quotes.map((q) => (
                    <SelectItem key={q.id} value={String(q.id)}>
                      {q.code ? `${q.code} — ` : ""}
                      {q.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Customer */}
            <div className="space-y-2">
              <Label className="text-slate-700 dark:text-slate-300">
                Cliente (opzionale)
              </Label>
              <Select value={customerId || NONE_VALUE} onValueChange={setCustomerId}>
                <SelectTrigger className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100">
                  <SelectValue placeholder="Nessun cliente" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE_VALUE}>
                    <span className="text-slate-400">Nessun cliente</span>
                  </SelectItem>
                  {customers.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      {c.display_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Reference Text — shown when no quote selected */}
            {(!quoteId || quoteId === NONE_VALUE) && (
              <div className="space-y-2">
                <Label className="text-slate-700 dark:text-slate-300">
                  Riferimento (opzionale)
                </Label>
                <Input
                  type="text"
                  value={referenceText}
                  onChange={(e) => setReferenceText(e.target.value)}
                  placeholder="Es. Contratto n. 123/2024..."
                  className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Financial Settings */}
        <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
          <CardHeader>
            <CardTitle className="text-slate-900 dark:text-slate-100">
              Impostazioni Finanziarie
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label className="text-slate-700 dark:text-slate-300">
                  IVA (%)
                </Label>
                <Input
                  type="text"
                  inputMode="decimal"
                  value={taxPercentage}
                  onChange={(e) => setTaxPercentage(e.target.value)}
                  className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-700 dark:text-slate-300">
                  Sconto (%)
                </Label>
                <Input
                  type="text"
                  inputMode="decimal"
                  value={discountPercentage}
                  onChange={(e) => setDiscountPercentage(e.target.value)}
                  className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="is-partial"
                checked={isPartial}
                onChange={(e) => setIsPartial(e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 dark:border-slate-600"
              />
              <label
                htmlFor="is-partial"
                className="text-sm text-slate-700 dark:text-slate-300 cursor-pointer"
              >
                Consuntivo Parziale
              </label>
            </div>
          </CardContent>
        </Card>

        {/* Notes */}
        <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
          <CardHeader>
            <CardTitle className="text-slate-900 dark:text-slate-100">
              Note
            </CardTitle>
          </CardHeader>
          <CardContent>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Note aggiuntive sul consuntivo..."
              rows={4}
              className="w-full rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-400 dark:focus:ring-slate-600 resize-none"
            />
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3">
          <Link href="/final-balances">
            <Button
              type="button"
              variant="outline"
              className="border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
            >
              Annulla
            </Button>
          </Link>
          <Button type="submit" disabled={createMutation.isPending}>
            <Save className="mr-2 h-4 w-4" />
            {createMutation.isPending ? "Creazione..." : "Crea Final Balance"}
          </Button>
        </div>
      </form>
    </div>
  );
}
