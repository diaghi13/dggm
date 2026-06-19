<?php

namespace App\Http\Controllers\Api\V1\Projects;

use App\Domains\Project\Models\Project;
use App\Domains\Warehouse\Models\Ddt;
use App\Enums\DdtStatus;
use App\Http\Controllers\Controller;
use App\Http\Resources\DdtResource;
use App\Services\DdtService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProjectDdtController extends Controller
{
    public function __construct(
        private readonly DdtService $ddtService
    ) {}

    /**
     * Get all DDTs for a project
     */
    public function index(Request $request, Project $project): JsonResponse
    {
        $this->authorize('view', $project);

        $query = Ddt::where('project_id', $project->id)
            ->with(['items.material', 'fromWarehouse', 'toWarehouse', 'customer', 'supplier'])
            ->orderBy('created_at', 'desc');

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        if ($request->has('type')) {
            $query->where('type', $request->type);
        }

        $ddts = $query->get();

        return response()->json([
            'success' => true,
            'data' => DdtResource::collection($ddts),
            'meta' => [
                'total' => $ddts->count(),
                'issued' => $ddts->filter(fn ($ddt) => $ddt->status === DdtStatus::Issued)->count(),
                'in_transit' => $ddts->filter(fn ($ddt) => $ddt->status === DdtStatus::InTransit)->count(),
                'delivered' => $ddts->filter(fn ($ddt) => $ddt->status === DdtStatus::Delivered)->count(),
                'pending' => $ddts->filter(fn ($ddt) => in_array($ddt->status, [DdtStatus::Issued, DdtStatus::InTransit]))->count(),
            ],
        ]);
    }

    /**
     * Confirm DDT receipt
     */
    public function confirm(Project $project, Ddt $ddt): JsonResponse
    {
        $this->authorize('update', $project);

        if ($ddt->project_id !== $project->id) {
            return response()->json([
                'success' => false,
                'message' => 'DDT non appartiene a questo progetto',
            ], 403);
        }

        if (! in_array($ddt->status, [DdtStatus::Issued, DdtStatus::InTransit])) {
            return response()->json([
                'success' => false,
                'message' => 'DDT già consegnato o non può essere confermato',
            ], 400);
        }

        try {
            $this->ddtService->confirm($ddt->id);

            return response()->json([
                'success' => true,
                'message' => 'DDT confermato con successo',
                'data' => new DdtResource($ddt->fresh()),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Errore durante la conferma del DDT',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Confirm multiple DDTs at once
     */
    public function confirmMultiple(Request $request, Project $project): JsonResponse
    {
        $this->authorize('update', $project);

        $request->validate([
            'ddt_ids' => 'required|array',
            'ddt_ids.*' => 'required|integer|exists:ddts,id',
        ]);

        $confirmed = [];
        $errors = [];

        foreach ($request->ddt_ids as $ddtId) {
            try {
                $ddt = Ddt::findOrFail($ddtId);

                if ($ddt->project_id !== $project->id) {
                    $errors[] = "DDT {$ddt->code} non appartiene a questo progetto";

                    continue;
                }

                if (! in_array($ddt->status, [DdtStatus::Issued, DdtStatus::InTransit])) {
                    $errors[] = "DDT {$ddt->code} già consegnato o non può essere confermato";

                    continue;
                }

                $this->ddtService->confirm($ddtId);
                $confirmed[] = $ddt->code;
            } catch (\Exception $e) {
                $errors[] = "Errore confermando DDT {$ddtId}: ".$e->getMessage();
            }
        }

        return response()->json([
            'success' => count($errors) === 0,
            'message' => count($confirmed).' DDT confermati con successo',
            'data' => [
                'confirmed' => $confirmed,
                'errors' => $errors,
            ],
        ]);
    }
}
