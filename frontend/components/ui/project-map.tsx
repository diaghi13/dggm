'use client';

import dynamic from 'next/dynamic';
import { MapPin } from 'lucide-react';

interface ProjectMapProps {
  lat: number | null;
  lng: number | null;
  radius?: number;
}

// Leaflet must be loaded client-side only (no SSR)
const ProjectMapInner = dynamic(() => import('./project-map-inner'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center rounded-lg border border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-900/40" style={{ height: 280 }}>
      <p className="text-sm text-slate-400">Caricamento mappa…</p>
    </div>
  ),
});

function MapPlaceholder() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-slate-300 bg-slate-50 dark:border-slate-700 dark:bg-slate-900/40" style={{ height: 280 }}>
      <MapPin className="h-8 w-8 text-slate-300 dark:text-slate-600" />
      <div className="text-center">
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Nessuna posizione impostata</p>
        <p className="text-xs text-slate-400 dark:text-slate-500">Usa "Rileva coordinate dall'indirizzo" in modalità modifica</p>
      </div>
    </div>
  );
}

export function ProjectMap({ lat, lng, radius }: ProjectMapProps) {
  if (!lat || !lng || lat === 0 || lng === 0) {
    return <MapPlaceholder />;
  }
  return <ProjectMapInner lat={lat} lng={lng} radius={radius} />;
}
