'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth-store';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Building2, FileText, HardHat, Package, Receipt } from 'lucide-react';

const features = [
  {
    icon: FileText,
    title: 'Preventivi',
    description: 'Crea e gestisci preventivi professionali con listini prezzi e PDF personalizzati',
  },
  {
    icon: HardHat,
    title: 'Cantieri',
    description: 'Pianifica e monitora i cantieri, assegna squadre e traccia l\'avanzamento lavori',
  },
  {
    icon: Package,
    title: 'Magazzino',
    description: 'Gestione materiali, DDT, movimenti di magazzino e fornitori in tempo reale',
  },
  {
    icon: Receipt,
    title: 'Fatturazione',
    description: 'Emetti fatture attive e passive con supporto SDI e analisi consuntivi',
  },
];

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
    <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Main content */}
      <main className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="max-w-4xl mx-auto text-center w-full">
          <div className="w-20 h-20 bg-slate-900 dark:bg-slate-700 rounded-xl flex items-center justify-center mx-auto mb-6">
            <Building2 className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-5xl font-bold text-slate-900 dark:text-slate-100 mb-4">
            DGGM ERP
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-400 mb-4 max-w-2xl mx-auto">
            Sistema di gestione aziendale completo per l&apos;edilizia e la costruzione
          </p>
          <p className="text-base text-slate-500 dark:text-slate-500 mb-8 max-w-2xl mx-auto">
            Dalla richiesta di preventivo alla fatturazione, passando per la gestione cantieri,
            il tracciamento GPS delle presenze, il magazzino e l&apos;analisi dei costi.
          </p>

          <div className="flex gap-4 justify-center mb-12">
            <Link href="/login">
              <Button size="lg">
                Accedi al Sistema
              </Button>
            </Link>
          </div>

          {/* Feature highlights */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto mt-8 mb-10">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <div
                  key={feature.title}
                  className="bg-white dark:bg-slate-900 rounded-lg p-4 border border-slate-200 dark:border-slate-800 text-left"
                >
                  <div className="w-9 h-9 bg-slate-100 dark:bg-slate-800 rounded-md flex items-center justify-center mb-3">
                    <Icon className="w-5 h-5 text-slate-700 dark:text-slate-300" />
                  </div>
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-1">
                    {feature.title}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 py-6 text-sm text-slate-500 dark:text-slate-400">
        <div className="max-w-4xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <span>© 2026 DGGM ERP. Tutti i diritti riservati.</span>
          <div className="flex items-center gap-4">
            <Link
              href="/privacy"
              className="hover:text-slate-700 dark:hover:text-slate-300 transition-colors hover:underline"
            >
              Informativa Privacy
            </Link>
            <span className="text-slate-300 dark:text-slate-700">|</span>
            <Link
              href="/terms"
              className="hover:text-slate-700 dark:hover:text-slate-300 transition-colors hover:underline"
            >
              Termini di Servizio
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
