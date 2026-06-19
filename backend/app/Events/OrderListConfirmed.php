<?php

namespace App\Events;

use App\Domains\Project\Models\Project;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class OrderListConfirmed
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    // TODO: Future feature — trigger CreateSupplierOrderListener when order confirmation is implemented
    public function __construct(
        public readonly Project $project,
    ) {}
}
