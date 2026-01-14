<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\ContractorRateResource;
use App\Models\Contractor;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ContractorRateController extends Controller
{
    public function index(Contractor $contractor): JsonResponse
    {
        $this->authorize('view', $contractor);

        $rates = $contractor->rates()->orderBy('valid_from', 'desc')->get();

        return response()->json([
            'success' => true,
            'data' => ContractorRateResource::collection($rates),
        ]);
    }

    public function current(Contractor $contractor, Request $request): JsonResponse
    {
        $this->authorize('view', $contractor);

        $serviceType = $request->input('service_type');
        $date = $request->input('date') ? new \DateTime($request->input('date')) : null;

        $rate = $contractor->getCurrentRate($serviceType, $date);

        if (! $rate) {
            return response()->json([
                'success' => false,
                'message' => 'No rate found for the specified service type',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => new ContractorRateResource($rate),
        ]);
    }

    public function store(Contractor $contractor, Request $request): JsonResponse
    {
        $this->authorize('update', $contractor);

        $validated = $request->validate([
            'service_type' => ['required', 'string', 'max:100'],
            'rate_type' => ['required', 'string'],
            'rate_amount' => ['required', 'numeric', 'min:0'],
            'currency' => ['nullable', 'string', 'max:3'],
            'minimum_hours' => ['nullable', 'numeric', 'min:0'],
            'minimum_amount' => ['nullable', 'numeric', 'min:0'],
            'valid_from' => ['required', 'date'],
            'notes' => ['nullable', 'string'],
        ]);

        // Close previous rate for same service type if exists
        $previousRate = $contractor->getCurrentRate($validated['service_type']);
        if ($previousRate) {
            $dayBefore = (new \DateTime($validated['valid_from']))->modify('-1 day');
            $previousRate->update(['valid_to' => $dayBefore]);
        }

        $rate = $contractor->rates()->create($validated);

        return response()->json([
            'success' => true,
            'message' => 'Contractor rate created successfully',
            'data' => new ContractorRateResource($rate),
        ], 201);
    }

    public function history(Contractor $contractor, Request $request): JsonResponse
    {
        $this->authorize('view', $contractor);

        $serviceType = $request->input('service_type');

        $query = $contractor->rates()->orderBy('valid_from', 'desc');

        if ($serviceType) {
            $query->where('service_type', $serviceType);
        }

        $rates = $query->get();

        return response()->json([
            'success' => true,
            'data' => ContractorRateResource::collection($rates),
        ]);
    }
}
