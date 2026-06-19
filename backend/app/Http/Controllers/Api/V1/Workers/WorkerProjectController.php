<?php

namespace App\Http\Controllers\Api\V1\Workers;

use App\Domains\Project\Models\Project;
use App\Domains\Project\Models\ProjectWorker;
use App\Http\Controllers\Controller;
use App\Http\Resources\ProjectWorkerResource;
use App\Models\Worker;
use App\Services\WorkerService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class WorkerProjectController extends Controller
{
    public function __construct(
        private readonly WorkerService $workerService
    ) {}

    public function index(Worker $worker): AnonymousResourceCollection
    {
        $this->authorize('view', $worker);

        $projectWorkers = ProjectWorker::where('worker_id', $worker->id)
            ->with(['project', 'worker.user', 'worker.supplier', 'assignedBy', 'roles'])
            ->orderBy('assigned_from', 'desc')
            ->get();

        return ProjectWorkerResource::collection($projectWorkers);
    }

    public function store(Worker $worker, Request $request): JsonResponse
    {
        $this->authorize('update', $worker);

        $validated = $request->validate([
            'project_id' => ['required', 'exists:projects,id'],
            'project_role' => ['nullable', 'string', 'max:100'],
            'assigned_from' => ['required', 'date'],
            'assigned_to' => ['nullable', 'date', 'after:assigned_from'],
            'hourly_rate_override' => ['nullable', 'numeric', 'min:0'],
            'estimated_hours' => ['nullable', 'numeric', 'min:0'],
            'notes' => ['nullable', 'string'],
        ]);

        $project = Project::findOrFail($validated['project_id']);
        $this->workerService->assignToProject($worker, $project->id, $validated);

        return response()->json([
            'success' => true,
            'message' => 'Worker assigned to project successfully',
        ], 201);
    }

    public function destroy(Worker $worker, Project $project): JsonResponse
    {
        $this->authorize('update', $worker);

        $this->workerService->removeFromProject($worker, $project->id);

        return response()->json([
            'success' => true,
            'message' => 'Worker removed from project successfully',
        ]);
    }

    public function statistics(Worker $worker, Project $project): JsonResponse
    {
        $this->authorize('view', $worker);

        $totalHours = $worker->getTotalHoursOnProject($project->id);
        $totalCost = $worker->getTotalCostOnProject($project->id);

        return response()->json([
            'success' => true,
            'data' => [
                'total_hours' => $totalHours,
                'total_cost' => $totalCost,
            ],
        ]);
    }
}
