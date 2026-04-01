"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth-store";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { authApi } from "@/lib/api/auth";
import { Mail, ArrowLeft } from "lucide-react";

export default function VerifyEmailPendingPage() {
  const router = useRouter();
  const { globalUser, globalToken, clearAuth, logout } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleResend = async () => {
    if (!globalToken) {
      toast.error("Sessione non valida. Accedi di nuovo.");
      return;
    }

    setIsLoading(true);
    try {
      await authApi.resendVerificationEmail(globalToken);
      setIsSuccess(true);
      toast.success("Email di verifica inviata!");
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      const message =
        err.response?.data?.message ||
        "Si è verificato un errore. Riprova più tardi.";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToLogin = async () => {
    try {
      await logout();
    } catch {
      clearAuth();
    }
    router.push("/login");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 px-4">
      <Card className="w-full max-w-md border-slate-200 dark:border-slate-800">
        <CardHeader className="space-y-4 text-center pb-6">
          <div className="mx-auto w-16 h-16 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
            <Mail className="w-8 h-8 text-blue-600 dark:text-blue-400" />
          </div>
          <CardTitle className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
            Verifica il tuo indirizzo email
          </CardTitle>
          <CardDescription className="text-sm text-slate-600 dark:text-slate-400">
            Prima di accedere, verifica il tuo indirizzo email. Abbiamo inviato
            un link a{" "}
            <strong className="text-slate-900 dark:text-slate-100">
              {globalUser?.email ?? ""}
            </strong>
            .
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <Alert className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/10">
            <AlertDescription className="text-sm text-blue-700 dark:text-blue-300">
              Controlla la casella di posta e clicca sul link di verifica. Il
              link è valido per 60 minuti. Controlla anche la cartella spam.
            </AlertDescription>
          </Alert>

          {isSuccess && (
            <Alert className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/10">
              <AlertDescription className="text-sm text-green-700 dark:text-green-300">
                Email di verifica inviata di nuovo. Controlla la tua casella di
                posta.
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-3 pt-2">
            <Button
              className="w-full h-10"
              onClick={handleResend}
              disabled={isLoading}
            >
              {isLoading ? "Invio in corso..." : "Invia di nuovo"}
            </Button>

            <Button
              variant="ghost"
              className="w-full h-10 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
              onClick={handleBackToLogin}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Torna al login
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
