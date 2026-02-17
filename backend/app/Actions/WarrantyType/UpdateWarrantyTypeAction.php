<?php

namespace App\Actions\WarrantyType;

use App\Data\WarrantyTypeData;
use App\Models\WarrantyType;
use Illuminate\Support\Facades\DB;

class UpdateWarrantyTypeAction
{
    /**
     * Update an existing warranty type
     */
    public function execute(WarrantyType $warrantyType, WarrantyTypeData $data): WarrantyType
    {
        return DB::transaction(function () use ($warrantyType, $data) {
            // Convert DTO to array, excluding computed properties
            $warrantyTypeData = $data->except('id')->toArray();

            // Filter Optional fields
            $warrantyTypeData = array_filter($warrantyTypeData, function ($value) {
                return ! ($value instanceof \Spatie\LaravelData\Optional);
            });

            // Update warranty type using Eloquent
            $warrantyType->update($warrantyTypeData);

            return $warrantyType->fresh();
        });
    }
}
