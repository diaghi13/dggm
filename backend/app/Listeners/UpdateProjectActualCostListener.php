<?php

namespace App\Listeners;

use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Support\Facades\Log;

class UpdateProjectActualCostListener implements ShouldQueue
{
    public function handle(object $event): void
    {
        // TODO: refresh project.actual_cost aggregate
        Log::info('Project actual cost update triggered', ['event' => get_class($event)]);
    }
}
