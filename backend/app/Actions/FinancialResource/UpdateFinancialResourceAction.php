<?php

namespace App\Actions\FinancialResource;

use App\Data\FinancialResourceData;
use App\Models\FinancialResource;
use Illuminate\Support\Facades\DB;

/**
 * Update Financial Resource Action
 *
 * Updates an existing financial resource
 */
class UpdateFinancialResourceAction
{
    public function execute(FinancialResource $financialResource, FinancialResourceData $data): FinancialResource
    {
        return DB::transaction(function () use ($financialResource, $data) {
            $financialResource->update(
                $data->except('id', 'display_name', 'formatted_bank_info', 'formatted_cash_info', 'formatted_card_info')->toArray()
            );

            return $financialResource->fresh();
        });
    }
}
