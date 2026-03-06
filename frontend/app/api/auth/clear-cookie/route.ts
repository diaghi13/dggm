import { NextResponse } from 'next/server';

/**
 * Cancella il cookie auth_token lato server.
 * Usato quando il token è invalido (es. dopo DB reset) e il backend
 * rifiuta anche il logout con 401 — impossibile cancellare il cookie httpOnly via JS.
 */
export async function POST() {
  const response = NextResponse.json({ success: true });
  response.cookies.set('auth_token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  });
  return response;
}
