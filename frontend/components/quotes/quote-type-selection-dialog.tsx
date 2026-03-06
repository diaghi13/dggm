"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Package, CalendarDays } from "lucide-react";

type QuoteType = "sale" | "rental" | "event";

interface QuoteTypeOption {
  type: QuoteType;
  icon: React.ElementType;
  label: string;
  description: string;
  colorClass: string;
  iconColorClass: string;
  borderClass: string;
}

const options: QuoteTypeOption[] = [
  {
    type: "sale",
    icon: ShoppingCart,
    label: "Vendita",
    description: "Preventivo per la vendita di prodotti e servizi",
    colorClass:
      "hover:bg-indigo-50 dark:hover:bg-indigo-950/40 hover:border-indigo-400 dark:hover:border-indigo-500",
    iconColorClass: "text-indigo-600 dark:text-indigo-400 bg-indigo-100 dark:bg-indigo-950/60",
    borderClass: "border-slate-200 dark:border-slate-700",
  },
  {
    type: "rental",
    icon: Package,
    label: "Noleggio",
    description: "Preventivo per il noleggio di attrezzatura con pricing rental",
    colorClass:
      "hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:border-emerald-400 dark:hover:border-emerald-500",
    iconColorClass: "text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/60",
    borderClass: "border-slate-200 dark:border-slate-700",
  },
  {
    type: "event",
    icon: CalendarDays,
    label: "Evento",
    description: "Preventivo per eventi con pricing a giornata",
    colorClass:
      "hover:bg-violet-50 dark:hover:bg-violet-950/40 hover:border-violet-400 dark:hover:border-violet-500",
    iconColorClass: "text-violet-600 dark:text-violet-400 bg-violet-100 dark:bg-violet-950/60",
    borderClass: "border-slate-200 dark:border-slate-700",
  },
];

interface QuoteTypeSelectionDialogProps {
  open: boolean;
  onSelect: (type: QuoteType) => void;
  onCancel: () => void;
}

export function QuoteTypeSelectionDialog({
  open,
  onSelect,
  onCancel,
}: QuoteTypeSelectionDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) onCancel(); }}>
      <DialogContent className="sm:max-w-2xl" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="text-xl">
            Che tipo di preventivo vuoi creare?
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          {options.map((option) => {
            const Icon = option.icon;
            return (
              <button
                key={option.type}
                type="button"
                onClick={() => onSelect(option.type)}
                className={`flex flex-col items-center gap-4 p-6 rounded-xl border-2 text-center transition-all duration-150 cursor-pointer bg-white dark:bg-slate-900 ${option.borderClass} ${option.colorClass} focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-slate-400`}
              >
                <div className={`p-3 rounded-xl ${option.iconColorClass}`}>
                  <Icon className="h-8 w-8" />
                </div>
                <div className="space-y-1">
                  <p className="font-semibold text-base text-slate-900 dark:text-slate-100">
                    {option.label}
                  </p>
                  <p className="text-sm text-slate-500 dark:text-slate-400 leading-snug">
                    {option.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        <div className="flex justify-start pt-2">
          <Button variant="ghost" onClick={onCancel}>
            Annulla
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
