<?php

namespace App\Actions\FinancialResource;

use App\Data\FinancialResourceData;
use App\Models\FinancialResource;
use Illuminate\Support\Facades\DB;

/**
 * Create Financial Resource Action
 *
 * Creates a new financial resource for the company
 */
class CreateFinancialResourceAction
{
    public function execute(FinancialResourceData $data): FinancialResource
    {
        return DB::transaction(function () use ($data) {
            $financialResource = FinancialResource::create(
                $data->except('id', 'display_name', 'formatted_bank_info', 'formatted_cash_info', 'formatted_card_info')->toArray()
            );

            return $financialResource->fresh();
        });
    }
}
