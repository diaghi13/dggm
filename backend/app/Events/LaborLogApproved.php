<?php

namespace App\Events;

use App\Models\ProjectLaborCost;
use App\Models\ProjectLaborLog;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class LaborLogApproved
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public readonly ProjectLaborLog $laborLog,
        public readonly ProjectLaborCost $laborCost,
        public readonly array $metadata = []
    ) {}
}
