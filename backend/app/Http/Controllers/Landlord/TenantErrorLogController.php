<?php

declare(strict_types=1);

namespace App\Http\Controllers\Landlord;

use App\Http\Controllers\Controller;
use App\Queries\Landlord\GetTenantErrorLogsQuery;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TenantErrorLogController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $filters = [
            'tenant_id' => $request->query('tenant_id'),
            'type' => $request->query('type'),
            'date_from' => $request->query('date_from'),
        ];

        $result = app(GetTenantErrorLogsQuery::class)->execute($filters);

        return response()->json([
            'success' => true,
            'data' => $result,
        ]);
    }
}
