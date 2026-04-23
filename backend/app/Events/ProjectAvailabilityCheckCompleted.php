<?php

namespace App\Events;

use App\Models\ProjectAvailabilityCheck;
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
