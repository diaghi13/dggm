<?php

namespace App\Actions\WarrantyType;

use App\Models\WarrantyType;
use Illuminate\Support\Facades\DB;

class DeleteWarrantyTypeAction
{
    /**
     * Delete a warranty type (soft delete)
     *
     * @throws \Exception
     */
    public function execute(WarrantyType $warrantyType): bool
    {
        return DB::transaction(function () use ($warrantyType) {
            // Check if warranty type is used in any quotes
            if ($warrantyType->quotes()->exists()) {
                throw new \Exception('Cannot delete warranty type that is used in quotes. Remove from quotes first.');
            }

            // Check if this is the default warranty type
            if ($warrantyType->is_default) {
                throw new \Exception('Cannot delete the default warranty type. Set another warranty type as default first.');
            }

            return $warrantyType->delete();
        });
    }
}
