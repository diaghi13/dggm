<?php

namespace App\Listeners;

class UpdateTenantCreatedStatus
{
    /**
     * Create the event listener.
     */
    public function __construct()
    {
        //
    }

    /**
     * Handle the event.
     */
    public function handle(object $event): void
    {
        $tenant = $event->tenant;

        if ($tenant->created_status !== 'created') {
            $tenant->update(['created_status' => 'created']);
        }
    }
}
