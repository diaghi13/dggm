import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function HomePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="max-w-4xl mx-auto px-4 text-center">
        <h1 className="text-5xl font-bold text-slate-900 mb-4">
          DGGM ERP
        </h1>
        <p className="text-lg text-slate-600 mb-8 max-w-2xl mx-auto">
          Sistema di gestione aziendale completo per l'edilizia e la costruzione
        </p>
        <div className="flex gap-4 justify-center">
          <Link href="/login">
            <Button size="lg">
              Accedi
            </Button>
          </Link>
          <Link href="/dashboard">
            <Button size="lg" variant="outline">
              Dashboard
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
