"use client";

import { Building2, Check } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const STEP_NAMES = ["Azienda", "Logo", "Preventivi", "Team", "Pagamenti", "Fine"];

interface WizardShellProps {
  currentStep: number;
  completedSteps: Set<number>;
  onBack: () => void;
  children: React.ReactNode;
}

export function WizardShell({
  currentStep,
  completedSteps,
  onBack,
  children,
}: WizardShellProps) {
  const isLastStep = currentStep === 5;

  return (
    <div className="min-h-screen flex flex-col items-center px-4 py-8">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Building2 className="w-7 h-7 text-slate-700 dark:text-slate-300" />
            <span className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              DGGM ERP
            </span>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Configurazione iniziale del sistema
          </p>
        </div>

        <div className="mb-8">
          <div className="flex items-center justify-between relative">
            <div className="absolute left-0 right-0 top-4 h-0.5 bg-slate-200 dark:bg-slate-700 -z-10" />
            {STEP_NAMES.map((name, index) => {
              const isCompleted = completedSteps.has(index);
              const isActive = index === currentStep;
              const isFuture = index > currentStep && !isCompleted;

              return (
                <div
                  key={name}
                  className="flex flex-col items-center gap-1.5 flex-1"
                >
                  <div
                    className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium border-2 bg-white dark:bg-slate-900 transition-colors",
                      isCompleted &&
                        "bg-green-500 dark:bg-green-600 border-green-500 dark:border-green-600 text-white",
                      isActive &&
                        !isCompleted &&
                        "bg-slate-900 dark:bg-slate-100 border-slate-900 dark:border-slate-100 text-white dark:text-slate-900",
                      isFuture &&
                        "border-slate-300 dark:border-slate-600 text-slate-400 dark:text-slate-500",
                    )}
                  >
                    {isCompleted ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      <span>{index + 1}</span>
                    )}
                  </div>
                  <span
                    className={cn(
                      "text-xs font-medium",
                      isActive && "text-slate-900 dark:text-slate-100",
                      isCompleted && "text-green-600 dark:text-green-500",
                      isFuture && "text-slate-400 dark:text-slate-500",
                    )}
                  >
                    {name}
                  </span>
                </div>
              );
            })}
          </div>
          <div className="mt-4">
            <Progress
              value={(currentStep / 5) * 100}
              className="h-1.5"
            />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm p-6 md:p-8">
          {children}
        </div>

        {!isLastStep && currentStep > 0 && (
          <div className="mt-6">
            <Button variant="ghost" onClick={onBack}>
              Indietro
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
