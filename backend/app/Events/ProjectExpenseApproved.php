<?php

namespace App\Events;

use App\Models\ProjectExpense;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class ProjectExpenseApproved
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public readonly ProjectExpense $expense,
        public readonly array $metadata = []
    ) {}
}
