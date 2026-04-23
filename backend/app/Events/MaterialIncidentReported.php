<?php

namespace App\Events;

use App\Models\ProjectMaterialIncident;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class MaterialIncidentReported
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public readonly ProjectMaterialIncident $incident
    ) {}
}
