<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        // Encrypt cookies (except auth_token for API compatibility)
        $middleware->encryptCookies(except: [
            'auth_token',
        ]);

        // Add middleware to read auth token from httpOnly cookie
        // This runs before Sanctum authentication, allowing cookie-based auth
        $middleware->api(prepend: [
            \App\Http\Middleware\AddBearerTokenFromCookie::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        //
    })
    ->create();
