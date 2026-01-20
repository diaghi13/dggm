'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth-store';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Building2 } from 'lucide-react';

export default function HomePage() {
  const router = useRouter();
  const { isAuthenticated, hasHydrated } = useAuthStore();

  // Redirect authenticated users to dashboard
  useEffect(() => {
    if (hasHydrated && isAuthenticated) {
      router.push('/dashboard');
    }
  }, [hasHydrated, isAuthenticated, router]);

  // Show loading state while hydrating
  if (!hasHydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="text-center">
          <div className="w-16 h-16 bg-slate-900 dark:bg-slate-700 rounded-lg flex items-center justify-center mx-auto mb-4">
            <Building2 className="w-10 h-10 text-white" />
          </div>
          <p className="text-slate-600 dark:text-slate-400">Caricamento...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
      <div className="max-w-4xl mx-auto px-4 text-center">
        <div className="w-20 h-20 bg-slate-900 dark:bg-slate-700 rounded-xl flex items-center justify-center mx-auto mb-6">
          <Building2 className="w-12 h-12 text-white" />
        </div>
        <h1 className="text-5xl font-bold text-slate-900 dark:text-slate-100 mb-4">
          DGGM ERP
        </h1>
        <p className="text-lg text-slate-600 dark:text-slate-400 mb-8 max-w-2xl mx-auto">
          Sistema di gestione aziendale completo per l&apos;edilizia e la costruzione
        </p>
        <div className="flex gap-4 justify-center">
          <Link href="/login">
            <Button size="lg">
              Accedi al Sistema
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
