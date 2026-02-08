<?php

namespace App\Notifications;

use App\Models\PriceList;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;

/**
 * Price List Generation Completed Notification
 *
 * Sent to users when their price list items generation finishes.
 * Uses database channel for in-app notifications.
 */
class PriceListGenerationCompletedNotification extends Notification implements ShouldQueue
{
    use Queueable;

    /**
     * Create a new notification instance
     *
     * @param  PriceList  $priceList  The generated price list
     * @param  int  $totalProducts  Number of products processed
     * @param  string|null  $batchId  Laravel Batch ID for tracking
     */
    public function __construct(
        public readonly PriceList $priceList,
        public readonly int $totalProducts,
        public readonly ?string $batchId = null
    ) {}

    /**
     * Get the notification's delivery channels
     *
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['database'];
    }

    /**
     * Get the array representation of the notification (for database storage)
     *
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return [
            'title' => 'Generazione Listino Completata',
            'message' => "Il listino \"{$this->priceList->name}\" è stato generato con successo.",
            'type' => 'success',
            'icon' => 'check-circle',
            'data' => [
                'price_list_id' => $this->priceList->id,
                'price_list_name' => $this->priceList->name,
                'price_list_code' => $this->priceList->code,
                'total_products' => $this->totalProducts,
                'batch_id' => $this->batchId,
            ],
            'action' => [
                'label' => 'Visualizza Listino',
                'url' => "/dashboard/price-lists/{$this->priceList->id}",
            ],
        ];
    }

    /**
     * Get the notification's database type
     */
    public function databaseType(object $notifiable): string
    {
        return 'price-list.generation-completed';
    }
}
