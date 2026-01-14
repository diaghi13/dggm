<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\WorkerRateResource;
use App\Models\Worker;
use App\Services\RateCalculationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class WorkerRateController extends Controller
{
    public function __construct(
        private readonly RateCalculationService $rateCalculationService
    ) {}

    public function index(Worker $worker): JsonResponse
    {
        $this->authorize('viewRates', $worker);

        $rates = $worker->rates()->orderBy('valid_from', 'desc')->get();

        return response()->json([
            'success' => true,
            'data' => WorkerRateResource::collection($rates),
        ]);
    }

    public function current(Worker $worker, Request $request): JsonResponse
    {
        $this->authorize('viewRates', $worker);

        $context = $request->input('context');
        $rateType = $request->input('rate_type');
        $date = $request->input('date') ? new \DateTime($request->input('date')) : null;

        $rate = $worker->getCurrentRate($context, $rateType, $date);

        if (! $rate) {
            return response()->json([
                'success' => false,
                'message' => 'No rate found for the specified criteria',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => new WorkerRateResource($rate),
        ]);
    }

    public function store(Worker $worker, Request $request): JsonResponse
    {
        $this->authorize('manageRates', $worker);

        $validated = $request->validate([
            'rate_type' => ['required', 'string'],
            'context' => ['required', 'string'],
            'rate_amount' => ['required', 'numeric', 'min:0'],
            'currency' => ['nullable', 'string', 'max:3'],
            'project_type' => ['nullable', 'string', 'max:100'],
            'overtime_multiplier' => ['nullable', 'numeric', 'min:0'],
            'holiday_multiplier' => ['nullable', 'numeric', 'min:0'],
            'valid_from' => ['required', 'date'],
            'notes' => ['nullable', 'string'],
        ]);

        $effectiveFrom = new \DateTime($validated['valid_from']);
        $rate = $this->rateCalculationService->createRateHistory($worker, $validated, $effectiveFrom);

        return response()->json([
            'success' => true,
            'message' => 'Rate created successfully',
            'data' => new WorkerRateResource($rate),
        ], 201);
    }

    public function history(Worker $worker, Request $request): JsonResponse
    {
        $this->authorize('viewRates', $worker);

        $context = $request->input('context');
        $rateType = $request->input('rate_type');

        $query = $worker->rates()->orderBy('valid_from', 'desc');

        if ($context) {
            $query->where('context', $context);
        }

        if ($rateType) {
            $query->where('rate_type', $rateType);
        }

        $rates = $query->get();

        return response()->json([
            'success' => true,
            'data' => WorkerRateResource::collection($rates),
        ]);
    }

    public function destroy(Worker $worker, int $rateId): JsonResponse
    {
        $this->authorize('manageRates', $worker);

        $rate = $worker->rates()->findOrFail($rateId);
        $rate->delete();

        return response()->json([
            'success' => true,
            'message' => 'Rate deleted successfully',
        ]);
    }

    public function calculate(Worker $worker, Request $request): JsonResponse
    {
        $this->authorize('viewRates', $worker);

        $validated = $request->validate([
            'hours' => ['required', 'numeric', 'min:0'],
            'is_overtime' => ['boolean'],
            'is_holiday' => ['boolean'],
            'site_id' => ['nullable', 'exists:sites,id'],
            'date' => ['nullable', 'date'],
        ]);

        $result = $this->rateCalculationService->calculateLaborCost(
            $worker,
            $validated['hours'],
            $validated['is_overtime'] ?? false,
            $validated['is_holiday'] ?? false,
            $validated['site_id'] ?? null,
            isset($validated['date']) ? new \DateTime($validated['date']) : null
        );

        return response()->json([
            'success' => true,
            'data' => $result,
        ]);
    }
}
