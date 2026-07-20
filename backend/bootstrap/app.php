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
            \App\Http\Middleware\SafeInitializeTenancy::class,
        ]);

        $middleware->alias([
            'tenant.member' => \App\Http\Middleware\EnsureTenantMembership::class,
            'landlord.admin' => \App\Http\Middleware\EnsureLandlordAdmin::class,
            'feature' => \App\Http\Middleware\RequireFeature::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->report(function (\Throwable $e): false {
            // Only log within an initialized tenant context
            if (! app()->bound('tenancy') || ! tenancy()->initialized()) {
                return false;
            }

            // Skip "normal" HTTP exceptions that are not bugs
            $skipClasses = [
                // \Illuminate\Validation\ValidationException::class,
                \Illuminate\Auth\AuthenticationException::class,
                \Illuminate\Auth\Access\AuthorizationException::class,
                \Illuminate\Database\Eloquent\ModelNotFoundException::class,
                \Symfony\Component\HttpKernel\Exception\NotFoundHttpException::class,
                \Symfony\Component\HttpKernel\Exception\MethodNotAllowedHttpException::class,
                \Illuminate\Http\Exceptions\ThrottleRequestsException::class,
            ];

            foreach ($skipClasses as $class) {
                if ($e instanceof $class) {
                    return false;
                }
            }

            // Determine severity
            $severity = 'error';
            if ($e instanceof \Symfony\Component\HttpKernel\Exception\HttpExceptionInterface) {
                $severity = $e->getStatusCode() >= 500 ? 'error' : 'error';
            }

            // Build sanitized context
            $context = [];
            try {
                $request = request();
                $context = [
                    'ip' => $request->ip(),
                    'user_agent' => substr($request->userAgent() ?? '', 0, 200),
                ];
            } catch (\Throwable) {
                // ignore
            }

            // Write to tenant DB — must never throw
            try {
                \App\Models\SystemErrorLog::create([
                    'exception_class' => get_class($e),
                    'message' => substr($e->getMessage(), 0, 1000),
                    'stack_trace' => substr($e->getTraceAsString(), 0, 8000),
                    'severity' => $severity,
                    'url' => rescue(fn () => substr(request()->fullUrl(), 0, 500), null),
                    'method' => rescue(fn () => request()->method(), null),
                    'user_id' => rescue(fn () => auth()->id(), null),
                    'context' => $context ?: null,
                    'occurred_at' => now(),
                ]);
            } catch (\Throwable) {
                // Never throw from exception handler
            }

            return false;
        });
    })
    ->create();
