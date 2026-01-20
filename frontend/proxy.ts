import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Next.js 16 Proxy (formerly middleware.ts)
 *
 * This proxy protects routes server-side before they are rendered.
 * It checks for httpOnly cookie 'auth_token' to determine authentication status.
 *
 * Security Benefits:
 * - Server-side route protection
 * - httpOnly cookies immune to XSS attacks
 * - Automatic cookie handling by browser
 */
export function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Check if user has auth_token cookie
  const authToken = request.cookies.get('auth_token');
  const isAuthenticated = !!authToken;

  // If accessing login page while authenticated, redirect to dashboard
  if (pathname === '/login' && isAuthenticated) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // If accessing protected route without authentication, redirect to login
  if (pathname.startsWith('/dashboard') && !isAuthenticated) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Allow the request to proceed
  return NextResponse.next();
}

/**
 * Configure which routes this middleware runs on
 * Excludes: API routes, static files, images, favicon
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
