'use client';

import { useEffect, useRef } from 'react';
import L from 'leaflet';

// Merge default icon URLs (Next.js breaks the auto-detection via webpack)
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const MAP_HEIGHT = 280;

interface Props {
  lat: number;
  lng: number;
  radius?: number;
}

export default function ProjectMapInner({ lat, lng, radius }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const circleRef = useRef<L.Circle | null>(null);

  // Mount once – the container div is already in the DOM at this point,
  // so Leaflet reads the correct offsetHeight, tiles load, and center is correct.
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: [lat, lng],
      zoom: 15,
      zoomControl: true,
      scrollWheelZoom: false,
      attributionControl: false,
    });

    L.tileLayer(
      'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
      { subdomains: 'abcd', maxZoom: 20 },
    ).addTo(map);

    markerRef.current = L.marker([lat, lng]).addTo(map).bindPopup('Cantiere');

    if (radius && radius > 0) {
      circleRef.current = L.circle([lat, lng], {
        radius,
        color: '#3b82f6',
        fillColor: '#3b82f6',
        fillOpacity: 0.08,
        weight: 2,
      }).addTo(map);
    }

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
      circleRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Re-center + move marker when lat/lng change (e.g. after geocoding)
  useEffect(() => {
    if (!mapRef.current) return;
    const pos: L.LatLngTuple = [lat, lng];
    mapRef.current.setView(pos, 15, { animate: true });
    markerRef.current?.setLatLng(pos);
    circleRef.current?.setLatLng(pos);
  }, [lat, lng]);

  const linkUrl = `https://www.google.com/maps?q=${lat},${lng}`;

  return (
    <div className="space-y-2">
      <div
        ref={containerRef}
        className="overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700"
        style={{ height: MAP_HEIGHT }}
      />
      <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
        <span className="font-mono">
          {lat.toFixed(6)}, {lng.toFixed(6)}
          {radius && <span className="ml-2 font-sans">· raggio {radius} m</span>}
        </span>
        <a
          href={linkUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:underline"
        >
          Apri in Google Maps ↗
        </a>
      </div>
    </div>
  );
}

