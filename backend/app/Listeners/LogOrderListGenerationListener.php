<?php

namespace App\Listeners;

use App\Events\OrderListGenerated;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Support\Facades\Log;

class LogOrderListGenerationListener implements ShouldQueue
{
    public int $tries = 3;

    public int $timeout = 30;

    public function handle(OrderListGenerated $event): void
    {
        Log::info('Order list generated', [
            'project_id' => $event->project->id,
            'project_name' => $event->project->name,
            'available_count' => $event->summary['available_count'] ?? 0,
            'to_purchase_count' => $event->summary['to_purchase_count'] ?? 0,
            'to_subrental_count' => $event->summary['to_subrental_count'] ?? 0,
        ]);
    }
}
