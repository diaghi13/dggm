<?php

namespace App\Actions\FinalBalance;

use App\Enums\FinalBalanceStatus;
use App\Models\FinalBalance;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class DeleteFinalBalanceAction
{
    public function execute(FinalBalance $finalBalance): void
    {
        DB::transaction(function () use ($finalBalance) {
            if ($finalBalance->status !== FinalBalanceStatus::Draft) {
                throw ValidationException::withMessages([
                    'status' => ['Only draft final balances can be deleted.'],
                ]);
            }

            $finalBalance->delete();
        });
    }
}
