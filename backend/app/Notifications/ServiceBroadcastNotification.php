<?php

declare(strict_types=1);

namespace App\Notifications;

use App\Models\Landlord\ServiceBroadcast;
use Illuminate\Notifications\Notification;

class ServiceBroadcastNotification extends Notification
{
    public function __construct(private readonly ServiceBroadcast $broadcast) {}

    /**
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['database'];
    }

    /**
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return [
            'title' => $this->broadcast->title,
            'message' => $this->broadcast->message,
            'type' => 'service_broadcast',
            'icon' => match ($this->broadcast->type) {
                'success' => 'check-circle',
                'warning' => 'warning',
                'info' => 'info',
                default => 'megaphone', // announcement
            },
        ];
    }

    public function databaseType(object $notifiable): string
    {
        return 'service-broadcast';
    }
}
