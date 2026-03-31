<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use Closure;
use Illuminate\Support\Facades\Log;
use Stancl\Tenancy\Middleware\InitializeTenancyByRequestData;

class SafeInitializeTenancy extends InitializeTenancyByRequestData
{
    public function handle($request, Closure $next)
    {
        try {
            return parent::handle($request, $next);
        } catch (\Throwable $e) {
            // Tenant DB may not exist yet (BootstrapTenantJob still running).
            // Log the failure and continue without tenancy context so public
            // routes like /auth/tenant-status still work.
            Log::debug('SafeInitializeTenancy: skipped tenancy init', [
                'path' => $request->path(),
                'x-tenant' => $request->header('x-tenant'),
                'error' => $e->getMessage(),
            ]);

            return $next($request);
        }
    }
}
