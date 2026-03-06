<?php

namespace App\Http\Controllers\Api\V1;

use App\Data\RentalProfileData;
use App\Http\Controllers\Controller;
use App\Jobs\RecalculateRentalPricesJob;
use App\Models\RentalProfile;
use Illuminate\Http\JsonResponse;

class RentalProfileController extends Controller
{
    public function index(): JsonResponse
    {
        $this->authorize('viewAny', RentalProfile::class);

        $profiles = RentalProfile::orderBy('name')->get();

        return response()->json([
            'success' => true,
            'data' => RentalProfileData::collect($profiles),
        ]);
    }

    public function store(RentalProfileData $data): JsonResponse
    {
        $this->authorize('create', RentalProfile::class);

        // If this is set as default, unset all others
        if ($data->is_default) {
            RentalProfile::where('is_default', true)->update(['is_default' => false]);
        }

        $profile = RentalProfile::create($data->except('id', 'created_at', 'updated_at')->toArray());

        return response()->json([
            'success' => true,
            'data' => RentalProfileData::fromModel($profile),
        ], 201);
    }

    public function show(RentalProfile $rentalProfile): JsonResponse
    {
        $this->authorize('view', $rentalProfile);

        return response()->json([
            'success' => true,
            'data' => RentalProfileData::fromModel($rentalProfile),
        ]);
    }

    public function update(RentalProfile $rentalProfile, RentalProfileData $data): JsonResponse
    {
        $this->authorize('update', $rentalProfile);

        // If this is set as default, unset all others
        if ($data->is_default) {
            RentalProfile::where('is_default', true)
                ->where('id', '!=', $rentalProfile->id)
                ->update(['is_default' => false]);
        }

        $rentalProfile->update($data->except('id', 'created_at', 'updated_at')->toArray());

        // Dispatch recalculation for categories using this profile
        RecalculateRentalPricesJob::dispatch($rentalProfile->id);

        return response()->json([
            'success' => true,
            'data' => RentalProfileData::fromModel($rentalProfile->fresh()),
        ]);
    }

    public function destroy(RentalProfile $rentalProfile): JsonResponse
    {
        $this->authorize('delete', $rentalProfile);

        // Prevent deletion if used by categories
        if ($rentalProfile->productCategories()->exists()) {
            return response()->json([
                'success' => false,
                'message' => 'Impossibile eliminare il profilo: è utilizzato da '.$rentalProfile->productCategories()->count().' categorie.',
            ], 422);
        }

        $rentalProfile->delete();

        return response()->json([
            'success' => true,
            'message' => 'Profilo eliminato.',
        ]);
    }

    /**
     * Trigger bulk recalculation of rental prices for all non-manual price list items
     * Optionally filtered by rental_profile_id (recalculates only items linked to categories with this profile)
     */
    public function recalculate(RentalProfile $rentalProfile): JsonResponse
    {
        $this->authorize('update', $rentalProfile);

        RecalculateRentalPricesJob::dispatch($rentalProfile->id);

        return response()->json([
            'success' => true,
            'message' => 'Ricalcolo prezzi avviato in background.',
        ]);
    }
}
