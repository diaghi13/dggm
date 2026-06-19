<?php

namespace App\Http\Controllers\Api\V1\Projects;

use App\Domains\Project\Models\Project;
use App\Domains\Project\Models\ProjectLaborCost;
use App\Http\Controllers\Controller;
use App\Http\Resources\ProjectLaborCostResource;
use App\Services\CostAllocationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProjectLaborCostController extends Controller
{
    public function __construct(
        private readonly CostAllocationService $costAllocationService
    ) {}

    public function index(Project $project, Request $request): JsonResponse
    {
        $this->authorize('view', $project);

        $query = $project->laborCosts()->with(['worker', 'contractor']);

        if ($request->has('cost_type')) {
            $query->where('cost_type', $request->input('cost_type'));
        }

        if ($request->has('month') && $request->has('year')) {
            $query->whereYear('work_date', $request->input('year'))
                ->whereMonth('work_date', $request->input('month'));
        }

        $costs = $query->orderBy('work_date', 'desc')->get();

        return response()->json([
            'success' => true,
            'data' => ProjectLaborCostResource::collection($costs),
        ]);
    }

    public function store(Project $project, Request $request): JsonResponse
    {
        $this->authorize('update', $project);

        $validated = $request->validate([
            'cost_type' => ['required', 'string'],
            'worker_id' => ['nullable', 'exists:workers,id', 'required_if:cost_type,internal_labor'],
            'contractor_id' => ['nullable', 'exists:contractors,id', 'required_unless:cost_type,internal_labor'],
            'description' => ['required', 'string'],
            'work_date' => ['required', 'date'],
            'hours_worked' => ['nullable', 'numeric', 'min:0'],
            'quantity' => ['nullable', 'numeric', 'min:0'],
            'unit_rate' => ['nullable', 'numeric', 'min:0'],
            'total_cost' => ['nullable', 'numeric', 'min:0'],
            'currency' => ['nullable', 'string', 'max:3'],
            'is_overtime' => ['boolean'],
            'is_holiday' => ['boolean'],
            'cost_category' => ['nullable', 'string', 'max:100'],
            'invoice_number' => ['nullable', 'string', 'max:100'],
            'invoice_date' => ['nullable', 'date'],
            'is_invoiced' => ['boolean'],
            'notes' => ['nullable', 'string'],
        ]);

        $cost = $project->laborCosts()->create($validated);
        $project->updateActualCost();

        return response()->json([
            'success' => true,
            'message' => 'Labor cost created successfully',
            'data' => new ProjectLaborCostResource($cost->load(['worker', 'contractor'])),
        ], 201);
    }

    public function update(Project $project, ProjectLaborCost $laborCost, Request $request): JsonResponse
    {
        $this->authorize('update', $project);

        $validated = $request->validate([
            'description' => ['sometimes', 'string'],
            'work_date' => ['sometimes', 'date'],
            'hours_worked' => ['nullable', 'numeric', 'min:0'],
            'quantity' => ['nullable', 'numeric', 'min:0'],
            'unit_rate' => ['nullable', 'numeric', 'min:0'],
            'total_cost' => ['nullable', 'numeric', 'min:0'],
            'is_overtime' => ['boolean'],
            'is_holiday' => ['boolean'],
            'cost_category' => ['nullable', 'string', 'max:100'],
            'invoice_number' => ['nullable', 'string', 'max:100'],
            'invoice_date' => ['nullable', 'date'],
            'is_invoiced' => ['boolean'],
            'notes' => ['nullable', 'string'],
        ]);

        $laborCost->update($validated);
        $project->updateActualCost();

        return response()->json([
            'success' => true,
            'message' => 'Labor cost updated successfully',
            'data' => new ProjectLaborCostResource($laborCost->load(['worker', 'contractor'])),
        ]);
    }

    public function destroy(Project $project, ProjectLaborCost $laborCost): JsonResponse
    {
        $this->authorize('delete', $laborCost);

        $laborCost->delete();
        $project->updateActualCost();

        return response()->json([
            'success' => true,
            'message' => 'Labor cost deleted successfully',
        ]);
    }

    public function breakdown(Project $project): JsonResponse
    {
        $this->authorize('view', $project);

        $breakdown = $this->costAllocationService->getProjectLaborCostBreakdown($project);

        return response()->json([
            'success' => true,
            'data' => $breakdown,
        ]);
    }

    public function monthly(Project $project, Request $request): JsonResponse
    {
        $this->authorize('view', $project);

        $validated = $request->validate([
            'year' => ['required', 'integer', 'min:2020'],
            'month' => ['required', 'integer', 'min:1', 'max:12'],
        ]);

        $summary = $this->costAllocationService->getProjectMonthlySummary(
            $project,
            $validated['year'],
            $validated['month']
        );

        return response()->json([
            'success' => true,
            'data' => $summary,
        ]);
    }

    public function byWorker(Project $project, Request $request): JsonResponse
    {
        $this->authorize('view', $project);

        $costs = $project->laborCosts()
            ->where('cost_type', 'internal_labor')
            ->whereNotNull('worker_id')
            ->with('worker')
            ->selectRaw('worker_id, SUM(total_cost) as total_cost, SUM(hours_worked) as total_hours')
            ->groupBy('worker_id')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $costs,
        ]);
    }
}
