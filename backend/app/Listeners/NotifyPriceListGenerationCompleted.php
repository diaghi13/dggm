<?php

namespace App\Listeners;

use App\Events\PriceListItemsGenerationCompleted;
use App\Models\User;
use App\Notifications\PriceListGenerationCompletedNotification;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Support\Facades\Log;

/**
 * Notify Price List Generation Completed Listener
 *
 * Sends database notification to user when price list items generation finishes.
 *
 * FEATURES:
 * - Database notification for in-app alerts
 * - Includes price list details and action link
 * - Queued for async delivery
 */
class NotifyPriceListGenerationCompleted implements ShouldQueue
{
    use InteractsWithQueue;

    public int $tries = 3;

    public int $timeout = 30;

    /**
     * Handle the event
     */
    public function handle(PriceListItemsGenerationCompleted $event): void
    {
        $priceList = $event->priceList;
        $totalProducts = $event->metadata['total_products'] ?? 0;
        $batchId = $event->metadata['batch_id'] ?? null;
        $userId = $event->metadata['user_id'] ?? null;

        Log::info('Price list generation notification', [
            'price_list_id' => $priceList->id,
            'price_list_name' => $priceList->name,
            'total_products_processed' => $totalProducts,
            'batch_id' => $batchId,
            'user_id' => $userId,
        ]);

        // Send notification to user who created the price list
        if ($userId) {
            $user = User::find($userId);

            if ($user) {
                $user->notify(new PriceListGenerationCompletedNotification(
                    priceList: $priceList,
                    totalProducts: $totalProducts,
                    batchId: $batchId
                ));

                Log::info('Price list generation notification sent', [
                    'user_id' => $user->id,
                    'price_list_id' => $priceList->id,
                ]);
            } else {
                Log::warning('User not found for price list generation notification', [
                    'user_id' => $userId,
                    'price_list_id' => $priceList->id,
                ]);
            }
        } else {
            Log::warning('No user_id provided for price list generation notification', [
                'price_list_id' => $priceList->id,
            ]);
        }
    }
}
