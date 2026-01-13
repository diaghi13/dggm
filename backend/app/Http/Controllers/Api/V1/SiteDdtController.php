<?php

namespace App\Http\Controllers\Api\V1;

use App\Enums\DdtStatus;
use App\Http\Controllers\Controller;
use App\Http\Resources\DdtResource;
use App\Models\Ddt;
use App\Models\Site;
use App\Services\DdtService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SiteDdtController extends Controller
{
    public function __construct(
        private readonly DdtService $ddtService
    ) {}

    /**
     * Get all DDTs for a site
     */
    public function index(Request $request, Site $site): JsonResponse
    {
        $this->authorize('view', $site);

        $query = Ddt::where('site_id', $site->id)
            ->with(['items.material', 'fromWarehouse', 'toWarehouse', 'customer', 'supplier'])
            ->orderBy('created_at', 'desc');

        // Filter by status
        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        // Filter by type
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
    public function confirm(Site $site, Ddt $ddt): JsonResponse
    {
        $this->authorize('update', $site);

        // Verify DDT belongs to this site
        if ($ddt->site_id !== $site->id) {
            return response()->json([
                'success' => false,
                'message' => 'DDT non appartiene a questo cantiere',
            ], 403);
        }

        // Verify DDT can be confirmed (issued or in_transit)
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
    public function confirmMultiple(Request $request, Site $site): JsonResponse
    {
        $this->authorize('update', $site);

        $request->validate([
            'ddt_ids' => 'required|array',
            'ddt_ids.*' => 'required|integer|exists:ddts,id',
        ]);

        $confirmed = [];
        $errors = [];

        foreach ($request->ddt_ids as $ddtId) {
            try {
                $ddt = Ddt::findOrFail($ddtId);

                // Verify DDT belongs to this site
                if ($ddt->site_id !== $site->id) {
                    $errors[] = "DDT {$ddt->code} non appartiene a questo cantiere";

                    continue;
                }

                // Verify DDT can be confirmed
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
