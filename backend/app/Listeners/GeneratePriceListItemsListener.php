<?php

namespace App\Listeners;

use App\Events\PriceListGenerated;
use App\Events\PriceListItemsGenerationCompleted;
use App\Jobs\ProcessPriceListItemsJob;
use App\Models\Product;
use Illuminate\Bus\Batch;
use Illuminate\Support\Facades\Bus;
use Illuminate\Support\Facades\Log;

/**
 * Generate Price List Items Listener
 *
 * Dispatches batched jobs to generate price list items asynchronously.
 * Prevents timeout on large datasets by chunking products into batches.
 *
 * ARCHITECTURE:
 * - Event-driven pattern (triggered by PriceListGenerated)
 * - Uses Laravel Batch for progress tracking
 * - Dispatches completion event when all batches finish
 */
class GeneratePriceListItemsListener
{
    /**
     * Chunk size for batch processing (products per job)
     */
    private const CHUNK_SIZE = 500;

    /**
     * Handle the event
     */
    public function handle(PriceListGenerated $event): void
    {
        $priceList = $event->priceList;
        $userId = $event->metadata['user_id'] ?? null;

        // Skip if generate_items is false
        if (! ($event->metadata['generate_items'] ?? false)) {
            return;
        }

        // Count total products to generate items for
        $totalProducts = Product::active()
            ->when($priceList->category_id, fn ($q) => $q->where('category_id', $priceList->category_id))
            ->count();

        // No products to process
        if ($totalProducts === 0) {
            Log::info('No products to generate price list items', [
                'price_list_id' => $priceList->id,
            ]);

            return;
        }

        // Create batch jobs (chunk products to prevent timeout)
        $jobs = [];
        for ($offset = 0; $offset < $totalProducts; $offset += self::CHUNK_SIZE) {
            $jobs[] = new ProcessPriceListItemsJob(
                priceListId: $priceList->id,
                offset: $offset,
                limit: self::CHUNK_SIZE
            );
        }

        // Dispatch batch with callbacks
        Bus::batch($jobs)
            ->name("Generate Price List Items - {$priceList->name}")
            ->allowFailures() // Don't cancel entire batch if one job fails
            ->then(function (Batch $batch) use ($priceList, $totalProducts, $userId) {
                // All jobs completed successfully
                Log::info('Price list items generation completed', [
                    'price_list_id' => $priceList->id,
                    'total_products' => $totalProducts,
                    'batch_id' => $batch->id,
                ]);

                // Dispatch completion event for notifications
                PriceListItemsGenerationCompleted::dispatch($priceList, [
                    'total_products' => $totalProducts,
                    'batch_id' => $batch->id,
                    'user_id' => $userId,
                ]);
            })
            ->catch(function (Batch $batch, \Throwable $e) use ($priceList) {
                // Handle batch failure
                Log::error('Price list items generation failed', [
                    'price_list_id' => $priceList->id,
                    'batch_id' => $batch->id,
                    'error' => $e->getMessage(),
                ]);
            })
            ->finally(function (Batch $batch) use ($priceList) {
                // Always executed (success or failure)
                Log::info('Price list items generation batch finished', [
                    'price_list_id' => $priceList->id,
                    'batch_id' => $batch->id,
                    'total_jobs' => $batch->totalJobs,
                    'processed_jobs' => $batch->processedJobs(),
                    'failed_jobs' => $batch->failedJobs,
                ]);
            })
            ->dispatch();

        Log::info('Price list items generation batch dispatched', [
            'price_list_id' => $priceList->id,
            'total_products' => $totalProducts,
            'total_jobs' => count($jobs),
            'chunk_size' => self::CHUNK_SIZE,
        ]);
    }
}
