<?php

namespace App\Events;

use App\Models\ProjectAvailabilityCheckItem;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class AvailabilityItemResolved
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public readonly ProjectAvailabilityCheckItem $item,
    ) {}
}
