<?php

namespace App\Actions\WarrantyType;

use App\Data\WarrantyTypeData;
use App\Models\WarrantyType;
use Illuminate\Support\Facades\DB;

class CreateWarrantyTypeAction
{
    /**
     * Create a new warranty type
     */
    public function execute(WarrantyTypeData $data): WarrantyType
    {
        return DB::transaction(function () use ($data) {
            // Convert DTO to array, excluding computed properties
            $warrantyTypeData = $data->except('id')->toArray();

            // Filter Optional fields
            $warrantyTypeData = array_filter($warrantyTypeData, function ($value) {
                return ! ($value instanceof \Spatie\LaravelData\Optional);
            });

            // Create warranty type using Eloquent
            $warrantyType = WarrantyType::create($warrantyTypeData);

            return $warrantyType->fresh();
        });
    }
}
