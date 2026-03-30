<?php

namespace App\Listeners;

use App\Actions\Project\CreateProjectWorkerSlotsAction;
use App\Events\QuoteConvertedToProject;

class CreateLaborSlotsFromQuoteListener
{
    public function handle(QuoteConvertedToProject $event): void
    {
        if ($event->quote->items()->where('type', 'labor')->exists()) {
            app(CreateProjectWorkerSlotsAction::class)->execute(
                $event->quote,
                $event->project
            );
        }
    }
}
