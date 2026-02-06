"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
import { Eye, EyeOff, Lock, CheckCircle2 } from "lucide-react";

const resetPasswordSchema = z
  .object({
    email: z.string().email("Inserisci un indirizzo email valido"),
    password: z
      .string()
      .min(8, "La password deve contenere almeno 8 caratteri")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        "La password deve contenere almeno una maiuscola, una minuscola e un numero",
      ),
    password_confirmation: z.string().min(1, "Conferma la password"),
  })
  .refine((data) => data.password === data.password_confirmation, {
    message: "Le password non corrispondono",
    path: ["password_confirmation"],
  });

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [emailFromUrl, setEmailFromUrl] = useState<string>("");

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
  });

  useEffect(() => {
    // Get token and email from URL parameters
    const tokenParam = searchParams.get("token");
    const emailParam = searchParams.get("email");

    if (!tokenParam) {
      toast.error("Token di reset mancante");
      router.push("/forgot-password");
      return;
    }

    setToken(tokenParam);

    if (emailParam) {
      setEmailFromUrl(emailParam);
      setValue("email", emailParam);
    }
  }, [searchParams, router, setValue]);

  const onSubmit = async (data: ResetPasswordFormData) => {
    if (!token) {
      toast.error("Token di reset non valido");
      return;
    }

    setIsLoading(true);
    try {
      await authApi.resetPassword({
        email: data.email,
        token: token,
        password: data.password,
        password_confirmation: data.password_confirmation,
      });
      setIsSuccess(true);
      toast.success("Password reimpostata con successo!");
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      const message =
        err.response?.data?.message ||
        "Token non valido o scaduto. Richiedi un nuovo link di reset.";
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
              Password Reimpostata!
            </CardTitle>
            <CardDescription className="text-sm">
              La tua password è stata modificata con successo
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert className="border-slate-200 dark:border-slate-800">
              <AlertDescription className="text-sm text-slate-600 dark:text-slate-400">
                Per motivi di sicurezza, tutte le tue sessioni attive sono state
                terminate. Effettua il login con la tua nuova password.
              </AlertDescription>
            </Alert>

            <Button className="w-full" onClick={() => router.push("/login")}>
              Vai al Login
            </Button>
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
            <Lock className="w-6 h-6 text-white" />
          </div>
          <CardTitle className="text-2xl font-semibold">
            Reimposta Password
          </CardTitle>
          <CardDescription className="text-sm">
            Inserisci la tua nuova password
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
                disabled={isLoading || !!emailFromUrl}
                className="h-10"
              />
              {errors.email && (
                <p className="text-sm text-destructive">
                  {errors.email.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">
                Nuova Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  {...register("password")}
                  disabled={isLoading}
                  className="h-10 pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
              {errors.password && (
                <p className="text-sm text-destructive">
                  {errors.password.message}
                </p>
              )}
              <p className="text-xs text-slate-500 dark:text-slate-500">
                Almeno 8 caratteri, una maiuscola, una minuscola e un numero
              </p>
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="password_confirmation"
                className="text-sm font-medium"
              >
                Conferma Password
              </Label>
              <div className="relative">
                <Input
                  id="password_confirmation"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="••••••••"
                  {...register("password_confirmation")}
                  disabled={isLoading}
                  className="h-10 pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  tabIndex={-1}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
              {errors.password_confirmation && (
                <p className="text-sm text-destructive">
                  {errors.password_confirmation.message}
                </p>
              )}
            </div>

            <Button type="submit" className="w-full h-10" disabled={isLoading}>
              {isLoading ? "Reimpostazione in corso..." : "Reimposta Password"}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <Link
              href="/login"
              className="text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
            >
              Torna al Login
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900 dark:border-slate-100"></div>
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}
