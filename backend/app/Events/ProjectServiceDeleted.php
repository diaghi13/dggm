<?php

namespace App\Events;

use App\Domains\Project\Models\ProjectService;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class ProjectServiceDeleted
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(public readonly ProjectService $service) {}
}
