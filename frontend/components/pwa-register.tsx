'use client';

import { useEffect } from 'react';

export function PWARegister() {
  useEffect(() => {
    // Only run in browser
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return;
    }

    // Only register in production with PWA enabled
    const isProd = process.env.NODE_ENV === 'production';
    const isEnabled = process.env.NEXT_PUBLIC_PWA_ENABLED === 'true';

    if (!isProd || !isEnabled) {
      // Unregister any existing service workers when disabled
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        registrations.forEach((registration) => {
          registration.unregister();
          console.log('[PWA] Unregistered service worker (PWA disabled)');
        });
      });
      return;
    }

    // Register service worker with Next.js recommended config
    navigator.serviceWorker
      .register('/sw.js', {
        scope: '/',
        updateViaCache: 'none', // Never cache the service worker file
      })
      .then((registration) => {
        console.log('[PWA] Service Worker registered (push notifications ready)');

        // Check for updates periodically
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;

          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                console.log('[PWA] New service worker available');
                // Optionally show update notification to user
              }
            });
          }
        });
      })
      .catch((error) => {
        console.error('[PWA] Service Worker registration failed:', error);
      });
  }, []);

  return null;
}