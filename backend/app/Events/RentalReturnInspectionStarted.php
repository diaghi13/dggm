<?php

namespace App\Events;

use App\Domains\Warehouse\Models\RentalReturnInspection;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class RentalReturnInspectionStarted
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public readonly RentalReturnInspection $inspection
    ) {}
}
