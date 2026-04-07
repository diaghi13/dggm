<?php

declare(strict_types=1);

namespace App\Http\Controllers\Landlord;

use App\Http\Controllers\Controller;
use App\Queries\Landlord\GetTenantMonitoringQuery;
use Illuminate\Http\JsonResponse;

class TenantMonitoringController extends Controller
{
    public function index(): JsonResponse
    {
        $data = app(GetTenantMonitoringQuery::class)->execute();

        return response()->json([
            'success' => true,
            'data' => $data,
        ]);
    }
}
