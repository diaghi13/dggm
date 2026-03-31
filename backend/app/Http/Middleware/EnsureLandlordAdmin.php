<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureLandlordAdmin
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user('global');

        if (! $user || ! $user->is_landlord_admin) {
            return response()->json([
                'success' => false,
                'message' => 'Accesso riservato agli amministratori.',
            ], 403);
        }

        return $next($request);
    }
}
