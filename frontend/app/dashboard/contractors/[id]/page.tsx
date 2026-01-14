'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

export default function ContractorDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id;

  useEffect(() => {
    // Redirect to supplier detail page with same ID
    router.replace(`/dashboard/suppliers/${id}`);
  }, [router, id]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <p className="text-slate-600 dark:text-slate-400">Reindirizzamento a Fornitore...</p>
      </div>
    </div>
  );
}
