<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Jobs\DispatchServiceBroadcastJob;
use App\Models\Landlord\ServiceBroadcast;
use Illuminate\Console\Command;

class ProcessScheduledBroadcastsCommand extends Command
{
    protected $signature = 'broadcasts:process-scheduled';

    protected $description = 'Dispatches scheduled service broadcasts that are due';

    public function handle(): void
    {
        $broadcasts = ServiceBroadcast::where('status', 'scheduled')
            ->where('scheduled_at', '<=', now())
            ->get();

        foreach ($broadcasts as $broadcast) {
            $broadcast->update(['status' => 'pending']);
            DispatchServiceBroadcastJob::dispatch($broadcast);
            $this->info("Dispatched broadcast #{$broadcast->id}: {$broadcast->title}");
        }

        $this->info("Processed {$broadcasts->count()} scheduled broadcasts.");
    }
}
