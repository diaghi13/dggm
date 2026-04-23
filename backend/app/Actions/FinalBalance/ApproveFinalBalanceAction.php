<?php

namespace App\Actions\FinalBalance;

use App\Enums\FinalBalanceStatus;
use App\Events\FinalBalanceApproved;
use App\Models\FinalBalance;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class ApproveFinalBalanceAction
{
    public function execute(FinalBalance $finalBalance): FinalBalance
    {
        return DB::transaction(function () use ($finalBalance) {
            if ($finalBalance->status !== FinalBalanceStatus::Finalized) {
                throw ValidationException::withMessages([
                    'status' => ['Only finalized final balances can be approved.'],
                ]);
            }

            $finalBalance->update([
                'status' => FinalBalanceStatus::Approved,
                'approved_by_user_id' => auth()->id(),
                'approved_at' => now(),
            ]);

            FinalBalanceApproved::dispatch($finalBalance);

            return $finalBalance->fresh(['items', 'project', 'customer', 'approvedBy']);
        });
    }
}
