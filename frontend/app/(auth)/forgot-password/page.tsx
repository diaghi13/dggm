"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { authApi } from "@/lib/api/auth";
import { ArrowLeft, Mail, CheckCircle2 } from "lucide-react";

const forgotPasswordSchema = z.object({
  email: z.string().email("Inserisci un indirizzo email valido"),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setIsLoading(true);
    try {
      await authApi.forgotPassword(data.email);
      setSubmittedEmail(data.email);
      setIsSuccess(true);
      toast.success("Email inviata con successo!");
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

  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 px-4">
        <Card className="w-full max-w-md border-slate-200 dark:border-slate-800">
          <CardHeader className="space-y-4 text-center pb-6">
            <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
            <CardTitle className="text-2xl font-semibold">
              Email Inviata!
            </CardTitle>
            <CardDescription className="text-sm">
              Controlla la tua casella di posta elettronica
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert className="border-slate-200 dark:border-slate-800">
              <AlertDescription className="text-sm text-slate-600 dark:text-slate-400">
                Abbiamo inviato un&apos;email a{" "}
                <strong className="text-slate-900 dark:text-slate-100">
                  {submittedEmail}
                </strong>{" "}
                con le istruzioni per reimpostare la tua password.
              </AlertDescription>
            </Alert>

            <div className="space-y-3 pt-2">
              <p className="text-xs text-slate-500 dark:text-slate-500">
                • Il link per il reset è valido per 60 minuti
                <br />
                • Controlla anche la cartella spam
                <br />• Se non ricevi l&apos;email, riprova tra qualche minuto
              </p>

              <Button
                variant="outline"
                className="w-full"
                onClick={() => router.push("/login")}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Torna al Login
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 px-4">
      <Card className="w-full max-w-md border-slate-200 dark:border-slate-800">
        <CardHeader className="space-y-4 text-center pb-6">
          <div className="mx-auto w-12 h-12 bg-slate-900 dark:bg-slate-700 rounded flex items-center justify-center mb-2">
            <Mail className="w-6 h-6 text-white" />
          </div>
          <CardTitle className="text-2xl font-semibold">
            Password Dimenticata?
          </CardTitle>
          <CardDescription className="text-sm">
            Inserisci la tua email e ti invieremo un link per reimpostare la
            password
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">
                Indirizzo Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="nome@esempio.com"
                {...register("email")}
                disabled={isLoading}
                className="h-10"
              />
              {errors.email && (
                <p className="text-sm text-destructive">
                  {errors.email.message}
                </p>
              )}
            </div>

            <Button type="submit" className="w-full h-10" disabled={isLoading}>
              {isLoading ? "Invio in corso..." : "Invia Link di Reset"}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <Link
              href="/login"
              className="text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 inline-flex items-center"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              Torna al Login
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
