<?php

namespace App\Events;

use App\Domains\Project\Models\ProjectLaborCost;
use App\Domains\Project\Models\ProjectLaborLog;
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
