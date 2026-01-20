<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class AddBearerTokenFromCookie
{
    /**
     * Handle an incoming request.
     *
     * This middleware reads the auth_token from httpOnly cookie
     * and adds it as a Bearer token to the Authorization header.
     * This allows Sanctum to authenticate the request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        // If Authorization header already exists, don't override it
        // This allows API clients to still use Bearer tokens directly
        if ($request->hasHeader('Authorization')) {
            return $next($request);
        }

        // Check if auth_token cookie exists
        $token = $request->cookie('auth_token');

        if ($token) {
            // Add Bearer token to Authorization header
            $request->headers->set('Authorization', "Bearer {$token}");
        }

        return $next($request);
    }
}
