<?php

namespace App\Actions\FinalBalance;

use App\Models\FinalBalanceItem;
use Illuminate\Support\Facades\DB;

class DeleteFinalBalanceItemAction
{
    public function execute(FinalBalanceItem $item): void
    {
        DB::transaction(function () use ($item) {
            $finalBalance = $item->finalBalance;

            $item->delete();

            $finalBalance->recalculate();
        });
    }
}
