<?php

namespace App\Events;

use App\Domains\Project\Models\ProjectAvailabilityCheck;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class ProjectAvailabilityCheckCompleted
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public readonly ProjectAvailabilityCheck $check,
    ) {}
}
