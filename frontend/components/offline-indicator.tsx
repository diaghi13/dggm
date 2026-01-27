'use client';

import { useEffect, useState } from 'react';
import { WifiOff, Wifi } from 'lucide-react';

export function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(true);
  const [showNotification, setShowNotification] = useState(false);

  useEffect(() => {
    // Set initial state
    setIsOnline(navigator.onLine);

    // Handle online/offline events
    const handleOnline = () => {
      setIsOnline(true);
      setShowNotification(true);
      setTimeout(() => setShowNotification(false), 3000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowNotification(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!showNotification) return null;

  return (
    <div
      className={`fixed bottom-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg border transition-all duration-300 ${
        isOnline
          ? 'bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-900 text-green-900 dark:text-green-100'
          : 'bg-yellow-50 dark:bg-yellow-950 border-yellow-200 dark:border-yellow-900 text-yellow-900 dark:text-yellow-100'
      }`}
    >
      {isOnline ? (
        <>
          <Wifi className="h-5 w-5" />
          <span className="font-medium">Connessione ripristinata</span>
        </>
      ) : (
        <>
          <WifiOff className="h-5 w-5" />
          <span className="font-medium">Sei offline</span>
        </>
      )}
    </div>
  );
}