<?php

namespace App\Listeners;

use App\Events\ProjectAvailabilityCheckCompleted;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Support\Facades\Log;

class NotifyProjectManagerAvailabilityListener implements ShouldQueue
{
    public int $tries = 3;

    public int $timeout = 30;

    public function handle(ProjectAvailabilityCheckCompleted $event): void
    {
        $check = $event->check;

        Log::info('Project availability check completed', [
            'check_id' => $check->id,
            'project_id' => $check->project_id,
            'checked_by' => $check->checked_by_user_id,
            'items_count' => $check->items()->count(),
            'unavailable_count' => $check->items()->where('availability_status', 'unavailable')->count(),
            'partial_count' => $check->items()->where('availability_status', 'partial')->count(),
        ]);

        // TODO: send notification to project manager when notification system is implemented
    }
}
