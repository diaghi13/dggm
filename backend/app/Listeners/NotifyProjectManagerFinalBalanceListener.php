<?php

namespace App\Listeners;

use App\Events\FinalBalanceApproved;
use App\Events\FinalBalanceFinalized;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Support\Facades\Log;

class NotifyProjectManagerFinalBalanceListener implements ShouldQueue
{
    public int $tries = 3;

    public int $timeout = 30;

    public function handle(FinalBalanceFinalized|FinalBalanceApproved $event): void
    {
        $action = $event instanceof FinalBalanceFinalized ? 'finalized' : 'approved';

        Log::info("Final balance {$action}", [
            'final_balance_id' => $event->finalBalance->id,
            'code' => $event->finalBalance->code,
            'project_id' => $event->finalBalance->project_id,
            'total_amount' => $event->finalBalance->total_amount,
        ]);
    }
}
