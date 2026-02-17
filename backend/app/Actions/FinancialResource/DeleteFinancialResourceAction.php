<?php

namespace App\Actions\FinancialResource;

use App\Models\FinancialResource;
use Illuminate\Support\Facades\DB;

/**
 * Delete Financial Resource Action
 *
 * Soft deletes a financial resource
 */
class DeleteFinancialResourceAction
{
    public function execute(FinancialResource $financialResource): bool
    {
        return DB::transaction(function () use ($financialResource) {
            return $financialResource->delete();
        });
    }
}
