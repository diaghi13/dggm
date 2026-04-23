<?php

namespace App\Http\Controllers\Api\V1;

use App\Actions\Project\ReportMaterialIncidentAction;
use App\Actions\Project\ResolveIncidentAction;
use App\Data\ProjectMaterialIncidentData;
use App\Data\ReportIncidentData;
use App\Data\ResolveIncidentData;
use App\Http\Controllers\Controller;
use App\Models\Project;
use App\Models\ProjectMaterialIncident;
use App\Queries\Project\GetProjectIncidentsQuery;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProjectMaterialIncidentController extends Controller
{
    /**
     * List all incidents for a project with optional filters.
     */
    public function index(Request $request, Project $project): JsonResponse
    {
        $this->authorize('viewAny', [ProjectMaterialIncident::class, $project]);

        $filters = $request->only(['status', 'incident_type', 'is_chargeable_to_client']);

        // Convert string bool for is_chargeable_to_client filter
        if (isset($filters['is_chargeable_to_client'])) {
            $filters['is_chargeable_to_client'] = filter_var($filters['is_chargeable_to_client'], FILTER_VALIDATE_BOOLEAN);
        }

        $incidents = app(GetProjectIncidentsQuery::class, [
            'project' => $project,
            'filters' => $filters,
        ])->execute();

        return response()->json([
            'success' => true,
            'data' => $incidents->map(fn ($incident) => ProjectMaterialIncidentData::fromModel($incident)),
        ]);
    }

    /**
     * Report a new material incident on the project.
     */
    public function store(Request $request, Project $project): JsonResponse
    {
        $this->authorize('create', [ProjectMaterialIncident::class, $project]);

        $incident = app(ReportMaterialIncidentAction::class)->execute(
            ReportIncidentData::from($request),
            $project
        );

        return response()->json([
            'success' => true,
            'data' => ProjectMaterialIncidentData::fromModel($incident),
        ], 201);
    }

    /**
     * Show a single incident.
     */
    public function show(ProjectMaterialIncident $incident): JsonResponse
    {
        $this->authorize('view', $incident);

        $incident->load(['projectMaterial.product', 'reportedBy', 'resolvedBy', 'ddtItem']);

        return response()->json([
            'success' => true,
            'data' => ProjectMaterialIncidentData::fromModel($incident),
        ]);
    }

    /**
     * Update an open or reviewed incident (PM/admin only).
     */
    public function update(Request $request, ProjectMaterialIncident $incident): JsonResponse
    {
        $this->authorize('update', $incident);

        $validated = $request->validate([
            'incident_type' => ['nullable', 'string'],
            'damage_severity' => ['nullable', 'string'],
            'description' => ['nullable', 'string', 'max:2000'],
            'incident_date' => ['nullable', 'date'],
            'status' => ['nullable', 'string', 'in:open,reviewed,resolved,invoiced'],
            'is_chargeable_to_client' => ['nullable', 'boolean'],
            'charge_amount' => ['nullable', 'numeric', 'min:0'],
            'charge_basis' => ['nullable', 'string', 'max:500'],
        ]);

        $incident->update(array_filter($validated, fn ($v) => $v !== null));

        return response()->json([
            'success' => true,
            'data' => ProjectMaterialIncidentData::fromModel($incident->fresh()->load('projectMaterial.product', 'reportedBy', 'resolvedBy')),
        ]);
    }

    /**
     * Resolve an incident (PM/admin only).
     */
    public function resolve(Request $request, ProjectMaterialIncident $incident): JsonResponse
    {
        $this->authorize('resolve', $incident);

        abort_if(
            $incident->status->value === 'resolved',
            422,
            'Incident is already resolved.'
        );

        $resolved = app(ResolveIncidentAction::class)->execute(
            $incident,
            ResolveIncidentData::from($request)
        );

        return response()->json([
            'success' => true,
            'data' => ProjectMaterialIncidentData::fromModel($resolved->load('projectMaterial.product', 'reportedBy', 'resolvedBy')),
        ]);
    }
}
