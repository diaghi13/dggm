"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth-store";
import { WizardShell } from "./_components/wizard-shell";
import { StepCompany } from "./_components/step-company";
import { StepImages } from "./_components/step-images";
import { StepQuotes } from "./_components/step-quotes";
import { StepTeam } from "./_components/step-team";
import { StepPayment } from "./_components/step-payment";
import { StepComplete } from "./_components/step-complete";

export default function SetupPage() {
  const router = useRouter();
  const { user, settings, isAuthChecked } = useAuthStore();
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());

  if (!isAuthChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-full max-w-2xl px-8 space-y-4">
          <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
          <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded animate-pulse w-3/4" />
          <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded animate-pulse w-1/2" />
        </div>
      </div>
    );
  }

  if (!user) {
    router.replace("/login");
    return null;
  }

  if (!user.roles.includes("super-admin") && !user.roles.includes("admin")) {
    router.replace("/dashboard");
    return null;
  }

  const setupCompleted = settings?.global["app.setup_completed"];
  if (
    setupCompleted === true ||
    setupCompleted === "1" ||
    setupCompleted === "true"
  ) {
    router.replace("/dashboard");
    return null;
  }

  const markStepCompleted = (step: number) => {
    setCompletedSteps((prev) => new Set([...prev, step]));
  };

  const handleNext = () => {
    markStepCompleted(currentStep);
    setCurrentStep((prev) => Math.min(prev + 1, 5));
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  };

  const handleSkip = () => {
    setCurrentStep((prev) => Math.min(prev + 1, 5));
  };

  const handleStepComplete = (step: number) => {
    markStepCompleted(step);
    setCurrentStep((prev) => Math.min(prev + 1, 5));
  };

  const steps = [
    <StepCompany
      key="company"
      onComplete={() => handleStepComplete(0)}
    />,
    <StepImages
      key="images"
      onComplete={() => handleStepComplete(1)}
      onSkip={handleSkip}
    />,
    <StepQuotes
      key="quotes"
      onComplete={() => handleStepComplete(2)}
      onSkip={handleSkip}
    />,
    <StepTeam
      key="team"
      onComplete={() => handleStepComplete(3)}
      onSkip={handleSkip}
    />,
    <StepPayment
      key="payment"
      onComplete={() => handleStepComplete(4)}
      onSkip={handleSkip}
    />,
    <StepComplete key="complete" />,
  ];

  return (
    <WizardShell
      currentStep={currentStep}
      completedSteps={completedSteps}
      onBack={handleBack}
    >
      {steps[currentStep]}
    </WizardShell>
  );
}
