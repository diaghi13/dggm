declare module '@ducanh2912/next-pwa' {
  import { NextConfig } from 'next';

  interface PWAConfig {
    dest?: string;
    disable?: boolean;
    register?: boolean;
    skipWaiting?: boolean;
    scope?: string;
    sw?: string;
    workboxOptions?: {
      runtimeCaching?: Array<{
        urlPattern: RegExp | string;
        handler: 'NetworkFirst' | 'CacheFirst' | 'StaleWhileRevalidate' | 'NetworkOnly' | 'CacheOnly';
        options?: {
          cacheName?: string;
          expiration?: {
            maxEntries?: number;
            maxAgeSeconds?: number;
          };
          networkTimeoutSeconds?: number;
          cacheableResponse?: {
            statuses?: number[];
          };
        };
      }>;
    };
    fallbacks?: {
      document?: string;
      image?: string;
      audio?: string;
      video?: string;
      font?: string;
    };
    publicExcludes?: string[];
    buildExcludes?: string[];
    cacheOnNavigation?: boolean;
    reloadOnOnline?: boolean;
  }

  function withPWA(pwaConfig: PWAConfig): (nextConfig: NextConfig) => NextConfig;

  export default withPWA;
}