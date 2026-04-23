<?php

namespace App\Listeners;

use App\Events\FinalBalanceGenerated;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Support\Facades\Log;

class LogProjectActivityListener implements ShouldQueue
{
    public int $tries = 3;

    public int $timeout = 30;

    public function handle(FinalBalanceGenerated $event): void
    {
        Log::info('Final balance generated', [
            'final_balance_id' => $event->finalBalance->id,
            'code' => $event->finalBalance->code,
            'project_id' => $event->finalBalance->project_id,
            'customer_id' => $event->finalBalance->customer_id,
            'total_amount' => $event->finalBalance->total_amount,
        ]);
    }
}
