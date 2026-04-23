<?php

namespace App\Actions\FinalBalance;

use App\Data\UpdateFinalBalanceData;
use App\Models\FinalBalance;
use Illuminate\Support\Facades\DB;

class UpdateFinalBalanceAction
{
    public function execute(FinalBalance $finalBalance, UpdateFinalBalanceData $data): FinalBalance
    {
        return DB::transaction(function () use ($finalBalance, $data) {
            $updates = array_filter($data->toArray(), fn ($value) => $value !== null);

            // Remove null values but keep explicit false/0
            $finalBalance->update($updates);

            $finalBalance->recalculate();

            return $finalBalance->fresh(['items', 'project', 'quote', 'customer']);
        });
    }
}
