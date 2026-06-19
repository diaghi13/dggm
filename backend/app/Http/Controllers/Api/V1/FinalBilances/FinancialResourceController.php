<?php

namespace App\Http\Controllers\Api\V1\FinalBilances;

use App\Actions\FinancialResource\CreateFinancialResourceAction;
use App\Actions\FinancialResource\DeleteFinancialResourceAction;
use App\Actions\FinancialResource\UpdateFinancialResourceAction;
use App\Data\FinancialResourceData;
use App\Http\Controllers\Controller;
use App\Models\FinancialResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Financial Resource Controller
 *
 * Manages company financial resources (bank accounts, cash registers, cards/POS)
 */
class FinancialResourceController extends Controller
{
    public function __construct(
        private readonly CreateFinancialResourceAction $createAction,
        private readonly UpdateFinancialResourceAction $updateAction,
        private readonly DeleteFinancialResourceAction $deleteAction
    ) {}

    /**
     * Get all financial resources
     */
    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', FinancialResource::class);

        $query = FinancialResource::query();

        // Filter by type
        if ($request->has('type')) {
            $query->where('type', $request->input('type'));
        }

        // Filter by active status
        if ($request->has('is_active')) {
            $query->where('is_active', filter_var($request->input('is_active'), FILTER_VALIDATE_BOOLEAN));
        }

        // Only default
        if ($request->boolean('only_default')) {
            $query->where('is_default', true);
        }

        // Only active by default
        if (! $request->has('is_active') && ! $request->has('include_inactive')) {
            $query->active();
        }

        $financialResources = $query->ordered()->get();

        return response()->json([
            'success' => true,
            'data' => FinancialResourceData::collect($financialResources),
        ]);
    }

    /**
     * Get active financial resources (public endpoint for quotes/invoices)
     */
    public function getActive(): JsonResponse
    {
        $financialResources = FinancialResource::active()
            ->ordered()
            ->get();

        return response()->json([
            'success' => true,
            'data' => FinancialResourceData::collect($financialResources),
        ]);
    }

    /**
     * Get default financial resources (one per type)
     */
    public function getDefaults(): JsonResponse
    {
        $financialResources = FinancialResource::active()
            ->default()
            ->ordered()
            ->get();

        return response()->json([
            'success' => true,
            'data' => FinancialResourceData::collect($financialResources),
        ]);
    }

    /**
     * Get single financial resource
     */
    public function show(FinancialResource $financialResource): JsonResponse
    {
        $this->authorize('view', $financialResource);

        return response()->json([
            'success' => true,
            'data' => FinancialResourceData::from($financialResource),
        ]);
    }

    /**
     * Create financial resource
     */
    public function store(Request $request): JsonResponse
    {
        $this->authorize('create', FinancialResource::class);

        $data = FinancialResourceData::from($request);
        $financialResource = $this->createAction->execute($data);

        return response()->json([
            'success' => true,
            'data' => FinancialResourceData::from($financialResource),
            'message' => 'Risorsa finanziaria creata con successo',
        ], 201);
    }

    /**
     * Update financial resource
     */
    public function update(Request $request, FinancialResource $financialResource): JsonResponse
    {
        $this->authorize('update', $financialResource);

        $request['id'] = $financialResource->id;
        $data = FinancialResourceData::from($request);
        $updated = $this->updateAction->execute($financialResource, $data);

        return response()->json([
            'success' => true,
            'data' => FinancialResourceData::from($updated),
            'message' => 'Risorsa finanziaria aggiornata con successo',
        ]);
    }

    /**
     * Delete financial resource
     */
    public function destroy(FinancialResource $financialResource): JsonResponse
    {
        $this->authorize('delete', $financialResource);

        $this->deleteAction->execute($financialResource);

        return response()->json([
            'success' => true,
            'message' => 'Risorsa finanziaria eliminata con successo',
        ]);
    }
}
