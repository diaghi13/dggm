'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ContractorsPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to suppliers page
    router.replace('/dashboard/suppliers');
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <p className="text-slate-600 dark:text-slate-400">Reindirizzamento a Fornitori...</p>
      </div>
    </div>
  );
}
