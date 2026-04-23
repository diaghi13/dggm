<?php

namespace App\Actions\FinalBalance;

use App\Enums\FinalBalanceStatus;
use App\Events\FinalBalanceFinalized;
use App\Models\FinalBalance;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class FinalizeFinalBalanceAction
{
    public function execute(FinalBalance $finalBalance): FinalBalance
    {
        return DB::transaction(function () use ($finalBalance) {
            if ($finalBalance->status !== FinalBalanceStatus::Draft) {
                throw ValidationException::withMessages([
                    'status' => ['Only draft final balances can be finalized.'],
                ]);
            }

            $finalBalance->update([
                'status' => FinalBalanceStatus::Finalized,
                'finalized_by_user_id' => auth()->id(),
                'finalized_at' => now(),
            ]);

            FinalBalanceFinalized::dispatch($finalBalance);

            return $finalBalance->fresh(['items', 'project', 'customer', 'finalizedBy']);
        });
    }
}
