<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use App\Services\FeatureService;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class RequireFeature
{
    public function __construct(
        private readonly FeatureService $featureService,
    ) {}

    public function handle(Request $request, Closure $next, string $feature): Response
    {
        if (! $this->featureService->enabled($feature)) {
            return response()->json([
                'success' => false,
                'message' => "La funzionalità '{$feature}' non è inclusa nel tuo piano di abbonamento.",
                'feature' => $feature,
            ], 403);
        }

        return $next($request);
    }
}
