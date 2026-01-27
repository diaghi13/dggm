import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
    output: 'standalone',
    env: {
        NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'https://dggm-erp.ddns.net/api/v1',
    },
    async headers() {
      return [
        {
          // Security headers for service worker
          source: '/sw.js',
          headers: [
            {
              key: 'Content-Type',
              value: 'application/javascript; charset=utf-8',
            },
            {
              key: 'Cache-Control',
              value: 'no-cache, no-store, must-revalidate',
            },
            {
              key: 'Content-Security-Policy',
              value: "default-src 'self'; script-src 'self'",
            },
          ],
        },
      ];
    },
};

export default nextConfig;
