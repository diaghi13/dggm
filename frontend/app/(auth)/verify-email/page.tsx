"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { authApi } from "@/lib/api/auth";
import { useAuthStore } from "@/stores/auth-store";
import { CheckCircle2, XCircle, Loader2, Mail } from "lucide-react";

const REDIRECT_DELAY_SECONDS = 5;

type VerifyState = "loading" | "success" | "error" | "params_missing";

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { globalToken, globalUser } = useAuthStore();

  const [verifyState, setVerifyState] = useState<VerifyState>("loading");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [countdown, setCountdown] = useState(REDIRECT_DELAY_SECONDS);
  const [isResending, setIsResending] = useState(false);
  const [resendDone, setResendDone] = useState(false);
  const hasCalled = useRef(false);

  useEffect(() => {
    if (hasCalled.current) return;
    hasCalled.current = true;

    const id = searchParams.get("id");
    const hash = searchParams.get("hash");
    const expires = searchParams.get("expires");
    const signature = searchParams.get("signature");

    if (!id || !hash || !expires || !signature) {
      setVerifyState("params_missing");
      return;
    }

    authApi
      .verifyEmail(id, hash, expires, signature)
      .then(() => {
        setVerifyState("success");
        toast.success("Email verificata con successo!");
      })
      .catch((error: unknown) => {
        const err = error as { response?: { data?: { message?: string } } };
        const message =
          err.response?.data?.message ||
          "Il link di verifica non è più valido o è scaduto.";
        setErrorMessage(message);
        setVerifyState("error");
      });
  }, [searchParams]);

  // Countdown redirect after success
  useEffect(() => {
    if (verifyState !== "success") return;

    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          router.push("/login");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [verifyState, router]);

  const handleResend = async () => {
    if (!globalToken) {
      toast.error("Accedi prima di richiedere un nuovo link di verifica.");
      return;
    }

    setIsResending(true);
    try {
      await authApi.resendVerificationEmail(globalToken);
      setResendDone(true);
      toast.success("Nuovo link di verifica inviato. Controlla la tua email.");
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      const message =
        err.response?.data?.message ||
        "Impossibile inviare il link. Riprova tra qualche minuto.";
      toast.error(message);
    } finally {
      setIsResending(false);
    }
  };

  // --- LOADING STATE ---
  if (verifyState === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 px-4">
        <Card className="w-full max-w-md border-slate-200 dark:border-slate-800">
          <CardHeader className="space-y-4 text-center pb-6">
            <div className="mx-auto w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-slate-500 dark:text-slate-400 animate-spin" />
            </div>
            <CardTitle className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
              Verifica in corso...
            </CardTitle>
            <CardDescription className="text-sm text-slate-600 dark:text-slate-400">
              Stiamo verificando il tuo indirizzo email. Attendi qualche secondo.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  // --- SUCCESS STATE ---
  if (verifyState === "success") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 px-4">
        <Card className="w-full max-w-md border-slate-200 dark:border-slate-800">
          <CardHeader className="space-y-4 text-center pb-6">
            <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
            <CardTitle className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
              Email verificata con successo!
            </CardTitle>
            <CardDescription className="text-sm text-slate-600 dark:text-slate-400">
              Il tuo account è attivo. Puoi ora accedere all&apos;applicazione.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button className="w-full h-10" onClick={() => router.push("/login")}>
              Vai al Login
            </Button>
            <p className="text-center text-xs text-slate-400 dark:text-slate-500">
              Reindirizzamento automatico in {countdown}{" "}
              {countdown === 1 ? "secondo" : "secondi"}...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // --- PARAMS MISSING STATE ---
  if (verifyState === "params_missing") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 px-4">
        <Card className="w-full max-w-md border-slate-200 dark:border-slate-800">
          <CardHeader className="space-y-4 text-center pb-6">
            <div className="mx-auto w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
              <XCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
            </div>
            <CardTitle className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
              Link non valido
            </CardTitle>
            <CardDescription className="text-sm text-slate-600 dark:text-slate-400">
              Il link di verifica è incompleto o non valido. Usa il link ricevuto
              per email.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              className="w-full h-10"
              variant="outline"
              asChild
            >
              <Link href="/login">Torna al Login</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // --- ERROR STATE ---
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 px-4">
      <Card className="w-full max-w-md border-slate-200 dark:border-slate-800">
        <CardHeader className="space-y-4 text-center pb-6">
          <div className="mx-auto w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
            <XCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
          </div>
          <CardTitle className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
            Link non valido o scaduto
          </CardTitle>
          <CardDescription className="text-sm text-slate-600 dark:text-slate-400">
            {errorMessage || "Il link di verifica non è più valido."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {resendDone ? (
            <div className="flex items-center gap-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 p-4">
              <Mail className="h-4 w-4 text-green-600 dark:text-green-400 shrink-0" />
              <p className="text-sm text-green-700 dark:text-green-300">
                Nuovo link inviato. Controlla la tua casella email.
              </p>
            </div>
          ) : globalToken && globalUser ? (
            <Button
              className="w-full h-10"
              onClick={handleResend}
              disabled={isResending}
            >
              {isResending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Invio in corso...
                </>
              ) : (
                <>
                  <Mail className="mr-2 h-4 w-4" />
                  Richiedi nuovo link
                </>
              )}
            </Button>
          ) : (
            <div className="rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-4">
              <p className="text-sm text-slate-600 dark:text-slate-400 text-center">
                Accedi per richiedere un nuovo link di verifica.
              </p>
            </div>
          )}

          <Button
            className="w-full h-10"
            variant="outline"
            asChild
          >
            <Link href="/login">Torna al Login</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900 dark:border-slate-100"></div>
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}
