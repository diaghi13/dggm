<?php

namespace App\Http\Controllers\Api\V1\Rentals;

use App\Domains\Product\Models\Product;
use App\Http\Controllers\Controller;
use App\Queries\Rental\GetRentalKpiQuery;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class RentalAnalyticsController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', Product::class);

        $data = app(GetRentalKpiQuery::class)->execute();

        return response()->json([
            'success' => true,
            'data' => $data,
        ]);
    }
}
