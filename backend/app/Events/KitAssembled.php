<?php

namespace App\Events;

use App\Models\KitAssembly;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class KitAssembled
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public readonly KitAssembly $assembly,
        public readonly array $metadata = []
    ) {}
}
