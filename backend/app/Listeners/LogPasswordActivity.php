<?php

namespace App\Listeners;

use App\Events\PasswordChanged;
use App\Events\PasswordReset;
use App\Events\PasswordResetRequested;
use App\Models\Landlord\GlobalUser;
use App\Models\User;
use App\Notifications\PasswordChangedNotification;
use App\Notifications\PasswordResetSuccessful;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Support\Facades\Log;

class LogPasswordActivity implements ShouldQueue
{
    public int $tries = 3;

    public int $timeout = 30;

    public function handle(PasswordResetRequested|PasswordReset|PasswordChanged $event): void
    {
        $logData = match (true) {
            $event instanceof PasswordResetRequested => [
                'event' => 'password_reset_requested',
                'email' => $event->email,
                'ip_address' => $event->metadata['ip_address'] ?? null,
                'user_agent' => $event->metadata['user_agent'] ?? null,
            ],
            $event instanceof PasswordReset => [
                'event' => 'password_reset',
                'user_id' => $event->user->id,
                'email' => $event->user->email,
                'ip_address' => $event->metadata['ip_address'] ?? null,
                'user_agent' => $event->metadata['user_agent'] ?? null,
            ],
            $event instanceof PasswordChanged => [
                'event' => 'password_changed',
                'user_id' => $event->user->id,
                'email' => $event->user->email,
                'ip_address' => $event->metadata['ip_address'] ?? null,
                'user_agent' => $event->metadata['user_agent'] ?? null,
            ],
        };

        Log::info('Password activity', $logData);

        // Send email notifications for security
        match (true) {
            $event instanceof PasswordReset => $this->notifyPasswordReset($event),
            $event instanceof PasswordChanged => $this->notifyPasswordChanged($event),
            default => null,
        };
    }

    /**
     * Send email notification after password reset.
     * Only notifies concrete tenant User instances — GlobalUser handles its
     * own notifications via the landlord password-reset flow.
     */
    private function notifyPasswordReset(PasswordReset $event): void
    {
        if (! ($event->user instanceof User)) {
            return;
        }

        $event->user->notify(new PasswordResetSuccessful(
            ipAddress: $event->metadata['ip_address'] ?? 'Unknown',
            userAgent: $event->metadata['user_agent'] ?? 'Unknown',
            timestamp: now()
        ));
    }

    /**
     * Send email notification after password change.
     * Only notifies concrete tenant User instances — GlobalUser does not
     * go through this flow.
     */
    private function notifyPasswordChanged(PasswordChanged $event): void
    {
        if (! ($event->user instanceof User)) {
            return;
        }

        $event->user->notify(new PasswordChangedNotification(
            ipAddress: $event->metadata['ip_address'] ?? 'Unknown',
            userAgent: $event->metadata['user_agent'] ?? 'Unknown',
            timestamp: now()
        ));
    }
}
